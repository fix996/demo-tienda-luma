# Luma — catálogo de ropa de ejemplo

Sitio independiente, moderno y minimalista para mostrar una tienda de ropa. Luma es una marca ficticia con un símbolo vectorial propio. Los productos, las fotografías, los precios, los talles y los colores son ilustrativos.

## Abrir

Desde `dist`: `python -m http.server 8768`. Abrir `http://localhost:8768/`.

## Recorrido

Seis productos, filtros por tipo, precio visible y selector de talle. El visitante elige un talle y suma la prenda al bolso, donde puede modificar cantidades y ver un total de ejemplo. El resumen final es una simulación: no se envía ningún pedido, no se cobra y no se verifica stock. El bolso existe solo en la memoria de la pestaña.

## Comprobar

`node --check dist/products.js; node --check dist/app.js; node scripts/check.mjs`

No requiere instalación ni fuentes externas. Para usarla con un comercio real hacen falta fotos, precios, talles y stock aprobados, además de definir cómo recibe pedidos y pagos.

## Archivos

- `dist/index.html`: página y textos.
- `dist/styles.css`: diseño adaptable.
- `dist/logo.svg`: símbolo de pliegues de tela, usado en la marca y el favicon.
- `dist/products.js`: catálogo de ejemplo.
- `dist/app.js`: filtros, bolso y resumen simulado.
- `dist/assets/`: fotos locales optimizadas.

Las fotos de remera, pantalón y vestido se generaron con ImageGen para este proyecto mediante prompts de fotografía de producto minimalista sin marcas ni texto. La foto de la tienda, camisa, campera y bolso provienen de las imágenes ya generadas para la muestra comercial previa de este espacio de trabajo. Todas se optimizaron a JPEG.
