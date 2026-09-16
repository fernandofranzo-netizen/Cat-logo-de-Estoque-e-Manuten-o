import { StockItem } from '../types';
import initialData from '../data/initialCatalog.json';

export const DEFAULT_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxFunUJdxpYKrEeuMQD_uiL1lzfqDdNj3U2kDBs7Ww_0MX0B1uzxbLA1Cc23h-S1LLv/exec';

// Generate consistent physical warehouse location from category & code
export function computeLocation(codigo: string, subCategoria: string): string {
  if (!codigo) return 'Almoxarifado Central • Geral';
  
  // Hash code characters to get stable aisle and shelf
  let hash = 0;
  for (let i = 0; i < codigo.length; i++) {
    hash = (hash << 5) - hash + codigo.charCodeAt(i);
    hash |= 0;
  }
  const aisleLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'M', 'E'];
  const aisle = aisleLetters[Math.abs(hash) % aisleLetters.length];
  const rack = ((Math.abs(hash >> 3) % 8) + 1).toString().padStart(2, '0');
  const bin = ((Math.abs(hash >> 6) % 24) + 1).toString().padStart(2, '0');

  const sub = subCategoria ? subCategoria.trim().toUpperCase() : 'GERAL';
  return `Rua ${aisle} • Prat. ${rack} • Gav. ${bin} (${sub})`;
}

// Check if raw row contains valid item data
export function isValidStockRow(raw: Record<string, unknown>): boolean {
  const cat = String(raw['CATEGORIA'] || raw['categoria'] || raw['Categoria'] || '').trim();
  const cod = String(raw['CÓDIGO'] || raw['codigo'] || raw['Codigo'] || raw['CODIGO'] || '').trim();
  const desc = String(raw['DESCRIÇÃO DO ITEM'] || raw['descricao'] || raw['Descricao'] || '').trim();

  // Exclude empty rows and blank/'OUTROS' category rows that don't belong to the official 2336 items
  if (!cat || cat.toUpperCase() === 'OUTROS') return false;
  if (!cod && !desc) return false;
  return true;
}

// Normalize row data into StockItem
export function parseRawRow(raw: Record<string, unknown>, index: number): StockItem {
  const categoria = String(raw['CATEGORIA'] || raw['categoria'] || raw['Categoria'] || '').trim();
  const subCategoria = String(raw['SUB-CATEGORIA'] || raw['sub-categoria'] || raw['subCategoria'] || raw['Subcategoria'] || '').trim();
  const codigo = String(raw['CÓDIGO'] || raw['codigo'] || raw['Codigo'] || raw['CODIGO'] || `ITEM-${index}`).trim();
  const descricao = String(raw['DESCRIÇÃO DO ITEM'] || raw['descricao'] || raw['Descricao'] || '').trim();
  const descricaoExtra = String(raw['DESCRIÇÃO EXTRA'] || raw['descricaoExtra'] || '').trim();
  const materialSubGroup = String(raw['MATERIAL SUB GROUP'] || raw['materialSubGroup'] || '').trim();
  const materialStructure = String(raw['MATERIAL STRUCTURE / SUB SCTRUCT / CLASSIFICATION'] || raw['materialStructure'] || '').trim();

  // Extract dimensions or specs if available
  let unidadeMedida = 'UN';
  if (descricao.includes('MM') || descricao.includes('M/')) unidadeMedida = 'MM / METROS';
  else if (descricao.includes('ROLO')) unidadeMedida = 'ROLO';
  else if (descricao.includes('CX') || descricao.includes('CAIXA')) unidadeMedida = 'CX';
  else if (descricao.includes('PAR')) unidadeMedida = 'PAR';

  return {
    id: `${codigo}-${index}`,
    categoria,
    subCategoria: subCategoria || 'DIVERSOS',
    codigo,
    descricao,
    descricaoExtra,
    materialSubGroup,
    materialStructure,
    localizacao: computeLocation(codigo, subCategoria),
    unidadeMedida,
  };
}

export function getInitialStockItems(): StockItem[] {
  try {
    const rawList = (initialData as { Planilha1?: Record<string, unknown>[] }).Planilha1 || [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList
        .filter(isValidStockRow)
        .map((row, idx) => parseRawRow(row, idx));
    }
  } catch (err) {
    console.error('Error loading initial local data:', err);
  }
  return [];
}

export async function fetchFromGoogleAppsScript(webAppUrl: string = DEFAULT_WEB_APP_URL): Promise<StockItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(webAppUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Falha HTTP ao sincronizar com Google Sheets: status ${response.status}`);
    }

    const data = await response.json();
    let rows: Record<string, unknown>[] = [];

    if (Array.isArray(data)) {
      rows = data;
    } else if (typeof data === 'object' && data !== null) {
      const firstKey = Object.keys(data)[0];
      if (firstKey && Array.isArray((data as Record<string, unknown>)[firstKey])) {
        rows = (data as Record<string, unknown>)[firstKey] as Record<string, unknown>[];
      }
    }

    if (rows.length === 0) {
      throw new Error('Nenhum registro retornado pela planilha');
    }

    return rows
      .filter(isValidStockRow)
      .map((row, idx) => parseRawRow(row, idx));
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Sheets sync error:', error);
    throw error;
  }
}

export async function fetchFromGoogleSheetsApi(
  spreadsheetId: string,
  accessToken: string,
  range = 'Planilha1!A1:Z5000'
): Promise<StockItem[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro na API do Google Sheets (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const values: string[][] = result.values || [];
  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map((h) => h.trim());
  const rows = values.slice(1);

  const validItems: StockItem[] = [];
  rows.forEach((row, idx) => {
    const rowObj: Record<string, unknown> = {};
    headers.forEach((header, colIdx) => {
      rowObj[header] = row[colIdx] || '';
    });
    if (isValidStockRow(rowObj)) {
      validItems.push(parseRawRow(rowObj, idx));
    }
  });

  return validItems;
}
