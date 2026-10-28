# CRUD Students & Pets

Proyecto NestJS que implementa un **CRUD** para la entidad `Student` y sus `Pet`, con persistencia en **PostgreSQL** mediante **TypeORM**, migraciones versionadas y transacciones con rollback. Los datos se guardan en un volumen de Docker y sobreviven a reinicios.

## Tecnologías

- Node.js LTS + NestJS
- PostgreSQL 16 + TypeORM (migraciones versionadas)
- Docker + Docker Compose (API, PostgreSQL y Adminer)
- HTML + JS + Tailwind CSS

## Resumen funcional

La API expone operaciones CRUD completas sobre estudiantes y mascotas:

**Estudiantes** — `/api/students`

- **Crear**: `POST /api/students` (opcionalmente con `pets[]` para crear el estudiante y sus mascotas en una sola petición)
- **Listar**: `GET /api/students`
- **Buscar por id**: `GET /api/students/:id`
- **Actualizar**: `PATCH /api/students/:id`
- **Eliminar**: `DELETE /api/students/:id` (elimina también sus mascotas)

**Mascotas** — `/api/students/:studentId/pets`

- **Listar**: `GET /api/students/:studentId/pets`
- **Crear**: `POST /api/students/:studentId/pets`
- **Actualizar**: `PATCH /api/students/:studentId/pets/:petId`
- **Eliminar**: `DELETE /api/students/:studentId/pets/:petId`

### Alta de estudiante con mascotas

`POST /api/students` acepta un arreglo opcional `pets`:

```json
{
	"name": "Ana Pérez",
	"username": "ana_perez",
	"email": "ana@example.com",
	"age": 21,
	"pets": [
		{ "name": "Firulais", "species": "perro", "age": 3 },
		{ "name": "Michi", "species": "gato" }
	]
}
```

Si no se envía `pets` (o se envía vacío), el comportamiento es exactamente el mismo de antes.

