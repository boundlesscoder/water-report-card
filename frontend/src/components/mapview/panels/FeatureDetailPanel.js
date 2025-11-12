"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import ScorecardPopup from "./ScorecardPopup";


export default function FeatureDetailsPanel({ featureProps, onClose, isClicked }) {

    const h2Ref = useRef(null);
    const [isWrapped, setIsWrapped] = useState(false);

    useEffect(() => {
        if (!h2Ref.current || !featureProps) return;
    
        const el = h2Ref.current;
    
        const checkWrap = () => {
          const style = window.getComputedStyle(el);
          const lineHeight = parseFloat(style.lineHeight);
          const height = el.offsetHeight;
          setIsWrapped(height > lineHeight);
        };
    
        // Run once
        checkWrap();
    
        // Also re-check on resize
        const resizeObserver = new ResizeObserver(checkWrap);
        resizeObserver.observe(el);
    
        return () => {
          resizeObserver.disconnect();
        };
      }, [featureProps]);
    

    // ✅ Early return *after* hooks
    if (!featureProps) return null;

    return (
        <>
            <div className="absolute right-5 top-12 mt-16 flex flex-col items-end z-20">
                <div
                    className="w-72 bg-[#5EC8D8] opacity-95 shadow-xl rounded-xl px-4 py-3"
                >
                {/* <div className="flex justify-between">
                    <button
                        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 text-white font-bold text-2xl"
                        onClick={onClose}
                        title="Close popup"
                    >
                    ✕
                    </button>
                </div> */}

                <div className="flex items-start gap-5">
                    <div className="flex-shrink-0">
                        <Image
                            src="/mapview/CWS_filter_icon.svg"
                            alt="Water Report Card"
                            width={35}
                            height={35}
                            className="text-white"
                        />
                    </div>

                    <div className="flex-1">
                        <h2
                            ref={h2Ref}
                            className="text-white font-bold text-[18px]"
                        >
                            {featureProps.pws_name}
                        </h2>

                        {!isWrapped && (
                            <>
                                <div className="text-sm text-white">
                                    <span>Public Water ID :</span>{" "}
                                    <span className="font-semibold">{featureProps.pwsid || "N/A"}</span>
                                </div>
                                <div className="text-sm text-white">
                                    <span>Agency :</span>{" "}
                                    <span className="font-semibold">{featureProps.primacy_agency || "N/A"}</span>{" "}          
                                </div>
                            </>
                        )}


                    </div>

                </div>

                <ul className="mt-2 space-y-1 text-white text-sm">
                    {isWrapped && (
                        <>
                            <li>
                                <span>Public Water ID:</span>{" "}
                                <span className="font-semibold">{featureProps.pwsid || "N/A"}</span>{" "}
                                
                            </li>
                            <li>
                                <span>Agency:</span>{" "}
                                <span className="font-semibold">{featureProps.primacy_agency || "N/A"}</span>{" "}          
                            </li>
                        </>
                    )}
                    <li>
                        <span>PWS Address:</span>{" "}
                        <span className="font-semibold">{featureProps.address_line1 || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS City:</span>{" "}
                        <span className="font-semibold">{featureProps.city_served || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS Org:</span>{" "}
                        <span className="font-semibold">{featureProps.org_name || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS Administrator:</span>{" "}
                        <span className="font-semibold">{featureProps.admin_name || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS Email:</span>{" "}
                        <span className="font-semibold">{featureProps.email_addr || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS Phone:</span>{" "}
                        <span className="font-semibold">{featureProps.phone_number || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>Population Category</span>{" "}
                        <span className="font-semibold">{featureProps.pop_cat_5 || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>System Type:</span>{" "}
                        <span className="font-semibold">{featureProps.system_type || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>Service Connections:</span>{" "}
                        <span className="font-semibold">{featureProps.service_connections_count || "N/A"}</span>{" "}
                        
                    </li>
                </ul>

                {/* Scorecard button removed - scorecard shows automatically when clicked */}
            </div>

            {/* Scorecard Popup - shows automatically when water polygon is clicked */}
            {isClicked && (
                <ScorecardPopup
                    featureProps={featureProps}
                    isVisible={isClicked}
                    onClose={onClose}
                />
            )}
            </div>
        </>
    );
}
