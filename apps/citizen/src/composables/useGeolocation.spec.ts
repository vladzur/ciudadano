import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGeolocation } from "./useGeolocation.js";

describe("useGeolocation", () => {
  const mockPosition: GeolocationPosition = {
    coords: {
      latitude: -39.2785,
      longitude: -72.2284,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };

  let mockGetCurrentPosition: ReturnType<typeof vi.fn>;
  let originalGeolocation: Geolocation;

  beforeEach(() => {
    // Reset navigator.geolocation mock
    mockGetCurrentPosition = vi.fn();
    originalGeolocation = navigator.geolocation;

    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
      writable: true,
    });
  });

  it("should start with null coordinates and no error", () => {
    const { latitude, longitude, error, loading } = useGeolocation();

    expect(latitude.value).toBeNull();
    expect(longitude.value).toBeNull();
    expect(error.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  it("should resolve with coordinates on success", async () => {
    mockGetCurrentPosition.mockImplementation(
      (success: PositionCallback) => success(mockPosition)
    );

    const { latitude, longitude, getPosition } = useGeolocation();
    await getPosition();

    expect(latitude.value).toBe(-39.2785);
    expect(longitude.value).toBe(-72.2284);
    // loading should be false when resolved
  });

  it("should set loading to true during position request", () => {
    mockGetCurrentPosition.mockImplementation(() => {
      // Never resolve
    });

    const { loading, getPosition } = useGeolocation();
    getPosition();

    expect(loading.value).toBe(true);
  });

  it("should set error message on permission denied", async () => {
    const err = { code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "User denied" };
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => error(err)
    );

    const { error, getPosition } = useGeolocation();

    await expect(getPosition()).rejects.toBeDefined();
    expect(error.value).toBe("Permiso de ubicación denegado. Active la ubicación en su dispositivo.");
  });

  it("should set error message on position unavailable", async () => {
    const err = { code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "Unavailable" };
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => error(err)
    );

    const { error, getPosition } = useGeolocation();

    await expect(getPosition()).rejects.toBeDefined();
    expect(error.value).toBe("No se pudo determinar su ubicación. Intente en un área abierta.");
  });

  it("should set error message on timeout", async () => {
    const err = { code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "Timeout" };
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => error(err)
    );

    const { error, getPosition } = useGeolocation();

    await expect(getPosition()).rejects.toBeDefined();
    expect(error.value).toBe("Tiempo de espera agotado. Intente nuevamente.");
  });

  it("should set default message for unknown error codes", async () => {
    const err = { code: 99, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "Unknown" };
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => error(err)
    );

    const { error, getPosition } = useGeolocation();

    await expect(getPosition()).rejects.toBeDefined();
    expect(error.value).toBe("Error al obtener la ubicación.");
  });
});
