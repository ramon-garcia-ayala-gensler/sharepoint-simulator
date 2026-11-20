# 05 · Receta y ensamblaje

La **receta** es el puente entre la maqueta y SharePoint: dice, bloque por bloque, qué web part usar, con qué archivo, texto alternativo y vínculo.

## El modelo de página
Todo parte de un modelo de datos, no de HTML. Cada página es:

```
página → secciones → columnas → web parts
```

En el simulador (`simulator/index.html`, buscar `PAGES`):

```js
PAGES.home = { title:'Inicio', slug:'inicio', sections:[
  sec('31', 'none', [                       // layout 2/3 + 1/3, sin fondo
    [ wp('n','Highlighted content', hcHTML, {motivo:'proyectos', cfg:{…}}) ],   // columna 1
    [ wp('n','Events',              eventsHTML, {motivo:'eventos',   cfg:{…}}) ]  // columna 2
  ]),
  sec('1','neutral',[[ embedWp('stages') ]])  // 1 columna, fondo neutral, pieza Embed
]};
```

- `sec(layout, fondo, columnas)`: `layout` ∈ `1 | 2 | 3 | 13 | 31 | full`; `fondo` ∈ `none | neutral | soft | strong`.
- `wp(tipo, webpart, html, meta)`: `tipo` ∈ `n` Nativo, `i` Imagen, `p` Power Apps, `e` Embed. `webpart` es el **nombre real** del web part de SharePoint.

De ese mismo modelo salen **el DOM de la maqueta** y **los tres archivos de la receta**. Cambias el modelo una vez y todo se mantiene alineado.

## Los tres archivos
La vista `#/recipe` del simulador los muestra, copia y descarga. Para generarlos de todas las páginas de una vez:

```bash
node tools/export-recipes.mjs examples "https://<usuario>.github.io/<repo>/simulator/index.html"
```

### `pagina.json`
```json
{
  "pagina": "inicio",
  "titulo": "Inicio",
  "estado": "borrador (no publicar)",
  "tipo_sitio": "Communication Site (full-width solo aquí; …)",
  "banner": "borrar (Delete web part); título solo en Page details",
  "navegacion": "no editar sin orden explícita",
  "secciones": [
    { "layout": "1", "fondo": "none", "columnas": [[
      { "webpart": "Embed", "ruta": "s0.c0.w0", "tipo": "Embed",
        "config": { "url_embed": "https://…?embed=header", "alto_px": {"1204":380,"760":300},
                    "gif_fallback": "atlas-inicio-s0-c0-w0-header.gif" } }
    ]]}
  ]
}
```
`ruta` = `s{sección}.c{columna}.w{web part}`, índices desde 0.

### `receta.md`
El paso a paso legible para una persona o un agente:

```
# Receta: Inicio
Banner: bórralo («Delete web part»). Título de la página (Page details): "Inicio".

## Sección 1 · 1 columna · Fondo: none
1. **Embed** (Embed) · ruta s0.c0.w0
   - Embed: pegar `https://…?embed=header`
   - Alto fijo: 380 px (1204) · 300 px (760) · activar «ancho completo»
   - Alternativa sin Embed: subir `atlas-inicio-s0-c0-w0-header.gif` en un web part Image (≤ 3 MB)
```

### `manifiesto.json`
Cada imagen con el dato que quien arma necesita:
```json
{ "archivo": "atlas-proyectos-s2-c0-w0-caso-torre.png", "ruta": "s2.c0.w0",
  "ancho_px": 760, "alt": "Torre Mirador. Model Lab, oficinas. …", "vinculo": "https://…" }
