import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import L from "leaflet";
import "leaflet.markercluster";
import { fetchHeatmapData } from "../services/api";
import type { HeatmapPoint } from "@ciudadano/shared";

/** Coordenadas aproximadas de Villarrica (centro del mapa) */
const VILLARRICA_CENTER: [number, number] = [-39.2785, -72.2284];

/** Hook para renderizar marcadores de denuncias con clustering */
export function useHeatmap(containerId: string) {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const mapLoaded = ref(false);
  const router = useRouter();

  let map: L.Map | null = null;
  let clusterGroup: L.MarkerClusterGroup | null = null;

  onMounted(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error("[useHeatmap] Contenedor no encontrado:", containerId);
      return;
    }

    // Verificar dimensiones del contenedor antes de inicializar
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      container.style.width = "100%";
      container.style.height = "500px";
    }

    map = L.map(container, {
      attributionControl: false,
    }).setView(VILLARRICA_CENTER, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
    });
    map.addLayer(clusterGroup);

    mapLoaded.value = true;
    loadHeatmapData();
  });

  onUnmounted(() => {
    if (map) {
      map.remove();
      map = null;
      clusterGroup = null;
    }
  });

  /** Carga puntos de denuncias desde la API */
  async function loadHeatmapData(params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<void> {
    if (!map || !clusterGroup) return;

    loading.value = true;
    error.value = null;

    try {
      const points = await fetchHeatmapData(params);
      renderMarkers(points);
    } catch (err: unknown) {
      error.value =
        err instanceof Error ? err.message : "Error al cargar datos del mapa.";
    } finally {
      loading.value = false;
    }
  }

  /** Renderiza marcadores con clustering en el mapa */
  function renderMarkers(points: HeatmapPoint[]): void {
    if (!clusterGroup) return;

    clusterGroup.clearLayers();

    for (const point of points) {
      const marker = L.marker([point.lat, point.lng]);
      marker.on("click", () => {
        router.push(`/reports/${point.id}`);
      });
      clusterGroup.addLayer(marker);
    }
  }

  return { loading, error, loadHeatmapData, mapLoaded };
}
