# Arquitectura Técnica — Plataforma de Denuncia Ciudadana Villarrica

> Documento generado el 2026-05-16. Actualizado el 2026-08-26 (migración de PostgreSQL a Firestore).

## 1. Visión General

Plataforma digital (PWA) que permite a los residentes de Villarrica reportar incidentes urbanos en tiempo real. Consta de tres aplicaciones desplegadas en Google Cloud: una API NestJS en Cloud Run, una PWA ciudadana (Vue 3) expuesta en Firebase Hosting, y un panel administrativo (Vue 3) también en Firebase Hosting. La base de datos es Firestore (Firebase, región `southamerica-west1`), con imágenes almacenadas en Cloud Storage y accedidas mediante Signed URLs.

### Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        Firebase Hosting                         │
│  ┌──────────────────────┐   ┌──────────────────────┐            │
│  │  Citizen (PWA)       │   │  Backoffice (SPA)    │            │
│  │  Vue 3 + Vite        │   │  Vue 3 + Vite        │            │
│  │  Tailwind CSS        │   │  Leaflet + Pinia     │            │
│  │  Firebase Auth       │   │  JWT (admin/staff)   │            │
│  └──────────┬───────────┘   └──────────┬───────────┘            │
└─────────────┼──────────────────────────┼────────────────────────┘
              │     HTTPS (api/v1)       │
              ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cloud Run (serverless)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  NestJS API (:3000)                                       │  │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────────┐ ┌────────┐   │  │
│  │  │ Auth     │ │ Reports   │ │ Analytics    │ │ Storage│   │  │
│  │  │ Module   │ │ Module    │ │ Module       │ │ Module │   │  │
│  │  └────┬─────┘ └─────┬─────┘ └──────┬───────┘ └───┬────┘   │  │
│  │       │             │              │              │       │  │
│  │       └─────────────┴──────────────┴──────────────┘       │  │
│  │                           │                               │  │
│  │                  FirebaseModule (global)                  │  │
│  │                  Firebase Admin SDK (Firestore)           │  │
│  └───────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ gRPC (red pública)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firestore (modo Native)                      │
│  Colecciones: reports, reports/{id}/notes, admin_users,         │
│  citizen_users — región southamerica-west1 (Santiago)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       Cloud Storage                             │
│  Bucket: reports/{uuid}.{ext} — imágenes privadas               │
│  Acceso: Signed URLs temporales (V4, 15 min expiración)         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Auth                              │
│  Proveedores OAuth: Google, Facebook                            │
│  Emulador local: auth:9099                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Estructura del Monorepo

