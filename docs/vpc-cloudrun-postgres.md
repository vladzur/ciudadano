# Conexion Cloud Run a PostgreSQL en Compute Engine via VPC

## Arquitectura

```
Cloud Run (southamerica-west1)
    │
    └── VPC Connector (ciudadano-vpc-connector)
            │
            └── Firewall Rule (allow-cloud-run-to-postgres)
                    │
                    └── VM PostgreSQL (IP interna :5432)
```

El trafico sale de Cloud Run, pasa por el VPC Connector que tiene su propio
rango de IPs dentro de la VPC, atraviesa la firewall rule, y llega a la VM.

## Estado actual

El VPC Connector ya esta referenciado en el deploy de Cloud Run:

```bash
# .github/workflows/deploy.yml (lineas 65-66)
--vpc-connector projects/denuncia-ciudadana-5fa44/locations/southamerica-west1/connectors/ciudadano-vpc-connector
--vpc-egress private-ranges-only
```

`private-ranges-only` significa que solo el trafico dirigido a IPs privadas
(RFC 1918) pasa por el conector. El trafico a internet sale directamente.

---

## Paso 1: Verificar que el VPC Connector esta en la misma red que la VM

```bash
# Red del VPC Connector
gcloud compute networks vpc-access connectors describe ciudadano-vpc-connector \
  --region southamerica-west1 \
  --format="value(network)"

# Red de la VM de PostgreSQL
gcloud compute instances describe denuncia-ciudadana-db \
  --zone southamerica-west1-b \
  --format="value(networkInterfaces[0].network)"
```

Ambos deben estar en la misma VPC (tipicamente `default`). Si no lo estan,
hay que recrear el conector en la red correcta.

---

## Paso 2: Crear la firewall rule

Este es el paso critico. La VM necesita permitir trafico TCP en el puerto
5432 desde el rango de IPs del VPC Connector.

### 2.1 Obtener el rango de IPs del VPC Connector

```bash
gcloud compute networks vpc-access connectors describe ciudadano-vpc-connector \
  --region southamerica-west1 \
  --format="value(ipCidrRange)"
```

Esto devuelve algo como `10.0.0.0/28`. Guarda ese valor para los siguientes
comandos.

### 2.2 Agregar network tag a la VM

```bash
gcloud compute instances add-tags denuncia-ciudadana-db \
  --zone southamerica-west1-b \
  --tags postgresql
```

### 2.3 Crear la firewall rule

```bash
# Reemplaza CONNECTOR_CIDR con el output del paso 2.1 (ej: 10.0.0.0/28)
gcloud compute firewall-rules create allow-cloud-run-to-postgres \
  --network default \
  --direction INGRESS \
  --priority 1000 \
  --allow tcp:5432 \
  --source-ranges CONNECTOR_CIDR \
  --target-tags postgresql
```

Esta regla dice: "permite trafico entrante en el puerto 5432 desde las IPs
del VPC Connector hacia cualquier VM que tenga el tag `postgresql`".

---

## Paso 3: Configurar PostgreSQL en la VM

### 3.1 postgresql.conf — listen_addresses

Edita el archivo de configuracion:

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Asegurate de que PostgreSQL escucha en la interfaz de red, no solo en
localhost:

```
listen_addresses = '*'
```

Si prefieres ser mas restrictivo:

```
listen_addresses = 'localhost,10.X.X.X'   # IP interna de la VM
```

### 3.2 pg_hba.conf — permitir conexiones desde el VPC Connector

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Agrega esta linea al final (reemplaza el CIDR si tu rango es distinto):

```
# Permitir conexiones desde Cloud Run via VPC Connector
host    all    all    10.0.0.0/28    scram-sha-256
```

### 3.3 Reiniciar PostgreSQL

```bash
sudo systemctl restart postgresql
```

Verifica que levanto correctamente:

```bash
sudo systemctl status postgresql
```

---

## Paso 4: Configurar secrets en GitHub

El `secrets.DB_HOST` debe ser la **IP interna** de la VM, no la IP publica.

### 4.1 Obtener la IP interna de la VM

```bash
gcloud compute instances describe denuncia-ciudadana-db \
  --zone southamerica-west1-b \
  --format="value(networkInterfaces[0].networkIP)"
```

### 4.2 Actualizar el secret en GitHub

Ir a GitHub → Settings → Secrets and variables → Actions. Verificar o
actualizar:

| Secret | Valor esperado | Ejemplo |
|---|---|---|
| `DB_HOST` | IP interna de la VM | `10.194.0.2` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `ciudadano` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Password del usuario | `****` |

---

## Paso 5: Verificar conectividad

### 5.1 Redeploy de Cloud Run

```bash
gcloud run deploy ciudadano-api \
  --region southamerica-west1 \
  --image $(gcloud run services describe ciudadano-api \
    --region southamerica-west1 \
    --format='value(spec.template.spec.containers[0].image)')
```

### 5.2 Probar el health endpoint

```bash
URL=$(gcloud run services describe ciudadano-api \
  --region southamerica-west1 \
  --format='value(status.url)')

curl -s "$URL/api/v1/health" | jq .
```

Respuesta esperada:

```json
{
  "status": "ok",
  "timestamp": "2026-05-11T...",
  "db": true
}
```

El campo `db: true` confirma que la conexion a PostgreSQL funciona.

---

## Troubleshooting

### Cloud Run no puede conectar (db: false)

1. Verificar que la VM de PostgreSQL esta corriendo:
   ```bash
   gcloud compute instances list --filter="name=denuncia-ciudadana-db"
   ```

2. Verificar que el VPC Connector esta en estado `READY`:
   ```bash
   gcloud compute networks vpc-access connectors describe ciudadano-vpc-connector \
     --region southamerica-west1 \
     --format="value(state)"
   ```

3. Verificar que la firewall rule existe y tiene el CIDR correcto:
   ```bash
   gcloud compute firewall-rules describe allow-cloud-run-to-postgres
   ```

4. Desde otra VM en la misma red, probar la conexion directa:
   ```bash
   psql -h IP_INTERNA_DB -U postgres -d ciudadano
   ```

5. Revisar los logs de Cloud Run para ver el error especifico:
   ```bash
   gcloud run services logs read ciudadano-api --region southamerica-west1
   ```

### Error: connection timeout

Causas probables:
- La firewall rule no existe o tiene un CIDR incorrecto.
- `listen_addresses` en `postgresql.conf` esta en `localhost` unicamente.
- La VM no tiene el tag `postgresql`.
- El VPC Connector esta en otra red distinta a la VM.

### Error: pg_hba.conf rechaza la conexion

Verificar que la entrada en `pg_hba.conf` tiene:
- El CIDR correcto del VPC Connector.
- El metodo de autenticacion correcto (`scram-sha-256` o `md5` segun tu
  configuracion de PostgreSQL).

---

## Parametros de conexion en el codigo

La conexion se configura en `packages/database/src/client.ts`:

```typescript
export const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME ?? "ciudadano",
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,  // Considerar subir a 5000 en produccion
});
```

El `connectionTimeoutMillis: 2000` puede ser muy bajo si hay latencia entre
Cloud Run y la VM. Si ves errores intermitentes de timeout, sube este valor
a 5000 o 10000 en produccion.

---

## Referencias

- [Connect Cloud Run to a VPC network](https://cloud.google.com/run/docs/configuring/vpc-connectors)
- [Serverless VPC Access overview](https://cloud.google.com/vpc/docs/serverless-vpc-access)
- [VPC firewall rules](https://cloud.google.com/vpc/docs/firewalls)
