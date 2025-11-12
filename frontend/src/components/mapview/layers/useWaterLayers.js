"use client";

async function fetchLayerStyles() {
    try {
        const response = await fetch('/api/layer-styles/styles');
        
        if (!response.ok) {
            console.warn('API not available, using default styles');
            return getDefaultLayerStyles();
        }
        
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            console.error('Failed to fetch layer styles:', data.message);
            return getDefaultLayerStyles();
        }
    } catch (error) {
        console.error('Error fetching layer styles:', error);
        return getDefaultLayerStyles();
    }
}

// Validate paint properties against layer type
function validatePaintProperties(layerType, paintProperties) {
    if (!paintProperties || typeof paintProperties !== 'object') {
        return null;
    }
    
    const validProperties = {
        fill: ['fill-color', 'fill-opacity', 'fill-outline-color', 'fill-pattern'],
        line: ['line-color', 'line-width', 'line-opacity', 'line-dasharray', 'line-join', 'line-cap'],
        symbol: ['text-color', 'text-halo-color', 'text-halo-width', 'icon-color', 'icon-opacity', 'text-opacity', 'icon-stroke', 'icon-stroke-width'],
        circle: ['circle-color', 'circle-radius', 'circle-opacity', 'circle-stroke-color', 'circle-stroke-width'],
        heatmap: ['heatmap-color', 'heatmap-intensity', 'heatmap-opacity', 'heatmap-radius', 'heatmap-weight'],
        hillshade: ['hillshade-accent-color', 'hillshade-illumination-anchor', 'hillshade-illumination-color', 'hillshade-shadow-color'],
        raster: ['raster-brightness-max', 'raster-brightness-min', 'raster-contrast', 'raster-fade-duration', 'raster-hue-rotate', 'raster-opacity', 'raster-resampling', 'raster-saturation']
    };
    
    const allowedProperties = validProperties[layerType];
    if (!allowedProperties) {
        console.warn(`Unknown layer type: ${layerType}`);
        return null;
    }
    
    const filteredProperties = {};
    let hasValidProperties = false;
    
    // Only include properties that are valid for this layer type
    for (const [key, value] of Object.entries(paintProperties)) {
        if (allowedProperties.includes(key)) {
            filteredProperties[key] = value;
            hasValidProperties = true;
        }
        // Silently ignore invalid properties - they should be cleaned by backend
    }
    
    return hasValidProperties ? filteredProperties : null;
}

// Default layer styles as fallback
function getDefaultLayerStyles() {
    return [
        {
            layer_id: "water-fill",
            layer_type: "fill",
            paint_properties: { "fill-color": "#cae9eb", "fill-opacity": 0.5 },
            filter_properties: null
        },
        {
            layer_id: "water_districts_borders",
            layer_type: "line",
            paint_properties: { "line-color": "#999999", "line-width": 1.5 },
            filter_properties: null
        },
        {
            layer_id: "water_districts_selected",
            layer_type: "fill",
            paint_properties: { "fill-color": "#d3e9b2", "fill-opacity": 0.5 },
            filter_properties: ["==", ["get", "pwsid"], ""]
        },
        {
            layer_id: "water_districts_selected_outline",
            layer_type: "line",
            paint_properties: { "line-color": "#f59836", "line-width": 1.5 },
            filter_properties: ["==", ["get", "pwsid"], ""]
        },
        {
            layer_id: "water_quality_reports",
            layer_type: "circle",
            paint_properties: { 
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 16, 12],
                "circle-color": [
                    "case",
                    [">", ["get", "analytes_exceeding_mclg"], 0], "#ff4444",
                    [">", ["get", "analytes_detected"], 0], "#ffaa00",
                    "#44aa44"
                ],
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2
            },
            filter_properties: null
        }
    ];
}

export async function addWaterLayers(map) {
    const sourceId = "water_districts";

    // ✅ Step 1: Add vector source
    if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
            type: "vector",
            tiles: ["https://waterreportcard.com/api/tiles/{z}/{x}/{y}.pbf"],
        });
    }

    // ✅ Step 2: Add water quality report points source
    if (!map.getSource("water_quality_reports")) {
        map.addSource("water_quality_reports", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: []
            }
        });
    }

    // ✅ Step 3: Fetch layer styles from API
    const layerStyles = await fetchLayerStyles();
    
    // ✅ Step 4: Add layers dynamically    
    for (const style of layerStyles) {
        if (!map.getLayer(style.layer_id)) {
            // Validate paint properties against layer type
            const validPaintProperties = validatePaintProperties(style.layer_type, style.paint_properties);
            
            if (validPaintProperties === null) {
                console.warn(`Skipping layer ${style.layer_id}: Invalid paint properties for layer type ${style.layer_type}`);
                continue;
            }
            
            const layerConfig = {
                id: style.layer_id,
                type: style.layer_type,
                source: sourceId,
                "source-layer": "Boundaries",
                paint: validPaintProperties,
                ...(style.filter_properties && { filter: style.filter_properties }),
            };

            map.addLayer(layerConfig);
        }
    }

    // ✅ Step 5: Add water quality reports layer
    if (!map.getLayer("water_quality_reports") && map.getSource("water_quality_reports")) {
        map.addLayer({
            id: "water_quality_reports",
            type: "circle",
            source: "water_quality_reports",
            paint: {
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 16, 12],
                "circle-color": [
                    "case",
                    [">", ["get", "analytes_exceeding_mclg"], 0], "#ff4444",
                    [">", ["get", "analytes_detected"], 0], "#ffaa00",
                    "#44aa44"
                ],
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2
            }
        });
    }
}