```
ciudadano/
├── apps/
│   ├── api/                    # NestJS backend (Node 20, ESM)
│   │   ├── src/
│   │   │   ├── main.ts                       # Bootstrap: CORS, ValidationPipe
│   │   │   ├── app.module.ts                 # Módulo raíz
│   │   │   ├── config/configuration.ts       # Validación de env vars con Joi
│   │   │   ├── common/
│   │   │   │   ├── decorators/roles.decorator.ts
│   │   │   │   ├── filters/http-exception.filter.ts
│   │   │   │   └── interceptors/transform.interceptor.ts
│   │   │   ├── testing/firestore.mock.ts     # Mock de Firestore para tests unitarios
│   │   │   ├── scripts/seed.ts               # Datos de prueba para Firestore
│   │   │   └── modules/
│   │   │       ├── firebase/       # Módulo global: init Admin SDK (App + Firestore)
│   │   │       ├── auth/           # Autenticación JWT (backoffice) + Firebase (ciudadanos)
│   │   │       ├── reports/        # CRUD de denuncias
│   │   │       ├── reports-analytics/  # Analytics, heatmap, PDF, Excel
│   │   │       ├── storage/        # Google Cloud Storage + Signed URLs
│   │   │       └── health/         # Health check para Cloud Run
│   │   ├── Dockerfile              # Multi-stage build con pnpm deploy
│   │   └── package.json
│   ├── citizen/                # PWA Vue 3 + Vite + Tailwind CSS 4
│   │   ├── src/
│   │   │   ├── main.ts / App.vue
│   │   │   ├── firebase.ts              # Inicialización Firebase Auth
│   │   │   ├── router/index.ts          # Vue Router + guard de autenticación
│   │   │   ├── views/                   # LoginView, HomeView, SuccessView
│   │   │   ├── components/              # ReportForm, CategorySelector, CameraCapture, LocationDisplay
│   │   │   ├── composables/             # useCitizenAuth, useReport, useGeolocation, useCamera
│   │   │   ├── services/api.ts          # Axios client con interceptors JWT
│   │   │   └── styles/main.css          # Tailwind CSS
│   │   ├── certs/                       # TLS local (key.pem, cert.pem)
│   │   ├── vite.config.ts              # Vite + PWA plugin + proxy API
│   │   └── package.json
│   └── backoffice/             # SPA Vue 3 + Vite + shadcn-vue + Leaflet
│       ├── src/
│       │   ├── main.ts / App.vue
│       │   └── ...
│       ├── vite.config.ts
│       └── package.json
├── packages/
│   ├── shared/                 # Tipos, interfaces, constantes compartidas
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types/report.ts          # IReport, IInternalNote, ReportStatus, ReportCategory
│   │   │   ├── types/user.ts            # IAdminUser, ICitizenUser, JwtPayload, DTOs
│   │   │   ├── types/api.ts             # ApiResponse<T>, PaginatedResponse<T>, DTOs
│   │   │   └── constants/categories.ts  # CATEGORIES con íconos
│   │   └── package.json
├── firestore.rules            # Reglas de Firestore (deny-all, acceso solo vía Admin SDK)
├── firestore.indexes.json     # Índices compuestos de Firestore
├── firebase.json               # Emuladores + hosting targets (citizen, backoffice)
├── .firebaserc                 # Proyecto: villarrica-ciudadano
├── turbo.json                  # Pipeline: build, dev, lint, test, clean
├── pnpm-workspace.yaml         # apps/* packages/*
├── tsconfig.base.json          # TS config base (ES2022, ESNext, bundler)
└── package.json                # Root scripts via Turbo
```

### Dependencia entre paquetes

```
@ciudadano/shared  (sin dependencias internas)
        ▲
        │
@ciudadano/api  ─── depende de @ciudadano/shared
@ciudadano/citizen  ─── depende de @ciudadano/shared
@ciudadano/backoffice  ─── depende de @ciudadano/shared
```

---

## 3. Base de Datos (Firestore)

### 3.1 Motor

- **Firestore en modo Native**, ubicación regional **`southamerica-west1`** (Santiago de Chile)
- Acceso exclusivo vía **Firebase Admin SDK** desde la API; las reglas (`firestore.rules`) niegan todo acceso directo de clientes
- Coordenadas **WGS84** como par de números `{ lat, lng }` (no se requieren consultas espaciales)

### 3.2 Modelo de datos

#### Colección `reports` (denuncias ciudadanas)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` (doc ID) | `string` (UUID v4) | Generado con `crypto.randomUUID()` |
| `description` | `string` | Texto libre de la denuncia |
| `location` | `{ lat: number, lng: number }` | Coordenadas WGS84 |
| `imageUrl` | `string \| null` | Object key en GCS (ruta relativa, no URL pública) |
| `category` | `string` | Categoría enumerada |
| `status` | `string` | `pending`, `in_progress`, `resolved` |
| `citizenUserId` | `string \| null` | firebase_uid del ciudadano que creó la denuncia |
| `createdAt` | `Timestamp` | `FieldValue.serverTimestamp()` |
| `updatedAt` | `Timestamp` | Actualizado en cada cambio de estado |

#### Subcolección `reports/{reportId}/notes` (notas de seguimiento)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` (doc ID) | `string` (UUID v4) | |
| `reportId` | `string` | ID del reporte padre (redundante) |
| `content` | `string` | |
| `createdBy` | `string` | Email del admin/staff |
| `createdAt` | `Timestamp` | |

