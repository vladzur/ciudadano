# Migración PostgreSQL → Firestore + recreación de infraestructura Firebase/GCP

> Historia técnica de la migración. Rama: `feat/firestore-migration`.
> Estado: Fases 1–5 completadas. Fase 6 (deploy y verificación en producción) pendiente de la Fase 0.

## Contexto

La plataforma "ciudadano" (denuncias ciudadanas de Villarrica) usaba PostgreSQL 15 en una VM de Compute Engine alcanzada desde Cloud Run vía VPC Connector — infraestructura costosa y compleja. **El proyecto Firebase/GCP original (`denuncia-ciudadana-5fa44`) fue eliminado por completo para cortar costos**, por lo que no existe Cloud Run, Artifact Registry, Storage, VM de Postgres ni Firebase Auth/Hosting/Firestore.

Verificado en el código: **PostGIS solo se usa para guardar y extraer el punto** (`ST_MakePoint`/`ST_X`/`ST_Y`); no hay ninguna consulta espacial real (radio, distancia, bbox), así que `lat`/`lng` numéricos en Firestore cubren el 100% de los casos de uso.

**Decisiones confirmadas:**

- Migrar **todo** (reports, notas, admin_users, citizen_users) a **Firestore**; eliminar Postgres, VPC connector, migraciones SQL y docker-compose.
- **Proyecto nuevo con ID nuevo** (propuesto: `villarrica-ciudadano`, ajustable).
- El plan **incluye la recreación de infraestructura** como checklist ejecutable.
- No hay datos reales que migrar → seed contra Firestore.
- Contrato API **sin cambios**: los frontends citizen y backoffice no se tocan.

**Resultado esperado:** stack completo recreado y desplegado con Firestore (región `southamerica-west1` = Santiago), sin Postgres ni VPC, costo ≈ $0 a escala municipal.

## Fase 0 — Recreación de infraestructura (checklist)

1. **Proyecto Firebase**: crear proyecto `villarrica-ciudadano`, plan Spark inicial.
2. **Billing GCP**: vincular cuenta de facturación (obligatorio para Cloud Run y Artifact Registry; free tier de Firestore se mantiene).
3. **APIs** (`gcloud services enable`): `run`, `artifactregistry`, `cloudbuild`, `iamcredentials`, `firestore`, `identitytoolkit`, `firebasehosting`.
4. **Firestore**: modo Native, ubicación `southamerica-west1` — **inmutable, no se puede cambiar después**.
5. **Firebase Auth**: proveedor Google (obligatorio). Facebook requiere app de Facebook propia.
6. **Web app Firebase**: registrar app web → `firebaseConfig` para secretos `VITE_FIREBASE_*`.
7. **Cloud Storage**: bucket por defecto `<ID>.appspot.com` → `GCS_BUCKET`.
8. **Service accounts (IAM)**:
   - `cloud-run-api`: `roles/datastore.user`, `roles/firebaseauth.admin`, `roles/storage.objectAdmin`, `roles/iam.serviceAccountTokenCreator` (sobre sí misma, para signed URLs).
   - `github-actions`: `roles/artifactregistry.writer`, `roles/run.admin`, `roles/iam.serviceAccountUser`, `roles/firebasehosting.admin` → key JSON → secret `GCP_SA_KEY`.
