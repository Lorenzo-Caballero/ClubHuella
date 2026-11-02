# Pendientes antes de publicar Club Huella

- [x] Rotar la contraseña de la base de datos: marcado como listo por indicación del usuario; no verificado desde este entorno.
- [ ] Configurar las nuevas credenciales en `../config.php` en el servidor (fuera de `public_html`) o en variables de entorno privadas: `DB_HOST`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. No subir ese archivo al repositorio ni enviar secretos por chat.
- [x] `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH` configurados en el `config.php` privado según indicó el usuario; falta validar el inicio de sesión después de subir el código nuevo. No guardar ni compartir la clave.
- [ ] Configurar `MP_ACCESS_TOKEN` y `ENVIA_API_KEY` en el `config.php` privado del servidor.
- [ ] Definir el mismo precio vigente en frontend (`REACT_APP_TSHIRT_PRICE`) y backend (`CLUB_HUELLA_PRECIO_REMERA`). El valor de desarrollo actual es ARS 44.900.
- [ ] Configurar `REACT_APP_META_PIXEL_ID` con el ID correcto del Pixel de Meta y volver a generar el build. Verificar los eventos en Meta Events Manager después del despliegue.
- [x] Conectar el acceso de `/admin-pedidos` con la sesión del servidor y enviar CSRF en cambios. La vista `/admin` de analítica y configuración sigue siendo un prototipo local; falta conectarla con datos y preferencias reales.
- [ ] Verificar en la base real la columna opcional `archivo_impresion` y la ruta de cada arte. En esta rama, `/admin-pedidos` ya usa pedidos reales tras iniciar sesión; el endpoint protegido busca el PNG por esa columna o por el nombre `generados/impresion_pedido_{id}_v2.png` y permite descargar el original o el DTF. Falta comprobarlo con archivos reales en Hostinger y decidir si se agrega la columna a la tabla.
- [ ] Hacer que el precio del panel se sincronice con el precio público (`REACT_APP_TSHIRT_PRICE`) y el backend (`CLUB_HUELLA_PRECIO_REMERA`). En la vista previa local, cambiarlo solo actualiza el cálculo estimado guardado en el navegador; no cambia el precio de compra.
- [x] Añadir en la rama sesión del servidor y comprobación CSRF para las acciones administrativas (`listar`, `pedido`, `crear`, `actualizar`, `eliminar`); sin credenciales admin configuradas, el login falla cerrado. Falta desplegar y verificar en Hostinger.
- [ ] Guardar métricas reales del embudo en servidor. El prototipo local no consulta la base ni recibe eventos reales.
- [ ] Verificar en la base real la rutina `sp_registrar_pedido` y su uso con el carrito múltiple: la rama ya llama una vez por remera y se corrigió una segunda inserción heredada que podía duplicar pedidos. Falta validar con la rutina/esquema real y una compra de prueba que todas las líneas queden ligadas al mismo pago/referencia externa.
- [ ] Confirmar con el estampador el tamaño final de estampa (la salida actual queda en 29,7 × 39,8 cm), su RIP/perfil de color y el LPI que acepta. El valor por defecto actual es 22 LPI; ajustar `HALFTONE_LPI` si el proveedor indica otro.
- [ ] Controlar el costo de generación con `GEMINI_IMAGE_SIZE=4K`. Se eligió para producir 3584 × 4800 px y preparar una estampa frontal a 300 ppp; este modo consume más que la resolución 1K anterior.
- [ ] Publicar el frontend y los archivos PHP del cambio en un entorno de prueba/producción configurado, y completar una compra de prueba con Mercado Pago y envío. No se hizo ninguna compra real durante esta implementación.
- [ ] Confirmar en Hostinger que el directorio privado `meta_pagos` y el directorio de imágenes tengan permisos de escritura, y que `config.php` quede fuera del acceso web.

El carrito para varias remeras y el registro de una fila por unidad están implementados en la rama `codex/brand-purchase-preview`. La publicación queda pendiente hasta completar la configuración segura y las verificaciones externas anteriores.
