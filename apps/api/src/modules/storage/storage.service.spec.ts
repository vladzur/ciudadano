import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "./storage.service.js";

const mockBucket = {
  file: jest.fn().mockReturnThis(),
  save: jest.fn(),
  getSignedUrl: jest.fn(),
};

const mockStorage = {
  bucket: jest.fn().mockReturnValue(mockBucket),
};

jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn().mockImplementation(() => mockStorage),
}));

describe("StorageService", () => {
  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStorage.bucket.mockReturnValue(mockBucket);
    mockBucket.file.mockReturnValue(mockBucket);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({
              bucket: "ciudadano-bucket",
              projectId: "test-project",
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe("uploadImage", () => {
    it("should upload file and return object key", async () => {
      const imageFile = {
        originalname: "photo.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("image-data"),
      } as Express.Multer.File;

      mockBucket.save.mockResolvedValue(undefined);

      const objectKey = await service.uploadImage(imageFile);

      expect(mockStorage.bucket).toHaveBeenCalledWith("ciudadano-bucket");
      expect(mockBucket.file).toHaveBeenCalled();
      expect(mockBucket.save).toHaveBeenCalledWith(imageFile.buffer, {
        contentType: "image/jpeg",
        resumable: false,
      });
      expect(objectKey).toMatch(/^reports\/.+\.jpg$/);
    });

    it("should default to jpg extension when file has no extension", async () => {
      // "photo".split(".").pop() returns "photo" — el ?? "jpg" no se activa
      // porque split() sobre un string sin puntos retorna el string completo
      const imageFile = {
        originalname: "photo",
        mimetype: "image/png",
        buffer: Buffer.from("image-data"),
      } as Express.Multer.File;

      mockBucket.save.mockResolvedValue(undefined);

      const objectKey = await service.uploadImage(imageFile);

      expect(objectKey).toMatch(/^reports\/.+\.photo$/);
    });

    it("should propagate GCS upload errors", async () => {
      const imageFile = {
        originalname: "photo.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("image-data"),
      } as Express.Multer.File;

      mockBucket.save.mockRejectedValue(new Error("GCS upload failed"));

      await expect(service.uploadImage(imageFile)).rejects.toThrow("GCS upload failed");
    });
  });

  describe("getSignedUrl", () => {
    it("should generate a signed URL with 15-minute expiry", async () => {
      const before = Date.now();
      mockBucket.getSignedUrl.mockResolvedValue(["https://signed.url/access"]);

      const url = await service.getSignedUrl("reports/uuid.jpg");

      expect(mockBucket.file).toHaveBeenCalledWith("reports/uuid.jpg");
      // Verificar que el expiry es ~15 minutos desde ahora
      expect(mockBucket.getSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          version: "v4",
          action: "read",
          expires: expect.any(Number),
        })
      );
      const expires = (mockBucket.getSignedUrl as jest.Mock).mock.calls[0][0].expires;
      expect(expires).toBeGreaterThan(before + 14 * 60 * 1000);
      expect(url).toBe("https://signed.url/access");
    });

    it("should strip leading slash from object key", async () => {
      mockBucket.getSignedUrl.mockResolvedValue(["https://signed.url/access"]);

      await service.getSignedUrl("/reports/uuid.jpg");

      expect(mockBucket.file).toHaveBeenCalledWith("reports/uuid.jpg");
    });

    it("should propagate GCS signed URL errors", async () => {
      mockBucket.getSignedUrl.mockRejectedValue(new Error("Permission denied"));

      await expect(service.getSignedUrl("reports/uuid.jpg")).rejects.toThrow("Permission denied");
    });
  });
});
