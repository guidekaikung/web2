import { defineEventHandler, setResponseStatus } from 'h3';
import formidable, { type Files, type File as FormFile } from 'formidable';
import mongoose from 'mongoose'
const { Schema, model, models } = mongoose
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { decodeThai, parseZAAR020 } from '~/server/utils/parse-zaar020';
import type { ParseResult } from '~/server/utils/parse-zaar020';

// helper: แปลงเลขให้เป็นรูปแบบมาตรฐาน + เตรียมทั้งแบบ string และ number ไว้เช็คซ้ำ
function normalizePeaNumbers(arr: string[]) {
  const strings = Array.from(
    new Set(
      (arr || [])
        .map((n) => (n ?? '').toString().replace(/\D/g, '')) // เก็บเฉพาะตัวเลข
        .filter(Boolean)
    )
  );
  const numbers = strings
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
  return { strings, numbers };
}

export default defineEventHandler(async (event) => {
  const req = event.node.req;

  let aborted = false;
  req.on('aborted', () => { aborted = true; });
  req.on('close',   () => { aborted = true; });

  // 1) รับไฟล์จาก multipart/form-data
  const { originalFilename, buffer, sha256 } = await new Promise<{
    originalFilename: string;
    buffer: Buffer;
    sha256: string;
  }>((resolve, reject) => {
    const form = formidable({
      multiples: false,
      allowEmptyFiles: false,
      maxFileSize: 50 * 1024 * 1024,
    });

    form.parse(req, (err, _fields, files: Files) => {
      if (err) return reject(err);
      let f: any = (files.file ?? files.upload ?? files.data) as FormFile | FormFile[] | undefined;
      if (Array.isArray(f)) f = f[0];
      if (!f?.filepath) return reject(new Error('NO_FILE'));

      const buf = fs.readFileSync(f.filepath);
      const hash = createHash('sha256').update(buf).digest('hex');

      resolve({
        originalFilename: f.originalFilename || 'upload.txt',
        buffer: buf,
        sha256: hash,
      });
    });
  });

  if (aborted) {
    setResponseStatus(event, 499, 'Client Closed Request');
    return { ok: false, code: 'ABORTED' };
  }

  // 2) แปลงและพาร์สไฟล์
  const text = decodeThai(buffer);

  let parsedResult: ParseResult;
  try {
    parsedResult = parseZAAR020(text); // อาจ throw: NOT_ZAAR020, DUPLICATE_IN_FILE, ...
  } catch (e: any) {
    if (e?.message === 'NOT_ZAAR020') {
      setResponseStatus(event, 400);
      return { ok: false, code: 'NOT_ZAAR020', message: 'ไฟล์นี้ไม่ใช่โปรแกรม ZAAR020' };
    }
    if (e?.message === 'DUPLICATE_IN_FILE') {
      setResponseStatus(event, 400);
      return {
        ok: false,
        code: 'DUPLICATE_IN_FILE',
        message: 'ไฟล์มีเลขสินทรัพย์ซ้ำในตัวเอง',
        duplicates_in_file: e.preview,
      };
    }
    setResponseStatus(event, 400);
    return { ok: false, code: 'PARSE_ERROR', message: e?.message || 'PARSE_ERROR' };
  }

  const { program, unit_display, pea_numbers } = parsedResult;
  if (!pea_numbers.length) {
    setResponseStatus(event, 400);
    return { ok: false, code: 'NO_PEA_NUMBER', message: 'ไม่พบเลขในคอลัมน์ เลขที่สินทรัพย์เดิม/PEA' };
  }

  // 3) ใช้ MONGOOSE CONNECTION ที่มีอยู่แล้ว
  const dbx = mongoose.connection.db;
  if (!dbx) {
    setResponseStatus(event, 500);
    return { ok: false, code: 'NO_DB', message: 'ยังไม่ได้เชื่อมต่อฐานข้อมูล' };
  }

  const assetsCol = dbx.collection<{ pea_no: any; last_upload_id: any }>('assets');
  const uploadsCol = dbx.collection('uploads');

  // กันอัปไฟล์เดิมซ้ำทั้งก้อน (เช็คจาก sha256 ของไฟล์)
  const dupFile = await uploadsCol.findOne({ 'source.sha256': sha256 });
  if (dupFile) {
    setResponseStatus(event, 409);
    return { ok: false, code: 'DUPLICATE_FILE', message: 'ไฟล์นี้ถูกอัปโหลดไปแล้ว' };
  }

  // normalize เลข PEA → ใช้ strings ในการบันทึกเสมอ แต่ตอนเช็คซ้ำตรวจทั้ง string/number
  const { strings: peaStr, numbers: peaNum } = normalizePeaNumbers(pea_numbers);
  if (!peaStr.length) {
    setResponseStatus(event, 400);
    return { ok: false, code: 'NO_PEA_NUMBER', message: 'ไม่พบเลขในคอลัมน์ เลขที่สินทรัพย์เดิม/PEA' };
  }

  // 4) เช็คซ้ำกับฐานข้อมูล (global) — ครอบคลุมทั้งที่เคยเก็บเป็น string และ number
  const existed = await assetsCol
    .find({
      $or: [
        { pea_no: { $in: peaStr } }, // เคสเก็บเป็น string
        { pea_no: { $in: peaNum } }, // เคสเก็บเป็น number
      ],
    })
    .project<{ pea_no: any }>({ pea_no: 1, _id: 0 })
    .toArray();

  if (existed.length > 0) {
    const preview = existed.map((x) => String(x.pea_no)).slice(0, 10);
    setResponseStatus(event, 409);
    return {
      ok: false,
      code: 'DUPLICATE_ASSET',
      message: `พบเลขสินทรัพย์ซ้ำ ${existed.length} รายการ ให้ดำเนินการใหม่`,
      duplicates_preview: preview,
    };
  }

  // 5) บันทึกผล upload + เพิ่ม assets (บันทึกเป็น string ที่ normalize แล้วเสมอ)
  const uploadDoc = {
    program,
    unit_display,
    asset_pea_numbers: peaStr,
    source: { filename: originalFilename, sha256 },
    parsed_at: new Date(),
    status: 'parsed' as const,
  };

  const insertRes = await uploadsCol.insertOne(uploadDoc);
  const insertedId = insertRes.insertedId;

  const bulk = peaStr.map((n: string) => ({
    insertOne: { document: { pea_no: n, last_upload_id: insertedId } },
  }));

  try {
    await assetsCol.bulkWrite(bulk, { ordered: false });
  } catch {
    setResponseStatus(event, 409);
    return {
      ok: false,
      code: 'DUPLICATE_ASSET_RACE',
      message: 'มีการเพิ่มเลขซ้ำจากกระบวนการอื่นในเวลาเดียวกัน',
    };
  }

  return {
    ok: true,
    program,
    unit_display,
    assets_inserted: peaStr.length,
  };
});
