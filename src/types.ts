export interface StockItem {
  id: string;
  categoria: string;
  subCategoria: string;
  codigo: string;
  descricao: string;
  descricaoExtra: string;
  materialSubGroup: string;
  materialStructure: string;
  // Computed / simulated warehouse location
  localizacao?: string;
  unidadeMedida?: string;
  unidade?: string;
  rua?: string;
  prateleira?: string;
  gaveta?: string;
  subGaveta?: string;
  localizacaoCompleta?: string;
  tags?: string[];
}

export interface RequisitionItem {
  item: StockItem;
  quantidade: number;
  observacao?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncConfig {
  webAppUrl: string;
  spreadsheetId: string;
  autoSyncIntervalMs: number; // 0 = manual, 30000 = 30s, etc.
  lastSyncTime: Date | null;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DatasheetResult {
  code: string;
  markdown: string;
  sources: GroundingSource[];
  generatedAt: string;
  fromCache?: boolean;
}

