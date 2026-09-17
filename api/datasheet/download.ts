import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const code = (url.searchParams.get("code") || "DATA-SHEET").toUpperCase().trim();

    const sampleContent = `# DATA-SHEET TÉCNICO // ${code}\nGerado pelo Sistema Manutamaki Almoxarifado Industrial.\nConsulte a ficha atualizada diretamente no sistema web.`;

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="DATASHEET_${code}.md"`);
    res.end(sampleContent);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ success: false, error: message }));
  }
}
