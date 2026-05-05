import { ref, onMounted, onUnmounted } from "vue";
import L from "leaflet";
import "leaflet.heat";
import { fetchHeatmapData } from "../services/api";
import type { HeatmapPoint } from "@ciudadano/shared";

/** Coordenadas aproximadas de Villarrica (centro del mapa) */
const VILLARRICA_CENTER: [number, number] = [-39.2785, -72.2284];

/** Hook para renderizar mapa de calor con Leaflet */
export function useHeatmap(containerId: string) {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const mapLoaded = ref(false);

  let map: L.Map | null = null;
  let heatLayer: L.Layer | null = null;

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

    map = L.map(container).setView(VILLARRICA_CENTER, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapLoaded.value = true;
    loadHeatmapData();
  });

  onUnmounted(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });

  /** Carga datos de calor desde la API */
  async function loadHeatmapData(params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<void> {
    if (!map) return;

    loading.value = true;
    error.value = null;

    try {
      const points = await fetchHeatmapData(params);
      renderHeatmap(points);
    } catch (err: unknown) {
      error.value =
        err instanceof Error ? err.message : "Error al cargar datos del mapa.";
    } finally {
      loading.value = false;
    }
  }

  /** Renderiza capa de calor en el mapa */
  function renderHeatmap(points: HeatmapPoint[]): void {
    if (!map) return;

    if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }

    const heatPoints: [number, number, number][] = points.map((p) => [
      p.lat,
      p.lng,
      p.intensity,
    ]);

    if (heatPoints.length > 0) {
      heatLayer = (L as any).heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        gradient: {
          0.2: "#2ecc71",
          0.4: "#f1c40f",
          0.6: "#e67e22",
          0.8: "#e74c3c",
        },
      }).addTo(map);
    }
  }

  return { loading, error, loadHeatmapData, mapLoaded };
}
