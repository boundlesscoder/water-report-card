export function setLayerFilter(map, layerId, filter) {
    if (map.getLayer(layerId)) {
        map.setFilter(layerId, filter);
    }
}

export function getFeatureAtPoint(map, point, layer = "water-fill") {
    const features = map.queryRenderedFeatures(point, { layers: [layer] });
    return features.length > 0 ? features[0] : null;
}
  
export function flyToFeature(map, coordinates, zoom = 13) {

    if (typeof window === "undefined" || !map) return;

    if (map) {
        map.flyTo({ center: coordinates, zoom });
    }
}