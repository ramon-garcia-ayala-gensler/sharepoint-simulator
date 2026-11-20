# Receta: Inicio
Banner: bórralo («Delete web part»). Título de la página (Page details): "Inicio".

## Sección 1 · 1 columna · Fondo: none
1. **Embed** (Embed) · ruta s0.c0.w0 · Header animado de la portada. Alternativa sin Embed: el GIF del mismo bucle en un web part Image.
   - Embed: pegar `https://ramon-garcia-ayala-gensler.github.io/sharepoint-simulator/simulator/index.html?embed=header`
   - Alto fijo: 380 px (1204) · 300 px (760) · activar «ancho completo»
   - Alt/descripción: «Header animado. Campo halftone que respira, 6 oficinas y paquetes de datos. Bucle de 12 s.»
   - Alternativa sin Embed: subir `atlas-inicio-s0-c0-w0-header.gif` en un web part Image (≤ 3 MB)

## Sección 2 · 2/3 + 1/3 · Fondo: none
### Columna 1
1. **Text** (Nativo) · ruta s1.c0.w0
   - estilos: H2 + Normal + Quote
   - color_texto: themePrimary
### Columna 2
1. **Quick links** (Nativo) · ruta s1.c1.w0
   - layout: List
   - elementos: 4

## Sección 3 · 1 columna · Fondo: neutral
1. **Embed** (Embed) · ruta s2.c0.w0 · Figura completa con su propio título. Fondo de sección Neutral para separar bloques.
   - Embed: pegar `https://ramon-garcia-ayala-gensler.github.io/sharepoint-simulator/simulator/index.html?embed=stages`
   - Alto fijo: 490 px (1204) · 480 px (760) · activar «ancho completo»
   - Alt/descripción: «Dónde entra cada squad. Matriz de 4 squads por 8 etapas del proyecto, con resaltado al pasar.»

## Sección 4 · 2/3 + 1/3 · Fondo: none
### Columna 1
1. **Highlighted content** (Nativo) · ruta s3.c0.w0
   - origen: Páginas de este sitio
   - filtro: Content type = Project
   - layout: Carousel
   - elementos: 5
   - orden: Más recientes
### Columna 2
1. **Events** (Nativo) · ruta s3.c1.w0
   - lista: Events
   - layout: Compact
   - elementos: 3

## Sección 5 · 1 columna · Fondo: none
1. **Embed** (Embed) · ruta s4.c0.w0 · Cifras y mapa con estado interno: por eso no es una imagen.
   - Embed: pegar `https://ramon-garcia-ayala-gensler.github.io/sharepoint-simulator/simulator/index.html?embed=impact`
   - Alto fijo: 700 px (1204) · 910 px (760) · activar «ancho completo»
   - Alt/descripción: «Impacto por squad. Pestañas por squad, cifras clicables y burbujas proporcionales al área.»

## Sección 6 · 1 columna · Fondo: none
1. **People** (Nativo) · ruta s5.c0.w0
   - personas: 8 personas (ficticias en esta maqueta)
   - layout: Compact

## Sección 7 · 1 columna · Fondo: strong
1. **Text** (Nativo) · ruta s6.c0.w0
   - estilos: H2 + Normal
   - fondo_seccion: Strong (themePrimary)
2. **Quick links** (Nativo) · ruta s6.c0.w1
   - layout: Button
   - elementos: 3
