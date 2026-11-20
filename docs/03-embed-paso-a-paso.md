# 03 · Cómo funciona el Embed (traer HTML a SharePoint)

SharePoint no te deja subir un `.html` y mostrarlo (lo descarga), ni correr JS propio en una página moderna. La salida es **hospedar la pieza fuera** (GitHub Pages) y **mostrarla dentro de la página con el web part Embed**, que es un `<iframe>`.

```
 ┌── SharePoint (página moderna) ──────────────────┐
 │  Text · Quick links · People ...  (nativo)       │
 │  ┌── web part Embed ─────────────────────────┐   │
 │  │  <iframe src="https://usuario.github.io/   │   │
 │  │          repo/simulator/index.html         │   │
 │  │          ?embed=impact" height="700">      │   │
 │  │      → carga SOLO la pieza «impact»        │   │
 │  └────────────────────────────────────────────┘   │
 └──────────────────────────────────────────────────┘
```

Todo el truco son tres piezas: **hospedaje**, **modo `?embed=`** y **permiso del dominio**.

## 1 · Hospedaje: GitHub Pages
Un archivo HTML estático con sus recursos (imágenes, JSON) en un repo con GitHub Pages activado. La URL queda como:

```
https://<usuario-u-org>.github.io/<repo>/simulator/index.html
```

Importante: la pieza debe servirse **desde la misma carpeta que sus recursos**, porque usa rutas relativas.

## 2 · El modo `?embed=<pieza>`
El simulador es una maqueta completa, pero con `?embed=impact` en la URL se comporta distinto:

| Con `?embed=` | Sin `?embed=` |
|---|---|
| Quita barra M365, header, footer, panel y overlay | Muestra el simulador completo |
| Renderiza **solo** la pieza, con 16 a 24 px de margen | Router de páginas |
| Fondo según estilo (`#0B0C0D` oscuro, `#F4F3EF` claro) | |
| Conserva toda la interactividad y animación | |

Parámetros que acepta (también dentro del hash `#/...?`):

| Parámetro | Valores | Para qué |
|---|---|---|
| `embed` | `header`, `stages`, `impact`, `graph` | Qué pieza mostrar |
| `s` | `dark`, `light` | Estilo |
| `a` | `cobalt`, `lime`, `coral`, `amber` | Acento |
| `f` | `brand`, `sp` | Fuente de marca o Segoe UI |
| `bg` | `transparent` | Fondo transparente |
| `ff` | segundos | Adelanta la animación (para capturas) |

Ejemplo real: `.../simulator/index.html?embed=impact&s=dark&a=lime`

### Cómo está implementado (para que lo copies)
En `simulator/index.html`, busca `@personalizar: EMBED_PIECES` y `bootEmbed`:

```js
const EMBED_PIECES = {
  impact: { title:'Impacto por squad', desc:'…', gif:null, h:{1204:700, 760:910} },
  …
};
PIECE_MOUNT.impact = function(root){ /* dibuja la pieza dentro de root */ };
```

`bootEmbed(piece)` borra el chrome (`#app`), crea `<main id="emb">`, llama a `PIECE_MOUNT[piece]` y empieza a reportar su alto. **Agregar una pieza = una entrada en `EMBED_PIECES` + una función `mountXxx` + registrarla en `PIECE_MOUNT`.** Ver [06](06-personalizar-y-extender.md).

## 3 · El alto: lo que SharePoint NO hace
La pieza avisa su alto al padre:

```js
parent.postMessage({ type:'sp-sim-embed-height', piece:'impact', height:694 }, '*');
```

Lo hace con un `ResizeObserver` y varios disparos al cargar, y vuelve a enviarlo si la pieza crece (por ejemplo al abrir un panel). **El web part Embed de SharePoint no escucha ese mensaje.** Por eso:

> **El alto se fija a mano en el web part, con el máximo de todos los estados de la pieza.**

- Si el alto fijo es menor al natural, **se corta**.
- Si es mucho mayor, queda una **franja vacía** del color de fondo (por eso el fondo de la pieza es el del sitio).
- El simulador incluye el **Embed lab** (`#/embed-lab`): eliges pieza y ancho, cambias el alto fijo y un medidor te dice verde / «se corta» / «sobra espacio» comparando con el alto real que reporta la pieza.

