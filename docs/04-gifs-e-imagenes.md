# 04 · Imágenes y GIFs para SharePoint

Cuando no puedes embeber (sin admin) o la pieza es estática, la maqueta se exporta como **imagen** y se sube a un web part Image. Es la ruta «Imagen» del overlay.

## Instalación (una sola vez)
Requisitos: Node 18+, Chrome o Chromium, y [ffmpeg](https://ffmpeg.org/) en el `PATH` (solo para GIF).

```bash
cd tools
npm install
```

## PNG de una pieza
```bash
node tools/export-embed.mjs png header 2408
```
Genera `out/header.png` a **2×** del ancho pedido: el ancho de columna es 1204, así que sale a 2408 px. Para una columna de 380 px pide 760.

## GIF animado de una pieza
```bash
node tools/export-embed.mjs gif header 1204 12 12   # pieza, ancho, segundos, fps
```
Resultado de referencia: [`assets/header-loop.gif`](../assets/header-loop.gif) (1204×377, 12 s, 96 cuadros, 2.8 MB).

### Cómo funciona
1. Las piezas leen el tiempo de `window.__simTime` (ms) en lugar de `performance.now()`.
2. La herramienta **congela el reloj**: reemplaza `requestAnimationFrame` por una cola manual y avanza `1/fps` por cuadro.
3. Toma una captura recortada a la pieza por cada cuadro.
4. **ffmpeg** arma el GIF con paleta propia (`palettegen` + `paletteuse`, sin dither).
5. El bucle de la pieza dura 12 s y todas sus frecuencias son **enteras**, así que el último cuadro empalma con el primero sin corte (no hace falta fundido cruzado).
6. Si pasa de **3 MB**, la herramienta prueba: menos fps → menos colores → menos ancho, hasta caber.

Sale así en la práctica:

| Intento | fps | Colores | Ancho | Peso |
|---|---|---|---|---|
| 1 | 12 | 128 | 1204 | 4.84 MB |
| 2 | 10 | 96 | 1204 | 3.78 MB |
| 3 | 8 | 64 | 1204 | **2.77 MB** |

> Para que el bucle cierre en tus propias piezas, toda animación periódica debe tener periodo = 12 s (o un divisor entero). Una frecuencia que no sea múltiplo deja un salto al reiniciar.

## Convención de nombres
`<sitio>-<pagina>-s{n}-c{n}-w{n}-<motivo>.<ext>` con índices desde 0.
Ejemplo: `atlas-inicio-s0-c0-w0-header.gif` = sitio `atlas`, página `inicio`, sección 0, columna 0, web part 0.

El simulador genera estos nombres solo y los lista en el `manifiesto.json`. Sirven para que quien arma (persona o agente) sepa **dónde va cada archivo**.

## Reglas de uso en SharePoint
- Web part **Image**: un solo vínculo; el alt describe la imagen **y** repite todo el texto dibujado.
- **GIF** solo en Image dentro de una columna. En fondo de sección no anima.
- **PNG** para miniaturas, banners y cualquier pieza estática; GIF para lo que se mueve.
- Imagen de fondo de sección: evítala (no anima, se aplasta).
- Peso de PNG recomendado: ≤ 300 KB para JPG de 1600 px; los PNG de piezas dibujadas suelen quedar en 200 a 400 KB.
- Texto dibujado en la imagen: mínimo 16 px equivalente en móvil.

## Video en lugar de GIF
Para animaciones largas, un **MP4 sin audio** (H.264, 1280 a 1920 px) en el web part **File and media** pesa mucho menos y se ve mejor:

```bash
ffmpeg -i entrada.webm -c:v libx264 -crf 23 -an -pix_fmt yuv420p salida.mp4
```
Verifica en tu tenant que el web part reproduzca en bucle y silenciado antes de depender de él.

## Piezas por ruta
| Necesidad | Ruta recomendada |
|---|---|
| Animación y permiso de admin disponible | Embed (la pieza viva) |
| Animación sin permisos | GIF en Image |
| Interactividad sin permisos | No hay: deja la imagen estática + vínculo a la versión viva |
| Estática | PNG en Image |