9. **Artifact Registry**: repo `api` en `southamerica-west1`.
10. **Hosting**: sites `ciudadano-villarrica` y `backoffice-villarrica`.
11. **Secretos GitHub**: `GCP_SA_KEY`, `GCS_BUCKET`, `JWT_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `CORS_ORIGINS`, `VITE_FIREBASE_*` (4), `VITE_API_URL`.
12. **Reglas e índices**: `firebase deploy --only firestore:rules,firestore:indexes`.

## Modelo de datos Firestore

- **`reports`** — doc ID = UUID v4: `description`, `category`, `status`, `location: {lat, lng}`, `imageUrl`, `citizenUserId`, `createdAt`/`updatedAt` (Timestamp).
- **`reports/{reportId}/notes`** (subcolección) — `reportId`, `content`, `createdBy`, `createdAt`.
- **`admin_users`** — doc ID UUID: `email`, `password` (bcrypt), `name`, `role`, `status`, `createdAt`.
- **`citizen_users`** — doc ID = `firebase_uid`: `id`, `email`, `displayName`, `provider`, `createdAt` (solo al crear), `lastLogin`.

El mapeo del repositorio preserva el contrato API actual (ISO strings, snake_case, `location: {lat, lng}`).

## Cambios clave de diseño

1. **`FirebaseModule` global** — centraliza init del Admin SDK, exporta tokens `FIREBASE_APP` y `FIRESTORE`.
2. **Paginación** — contrato `PaginatedResponse` intacto: `count()` + cursor walk (`startAfter`), `orderBy("createdAt","desc")` + tie-break `__name__`. Guard `MAX_PAGE = 50`.
3. **Filtros** → `where()` sobre Timestamp; `new Date("YYYY-MM-DD")` = paridad exacta con la semántica SQL actual.
4. **Heatmap/stats** — agregación en memoria (`fetchAll` con loop de cursores, tope 1000 docs/query).
5. **Health check** — ping a Firestore → `{status, timestamp, firestore: boolean}`.
6. **IDs UUID** preservados (ParseUUIDPipe sigue funcionando); citizen_users usa firebase_uid como doc ID.
7. **`firestore.rules` deny-all** — acceso solo vía Admin SDK.

## Archivos (crear / modificar / eliminar)

- **Crear**: `firebase.constants.ts`, `firebase.module.ts`, `admin-users.repository.ts`, `citizen-users.repository.ts`, `firestore.mock.ts`, `seed.ts`, `firestore.rules`, `firestore.indexes.json`, 3 specs nuevos.
- **Modificar**: `reports.repository.ts`, `auth.service.ts`, `firebase-auth.service.ts`, `auth.module.ts`, `health.controller.ts`, `main.ts`, `configuration.ts`, `.env.example`, `jest.config.ts`, `apps/api/package.json`, `Dockerfile`, specs de reports/auth, `firebase.json`, `.firebaserc`, `package.json` raíz, `deploy.yml`, `README.md`, `docs/architecture.md`, `docs/specifications.md`.
- **Eliminar**: `packages/database/`, `docker-compose.yml`, `docs/vpc-cloudrun-postgres.md`.
- **Sin cambios**: `apps/citizen/**`, `apps/backoffice/**`, storage (GCS), DTOs, controllers, jwt.strategy, guards.

## Orden de implementación

- **Fase 1** — Fundaciones Firestore (FirebaseModule + refactor init) ✅
- **Fase 2** — Reports sobre Firestore (paginación, rules, indexes, emulador, mocks) ✅
- **Fase 3** — Auth y Health (repositorios nuevos, servicios, specs) ✅
- **Fase 4** — Analytics, seed y entorno local; borrar docker-compose ✅
- **Fase 5** — CI/CD y docs ✅
- **Fase 6** — Deploy y verificación en producción ⏳ (requiere Fase 0)

## Verificación

1. **Unit**: specs verdes, cero referencias a `pool`/`@ciudadano/database` ✅
2. **Build/CI**: `pnpm build` y `pnpm lint` verdes ✅
3. **Local e2e** con emuladores: login admin, crear reporte, listar `page=2`, heatmap, stats, notas, `health` con `firestore: true` ✅
4. **Producción (Fase 6)**: health check del workflow → login admin, reporte desde la PWA (Auth Google), backoffice (mapa + heatmap + export) ⏳

## Riesgos / notas

- **Billing obligatorio** (Blaze) para Cloud Run; free tier de Firestore se mantiene.
- **Firestore location inmutable** — elegir `southamerica-west1` al crear la BD.
- **Facebook OAuth** — requiere app de Facebook; Google sigue funcionando mientras tanto.
- **IAM de Cloud Run** — sin `datastore.user` y `firebaseauth.admin` el Admin SDK fallará en producción.
- **Unicidad de email en admin_users** — Firestore no tiene constraint único (ventana de carrera mínima, aceptable a esta escala).
- **Cursor walk por página** — si el volumen creciera a miles de docs, migrar a API cursor (requiere cambios en backoffice).
- **Sin red de rollback** — al no existir la infra antigua, el rollback se limita a revisiones anteriores de Cloud Run.

---

## Desviaciones menores respecto al plan escrito

1. **Índices**: el plan dice 3, se implementaron **4** — se agregó `(createdAt DESC, __name__ DESC)` para cubrir las queries de rango de fechas sin filtro de igualdad.
2. **Orden de Fase 1**: el plan decía eliminar `packages/database` en la Fase 1; en la práctica se eliminó al final (Fase 4) para mantener el build compilando en cada paso intermedio.