Alturas medidas de las piezas de ejemplo (px):

| Pieza | A 1204 de ancho | A 760 |
|---|---|---|
| `header` | 380 | 300 |
| `stages` | 490 | 480 |
| `impact` | 700 | 910 |
| `graph` | 845 | 585 |

Usa el valor que corresponde al ancho real de **tu** columna. Si una sección de 1 columna llega a verse en pantallas angostas, toma el mayor de los dos.

## 4 · Permiso del dominio (requiere administrador)
Sin este paso, el web part Embed muestra un error o un recuadro vacío.

1. Un administrador de la colección de sitios entra a **Configuración del sitio → Administración de la colección de sitios → HTML Field Security** (en inglés: *Site Settings → Site Collection Administration → HTML Field Security*).
2. La página ofrece tres opciones: no permitir iframes externos, permitirlos de **cualquier** dominio externo, o permitirlos **solo de los dominios que agregues a la lista**. Elige la tercera y agrega tu dominio (`<usuario>.github.io`, sin `https://` ni ruta). [el bloqueo de GitHub Pages sin este permiso se comprobó en un tenant real; los textos exactos varían por idioma y versión]
3. Si no hay forma de que lo apruebe un admin, usa el **GIF** de la pieza en un web part Image (ver [04](04-gifs-e-imagenes.md)). Pierdes la interactividad, no la apariencia.

> Permitir un dominio de GitHub Pages implica confiar en quien controla ese dominio. Por eso conviene hospedar bajo una **organización del equipo** y no en una cuenta personal.

## 5 · Pegar la pieza en la página
1. Edita la página → **+** → web part **Embed**.
2. En «Website address or embed code» pega **una de dos**:
   - La URL: `https://<usuario>.github.io/<repo>/simulator/index.html?embed=impact`
   - O el código completo (te da control del alto):
     ```html
     <iframe src="https://<usuario>.github.io/<repo>/simulator/index.html?embed=impact"
             width="100%" height="700" frameborder="0"
             style="border:0;background:#0B0C0D"></iframe>
     ```
3. Ajusta el alto en el panel del web part (según la versión verás «alto» en píxeles o una proporción; con proporción, usa el código del iframe).
4. En una sección de **1 columna**, activa el ancho completo del web part si aparece la opción. [verificar en tu tenant]
5. Guarda como **borrador** y revisa en escritorio y a 760 px.

El Embed lab genera los dos formatos con los botones **Copiar URL** y **Copiar iframe**.

## 6 · Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Recuadro vacío o «no se puede mostrar» | Dominio no permitido | Paso 4 (HTML Field Security) |
| Franja negra abajo | Alto fijo mayor al natural | Baja el alto al máximo real de la pieza |
| La pieza se corta | Alto fijo menor al natural | Súbelo; mide con el Embed lab |
| Imágenes de la pieza rotas | Rutas relativas y carpeta distinta | Sirve la pieza desde la carpeta de sus recursos |
| Funciona en un navegador y no en otro | Bloqueo de contenido de terceros | Prueba en ventana sin extensiones; confirma `https` |
| No cambia al actualizar | Caché de GitHub Pages o del navegador | Espera 1 a 2 minutos; recarga forzada |

## 7 · Por qué una pieza y no la maqueta completa
Cada pieza es **autónoma**: no depende del router, ni del estado de otras piezas, ni de la barra de control. Así puedes embeber `impact` en Home y `graph` en Community sin cargar nada más, y cada una se prueba aislada con su URL.

Checklist para una pieza nueva:
- Sin dependencias externas (todo inline).
- Responde por **container query** (el ancho lo decide el iframe, no la ventana).
- Respeta `prefers-reduced-motion` y pausa fuera de vista.
- Reporta su alto por `postMessage`.
- Usa `now()` en vez de `performance.now()` para que la herramienta de GIF pueda congelar el tiempo.
- Fondo propio igual al del sitio.
