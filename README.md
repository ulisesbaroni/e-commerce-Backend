# E-commerce Backend

Backend de un e-commerce hecho con Express, Mongoose (MongoDB Atlas) y Socket.IO, con vistas Handlebars. Incluye autenticación de usuarios con Passport (estrategias local y JWT).

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
```

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
| POST   | `/`          | Crear un producto                                                |
| PUT    | `/:pid`      | Actualizar un producto                                          |
| DELETE | `/:pid`      | Eliminar un producto                                             |

### Carritos — `/api/carts`

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

Body esperado para `/register`: `first_name`, `last_name`, `email`, `age`, `password`.
Body esperado para `/login`: `email`, `password`.

El JWT vence a la hora. Se puede enviar en la cookie `token` (automático tras el login) o copiarlo del campo `token` de la respuesta y mandarlo como `Cookie: token=<jwt>` en herramientas como Postman/Insomnia.

## Vistas

| Ruta                 | Descripción                                                    |
| --------------------- | --------------------------------------------------------------- |
| `/`                    | Lista estática de productos                                     |
| `/realtimeproducts`    | Lista de productos en tiempo real (crear/eliminar vía Socket.IO) |
| `/products`            | Lista paginada de productos, con botón de agregar al carrito     |
| `/products/:pid`       | Detalle de un producto, con botón de agregar al carrito          |
| `/carts/:cid`          | Contenido de un carrito, con los productos poblados              |

El carrito asociado al navegador se guarda en una cookie (`cartId`) y se crea automáticamente en la primera visita a `/products` o `/products/:pid`.
