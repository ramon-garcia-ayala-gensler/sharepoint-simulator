# Receta: Comunidad
Banner: bórralo («Delete web part»). Título de la página (Page details): "Comunidad".

## Sección 1 · 1 columna · Fondo: none
1. **Embed** (Embed) · ruta s0.c0.w0 · Grafo con hover, foco y selección. SharePoint no puede hacerlo nativo.
   - Embed: pegar `https://ramon-garcia-ayala-gensler.github.io/sharepoint-simulator/simulator/index.html?embed=graph`
   - Alto fijo: 845 px (1204) · 585 px (760) · activar «ancho completo»
   - Alt/descripción: «Grafo de comunidades. 24 personas ficticias y 5 comunidades; resalta vecinos y se navega con teclado.»

## Sección 2 · 3 columnas · Fondo: neutral
### Columna 1
1. **Quick links** (Nativo) · ruta s1.c0.w0
   - layout: List
   - titulo_web_part: Guilds
   - elementos: 3
### Columna 2
1. **Text** (Nativo) · ruta s1.c1.w0
   - estilos: H3 + Normal
### Columna 3
1. **Quick links** (Nativo) · ruta s1.c2.w0
   - layout: List
   - titulo_web_part: Recursos
   - elementos: 3

## Sección 3 · 2 columnas · Fondo: none
### Columna 1
1. **Text** (Nativo) · ruta s2.c0.w0
   - estilos: H2 + Normal
### Columna 2
1. **Power Apps** (Power Apps) · ruta s2.c1.w0 · Formulario con validación que escribe en una List.
   - Power Apps: pegar el ID de la app · alto 520 px · datos en la List «Ideas»
