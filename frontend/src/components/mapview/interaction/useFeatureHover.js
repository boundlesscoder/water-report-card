"use client"

import { useEffect } from "react";

export function useFeatureHover(map, setHoveredFeatureProps, setHoveredFeatureId, selectedFeatureId) {
    useEffect(() => {
        if (!map) return;
    
        const handleHover = (e) => {

            const feature = e.features?.[0];
            if (feature) {
                const pwsid = feature.properties.PWSID;
            
                // 🟡 Skip if hovering the already selected feature
                if (pwsid === selectedFeatureId) {
                    setHoveredFeatureProps(null);
                    setHoveredFeatureId(null);
                    return;
                }
            
                setHoveredFeatureProps(feature.properties);
                setHoveredFeatureId(pwsid);
            
                ["water_districts_selected", "water_districts_selected_outline"].forEach((layerId) => {
                    if (map.getLayer(layerId)) {
                        // Try both PWSID and pwsid for compatibility
                        map.setFilter(layerId, ["==", ["get", "PWSID"], pwsid]);
                    }
                });
            } else {
                setHoveredFeatureProps(null);
                setHoveredFeatureId(null);
            
                // Restore selected feature highlight on hover leave
                if (selectedFeatureId) {
                    ["water_districts_selected", "water_districts_selected_outline"].forEach((layerId) => {
                        if (map.getLayer(layerId)) {
                            map.setFilter(layerId, ["==", ["get", "PWSID"], selectedFeatureId]);
                        }
                    });
                } else {
                    ["water_districts_selected", "water_districts_selected_outline"].forEach((layerId) => {
                        if (map.getLayer(layerId)) {
                            map.setFilter(layerId, ["==", ["get", "PWSID"], ""]);
                        }
                    });
                }
            }            
        };
    
        map.on("mousemove", "water-fill", handleHover);
        map.on("mouseenter", "water-fill", () => map.getCanvas().style.cursor = "pointer");
        map.on("mouseleave", "water-fill", () => map.getCanvas().style.cursor = "");
    
        return () => {
            map.off("mousemove", "water-fill", handleHover);
        };
    }, [map,setHoveredFeatureProps]);
}