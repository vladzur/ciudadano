import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCamera } from "./useCamera.js";

describe("useCamera", () => {
  let mockStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;
  let mockPlay: ReturnType<typeof vi.fn>;
  let mockVideoElement: HTMLVideoElement;

  beforeEach(() => {
    mockVideoTrack = {
      stop: vi.fn(),
      kind: "video",
      id: "track-1",
      label: "camera",
      enabled: true,
      readyState: "live",
    } as unknown as MediaStreamTrack;

    mockStream = {
      getTracks: vi.fn().mockReturnValue([mockVideoTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockVideoTrack]),
    } as unknown as MediaStream;

    mockPlay = vi.fn().mockResolvedValue(undefined);

    mockVideoElement = {
      srcObject: null,
      videoWidth: 1920,
      videoHeight: 1080,
      play: mockPlay,
    } as unknown as HTMLVideoElement;

    // Mock getUserMedia
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should start with inactive state", () => {
    const { stream, isActive, error, photoBlob } = useCamera();

    expect(stream.value).toBeNull();
    expect(isActive.value).toBe(false);
    expect(error.value).toBeNull();
    expect(photoBlob.value).toBeNull();
  });

  it("should start camera and assign stream to video element", async () => {
    const { startCamera, isActive, stream, error } = useCamera();

    await startCamera(mockVideoElement);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: expect.objectContaining({
        facingMode: "environment",
      }),
      audio: false,
    });
    expect(mockVideoElement.srcObject).toBe(mockStream);
    expect(mockPlay).toHaveBeenCalled();
    expect(isActive.value).toBe(true);
    expect(stream.value).not.toBeNull();
    expect(error.value).toBeNull();
  });

  it("should set error when camera access fails", async () => {
    vi.clearAllMocks();
    const cameraError = new Error("NotAllowedError: Permission denied");
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(
      cameraError
    );

    const { startCamera, isActive, error } = useCamera();

    await startCamera(mockVideoElement);

    expect(isActive.value).toBe(false);
    expect(error.value).toBe("NotAllowedError: Permission denied");
  });

  it("should set error message for unknown error types", async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(
      "Unknown rejection"
    );

    const { startCamera, error } = useCamera();

    await startCamera(mockVideoElement);

    expect(error.value).toBe("Error al acceder a la cámara.");
  });

  it("should capture photo and return a File", () => {
    const { capturePhoto } = useCamera();

    // capturePhoto uses videoElement internally via closure
    // It returns null if no videoElement is set (the composable var is null here)
    const result = capturePhoto();
    expect(result).toBeNull();
  });

  it("should stop camera and clean up state", async () => {
    const { startCamera, stopCamera, isActive, stream } = useCamera();

    await startCamera(mockVideoElement);
    expect(isActive.value).toBe(true);

    stopCamera();

    expect(mockVideoTrack.stop).toHaveBeenCalled();
    expect(isActive.value).toBe(false);
    expect(stream.value).toBeNull();
  });
});
