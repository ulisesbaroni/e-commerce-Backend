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

### Sesiones — `/api/sessions`

| Método | Ruta        | Descripción                                                              |
| ------ | ----------- | -------------------------------------------------------------------------- |
| POST   | `/register` | Crea un usuario (hashea la contraseña con bcrypt y le crea un carrito propio) |
| POST   | `/login`    | Verifica credenciales y devuelve un JWT (también se setea en una cookie `token` httpOnly) |
| GET    | `/current`  | Devuelve los datos del usuario logueado, a partir del JWT                 |
| POST   | `/logout`   | Cierra la sesión (borra la cookie `token`)                                |

Body esperado para `/register`: `first_name`, `last_name`, `email`, `age`, `password`.
Body esperado para `/login`: `email`, `password`.

El JWT vence a la hora. Se puede enviar en la cookie `token` (automático tras el login) o copiarlo del campo `token` de la respuesta y mandarlo como `Cookie: token=<jwt>` en herramientas como Postman/Insomnia.

## Vistas

| Ruta                 | Descripción                                                    |
| --------------------- | --------------------------------------------------------------- |
| `/`                    | Página de inicio                                                 |
| `/login`               | Inicio de sesión                                                 |
| `/register`            | Registro de usuarios                                             |
| `/products`            | Lista paginada de productos, con botón de agregar al carrito (solo `user` logueado) |
| `/products/:pid`       | Detalle de un producto, con botón de agregar al carrito          |
| `/carts/:cid`          | Contenido de un carrito, con los productos poblados              |
| `/admin/products`      | Panel de administración: listado con filtros, activar/desactivar y eliminar (solo `admin`) |
| `/admin/products/new`  | Alta de producto (solo `admin`)                                  |
| `/admin/products/:pid/edit` | Edición de producto (solo `admin`)                          |

La tienda (`/products`) solo muestra los productos activos; un producto desactivado desde el panel deja de ser visible para los clientes.

Cada usuario tiene su propio carrito, que se crea al registrarse. Las cuentas `admin` no tienen carrito: gestionan el catálogo pero no compran.
