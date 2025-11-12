"use client";

import mapboxgl from "mapbox-gl";

export function useSearch(
    map,
    setSearchValue,
    setSearchStarted,
    setHoveredFeatureProps,
    setShowSearchControls,
    setShowLayerControl,
    setSearchMarker,
    setResults
) {
    return function handleSelectResult(feature) {

        const coordinates = feature.center || feature.geometry?.coordinates;
        if (!map || !coordinates) return;

        setSearchValue("");
        setResults([]);
        setSearchStarted(true);
        setShowSearchControls(false);
        setShowLayerControl(true);

        map.flyTo({ center: coordinates, zoom: 13 });

        map.once("moveend", () => {
            const point = map.project(coordinates);
            const features = map.queryRenderedFeatures(point, {
                layers: ["water-fill"],
            });

            const marker = new mapboxgl.Marker({ color: "#1CA9F3" }).setLngLat(coordinates).addTo(map);
            setSearchMarker((prev) => {
                if (prev) prev.remove();
                return marker;
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
    };
}