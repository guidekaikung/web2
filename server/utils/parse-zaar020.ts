// server/utils/parse-zaar020.ts
import iconv from 'iconv-lite';

export type ParseResult = {
  program: 'ZAAR020';
  unit_display: string;   // เช่น "C053 กฟส.ค่ายบางระจัน"
  pea_numbers: string[];  // เลขจากคอลัมน์ "เลขที่สินทรัพย์เดิม/PEA"
};

export function decodeThai(buf: Buffer): string {
  const utf8 = buf.toString('utf8');
  if (/โปรแกรม|กฟส\.|[ก-๙]/.test(utf8)) return utf8;
  try { return iconv.decode(buf, 'TIS-620'); } catch { return utf8; }
}

export function parseZAAR020(text: string): ParseResult {
  const lines = text.split(/\r?\n/);

  // 1) หาแถวโปรแกรม
  const reProgram = /โปรแกรม\s*[:：]?\s*ZAAR020/i;
  const lineIdx = lines.findIndex(l => reProgram.test(l));
  if (lineIdx < 0) throw new Error('NOT_ZAAR020');

  // 2) ดึง unit_display จากบรรทัดเดียวกัน
  const programLine = lines[lineIdx];
  const mUnit = programLine.match(/(C\d{3}\s+กฟส\.[^\r\n]+)/);
  if (!mUnit) throw new Error('UNIT_NOT_FOUND');
  const unit_display = mUnit[1].trim();

  // 3) หา header ที่มีคอลัมน์ "เลขที่สินทรัพย์เดิม/PEA"
  const headerIdx = lines.findIndex(l => l.includes('|') && l.includes('เลขที่สินทรัพย์เดิม/PEA'));
  if (headerIdx < 0) throw new Error('PEA_HEADER_NOT_FOUND');

  const headers = splitRow(lines[headerIdx]);
  const colIdx = headers.findIndex(h => normalize(h) === 'เลขที่สินทรัพย์เดิม/pea');
  if (colIdx < 0) throw new Error('PEA_COLUMN_NOT_FOUND');

  // 4) เก็บเลขจากคอลัมน์เป้าหมาย
  const pea_numbers: string[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.includes('|')) continue;
    const cells = splitRow(row);
    if (cells.length <= colIdx) continue;
    const cell = cells[colIdx];
    const m = cell.match(/\d{6,12}/);
    if (m) pea_numbers.push(m[0]);
  }

  // 5) กันซ้ำภายในไฟล์
  const seen = new Set<string>(), dup: string[] = [];
  for (const n of pea_numbers) (seen.has(n) ? dup.push(n) : seen.add(n));
  if (dup.length) {
    const e = new Error('DUPLICATE_IN_FILE') as any;
    e.preview = Array.from(new Set(dup)).slice(0, 10);
    throw e;
  }

  return { program: 'ZAAR020', unit_display, pea_numbers };
}

function splitRow(row: string): string[] { return row.split('|').map(s => s.trim()); }
function normalize(s: string): string { return s.replace(/\s+/g, '').toLowerCase(); }
