import { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { COUNTRY_CODES, CountryCode, validatePhoneNumber } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string, countryCode: CountryCode) => void;
  onValidChange: (isValid: boolean) => void;
  error?: string;
}

export const PhoneInput = ({ value, onChange, onValidChange, error: externalError }: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES.find(c => c.code === '+880') || COUNTRY_CODES[0]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [internalError, setInternalError] = useState<string | undefined>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const error = externalError || internalError;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRY_CODES.filter(country =>
    country.country.toLowerCase().includes(search.toLowerCase()) ||
    country.code.includes(search)
  );

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const numericValue = e.target.value.replace(/\D/g, '');
    onChange(numericValue, selectedCountry);
    
    if (numericValue) {
      const validation = validatePhoneNumber(numericValue, selectedCountry);
      setInternalError(validation.error);
      onValidChange(validation.valid);
    } else {
      setInternalError(undefined);
      onValidChange(false);
    }
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    onChange(value, country);
    
    if (value) {
      const validation = validatePhoneNumber(value, country);
      setInternalError(validation.error);
      onValidChange(validation.valid);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative flex">
        {/* Country Code Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center gap-1 h-10 px-3 rounded-l-md border border-r-0 bg-muted/50",
              "hover:bg-muted transition-colors",
              error ? "border-destructive" : "border-input"
            )}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.code}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search country..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                    autoFocus
                  />
                </div>
              </div>
              
              {/* Country List */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors",
                      selectedCountry.code === country.code && "bg-muted"
                    )}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1 text-sm">{country.country}</span>
                    <span className="text-sm text-muted-foreground">{country.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Input */}
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="1712345678"
            className={cn(
              "pl-10 rounded-l-none",
              error && "border-destructive focus-visible:ring-destructive"
            )}
            value={value}
            onChange={handlePhoneChange}
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  );
};
