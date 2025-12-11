'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

/**
 * ContactMapView Component
 * 
 * Displays contacts on a Mapbox map with location markers.
 * 
 * @param {Array} contacts - Array of contact objects with location data
 * @param {Function} onContactSelect - Callback when a contact marker is clicked
 * @param {number} selectedContactId - ID of the currently selected contact
 */

// Mapbox configuration
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiaGVhbGVyLW1hcGJveCIsImEiOiJjbWJ3ZzJ3Z3UwMDF6MnFwZ2V6dGJ6Z2V6In0.example';
const DEFAULT_CENTER = [-112.0740, 33.4484]; // Phoenix, AZ
const DEFAULT_ZOOM = 10;

export const maxBounds = [
  [-113.5, 32.0],
  [-110.5, 35.0],
];

// Geocode address to coordinates (using a simple geocoding service)
// In production, you should use a proper geocoding service like Mapbox Geocoding API
const geocodeAddress = async (address, city, state, zip) => {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`;
  
  // For now, return null - you'll need to implement proper geocoding
  // You can use Mapbox Geocoding API: https://docs.mapbox.com/api/search/geocoding/
  // Or use a service like Google Geocoding API
  try {
    // Example using Mapbox Geocoding API (requires API key)
    if (MAPBOX_ACCESS_TOKEN && MAPBOX_ACCESS_TOKEN !== 'pk.eyJ1IjoiaGVhbGVyLW1hcGJveCIsImEiOiJjbWJ3ZzJ3Z3UwMDF6MnFwZ2V6dGJ6Z2V6In0.example') {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  
  // Fallback: Return approximate coordinates based on city (for demo purposes)
  // In production, you should always use proper geocoding
  const cityCoordinates = {
    'Phoenix': { lat: 33.4484, lng: -112.0740 },
    'Gilbert': { lat: 33.3528, lng: -111.7890 },
    'Chandler': { lat: 33.3062, lng: -111.8413 },
    'Scottsdale': { lat: 33.4942, lng: -111.9261 },
    'Tempe': { lat: 33.4255, lng: -111.9400 },
    'Mesa': { lat: 33.4152, lng: -111.8315 },
  };
  
  return cityCoordinates[city] || { lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };
};

// Add water district layers to the map
async function addWaterLayers(map) {
  const sourceId = "water_districts";

  // Add vector source for water districts
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      tiles: ["https://waterreportcard.com/api/tiles/{z}/{x}/{y}.pbf"],
    });
  }

  // Default layer styles
  const layerStyles = [
    {
      layer_id: "water-fill",
      layer_type: "fill",
      paint_properties: { "fill-color": "#cae9eb", "fill-opacity": 0.5 },
      filter_properties: null
    },
    {
      layer_id: "water_districts_borders",
      layer_type: "line",
      paint_properties: { "line-color": "#999999", "line-width": 1.5 },
      filter_properties: null
    },
    {
      layer_id: "water_districts_selected",
      layer_type: "fill",
      paint_properties: { "fill-color": "#d3e9b2", "fill-opacity": 0.5 },
      filter_properties: ["==", ["get", "pwsid"], ""]
    },
    {
      layer_id: "water_districts_selected_outline",
      layer_type: "line",
      paint_properties: { "line-color": "#f59836", "line-width": 1.5 },
      filter_properties: ["==", ["get", "pwsid"], ""]
    }
  ];

  // Add layers
  for (const style of layerStyles) {
    if (!map.getLayer(style.layer_id)) {
      const layerConfig = {
        id: style.layer_id,
        type: style.layer_type,
        source: sourceId,
        "source-layer": "Boundaries",
        paint: style.paint_properties,
        ...(style.filter_properties && { filter: style.filter_properties }),
      };

      map.addLayer(layerConfig);
    }
  }
}

// Setup hover functionality for water districts
function setupWaterDistrictHover(map) {
  const handleHover = (e) => {
    const feature = e.features?.[0];
    if (feature) {
      const pwsid = feature.properties.pwsid;
      
      // Highlight the hovered water district
      ["water_districts_selected", "water_districts_selected_outline"].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, ["==", ["get", "pwsid"], pwsid]);
        }
      });
    } else {
      // Clear highlight when not hovering
      ["water_districts_selected", "water_districts_selected_outline"].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, ["==", ["get", "pwsid"], ""]);
        }
      });
    }
  };

  // Add hover event listeners
  map.on("mousemove", "water-fill", handleHover);
  map.on("mouseenter", "water-fill", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "water-fill", () => {
    map.getCanvas().style.cursor = "";
    // Clear highlight on mouse leave
    ["water_districts_selected", "water_districts_selected_outline"].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setFilter(layerId, ["==", ["get", "pwsid"], ""]);
      }
    });
  });
}

export default function ContactMapView({ contacts, onContactSelect, selectedContactId }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contactsWithCoords, setContactsWithCoords] = useState([]);

  // Geocode contacts on mount
  useEffect(() => {
    const geocodeContacts = async () => {
      const geocoded = await Promise.all(
        contacts.map(async (contact) => {
          const coords = await geocodeAddress(
            contact.physical_address || '',
            contact.city || '',
            contact.state || '',
            contact.zip || ''
          );
          return {
            ...contact,
            latitude: coords.lat,
            longitude: coords.lng,
          };
        })
      );
      setContactsWithCoords(geocoded);
    };

    if (contacts.length > 0) {
      geocodeContacts();
    }
  }, [contacts]);

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
      preserveDrawingBuffer: true,
    });

    map.current.on('load', async () => {
      setMapLoaded(true);
      // Add water district layers after map loads
      try {
        await addWaterLayers(map.current);
        // Add hover functionality for water districts
        setupWaterDistrictHover(map.current);
      } catch (error) {
        console.error('Error adding water district layers:', error);
      }
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Cleanup function
    return () => {
      if (map.current) {
        // Remove hover event listeners
        map.current.off("mousemove", "water-fill");
        map.current.off("mouseenter", "water-fill");
        map.current.off("mouseleave", "water-fill");
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when contacts with coordinates change
  useEffect(() => {
    if (!map.current || !mapLoaded || contactsWithCoords.length === 0) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter valid coordinates
    const validContacts = contactsWithCoords.filter(contact => 
      contact.latitude && 
      contact.longitude && 
      !isNaN(contact.latitude) && 
      !isNaN(contact.longitude)
    );

    if (validContacts.length === 0) return;

    // Create markers for each contact
    validContacts.forEach(contact => {
      const isSelected = selectedContactId === contact.id;
      
      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'contact-marker';
      markerElement.style.cssText = `
        width: ${isSelected ? '50px' : '40px'};
        height: ${isSelected ? '50px' : '40px'};
        border-radius: 50%;
        background-color: ${isSelected ? '#EF4444' : '#DC2626'};
        border: 4px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${isSelected ? '16px' : '14px'};
        z-index: ${isSelected ? '1000' : '100'};
      `;
      
      // Add contact name initial or icon
      const initial = contact.name ? contact.name.charAt(0).toUpperCase() : '?';
      markerElement.textContent = initial;

      // Create marker
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([contact.longitude, contact.latitude])
        .addTo(map.current);

      // Add click handler
      markerElement.addEventListener('click', () => {
        if (onContactSelect) {
          onContactSelect(contact);
        }
      });

      markers.current.push(marker);

      // If this is the selected contact, fly to it
      if (isSelected) {
        map.current.flyTo({
          center: [contact.longitude, contact.latitude],
          zoom: 14,
          duration: 1000,
        });
      }
    });

    // Fit map to show all markers if no specific contact is selected
    if (!selectedContactId && validContacts.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validContacts.forEach(contact => {
        bounds.extend([contact.longitude, contact.latitude]);
      });
      map.current.fitBounds(bounds, {
        padding: 50,
        duration: 1000,
      });
    }
  }, [contactsWithCoords, mapLoaded, selectedContactId, onContactSelect]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainer.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <div
        ref={mapContainer}
        className="w-full h-full"
      />
      
      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 bg-white border-2 border-blue-600 rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <ArrowsPointingInIcon className="w-6 h-6 text-blue-600" />
        ) : (
          <ArrowsPointingOutIcon className="w-6 h-6 text-blue-600" />
        )}
      </button>
    </div>
  );
}

