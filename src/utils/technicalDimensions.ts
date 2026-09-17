export interface TechnicalDimensionRow {
  parameter: string;
  nominalValue: string;
  tolerance: string;
  engineeringNote: string;
}

export interface ParsedDimensions {
  summary: string;
  standard: string;
  rows: TechnicalDimensionRow[];
}

export function parseItemTechnicalDimensions(
  itemDesc: string,
  categoria = '',
  subCategoria = ''
): ParsedDimensions {
  const desc = (itemDesc || '').toUpperCase().trim();
  const cat = (categoria || '').toUpperCase().trim();
  const sub = (subCategoria || '').toUpperCase().trim();

  const isAnel = desc.includes('ANEL') || sub.includes('ANEI') || sub.includes('ANÉI');
  const isRolamento = desc.includes('ROLAMENTO') || desc.includes('MANCAL') || sub.includes('ROLAMENTO');
  const isDisco = desc.includes('DISCO') || desc.includes('TELA') || sub.includes('DISCO');
  const isParafuso = desc.includes('PARAFUSO') || desc.includes('PORCA') || desc.includes('ARRUELA');
  const isFita = desc.includes('FITA');

  // Case 1: Anel Elástico / Retenção (EI = Furo / DIN 472; EE = Eixo / DIN 471)
  if (isAnel && (desc.includes('EI') || desc.includes('EE') || desc.includes('ELAS') || desc.includes('RETENCAO') || desc.includes('RETENÇÃO'))) {
    const isInterno = desc.includes('EI') || desc.includes('INTERNO') || desc.includes('FURO');
    const standard = isInterno ? 'DIN 472 (Anel Elástico para Furo)' : 'DIN 471 (Anel Elástico para Eixo)';

    // Try to match "35,00 1,50 MM" or "35.00 X 1.50 MM" or "35 X 1,5"
    const matchTwo = desc.match(/(\d+[.,]?\d*)\s*(?:X|\s)\s*(\d+[.,]?\d*)\s*MM?/);
    if (matchTwo) {
      const d1Raw = parseFloat(matchTwo[1].replace(',', '.'));
      const sRaw = parseFloat(matchTwo[2].replace(',', '.'));

      const d1 = d1Raw.toFixed(2).replace('.', ',') + ' mm';
      const s = sRaw.toFixed(2).replace('.', ',') + ' mm';

      // Estimated groove dimensions per DIN standards
      const d2Val = isInterno ? (d1Raw + (d1Raw <= 50 ? 2.0 : 3.0)) : Math.max(1, d1Raw - (d1Raw <= 50 ? 2.0 : 3.0));
      const mVal = sRaw + 0.10;

      const d2 = d2Val.toFixed(2).replace('.', ',') + ' mm';
      const m = mVal.toFixed(2).replace('.', ',') + ' mm';

      const rows: TechnicalDimensionRow[] = [
        {
          parameter: isInterno ? 'Diâmetro Nominal do Furo (d1)' : 'Diâmetro Nominal do Eixo (d1)',
          nominalValue: d1,
          tolerance: isInterno ? 'H11 (+0,16 / -0,00 mm)' : 'h11 (+0,00 / -0,16 mm)',
          engineeringNote: isInterno ? 'Alojamento / furo receptor' : 'Eixo de acoplamento',
        },
        {
          parameter: 'Espessura Nominal do Anel (s)',
          nominalValue: s,
          tolerance: '-0,06 / +0,00 mm (Classe s)',
          engineeringNote: 'Espessura calibrada do anel de retenção',
        },
        {
          parameter: 'Diâmetro da Ranhura / Canal (d2)',
          nominalValue: d2,
          tolerance: isInterno ? 'H11 (Norma DIN)' : 'h11 (Norma DIN)',
          engineeringNote: 'Usinagem do canal para assentamento elástico',
        },
        {
          parameter: 'Largura da Ranhura de Montagem (m)',
          nominalValue: m,
          tolerance: 'H13 (+0,14 / -0,00 mm)',
          engineeringNote: 'Garante a folga axial para livre expansão/contração',
        },
      ];

      return {
        summary: `Ø ${d1} × ${s} (${standard})`,
        standard,
        rows,
      };
    }
  }

  // Case 2: Three dimensions (e.g. Anel de Corte "105 X 90 X 2MM" or "90,00MM 105,00MM 2,00MM" or Rolamento "25 X 52 X 15 MM")
  const threeMatch = desc.match(/(\d+[.,]?\d*)\s*(?:MM)?\s*X\s*(\d+[.,]?\d*)\s*(?:MM)?\s*X\s*(\d+[.,]?\d*)\s*MM?/);
  const threeSpacedMatch = desc.match(/(\d+[.,]?\d*)\s*MM\s+(\d+[.,]?\d*)\s*MM\s+(\d+[.,]?\d*)\s*MM/);

  const matchedThree = threeMatch || threeSpacedMatch;
  if (matchedThree) {
    const v1 = parseFloat(matchedThree[1].replace(',', '.'));
    const v2 = parseFloat(matchedThree[2].replace(',', '.'));
    const v3 = parseFloat(matchedThree[3].replace(',', '.'));

    // Usually external diameter, internal diameter, thickness
    const ext = Math.max(v1, v2);
    const int_ = Math.min(v1, v2);
    const thk = v3;

    const standard = isRolamento ? 'ISO 15 / DIN 625 (Rolamento)' : 'ABNT / DIN Industrial (Corte e Ajuste)';

    const rows: TechnicalDimensionRow[] = [
      {
        parameter: isRolamento ? 'Diâmetro do Furo / Eixo (d)' : 'Diâmetro Interno (DI / d)',
        nominalValue: `${int_.toFixed(2).replace('.', ',')} mm`,
        tolerance: isRolamento ? 'h6 / js6 (Ajuste Fino)' : '±0,10 mm (Usinado)',
        engineeringNote: isRolamento ? 'Eixo rotativo' : 'Passagem / acoplamento interno',
      },
      {
        parameter: isRolamento ? 'Diâmetro Externo (D)' : 'Diâmetro Externo (DE / D)',
        nominalValue: `${ext.toFixed(2).replace('.', ',')} mm`,
        tolerance: isRolamento ? 'h7 (Precisão)' : '±0,15 mm (Retificado)',
        engineeringNote: isRolamento ? 'Alojamento da caixa' : 'Borda perimétrica externa',
      },
      {
        parameter: isRolamento ? 'Largura do Rolamento (B)' : 'Espessura / Altura (h)',
        nominalValue: `${thk.toFixed(2).replace('.', ',')} mm`,
        tolerance: '±0,05 mm',
        engineeringNote: 'Dimensão axial calibrada',
      },
    ];

    return {
      summary: `DE ${ext.toFixed(2).replace('.', ',')} mm × DI ${int_.toFixed(2).replace('.', ',')} mm × Esp. ${thk.toFixed(2).replace('.', ',')} mm`,
      standard,
      rows,
    };
  }

  // Case 3: Discos e Telas (e.g. "D-60MM M-150" or "120MM 20 MESH")
  if (isDisco) {
    const diamMatch = desc.match(/(?:D-|Ø\s*)?(\d+[.,]?\d*)\s*MM/);
    const meshMatch = desc.match(/(?:M-|MESH\s*)(\d+)/i) || desc.match(/\b(\d+)\s*MESH/i);

    const diamVal = diamMatch ? `${diamMatch[1]} mm` : 'Conforme Amostra';
    const meshVal = meshMatch ? `Mesh ${meshMatch[1]}` : (desc.includes('40') ? 'Mesh 40' : (desc.includes('20') ? 'Mesh 20' : 'Padronizado'));

    const rows: TechnicalDimensionRow[] = [
      {
        parameter: 'Diâmetro Externo do Disco (D)',
        nominalValue: diamVal,
        tolerance: '±0,50 mm',
        engineeringNote: 'Corte circular para encaixe no bocal/filtro',
      },
      {
        parameter: 'Abertura da Malha Filtrante',
        nominalValue: meshVal,
        tolerance: 'Conforme ASTM E11',
        engineeringNote: 'Retenção granulométrica de partículas',
      },
      {
        parameter: 'Espessura do Tecido Metálico',
        nominalValue: 'Aprox. 0,40 a 0,80 mm',
        tolerance: 'Tolerância padrão de tecelagem',
        engineeringNote: 'Aço inoxidável AISI 304L resistente à corrosão',
      },
    ];

    return {
      summary: `Ø ${diamVal} • ${meshVal}`,
      standard: 'ABNT NBR / ASTM E11 (Telas Metálicas)',
      rows,
    };
  }

  // Case 4: Parafusos / Elementos de Fixação (e.g. "M8 X 40 MM" or "M10 X 50")
  if (isParafuso || desc.includes('PARAFUSO') || desc.includes('M8') || desc.includes('M6') || desc.includes('M10') || desc.includes('M12')) {
    const threadMatch = desc.match(/\b(M\d+(?:[.,]\d+)?)\s*(?:X\s*(\d+[.,]?\d*)\s*MM?)?/);
    if (threadMatch) {
      const thread = threadMatch[1].replace(',', '.');
      const length = threadMatch[2] ? `${threadMatch[2]} mm` : 'Conforme Aplicação';

      const threadNum = parseFloat(thread.replace('M', ''));
      const pitchEst = threadNum <= 6 ? '1,00 mm (MA)' : threadNum <= 8 ? '1,25 mm (MA)' : threadNum <= 10 ? '1,50 mm (MA)' : '1,75 mm (MA)';

      const rows: TechnicalDimensionRow[] = [
        {
          parameter: 'Rosca Nominal Métrica (d)',
          nominalValue: thread,
          tolerance: 'Classe 6g (DIN 13)',
          engineeringNote: 'Perfil de rosca métrica grossa normalizada',
        },
        {
          parameter: 'Comprimento Útil da Haste (L)',
          nominalValue: length,
          tolerance: '±0,50 mm',
          engineeringNote: 'Comprimento sob a cabeça do fixador',
        },
        {
          parameter: 'Passo da Rosca (P)',
          nominalValue: pitchEst,
          tolerance: 'ISO 261 / DIN 13',
          engineeringNote: 'Avanço por volta completa',
        },
      ];

      return {
        summary: `${thread} × ${length}`,
        standard: 'DIN 933 / ISO 4017 (Fixadores)',
        rows,
      };
    }
  }

  // Case 5: Fitas Industriais / Rolos
  if (isFita) {
    const fitaMatch = desc.match(/(\d+)\s*MM\s*X\s*(\d+)\s*M/);
    if (fitaMatch) {
      const width = `${fitaMatch[1]} mm`;
      const length = `${fitaMatch[2]} m`;

      const rows: TechnicalDimensionRow[] = [
        {
          parameter: 'Largura do Filme / Fita (W)',
          nominalValue: width,
          tolerance: '±0,50 mm',
          engineeringNote: 'Largura da fita adesiva de embalagem/fechamento',
        },
        {
          parameter: 'Comprimento Total do Rolo (L)',
          nominalValue: length,
          tolerance: '±0,5 %',
          engineeringNote: 'Rendimento linear homologado',
        },
        {
          parameter: 'Espessura do Filme com Adesivo',
          nominalValue: '40 a 45 micras (0,045 mm)',
          tolerance: '±2 micras',
          engineeringNote: 'Filme de BOPP com adesivo acrílico a base d’água',
        },
      ];

      return {
        summary: `${width} × ${length}`,
        standard: 'ABNT NBR 14757 / ASTM D3330',
        rows,
      };
    }
  }

  // Case 6: Generic two dimensions (e.g. "50 X 30 MM" or "20MM X 50MM")
  const twoMatch = desc.match(/(\d+[.,]?\d*)\s*(?:MM)?\s*X\s*(\d+[.,]?\d*)\s*MM?/);
  if (twoMatch) {
    const v1 = twoMatch[1].replace('.', ',');
    const v2 = twoMatch[2].replace('.', ',');

    const rows: TechnicalDimensionRow[] = [
      {
        parameter: 'Dimensão Principal (Comprimento / Diâmetro)',
        nominalValue: `${v1} mm`,
        tolerance: '±0,20 mm',
        engineeringNote: 'Medida nominal padronizada',
      },
      {
        parameter: 'Dimensão Secundária (Largura / Espessura)',
        nominalValue: `${v2} mm`,
        tolerance: '±0,15 mm',
        engineeringNote: 'Cota de ajuste e assentamento',
      },
    ];

    return {
      summary: `${v1} mm × ${v2} mm`,
      standard: 'ISO 2768-m (Tolerâncias Gerais)',
      rows,
    };
  }

  // Default fallback for single dimension or standard sample
  const singleMatch = desc.match(/(?:D-|M-|Ø\s*)?(\d+[.,]?\d*)\s*MM/);
  const singleVal = singleMatch ? `${singleMatch[1].replace('.', ',')} mm` : 'Conforme Amostra Homologada';

  return {
    summary: singleVal,
    standard: 'Norma Técnica de Fabricação Manutamaki',
    rows: [
      {
        parameter: 'Cota Nominal Característica',
        nominalValue: singleVal,
        tolerance: 'Classe IT9 / DIN ISO 2768-m',
        engineeringNote: 'Geometria dimensional controlada no recebimento',
      },
      {
        parameter: 'Acabamento e Tolerância Geométrica',
        nominalValue: 'Ra 1,6 µm a 3,2 µm',
        tolerance: 'Dentro dos limites da classe dimensional',
        engineeringNote: 'Superfície usinada/estável livre de rebarbas',
      },
    ],
  };
}
