# E-commerce Backend

Backend de un e-commerce hecho con Express y Mongoose (MongoDB Atlas), con vistas Handlebars. Incluye autenticación con Passport (estrategias local y JWT), roles (`admin` y `user`), recuperación de contraseña por mail, carrito, compra con tickets y una arquitectura en capas: Repository, DAO y DTO.

## Puesta en marcha

Requisitos: **Node.js 22.22 o superior** y una base MongoDB (Atlas).

```bash
npm install
npm run seed   # opcional: carga productos de ejemplo si el catálogo está vacío
npm run dev    # levanta el servidor con nodemon (recarga automática) en http://localhost:8080
```

`npm start` levanta el servidor con Node directamente.

El repositorio incluye un archivo `.env` con las variables necesarias, apuntando a una **base de demostración descartable**. Para usar otra base o desplegar en otro lado, ver [Variables de entorno](#variables-de-entorno).

**Cuentas para probar**

- **Administrador:** `admin@ecommerce.com` / `Admin1234!` (se crea solo al primer arranque). Ve el menú "Administración" con productos, usuarios y ventas.
- **Cliente:** registrarse desde `/register`. Con esa cuenta se prueba el carrito, la compra, "Mis compras" y "¿Olvidaste tu contraseña?".

> Si la app no conecta a la base, el cluster gratuito de Atlas puede estar pausado por inactividad: hay que reanudarlo desde el panel de Atlas.

## Variables de entorno

Se leen del archivo `.env` (la plantilla es `.env.example`):

| Variable | Descripción |
| -------- | ----------- |
| `MONGODB_URI` | Connection string de MongoDB |
| `JWT_SECRET` | Clave con la que se firman los tokens de sesión. Se puede generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador inicial: se crea solo la primera vez que arranca el servidor (si ya existe un usuario con ese email, no se toca) |
| `APP_URL` | URL pública de la app; se usa para armar el enlace del mail de recuperación de contraseña |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Mail real (opcional) |

**Mail.** Si no se define `SMTP_HOST`, los mails se envían a una cuenta de prueba de [Ethereal](https://ethereal.email): no llegan a ninguna casilla real, y el enlace para ver cada mail se imprime en la consola del servidor (`Vista previa del mail (Ethereal): ...`). Para enviar mails reales alcanza con completar las variables `SMTP_*` (por ejemplo `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587` y una contraseña de aplicación).

## Arquitectura

Cada capa solo conoce a la de abajo: **rutas / servicios → repositories → DAO → modelos**.

```
src/
├── app.js            arranque de Express, middlewares y rutas
├── db.js             conexión a MongoDB
├── seed.js           productos de ejemplo (npm run seed)
├── config/           estrategias de Passport, administrador inicial, política de contraseñas
├── middlewares/      autorización por rol (sobre la estrategia "current") y dueño del carrito
├── routes/           API (products, carts, users, tickets, sessions) y vistas
├── services/         lógica de negocio que cruza varias entidades: compra, recuperación de contraseña, mail
├── repositories/     capa de negocio sobre los DAO: es lo único que usan rutas y servicios
├── dao/              acceso a datos: lo único que toca Mongoose
├── models/           esquemas: Product, Cart, User, Ticket
├── dto/              objetos de respuesta: UserDTO, TicketDTO (nunca exponen la contraseña)
├── utils/            helpers de formato
└── views/            plantillas Handlebars (layout y partials)
public/               CSS y JS del navegador
```

## Roles y permisos

| Acción | Anónimo | `user` | `admin` |
| ------ | :-----: | :----: | :-----: |
| Ver catálogo y detalle de productos | Sí | Sí | Sí |
| Registrarse, iniciar sesión, recuperar contraseña | Sí | — | — |
| Agregar al carrito, comprar, ver sus propios tickets | — | Sí | — |
| Crear, editar y eliminar productos | — | — | Sí |
| Gestionar usuarios y cambiar roles | — | — | Sí |
| Ver las ventas de todos los usuarios | — | — | Sí |

Las cuentas `admin` no tienen carrito: gestionan el catálogo pero no compran. Cada `user` tiene su propio carrito, que se crea al registrarse, y solo puede operar sobre ese.

## Endpoints

### Productos — `/api/products`

| Método | Ruta         | Descripción                                                    |
| ------ | ------------ | --------------------------------------------------------------- |
| GET    | `/`          | Lista paginada. Query params: `limit`, `page`, `query` (categoría o `true`/`false` por disponibilidad), `sort` (`asc`/`desc` por precio) |
| GET    | `/:pid`      | Obtener un producto por id                                      |
| POST   | `/`          | Crear un producto (solo `admin`)                                 |
| PUT    | `/:pid`      | Actualizar un producto (solo `admin`)                           |
| DELETE | `/:pid`      | Eliminar un producto (solo `admin`)                              |

### Carritos — `/api/carts`

Todas las rutas con `:cid` requieren estar logueado como `user` y operar sobre el propio carrito; si no, responden 401 o 403.

| Método | Ruta                        | Descripción                                       |
| ------ | --------------------------- | -------------------------------------------------- |
| POST   | `/`                         | Crear un carrito                                   |
| GET    | `/:cid`                     | Ver un carrito, con los productos poblados         |
| POST   | `/:cid/product/:pid`        | Agregar un producto al carrito (404 si no existe, 409 si está desactivado) |
| POST   | `/:cid/purchase`            | Finalizar la compra del carrito (ver más abajo)    |
| DELETE | `/:cid/products/:pid`       | Eliminar un producto del carrito                   |
| PUT    | `/:cid`                     | Reemplazar todos los productos del carrito         |
| PUT    | `/:cid/products/:pid`       | Actualizar la cantidad de un producto               |
| DELETE | `/:cid`                     | Vaciar el carrito                                  |

**Compra (`POST /api/carts/:cid/purchase`).** Cada producto del carrito se compra completo o queda en el carrito:

- Con stock suficiente y producto activo: se descuenta el stock y el producto entra al ticket.
- Sin stock suficiente o desactivado: no se compra y sigue en el carrito.
- Compra completa (todo comprado): `complete: true`. Compra parcial: `complete: false` y `notPurchased` con el motivo de cada producto.
- Si no se puede comprar nada: 409 sin ticket. Carrito vacío: 400.

El stock se descuenta con una operación atómica, así que dos compras simultáneas nunca venden de más; si falla la creación del ticket, el stock se devuelve. Responde `payload.ticket` (con `code`, `purchase_datetime`, `amount`, `purchaser` y los productos comprados), `payload.complete` y `payload.notPurchased`.

### Tickets — `/api/tickets`

Requieren estar logueado. Un `user` ve solo sus compras y un `admin` ve todas las ventas.

| Método | Ruta     | Descripción                                                          |
| ------ | -------- | --------------------------------------------------------------------- |
| GET    | `/`      | Lista paginada (`limit`, `page`), la más reciente primero             |
| GET    | `/:tid`  | Detalle de un ticket (un `user` solo puede ver los suyos, si no responde 403) |

### Usuarios — `/api/users`

Todas las rutas son solo para `admin`. Las respuestas usan un DTO (nunca incluyen la contraseña).

| Método | Ruta     | Descripción                                                                 |
| ------ | -------- | ---------------------------------------------------------------------------- |
| GET    | `/`      | Lista paginada. Query params: `limit`, `page`, `query` (rol `admin`/`user` o texto del email) |
| GET    | `/:uid`  | Obtener un usuario por id                                                    |
| PUT    | `/:uid`  | Actualizar `first_name`, `last_name`, `age`, `email` y/o `role`               |
| DELETE | `/:uid`  | Eliminar un usuario y su carrito                                              |

Reglas: un admin no puede cambiar su propio rol ni eliminarse. Al pasar a `user` un usuario sin carrito (por ejemplo, un admin), se le crea uno.

### Sesiones — `/api/sessions`

| Método | Ruta        | Descripción                                                              |
| ------ | ----------- | -------------------------------------------------------------------------- |
| POST   | `/register` | Crea un usuario (hashea la contraseña con bcrypt y le crea un carrito propio). Body: `first_name`, `last_name`, `email`, `age`, `password` |
| POST   | `/login`    | Verifica credenciales y devuelve un JWT (también se setea en una cookie `token` httpOnly). Body: `email`, `password` |
| GET    | `/current`  | Devuelve los datos del usuario logueado (un `UserDTO`), a partir del JWT  |
| POST   | `/logout`   | Cierra la sesión (borra la cookie `token`)                                |
| POST   | `/forgot-password` | Envía por mail un enlace para restablecer la contraseña. Body: `email`. Responde igual exista o no el email |
| POST   | `/reset-password`  | Establece la contraseña nueva. Body: `token` (del enlace) y `password` |

Las contraseñas deben tener al menos 6 caracteres. El JWT vence a la hora y se envía en la cookie `token` (automático tras el login); en Postman/Insomnia se puede copiar del campo `token` de la respuesta y mandarlo como `Cookie: token=<jwt>`.

**Recuperación de contraseña:** el enlace del mail vence a la hora, sirve una sola vez (al cambiar la contraseña deja de ser válido) y no se puede elegir la misma contraseña que se tenía.

## Vistas

| Ruta                 | Descripción                                                    |
| --------------------- | --------------------------------------------------------------- |
| `/`                    | Página de inicio                                                 |
| `/login`               | Inicio de sesión                                                 |
| `/register`            | Registro de usuarios                                             |
| `/forgot-password`     | Pedir el mail de recuperación de contraseña                      |
| `/reset-password/:token` | Elegir la contraseña nueva (es el enlace que llega por mail)   |
| `/products`            | Lista paginada de productos activos, con botón de agregar al carrito (solo `user` logueado) |
| `/products/:pid`       | Detalle de un producto, con botón de agregar al carrito          |
| `/carts/:cid`          | Mi carrito: cantidades, quitar, vaciar, total y "Finalizar compra" (solo su dueño) |
| `/tickets`             | Mis compras (`user`)                                             |
| `/tickets/:tid`        | Detalle de un ticket (su dueño o un `admin`)                     |
| `/admin/products`      | Panel de administración: listado con filtros, activar/desactivar y eliminar (solo `admin`) |
| `/admin/products/new`  | Alta de producto (solo `admin`)                                  |
| `/admin/products/:pid/edit` | Edición de producto (solo `admin`)                          |
| `/admin/users`         | Panel de administración: listado de usuarios, cambio de rol y eliminación (solo `admin`) |
| `/admin/users/:uid/edit` | Edición de un usuario (solo `admin`)                        |
| `/admin/tickets`       | Panel de administración: ventas de todos los usuarios (solo `admin`) |

Un producto desactivado desde el panel deja de ser visible en la tienda.
