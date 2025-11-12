"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MdOutlineLayers } from "react-icons/md";
import { LiaSatelliteSolid } from "react-icons/lia";


export default function MapLayerControl({
    currentStyle,
    switchStyle,
    defaultStyleId,
    satelliteStyleId,
    toggleWaterBoundaries,
    waterBoundariesVisible
}) {
    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [showMoreLayers, setShowMoreLayers] = useState(false);

    const duskStyleId = "cmcw9q77105w301sh91uo1sob";
    const dawnStyleId = "cmcw9it4t05uv01sb8zur18mm";
    const nightStyleId = "cmcw9scdk002v01s9hu3v8co2";
    const whiteStyleID = "cmcw9v5lb03xq01sd7owtc0aa";
    const satellite_style_Id = "cmcwa3j4p001c01sd8vlo1rps";
    const default_styleId = "cmcw9p7ex002u01s93v9zdsvd";

    // const handleMainButtonClick = () => {

    //     if (!map) return;

    //     const nextStyle = currentStyle === satelliteStyleId ? defaultStyleId : satelliteStyleId;
    //     switchStyle(nextStyle);
    // };

    return (
        <>
            {/* Layers Button */}
            <div className="absolute bottom-4 left-4 z-30">
                <div
                    className="relative"
                    onMouseEnter={() => setShowLayerMenu(true)}
                    onMouseLeave={() => setShowLayerMenu(false)}
                >
                    <div className="flex items-end">
                        {/* Main Button */}
                        <button
                            className="relative shadow-md rounded-md overflow-hidden w-18 h-18 cursor-pointer"
                            // onClick={handleMainButtonClick}
                        >
                            <Image
                                src={currentStyle === satelliteStyleId ? "/mapview/satellite-day.png" : "/mapview/faded-day.png"}
                                alt="Layer preview"
                                fill
                                style={{ objectFit: "cover" }}
                            />

                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                            <div className="flex items-center absolute bottom-1 left-1/2 transform -translate-x-1/2 text-white text-sm font-medium drop-shadow">
                                {currentStyle === satelliteStyleId ? <LiaSatelliteSolid /> :  <MdOutlineLayers />}
                                <span className="">
                                    {currentStyle === satelliteStyleId ? "Satellite" : "Layers"}
                                </span>
                            </div>
                            

                        </button>

                        {/* Hover Panel */}
                        {showLayerMenu && (
                            <div className="ml-2 bg-white p-2 rounded-md shadow-lg flex space-x-2 z-30">
                                {/* <button
                                    className="flex flex-col items-center cursor-pointer"
                                    onClick={() => {
                                        switchStyle(whiteStyleID);
                                    }}
                                >
                                    <Image src="/mapview/monochrome-day.png" alt="Terrain" width={40} height={40} />
                                    <span className="text-xs text-black">White</span>
                                </button>
                                <button
                                    className="flex flex-col items-center cursor-pointer"
                                    onClick={() => {
                                        switchStyle(duskStyleId);
                                    }}
                                >
                                    <Image src="/mapview/faded-dusk.png" alt="Terrain" width={40} height={40} />
                                    <span className="text-xs text-black">Dusk</span>
                                </button>
                                <button
                                    className="flex flex-col items-center cursor-pointer"
                                    onClick={() => {
                                        switchStyle(nightStyleId);
                                    }}
                                >
                                    <Image src="/mapview/faded-dusk.png" alt="Traffic" width={40} height={40} />
                                    <span className="text-xs text-black">Night</span>
                                </button> */}
                                <button
                                    className="flex flex-col items-center cursor-pointer"
                                    onClick={() => setShowMoreLayers(true)}
                                >
                                    <div className="bg-gray-100 w-10 h-10 p-2">
                                        <MdOutlineLayers className="w-full h-full text-black"/>
                                    </div>
                                    
                                    <span className="text-xs text-black">More</span>
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* More Layers Drawer */}
            {showMoreLayers && (
                <div className="absolute bottom-24 left-4 bg-white shadow-xl rounded-lg p-4 w-64 z-40">
                    <div className="flex justify-between mb-2">
                        <span className="font-semibold text-black">Map Details</span>
                        <button 
                            onClick={() => setShowMoreLayers(false)}
                            className="text-black"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            className="flex flex-col items-center text-xs cursor-pointer text-black"
                            onClick={() => {
                                toggleWaterBoundaries();
                            }}
                        >
                            <Image src="/mapview/water_boundaries.jpg" width={40} height={40} alt="Water Boundaries View" className="w-10 h-10" />
                            Water Boundaries
                        </button>
                        <button
                            className="flex flex-col items-center text-xs text-black"
                        >
                            <Image src="/mapview/TDS_Bot.jpg" width={40} height={40} alt="TDS Bot View" className="w-10 h-10"/>
                            TDS Bot
                        </button>
                        <button className="flex flex-col items-center text-xs text-black">
                            <Image src="/mapview/tap_score.jpg" width={40} height={40} alt="Tap Score View" className="w-10 h-10"/>
                            Tap Score
                        </button>
                    </div>
                    {/* <div className="flex justify-between mb-2 mt-3 text-black">
                        <span className="font-semibold">Map Type</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            className="flex flex-col items-center text-xs cursor-pointer text-black"
                            onClick={() => {
                                switchStyle(default_styleId);
                            }}
                        >
                            <Image src="/mapview/faded-day.png" width={40} height={40} alt="Street View" />
                            Default
                        </button>
                        <button
                            className="flex flex-col items-center text-xs cursor-pointer text-black"
                            onClick={() => {
                                switchStyle(dawnStyleId);
                            }}
                        >
                            <Image src="/mapview/faded-dawn.png" width={40} height={40} alt="Street View" />
                            Dawn
                        </button>
                        <button
                            className="flex flex-col items-center text-xs cursor-pointer text-black"
                            onClick={() => {
                                switchStyle(satellite_style_Id);
                            }}
                        >
                            <Image src="/mapview/satellite-day.png" width={40} height={40} alt="Wildfire" />
                            Satellite
                        </button>
                        <button
                            className="flex flex-col items-center text-xs cursor-pointer text-black"
                            onClick={() => {
                                switchStyle(whiteStyleID);
                            }}
                        >
                            <Image src="/mapview/monochrome-day.png" width={40} height={40} alt="Air Quality" />
                            White
                        </button>
                        <button
                            className="flex flex-col items-center text-xs cursor-pointer text-black"
                            onClick={() => {
                                switchStyle(duskStyleId);
                            }}
                        >
                            <Image src="/mapview/faded-dusk.png" width={40} height={40} alt="Air Quality" />
                            Dusk
                        </button>
                        <button
                            className="flex flex-col items-center text-xs cursor-pointer text-black"
                            onClick={() => {
                                switchStyle(nightStyleId);
                            }}
                        >
                            <Image src="/mapview/faded-night.png" width={40} height={40} alt="Air Quality" />
                            Night
                        </button>
                    </div> */}
                </div>
            )}
        </>
    );
}