```

Ejemplos completos y reales en [`examples/`](../examples/).

## Ensamblar en SharePoint

**Una página por corrida, siempre como borrador.**

### A) A mano
1. **Nuevo → Página → En blanco.**
2. Borra el web part Banner; escribe el título en **Page details**.
3. Sección por sección: elige el layout, el fondo, agrega los web parts en el orden de la receta.
4. Sube cada imagen del manifiesto con su **alt** y su **vínculo**.
5. **Guardar como borrador.** No publiques ni toques la navegación hasta que alguien lo pida.

### B) Con una extensión de navegador con IA
Un agente (por ejemplo Claude en Chrome) puede ejecutar la receta en el editor de SharePoint. Protocolo que funcionó:

1. Cargar las herramientas del navegador de una vez y revisar las pestañas abiertas; trabajar en una pestaña nueva.
2. **Una página por corrida.** Empezar en blanco, borrar el Banner, poner el título.
3. Sección a sección: layout → fondo → web parts → configurar → **captura** → comparar con la maqueta → corregir.
4. Imágenes: subir desde la carpeta de exportación y escribir el alt del manifiesto; un solo vínculo por imagen.
5. Guardar borrador. **Nunca publicar ni editar la navegación sin orden explícita.**
6. Si un paso falla 2 o 3 veces, o aparece un diálogo modal del navegador: **detenerse y preguntar.**
7. Registrar las diferencias entre maqueta y sitio real en una bitácora.

### C) Por REST desde la consola
[`tools/sp-builder.js`](../tools/sp-builder.js) arma páginas completas (zonas, columnas, web parts) llamando a la API de SharePoint desde la consola de una pestaña ya autenticada, y guarda con `SavePageAsDraft`, que **no publica**.

```js
// 1) Sirve la carpeta de tools en local (CORS limitado a tu tenant)
//    python tools/serve-cors.py https://TU-TENANT.sharepoint.com
// 2) En la consola de una pestaña de SharePoint de tu sitio:
window.SPB_CONFIG = { site:'/sites/MI-SITIO', assets:'Assets',
  templates:{ learning:'PlantillaHome', powerApp:'PlantillaPowerApps', embed:'PlantillaEmbed', v2:'PlantillaWebParts' } };
eval(await fetch('http://localhost:8766/sp-builder.js').then(r => r.text()));
await SPB.init();                       // lee los web parts de tus páginas de plantilla
SPB.begin(); const P = SPB.pos;         // P(zona, columna, factor, fondo, control)
const c = [
  SPB.embed('https://<usuario>.github.io/<repo>/simulator/index.html?embed=header', 380, P(1,1,12,0,1)),
  SPB.text('<h2>Hola</h2><p>Texto.</p>', P(2,1,12,0,1)),
];
const id = await SPB.createOrGetPage('MiPagina', 'MiPagina');
await SPB.save(id, 'MiPagina', c);      // borrador
```

> **Aviso honesto:** `sp-builder.js` salió de un tenant real y se generalizó para este repo; está **sin probar en la forma generalizada**. Necesita páginas de plantilla en tu sitio de las que copia la estructura de cada web part (la API de páginas modernas no documenta bien el JSON de cada uno). Trátalo como punto de partida.

Factor de columna: `12` = 1 col; `8+4` = 2/3 + 1/3; `4+8` = 1/3 + 2/3; `6+6` = 2 col; `4+4+4` = 3 col. Fondo: 0 ninguno, 1 neutral, 2 soft, 3 strong; **todos los web parts de una zona llevan el mismo**.

## Power Apps (solo para interacción)
- Los datos viven en **Microsoft Lists** (Projects, Ideas, Tools…). La app lee y escribe ahí; SharePoint muestra los mismos datos con Highlighted content o List.
- La app **no hereda el tema** del sitio: aplica los tokens a mano (`ColorValue("#…")`) y revisa qué fuentes están disponibles.
- Se embebe con el web part **Power Apps** (ID o enlace de la app) con alto fijo.
- Valida antes: licencias de las personas usuarias, políticas DLP del tenant, rendimiento.
- Sin licencias: Microsoft Forms, o vistas de Lists (Board/Gallery) como alternativa.

En el simulador, `finderHTML` (buscador de proyectos) y `ideaHTML` (formulario «Submit an idea») muestran **cómo se vería y qué pantallas pide cada app**, sin enviar nada.

## QA de una página armada
- [ ] Captura del sitio real vs la maqueta, sección por sección.
- [ ] Contraste de vínculos ≥ 4.5:1.
- [ ] Toda imagen con alt; todo texto dibujado repetido en el alt.
- [ ] Nada parece botón sin ser vínculo.
- [ ] A 390 px (móvil) todo colapsa a 1 columna y se lee.
- [ ] Las piezas Embed no se cortan ni dejan franja.
- [ ] La página sigue como borrador.
