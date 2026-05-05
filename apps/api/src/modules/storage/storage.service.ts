import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";
import type { AppConfig } from "../../config/configuration.js";

@Injectable()
export class StorageService {
  private readonly storage: Storage;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfig["gcs"]>("gcs")!;
    this.storage = new Storage({ projectId: config.projectId });
    this.bucket = config.bucket;
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
    const bucket = this.storage.bucket(this.bucket);
    const blob = bucket.file(objectKey);

    const [url] = await blob.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutos
    });

    return url;
  }
}