#### Colección `admin_users` (usuarios del backoffice)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` (doc ID) | `string` (UUID v4) | |
| `email` | `string` | Búsqueda con `where("email", "==")` |
| `password` | `string` | Hash bcrypt (10 rounds) |
| `name` | `string` | |
| `role` | `string` | `admin` o `staff` |
| `status` | `string` | `pending`, `active`, `rejected` |
| `createdAt` | `Timestamp` | |

#### Colección `citizen_users` (ciudadanos autenticados vía Firebase)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` (doc ID) | `string` (= firebase_uid) | Permite upsert directo con `.doc(uid)` |
| `email` | `string \| null` | Email del proveedor OAuth |
| `displayName` | `string \| null` | Nombre público |
| `provider` | `string` | `google.com`, `facebook.com` |
| `createdAt` | `Timestamp` | Solo en el primer registro |
| `lastLogin` | `Timestamp` | Actualizado en cada login |

### 3.3 Índices compuestos

Definidos en `firestore.indexes.json` y desplegados con `firebase deploy --only firestore:indexes`:

1. `reports`: (status ASC, createdAt DESC, `__name__` DESC)
2. `reports`: (category ASC, createdAt DESC, `__name__` DESC)
3. `reports`: (status ASC, category ASC, createdAt DESC, `__name__` DESC)
4. `reports`: (createdAt DESC, `__name__` DESC)

### 3.4 Mapeo de API

Los repositorios convierten `Timestamp` a ISO strings y camelCase a snake_case para preservar el contrato de la API (`created_at`, `image_url`, `display_name`, etc.). La paginación por página del backoffice se implementa con agregación `count()` + cursor walk (`startAfter`), manteniendo intacto `PaginatedResponse`. Heatmap y estadísticas agregan en memoria tras leer los documentos (escala municipal).

---

## 4. Backend (NestJS API)

### 4.1 Stack

| Componente | Tecnología |
|---|---|
| Framework | NestJS 10 (Node.js 20, ESM) |
| Validación | class-validator + class-transformer (ValidationPipe global) |
| Autenticación | Passport + JWT (backoffice), Firebase Admin SDK (ciudadanos) |
| Base de datos | Firestore vía Firebase Admin SDK (sin ORM) |
| Almacenamiento | @google-cloud/storage |
| Reporting | PDFKit (PDF), ExcelJS (Excel) |
| Configuración | @nestjs/config + Joi validation |

### 4.2 Pipeline de Request

```
Request → CORS → GlobalPrefix (api/v1) → ValidationPipe
  → Controller (con Guards y Decorators)
    → Service (lógica de negocio)
      → Repository (Firestore vía Admin SDK)
    → Interceptor (envuelve respuesta en ApiResponse)
  → ExceptionFilter (errores estandarizados)
→ Response
```

### 4.3 Módulos

#### AuthModule (`/api/v1/auth`)

| Endpoint | Método | Guard | Roles | Descripción |
|---|---|---|---|---|
| `/auth/login` | POST | — | — | Login backoffice: email + password → JWT |
| `/auth/register` | POST | — | — | Registro backoffice (estado `pending`) |
| `/auth/citizen` | POST | — | — | Intercambia Firebase ID Token por JWT ciudadano |
| `/auth/users` | GET | JWT + Roles | `admin` | Listar usuarios backoffice |
| `/auth/users/:id/status` | PATCH | JWT + Roles | `admin` | Aprobar/rechazar usuario |
| `/auth/users/:id/role` | PATCH | JWT + Roles | `admin` | Cambiar rol (admin/staff) |
| `/auth/users/:id` | DELETE | JWT + Roles | `admin` | Eliminar usuario |

**Flujo de autenticación:**
1. **Backoffice:** Login con email/password → bcrypt verify → genera accessToken (JWT, 15min) + refreshToken (JWT, 7d)
2. **Ciudadano:** Login OAuth (Google/Facebook) vía Firebase Auth en el frontend → envía Firebase ID Token al backend → backend verifica con Firebase Admin SDK → upsert en `citizen_users` → emite JWT propio con claim `role: "citizen"`

