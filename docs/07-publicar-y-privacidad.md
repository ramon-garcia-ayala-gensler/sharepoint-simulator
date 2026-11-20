# 07 · Publicar en GitHub Pages y cuidar la privacidad

## Publicar (o hacer tu propia copia)
Este repo se sirve con GitHub Pages desde la rama `main`, carpeta raíz. Para tu propia versión:

```bash
# 1) Haz fork o clona
gh repo fork ramon-garcia-ayala-gensler/sharepoint-simulator --clone

# 2) Activa Pages (rama main, raíz)
gh api -X POST repos/<usuario-u-org>/sharepoint-simulator/pages \
  -f "source[branch]=main" -f "source[path]=/"

# 3) Espera ~1 minuto y abre
#    https://<usuario-u-org>.github.io/sharepoint-simulator/
```

El archivo `.nojekyll` de la raíz evita que Pages procese los archivos con Jekyll.

Cada `git push` a `main` vuelve a desplegar. Revisa el estado con `gh api repos/<usuario-u-org>/sharepoint-simulator/pages/builds/latest`.

## ¿Dónde hospedar para SharePoint?
El dominio que hospeda las piezas es el que un administrador tendrá que **permitir** en HTML Field Security.

| Opción | Dominio | Cuándo |
|---|---|---|
| Cuenta personal | `usuario.github.io` | Pruebas |
| **Organización del equipo** | `organizacion.github.io` | **Recomendado** para producción: el equipo controla quién publica |
| Dominio propio | `herramientas.tuempresa.com` | Si TI ya lo gestiona |

Permitir un dominio significa confiar en **todo** lo que ese dominio sirva. Con una organización puedes limitar quién tiene permiso de escritura.

## Qué es público y qué NO debe serlo
Un repo público y unas Pages públicas pueden ser **indexados, copiados y archivados**, incluso si luego lo borras.

| Sí puede ser público | No debe ser público |
|---|---|
| La metodología y las recetas genéricas | Nombres, fotos o correos de personas reales |
| La maqueta con **datos ficticios** | Casos de estudio o capturas de proyectos de clientes |
| Scripts genéricos con configuración (`SPB_CONFIG`) | URLs reales de tu tenant, IDs de sitio o de biblioteca |
| Tokens de una marca pública | Material interno, guías de marca confidenciales, logos de clientes |

Reglas de este repo:
- **Todo el contenido del simulador es inventado** (Atlas Design Hub, squads y personas ficticios, sin fotos de personas).
- No hay dominios, sitios ni IDs de ningún tenant. `sp-builder.js` se configura con `window.SPB_CONFIG`.
- La maqueta de **tu** sitio real, con tu contenido real, vive en un repo **privado**. Este repo solo enseña el método.

## Antes de hacer público algo derivado de este repo
- [ ] Busca nombres reales: `grep -rniE "tu-empresa|tu-tenant|@tudominio" .`
- [ ] Revisa que no queden capturas con datos reales (`*.png`, `*.gif`).
- [ ] Revisa `examples/` y los JSON: URLs, IDs, correos.
- [ ] Confirma que tienes permiso para publicar el logo y los nombres que aparezcan.
- [ ] Piensa si el dominio de las Pages lo va a permitir un admin: ¿quién controla esa cuenta?
