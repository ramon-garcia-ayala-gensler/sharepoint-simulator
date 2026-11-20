# 01 · Metodología: del diseño al sitio armado

Esta es la secuencia exacta que se siguió para llevar un diseño propio a un sitio de SharePoint moderno, y el ritmo con el que conviene recorrerla. La idea central:

> **SharePoint fija la letra, los botones y los colores. Tu diseño de marca vive en una maqueta HTML, y de la maqueta salen recetas que se arman en SharePoint con web parts nativos, imágenes pre-renderizadas, Power Apps o piezas Embed.**

El simulador de este repo es esa maqueta, vaciada de contenido real.

## Las 6 fases (con aprobación entre cada una)

| # | Fase | Qué produces | Cuánto dura (referencia) |
|---|---|---|---|
| 0 | **Intake** | Tipo de sitio, accesos de admin, licencias, idiomas | 15 a 30 min |
| 1 | **Research** | Qué permite tu SharePoint y cómo se ve la competencia o tus referencias | 1 a 2 h |
| 2 | **Marca y maqueta** | Tokens, 1 o 2 estilos, maqueta HTML fiel a SharePoint | 1 a 3 días |
| 3 | **Revisión** | Estilo elegido y ajustes, con capturas | 1 ronda por día |
| 4 | **Receta** | `pagina.json` + `receta.md` + `manifiesto.json` por página, imágenes exportadas | 1 a 2 h por página |
| 5 | **Ensamblaje** | Páginas en borrador dentro de SharePoint | 30 a 60 min por página |
| 6 | **QA** | Sitio real vs maqueta, sección por sección | 30 min por página |

Regla de ritmo: **no avances de fase sin que alguien apruebe la anterior.** La maqueta es barata de cambiar; una página ya armada no.

### Fase 0 · Intake: lo único que cambia el diseño
Confirma solo esto (todo lo demás tiene un valor por defecto sensato):

1. **¿Communication Site o Team Site?** Es el dato más importante. Las secciones de ancho completo solo existen en Communication Site. En un Team Site todo va a 1 columna de 1204 px.
2. **¿Hay admin disponible?** Con admin puedes: permitir dominios para Embed, subir fuentes al Brand Center, aplicar un tema propio, usar SPFx. Sin admin, quedas en web parts nativos + imágenes.
3. **¿Licencias de Power Apps?** Sin licencias, los formularios se resuelven con Microsoft Forms o con vistas de Lists.
4. **Idiomas** y dónde están el README de estructura y las referencias visuales.

### Fase 1 · Research
Dos lecturas en paralelo:
- **Capacidades**: qué web parts, layouts y fondos existen de verdad (ver [02](02-capacidades-y-limites.md)). No supongas; prueba con una página de borrador.
- **Referencias visuales**: una tabla por imagen (qué se ve, qué web part lo reproduce, qué exige imagen) y 2 o 3 direcciones de estilo con su viabilidad.

### Fase 2 · Marca y maqueta
1. Decide **dos direcciones de estilo**. El par más útil suele ser una oscura y expresiva y una clara y editorial 100 % nativa.
2. Define **tokens**: primitivos (colores, tipografías) → semánticos (`--bg`, `--ink`, `--accent`) → de componente. Verifica contraste AA.
3. Construye **un solo archivo HTML** con: el chrome de SharePoint, la navegación real, el lienzo de 1204 px, los layouts reales y un **overlay «Ver web parts»** que etiqueta cada bloque como Nativo, Imagen, Power Apps o Embed.
4. Parte de este simulador en vez de empezar de cero: `simulator/index.html` ya trae todo eso. Ver [06](06-personalizar-y-extender.md).

### Fase 3 · Revisión
Mira capturas, no código. Itera sobre la maqueta. Un estilo descartado se borra del archivo: dos estilos bien hechos valen más que cinco a medias.

### Fase 4 · Receta
Para cada página la maqueta produce tres archivos (la vista `#/recipe` del simulador los genera):
- `pagina.json`: el modelo `página → secciones → columnas → web parts`.
- `receta.md`: el paso a paso legible para una persona o para un agente.
- `manifiesto.json`: cada imagen con archivo, alt, ruta `sN.cM.wK`, ancho y vínculo.

Ver [05](05-receta-y-ensamblaje.md).

### Fase 5 · Ensamblaje
Una página por corrida, siempre **como borrador**. Tres formas de ejecutarlo:
- A mano, siguiendo `receta.md`.
- Con una extensión de navegador con IA (por ejemplo Claude en Chrome) que lee la receta y opera el editor de SharePoint, con captura de verificación por sección.
- Con REST desde la consola: `tools/sp-builder.js` arma páginas completas.

**Nunca publiques ni edites la navegación sin que alguien lo pida explícitamente.**

### Fase 6 · QA
Compara captura real vs maqueta por sección. Revisa: contraste de vínculos 4.5:1, alt presente en toda imagen, que nada parezca botón sin ser vínculo, y que en móvil (< 640 px) todo colapse a 1 columna.

## Elegir la ruta de cada bloque

Preferencia estricta: **nativo → imagen → Power Apps / Embed → SPFx.** Cada salto agrega costo de mantenimiento; justifícalo en el mapa «sección → web part».

| Necesidad | Ruta | Por qué |
|---|---|---|
| Texto editable, listas, noticias, personas, eventos, enlaces | **Nativo** (Text, Quick links, News, Highlighted content, People, Events, List) | Cualquier editor lo mantiene |
| Titular de marca, diagrama estático, KPI, collage | **Imagen** pre-renderizada con alt completo | SharePoint fija letra y colores |
| Animación sin permisos | **GIF** en un web part Image (≤ 3 MB) | Funciona en cualquier sitio |
| Pieza interactiva o con estado (pestañas, mapa que reacciona, grafo) | **Embed** (iframe a GitHub Pages) | Necesita permiso de admin para el dominio. Ver [03](03-embed-paso-a-paso.md) |
| Formulario, filtros sobre datos, solicitudes | **Power Apps** sobre Microsoft Lists | Interacción con datos; exige licencias |
| Componentes de marca reutilizables con datos vivos | **SPFx** | Solo si hay admin y catálogo de apps |

## Reglas de fidelidad (no negociables)
- Sin CSS ni JS propios en páginas modernas. Si la maqueta muestra algo que SharePoint no hace nativo, el overlay debe decir **Imagen**, **Embed** o **Power Apps**.
- Lienzo de 1204 px. Layouts reales: 1, 2, 3 columnas, 1/3 + 2/3, 2/3 + 1/3, vertical, ancho completo (solo Communication Site y web parts limitados).
- Texto nativo: Segoe UI (o la fuente del Brand Center si existe), estilos H1 a H3 / Normal / Quote, colores solo del tema. Un titular «de marca» solo existe como imagen con alt.
- Un vínculo por imagen. Nada que parezca botón sin serlo.
- El **tema es por sitio, no por página**. Los colores por sección viven solo en las imágenes y piezas; los web parts nativos conservan el color primario del tema.
- Contenido canónico en Microsoft Lists + Highlighted content; no dupliques páginas.
- Datos de personas reales: repos y páginas privados.
