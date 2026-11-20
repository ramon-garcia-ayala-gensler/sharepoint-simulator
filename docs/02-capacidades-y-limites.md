# 02 · Qué permite SharePoint y qué no

Resumen operativo de lo que descubrimos armando un sitio real. Cada afirmación lleva su nivel de confianza:

- **[probado]** comprobado en un sitio real.
- **[doc]** viene de la documentación de Microsoft.
- **[verificar]** supuesto razonable que debes validar en tu tenant antes de depender de él.

## 1 · Tipo de sitio: averígualo primero
- Un **Team Site conectado a un grupo de M365** no tiene secciones de ancho completo. Solo los **Communication Site** las tienen. [doc]
- Si diseñas un hero de borde a borde y resulta ser Team Site, todo el diseño se descuadra. Es la lección más cara del proyecto.

## 2 · Lienzo y layouts

Ancho máximo del contenido: **1204 px**, con 32 px entre columnas.

| Layout | Ancho por columna | Notas |
|---|---|---|
| Una columna | 1204 | [doc] |
| Dos columnas | 586 + 586 | [doc] |
| Tres columnas | 380 × 3 | [doc] |
| 1/3 + 2/3 | 380 + 792 | [doc] |
| 2/3 + 1/3 | 792 + 380 | [doc] |
| Ancho completo | borde a borde | Solo Communication Site y web parts limitados (Hero, Image, Banner, Divider, Spacer, Highlighted content, File and media). [verificar contra tu toolbox] |
| Sección vertical | columna a la derecha de toda la página | [verificar] |

**Reflujo:** hasta 3 columnas desde 1024 px, 2 entre 640 y 1023, 1 por debajo de 640. [doc] El simulador lo reproduce con container queries; el selector «Ancho» del panel (1204 / 760 / 390) lo prueba.

No puedes mostrar web parts distintos por dispositivo. Diseña escritorio primero.

## 3 · Fondos de sección
Opciones: ninguno, **Neutral**, **Soft**, **Strong**. Strong usa el color primario del tema. Los colores exactos dependen del tema; las maquetas los aproximan.

- Una **imagen de fondo de sección** llega de borde a borde, **no anima GIF** y se aplasta a la altura del contenido. [probado] Evítala.
- Un web part **Image** dentro de una columna respeta la proporción y **sí anima GIF**. [probado]

## 4 · Web parts útiles
- **Estáticos:** Text, Image, Hero, Banner, Button, Call to action, Quick links (Compact, Filmstrip, Grid, Button, List, Tiles), Divider, Spacer, Image gallery, File and media (video), Countdown, Quick chart.
- **Dinámicos:** News, Highlighted content, Events, People, Document library, List, Recent documents.
- **Embed**, **Power Apps**, **Power BI**, **Forms**: existen, pero dependen de permisos del tenant.

Detalles que importan:
- **Image** admite **un solo vínculo** (toda la imagen), leyenda y texto alternativo. [doc]
- **Banner** se puede borrar; la página igual necesita título como metadato (Page details). [probado]
- **Text**: Heading 1 a 3, Normal, Quote, Fixed width. Sin tamaño de fuente libre. Colores: los del tema, 10 estándar y 14 resaltados.
- **Highlighted content** muestra la miniatura de la página: la misma página muestra la misma imagen en todos lados.

## 5 · Qué se puede estilizar

| Elemento | Se puede | No se puede |
|---|---|---|
| Colores | Paleta del tema del sitio (tema propio requiere admin) | Colores por web part fuera de la paleta de Text |
| Tipografía | Estilos nativos (Segoe UI). Fuentes propias vía Brand Center (admin) | Fuente o tamaño libres |
| Header | Layouts Minimal, Compact, Standard, Extended, logo, navegación [verificar] | CSS libre |
| Identidad rica | Solo con **imágenes exportadas** (PNG/GIF) o **Embed** | Todo lo demás |
| Interactividad | **Embed** o **Power Apps** | Pestañas, KPIs animados y contadores nativos |

## 6 · CSS y JS propio
- **Sin CSS ni JS propios** en páginas modernas.
- Subir un `.html` a una biblioteca de documentos: SharePoint **lo descarga**, no lo muestra. [probado]
- `.aspx` con scripts: solo si el admin habilita scripts personalizados, y Microsoft los revierte a las 24 h. [doc]
- **Embed** acepta iframes solo de dominios permitidos por el admin. GitHub Pages queda bloqueado hasta que se permita el dominio. [probado]
- Con admin: SPFx (web parts o extensiones), Brand Center, temas propios. [verificar]

## 7 · Tamaños de imagen
Regla: exporta al **doble del ancho de la columna**, con tope de 2560 px.

| Layout / columna | Ancho de exportación |
|---|---|
| 1 columna | 2408 |
| 2 columnas | 1172 por columna |
| 3 columnas | 760 por columna |
| 1/3 | 760 |
| 2/3 | 1584 |
| Ancho completo | 2560 |

- **GIF:** al ancho real de su columna (1204 en una columna) y **≤ 3 MB**.
- Todo texto que dibujes dentro de una imagen **debe ir también en el alt**.
- Piso de legibilidad en celular: texto ≥ 16 px a 343 px de ancho (en una pieza de 1204 px, ≈ 56 px).

## 8 · Lecciones aprendidas (las que más tiempo costaron)
1. **Averigua el tipo de sitio primero.**
2. **Un simulador que engaña no sirve.** Valida contra las reglas reales (1204 px, sin full-width en Team Site, Banner borrable). Prueba en el sitio real lo antes posible.
3. **Nada que parezca botón sin vínculo.** Si una imagen dibuja una flecha, la imagen entera debe enlazar.
4. **Texto nativo mínimo con alt completo:** la accesibilidad y la búsqueda dependen del alt.
5. **GIF ≤ 3 MB.** Si lo superas: menos fps, menos colores, luego menos ancho. [`tools/export-embed.mjs`](../tools/export-embed.mjs) lo hace solo.
6. **No dupliques contenido** entre páginas; usa Lists + Highlighted content.
7. **Contenido real = privado.** Nombres de personas reales no van a un repo ni a unas Pages públicas.
8. **Pruebas que conviene hacer al inicio:** formato al pegar en Text, `mailto:` en un vínculo de Image, WebM en File and media, toolbox en una sección de ancho completo.
