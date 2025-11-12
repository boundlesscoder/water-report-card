"use client";

import React from "react";

export default function FeatureFilterPanel({ selectedFeatureId, onFilterSelect, onClose }) {
    const filters = [
        { label: "Drinking water", icon: "💧", type: "drinking_water" },
        { label: "Coffee, Espresso, Tea", icon: "☕", type: "coffee_tea" },
        { label: "Ice", icon: "❄️", type: "ice" },
        { label: "Fountain beverages", icon: "🥤", type: "fountain" },
        { label: "Cold carbonated beverages", icon: "🧃", type: "carbonated" },
    ];

    const handleClick = (filterType) => {
        if (!selectedFeatureId) return;
        onFilterSelect(filterType, selectedFeatureId);
    };

    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-lg shadow-md px-4 py-2 flex space-x-2">
            {filters.map((filter) => (
                <button
                    key={filter.type}
                    onClick={() => handleClick(filter.type)}
                    className="flex flex-col items-center text-xs hover:bg-gray-100 p-2 rounded"
                >
                    <span className="text-xl">{filter.icon}</span>
                    <div className="text-black">{filter.label}</div>
                </button>
            ))}
            <button onClick={onClose} className="ml-2 text-sm text-gray-500 hover:text-gray-700">✕</button>
        </div>
    );
}
