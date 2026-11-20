# SharePoint Simulator

**Diseña tu sitio de SharePoint en una maqueta HTML, pruébalo como lo vería SharePoint y llévalo al sitio real con recetas, imágenes, GIFs y piezas interactivas embebidas.**

Este repo enseña la metodología completa y trae un simulador funcional como ejemplo trabajado. El sitio de ejemplo (**Atlas Design Hub**) es 100 % ficticio.

| | |
|---|---|
| **Guía y demo en vivo** | https://ramon-garcia-ayala-gensler.github.io/sharepoint-simulator/ |
| **Simulador** | https://ramon-garcia-ayala-gensler.github.io/sharepoint-simulator/simulator/ |
| **Embed lab** (prueba el web part Embed) | https://ramon-garcia-ayala-gensler.github.io/sharepoint-simulator/simulator/#/embed-lab |

## La idea en un párrafo
SharePoint fija la tipografía, los botones y los colores, y no deja correr CSS ni JS propios en páginas modernas. Entonces tu diseño de marca vive en **una maqueta HTML** que respeta los límites reales (lienzo de 1204 px, layouts, fondos, web parts). De la maqueta salen **recetas** que se arman en SharePoint con web parts nativos, **imágenes** pre-renderizadas, **GIFs**, **Power Apps** o **piezas interactivas embebidas** (un `<iframe>` a GitHub Pages con el web part Embed).

```
 Diseño ──► Maqueta HTML ──► Receta (JSON + MD) ──► SharePoint (borrador)
              │   ▲                │
              │   └── overlay      ├─► Nativo      Text, Quick links, People…
              │      «Ver web      ├─► Imagen/GIF  tools/export-embed.mjs
              │       parts»       ├─► Power Apps  formularios y filtros
              ▼                    └─► Embed       ?embed=<pieza> (iframe)
        ?embed=<pieza>
```

## Qué trae
- **`simulator/index.html`**: la maqueta (un solo archivo). Chrome de SharePoint, 3 páginas, 2 estilos × 4 acentos, reflujo real (1204 / 760 / 390), overlay **Ver web parts**, **Embed lab**, vista de **Receta** y 4 piezas embebibles (`header`, `stages`, `impact`, `graph`).
- **`docs/`**: la metodología paso a paso (ver abajo).
- **`examples/`**: recetas reales generadas por el simulador (`pagina.json`, `receta.md`, `manifiesto.json`) y el manifiesto de piezas `embeds.json`.
- **`tools/`**: exportar PNG y GIF de una pieza (`export-embed.mjs`), generar recetas (`export-recipes.mjs`), puente local con CORS (`serve-cors.py`) y armado por REST (`sp-builder.js`).
- **`assets/`**: un GIF de 12 s de la pieza `header` (2.8 MB, 96 cuadros) como ejemplo de salida.

## Documentación
1. [Metodología](docs/01-metodologia.md): fases, ritmo, cómo elegir la ruta de cada bloque.
2. [Qué permite SharePoint y qué no](docs/02-capacidades-y-limites.md): lienzo, layouts, fondos, web parts, lecciones.
3. [**Embed paso a paso**](docs/03-embed-paso-a-paso.md): cómo traer HTML a SharePoint, `?embed=`, el alto, el permiso del dominio.
4. [Imágenes y GIFs](docs/04-gifs-e-imagenes.md): tamaños, nombres, pipeline de GIF ≤ 3 MB.
5. [Receta y ensamblaje](docs/05-receta-y-ensamblaje.md): el modelo de página, a mano, con IA o por REST, Power Apps.
6. [Personalizar y extender](docs/06-personalizar-y-extender.md): cambiar estilo, agregar páginas, web parts y piezas.
7. [Publicar y privacidad](docs/07-publicar-y-privacidad.md): GitHub Pages y qué no debe ser público.

## Empieza en 5 minutos
```bash
git clone https://github.com/ramon-garcia-ayala-gensler/sharepoint-simulator.git
cd sharepoint-simulator
python -m http.server 8000        # o abre simulator/index.html con doble clic
# http://localhost:8000/simulator/
```
1. Prueba `#/home?wp=1` para ver cada bloque etiquetado como Nativo, Imagen, Power Apps o Embed.
2. Cambia el ancho a 760 y 390 en el panel para ver el reflujo.
3. Abre **Embed lab**, elige `impact` y juega con el alto fijo.
4. Abre **Receta** y mira cómo la misma página se vuelve instrucciones de armado.
5. `grep -n "@personalizar" simulator/index.html` te lleva a todo lo editable.

```bash
cd tools && npm install
node export-embed.mjs gif header          # GIF del header → out/header.gif
node export-recipes.mjs ../examples       # recetas de todas las páginas
```

## Estado y honestidad
| Parte | Estado |
|---|---|
| Simulador, overlay, modo `?embed=`, Embed lab | Probado en Chrome (capturas a 1204, 760 y 390 px) |
| `export-embed.mjs` (PNG y GIF) | Probado: genera un GIF de 12 s en bucle de 2.8 MB |
| `export-recipes.mjs` | Probado: regenera `examples/` |
| Web part Embed dentro de SharePoint | El **bloqueo** por dominio no permitido se comprobó en un tenant real y el dominio se agregó a HTML Field Security; la inserción final de estas piezas **no se había probado en vivo** al escribir esto |
| `sp-builder.js` | Generalizado de un uso real, **sin probar en su forma generalizada**; ver el aviso en [docs/05](docs/05-receta-y-ensamblaje.md) |
| Power Apps | El simulador solo **muestra** cómo se vería y qué pide cada app |

Los puntos marcados **[verificar]** en la documentación dependen de tu tenant (opciones exactas del web part Embed, toolbox de ancho completo): pruébalos en una página de borrador antes de diseñar sobre ellos.

## Privacidad
Todo el contenido es inventado. No hay datos, dominios ni IDs de ningún tenant. Tu maqueta real, con tu contenido real, va en un repo **privado**. Ver [docs/07](docs/07-publicar-y-privacidad.md).

## Licencia
[MIT](LICENSE)
