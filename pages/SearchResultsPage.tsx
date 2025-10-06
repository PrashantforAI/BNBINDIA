import React, { useState, useEffect, useCallback } from 'react';
import { NavigateFunction, Page, Property, SearchFilters } from '../types';
import { dataService } from '../services/dataService';
import PropertyCard from '../components/PropertyCard';

interface SearchResultsPageProps {
    navigate: NavigateFunction;
    initialFilters: SearchFilters;
}

const ALL_PROPERTY_TYPES = ['House', 'Apartment', 'Villa', 'Cottage'];
const COMMON_AMENITIES = ['Pool', 'Wifi', 'Air Conditioning', 'Kitchen', 'Parking', 'Garden'];

const FilterBar: React.FC<{ filters: SearchFilters, onFilterChange: (newFilters: SearchFilters) => void }> = ({ filters, onFilterChange }) => {
    const [priceMax, setPriceMax] = useState(filters.priceMax || 50000);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPriceMax(Number(e.target.value));
    };

    const applyPriceFilter = () => {
        onFilterChange({ ...filters, priceMax });
    };

    const handleAmenityChange = (amenity: string) => {
        const currentAmenities = filters.amenities || [];
        const newAmenities = currentAmenities.includes(amenity.toLowerCase())
            ? currentAmenities.filter(a => a !== amenity.toLowerCase())
            : [...currentAmenities, amenity.toLowerCase()];
        onFilterChange({ ...filters, amenities: newAmenities });
    };

    const handleTypeChange = (type: string) => {
        const currentTypes = filters.propertyTypes || [];
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];
        onFilterChange({ ...filters, propertyTypes: newTypes });
    };


    return (
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg mb-8 sticky top-24 z-5 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                <div>
                    <label className="block text-sm font-medium text-gray-200">Price up to</label>
                    <input type="range" min="1000" max="50000" step="1000" value={priceMax} onChange={handlePriceChange} onMouseUp={applyPriceFilter} onTouchEnd={applyPriceFilter} className="w-full accent-brand" />
                    <span className="text-sm">₹{priceMax.toLocaleString('en-IN')}</span>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-200">Bedrooms</label>
                    <select 
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm rounded-md"
                        value={filters.bedrooms || ''}
                        onChange={(e) => onFilterChange({ ...filters, bedrooms: e.target.value ? Number(e.target.value) : undefined })}
                    >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Property Type</label>
                    <div className="space-y-2">
                        {ALL_PROPERTY_TYPES.map(type => (
                            <label key={type} className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 text-brand bg-gray-700 border-gray-600 rounded focus:ring-brand" checked={filters.propertyTypes?.includes(type)} onChange={() => handleTypeChange(type)} />
                                <span className="ml-2 text-sm text-gray-200">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Amenities</label>
                    <div className="space-y-2">
                        {COMMON_AMENITIES.map(amenity => (
                            <label key={amenity} className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 text-brand bg-gray-700 border-gray-600 rounded focus:ring-brand" checked={filters.amenities?.includes(amenity.toLowerCase())} onChange={() => handleAmenityChange(amenity)} />
                                <span className="ml-2 text-sm text-gray-200">{amenity}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ navigate, initialFilters }) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});

    const fetchProperties = useCallback(async (currentFilters: SearchFilters) => {
        setLoading(true);
        const props = await dataService.getProperties(currentFilters);
        setProperties(props);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProperties(filters);
    }, [filters, fetchProperties]);
    
    const handleFilterChange = (newFilters: SearchFilters) => {
        setFilters(prevFilters => ({...prevFilters, ...newFilters}));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <p className="text-sm text-gray-400 mb-2">{properties.length > 0 ? `${properties.length} stays found` : 'Searching...'}</p>
            <h1 className="text-3xl font-bold mb-4 text-gray-50">
                Stays {filters.location ? `in "${filters.location}"` : "across India"}
            </h1>

            <FilterBar filters={filters} onFilterChange={handleFilterChange} />

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                     {Array.from({ length: 8 }).map((_, i) => (
                         <div key={i} className="animate-pulse">
                             <div className="bg-gray-800 h-64 rounded-lg"></div>
                                 <div className="mt-3 bg-gray-800 h-6 rounded-md w-3/4"></div>
                                 <div className="mt-2 bg-gray-800 h-4 rounded-md w-1/2"></div>
                                 <div className="mt-2 bg-gray-800 h-4 rounded-md w-1/3"></div>
                         </div>
                    ))}
                </div>
            ) : properties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {properties.map(prop => (
                        <PropertyCard key={prop.id} property={prop} navigate={navigate} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold mb-2">No exact matches</h2>
                    <p className="text-gray-400">Try changing or removing some of your filters.</p>
                </div>
            )}
        </div>
    );
};

export default SearchResultsPage;