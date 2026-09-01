# Plataforma de Denuncia Ciudadana — Villarrica

Plataforma digital (PWA) para que los residentes de Villarrica reporten incidentes urbanos en tiempo real. Incluye una aplicación ciudadana de baja fricción y un panel administrativo para el equipo del concejal con visualización geográfica, gestión de denuncias y generación de reportes.

## Stack

| Capa | Tecnología |
|---|---|
| **Arquitectura** | Monorepo pnpm workspaces + Turborepo |
| **API** | NestJS (Node.js) en Google Cloud Run |
| **Frontend Ciudadano** | Vue 3 + Vite + Tailwind CSS (PWA) |
| **Backoffice** | Vue 3 + Vite + shadcn-vue + Leaflet.js |
| **Base de Datos** | Firestore (Firebase, región `southamerica-west1`) |
| **Almacenamiento** | Google Cloud Storage |
| **Autenticación** | Firebase Auth (ciudadanos) + JWT (backoffice) |
| **Despliegue** | GitHub Actions → Cloud Run + Firebase Hosting |

## Estructura del proyecto

```
ciudadano/
├── apps/
│   ├── api/            # NestJS backend
│   ├── citizen/        # PWA ciudadana (Vue 3)
│   └── backoffice/     # Panel administrativo (Vue 3)
├── packages/
│   └── shared/         # Tipos y constantes compartidas
├── firestore.rules         # Reglas de seguridad de Firestore (deny-all, acceso vía Admin SDK)
├── firestore.indexes.json  # Índices compuestos de Firestore
├── turbo.json          # Pipeline de build del monorepo
└── pnpm-workspace.yaml
```

## Requisitos

- **Node.js** >= 20
- **pnpm** >= 9.15 (instalar con `corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Firebase CLI** (`npm install -g firebase-tools`) para emuladores y despliegues

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

### 3. Levantar los emuladores de Firebase

```bash
firebase use villarrica-ciudadano
firebase emulators:start
```

Esto inicia los emuladores de **Auth** (9099), **Storage** (9199) y **Firestore** (8080) con la UI de emuladores en `http://localhost:4000`.

### 4. Insertar datos de prueba

```bash
pnpm db:seed
```

Crea el usuario admin de prueba (`admin@villarrica.cl` / `admin123`) y 5 denuncias de ejemplo en Villarrica.

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
pnpm db:seed       # Inserta datos de prueba en Firestore (emulador o producción)
```

## Despliegue

El despliegue a Cloud Run se ejecuta automáticamente al publicar una release mediante GitHub Actions. El workflow:

1. Instala dependencias con `pnpm install --frozen-lockfile`
2. Compila el proyecto con `pnpm build`
3. Construye y publica la imagen Docker de la API en Artifact Registry
4. Despliega la API en Cloud Run (`southamerica-west1`) con la service account `cloud-run-api@villarrica-ciudadano.iam.gserviceaccount.com`
5. Despliega los frontends a Firebase Hosting

Los secretos de entorno (GCS_BUCKET, JWT_SECRET, GCP_SA_KEY, VITE_FIREBASE_*, etc.) se configuran en los **Actions Secrets** del repositorio.

## Arquitectura

```
Ciudadano (PWA) ──┐
                   ├──> NestJS API ──> Firestore (denuncias, usuarios, notas)
Backoffice (SPA) ──┘                   Cloud Storage (imágenes)
                                        Firebase Auth (Google/Facebook)
```

- Las imágenes se almacenan en Cloud Storage con acceso mediante **Signed URLs** temporales.
- Las coordenadas geográficas se guardan como `{ lat, lng }` (WGS84) en Firestore.
- El mapa de calor del backoffice se renderiza con **Leaflet.js + leaflet.heat** sobre OpenStreetMap.
- Todo el acceso a Firestore se realiza vía **Admin SDK** desde la API; las reglas de seguridad niegan el acceso directo de clientes.
