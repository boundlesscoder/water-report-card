"use client";

export async function loadWaterQualityReports(map) {
    if (!map) return;

    try {
        const response = await fetch('/api/water-quality-reports');
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch water quality reports:', response.status, response.statusText, errorText);
            return;
        }

        const data = await response.json();
        
        if (!data.success) {
            console.error('API returned error:', data.error || data.message);
            return;
        }
        
        if (!data.data || !Array.isArray(data.data)) {
            console.warn('Invalid water quality reports data format:', data);
            return;
        }

        console.log(`Loaded ${data.data.length} water quality reports`);

        // Convert data to GeoJSON format
        const features = data.data
            .filter(report => {
                // Filter out records without valid coordinates
                const lat = report.latitude || report.lat;
                const lng = report.longitude || report.lng;
                return lat != null && lng != null && lat !== 0 && lng !== 0;
            })
            .map(report => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [
                        report.longitude || report.lng || 0,
                        report.latitude || report.lat || 0
                    ]
                },
                properties: {
                    pwsid: report.pwsid || report.PWSID,
                    analytes_detected: report.analytes_detected || 0,
                    analytes_exceeding_mclg: report.analytes_exceeding_mclg || 0,
                    ...report
                }
            }));

        const geojson = {
            type: 'FeatureCollection',
            features: features
        };

        // Update the GeoJSON source
        const source = map.getSource('water_quality_reports');
        if (source) {
            source.setData(geojson);
        } else {
            console.warn('Water quality reports source not found');
        }

        return geojson;
    } catch (error) {
        console.error('Error loading water quality reports:', error);
    }
}

export async function loadWaterQualityReportsByPwsid(pwsid) {
    try {
        const response = await fetch(`/api/water-quality-reports/${pwsid}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch water quality reports for PWSID:', pwsid, response.status, response.statusText, errorText);
            return [];
        }

        const data = await response.json();
        
        if (!data.success) {
            console.error('API returned error:', data.error || data.message);
            return [];
        }
        
        if (!data.data) {
            console.warn('API returned no data for PWSID:', pwsid);
            return [];
        }

        // Handle both array and single object responses
        const reports = Array.isArray(data.data) ? data.data : [data.data];
        
        console.log(`Loaded ${reports.length} water quality report(s) for PWSID: ${pwsid}`, reports);
        
        return reports;
    } catch (error) {
        console.error('Error loading water quality reports by PWSID:', error);
        return [];
    }
}