> **Transacción:** `POST /api/students` (estudiante + mascotas) y `DELETE /api/students/:id` (mascotas + estudiante) se ejecutan en una transacción atómica. Si cualquier paso falla se hace **ROLLBACK** y no queda nada guardado ni huérfano. Ver [Transacciones y rollback](#transacciones-y-rollback).

### Modelo de datos

| Estudiante | Mascota        |
| ---------- | -------------- |
| id (UUID)  | id (UUID)      |
| name       | studentId      |
| username   | name           |
| email      | species        |
| age        | age (opcional) |
| createdAt  | createdAt      |
| updatedAt  | updatedAt      |

### Validación y unicidad

La validación se realiza con `class-validator` a través de un `ValidationPipe` global:

- `name` (estudiante): texto de 3 a 100 caracteres, sin etiquetas HTML.
- `username`: texto de 3 a 30 caracteres, solo minúsculas, números y guiones bajos (`^[a-z0-9_]+$`).
- `email`: dirección de correo electrónico válida.
- `age` (estudiante): entero entre 18 y 99.
- `name` / `species` (mascota): texto de 1 a 50 caracteres, sin etiquetas HTML.
- `age` (mascota): entero entre 0 y 100 (opcional).

Unicidad (rechazado con `409 Conflict`):

- Estudiante: `email` y `username` deben ser únicos.
- Mascota: `name` debe ser único dentro de un mismo estudiante.

## Estándar de respuesta JSON

Toda respuesta de la API — exitosa o de error — usa el mismo **envelope** `ApiResponse`, definido en [`src/shared/response.ts`](src/shared/response.ts). Esto permite que el frontend interprete cualquier respuesta de forma uniforme.

### Envelope común

| Campo       | Tipo                | Descripción                                                               |
| ----------- | ------------------- | ------------------------------------------------------------------------- |
| `code`      | `number`            | Código de estado HTTP (coincide con el status de la respuesta).           |
| `success`   | `boolean`           | `true` si la operación se completó, `false` si hubo error.                |
| `message`   | `string`            | Resumen legible del resultado (varía según el método HTTP).               |
| `timestamp` | `string`            | Fecha/hora en ISO 8601 de la respuesta.                                   |
| `data`      | `object \| null`    | Datos de la operación. Presente en éxito; `null` en errores.              |
| `error`     | `string` (opcional) | Mensaje de error para errores simples (404, 500).                         |
| `errors`    | `object` (opcional) | Errores por campo para validación (400) y conflicto (409). Ver más abajo. |

### Respuestas de éxito

El interceptor global ([`response.interceptor.ts`](src/shared/response.interceptor.ts)) envuelve el retorno de los controladores en `data`:

- **Recurso único** (`GET :id`, `POST`, `PATCH`, `DELETE`): `data` contiene la entidad directamente.
- **Listado** (`GET` colección): `data` contiene `{ total, items }`.

```json
{
	"code": 201,
	"success": true,
	"message": "Recurso creado",
	"timestamp": "2026-09-09T16:49:33.368Z",
	"data": {
		"id": "c3600646-abe8-4be3-8096-d6ad629388e2",
		"name": "Juan Pérez",
		"username": "juanperez",
		"email": "juan@example.com",
		"age": 20,
		"createdAt": "2026-09-09T16:49:33.000Z",
		"updatedAt": "2026-09-09T16:49:33.000Z"
	}
}
```

`message` según el método HTTP:

| Método   | `message`             | `code` |
| -------- | --------------------- | ------ |
| `GET`    | `Operación exitosa`   | 200    |
| `POST`   | `Recurso creado`      | 201    |
| `PATCH`  | `Recurso actualizado` | 200    |
| `DELETE` | `Recurso eliminado`   | 200    |

### Errores simples (404, 500)

Los errores sin detalle por campo usan el campo `error`:

```json
{
	"code": 404,
	"success": false,
	"message": "Estudiante no encontrado",
	"timestamp": "2026-09-09T16:49:53.816Z",
	"data": null,
	"error": "Estudiante no encontrado"
}
```

### Validación (400) y conflicto (409)

Ambos casos comparten el **mismo esquema** para que el frontend los trate igual: el campo `errors` es un mapa `{ campo: { message } }`, donde la clave es el nombre del campo que falla.

```json
{
	"code": 400,
	"success": false,
	"message": "Error de validación",
	"timestamp": "2026-09-09T16:39:30.397Z",
	"data": null,
	"errors": {
		"name": { "message": "El nombre debe tener entre 3 y 100 caracteres" },
		"email": { "message": "El correo electrónico no es válido" }
	}
}
```

```json
{
	"code": 409,
	"success": false,
	"message": "Conflicto con datos existentes",
	"timestamp": "2026-09-09T16:49:45.110Z",
	"data": null,
	"errors": {
		"email": { "message": "El correo electrónico ya está en uso" }
	}
}
```

### Interpretación en el frontend

El cliente estático (`public/`) consume este estándar de forma uniforme:

- `public/js/api.js` expone `api()` (hace `fetch` y devuelve `data` en éxito o lanza el envelope en error) y `normalizeErrors()` (convierte `{ campo: { message } }` en `{ campo: message }`).
- En los formularios, si la respuesta trae `errors`, cada mensaje se muestra bajo su input correspondiente; si trae `error`, se muestra como notificación global (toast).

## Ejecución con Docker (recomendado)

Requisitos: Docker con Docker Compose y `make`.

```bash
git clone https://github.com/ArielCovarrubia/taller-02.git
cd taller-02
make dev        # crea .env si no existe y levanta db + adminer + api
make migrate    # crea las tablas (aplica las migraciones)
```

Con eso quedan activos 3 contenedores:

| Servicio   | Descripción                    | URL                                |
| ---------- | ------------------------------ | ---------------------------------- |
| `api`      | API NestJS (hot reload)        | http://localhost:3000 (docs: /docs) |
| `db`       | PostgreSQL 16                  | `localhost:5432`                   |
| `db-admin` | Adminer (administrador visual) | http://localhost:8080              |

### Credenciales y Admin Visual (Adminer)

Entrar a http://localhost:8080 y completar:

| Campo     | Valor                                                  |
| --------- | ------------------------------------------------------ |
| Sistema   | PostgreSQL                                             |
| Servidor  | `db`                                                   |
| Usuario   | `postgres` (valor de `POSTGRES_USER` en `.env`)        |
| Contraseña| `postgres` (valor de `POSTGRES_PASSWORD` en `.env`)    |
| Base      | `taller02_db` (valor de `POSTGRES_DB` en `.env`)       |

Ahí se ven las tablas `students`, `pets` y `migrations`.

### Comandos (Makefile)

| Comando                | Qué hace                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| `make dev`             | Levanta todo en modo desarrollo (`docker compose --profile dev`)      |
| `make prod`            | Levanta todo en modo producción (imagen ligera, usuario `node`)       |
| `make down`            | Detiene los contenedores **conservando los datos** (volumen)          |
| `make clean`           | Detiene y **borra los volúmenes** (`docker compose down -v`)          |
| `make migrate`         | Aplica las migraciones pendientes (en producción: `make migrate-prod`) |
| `make migrate-show`    | Muestra qué migraciones están aplicadas                               |
| `make migrate-revert`  | Revierte la última migración                                          |
| `make verify-rollback` | Demuestra el rollback de transacciones                                |
| `make logs`            | Muestra los logs de los contenedores                                  |

### Migraciones

El esquema **no** se crea con `synchronize`; se versiona con migraciones de TypeORM en [`src/database/migrations/`](src/database/migrations). La primera crea las tablas `students` y `pets`.

Cuando se modifiquen las entidades, generar una nueva migración (dentro del contenedor de desarrollo) y aplicarla:

```bash
docker compose exec api pnpm run migration:generate src/database/migrations/NombreDelCambio
make migrate
```

### Persistencia

1. `make dev` y `make migrate`.
2. Crear un estudiante (Swagger en http://localhost:3000/docs o Adminer).
3. `make down` y luego `make dev` otra vez: el estudiante sigue ahí, porque los datos viven en el volumen `postgres_data`.
4. `make clean` borra el volumen y, con él, los datos.

### Transacciones y rollback

Las operaciones que modifican más de una tabla usan `runInTransaction` ([`src/shared/transaction.ts`](src/shared/transaction.ts)), que hace `COMMIT` si todo sale bien y `ROLLBACK` si algo falla:

- `DELETE /api/students/:id`: borra las mascotas y luego al estudiante.
- `POST /api/students` con `pets[]`: crea al estudiante y sus mascotas.

Para verificarlo (fuerza errores sobre el código real de la API):

```bash
make verify-rollback
```

Salida esperada:

- Caso 1: el borrado del estudiante falla a mitad de la transacción → aparece `ROLLBACK ejecutado` y el estudiante y sus 2 mascotas siguen intactos.
- Caso 2: se crea un estudiante con dos mascotas del mismo nombre → `409 Conflict` y el estudiante **no** queda guardado.
- Termina con `TODAS LAS VERIFICACIONES PASARON`.

## Ejecución local (sin Docker)

Requiere una PostgreSQL accesible y `DATABASE_URL` definida (ver `.env.example`; con host `localhost` en vez de `db`).

1. Instalar dependencias:

    ```bash
    pnpm install
    ```

2. Levantar el servidor en modo desarrollo:

    ```bash
    pnpm run start:dev
    ```

    O usando Make:

    ```bash
    make install
    make dev-local
    ```

La aplicación queda disponible en:

- `http://localhost:3000`
- `http://localhost:3000/docs`

## Comandos útiles (locales, sin Docker)

- `make dev-local` — arranca NestJS en modo watch
- `make build` — compila el proyecto
- `make lint` — ejecuta ESLint
- `make format` — formatea el código
- `make format-check` — verifica el formato
- `make clean-local` — elimina `dist`, `coverage` y `node_modules`
