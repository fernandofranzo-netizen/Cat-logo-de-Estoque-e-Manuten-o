import type { IncomingMessage, ServerResponse } from "http";
import { google } from "googleapis";

const DRIVE_FOLDER_ID = "1ZcLsj9i62LWUSLcoYytf-7QwtbItkIs9";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const apiKey = process.env.DRIVE_API_KEY || process.env.VITE_DRIVE_API_KEY;
  if (!apiKey) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ available: false, images: {} }));
    return;
  }

  try {
    const drive = google.drive({ version: "v3", auth: apiKey });
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
        // Renderização direta via googleusercontent.com
        const directUrl = `https://lh3.googleusercontent.com/d/${f.id}`;
        indexMap[baseName.toUpperCase()] = {
          fileId: f.id,
          imageUrl: directUrl,
          name: f.name,
        };
      }
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ available: true, images: indexMap }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ available: false, error: message, images: {} }));
  }
}
