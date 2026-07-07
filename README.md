# Directorio telefónico de colaboradores — UNIREMINGTON

Sistema para publicar el directorio en WordPress a partir de un **Excel/CSV**, usando
**GitHub** como fuente de datos y **GitHub Pages** para servir el JSON.

```
data/colaboradores.xlsx  ──▶  GitHub Action  ──▶  docs/colaboradores.json  ──▶  Bloque HTML de WordPress
   (tú lo editas)             (parsea al hacer push)   (publicado en Pages)        (fetch + tarjetas)
```

## ¿Por qué Excel/CSV y no PDF?
El Excel ya trae los datos tabulados (fila = colaborador, columna = campo), así que la
extracción es **exacta y automática**. El PDF hay que reconstruirlo con parsing/OCR y se
rompe cada vez que cambia la maquetación. **Usa Excel** (`.xlsx`) o **CSV**.

## Estructura del proyecto
```
data/Directorio web.xlsx      Excel oficial con los colaboradores (fuente de datos)
scripts/build.js              Convierte Excel/CSV -> JSON (agnóstico a columnas)
docs/index.html               Demo + landing de GitHub Pages
docs/colaboradores.json       JSON generado (lo produce el build)
wordpress-embed.html          Snippet listo para pegar en WordPress
.github/workflows/build.yml   Regenera el JSON en cada push
```

## Columnas esperadas
`SEDE · CARGO · DEPENDENCIA · NOMBRES · APELLIDOS · PBX · EXTENSIÓN · CORREO`

> El script es **agnóstico a columnas**: si agregas columnas nuevas al Excel, aparecen
> solas en el JSON. Los encabezados se normalizan (ej.: `EXTENSIÓN` → `extension`).

## Puesta en marcha

### 1. Sube el proyecto a GitHub
```bash
git init
git add .
git commit -m "Directorio de colaboradores"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/directorio-colaboradores.git
git push -u origin main
```

### 2. Activa GitHub Pages
En el repo → **Settings → Pages** → *Source: Deploy from a branch* →
Branch **main**, carpeta **/docs** → Save.
Tu JSON quedará en:
`https://TU-USUARIO.github.io/directorio-colaboradores/colaboradores.json`
Y el demo en: `https://TU-USUARIO.github.io/directorio-colaboradores/`

### 3. Actualiza los datos
Edita `data/Directorio web.xlsx` (o reemplázalo) y haz `git push`. La **GitHub Action**
regenera `docs/colaboradores.json` automáticamente. Actualmente trae **176 colaboradores**
de 20 sedes.

Para probar localmente antes de subir:
```bash
npm install
npm run build
```

### 4. Insértalo en WordPress
1. Edita la página → agrega un bloque **HTML personalizado**.
2. Pega el contenido de [`wordpress-embed.html`](wordpress-embed.html) (ya trae la URL real).
3. Publica. Listo: buscador + filtros por sede y dependencia + tarjetas de contacto.

> **Blindado con Shadow DOM:** el widget se renderiza dentro de un contenedor aislado, así
> el tema o el page builder (Gutenberg/Elementor) **no pueden alterar su diseño ni su
> estructura** (ni `wpautop`, ni el CSS del tema). Requisito: el bloque debe permitir
> `<script>` (el bloque *HTML personalizado* de Gutenberg y el *widget HTML* de Elementor
> lo permiten). Si un plugin de seguridad elimina scripts inline, habría que cargarlo como
> archivo `.js` encolado o vía un mini-plugin.

## Flujo de actualización diario
Editas el Excel → `git push` → la Action regenera el JSON → WordPress muestra los cambios
solo (sin tocar WordPress). El bloque lee el JSON con `cache:no-cache`.

## Notas
- La fuente de datos es `data/Directorio web.xlsx`; edítalo ahí y haz push.
- Si prefieres no usar GitHub Pages, puedes servir `colaboradores.json` desde tu propio
  WordPress (subiéndolo a `wp-content/uploads/`) y apuntar `data-src` allí.
