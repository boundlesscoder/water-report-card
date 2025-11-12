'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

/**
 * CustomerMapView Component
 * 
 * Displays customers on a Mapbox map with location markers.
 * 
 * To set up Mapbox:
 * 1. Get a Mapbox access token from https://account.mapbox.com/access-tokens/
 * 2. Create a .env.local file in the admin-panel root directory
 * 3. Add: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here
 * 
 * @param {Array} customers - Array of customer objects with location data
 * @param {Function} onCustomerSelect - Callback when a customer marker is clicked
 */

// Mapbox configuration
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiaGVhbGVyLW1hcGJveCIsImEiOiJjbWJ3ZzJ3Z3UwMDF6MnFwZ2V6dGJ6Z2V6In0.example';
const DEFAULT_CENTER = [-100, 40];
const DEFAULT_ZOOM = 4;

export const maxBounds = [
  [-130, 20],
  [-65, 50],
];

export default function CustomerMapView({ customers, onCustomerSelect }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    if (!MAPBOX_ACCESS_TOKEN) {
      console.error('Mapbox access token is missing');
      return;
    }

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/healer-mapbox/cmgh9b0pk002401soa6yp10h4',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      logoPosition: 'bottom-right',
      maxBounds,
      preserveDrawingBuffer: true // This might help with layer ordering
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Track zoom level changes
    map.current.on('zoom', () => {
      setCurrentZoom(map.current.getZoom());
    });

    map.current.on('zoomend', () => {
      setCurrentZoom(map.current.getZoom());
    });

    // Add event listeners for map movement to trigger re-clustering
    const handleMapMove = () => {
      // Trigger marker update when map moves (zoom, pan, etc.)
      // This will cause the useEffect to re-run and recalculate clustering
      setCurrentZoom(map.current.getZoom());
    };

    map.current.on('moveend', handleMapMove);
    map.current.on('zoomend', handleMapMove);
    map.current.on('pitchend', handleMapMove);
    map.current.on('rotateend', handleMapMove);

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when customers change or zoom changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Use real coordinates from addresses table (PostGIS geometry)
    const customersWithCoords = customers
      .filter(customer => {
        // Check if customer has location coordinates from addresses table
        return customer.latitude && customer.longitude;
      })
      .map(customer => ({
        ...customer,
        lat: parseFloat(customer.latitude),
        lon: parseFloat(customer.longitude)
      }));

    // Filter out customers without valid coordinates
    const validCustomers = customersWithCoords.filter(customer => 
      !isNaN(customer.lat) && !isNaN(customer.lon) && 
      customer.lat !== 0 && customer.lon !== 0
    );

    if (validCustomers.length > 0) {
      createMarkers(validCustomers);
    }
  }, [customers, mapLoaded, onCustomerSelect, currentZoom]);

  // Helper function to create markers
  const createMarkers = (customersWithCoords) => {
    if (!map.current) return;
    
    // Cluster customers based on dynamic map viewport
    const clusters = clusterCustomers(customersWithCoords, map.current);

      // Create markers for each cluster
      clusters.forEach(cluster => {
        const isMultipleCustomers = cluster.length > 1;
        const primaryCustomer = cluster[0];
      
        // Create a custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'customer-marker';
        
        const statusColor = getStatusColor(primaryCustomer.status);
        const statusColorRgb = hexToRgb(statusColor);
        
        if (isMultipleCustomers) {
          // Radar style for clusters with numbers
          markerElement.innerHTML = `
            <div class="radar-marker" style="
              position: relative;
              width: 80px;
              height: 80px;
              cursor: pointer;
            ">
              <!-- Outer ring -->
              <div class="radar-ring radar-ring-1" style="
                position: absolute;
                top: 50%;
                left: 50%;
                width: 70px;
                height: 70px;
                border: 4px solid rgba(${statusColorRgb.r}, ${statusColorRgb.g}, ${statusColorRgb.b}, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: radarPulse 2s infinite;
              "></div>
              
              <!-- Middle ring -->
              <div class="radar-ring radar-ring-2" style="
                position: absolute;
                top: 50%;
                left: 50%;
                width: 60px;
                height: 60px;
                border: 4px solid rgba(${statusColorRgb.r}, ${statusColorRgb.g}, ${statusColorRgb.b}, 0.5);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: radarPulse 2s infinite 0.3s;
              "></div>
              
              <!-- Inner ring -->
              <div class="radar-ring radar-ring-3" style="
                position: absolute;
                top: 50%;
                left: 50%;
                width: 50px;
                height: 50px;
                border: 4px solid rgba(${statusColorRgb.r}, ${statusColorRgb.g}, ${statusColorRgb.b}, 0.7);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: radarPulse 2s infinite 0.6s;
              "></div>
              
              <!-- Center dot with number -->
              <div class="radar-center" style="
                position: absolute;
                top: 50%;
                left: 50%;
                width: 30px;
                height: 30px;
                background-color: ${statusColor};
                border: 4px solid white;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">${cluster.length}</div>
            </div>
          `;
        } else {
          // Teardrop style for single customers
          markerElement.innerHTML = `
            <div class="teardrop-marker" style="
              position: relative;
              width: 40px;
              height: 50px;
              cursor: pointer;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            ">
              <!-- Teardrop shape -->
              <div style="
                position: relative;
                width: 100%;
                height: 100%;
              ">
                <!-- Main teardrop body -->
                <div style="
                  position: absolute;
                  top: 0;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 30px;
                  height: 30px;
                  background-color: ${statusColor};
                  border-radius: 50% 50% 50% 0;
                  transform: translateX(-50%) rotate(-45deg);
                  border: 2px solid white;
                "></div>
                
                <!-- White center circle -->
                <div style="
                  position: absolute;
                  top: 8px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 20px;
                  height: 20px;
                  background-color: white;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  color: ${statusColor};
                  font-weight: bold;
                ">${primaryCustomer.name.charAt(0).toUpperCase()}</div>
                
                <!-- Teardrop point -->
                <div style="
                  position: absolute;
                  bottom: 0;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 6px solid transparent;
                  border-right: 6px solid transparent;
                  border-top: 12px solid ${statusColor};
                "></div>
              </div>
            </div>
          `;
        }

        // Create popup content
        const popupContent = `
          <div class="p-3">
            <h3 class="font-semibold text-gray-900 mb-1">
              ${isMultipleCustomers ? `${cluster.length} Customers` : primaryCustomer.name}
            </h3>
            ${primaryCustomer.location_address ? `<p class="text-sm text-gray-600 mb-2">${primaryCustomer.location_address}</p>` : ''}
            ${isMultipleCustomers ? `
              <div class="space-y-2 max-h-40 overflow-y-auto">
                ${cluster.map(customer => `
                  <div class="border-b border-gray-100 pb-2 last:border-b-0">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-sm">${customer.name}</span>
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(customer.status)}">
                        ${customer.status}
                      </span>
                    </div>
                    ${customer.billing_email ? `<p class="text-xs text-gray-500 mt-1">${customer.billing_email}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="flex items-center space-x-2 mb-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(primaryCustomer.status)}">
                  ${primaryCustomer.status}
                </span>
              </div>
              ${primaryCustomer.billing_email ? `<p class="text-xs text-gray-500">${primaryCustomer.billing_email}</p>` : ''}
              ${primaryCustomer.children_count > 0 ? `<p class="text-xs text-gray-500">${primaryCustomer.children_count} child customers</p>` : ''}
            `}
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(popupContent);

        // Create marker with actual coordinates
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([primaryCustomer.lon, primaryCustomer.lat])
          .setPopup(popup)
          .addTo(map.current);

        // Add click handler
        markerElement.addEventListener('click', () => {
          if (onCustomerSelect) {
            // If multiple customers, select the first one, or you could show a selection dialog
            onCustomerSelect(primaryCustomer);
          }
        });

        markers.current.push(marker);
      });
  };

  // Note: No longer using geocoding since we get real coordinates from addresses table

  // Convert hex color to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 107, g: 114, b: 128 }; // default gray
  };

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate smart clustering distance based on multiple factors
  const getSmartClusteringDistance = (map) => {
    if (!map) return 1; // fallback distance
    
    const zoom = map.getZoom();
    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Calculate viewport dimensions in kilometers
    const viewportWidth = calculateDistance(ne.lat, ne.lng, ne.lat, sw.lng);
    const viewportHeight = calculateDistance(ne.lat, ne.lng, sw.lat, ne.lng);
    const viewportSize = Math.min(viewportWidth, viewportHeight);
    
    // Get map container dimensions in pixels
    const container = map.getContainer();
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const containerSize = Math.min(containerWidth, containerHeight);
    
    // Calculate pixels per kilometer
    const pixelsPerKm = containerSize / viewportSize;
    
    // Icon size in pixels (our radar markers are 80px)
    const iconSizePx = 80;
    
    // Calculate icon size in kilometers at current zoom
    const iconSizeKm = iconSizePx / pixelsPerKm;
    
    // Calculate minimum distance to prevent visual overlap
    // Use 1.5x icon size to ensure no overlap
    const minDistanceKm = iconSizeKm * 1.5;
    
    // Calculate smart clustering distance based on multiple factors
    let clusteringDistance;
    
    // Factor 1: Zoom level (higher zoom = smaller clusters)
    const zoomFactor = Math.pow(0.5, zoom - 4); // Exponential decay from zoom 4
    
    // Factor 2: Viewport size (smaller viewport = smaller clusters)
    const viewportFactor = Math.min(viewportSize / 10, 1); // Normalize to 0-1
    
    // Factor 3: Screen density (higher DPI = smaller clusters)
    const dpr = window.devicePixelRatio || 1;
    const densityFactor = Math.min(dpr / 2, 1); // Normalize to 0-1
    
    // Factor 4: Icon overlap prevention
    const overlapFactor = Math.max(minDistanceKm, 0.01); // Minimum 10m
    
    // Combine all factors for smart clustering
    clusteringDistance = overlapFactor * (1 + zoomFactor * viewportFactor * densityFactor);
    
    // Apply reasonable bounds
    clusteringDistance = Math.max(clusteringDistance, 0.01); // Minimum 10m
    clusteringDistance = Math.min(clusteringDistance, 50);   // Maximum 50km
    
    return clusteringDistance;
  };

  // Smart clustering with grid-based optimization and visual density consideration
  const clusterCustomers = (customers, map) => {
    const clusteringDistance = getSmartClusteringDistance(map);
    
    // Create a grid for efficient spatial indexing
    const gridSize = clusteringDistance * 2; // Grid cell size
    const grid = new Map();
    
    // Helper function to get grid key
    const getGridKey = (lat, lon) => {
      const gridLat = Math.floor(lat / gridSize);
      const gridLon = Math.floor(lon / gridSize);
      return `${gridLat},${gridLon}`;
    };
    
    // Add customers to grid
    customers.forEach((customer, index) => {
      if (!customer.lat || !customer.lon) return;
      
      const key = getGridKey(customer.lat, customer.lon);
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key).push({ ...customer, originalIndex: index });
    });
    
    const clusters = [];
    const processed = new Set();
    
    // Process each grid cell
    grid.forEach((cellCustomers) => {
      cellCustomers.forEach((customer) => {
        if (processed.has(customer.originalIndex)) return;
        
        const cluster = [customer];
        processed.add(customer.originalIndex);
        
        // Check customers in the same cell and adjacent cells
        const customerGridLat = Math.floor(customer.lat / gridSize);
        const customerGridLon = Math.floor(customer.lon / gridSize);
        
        // Check 9 cells (current + 8 adjacent)
        for (let latOffset = -1; latOffset <= 1; latOffset++) {
          for (let lonOffset = -1; lonOffset <= 1; lonOffset++) {
            const checkKey = `${customerGridLat + latOffset},${customerGridLon + lonOffset}`;
            const adjacentCustomers = grid.get(checkKey) || [];
            
            adjacentCustomers.forEach((otherCustomer) => {
              if (processed.has(otherCustomer.originalIndex)) return;
              
              const distance = calculateDistance(
                customer.lat, customer.lon,
                otherCustomer.lat, otherCustomer.lon
              );
              
              if (distance <= clusteringDistance) {
                cluster.push(otherCustomer);
                processed.add(otherCustomer.originalIndex);
              }
            });
          }
        }
        
        clusters.push(cluster);
      });
    });
    
    // Sort clusters by size (largest first) for better visual hierarchy
    clusters.sort((a, b) => b.length - a.length);
    
    return clusters;
  };

  // Get status color for marker
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#0C88F0'; // green
      case 'inactive': return '#6B7280'; // gray
      case 'prospect': return '#F59E0B'; // yellow
      case 'suspended': return '#EF4444'; // red
      default: return '#6B7280';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (mapContainer.current?.requestFullscreen) {
        mapContainer.current.requestFullscreen();
      } else if (mapContainer.current?.webkitRequestFullscreen) {
        mapContainer.current.webkitRequestFullscreen();
      } else if (mapContainer.current?.msRequestFullscreen) {
        mapContainer.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Resize map when entering/exiting fullscreen
      if (map.current) {
        setTimeout(() => {
          map.current.resize();
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="h-full w-full relative">
      {/* CSS Animations for radar markers and hide Mapbox branding */}
      <style jsx>{`
        @keyframes radarPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        
        .radar-marker:hover .radar-ring {
          animation-duration: 1s;
        }
        
        .radar-marker:hover .radar-center {
          transform: translate(-50%, -50%) scale(1.1);
          transition: transform 0.2s ease;
        }
        
        /* Hide Mapbox logo and attribution */
        .mapboxgl-ctrl-logo {
          display: none !important;
        }
        
        .mapboxgl-ctrl-attrib {
          display: none !important;
        }
        
        .mapboxgl-ctrl-attrib-inner {
          display: none !important;
        }
        
        /* Ensure fullscreen button is always visible */
        .fullscreen-button {
          position: absolute !important;
          top: 16px !important;
          right: 16px !important;
          z-index: 9999 !important;
          background: white !important;
          border: 1px solid #d1d5db !important;
          border-radius: 8px !important;
          padding: 12px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          cursor: pointer !important;
        }
        
        .fullscreen-button:hover {
          background: #f9fafb !important;
        }
      `}</style>
      
      <div ref={mapContainer} className="h-full w-full" style={{ minHeight: '500px' }} />
      
      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="fullscreen-button"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 9999,
          background: 'white',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          padding: '0px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <ArrowsPointingInIcon className="w-6 h-6 text-blue-600" />
        ) : (
          <ArrowsPointingOutIcon className="w-6 h-6 text-blue-600" />
        )}
      </button>
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Customer Status</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="relative w-6 h-6">
              <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <span className="text-sm text-gray-600">Active</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative w-6 h-6">
              <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-gray-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gray-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <span className="text-sm text-gray-600">Inactive</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative w-6 h-6">
              <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-yellow-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <span className="text-sm text-gray-600">Prospect</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative w-6 h-6">
              <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <span className="text-sm text-gray-600">Suspended</span>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
