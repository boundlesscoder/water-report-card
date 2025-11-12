"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function ScorecardPopup({ featureProps, onClose, isVisible }) {
    const [animatedValues, setAnimatedValues] = useState({
        plumbing: 0,
        contaminant: 0,
        compliance: 0
    });

    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Threshold values for each metric
    const thresholds = {
        plumbing: 78,
        contaminant: 82,
        compliance: 18
    };

    // Maximum values for 100% progress (what each gauge considers "full")
    const maxValues = {
        plumbing: 100,
        contaminant: 100,
        compliance: 100
    };

    // Animation duration in milliseconds
    const animationDuration = 1500;

    useEffect(() => {
        if (isVisible) {
            // Simulate loading time
            setIsLoading(true);
            setAnimatedValues({ plumbing: 0, contaminant: 0, compliance: 0 });
            
            // Simulate API fetch delay (1.5 seconds)
            const loadingTimer = setTimeout(() => {
                setIsLoading(false);
                setIsAnimating(true);
                
                // Animate values from 0 to threshold
                const startTime = Date.now();
                
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / animationDuration, 1);
                    
                    // Easing function for smooth animation
                    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                    
                    setAnimatedValues({
                        plumbing: Math.round(thresholds.plumbing * easeOutQuart),
                        contaminant: Math.round(thresholds.contaminant * easeOutQuart),
                        compliance: Math.round(thresholds.compliance * easeOutQuart)
                    });
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        setIsAnimating(false);
                    }
                };
                
                requestAnimationFrame(animate);
            }, 1500);
            
            return () => clearTimeout(loadingTimer);
        } else {
            // Reset values when popup closes
            setAnimatedValues({ plumbing: 0, contaminant: 0, compliance: 0 });
            setIsAnimating(false);
            setIsLoading(true);
        }
    }, [isVisible]); // Only depend on isVisible, not isAnimating

    if (!isVisible || !featureProps) return null;

    const getGaugeColor = (metric) => {
        if (metric === 'plumbing') return '#FF8C00'; // Orange
        if (metric === 'contaminant') return '#FF4444'; // Red
        if (metric === 'compliance') return '#4A90E2'; // Blue
        return '#999999';
    };

    const getGaugeLabel = (metric) => {
        if (metric === 'plumbing') return 'Your Plumbing';
        if (metric === 'contaminant') return 'Contaminant';
        if (metric === 'compliance') return 'Compliance';
        return '';
    };

    const getSecondaryLabel = (metric) => {
        if (metric === 'plumbing') return 'Hardness > 170 ppm';
        return '';
    };

    const getGaugeValue = (metric) => {
        return animatedValues[metric];
    };

    const getGaugePercentage = (metric) => {
        const value = getGaugeValue(metric);
        const maxValue = maxValues[metric];
        // Calculate percentage based on max value (100% = full circle)
        return (value / maxValue) * 100;
    };

    return (
        <div className="w-[432px] bg-gradient-to-b from-[#406582] to-[#0a0f18] shadow-xl rounded-xl p-6 mt-4">

            {/* Scorecard Grid - Compact 3-column layout */}
            <div className="grid grid-cols-3 gap-3 items-start">
                {/* Plumbing Gauge */}
                <div className="flex flex-col items-center">
                    <div className="relative w-30 h-30 mb-3">

                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="35"
                                fill="none"
                                stroke="#647d93"
                                strokeWidth="2"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="35"
                                fill="none"
                                stroke={getGaugeColor('plumbing')}
                                strokeWidth="8"
                                strokeLinecap="butt"
                                strokeDasharray={`${2 * Math.PI * 35}`}
                                strokeDashoffset={`${2 * Math.PI * 35 * (1 - getGaugePercentage('plumbing') / 100)}`}
                                className="transition-all duration-1000 ease-out"
                                transform="rotate(135 50 50)"
                            />
                        </svg>
                        
                        <div className="absolute inset-0">
                            {/* Number - absolutely centered in the circle */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-3xl font-bold">
                                    {isLoading ? (
                                        <div className="relative">
                                            <div className="w-10 h-10 relative">
                                                {/* Outer ring */}
                                                <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                                                {/* Animated ring */}
                                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-white animate-spin"></div>
                                                {/* Inner pulse */}
                                                <div className="absolute inset-2 rounded-full bg-white/10 animate-pulse"></div>
                                                {/* Center dot */}
                                                <div className="absolute inset-4 rounded-full bg-white animate-pulse"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        getGaugeValue('plumbing')
                                    )}
                                </div>
                            </div>
                            {/* Icon positioned below the number */}
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                <div className="w-12 h-12 bg-[#1a2d39] rounded-full flex items-center justify-center p-2">
                                    <Image
                                        src="/mapview/score-card-popup/plumbing.svg"
                                        alt="Plumbing Icon"
                                        width={24}
                                        height={24}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    

                    
                    <h4 className="text-white text-sm font-semibold text-center mb-0.5">
                        {getGaugeLabel('plumbing')}
                    </h4>
                    {getSecondaryLabel('plumbing') && (
                        <p className="text-white text-xs text-center">
                            {getSecondaryLabel('plumbing')}
                        </p>
                    )}
                </div>

                {/* Contaminant Gauge */}
                <div className="flex flex-col items-center">
                    <div className="relative w-30 h-30 mb-3">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="35"
                                fill="none"
                                stroke="#647d93"
                                strokeWidth="2"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="35"
                                fill="none"
                                stroke={getGaugeColor('contaminant')}
                                strokeWidth="8"
                                strokeLinecap="butt"
                                strokeDasharray={`${2 * Math.PI * 35}`}
                                strokeDashoffset={`${2 * Math.PI * 35 * (1 - getGaugePercentage('contaminant') / 100)}`}
                                className="transition-all duration-1000 ease-out"
                                transform="rotate(135 50 50)"
                            />
                        </svg>
                        
                        <div className="absolute inset-0">
                            {/* Number - absolutely centered in the circle */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-3xl font-bold">
                                    {isLoading ? (
                                        <div className="relative">
                                            <div className="w-10 h-10 relative">
                                                {/* Outer ring */}
                                                <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                                                {/* Animated ring */}
                                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-white animate-spin"></div>
                                                {/* Inner pulse */}
                                                <div className="absolute inset-2 rounded-full bg-white/10 animate-pulse"></div>
                                                {/* Center dot */}
                                                <div className="absolute inset-4 rounded-full bg-white animate-pulse"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        getGaugeValue('contaminant')
                                    )}
                                </div>
                            </div>
                            {/* Icon positioned below the number */}
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                <div className="w-12 h-12 bg-[#1a2d39] rounded-full flex items-center justify-center p-2">
                                    <span className="text-red-500 text-4xl font-black">!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    

                    
                    <h4 className="text-white text-sm font-semibold text-center">
                        {getGaugeLabel('contaminant')}
                    </h4>
                </div>

                {/* Compliance Gauge */}
                <div className="flex flex-col items-center">
                    <div className="relative w-30 h-30 mb-3">

                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="35"
                                fill="none"
                                stroke="#647d93"
                                strokeWidth="2"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="35"
                                fill="none"
                                stroke={getGaugeColor('compliance')}
                                strokeWidth="8"
                                strokeLinecap="butt"
                                strokeDasharray={`${2 * Math.PI * 35}`}
                                strokeDashoffset={`${2 * Math.PI * 35 * (1 - getGaugePercentage('compliance') / 100)}`}
                                className="transition-all duration-1000 ease-out"
                                transform="rotate(135 50 50)"
                            />
                        </svg>
                        
                        <div className="absolute inset-0">
                            {/* Number - absolutely centered in the circle */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-3xl font-bold">
                                    {isLoading ? (
                                        <div className="relative">
                                            <div className="w-10 h-10 relative">
                                                {/* Outer ring */}
                                                <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                                                {/* Animated ring */}
                                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-white animate-spin"></div>
                                                {/* Inner pulse */}
                                                <div className="absolute inset-2 rounded-full bg-white/10 animate-pulse"></div>
                                                {/* Center dot */}
                                                <div className="absolute inset-4 rounded-full bg-white animate-pulse"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        getGaugeValue('compliance')
                                    )}
                                </div>
                            </div>
                            {/* Icon positioned below the number */}
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                <div className="w-12 h-12 bg-[#1a2d39] rounded-full flex items-center justify-center p-2">
                                    <Image
                                        src="/mapview/score-card-popup/compliance.svg"
                                        alt="Compliance Icon"
                                        width={24}
                                        height={24}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    

                    
                    <h4 className="text-white text-sm font-semibold text-center">
                        {getGaugeLabel('compliance')}
                    </h4>
                </div>
            </div>
        </div>
    );
} 