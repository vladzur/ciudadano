import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";
import type { AppConfig } from "../../config/configuration.js";

@Injectable()
export class StorageService {
  private readonly storage: Storage;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfig["gcs"]>("gcs")!;

    const storageOptions: { projectId: string; credentials?: Record<string, unknown> } = {
      projectId: config.projectId,
    };

    // Usar credenciales explícitas si están disponibles para firma local de signed URLs
    if (config.serviceAccountKey) {
      try {
        storageOptions.credentials = JSON.parse(config.serviceAccountKey);
        this.logger.log("Usando service account key para signed URLs");
      } catch {
        this.logger.warn("GCS_SERVICE_ACCOUNT_KEY tiene JSON inválido, usando ADC");
      }
    } else {
      this.logger.log("Sin service account key, usando ADC (requiere permiso signBlob en IAM)");
    }

    this.storage = new Storage(storageOptions);
    this.bucket = config.bucket;
    this.logger.log(`Storage inicializado - bucket: ${this.bucket}, projectId: ${config.projectId}`);
  }

  /** Sube una imagen a GCS y retorna el object key (no URL pública) */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    const bucket = this.storage.bucket(this.bucket);
    const ext = file.originalname.split(".").pop() ?? "jpg";
    const objectKey = `reports/${randomUUID()}.${ext}`;
    const blob = bucket.file(objectKey);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });

    return objectKey;
  }

  /** Genera una Signed URL temporal para acceder a imagen privada */
  async getSignedUrl(objectKey: string): Promise<string> {
    // Eliminar posible slash inicial agregado por wildcard de ruta
    const cleanKey = objectKey.replace(/^\//, "");

    this.logger.log(`Generando signed URL para: ${cleanKey}`);

    const bucket = this.storage.bucket(this.bucket);
    const blob = bucket.file(cleanKey);

    const [url] = await blob.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutos
    });

    return url;
  }
}
