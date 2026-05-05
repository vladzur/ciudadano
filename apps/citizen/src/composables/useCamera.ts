import { ref, onUnmounted } from "vue";

/** Hook para acceder a la cámara del dispositivo y capturar fotos */
export function useCamera() {
  const stream = ref<MediaStream | null>(null);
  const photoBlob = ref<Blob | null>(null);
  const error = ref<string | null>(null);
  const isActive = ref(false);

  let videoElement: HTMLVideoElement | null = null;

  /** Inicia el stream de cámara y lo asigna a un elemento video */
  async function startCamera(videoEl: HTMLVideoElement): Promise<void> {
    try {
      error.value = null;
      videoElement = videoEl;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Cámara trasera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      stream.value = mediaStream;
      videoEl.srcObject = mediaStream;
      await videoEl.play();
      isActive.value = true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al acceder a la cámara.";
      error.value = msg;
      isActive.value = false;
    }
  }

  /** Captura una foto del stream actual y retorna un Blob */
  function capturePhoto(): File | null {
    if (!videoElement) return null;

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Aplicar mirror horizontal si es cámara frontal
    ctx.drawImage(videoElement, 0, 0);

    canvas.toBlob((blob) => {
      photoBlob.value = blob;
    }, "image/jpeg", 0.85);

    if (!photoBlob.value) return null;

    return new File([photoBlob.value], `report-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
  }

  /** Detiene el stream de cámara */
  function stopCamera(): void {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop());
      stream.value = null;
    }
    isActive.value = false;
    photoBlob.value = null;
  }

  onUnmounted(() => {
    stopCamera();
  });

  return {
    stream,
    photoBlob,
    error,
    isActive,
    startCamera,
    capturePhoto,
    stopCamera,
  };
}
