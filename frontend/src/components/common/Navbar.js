"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MdMyLocation } from "react-icons/md";
import Image from "next/image";

export default function MapNavbar({
    searchValue,
    setSearchValue,
    results,
    setResults,
    onSelectResult,
    handleUseMyLocation,
    mode
}) {
    const [showAbout, setShowAbout] = useState(false);

    return (
        <div className="absolute top-4 right-4 z-50 flex gap-4">

            {mode === "search" && (
                <button
                    onClick={handleUseMyLocation}
                    className="py-1.5 px-3 rounded-xl shadow-md cursor-pointer"
                    style={{ backgroundColor: "rgba(136, 136, 136, 0.85)" }}
                    title="Go to My Location"
                >
                    <MdMyLocation className="w-5 h-5 text-white font-bold" />
                </button>
            )}
            
            {/* Search input inside navbar */}
            {mode === "search" && (
                <div className="relative w-xl text-white">
                    <div className="relative rounded-xl">
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search address..."
                            className="w-full px-3 py-1.5 pr-10 border border-gray-300 rounded-xl text-sm text-white font-bold text-xl focus:outline-white placeholder-white"
                            style={{ backgroundColor: "rgba(136, 136, 136, 0.85)" }}
                        />

                        {searchValue && (
                            <button
                                onClick={() => {
                                    setSearchValue("");
                                    setResults([]);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xl text-white font-bold"
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {searchValue && results.length > 0 && (
                        <ul className="absolute top-10 left-0 right-0 border border-gray-200 rounded shadow-sm max-h-48 overflow-y-auto bg-white text-sm z-50">
                            {results.map((feature) => (
                                <li
                                    key={feature.id}
                                    onClick={() => onSelectResult(feature)}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black"
                                >
                                    {feature.place_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Login Button */}
            <Link 
                className="text-white font-bold text-xl px-10 py-1.5 rounded-xl shadow cursor-pointer flex items-center gap-3"
                style={{ backgroundColor: "rgba(136, 136, 136, 0.85)" }}
                href="/signin"
            >
                <Image
                    src="/logo/liquos-logo-white.png"
                    alt="Water Report Card"
                    width={25}
                    height={25}
                    className="text-white"
                />
                <span>LiquosLabs<sup>™</sup> Login</span>
            </Link>

            {/* About Button with hover panel */}
            <div
                className="relative"
                onMouseEnter={() => setShowAbout(true)}
                onMouseLeave={() => setShowAbout(false)}
            >
                <button
                    className="text-white font-bold text-xl w-60 px-6 py-1.5 rounded-xl shadow cursor-pointer"
                    style={{ backgroundColor: "rgba(136, 136, 136, 0.85)" }}
                >
                    About
                </button>

                {/* Description Box */}
                {showAbout && (
                    <div 
                        className="absolute top-14 right-0 w-60 p-4 rounded-md text-white text-md shadow-md z-50"
                        style={{ backgroundColor: "rgba(136, 136, 136, 0.85)" }}
                    >
                        <p>
                            We&apos;ve mapped 44,000 water districts in the USA, and created a water quality scorecard
                            for each one based on your water district&apos;s EPA water quality report, real-time data
                            from <span className="font-bold">LiquosLabs<sup>™</sup></span> IoT customers and Citizen Scientists just like you.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
