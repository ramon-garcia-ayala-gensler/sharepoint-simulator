# 06 · Personalizar y extender el simulador

El simulador es **un solo archivo** (`simulator/index.html`, CSS y JS inline; solo la tipografía viene de Google Fonts, con fallback). Todo lo que está pensado para cambiarse está marcado:

```bash
grep -n "@personalizar" simulator/index.html
```

## Mapa de bloques

| Bloque | Dónde buscar | Qué controla |
|---|---|---|
| Tokens | `@personalizar: tokens` | Colores, fuentes, radios. Primitivos → semánticos |
| Layouts | `@personalizar: layouts` | Columnas, reflujo, fondos de sección |
| Overlay | `@personalizar: overlay` | Colores y etiquetas de «Ver web parts» |
| Logo y navegación | `@personalizar: logo`, `NAV` | Marca del sitio y enlaces |
| Datos | `@personalizar: datos semilla` | Squads, personas, proyectos, eventos (**todos ficticios**) |
| Páginas | `@personalizar: contenido de cada página` → `PAGES` | Secciones y web parts |
| Piezas Embed | `@personalizar: EMBED_PIECES` | Qué piezas existen y su alto fijo |
| Receta | `@personalizar: formato de receta` | Salida de `pagina.json`, `receta.md`, manifiesto |

## Parámetros de la URL
Funcionan en el query (`?s=light`) y en el hash (`#/home?s=light`). El hash manda sobre el query, y ambos sobre `localStorage`.

| Parámetro | Valores | Efecto |
|---|---|---|
| `s` | `dark`, `light` | Estilo |
| `a` | `cobalt`, `lime`, `coral`, `amber` | Acento |
| `f` | `brand`, `sp` | Fuente de marca o Segoe UI (lo que SharePoint pinta de verdad) |
| `w` | `1204`, `760`, `390` | Ancho del lienzo (simula el reflujo) |
| `wp` | `0`, `1` | Overlay «Ver web parts» |
| `ctl` | `0`, `min` | Oculta o minimiza el panel (útil para capturas) |
| `embed` | `header`, `stages`, `impact`, `graph` | Modo pieza |

## Recetas

### Cambiar los colores o el estilo
1. En `@personalizar: tokens`, edita las variables de `html[data-s="dark"]` o `html[data-s="light"]`.
2. Los acentos son 4 reglas `html[data-a="…"]`: `--accent` (relleno) y `--atx` (el acento usado **como texto**, ajustado por estilo para cumplir contraste AA). Si agregas un acento, define `--atx` en oscuro y en claro, y revisa ≥ 4.5:1 contra `--bg`.
3. Para agregar un acento a la UI, suma un botón `.sw` con `data-k="a"` en el panel y agrega su valor a `OPT.a`.

### Cambiar la marca (nombre, logo, navegación)
- Logo: el `<svg>` dentro de `.brand` (tinta `currentColor`, acento `var(--accent)`).
- Nombre: `Atlas Design Hub` aparece en `.brand`, en `<title>` y en el texto de las piezas.
- Navegación: el arreglo `NAV` `[ruta, etiqueta, esHerramienta]`.

### Agregar una página
1. Agrega la definición en `PAGES`:
   ```js
   servicios: { title:'Servicios', slug:'servicios', sections:[
     sec('1','none',[[ wp('n','Text', T('<h2>Qué hacemos</h2><p>…</p>'), {motivo:'intro', cfg:{estilos:'H2 + Normal'}}) ]])
   ]}
   ```
2. Regístrala en `ROUTES` (`'/servicios':'servicios'`) y en `NAV`.
3. Y en la lista de títulos de `route()` si quieres su `<title>`.

### Agregar un web part a una sección
`wp(tipo, nombreRealDelWebPart, html, meta)`:
- `tipo` define el color del overlay: `n`, `i`, `p`, `e`.
- `meta.motivo` forma parte del nombre de archivo de la imagen.
- `meta.alt` y `meta.vinculo` alimentan el manifiesto de las imágenes.
- `meta.cfg` (solo nativos) se vuelca tal cual a la receta: pon ahí lo que quien arma debe configurar (origen, filtro, layout).
- `html` puede ser un string o una **función** (se evalúa al renderizar, útil si depende del estilo actual).

### Agregar una pieza Embed
1. En `EMBED_PIECES`:
   ```js
   timeline: { title:'Línea de tiempo', desc:'…', gif:null, h:{1204:480, 760:520} }
   ```
2. Escribe `PIECE_MOUNT.timeline = function(root){ root.innerHTML = '…'; }` en el bloque de piezas (sección 12). Reglas: sin dependencias, usa `now()` para animar, responde por container query.
3. Mide su alto natural: abre `#/embed-lab`, elige la pieza y a cada ancho copia el valor que reporta el medidor a `h`.
4. Úsala en una página con `embedWp('timeline')`.

### Exportar para SharePoint
```bash
cd tools && npm install
node export-embed.mjs png timeline 2408      # PNG a doble resolución
node export-embed.mjs gif timeline 1204      # GIF ≤ 3 MB
node export-recipes.mjs ../examples "https://<usuario>.github.io/<repo>/simulator/index.html"
```

## Adaptarlo a tu sitio real (checklist)
- [ ] Reemplazar nombre, logo y tokens por los de tu marca.
- [ ] Sustituir los datos ficticios por tu estructura (los **reales**, en un repo **privado**).
- [ ] Ajustar `NAV` y `PAGES` a la estructura de tu README.
- [ ] Confirmar si tu sitio es Communication o Team (si es Team, usa solo layouts de 1 columna).
- [ ] Probar cada bloque «Nativo» en una página de borrador para confirmar que existe en tu toolbox.
- [ ] Medir los altos de las piezas Embed y fijarlos.
- [ ] Generar las recetas y armar una página piloto antes de las demás.

## Detalles de implementación útiles
- **Un reloj único:** `now()` = `window.__simTime ?? performance.now()` (+ `ff` segundos). Todo lo animado lo usa.
- **Tema:** `applyOpts()` pone `data-s`, `data-a`, `data-f`, `data-wp` en `<html>` y dispara `sim:theme`; las piezas con canvas lo escuchan para releer colores.
- **Overlay sin afectar el layout:** `outline` + etiquetas con `position:absolute`.
- **Reflujo:** `.stage` es un contenedor (`container-type:inline-size`); los layouts usan `@container stage`. Por eso el selector «Ancho» simula SharePoint sin depender de la ventana.
- **Embed dentro de las páginas del simulador:** son `<iframe>` reales a `?embed=…` con alto fijo, igual que en SharePoint.
