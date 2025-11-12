"use client";

export function updateWaterBoundariesVisibility(map, visible) {
    const layers = [
        "water-fill",
        "water_districts_borders",
        "water_districts_selected",
        "water_districts_selected_outline",
    ];
  
    layers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(
                layerId,
                "visibility",
                visible ? "visible" : "none"
            );
        }
    });
}

export function updateRoadLabelsVisibility(map, visible) {
    const roadLayers = [
            "road-label-motorway",
    "road-label-trunk",
    "road-label-primary", 
    "road-label-secondary",
    "road-label-tertiary",
    "road-label-street",
    "road-label-service",
    "road-label-path",
    "road-label-track"
    ];

    roadLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(
                layerId,
                "visibility",
                visible ? "visible" : "none"
            );
        }
    });
}

export function updatePlaceLabelsVisibility(map, visible) {
    const placeLayers = [
        "place-country-label",
        "place-state-label",
        "place-capital-label",
        "place-city-major-label",
        "place-city-medium-label", 
        "place-city-small-label",
        "place-village-label"
    ];

    placeLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(
                layerId,
                "visibility",
                visible ? "visible" : "none"
            );
        }
    });
}

export function updateAllCustomLabelsVisibility(map, visible) {
    updateRoadLabelsVisibility(map, visible);
    updatePlaceLabelsVisibility(map, visible);
}