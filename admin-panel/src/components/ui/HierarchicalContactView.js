'use client';

import { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * HierarchicalContactView Component
 * Displays contacts in a hierarchical structure: City > Service Zone > Sub-contacts (by Route)
 * Only shows sub-contacts (parent_id is not null)
 */
export default function HierarchicalContactView({ 
  contacts = [], 
  parentContactName = null,
  onContactSelect = null,
  hasActiveSearches = false,
  onContactDoubleClick = null
}) {
  const [expandedCities, setExpandedCities] = useState(new Set());
  const [expandedServiceZones, setExpandedServiceZones] = useState(new Set());

  // Filter to only show sub-contacts (parent_id is not null)
  const subContacts = useMemo(() => {
    return contacts.filter(contact => contact.parent_id !== null && contact.parent_id !== undefined);
  }, [contacts]);

  // Group sub-contacts by City > Service Zone
  // Preserve the order of contacts as they come in (already sorted by sort panel)
  const { groupedData, cityOrder, serviceZoneOrder } = useMemo(() => {
    const groups = {};
    const cityOrderMap = new Map(); // Track order of cities as they appear
    const serviceZoneOrderMap = new Map(); // Track order of service zones per city

    // Preserve the order of contacts - they're already sorted by the sort panel
    subContacts.forEach((contact, index) => {
      const city = contact.city || 'Unknown';
      const serviceZone = contact.service_zone || 'Unknown';

      if (!groups[city]) {
        groups[city] = {};
        // Track the first occurrence of this city
        if (!cityOrderMap.has(city)) {
          cityOrderMap.set(city, cityOrderMap.size);
        }
      }
      if (!groups[city][serviceZone]) {
        groups[city][serviceZone] = [];
        // Track the first occurrence of this service zone within this city
        const cityKey = city;
        if (!serviceZoneOrderMap.has(cityKey)) {
          serviceZoneOrderMap.set(cityKey, new Map());
        }
        if (!serviceZoneOrderMap.get(cityKey).has(serviceZone)) {
          serviceZoneOrderMap.get(cityKey).set(serviceZone, serviceZoneOrderMap.get(cityKey).size);
        }
      }

      // Add contacts in the order they appear (preserving sort panel order)
      groups[city][serviceZone].push(contact);
    });

    // Convert maps to arrays preserving order
    const cityOrderArray = Array.from(cityOrderMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([city]) => city);
    
    const serviceZoneOrderObj = {};
    serviceZoneOrderMap.forEach((szMap, city) => {
      serviceZoneOrderObj[city] = Array.from(szMap.entries())
        .sort((a, b) => a[1] - b[1])
        .map(([sz]) => sz);
    });

    return {
      groupedData: groups,
      cityOrder: cityOrderArray,
      serviceZoneOrder: serviceZoneOrderObj
    };
  }, [subContacts]);

  // Toggle city expansion
  const toggleCity = (city) => {
    setExpandedCities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(city)) {
        newSet.delete(city);
      } else {
        newSet.add(city);
      }
      return newSet;
    });
  };

  // Toggle service zone expansion
  const toggleServiceZone = (city, serviceZone) => {
    const key = `${city}|${serviceZone}`;
    setExpandedServiceZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Get status indicator color
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-400';
    
    const statusLower = String(status).toLowerCase();
    if (statusLower === 'active') {
      return 'bg-green-500';
    } else if (statusLower === 'inactive') {
      return 'bg-red-500';
    }
    // Default to gray if status is unknown
    return 'bg-gray-400';
  };

  // Count sub-contacts in a service zone
  const countSubContactsInServiceZone = (city, serviceZone) => {
    return groupedData[city][serviceZone].length;
  };

  // Count sub-contacts in a city
  const countSubContactsInCity = (city) => {
    let count = 0;
    Object.values(groupedData[city]).forEach(serviceZone => {
      count += serviceZone.length;
    });
    return count;
  };

  // Don't show anything if there are no active searches
  if (!hasActiveSearches) {
    return (
      <div className="bg-transparent rounded-lg p-4">
        <div className="text-center py-8 text-gray-500">
          <p>Please search to view contacts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent rounded-lg p-4">
      {/* Parent Line Section - Show if parentContactName is provided */}
      {parentContactName && (
        <div className="mb-4 text-left">
          <h2 className="text-lg font-semibold text-gray-900">{parentContactName}</h2>
        </div>
      )}

      {/* Hierarchical List */}
      <div className="space-y-2">
        {cityOrder.map(city => {
          const isCityExpanded = expandedCities.has(city);
          // Use the preserved order of service zones, fallback to sorted if not found
          const serviceZones = serviceZoneOrder[city] || Object.keys(groupedData[city] || {}).sort();
          const cityCount = countSubContactsInCity(city);

          return (
            <div key={city} className="space-y-2">
              {/* City Row - Individual Styled Row */}
              <div
                onClick={() => toggleCity(city)}
                className="bg-white rounded-md shadow-sm flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {isCityExpanded ? (
                  <ChevronDownIcon className="w-5 h-5 text-blue-500" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-blue-500" />
                )}
                <span className="font-medium text-gray-900">
                  City - {city} ({cityCount})
                </span>
              </div>

              {/* Service Zones - Individual Rows */}
              {isCityExpanded && (
                <>
                  {serviceZones.map(serviceZone => {
                    const key = `${city}|${serviceZone}`;
                    const isServiceZoneExpanded = expandedServiceZones.has(key);
                    const serviceZoneCount = countSubContactsInServiceZone(city, serviceZone);

                    return (
                      <div key={serviceZone} className="space-y-2">
                        {/* Service Zone Row - Individual Styled Row */}
                        <div
                          onClick={() => toggleServiceZone(city, serviceZone)}
                          className="bg-white rounded-md shadow-sm border border-gray-200 flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors ml-6"
                        >
                          {isServiceZoneExpanded ? (
                            <ChevronDownIcon className="w-5 h-5 text-blue-500" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5 text-blue-500" />
                          )}
                          <span className="text-sm font-medium text-gray-800">
                            Service Zone | {serviceZone} ({serviceZoneCount})
                          </span>
                        </div>

                        {/* Sub-contacts - Individual Rows */}
                        {isServiceZoneExpanded && (
                          <>
                            {groupedData[city][serviceZone].map(contact => {
                              const statusColor = getStatusColor(contact.contact_status);
                              
                              return (
                                <div
                                  key={contact.id}
                                  onClick={() => onContactSelect?.(contact)}
                                  onDoubleClick={() => onContactDoubleClick?.(contact)}
                                  className="bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ml-12"
                                >
                                  {/* Status Alarm Indicator */}
                                  <div className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0`} />
                                  
                                  {/* Contact Label */}
                                  <span className="text-sm text-gray-900 flex-1">
                                    {contact.name + ' | ' + contact.location_name }
                                  </span>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {cityOrder.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No sub-contacts found</p>
        </div>
      )}
    </div>
  );
}

