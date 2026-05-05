/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module "leaflet.heat" {
  import * as L from "leaflet";
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: Record<string, unknown>
  ): L.Layer;
  export = heatLayer;
}