**Guards:**
- `JwtAuthGuard` — Extiende `AuthGuard('jwt')` de Passport
- `RolesGuard` — Lee metadata `@Roles()` del decorador y compara con `req.user.role`
- `JwtStrategy` — Extrae token del header `Authorization: Bearer <token>`, valida firma y expiración

#### ReportsModule (`/api/v1/reports`)

| Endpoint | Método | Guard | Roles | Descripción |
|---|---|---|---|---|
| `/reports` | POST | JWT | (cualquiera) | Crear denuncia con imagen opcional (multipart) |
| `/reports` | GET | JWT + Roles | `admin`, `staff` | Listar con filtros y paginación |
| `/reports/:id` | GET | JWT + Roles | `admin`, `staff` | Detalle con notas internas |
| `/reports/:id/status` | PATCH | JWT + Roles | `admin`, `staff` | Cambiar estado |
| `/reports/:id/notes` | POST | JWT + Roles | `admin`, `staff` | Añadir nota de seguimiento |

**Validaciones en creación de denuncia:**
- Imagen: solo JPEG, PNG, WebP; máximo 10MB
- Coordenadas: requeridas, almacenadas como `{ lat, lng }` (WGS84) en Firestore
- Descripción: texto libre hasta 2000 caracteres

#### ReportsAnalyticsModule

| Endpoint | Método | Guard | Roles | Descripción |
|---|---|---|---|---|
| `/reports/analytics/heatmap` | GET | JWT + Roles | `admin`, `staff` | Datos para mapa de calor (lat, lng, intensity) |
| `/reports/analytics/stats` | GET | JWT + Roles | `admin`, `staff` | KPIs: total, byStatus, byCategory |
| `/reports/export/pdf` | GET | JWT + Roles | `admin`, `staff` | Descarga PDF de reporte |
| `/reports/export/excel` | GET | JWT + Roles | `admin`, `staff` | Descarga Excel de reporte |
| `/storage/signed-url/:key(*)` | GET | JWT + Roles | `admin`, `staff` | Genera Signed URL para imagen (wildcard en ruta) |

**Intensidad del mapa de calor:** `pending=1.0`, `in_progress=0.5`, `resolved=0.1`

#### StorageModule

- Servicio injectable usado por ReportsModule y ReportsAnalyticsModule
- `uploadImage(file)` → sube buffer a GCS, retorna object key (no URL pública)
- `getSignedUrl(objectKey)` → genera Signed URL V4 con 15 minutos de expiración
- Soporta dos modos de autenticación GCP:
  1. **Service Account Key** (`GCS_SERVICE_ACCOUNT_KEY`): Credenciales explícitas para firma local de Signed URLs
  2. **ADC (Application Default Credentials)**: Requiere permiso `signBlob` en el service account de Cloud Run

#### HealthModule (`/api/v1/health`)

- `GET /health` → Verifica conectividad con Firestore (query `limit(1)` a la colección `reports`)
- Retorna `{ status: "ok" | "degraded", timestamp, firestore: boolean }`
- Usado por Cloud Run para health checks y por el pipeline de deploy para verificar despliegue exitoso

### 4.4 Cross-cutting Concerns

