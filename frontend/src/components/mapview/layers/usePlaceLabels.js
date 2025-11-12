"use client";

export function addCustomPlaceLabels(map) {
    // Add the vector source (if not already added)
    if (!map.getSource("mapbox-streets")) {
        try {
            map.addSource("mapbox-streets", {
                type: "vector",
                url: "mapbox://mapbox.mapbox-streets-v8",
            });
        } catch (error) {
            console.warn('Failed to add mapbox-streets source:', error);
            return;
        }
    }

    // Find the bottom-most layer to insert our layers above
    const styleLayers = map.getStyle().layers;
    const allMapboxLayers = styleLayers.filter((l) =>
        !l.id.startsWith("place-") && !l.id.startsWith("water_")
    );
    const bottomMapboxLayerId = allMapboxLayers[0]?.id || undefined;

    // === Country Labels ===
    if (!map.getLayer("place-country-label")) {
        map.addLayer({
            id: "place-country-label",
            type: "symbol",
            source: "mapbox-streets",
            "source-layer": "place_label",
            minzoom: 1,
            maxzoom: 10,
            filter: ["==", ["get", "class"], "country"],
            layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-transform": "uppercase",
                "text-letter-spacing": [
                    "interpolate", ["linear"], ["zoom"],
                    1, 0.1,
                    4, 0.2
                ],
                "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    1, 8,
                    3, 12,
                    5, 18,
                    8, 22
                ],
                "text-max-width": 6.25,
                "text-anchor": "center",
                "text-allow-overlap": false,
                "text-padding": 2
            },
            paint: {
                "text-color": "#5a5757",
                "text-halo-color": "rgba(255,255,255,1)",
                "text-halo-width": 1.5,
                "text-halo-blur": 0.5,
                "text-opacity": [
                    "interpolate", ["linear"], ["zoom"],
                    1, 1,
                    8, 0.8,
                    10, 0
                ]
            },
        }, bottomMapboxLayerId);
    }

    // === State Labels ===
    if (!map.getLayer("place-state-label")) {
        map.addLayer({
            id: "place-state-label",
            type: "symbol",
            source: "mapbox-streets",
            "source-layer": "place_label",
            minzoom: 3,
            maxzoom: 9,
            filter: ["==", ["get", "class"], "state"],
            layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-transform": "uppercase",
                "text-letter-spacing": [
                    "interpolate", ["linear"], ["zoom"],
                    3, 0.05,
                    6, 0.15
                ],
                "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    3, 9,
                    5, 12,
                    7, 16
                ],
                "text-max-width": 6.25,
                "text-anchor": "center",
                "text-allow-overlap": false,
                "text-padding": 2
            },
            paint: {
                "text-color": "#627bc1",
                "text-halo-color": "rgba(255,255,255,1)",
                "text-halo-width": 1.2,
                "text-halo-blur": 0.5,
                "text-opacity": [
                    "interpolate", ["linear"], ["zoom"],
                    3, 1,
                    8, 0.7,
                    9, 0
                ]
            },
        }, bottomMapboxLayerId);
    }

    // === State Capitals (Highest Priority) ===
    if (!map.getLayer("place-capital-label")) {
        map.addLayer({
            id: "place-capital-label",
            type: "symbol",
            source: "mapbox-streets",
            "source-layer": "place_label",
            minzoom: 3,
            maxzoom: 15,
            filter: [
                "all",
                ["==", ["get", "class"], "settlement"],
                ["==", ["get", "capital"], 2] // state capitals only
            ],
            layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    2, [
                        "case",
                        ["==", ["get", "capital"], 2], 18, // state capitals bigger
                        ["<=", ["get", "symbolrank"], 1], 20, // tier 1 cities
                        ["<=", ["get", "symbolrank"], 2], 16, // tier 2 cities  
                        14 // tier 3 cities
                    ],
                    6, [
                        "case",
                        ["==", ["get", "capital"], 2], 22, // state capitals
                        ["<=", ["get", "symbolrank"], 1], 26, // tier 1 cities
                        ["<=", ["get", "symbolrank"], 2], 20, // tier 2 cities
                        18 // tier 3 cities
                    ],
                    10, [
                        "case",
                        ["==", ["get", "capital"], 2], 28, // state capitals
                        ["<=", ["get", "symbolrank"], 1], 32, // tier 1 cities
                        ["<=", ["get", "symbolrank"], 2], 26, // tier 2 cities
                        24 // tier 3 cities
                    ],
                    14, [
                        "case",
                        ["==", ["get", "capital"], 2], 32, // state capitals  
                        ["<=", ["get", "symbolrank"], 1], 36, // tier 1 cities
                        ["<=", ["get", "symbolrank"], 2], 30, // tier 2 cities
                        28 // tier 3 cities
                    ]
                ],
                "text-font": [
                    "case",
                    ["==", ["get", "capital"], 2], ["literal", ["DIN Pro Bold", "Arial Unicode MS Bold"]], // state capitals
                    ["<=", ["get", "symbolrank"], 2], ["literal", ["DIN Pro Bold", "Arial Unicode MS Bold"]], // major cities
                    ["literal", ["DIN Pro Bold", "Arial Unicode MS Bold"]] // all cities bold
                ],
                "text-max-width": 10,
                "text-anchor": "center",
                "text-allow-overlap": true, // allow overlap for important cities
                "text-padding": 4,
                "text-letter-spacing": 0.02,
                "symbol-sort-key": [
                    "case",
                    ["==", ["get", "capital"], 2], 0, // state capitals first (highest priority)
                    ["<=", ["get", "symbolrank"], 1], 1, // tier 1 cities
                    ["<=", ["get", "symbolrank"], 2], 2, // tier 2 cities
                    ["<=", ["get", "symbolrank"], 3], 3, // tier 3 cities
                    4 // all others
                ]
            },
            paint: {
                "text-color": "#2d2d2d",
                "text-halo-color": "rgba(255,255,255,1)",
                "text-halo-width": 2,
                "text-halo-blur": 0.5
            },
        }, bottomMapboxLayerId);
    }

    // === Major Metropolitan Areas (Las Vegas, etc.) ===
    if (!map.getLayer("place-city-major-label")) {
        map.addLayer({
            id: "place-city-major-label",
            type: "symbol",
            source: "mapbox-streets",
            "source-layer": "place_label",
            minzoom: 3,
            maxzoom: 16,
            filter: [
                "all",
                ["==", ["get", "class"], "settlement"],
                ["!=", ["get", "capital"], 2], // exclude state capitals
                ["<=", ["get", "symbolrank"], 8] // expanded to include more major cities like Las Vegas
            ],
            layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    3, [
                        "step", ["get", "symbolrank"],
                        16, // rank 1-2 (largest cities)
                        3, 15, // rank 3-4
                        5, 14, // rank 5-6
                        7, 13, // rank 7-8
                        9, 12  // rank 9+
                    ],
                    8, [
                        "step", ["get", "symbolrank"],
                        22, // rank 1-2 (largest cities)
                        3, 20, // rank 3-4
                        5, 19, // rank 5-6
                        7, 18, // rank 7-8
                        9, 17  // rank 9+
                    ],
                    14, [
                        "step", ["get", "symbolrank"],
                        30, // rank 1-2 (largest cities)
                        3, 28, // rank 3-4
                        5, 26, // rank 5-6
                        7, 24, // rank 7-8
                        9, 22  // rank 9+
                    ]
                ],
                "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                "text-max-width": 10,
                "text-anchor": "center",
                "text-allow-overlap": true, // allow overlap for important cities
                "text-padding": 3,
                "text-letter-spacing": 0.01,
                "symbol-sort-key": [
                    "case",
                    ["<=", ["get", "symbolrank"], 3], 3, // largest cities (highest priority)
                    ["<=", ["get", "symbolrank"], 6], 4, // major cities
                    ["<=", ["get", "symbolrank"], 8], 5, // medium-major cities
                    6 // other cities
                ]
            },
            paint: {
                "text-color": "#2d2d2d",
                "text-halo-color": "rgba(255,255,255,1)",
                "text-halo-width": 1.5,
                "text-halo-blur": 0.5
            },
        }, bottomMapboxLayerId);
    }

    // === Medium Cities (like Scottsdale, Mesa, etc.) ===
    if (!map.getLayer("place-city-medium-label")) {
        map.addLayer({
            id: "place-city-medium-label",
            type: "symbol",
            source: "mapbox-streets",
            "source-layer": "place_label",
            minzoom: 8,
            maxzoom: 16,
            filter: [
                "all",
                ["==", ["get", "class"], "settlement"],
                ["!=", ["get", "capital"], 2], // exclude state capitals
                [">", ["get", "symbolrank"], 8], // medium tier cities (includes Sedona)
                ["<=", ["get", "symbolrank"], 14]
            ],
            layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    7, [
                        "step", ["get", "symbolrank"],
                        12, // rank 8-9
                        10, 11, // rank 10-11
                        12, 10  // rank 12+
                    ],
                    10, [
                        "step", ["get", "symbolrank"],
                        16, // rank 8-9
                        10, 15, // rank 10-11
                        12, 14  // rank 12+
                    ],
                    14, [
                        "step", ["get", "symbolrank"],
                        20, // rank 8-9
                        10, 18, // rank 10-11
                        12, 16  // rank 12+
                    ]
                ],
                "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                "text-max-width": 10,
                "text-anchor": "center",
                "text-allow-overlap": false,
                "text-padding": 2,
                "text-letter-spacing": 0.01,
                "symbol-sort-key": [
                    "case",
                    ["<=", ["get", "symbolrank"], 12], 7, // medium cities
                    8 // small cities
                ]
            },
            paint: {
                "text-color": "#5a5757",
                "text-halo-color": "rgba(255,255,255,1)",
                "text-halo-width": 1.2,
                "text-halo-blur": 0.5
            },
        }, bottomMapboxLayerId);
    }

    // === Small Cities & Towns ===
    if (!map.getLayer("place-city-small-label")) {
        map.addLayer({
            id: "place-city-small-label",
            type: "symbol",
            source: "mapbox-streets",
            "source-layer": "place_label",
            minzoom: 10,
            maxzoom: 16,
            filter: [
                "all",
                ["==", ["get", "class"], "settlement"],
                [">", ["get", "symbolrank"], 14],
                ["<=", ["get", "symbolrank"], 18]
            ],
            layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    9, 10,
                    11, 12,
                    14, 14
                ],
                "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                "text-max-width": 10,
                "text-anchor": "center",
                "text-allow-overlap": false, // small cities don't overlap with important ones
                "text-padding": 2,
                "text-letter-spacing": 0.01,
                "symbol-sort-key": [
                    "case",
                    ["<=", ["get", "symbolrank"], 18], 9, // small cities
                    10 // villages
                ]
            },
            paint: {
                "text-color": "#777777",
                "text-halo-color": "rgba(255,255,255,1)",
                "text-halo-width": 1.2,
                "text-halo-blur": 0.5
            },
        }, "place-city-medium-label");
    }

    // === Villages & Small Towns ===
    if (!map.getLayer("place-village-label")) {
        map.addLayer({
            id: "place-village-label",
            type: "symbol",
            source: "mapbox-streets",
            "source-layer": "place_label",
            minzoom: 12,
            maxzoom: 18,
            filter: [
                "all",
                ["==", ["get", "class"], "settlement"],
                [">", ["get", "symbolrank"], 18]
            ],
            layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    11, 9,
                    14, 11,
                    16, 12
                ],
                "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
                "text-max-width": 10,
                "text-anchor": "center",
                "text-allow-overlap": false, // villages don't overlap
                "text-padding": 2,
                "symbol-sort-key": 11 // villages (lowest priority)
            },
            paint: {
                "text-color": "#888888",
                "text-halo-color": "rgba(255,255,255,1)",
                "text-halo-width": 1.2,
                "text-halo-blur": 0.5
            },
        }, bottomMapboxLayerId);
    }
}