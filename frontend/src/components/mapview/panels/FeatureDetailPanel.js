"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import ScorecardPopup from "./ScorecardPopup";
import { loadWaterQualityReportsByPwsid } from "../layers/useWaterQualityReports";


export default function FeatureDetailsPanel({ featureProps, onClose, isClicked }) {

    const h2Ref = useRef(null);
    const [isWrapped, setIsWrapped] = useState(false);
    const [waterQualityReports, setWaterQualityReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // Fetch water quality reports when PWSID changes
    useEffect(() => {
        const pwsid = featureProps?.PWSID || featureProps?.pwsid;
        
        if (!pwsid) {
            setWaterQualityReports([]);
            return;
        }

        const fetchReports = async () => {
            setLoadingReports(true);
            try {
                // map parameter is optional, can pass null
                const reports = await loadWaterQualityReportsByPwsid(pwsid);
                setWaterQualityReports(reports || []);
            } catch (error) {
                console.error('Error fetching water quality reports:', error);
                setWaterQualityReports([]);
            } finally {
                setLoadingReports(false);
            }
        };

        fetchReports();
    }, [featureProps?.PWSID, featureProps?.pwsid]);

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
                            {featureProps.PWS_Name || featureProps.pws_name || featureProps.PWSID || "Water District"}
                        </h2>

                        {!isWrapped && (
                            <>
                                <div className="text-sm text-white">
                                    <span>Public Water ID :</span>{" "}
                                    <span className="font-semibold">{featureProps.PWSID || featureProps.pwsid || "N/A"}</span>
                                </div>
                                <div className="text-sm text-white">
                                    <span>Agency :</span>{" "}
                                    <span className="font-semibold">{featureProps.Primacy_Agency || featureProps.primacy_agency || "N/A"}</span>{" "}          
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
                                <span className="font-semibold">{featureProps.PWSID || featureProps.pwsid || "N/A"}</span>{" "}
                                
                            </li>
                            <li>
                                <span>Agency:</span>{" "}
                                <span className="font-semibold">{featureProps.Primacy_Agency || featureProps.primacy_agency || "N/A"}</span>{" "}          
                            </li>
                        </>
                    )}
                    <li>
                        <span>PWS Address:</span>{" "}
                        <span className="font-semibold">{featureProps.Address_Line1 || featureProps.address_line1 || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS City:</span>{" "}
                        <span className="font-semibold">{featureProps.City_Served || featureProps.city_served || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS Org:</span>{" "}
                        <span className="font-semibold">{featureProps.Org_Name || featureProps.org_name || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS Administrator:</span>{" "}
                        <span className="font-semibold">{featureProps.Admin_Name || featureProps.admin_name || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS Email:</span>{" "}
                        <span className="font-semibold">{featureProps.Email_Addr || featureProps.email_addr || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>PWS Phone:</span>{" "}
                        <span className="font-semibold">{featureProps.Phone_Number || featureProps.phone_number || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>Population Served:</span>{" "}
                        <span className="font-semibold">{featureProps.Population_Served_Count?.toLocaleString() || featureProps.pop_cat_5 || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>System Type:</span>{" "}
                        <span className="font-semibold">{featureProps.System_Type || featureProps.system_type || "N/A"}</span>{" "}
                        
                    </li>
                    <li>
                        <span>Service Connections:</span>{" "}
                        <span className="font-semibold">{featureProps.Service_Connections_Count?.toLocaleString() || featureProps.service_connections_count || "N/A"}</span>{" "}
                        
                    </li>
                </ul>

                {/* Water Quality Reports Section */}
                {waterQualityReports.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <h3 className="text-sm font-semibold text-white mb-2">Water Quality Data</h3>
                        <div className="space-y-2">
                            {waterQualityReports.slice(0, 3).map((report, index) => {
                                // Check if this is actual quality report data or district data
                                const hasQualityData = report.analytes_detected !== undefined || 
                                                      report.analytes_exceeding_mclg !== undefined ||
                                                      report.report_date !== undefined;
                                
                                if (hasQualityData) {
                                    // Display actual water quality report
                                    return (
                                        <div key={index} className="bg-white/10 rounded p-2 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/90">Report #{index + 1}</span>
                                                {report.analytes_exceeding_mclg > 0 && (
                                                    <span className="px-2 py-0.5 bg-red-500/80 text-white rounded text-xs font-semibold">
                                                        Exceeding
                                                    </span>
                                                )}
                                                {report.analytes_exceeding_mclg === 0 && report.analytes_detected > 0 && (
                                                    <span className="px-2 py-0.5 bg-yellow-500/80 text-white rounded text-xs font-semibold">
                                                        Detected
                                                    </span>
                                                )}
                                                {(!report.analytes_detected || report.analytes_detected === 0) && (
                                                    <span className="px-2 py-0.5 bg-green-500/80 text-white rounded text-xs font-semibold">
                                                        Clean
                                                    </span>
                                                )}
                                            </div>
                                            {report.report_date && (
                                                <div className="text-white/70 mt-1">
                                                    Date: {new Date(report.report_date).toLocaleDateString()}
                                                </div>
                                            )}
                                            <div className="text-white/70 mt-1">
                                                Analytes Detected: {report.analytes_detected || 0}
                                            </div>
                                            {report.analytes_exceeding_mclg > 0 && (
                                                <div className="text-red-200 mt-1 font-semibold">
                                                    Exceeding MCLG: {report.analytes_exceeding_mclg}
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else {
                                    // Display district information if no quality data
                                    return (
                                        <div key={index} className="bg-white/10 rounded p-2 text-xs">
                                            <div className="text-white/90 font-semibold">
                                                {report.pws_name || report.PWS_Name || 'Water District'}
                                            </div>
                                            {report.state && (
                                                <div className="text-white/70 mt-1">State: {report.state}</div>
                                            )}
                                            {report.data_source_link && (
                                                <div className="text-white/70 mt-1">
                                                    <a 
                                                        href={report.data_source_link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-200 hover:text-blue-100 underline"
                                                    >
                                                        View Data Source
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            })}
                            {waterQualityReports.length > 3 && (
                                <div className="text-xs text-white/70 text-center">
                                    + {waterQualityReports.length - 3} more records
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {loadingReports && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <div className="text-xs text-white/70 text-center">Loading water quality reports...</div>
                    </div>
                )}

                {!loadingReports && waterQualityReports.length === 0 && featureProps?.PWSID && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <div className="text-xs text-white/70 text-center">No water quality reports available</div>
                    </div>
                )}

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
