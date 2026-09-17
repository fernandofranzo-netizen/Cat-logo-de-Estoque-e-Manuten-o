import type { IncomingMessage, ServerResponse } from "http";
import { google } from "googleapis";

const DRIVE_FOLDER_ID = "1ZcLsj9i62LWUSLcoYytf-7QwtbItkIs9";

export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse & { status: (c: number) => any; json: (d: any) => void }) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const code = (url.searchParams.get("code") || "").trim();

  if (!code) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ found: false, error: "Parâmetro 'code' é obrigatório." }));
    return;
  }

  const apiKey = process.env.DRIVE_API_KEY || process.env.VITE_DRIVE_API_KEY;
  if (!apiKey) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ found: false, message: "Variável DRIVE_API_KEY não configurada no ambiente." }));
    return;
  }

  try {
    const drive = google.drive({ version: "v3", auth: apiKey });
    const sanitizedCode = code.replace(/'/g, "\\'");
    const q = `'${DRIVE_FOLDER_ID}' in parents and trashed = false and name contains '${sanitizedCode}'`;

    const driveRes = await drive.files.list({
      q,
      fields: "files(id, name, mimeType)",
      pageSize: 5,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = driveRes.data.files || [];
    if (files.length > 0) {
      const file = files[0];
      const fileId = file.id!;
      // Renderização direta via googleusercontent.com (evita bloqueio do /uc?export=view)
      const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          found: true,
          fileId,
          name: file.name || "",
          mimeType: file.mimeType || "image/jpeg",
          imageUrl: directUrl,
        })
      );
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ found: false, message: `Nenhum arquivo encontrado para ${code}` }));
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ found: false, error: "Erro na consulta à Google Drive API", details: errMessage }));
  }
}
