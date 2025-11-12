"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// Phone country codes and formatting
const COUNTRY_CODES = [
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', format: '(###) ###-####' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', format: '(###) ###-####' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', format: '### #### ####' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', format: '### ### ###' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', format: '### #### ####' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', format: '# ## ## ## ##' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸', format: '### ## ## ##' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹', format: '### ### ####' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵', format: '##-####-####' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷', format: '##-####-####' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳', format: '### #### ####' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', format: '##### #####' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷', format: '## #####-####' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽', format: '## #### ####' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', format: '## #### ####' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱', format: '# #### ####' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱', format: '## ### ####' },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪', format: '### ## ## ##' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪', format: '##-### ## ##' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴', format: '### ## ###' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰', format: '## ## ## ##' },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮', format: '## ### ####' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭', format: '## ### ## ##' },
  { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹', format: '### #### ####' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱', format: '### ### ###' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺', format: '### ###-##-##' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦', format: '## ### ####' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬', format: '## #### ####' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪', format: '## ### ####' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦', format: '## ### ####' }
];

// Format phone number according to country pattern
const formatPhoneNumber = (number, format) => {
  // Remove all non-digits
  const digits = number.replace(/\D/g, '');
  
  if (!digits) return '';
  
  let formatted = '';
  let digitIndex = 0;
  
  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === '#') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += format[i];
    }
  }
  
  return formatted;
};

// Parse phone number to extract country code and number
const parsePhoneNumber = (fullNumber) => {
  if (!fullNumber) return { country: COUNTRY_CODES[0], number: '' };
  
  // Remove all non-digits and plus
  const cleaned = fullNumber.replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+')) {
    // No country code, assume US
    return { country: COUNTRY_CODES[0], number: cleaned };
  }
  
  // Find matching country by dial code
  for (const country of COUNTRY_CODES) {
    if (cleaned.startsWith(country.dial)) {
      const number = cleaned.substring(country.dial.length);
      return { country, number };
    }
  }
  
  // No match found, default to US
  return { country: COUNTRY_CODES[0], number: cleaned };
};

export default function PhoneInput({ 
  label, 
  value = '', 
  onChange, 
  placeholder = 'Enter phone number',
  className = '',
  required = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [parsed, setParsed] = useState(() => parsePhoneNumber(value));
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Update parsed value when external value changes
  useEffect(() => {
    setParsed(parsePhoneNumber(value));
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    const newParsed = { country, number: parsed.number };
    setParsed(newParsed);
    setIsOpen(false);
    setSearchTerm('');
    
    // Update the full phone number
    const fullNumber = parsed.number ? `${country.dial} ${formatPhoneNumber(parsed.number, country.format)}` : country.dial;
    onChange(fullNumber);
    
    // Focus back to input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleNumberChange = (e) => {
    const inputValue = e.target.value;
    
    // If they're typing a completely new number with +, parse it
    if (inputValue.startsWith('+')) {
      const newParsed = parsePhoneNumber(inputValue);
      setParsed(newParsed);
      onChange(inputValue);
      return;
    }
    
    // Extract just the number part (remove country code if present)
    let numberPart = inputValue;
    if (inputValue.startsWith(parsed.country.dial)) {
      numberPart = inputValue.substring(parsed.country.dial.length).trim();
    }
    
    // Remove any formatting and keep only digits
    const digitsOnly = numberPart.replace(/\D/g, '');
    
    // Update parsed number
    const newParsed = { ...parsed, number: digitsOnly };
    setParsed(newParsed);
    
    // Format and return full number
    const formattedNumber = formatPhoneNumber(digitsOnly, parsed.country.format);
    const fullNumber = digitsOnly ? `${parsed.country.dial} ${formattedNumber}` : parsed.country.dial;
    onChange(fullNumber);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Filter countries based on search
  const filteredCountries = COUNTRY_CODES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dial.includes(searchTerm)
  );

  // Format the display value
  const displayValue = parsed.number 
    ? `${parsed.country.dial} ${formatPhoneNumber(parsed.number, parsed.country.format)}`
    : parsed.country.dial;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative flex">
        {/* Country Code Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-2 py-2 border border-gray-300 border-r-0 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors whitespace-nowrap ${
              isOpen ? 'bg-gray-100 border-blue-300' : ''
            }`}
          >
            <span className="text-base">{parsed.country.flag}</span>
            <span className="text-xs font-medium text-gray-700">{parsed.country.dial}</span>
            <ChevronDownIcon className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Country Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 z-[9999] w-64 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-56 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              {/* Country List */}
              <div className="overflow-y-auto max-h-52">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-blue-50 transition-colors ${
                      parsed.country.code === country.code ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-base">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{country.name}</div>
                    </div>
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1 py-0.5 rounded">{country.dial}</span>
                  </button>
                ))}
                
                {filteredCountries.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          ref={inputRef}
          type="tel"
          value={displayValue}
          onChange={handleNumberChange}
          onKeyDown={handleKeyDown}
          placeholder={`${parsed.country.dial} ${placeholder}`}
          className="flex-1 px-2 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-0"
          required={required}
        />
      </div>
    </div>
  );
}
