# E-commerce Backend

Backend de un e-commerce hecho con Express y Mongoose (MongoDB Atlas), con vistas Handlebars. Incluye autenticación con Passport (estrategias local y JWT), roles (`admin` y `user`) y una arquitectura en capas: DAO, Repository y DTO.

## Requisitos

- Node.js
- Un cluster de MongoDB Atlas (o cualquier instancia de MongoDB accesible)

## Instalación

```bash
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

```bash
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/ecommerce
JWT_SECRET=<una_cadena_larga_y_aleatoria>
ADMIN_EMAIL=admin@ecommerce.com
ADMIN_PASSWORD=<contraseña_del_administrador>
APP_URL=http://localhost:8080
```

`APP_URL` es la URL pública de la app y se usa para armar el enlace del mail de recuperación de contraseña.

**Mail (opcional).** Si no se define `SMTP_HOST`, los mails se envían a una cuenta de prueba de [Ethereal](https://ethereal.email): no llegan a ninguna casilla real, y el enlace para ver cada mail se imprime en la consola del servidor (`Vista previa del mail (Ethereal): ...`). Para enviar mails reales alcanza con agregar al `.env`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<usuario_smtp>
SMTP_PASS=<contraseña_o_app_password>
MAIL_FROM="Tienda" <no-reply@tienda.com>
```

`ADMIN_EMAIL` y `ADMIN_PASSWORD` definen el administrador inicial: se crea solo la primera vez que arranca el servidor (si ya existe un usuario con ese email, no se toca). Con esa cuenta se ingresa a las funciones de administración.

`JWT_SECRET` es la clave con la que se firman los tokens de sesión. Podés generar una con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Comandos

```bash
npm run dev    # levanta el servidor con nodemon (recarga automática) en http://localhost:8080
npm start      # levanta el servidor con Node directamente
```

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

Todas las rutas con `:cid` requieren estar logueado como `user` y operar sobre el propio carrito (el que se crea al registrarse); si no, responden 401 o 403.

| Método | Ruta                        | Descripción                                       |
| ------ | --------------------------- | -------------------------------------------------- |
| POST   | `/`                         | Crear un carrito                                   |
| GET    | `/:cid`                     | Ver un carrito, con los productos poblados         |
| POST   | `/:cid/product/:pid`        | Agregar un producto al carrito                     |
| DELETE | `/:cid/products/:pid`       | Eliminar un producto del carrito                   |
| PUT    | `/:cid`                     | Reemplazar todos los productos del carrito         |
| PUT    | `/:cid/products/:pid`       | Actualizar la cantidad de un producto               |
| DELETE | `/:cid`                     | Vaciar el carrito                                  |

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
| POST   | `/register` | Crea un usuario (hashea la contraseña con bcrypt y le crea un carrito propio) |
| POST   | `/login`    | Verifica credenciales y devuelve un JWT (también se setea en una cookie `token` httpOnly) |
| GET    | `/current`  | Devuelve los datos del usuario logueado, a partir del JWT                 |
| POST   | `/logout`   | Cierra la sesión (borra la cookie `token`)                                |
| POST   | `/forgot-password` | Envía por mail un enlace para restablecer la contraseña. Body: `email`. Responde igual exista o no el email |
| POST   | `/reset-password`  | Establece la contraseña nueva. Body: `token` (del enlace) y `password` |

Recuperación de contraseña: el enlace del mail vence a la hora, sirve una sola vez (al cambiar la contraseña deja de ser válido) y no se puede elegir la misma contraseña que se tenía. Las contraseñas deben tener al menos 6 caracteres.

Body esperado para `/register`: `first_name`, `last_name`, `email`, `age`, `password`.
Body esperado para `/login`: `email`, `password`.

El JWT vence a la hora. Se puede enviar en la cookie `token` (automático tras el login) o copiarlo del campo `token` de la respuesta y mandarlo como `Cookie: token=<jwt>` en herramientas como Postman/Insomnia.

## Vistas

| Ruta                 | Descripción                                                    |
| --------------------- | --------------------------------------------------------------- |
| `/`                    | Página de inicio                                                 |
| `/login`               | Inicio de sesión                                                 |
| `/register`            | Registro de usuarios                                             |
| `/forgot-password`     | Pedir el mail de recuperación de contraseña                      |
| `/reset-password/:token` | Elegir la contraseña nueva (es el enlace que llega por mail)   |
| `/products`            | Lista paginada de productos, con botón de agregar al carrito (solo `user` logueado) |
| `/products/:pid`       | Detalle de un producto, con botón de agregar al carrito          |
| `/carts/:cid`          | Contenido de un carrito, con los productos poblados              |
| `/admin/products`      | Panel de administración: listado con filtros, activar/desactivar y eliminar (solo `admin`) |
| `/admin/products/new`  | Alta de producto (solo `admin`)                                  |
| `/admin/products/:pid/edit` | Edición de producto (solo `admin`)                          |
| `/admin/users`         | Panel de administración: listado de usuarios, cambio de rol y eliminación (solo `admin`) |
| `/admin/users/:uid/edit` | Edición de un usuario (solo `admin`)                        |

La tienda (`/products`) solo muestra los productos activos; un producto desactivado desde el panel deja de ser visible para los clientes.

Cada usuario tiene su propio carrito, que se crea al registrarse. Las cuentas `admin` no tienen carrito: gestionan el catálogo pero no compran.