- **TransformInterceptor:** Envuelve respuestas exitosas en `{ success: true, data }` automáticamente
- **HttpExceptionFilter:** Estandariza errores como `{ success: false, message, statusCode }`
- **ValidationPipe:** Global, con `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- **CORS:** Configurado desde `CORS_ORIGINS` env var (orígenes separados por coma)

---

## 5. Frontend Ciudadano (PWA)

### 5.1 Stack

| Componente | Tecnología |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build | Vite 6 |
| Estilos | Tailwind CSS 4 |
| Router | Vue Router 4 (history mode) |
| HTTP | Axios con interceptors |
| Auth | Firebase Auth SDK (Google, Facebook OAuth) |
| PWA | vite-plugin-pwa (Workbox, autoUpdate) |
| Testing | Vitest + @vue/test-utils + happy-dom |

### 5.2 Rutas

| Ruta | Componente | Auth | Descripción |
|---|---|---|---|
| `/login` | LoginView (lazy) | No | Login con Google/Facebook |
| `/` | HomeView | Sí | Formulario de denuncia (3 pasos) |
| `/success` | SuccessView | Sí | Confirmación post-envío |

### 5.3 Flujo de Datos

```
1. Usuario abre la app → LoginView
2. Login con Google/Facebook (Firebase Auth popup)
3. onAuthStateChanged detecta login → obtiene Firebase ID Token
4. POST /api/v1/auth/citizen → intercambia por JWT propio
5. JWT almacenado en localStorage ("citizenAccessToken")
6. Axios interceptor adjunta Bearer token en cada request
7. Formulario 3 pasos: Categoría → Descripción + Foto → Confirmación
8. POST /api/v1/reports (multipart/form-data) con JWT
9. Redirección a /success
```

### 5.4 Composables

| Composable | Responsabilidad |
|---|---|
| `useCitizenAuth` | Estado de autenticación, login/logout Google/Facebook, intercambio de token |
| `useGeolocation` | `navigator.geolocation.getCurrentPosition()` con high accuracy |
| `useCamera` | `navigator.mediaDevices.getUserMedia()` para cámara trasera (environment) |
| `useReport` | Estado de envío del formulario, llamada a `submitReport()` |

### 5.5 PWA

- `vite-plugin-pwa` con `registerType: "autoUpdate"`
- Service worker con Workbox: cache NetworkFirst para llamadas API (50 entries, 5 min TTL), precache de assets estáticos
- Manifiesto: `Denuncia Ciudadana Villarrica`, tema verde (#1a5632), display standalone

### 5.6 Desarrollo Local

- Vite server con HTTPS (certificados locales en `certs/`)
- Proxy `/api` → `http://localhost:3000`
- Alias `@ciudadano/shared` → apunta directamente al source TS (sin compilar)

---

## 6. Frontend Backoffice (SPA)

### 6.1 Stack

| Componente | Tecnología |
|---|---|
| Framework | Vue 3 (Composition API) |
| Build | Vite 6 |
| Estilos | Tailwind CSS 4 + shadcn-vue |
| Estado | Pinia |
| Mapas | Leaflet.js + leaflet.heat |
| Router | Vue Router 4 |
| HTTP | Axios |
| Testing | Vitest + @pinia/testing |

### 6.2 Funcionalidades Clave

- **Dashboard** con KPIs (total denuncias, por estado, por categoría)
- **Mapa de calor** con Leaflet.js + leaflet.heat sobre OpenStreetMap
- **Listado de denuncias** con paginación y filtros (estado, categoría, fecha)
- **Detalle de denuncia** con notas internas, cambio de estado
- **Gestión de usuarios** (solo admin): aprobar/rechazar registros, cambiar roles
- **Exportación** de reportes en PDF y Excel
- **Visualización de imágenes** mediante Signed URLs temporales

---

## 7. Infraestructura y Despliegue

### 7.1 Google Cloud

| Recurso | Tecnología | Región | Notas |
|---|---|---|---|
| API | Cloud Run | `southamerica-west1` | Serverless, auto-escalado, SA `cloud-run-api` |
| DB | Firestore | `southamerica-west1` | Modo Native, acceso vía Admin SDK |
| Imágenes | Cloud Storage | — | Bucket privado, Signed URLs |
| Docker | Artifact Registry | `southamerica-west1` | Imágenes de la API |
| Frontends | Firebase Hosting | — | 2 sites: citizen, backoffice |
| Auth ciudadana | Firebase Auth | — | Google + Facebook OAuth |

### 7.2 CI/CD (GitHub Actions)

**Pipeline de CI** (`ci.yml` — se ejecuta en cada PR a `master`):
1. `lint` — `pnpm lint` (type-check en todos los paquetes)
2. `test` — `pnpm test` (tests unitarios)
3. `build` — `pnpm build` (compilación completa)

