import express from "express";
import path from "path";
import dotenv from "dotenv";
import { google } from "googleapis";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;
const DRIVE_FOLDER_ID = "1ZcLsj9i62LWUSLcoYytf-7QwtbItkIs9";

// In-memory cache for single code lookups (TTL 10 min)
interface CachedImageResult {
  found: boolean;
  fileId?: string;
  name?: string;
  mimeType?: string;
  imageUrl?: string;
  proxyUrl?: string;
  message?: string;
  timestamp: number;
}
const itemImageCache = new Map<string, CachedImageResult>();

// Folder bulk index cache (TTL 5 min)
let folderIndexCache: Record<string, { fileId: string; imageUrl: string; name: string }> | null = null;
let folderIndexTimestamp = 0;

function getDriveClient() {
  const apiKey = process.env.DRIVE_API_KEY;
  if (!apiKey) {
    return null;
  }
  return google.drive({ version: "v3", auth: apiKey });
}

// Health & Status endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    driveConfigured: Boolean(process.env.DRIVE_API_KEY),
    folderId: DRIVE_FOLDER_ID,
  });
});

// Dynamic Drive Image lookup endpoint using official googleapis drive.files.list
app.get("/api/drive-image", async (req, res) => {
  const code = ((req.query.code as string) || "").trim();
  if (!code) {
    return res.status(400).json({ found: false, error: "Parâmetro 'code' é obrigatório." });
  }

  const drive = getDriveClient();
  if (!drive) {
    return res.status(200).json({
      found: false,
      message: "Variável DRIVE_API_KEY não configurada no ambiente.",
    });
  }

  // Check memory cache
  const cached = itemImageCache.get(code);
  if (cached && Date.now() - cached.timestamp < 600000) {
    return res.json(cached);
  }

  try {
    const sanitizedCode = code.replace(/'/g, "\\'");
    // Search for non-trashed files inside the specific Drive folder whose name contains or begins with the code
    const q = `'${DRIVE_FOLDER_ID}' in parents and trashed = false and name contains '${sanitizedCode}'`;

    const driveRes = await drive.files.list({
      q,
      fields: "files(id, name, mimeType, webContentLink, thumbnailLink)",
      pageSize: 5,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = driveRes.data.files || [];
    if (files.length > 0) {
      // Find the best match starting with or containing the item code
      const file = files[0];
      const fileId = file.id!;
      const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      const proxyUrl = `/api/drive-stream/${fileId}`;

      const result: CachedImageResult = {
        found: true,
        fileId,
        name: file.name || "",
        mimeType: file.mimeType || "image/jpeg",
        imageUrl: directUrl,
        proxyUrl,
        timestamp: Date.now(),
      };

      itemImageCache.set(code, result);
      return res.json(result);
    } else {
      const notFoundResult: CachedImageResult = {
        found: false,
        message: `Nenhum arquivo encontrado no Drive para o código ${code}`,
        timestamp: Date.now(),
      };
      itemImageCache.set(code, notFoundResult);
      return res.json(notFoundResult);
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error(`Erro ao consultar Google Drive para código ${code}:`, errMessage);
    return res.status(500).json({
      found: false,
      error: "Erro na consulta à Google Drive API",
      details: errMessage,
    });
  }
});

// Fallback image streaming proxy if direct googleusercontent requires auth in preview
app.get("/api/drive-stream/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const drive = getDriveClient();
  if (!drive) {
    return res.status(503).json({ error: "DRIVE_API_KEY não configurada" });
  }

  try {
    const fileMetadata = await drive.files.get({
      fileId,
      fields: "mimeType, name",
      supportsAllDrives: true,
    });

    const mimeType = fileMetadata.data.mimeType || "image/jpeg";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

    const mediaRes = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );

    mediaRes.data.pipe(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(404).json({ error: "Falha ao carregar arquivo de imagem do Drive", details: message });
  }
});

// Bulk folder index for instant catalog display without 1000s of round trips
app.get("/api/drive-folder-index", async (_req, res) => {
  const drive = getDriveClient();
  if (!drive) {
    return res.json({ available: false, images: {} });
  }

  if (folderIndexCache && Date.now() - folderIndexTimestamp < 300000) {
    return res.json({ available: true, images: folderIndexCache });
  }

  try {
    const driveRes = await drive.files.list({
      q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: "files(id, name, mimeType)",
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const indexMap: Record<string, { fileId: string; imageUrl: string; name: string }> = {};
    for (const f of driveRes.data.files || []) {
      if (f.id && f.name) {
        const dotIndex = f.name.lastIndexOf(".");
        const baseName = dotIndex !== -1 ? f.name.substring(0, dotIndex).trim() : f.name.trim();
        const directUrl = `https://lh3.googleusercontent.com/d/${f.id}`;
        indexMap[baseName.toUpperCase()] = {
          fileId: f.id,
          imageUrl: directUrl,
          name: f.name,
        };
      }
    }

    folderIndexCache = indexMap;
    folderIndexTimestamp = Date.now();
    return res.json({ available: true, images: indexMap });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.json({ available: false, error: message, images: {} });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Manutamaki Almoxarifado server running on http://0.0.0.0:${PORT}`);
  });
}

start();
