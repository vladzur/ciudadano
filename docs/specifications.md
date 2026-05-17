# Especificaciones del Proyecto: Plataforma de Denuncia Ciudadana – Villarrica

## 1. Resumen Ejecutivo
Desarrollo de una plataforma digital (WebApp PWA) que permita a los residentes de Villarrica reportar incidentes urbanos en tiempo real. El sistema incluye una aplicación ciudadana de baja fricción y un panel administrativo para el equipo del concejal que permite la gestión, visualización geográfica y generación de reportes de gestión municipal.

---

## 2. Definición del Stack Tecnológico
Para garantizar escalabilidad, bajo costo de mantenimiento y alta disponibilidad, se define el siguiente stack:

*   **Arquitectura:** Monorepo (pnpm workspaces).
*   **Backend:** NestJS (Node.js) ejecutándose en **Google Cloud Run**.
*   **Frontend (Ciudadano):** Vue 3 + Vite + Tailwind CSS (PWA).
*   **Frontend (Backoffice):** Vue 3 + Vite + Shadcn/vue.
*   **Base de Datos:** PostgreSQL con extensión **PostGIS** en **Cloud SQL**.
*   **Almacenamiento:** Google Cloud Storage (Bucket para imágenes).
*   **Mapas:** Leaflet.js (OpenStreetMap) para evitar costos excesivos de Google Maps API.

---

## 3. Requerimientos Funcionales

### 3.1 Módulo del Ciudadano (WebApp PWA)
*   **Acceso sin fricción:** No requiere descarga de tiendas (instalable vía navegador).
*   **Captura de Evidencia:** Interfaz para captura fotográfica directa desde la cámara del móvil.
*   **Geolocalización Automática:** Obtención de coordenadas GPS mediante la API del navegador.
*   **Formulario de Reporte:** Campo de texto para descripción y selección de categoría (Luminarias, Baches, Aseo, Seguridad, etc.).
*   **Estado de Envío:** Feedback visual tras el envío exitoso de la denuncia.

### 3.2 Módulo de Gestión (Backoffice)
*   **Autenticación:** Acceso restringido para el concejal y su gabinete (vía Firebase Auth o JWT).
*   **Dashboard de Control:**
    *   **Mapa de Calor:** Visualización de la densidad de denuncias en la comuna de Villarrica.
    *   **Filtros Avanzados:** Por fecha, categoría y estado de gestión.
*   **Gestión de Denuncias:** Cambiar estados (Pendiente → En Gestión → Resuelto) y añadir notas internas de seguimiento.
*   **Reportes Mensuales:** Generación de resúmenes en PDF/Excel para presentación en sesiones de Concejo Municipal.

---

## 4. Requerimientos No Funcionales y Seguridad
*   **Seguridad de Datos:** Las imágenes se almacenan de forma privada. El Backoffice accede a ellas mediante **Signed URLs** (URLs con tiempo de expiración).
*   **Privacidad:** Las denuncias ciudadanas deben cumplir con la normativa de protección de datos personales.
*   **Disponibilidad:** Uso de Cloud Run para auto-escalado (pago por uso, reduciendo costos a $0 cuando no hay tráfico).
*   **Geografía:** Sistema de coordenadas estandarizado en **SRID 4326 (WGS84)** para total compatibilidad con PostGIS.

---

## 5. Arquitectura de Datos (Entidad Principal: `Report`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único. |
| `description` | Text | Detalle del incidente. |
| `location` | GEOMETRY(Point, 4326) | Coordenadas exactas para análisis espacial. |
| `image_url` | String | Referencia al objeto en Google Cloud Storage. |
| `status` | Enum | `pending`, `in_progress`, `resolved`. |
| `category` | String | Categoría del reporte (Luminarias, etc.). |
| `created_at` | Timestamp | Fecha y hora del reporte. |

---

## 6. Hoja de Ruta de Implementación (Roadmap)

### Fase 1: Cimientos (Semana 1)
*   Configuración del Monorepo y Shared Types.
*   Despliegue de instancia Cloud SQL con PostGIS activo.
*   Configuración de Buckets de almacenamiento en GCP.

### Fase 2: Backend y API (Semana 2)
*   Endpoint de recepción de denuncias con procesamiento de imágenes.
*   Lógica de generación de Signed URLs.
*   Seguridad y Roles de administración.

### Fase 3: Frontend Ciudadano y PWA (Semana 3)
*   Implementación de cámara y geolocalización.
*   Configuración del Web App Manifest para instalación en móviles.
*   Pruebas de usuario en terreno (Villarrica).

### Fase 4: Backoffice y Análisis (Semana 4)
*   Implementación de mapas de calor con Leaflet.
*   Herramientas de filtrado y gestión de estados.
*   Generador de reportes en PDF.

---

## 7. Infraestructura (Resumen de Google Cloud)
1.  **Project ID:** `villarrica-denuncia-ciudadana`
2.  **Region:** `southamerica-east1` (Sao Paulo) para baja latencia.
3.  **Servicios:** Cloud Run (Compute), Cloud SQL (DB), Cloud Storage (Storage), Artifact Registry (Docker Images).
