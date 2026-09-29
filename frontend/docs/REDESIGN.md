# BrickByBrick · Identidad visual

## Dirección

Una interfaz editorial inspirada en materiales y planos de construcción. Fondos cálidos, grafito para el contenido, terracota para las acciones principales y salvia para contexto y estados positivos. La personalidad viene de la composición, las ilustraciones geométricas y la jerarquía tipográfica.

## Implementación

- `src/styles/_variables.scss`: valores SCSS de color, tipografía, espaciado y superficies.
- `src/styles/_tokens.scss`: variables CSS globales; se emiten una sola vez.
- `src/styles/_workspace.scss`: reglas comunes de páginas, tablas, indicadores y cabeceras.
- `src/styles/_auth.scss`: composición compartida de acceso y selección de cuenta.
- `src/app/layout/app-shell`: navegación por rol, contexto de página, menú móvil completo y gestión del foco.
- Portada con ilustración SVG y materiales dibujados con CSS, sin dependencias de imágenes externas.

## Criterios de mantenimiento

1. Mantener una acción principal por sección y usar acciones secundarias de menor contraste.
2. Usar los tokens semánticos para estados; conservar una etiqueta escrita además del color.
3. El contenedor de la aplicación controla el espaciado exterior. Las páginas no deben añadir otro margen de 32 px.
4. Las tablas pueden desplazarse horizontalmente en pantallas pequeñas. La página completa no debe desbordarse.
5. Conservar los indicadores de foco, las etiquetas de botones de icono y la preferencia de movimiento reducido.
6. No presentar estadísticas o testimonios estáticos como datos reales. Las cifras del producto deben proceder de sus servicios.

## Validación

Se revisaron visualmente la portada, el acceso y los paneles de los tres roles, incluyendo diseños a 390, 1280 y 1440 px. Para los paneles se usaron datos locales de prueba en rutas temporales que se retiraron después de la revisión. Esta comprobación visual no equivale a una prueba de integración con el backend.

Las pruebas de navegación cubren el menú móvil completo, su cierre con Escape, el cambio entre escritorio y móvil, los destinos por rol y el acceso al perfil. El test de la raíz comprueba el contenedor real de rutas.