**Pipeline de Deploy** (`deploy.yml` — se ejecuta al publicar un release o manualmente):
1. `build` — Instala y compila todos los paquetes
2. `deploy-api` — Construye imagen Docker, push a Artifact Registry, deploy a Cloud Run con service account dedicada, health check
3. `deploy-frontends` — Build de citizen y backoffice en paralelo (matrix), deploy a Firebase Hosting

**Pipeline de Rollback** (`rollback.yml` — manual):
- Recibe una revisión de Cloud Run como input
- Redirige el 100% del tráfico a esa revisión
- Verifica health check post-rollback

### 7.3 Docker (API)

Multi-stage build optimizado:
1. **Etapa builder:** Copia archivos de workspace, instala dependencias con `pnpm install --frozen-lockfile`, compila con `pnpm build`, ejecuta `pnpm deploy` para extraer solo dependencias de producción
2. **Etapa producción:** Imagen mínima `node:20-alpine`, solo `dist/` y `node_modules` de producción

### 7.4 Variables de Entorno

| Variable | API | Citizen | Backoffice |
|---|---|---|---|
| `NODE_ENV` | ✓ | | |
| `PORT` | ✓ | | |
| `GCS_BUCKET` | ✓ | | |
| `GCS_PROJECT_ID` | ✓ | | |
| `GCS_SERVICE_ACCOUNT_KEY` | ✓ (JSON) | | |
| `JWT_SECRET` | ✓ | | |
| `JWT_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | ✓ | | |
| `CORS_ORIGINS` | ✓ | | |
| `FIREBASE_AUTH_EMULATOR_HOST` | ✓ (dev) | | |
| `FIRESTORE_EMULATOR_HOST` | ✓ (dev) | | |
| `VITE_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/APP_ID` | | ✓ (build) | |
| `VITE_API_URL` | | ✓ (build) | ✓ (build) |

---

## 8. Seguridad

### 8.1 Autenticación y Autorización

- **Ciudadanos:** Firebase Auth (Google/Facebook OAuth) → intercambio por JWT propio del backend. El JWT tiene claim `role: "citizen"` y permite crear denuncias.
- **Backoffice:** Login con email/password + bcrypt. JWT con claims `role: "admin"` o `role: "staff"`. Endpoints protegidos con `JwtAuthGuard` + `RolesGuard`.
- **Registro backoffice:** Nuevos usuarios registran con estado `pending`. Solo un `admin` puede aprobarlos (`active`) o rechazarlos (`rejected`).

### 8.2 Protección de Datos

- **Imágenes privadas:** Cloud Storage sin acceso público. Solo accesibles mediante Signed URLs V4 temporales (15 minutos).
- **Contraseñas:** Hasheadas con bcrypt (10 rounds).
- **JWT:** Firmados con secreto configurable, expiración de 15 minutos para access tokens, 7 días para refresh tokens.

### 8.3 Endpoints

- `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted` previene inyección de propiedades no deseadas
- Acceso a Firestore únicamente vía Admin SDK; las reglas de seguridad (`firestore.rules`) niegan todo acceso directo de clientes
- Rate limiting no implementado actualmente (delegado a Cloud Run / load balancer si se requiere)

---

## 9. Desarrollo Local

### 9.1 Requisitos

- Node.js >= 20
- pnpm >= 9.15
- Firebase CLI (`firebase-tools`)

### 9.2 Inicio rápido

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/citizen/.env.example apps/citizen/.env
firebase use villarrica-ciudadano
firebase emulators:start        # Auth :9099, Storage :9199, Firestore :8080, UI :4000
pnpm db:seed                    # Datos de prueba en el emulador de Firestore
pnpm dev                        # Turbo levanta API (:3000) + Citizen (:5173) + Backoffice (:5174)
```

### 9.3 Emuladores Firebase

