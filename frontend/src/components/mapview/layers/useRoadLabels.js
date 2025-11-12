"use client";

export function addCustomRoadLabels(map) {
    // Use the default Mapbox streets source
    const sourceName = "composite";

    // Add the composite source if it doesn't exist
    if (!map.getSource(sourceName)) {
        map.addSource(sourceName, {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8'
        });
    }

    // Remove existing road label layers
    if (map.getLayer("road-label")) {
        map.removeLayer("road-label");
    }

    // Load shield icons
    const shieldIcons = [
        'us-interstate', 'us-highway', 'us-state', 'us-bia',
        'default', 'rectangle-white', 'rectangle-red', 'rectangle-orange', 
        'rectangle-yellow', 'rectangle-green', 'rectangle-blue', 'circle-white'
    ];

    // Load shield icons
    shieldIcons.forEach(shieldType => {
        const iconName = `shield-${shieldType}`;
        if (!map.hasImage(iconName)) {
            // Load shield SVG icons - these should be available in your assets
            map.loadImage(`/assets/shields/${shieldType}.svg`, (error, image) => {
                if (!error && image) {
                    map.addImage(iconName, image);
                }
            });
        }
    });

    // === US Interstate Labels (Zoom 6+) ===
    if (!map.getLayer("us-interstate-labels")) {
        map.addLayer({
            id: "us-interstate-labels",
            type: "symbol",
            source: sourceName,
            "source-layer": "road",
            minzoom: 6,
            maxzoom: 24,
            filter: [
                "all",
                ["has", "ref"],
                ["!=", ["get", "ref"], ""],
                [
                    "match", 
                    ["get", "class"], 
                    ["motorway", "motorway_link"], 
                    true, 
                    false
                ]
            ],
            layout: {
                "symbol-placement": "line",
                "symbol-spacing": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 150,
                    8, 200,
                    10, 250,
                    12, 300,
                    14, 350,
                    16, 400,
                    18, 450
                ],
                "text-field": ["get", "ref"],
                "text-font": [
                    "step",
                    ["zoom"],
                    ["literal", ["DIN Pro Regular", "Arial Unicode MS Regular"]],
                    8,
                    ["literal", ["DIN Pro Medium", "Arial Unicode MS Regular"]],
                    10,
                    ["literal", ["DIN Pro Bold", "Arial Unicode MS Bold"]]
                ],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 8,
                    8, 9,
                    10, 10,
                    12, 11,
                    14, 12,
                    16, 13,
                    18, 14
                ],
                "text-transform": "none",
                "text-letter-spacing": 0,
                "text-max-width": 4,
                "text-line-height": 1.2,
                "text-anchor": "center",
                "text-justify": "center",
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                "text-optional": false,
                "text-padding": 2,
                "text-keep-upright": true,
                "text-rotation-alignment": "map",
                "text-pitch-alignment": "viewport",
                "icon-image": "shield-us-interstate",
                "icon-size": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 0.8,
                    8, 0.9,
                    10, 1.0,
                    12, 1.1,
                    14, 1.2,
                    16, 1.3,
                    18, 1.4
                ],
                "icon-allow-overlap": false,
                "icon-ignore-placement": false,
                "icon-optional": false,
                "icon-padding": 2,
                "icon-keep-upright": true,
                "icon-rotation-alignment": "map",
                "icon-pitch-alignment": "viewport",
                "icon-text-fit": "both",
                "icon-text-fit-padding": [2, 2, 2, 2]
            },
            paint: {
                "text-color": "#ffffff",
                "text-halo-color": "rgba(0,0,0,0.8)",
                "text-halo-width": 1.5,
                "text-halo-blur": 0,
                "text-opacity": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 0.8,
                    8, 0.9,
                    10, 1.0,
                    14, 1.0,
                    18, 1.0
                ],
                "icon-opacity": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 0.8,
                    8, 0.9,
                    10, 1.0,
                    14, 1.0,
                    18, 1.0
                ]
            }
        });
    }

    // === Road Labels with Shields (Google Maps Style) ===
    // Only show labels for roads that have both ref and shield
    if (!map.getLayer("road-labels-with-shields")) {
        map.addLayer({
            id: "road-labels-with-shields",
            type: "symbol",
            source: sourceName,
            "source-layer": "road",
            minzoom: 6,
            maxzoom: 24,
            filter: [
                "all",
                ["has", "ref"],
                ["has", "shield"],
                ["!=", ["get", "ref"], ""],
                ["!=", ["get", "shield"], ""],
                [
                    "match", 
                    ["get", "class"], 
                    ["trunk", "trunk_link", "primary", "primary_link", "secondary", "secondary_link", "tertiary", "tertiary_link"], 
                    true, 
                    false
                ]
            ],
            layout: {
                "symbol-placement": "line",
                "symbol-spacing": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 150,
                    8, 200,
                    10, 250,
                    12, 300,
                    14, 350,
                    16, 400,
                    18, 450
                ],
                "text-field": ["get", "ref"],
                "text-font": [
                    "step",
                    ["zoom"],
                    ["literal", ["DIN Pro Regular", "Arial Unicode MS Regular"]],
                    8,
                    ["literal", ["DIN Pro Medium", "Arial Unicode MS Regular"]],
                    10,
                    ["literal", ["DIN Pro Bold", "Arial Unicode MS Bold"]]
                ],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 8,
                    8, 9,
                    10, 10,
                    12, 11,
                    14, 12,
                    16, 13,
                    18, 14
                ],
                "text-transform": "none",
                "text-letter-spacing": 0,
                "text-max-width": 4,
                "text-line-height": 1.2,
                "text-anchor": "center",
                "text-justify": "center",
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                "text-optional": false,
                "text-padding": 2,
                "text-keep-upright": true,
                "text-rotation-alignment": "map",
                "text-pitch-alignment": "viewport",
                "icon-image": [
                    "match",
                    ["get", "shield"],
                    "us-highway", "shield-us-highway",
                    "us-highway-duplex", "shield-us-highway",
                    "us-highway-alternate", "shield-us-highway",
                    "us-highway-business", "shield-us-highway",
                    "us-highway-bypass", "shield-us-highway",
                    "us-highway-truck", "shield-us-highway",
                    "us-highway-spur", "shield-us-highway",
                    "us-highway-loop", "shield-us-highway",
                    "us-state", "shield-us-state",
                    "us-state-business", "shield-us-state",
                    "us-state-alternate", "shield-us-state",
                    "us-state-bypass", "shield-us-state",
                    "us-state-spur", "shield-us-state",
                    "us-state-loop", "shield-us-state",
                    "us-bia", "shield-us-bia",
                    "default", "shield-default",
                    "rectangle-white", "shield-rectangle-white",
                    "rectangle-red", "shield-rectangle-red",
                    "rectangle-orange", "shield-rectangle-orange",
                    "rectangle-yellow", "shield-rectangle-yellow",
                    "rectangle-green", "shield-rectangle-green",
                    "rectangle-blue", "shield-rectangle-blue",
                    "circle-white", "shield-circle-white",
                    "shield-default"
                ],
                "icon-size": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 0.8,
                    8, 0.9,
                    10, 1.0,
                    12, 1.1,
                    14, 1.2,
                    16, 1.3,
                    18, 1.4
                ],
                "icon-allow-overlap": false,
                "icon-ignore-placement": false,
                "icon-optional": false,
                "icon-padding": 2,
                "icon-keep-upright": true,
                "icon-rotation-alignment": "map",
                "icon-pitch-alignment": "viewport",
                "icon-text-fit": "both",
                "icon-text-fit-padding": [2, 2, 2, 2]
            },
            paint: {
                "text-color": [
                    "match",
                    ["get", "shield_text_color"],
                    "black", "#000000",
                    "blue", "#0066cc",
                    "white", "#ffffff",
                    "yellow", "#ffff00",
                    "orange", "#ff6600",
                    "#000000"
                ],
                "text-halo-color": "rgba(255,255,255,0.8)",
                "text-halo-width": 0.5,
                "text-halo-blur": 0,
                "text-opacity": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 0.8,
                    8, 0.9,
                    10, 1.0,
                    14, 1.0,
                    18, 1.0
                ],
                "icon-opacity": [
                    "interpolate", ["linear"], ["zoom"],
                    6, 0.8,
                    8, 0.9,
                    10, 1.0,
                    14, 1.0,
                    18, 1.0
                ]
            }
        });
    }

    // === Road Name Labels (for roads without shields) ===
    if (!map.getLayer("road-name-labels")) {
        map.addLayer({
            id: "road-name-labels",
            type: "symbol",
            source: sourceName,
            "source-layer": "road",
            minzoom: 8,
            maxzoom: 24,
            filter: [
                "all",
                ["has", "name"],
                [
                    "any",
                    ["!", ["has", "ref"]],
                    ["!", ["has", "shield"]],
                    ["==", ["get", "ref"], ""],
                    ["==", ["get", "shield"], ""]
                ],
                [
                    "match", 
                    ["get", "class"], 
                    ["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link", "secondary", "secondary_link", "tertiary", "tertiary_link", "street", "street_limited"], 
                    true, 
                    false
                ]
            ],
            layout: {
                "symbol-placement": "line",
                "symbol-spacing": [
                    "interpolate", ["linear"], ["zoom"],
                    8, 200,
                    10, 250,
                    12, 300,
                    14, 350,
                    16, 400,
                    18, 450
                ],
                "text-field": ["get", "name"],
                "text-font": [
                    "step",
                    ["zoom"],
                    ["literal", ["DIN Pro Regular", "Arial Unicode MS Regular"]],
                    10,
                    ["literal", ["DIN Pro Medium", "Arial Unicode MS Regular"]],
                    12,
                    ["literal", ["DIN Pro Bold", "Arial Unicode MS Bold"]]
                ],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    8, 10,
                    10, 11,
                    12, 12,
                    14, 13,
                    16, 14,
                    18, 15
                ],
                "text-transform": "none",
                "text-letter-spacing": 0,
                "text-max-width": 8,
                "text-line-height": 1.2,
                "text-anchor": "center",
                "text-justify": "center",
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                "text-optional": false,
                "text-padding": 2,
                "text-keep-upright": true,
                "text-rotation-alignment": "map",
                "text-pitch-alignment": "viewport"
            },
            paint: {
                "text-color": [
                    "step",
                    ["zoom"],
                    "#666666",
                    10,
                    [
                        "match",
                        ["get", "class"],
                        ["motorway", "motorway_link"], "#ffffff",
                        ["trunk", "trunk_link"], "#000000",
                        ["primary", "primary_link"], "#000000",
                        ["secondary", "secondary_link"], "#000000",
                        ["tertiary", "tertiary_link"], "#333333",
                        ["street", "street_limited"], "#5a5757",
                        "#666666"
                    ]
                ],
                "text-halo-color": [
                    "step",
                    ["zoom"],
                    "rgba(255,255,255,0.8)",
                    10,
                    [
                        "match",
                        ["get", "class"],
                        ["motorway", "motorway_link"], "rgba(0,0,0,0.8)",
                        ["trunk", "trunk_link"], "rgba(255,255,255,0.8)",
                        ["primary", "primary_link"], "rgba(255,255,255,0.8)",
                        ["secondary", "secondary_link"], "rgba(255,255,255,0.8)",
                        ["tertiary", "tertiary_link"], "rgba(255,255,255,0.6)",
                        ["street", "street_limited"], "rgba(255,255,255,0.4)",
                        "rgba(255,255,255,0.5)"
                    ]
                ],
                "text-halo-width": [
                    "step",
                    ["zoom"],
                    0.5,
                    10,
                    [
                        "match",
                        ["get", "class"],
                        ["motorway", "motorway_link"], 1.5,
                        ["trunk", "trunk_link"], 1,
                        ["primary", "primary_link"], 1,
                        ["secondary", "secondary_link"], 0.8,
                        ["tertiary", "tertiary_link"], 0.6,
                        ["street", "street_limited"], 0.4,
                        0.5
                    ]
                ],
                "text-halo-blur": 0,
                "text-opacity": [
                    "interpolate", ["linear"], ["zoom"],
                    8, 0.8,
                    10, 0.9,
                    12, 1.0,
                    14, 1.0,
                    18, 1.0
                ]
            }
        });
    }
}
