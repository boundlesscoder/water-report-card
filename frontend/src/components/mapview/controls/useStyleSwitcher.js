"use client";

import { useState } from "react";
import { addWaterLayers } from "../layers/useWaterLayers";
import { addCustomPlaceLabels } from "../layers/usePlaceLabels";
import { updateWaterBoundariesVisibility } from "../layers/useLayerVisibility";
import { addCustomRoadLabels } from "../layers/useRoadLabels";

export function useStyleSwitcher(map, initialStyleId) {
    const [currentStyle, setCurrentStyle] = useState(initialStyleId);

    function switchStyle(styleId) {
        if (!map || styleId === currentStyle) return;
        map.setStyle(`mapbox://styles/healer-mapbox/${styleId}`);

        map.once("styledata", () => {
            addWaterLayers(map);
            // addCustomRoadLabels(map); // Removed to prevent conflicts with MapContainer
            // addCustomPlaceLabels(map);
            updateWaterBoundariesVisibility(map, true);
            setCurrentStyle(styleId);
        });
    }

    return [currentStyle, switchStyle];
}