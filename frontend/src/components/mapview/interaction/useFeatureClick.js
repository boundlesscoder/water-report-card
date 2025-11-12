"use client";

import { useEffect } from "react";

export function useFeatureClick(map, setSelectedFeatureProps, setIsClicked, setSelectedFeatureId) {
    useEffect(() => {
        if (!map) return;

        const handleClick = (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["water-fill"]
            });

            const feature = features?.[0];

            if (feature) {
                const pwsid = feature.properties.pwsid;
                setSelectedFeatureProps(feature.properties);
                setSelectedFeatureId(pwsid);       // ✅ Track selected ID
                setIsClicked(true);
            
                ["water_districts_selected", "water_districts_selected_outline"].forEach((layerId) => {
                    if (map.getLayer(layerId)) {
                        map.setFilter(layerId, ["==", ["get", "pwsid"], pwsid]);
                    }
                });
            } else {
                setSelectedFeatureProps(null);
                setSelectedFeatureId(null);       // ✅ Reset
                setIsClicked(false);
            
                ["water_districts_selected", "water_districts_selected_outline"].forEach((layerId) => {
                    if (map.getLayer(layerId)) {
                        map.setFilter(layerId, ["==", ["get", "pwsid"], ""]);
                    }
                });
            }
            
        };

        map.on("click", handleClick);

        return () => {
            map.off("click", handleClick);
        };
    }, [map, setSelectedFeatureProps, setIsClicked]);
}
