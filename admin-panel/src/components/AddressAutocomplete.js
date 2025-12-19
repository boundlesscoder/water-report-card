"use client";

import { useState, useEffect, useRef } from 'react';
import { MAPBOX_ACCESS_TOKEN } from '@/config/envConfig';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Type address or select from suggestions...",
  className = "",
  label,
  required = false,
  autoFocus = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState(value || '');
  const [hasSelected, setHasSelected] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Update searchValue when value prop changes
  useEffect(() => {
    setSearchValue(value || '');
  }, [value]);

  // Fetch suggestions from Mapbox Geocoding API
  useEffect(() => {
    // Don't search if user has just selected something
    if (hasSelected) {
      return;
    }

    // Only search if input is focused and user has typed at least 3 characters
    if (!isFocused || !searchValue || searchValue.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (!MAPBOX_ACCESS_TOKEN) {
      console.warn('Mapbox access token not found. Address autocomplete disabled.');
      return;
    }

    // Add a small delay to prevent rapid API calls and improve debouncing
    const timeoutId = setTimeout(() => {
      setLoading(true);
      const controller = new AbortController();

      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchValue
        )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=us&limit=20`,
        { signal: controller.signal }
      )
        .then((res) => res.json())
        .then((data) => {
          const features = data.features || [];
          
          // Prioritize different types of results
          const addressFeatures = features.filter(f => f.place_type.includes('address'));
          const poiFeatures = features.filter(f => f.place_type.includes('poi'));
          const placeFeatures = features.filter(f => f.place_type.includes('place'));
          const otherFeatures = features.filter(f => 
            !f.place_type.includes('address') && 
            !f.place_type.includes('poi') && 
            !f.place_type.includes('place')
          );
          
          // Combine results with addresses first, then POIs, then places, then others
          const sortedFeatures = [
            ...addressFeatures,
            ...poiFeatures,
            ...placeFeatures.slice(0, 2), // Limit places to avoid too many broad results
            ...otherFeatures.slice(0, 1)  // Limit other types
          ].slice(0, 5); // Final limit of 5 results
          
          setSuggestions(sortedFeatures);
          setIsOpen(sortedFeatures.length > 0);
          setLoading(false);
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Geocoding error:', error);
          }
          setLoading(false);
        });
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchValue, hasSelected, isFocused]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setHasSelected(false); // Reset selection flag when user manually types
    setSearchValue(newValue);
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay blur to allow click events on suggestions to fire first
    setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);
    }, 200);
  };

  const handleSuggestionClick = (suggestion) => {
    const place = suggestion.place_name;
    
    // Set selection flag to prevent further searches
    setHasSelected(true);
    
    // Close dropdown and clear suggestions immediately
    setIsOpen(false);
    setSuggestions([]);
    setLoading(false);
    
    // Update the input value
    setSearchValue(place);
    onChange(place);

    // Only trigger auto-fill if the callback is provided and we have useful context
    if (onAddressSelect) {
      const context = suggestion.context || [];
      const addressComponents = {
        address_line1: place.split(',')[0].trim(),
        address_line2: '', // Keep empty - user can fill if needed
        city: '',
        state: '',
        zip: '',
        latitude: suggestion.center ? suggestion.center[1] : null, // Mapbox returns [lng, lat]
        longitude: suggestion.center ? suggestion.center[0] : null
      };

      // Extract city, state, zip from context if available
      let hasUsefulContext = false;
      context.forEach(item => {
        if (item.id.startsWith('place.')) {
          addressComponents.city = item.text;
          hasUsefulContext = true;
        } else if (item.id.startsWith('region.')) {
          addressComponents.state = item.short_code?.replace('US-', '') || item.text;
          hasUsefulContext = true;
        } else if (item.id.startsWith('postcode.')) {
          addressComponents.zip = item.text;
          hasUsefulContext = true;
        }
      });

      // Only auto-fill other fields if we have useful context information
      // This prevents overwriting fields when the suggestion doesn't provide complete address info
      if (hasUsefulContext) {
        onAddressSelect(addressComponents);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          required={required}
          {...(autoFocus !== false ? { autoFocus: autoFocus } : {})}
        />
        
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          ) : (
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && isFocused && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.place_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.place_name.split(',').slice(1).join(',').trim()}
                  </div>
                </div>
                {suggestion.place_type && (
                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                    {suggestion.place_type.includes('address') ? 'Address' :
                     suggestion.place_type.includes('poi') ? 'Place' :
                     suggestion.place_type.includes('place') ? 'City' :
                     'Location'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isFocused && !loading && searchValue.length >= 3 && suggestions.length === 0 && !hasSelected && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            <div className="flex items-center justify-center gap-2">
              <MapPinIcon className="h-4 w-4 text-gray-400" />
              <span>No autocomplete suggestions found</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              You can continue typing your complete address manually
            </div>
          </div>
        </div>
      )}

      {/* Helpful message for short input */}
      {isFocused && !loading && searchValue.length > 0 && searchValue.length < 3 && !hasSelected && (
        <div className="absolute z-50 w-full mt-1 bg-blue-50 border border-blue-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-sm text-blue-700 text-center">
            <div className="flex items-center justify-center gap-2">
              <MapPinIcon className="h-4 w-4 text-blue-500" />
              <span>Keep typing for suggestions or enter address manually</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
