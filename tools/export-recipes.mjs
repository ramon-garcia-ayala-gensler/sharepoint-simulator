// Genera las recetas de TODAS las páginas del simulador (pagina.json, receta.md, manifiesto.json) y el
// manifiesto de piezas Embed (embeds.json), leyéndolas de la vista #/recipe. Así los ejemplos nunca se desfasan.
//
//   node tools/export-recipes.mjs [carpeta_salida=examples] [base_url_embed]
//
// base_url_embed: la URL pública de simulator/index.html (p. ej. https://usuario.github.io/sharepoint-simulator/simulator/index.html)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] || path.join(here, '..', 'examples'));
const embedBase = process.argv[3] || 'https://TU-USUARIO.github.io/sharepoint-simulator/simulator/index.html';
const chrome = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => fs.existsSync(p));
const base = process.env.SIM_URL || pathToFileURL(path.resolve(here, '..', 'simulator', 'index.html')).href;

const b = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
await p.goto(`${base}#/recipe?ctl=0`, { waitUntil: 'networkidle0' });
const pages = await p.evaluate(() => window.SPSIM.pages);
const pieces = await p.evaluate(() => window.SPSIM.pieces);
for (const key of pages) {
  await p.select('#rcpPage', key);
  for (const [tab, file] of [['json', 'pagina.json'], ['md', 'receta.md'], ['man', 'manifiesto.json']]) {
    await p.click(`[data-rt="${tab}"]`);
    let txt = await p.$eval('#rcpOut', e => e.textContent);
    txt = txt.split(/https:\/\/TU-USUARIO\.github\.io\/sharepoint-simulator\/simulator\/index\.html/g).join(embedBase);
    const dir = path.join(outDir, key);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, file), txt.endsWith('\n') ? txt : txt + '\n');
  }
  console.log('receta:', key);
}
const manifest = {
  descripcion: 'Piezas interactivas o animadas del simulador que se incrustan en SharePoint con el web part Embed (iframe). El alto se fija a mano en el web part: SharePoint no escucha el postMessage de la pieza.',
  base_url: embedBase,
  requisitos: [
    'Un administrador permite el dominio en «HTML Field Security» (Site settings > HTML Field Security).',
    'Web part Embed: pegar url_embed, fijar el alto en píxeles y activar «ancho completo» si la sección es de 1 columna.',
    'Si no se puede embeber, usar el GIF o el PNG de la pieza en un web part Image (GIF ≤ 3 MB).',
  ],
  piezas: Object.entries(pieces).map(([k, v]) => ({ pieza: k, titulo: v.title, descripcion: v.desc, url_embed: `${embedBase}?embed=${k}`, alto_sugerido_px: v.h, gif_fallback: v.gif ? `${k}.gif` : null })),
};
fs.writeFileSync(path.join(outDir, 'embeds.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('embeds.json');
await b.close();
