"use client"

import { useRef, useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { defaultCenter, maxBounds, defaultStyleId } from "./constants";
import { addWaterLayers } from "./layers/useWaterLayers";
import { addCustomPlaceLabels } from "./layers/usePlaceLabels";
import { updateWaterBoundariesVisibility } from "./layers/useLayerVisibility";
import { useFeatureClick } from "./interaction/useFeatureClick";
import { useFeatureHover } from "./interaction/useFeatureHover";
import { useSearch } from "./controls/useSearch";
import { useLocation } from "./controls/useLocation";
import { useStyleSwitcher } from "./controls/useStyleSwitcher";
import { MAPBOX_ACCESS_TOKEN } from "@/config/envConfig";
import { addCustomRoadLabels } from "./layers/useRoadLabels";
import { loadAndApplyLabelStyles } from "./layers/useLabelStylesAPI";

export function useWaterMap() {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [results, setResults] = useState([]);
    const [selectedFeatureProps, setSelectedFeatureProps] = useState(null);
    const [isClicked, setIsClicked] = useState(false);    
    const [hoveredFeatureProps, setHoveredFeatureProps] = useState(null);
    const [searchStarted, setSearchStarted] = useState(false);
    const [showSearchControls, setShowSearchControls] = useState(true);
    const [showLayerControl, setShowLayerControl] = useState(false);
    const [waterBoundariesVisible, setWaterBoundariesVisible] = useState(true);
    const [searchMarker, setSearchMarker] = useState(null);
    const [currentStyle, switchStyle] = useStyleSwitcher(map, defaultStyleId);
    const [searchMode, setSearchMode] = useState("start"); 
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    const [hoveredFeatureId, setHoveredFeatureId] = useState(null);

    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (mapRef.current) {
          setReady(true);
        }
    }, [mapRef.current]);

    useEffect(() => {

        if (!ready || map) return; 
    
        if (!MAPBOX_ACCESS_TOKEN) throw new Error("Missing Mapbox access token");
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        const mbMap = new mapboxgl.Map({
            container: mapRef.current,
            style: `mapbox://styles/healer-mapbox/${defaultStyleId}`,
            zoom: 2,
            center: defaultCenter,
            attributionControl: false,
            maxBounds,
            preserveDrawingBuffer: true // This might help with layer ordering
        });

        // Function to handle layer positioning after map is fully loaded
        const handleLayerPositioning = async () => {
            // Wait a bit more for the map to be fully ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Add water layers first
            await addWaterLayers(mbMap);
            updateWaterBoundariesVisibility(mbMap, waterBoundariesVisible);
            
            // Wait for water layers to be added
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Add custom labels
            // addCustomRoadLabels(mbMap);
            addCustomPlaceLabels(mbMap);
            
            // Wait for label layers to be added
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Apply saved label styles from admin panel
            await loadAndApplyLabelStyles(mbMap);
            
            // Move all label layers to the top so they appear above polygons
            const labelLayerIds = [
                'place-country-label', 'place-state-label', 'place-capital-label',
                'place-city-major-label', 'place-city-medium-label', 'place-city-small-label', 'place-village-label',
                'road-label-motorway', 'road-label-trunk', 'road-label-primary', 'road-label-secondary', 
                'road-label-tertiary', 'road-label-street', 'road-label-service', 'road-label-path', 'road-label-track'
            ];
            
            labelLayerIds.forEach(layerId => {
                if (mbMap.getLayer(layerId)) {
                    mbMap.moveLayer(layerId);
                }
            });
        };

        mbMap.once("load", async () => {
            // Wait for the map to be fully idle before positioning layers
            mbMap.once("idle", handleLayerPositioning);
        });

        setMap(mbMap);
 
        return () => mbMap.remove();
    }, [ready]);

    useEffect(() => {
        if (map) updateWaterBoundariesVisibility(map, waterBoundariesVisible);
    }, [map, waterBoundariesVisible]);

    useFeatureClick(map, setSelectedFeatureProps, setIsClicked, setSelectedFeatureId);
    useFeatureHover(map, setHoveredFeatureProps, setHoveredFeatureId, selectedFeatureId);

    const handleSelectResult = useSearch(
        map,
        setSearchValue,
        setSearchStarted,
        setHoveredFeatureProps,
        setShowSearchControls,
        setShowLayerControl,
        setSearchMarker,
        setResults
    );

    const handleUseMyLocation = useLocation(
        map,
        setSearchStarted,
        setHoveredFeatureProps,
        setShowSearchControls,
        setShowLayerControl,
        setSearchMarker
    );


    useEffect(() => {
        if (searchValue.length < 3) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                searchValue
            )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=us&limit=5`,
            { signal: controller.signal }
        )
            .then((res) => res.json())
            .then((data) => setResults(data.features || []))
            .catch(() => {});

        return () => controller.abort();
    }, [searchValue]);

    const handleReset = () => {

        if (typeof window === "undefined" || !map) return;
    
        setSearchStarted(false);
        setShowSearchControls(true);
        setShowLayerControl(false);
        setSearchValue("");
        setResults([]);
        setSelectedFeatureProps(null);
        setHoveredFeatureProps(null);
        setIsClicked(false);
        setSelectedFeatureId(null);
        setHoveredFeatureId(null);

        ["water_districts_selected", "water_districts_selected_outline"].forEach(
            (layerId) => {
                if (map.getLayer(layerId)) {
                    map.setFilter(layerId, ["==", ["get", "pwsid"], ""]);
                }
            }
        );

        if (searchMarker) {
            searchMarker.remove();
            setSearchMarker(null);
        }
    
        map.flyTo({ center: defaultCenter, zoom: 2 });
    };

    return {
        mapRef,
        map,
        searchValue,
        setSearchValue,
        results,
        setResults,
        handleSelectResult,
        handleUseMyLocation,
        searchStarted,
        setSearchStarted,
        showSearchControls,
        showLayerControl,
        handleReset,
        selectedFeatureProps,
        hoveredFeatureProps,
        isClicked: !!selectedFeatureProps && (!hoveredFeatureProps || hoveredFeatureId === selectedFeatureId),
        currentStyle,
        switchStyle,
        toggleWaterBoundaries: () => setWaterBoundariesVisible(v => !v),
        waterBoundariesVisible,
        searchMode,
        setSearchMode,
    };
}