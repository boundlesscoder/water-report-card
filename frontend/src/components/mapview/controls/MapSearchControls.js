"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function MapSearchControls({ setSearchStarted, handleUseMyLocation, mode, setMode }) {

    if (mode === "hidden") return null;

    return (
        <>
            {/* Background Image (only in 'start' mode) */}
            {mode === "start" && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                    <div className="relative max-w-3/5 flex justify-center items-center bg-gradient-to-t from-[#1CA9F3] to-transparent">
                        <Image
                            src="/logo/water-report-card-logo.svg"
                            alt="Background"
                            priority
                            layout="intrinsic" // Will maintain image's aspect ratio
                            width={200}         // Adjust these to match actual image dimensions
                            height={200}
                            className="rounded"
                        />
                        <div className="text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-center font-bold mx-6">
                            <div className="text-white">What&apos;s in Your Tap Water?</div>
                        </div>
                    </div>

                    <div className="space-x-18 flex items-center justify-center mt-10 bg-gradient-to-t from-[#797979] to-[#B7B7B7] px-14 py-4 rounded-full">
                        <button
                            onClick={() => {
                                handleUseMyLocation();
                                setSearchStarted?.(true);
                                setMode("hidden"); // ✅ Hides the overlay
                            }}
                            className="bg-white text-gray-800 px-6 py-1 rounded-full hover:bg-gray-200 cursor-pointer font-bold text-xl"
                        >
                            Use My Location
                        </button>
                        <button
                            onClick={() => {
                                setMode("search");
                                setSearchStarted?.(true); // ✅ Add this line
                            }}
                            className="bg-[#1CA9F3] hover:bg-[#178DD0] text-white px-6 py-1 rounded-full cursor-pointer text-xl font-bold"
                        >
                            Enter Address
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
