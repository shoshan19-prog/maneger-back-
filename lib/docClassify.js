/**
 * Document Classifier — identifies what KIND of document a sheet is, so the Spec Library
 * never confuses "no spec here" (wrong document type) with "spec missing" (Fresco).
 * Pure / no I/O.
 *
 * document_type: Formula Sheet | Product Specification | QC Sheet | SOP | Test Report | Unknown
 * family:        liquid (has embedded QC block) | cementitious (dry powder, QC external) | unknown
 */
const has = (t, ...ks) => ks.some(k => t.includes(k));

export function classify(text) {
  const t = String(text || '');
  const low = t.toLowerCase();

  // strong document-type markers (seen when we scale into the TDS/MSDS folders)
  if (has(low, 'safety data sheet', 'msds', 'sds ')) return { document_type: 'Test Report', family: 'unknown', note: 'SDS/MSDS' };
  if (has(low, 'technical data sheet', 'tds') || has(t, 'נתונים טכניים')) return { document_type: 'Product Specification', family: 'unknown' };
  if (has(low, 'test report', 'test certificate') || has(t, 'תעודת בדיקה')) return { document_type: 'Test Report', family: 'unknown' };
  if (has(low, 'standard operating', 'sop') || has(t, 'נוהל')) return { document_type: 'SOP', family: 'unknown' };

  // formulation sheets (our current corpus): material+percent table and/or a QC block
  const isFormula = has(t, 'חומר') && (has(t, 'אחוז') || has(t, '%'));
  const hasQcBlock = has(t, 'בדיקות') && (has(t, 'משקל סגולי') || has(t, 'PH') || has(t, 'אחידות'));
  const cementMarkers = has(t, 'cement', 'N.H.L', 'HYDRATED LIME', 'SILICA', 'ALUMINA CEMENT', 'HYDRAULIC LIME');

  // a numbered QC block implies a product/liquid sheet, even if the material table was trimmed
  if (hasQcBlock) return { document_type: 'Formula Sheet', family: 'liquid', has_qc: true };
  if (isFormula) {
    if (cementMarkers) return { document_type: 'Formula Sheet', family: 'cementitious', has_qc: false };
    return { document_type: 'Formula Sheet', family: 'unknown', has_qc: false };
  }
  return { document_type: 'Unknown', family: 'unknown' };
}

export default { classify };
