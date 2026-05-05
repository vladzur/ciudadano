# Plataforma de Denuncia Ciudadana — Villarrica

Plataforma digital (PWA) para que los residentes de Villarrica reporten incidentes urbanos en tiempo real. Incluye una aplicación ciudadana de baja fricción y un panel administrativo para el equipo del concejal con visualización geográfica, gestión de denuncias y generación de reportes.

## Stack

| Capa | Tecnología |
|---|---|
| **Arquitectura** | Monorepo pnpm workspaces + Turborepo |
| **API** | NestJS (Node.js) en Google Cloud Run |
| **Frontend Ciudadano** | Vue 3 + Vite + Tailwind CSS (PWA) |
| **Backoffice** | Vue 3 + Vite + shadcn-vue + Leaflet.js |
| **Base de Datos** | PostgreSQL 16 + PostGIS 3.4 (Cloud SQL) |
| **Almacenamiento** | Google Cloud Storage |
| **Autenticación** | JWT |
| **Despliegue** | GitHub Actions → Cloud Run |

## Estructura del proyecto

```
ciudadano/
├── apps/
│   ├── api/            # NestJS backend
│   ├── citizen/        # PWA ciudadana (Vue 3)
│   └── backoffice/     # Panel administrativo (Vue 3)
├── packages/
│   ├── database/       # Cliente DB, migraciones y seeds
│   └── shared/         # Tipos y constantes compartidas
├── docker-compose.yml  # PostgreSQL + PostGIS para desarrollo local
├── turbo.json          # Pipeline de build del monorepo
└── pnpm-workspace.yaml
```

## Requisitos

- **Node.js** >= 20
- **pnpm** >= 9.15 (instalar con `corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker** y **Docker Compose** (para la base de datos local)

## Primeros pasos

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url> && cd ciudadano
pnpm install
```

### 2. Configurar variables de entorno

Cada app tiene un archivo `.env.example`. Copialos y ajusta los valores según tu entorno:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/citizen/.env.example apps/citizen/.env
```

### 3. Levantar la base de datos

```bash
docker compose up -d
```

Esto inicia un contenedor con **PostgreSQL 16 + PostGIS 3.4** en el puerto `5432`.

### 4. Ejecutar migraciones y datos de prueba

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Iniciar en modo desarrollo

```bash
pnpm dev
```

Esto arranca los tres servicios en paralelo vía Turborepo:

| Servicio | URL |
|---|---|
| API | `http://localhost:3000` |
| App Ciudadana | `http://localhost:5173` |
| Backoffice | `http://localhost:5174` |

## Scripts disponibles

```bash
pnpm dev           # Inicia todos los servicios en modo watch
pnpm build         # Compila todos los paquetes y apps
pnpm lint          # Ejecuta el linter en todo el monorepo
pnpm test          # Corre los tests unitarios
pnpm clean         # Elimina los directorios dist/
pnpm db:migrate    # Ejecuta las migraciones de la base de datos
pnpm db:seed       # Inserta datos de prueba
```

## Despliegue

El despliegue a Cloud Run se ejecuta automáticamente al hacer push a `main` mediante GitHub Actions. El workflow:

1. Instala dependencias con `pnpm install --frozen-lockfile`
2. Compila el proyecto con `pnpm build`
3. Construye y publica la imagen Docker de la API en Artifact Registry
4. Despliega en Cloud Run (`southamerica-east1`)

Los secretos de entorno (DB_HOST, JWT_SECRET, GCP_SA_KEY, etc.) se configuran en los **Actions Secrets** del repositorio.

## Arquitectura

```
Ciudadano (PWA) ──┐
                   ├──> NestJS API ──> Cloud SQL (PostGIS)
Backoffice (SPA) ──┘                   Cloud Storage (imágenes)
```

- Las imágenes se almacenan en Cloud Storage con acceso mediante **Signed URLs** temporales.
- Las coordenadas geográficas usan **SRID 4326 (WGS84)** para compatibilidad con PostGIS.
- El mapa de calor del backoffice se renderiza con **Leaflet.js + leaflet.heat** sobre OpenStreetMap.
