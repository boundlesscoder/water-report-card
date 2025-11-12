"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import Image from "next/image";
import MapSearchControls from "@/components/mapview/controls/MapSearchControls";
import MapLayerControl from "@/components/mapview/controls/MapLayerControl";
import FeatureDetailsPanel from "@/components/mapview/panels/FeatureDetailPanel";
import MapNavbar from "@/components/common/Navbar";
import { useWaterMap } from "@/components/mapview/MapContainer";
import { defaultStyleId, satelliteStyleId } from "@/components/mapview/constants";

export default function WaterMapPage() {

    const {
        map,
        mapRef,
        selectedFeatureProps,
        hoveredFeatureProps,
        isClicked,
        searchValue,
        setSearchValue,
        results,
        setResults,
        handleSelectResult,
        handleUseMyLocation,
        showSearchControls,
        showLayerControl,
        handleReset,
        currentStyle,
        switchStyle,
        toggleWaterBoundaries,
        waterBoundariesVisible,
        searchStarted,
        setSearchStarted,
        searchMode,
        setSearchMode,
    } = useWaterMap();

    return (
        <>
            <FeatureDetailsPanel
                featureProps={hoveredFeatureProps || selectedFeatureProps}
                isClicked={isClicked}
                onClose={handleReset}
            />

            {/* {selectedFeatureId && (
                <FeatureFilterPanel
                    selectedFeatureId={selectedFeatureId}
                    onFilterSelect={handleFilterSelect}
                    onClose={handleClosePanel}
                />
            )} */}

            {map && !searchStarted && showSearchControls && (
                <MapSearchControls
                    setSearchStarted={setSearchStarted}
                    handleUseMyLocation={handleUseMyLocation}
                    mode={searchMode}
                    setMode={setSearchMode}
                />
            )}

            {map && (
                <MapNavbar
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    results={results}
                    setResults={setResults}
                    onSelectResult={handleSelectResult}
                    handleUseMyLocation={handleUseMyLocation}
                    mode={searchStarted ? "search" : "start"}
                />
            )}

            {map && searchStarted && showLayerControl && (
                <MapLayerControl
                    currentStyle={currentStyle}
                    switchStyle={switchStyle}
                    defaultStyleId={defaultStyleId}
                    satelliteStyleId={satelliteStyleId}
                    toggleWaterBoundaries={toggleWaterBoundaries}
                    waterBoundariesVisible={waterBoundariesVisible}
                />
            )}


            {map && (
                <div
                    onClick={() => {
                        handleReset();
                        setSearchMode("start");
                    }}
                    className="cursor-pointer absolute top-0 left-0 z-30"
                >
                    <Image
                        src="/logo/water-report-card-logo.svg"
                        alt="Water Report Card"
                        width={130}
                        height={130}
                        className="opacity-90 hover:opacity-100 transition-opacity duration-300"
                    />
                </div>
            )}

            <div className="relative h-screen">
                <div id="map" ref={mapRef} className="absolute inset-0 w-full h-full" />
            </div>
        </>
    );
}