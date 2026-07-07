#!/usr/bin/env node
/**
 * build.js — Convierte el Excel/CSV del directorio en un JSON listo para el front.
 *
 * - Busca el primer archivo en /data (.xlsx, .xls o .csv).
 * - Lee la primera hoja y normaliza los encabezados a claves sin acentos.
 *   (SEDE -> sede, EXTENSIÓN -> extension, etc.)
 * - Es AGNÓSTICO A COLUMNAS: cualquier columna que agregues al Excel
 *   aparece automáticamente en el JSON, sin tocar este script.
 * - Genera /docs/colaboradores.json (que publica GitHub Pages).
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_FILE = path.join(ROOT, 'docs', 'colaboradores.json');

/** Normaliza un encabezado a una clave: minúsculas, sin acentos, con guion_bajo. */
function toKey(header) {
  return String(header)
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function pickInputFile() {
  if (!fs.existsSync(DATA_DIR)) throw new Error('No existe la carpeta /data');
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => /\.(xlsx|xls|csv)$/i.test(f));
  if (files.length === 0) throw new Error('No hay archivos .xlsx/.xls/.csv en /data');
  // Prioriza Excel sobre CSV si hay ambos.
  files.sort((a, b) => /\.csv$/i.test(a) - /\.csv$/i.test(b));
  return path.join(DATA_DIR, files[0]);
}

function main() {
  const input = pickInputFile();
  console.log('Leyendo:', path.basename(input));

  // CSV: leerlo como texto UTF-8 (evita mojibake tipo "DIRECCIÃN").
  // XLSX/XLS: leer el binario, que ya trae Unicode nativo.
  const wb = /\.csv$/i.test(input)
    ? XLSX.read(fs.readFileSync(input, 'utf8'), { type: 'string', raw: false })
    : XLSX.readFile(input, { raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];

  // header:1 -> matriz de filas para localizar la fila de encabezados.
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  if (matrix.length === 0) throw new Error('La hoja está vacía');

  // Busca la fila de encabezados (la que contiene "NOMBRES" o "SEDE").
  let headerRow = 0;
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const row = matrix[i].map(c => toKey(c));
    if (row.includes('nombres') || row.includes('sede') || row.includes('correo')) {
      headerRow = i;
      break;
    }
  }

  const headers = matrix[headerRow].map(toKey);
  const dataRows = matrix.slice(headerRow + 1);

  const colaboradores = dataRows
    .map(row => {
      const obj = {};
      headers.forEach((key, i) => {
        if (!key) return;
        obj[key] = String(row[i] ?? '').trim();
      });
      return obj;
    })
    // Descarta filas sin nombre ni apellido (vacías o separadores).
    .filter(o => (o.nombres || o.apellidos || o.correo));

  const salida = {
    titulo: 'Directorio telefónico de colaboradores',
    subtitulo: 'Áreas de servicio a la comunidad y usuarios externos',
    generado: new Date().toISOString(),
    total: colaboradores.length,
    columnas: headers.filter(Boolean),
    colaboradores,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(salida, null, 2), 'utf8');
  console.log(`OK -> ${path.relative(ROOT, OUT_FILE)} (${colaboradores.length} colaboradores)`);
}

main();
