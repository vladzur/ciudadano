/** Declaración de tipos para multer en Express (compatibilidad con @types/express@5) */
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
      stream: NodeJS.ReadableStream;
      destination: string;
      filename: string;
      path: string;
    }
  }
}
