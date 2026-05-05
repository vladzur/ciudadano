import { ref, onMounted } from "vue";

/** Hook para obtener la ubicación GPS del dispositivo */
export function useGeolocation() {
  const latitude = ref<number | null>(null);
  const longitude = ref<number | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  function getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada en este dispositivo."));
        return;
      }

      loading.value = true;
      error.value = null;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          latitude.value = position.coords.latitude;
          longitude.value = position.coords.longitude;
          loading.value = false;
          resolve(position);
        },
        (err) => {
          error.value = getGeolocationErrorMessage(err);
          loading.value = false;
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  onMounted(() => {
    getPosition().catch(() => {
      // Error manejado en el estado reactivo
    });
  });

  return { latitude, longitude, error, loading, getPosition };
}

/** Traduce códigos de error de geolocalización a mensajes legibles */
function getGeolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Permiso de ubicación denegado. Active la ubicación en su dispositivo.";
    case err.POSITION_UNAVAILABLE:
      return "No se pudo determinar su ubicación. Intente en un área abierta.";
    case err.TIMEOUT:
      return "Tiempo de espera agotado. Intente nuevamente.";
    default:
      return "Error al obtener la ubicación.";
  }
}
