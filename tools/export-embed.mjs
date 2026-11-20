// Exporta una pieza del simulador a PNG o a GIF animado (para el web part Image de SharePoint).
//
//   node tools/export-embed.mjs png <pieza> [ancho=2408]
//   node tools/export-embed.mjs gif <pieza> [ancho=1204] [segundos=12] [fps=12]
//
// Variables opcionales:
//   CHROME=<ruta a chrome.exe / chrome>     (por defecto busca Chrome en rutas comunes)
//   SIM_URL=<url del simulador>             (por defecto ../simulator/index.html en disco)
//   STYLE=dark|light  ACCENT=cobalt|lime|coral|amber   (por defecto dark + lime)
//
// Cómo funciona el GIF: la pieza lee el tiempo de window.__simTime (ms) en vez de performance.now(), así que
// aquí congelamos el reloj, avanzamos 1/fps por cuadro, tomamos una captura de cada uno y ffmpeg arma el GIF con
// paleta propia. Como el bucle de la pieza es de 12 s y todas sus frecuencias son enteras, el GIF cierra sin
// corte. Si pesa más de 3 MB (tope práctico del web part Image) baja fps, colores o ancho.
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [mode, piece, a3, a4, a5] = process.argv.slice(2);
if (!['png', 'gif'].includes(mode) || !piece) {
  console.error('Uso: node tools/export-embed.mjs png|gif <pieza> [ancho] [segundos] [fps]');
  process.exit(1);
}
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '..', 'out');
fs.mkdirSync(out, { recursive: true });

const chrome = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => fs.existsSync(p));
if (!chrome) { console.error('No encontré Chrome. Define CHROME=<ruta>.'); process.exit(1); }

const base = process.env.SIM_URL || pathToFileURL(path.resolve(here, '..', 'simulator', 'index.html')).href;
const url = `${base}?embed=${piece}&s=${process.env.STYLE || 'dark'}&a=${process.env.ACCENT || 'lime'}`;
const width = +(a3 || (mode === 'png' ? 2408 : 1204));
const seconds = +(a4 || 12);
const fps = +(a5 || 12);
const cssW = mode === 'png' ? Math.round(width / 2) : width; // PNG: se captura a 2x del ancho de la columna

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--hide-scrollbars', '--allow-file-access-from-files', '--force-color-profile=srgb'] });
const page = await browser.newPage();

if (mode === 'gif') {
  // Reloj simulado: window.__simTime lo mueve este script; requestAnimationFrame se reemplaza por una cola manual.
  await page.evaluateOnNewDocument(() => {
    window.__simTime = 0;
    const q = [];
    window.requestAnimationFrame = fn => { q.push(fn); return q.length; };
    window.__step = ms => { window.__simTime += ms; const run = q.splice(0); run.forEach(fn => fn(window.__simTime)); };
  });
}
await page.setViewport({ width: cssW, height: 900, deviceScaleFactor: mode === 'png' ? 2 : 1 });
await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));
const box = await page.evaluate(() => { const r = document.querySelector('#emb').getBoundingClientRect(); return { x: 0, y: 0, width: Math.ceil(r.width), height: Math.ceil(r.height) }; });

if (mode === 'png') {
  const file = path.join(out, `${piece}.png`);
  await page.screenshot({ path: file, clip: box });
  console.log('PNG:', file, `${box.width * 2}x${box.height * 2}`);
  await browser.close();
  process.exit(0);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spsim-gif-'));
const frames = seconds * fps, dt = 1000 / fps;
for (let i = 0; i < frames; i++) {
  await page.evaluate(ms => window.__step(ms), i === 0 ? 0 : dt);
  await page.screenshot({ path: path.join(tmp, `f${String(i).padStart(4, '0')}.png`), clip: box });
}
await browser.close();

// ffmpeg: paleta propia (palettegen/paletteuse). Prueba combinaciones hasta pasar el tope de 3 MB.
const gif = path.join(out, `${piece}.gif`);
const LIMIT = 3 * 1024 * 1024;
const tries = [{ f: fps, c: 128, w: width }, { f: Math.min(fps, 10), c: 96, w: width }, { f: Math.min(fps, 8), c: 64, w: width }, { f: Math.min(fps, 8), c: 64, w: Math.round(width * .75) }];
for (const t of tries) {
  const vf = `fps=${t.f},scale=${t.w}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${t.c}:stats_mode=diff[p];[b][p]paletteuse=dither=none`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(tmp, 'f%04d.png'), '-vf', vf, '-loop', '0', gif]);
  const size = fs.statSync(gif).size;
  console.log(`intento fps=${t.f} colores=${t.c} ancho=${t.w}: ${(size / 1048576).toFixed(2)} MB`);
  if (size <= LIMIT) break;
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log('GIF:', gif);