- `firebase.json` configura emuladores para Auth (:9099), Storage (:9199), Firestore (:8080) y UI (:4000)
- El Admin SDK detecta los emuladores automáticamente vía `FIREBASE_AUTH_EMULATOR_HOST`, `STORAGE_EMULATOR_HOST` y `FIRESTORE_EMULATOR_HOST`
- En desarrollo local, el emulador de Firebase Auth está **deshabilitado** por defecto en el frontend porque `signInWithPopup` con Google real no funciona contra el emulador
- El emulador de Storage se usa para desarrollo local (configurado en `STORAGE_EMULATOR_HOST`)

---

## 10. Modelo de Datos Compartido (`@ciudadano/shared`)

### Enums

```typescript
enum ReportStatus { PENDING, IN_PROGRESS, RESOLVED }
enum ReportCategory { LUMINARIAS, BACHES, ASEO, SEGURIDAD, RUIDO, TRAFICO, AREAS_VERDES, OTRO }
enum UserRole { ADMIN, STAFF }
enum AdminUserStatus { PENDING, ACTIVE, REJECTED }
```

### Interfaces principales

- `IReport` — Denuncia (id, description, location {lat, lng}, image_url, category, status, timestamps)
- `IInternalNote` — Nota de seguimiento (id, report_id, content, created_by, created_at)
- `IAdminUser` — Usuario backoffice (id, email, name, role, status, created_at)
- `ICitizenUser` — Usuario ciudadano (id, firebase_uid, email, display_name, provider, timestamps)
- `JwtPayload` — Payload del token (sub, email, role)

### DTOs

- `CreateReportDto` — description, category, latitude, longitude
- `UpdateReportStatusDto` — status
- `CreateNoteDto` — content
- `ReportQueryParams` — page, limit, status, category, startDate, endDate
- `LoginDto`, `RegisterAdminDto`, `UpdateUserStatusDto`, `UpdateUserRoleDto`, `FirebaseAuthDto`

### Respuestas

- `ApiResponse<T>` — `{ success, data, message? }`
- `PaginatedResponse<T>` — `{ success, data[], meta: { total, page, limit, totalPages } }`

---

## 11. Convenciones del Proyecto

### Nombrado
- **Código:** Inglés (clases, variables, funciones, archivos, carpetas)
- **Comentarios y logs:** Español
- **Commits:** Conventional Commits en inglés (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `style:`)
- **Ramas:** Prefijo por tipo (`feat/`, `fix/`, `chore/`), PRs siempre contra `master`

### Código
- TypeScript estricto (`strict: true`)
- Módulos ESM (`.js` extension en imports relativos para Node.js)
- Sin ORM — acceso a Firestore vía Firebase Admin SDK (repositorios inyectan el token `FIRESTORE`)
- Tests unitarios obligatorios para nuevas funcionalidades (`.spec.ts`); mocks de Firestore con `src/testing/firestore.mock.ts`
- Sin uso de emojis en código (solo si el usuario lo pide explícitamente)

---

## 12. Puntos de Extensión para Futuras Features

1. **Notificaciones push:** La PWA ya tiene service worker; se puede agregar Firebase Cloud Messaging para notificar cambios de estado.
2. **Comentarios públicos:** Agregar colección `public_comments` y endpoints para que ciudadanos comenten en denuncias.
3. **Gamificación:** Sistema de puntos/rangos para ciudadanos que reportan incidentes.
4. **Integración municipal:** Webhook para enviar denuncias resueltas a sistemas municipales existentes.
5. **Multi-idioma:** Vue I18n para soporte de mapudungun e inglés.
6. **Offline mode:** La PWA ya tiene Workbox; se puede extender para aceptar denuncias offline con sincronización posterior (Background Sync).
7. **Testing E2E:** Agregar Playwright o Cypress para flujos críticos.
8. **Rate limiting:** Implementar `@nestjs/throttler` para proteger endpoints públicos.
9. **Audit log:** Colección `audit_logs` para registrar todas las acciones administrativas.
10. **WebSocket:** Gateway NestJS para notificaciones en tiempo real en el backoffice cuando llegan nuevas denuncias.
