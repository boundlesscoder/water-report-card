"use client";

import mapboxgl from "mapbox-gl";

export function useLocation(map, setSearchStarted, setHoveredFeatureProps, setShowSearchControls, setShowLayerControl, setSearchMarker) {
    return function handleUseMyLocation() {
        if (!navigator.geolocation) {
            alert("Geolocation not supported.");
            return;
        }
    
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coordinates = [pos.coords.longitude, pos.coords.latitude];
                map?.flyTo({ center: coordinates, zoom: 13 });

                const marker = new mapboxgl.Marker({ color: "#FF5733" }).setLngLat(coordinates).addTo(map);
                setSearchMarker((prev) => {
                    if (prev) prev.remove();
                    return marker;
                });

                setSearchStarted(true);
                setShowSearchControls(false);
                setShowLayerControl(true);  
        
                map.once("moveend", () => {
                    const point = map.project(coordinates);
                    const features = map.queryRenderedFeatures(point, {
                        layers: ["water-fill"],
                    });
        
                    if (features.length > 0) {
                        const polygonFeature = features[0];
                        const props = polygonFeature.properties;
                        setHoveredFeatureProps(props);
            
                        ["water_districts_selected", "water_districts_selected_outline"].forEach((layerId) => {
                            if (map.getLayer(layerId)) {
                                map.setFilter(layerId, ["==", ["get", "pwsid"], props.pwsid]);
                            }
                        });

                    } else {
                        console.warn("No water polygon found at this location.");
                    }
                });
            },
            (err) => {
                const messages = {
                    1: "Permission denied. Please allow location access in your browser.",
                    2: "Position unavailable. Try enabling WiFi or using a different device.",
                    3: "Request timed out. Please try again.",
                };
                alert(messages[err.code] || "Failed to get your location.");
            }
        );
    };
}