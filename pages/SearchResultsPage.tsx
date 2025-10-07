
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

const FilterModal: React.FC<{ isOpen: boolean, onClose: () => void, filters: SearchFilters, onFilterChange: (newFilters: SearchFilters) => void, onApply: () => void }> = ({ isOpen, onClose, filters, onFilterChange, onApply }) => {
    if (!isOpen) return null;

    const [priceMax, setPriceMax] = useState(filters.priceMax || 50000);

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
    
    const handleApplyAndClose = () => {
        onFilterChange({ ...filters, priceMax });
        onApply();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col animate-fade-in">
            <header className="p-4 flex justify-between items-center border-b border-gray-700 bg-gray-800">
                <button onClick={onClose} className="text-2xl">&times;</button>
                <h2 className="font-bold">Filters</h2>
                <button onClick={() => onFilterChange({})} className="text-sm">Clear all</button>
            </header>
            <div className="flex-grow overflow-y-auto p-6 space-y-8 bg-gray-900">
                <div>
                    <label className="block text-lg font-medium text-gray-200">Price range</label>
                    <p className="text-gray-400">Up to ₹{priceMax.toLocaleString('en-IN')}</p>
                    <input type="range" min="1000" max="50000" step="1000" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full accent-brand mt-2" />
                </div>
                 <div>
                    <label className="block text-lg font-medium text-gray-200">Bedrooms</label>
                    <select 
                        className="mt-2 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm rounded-md"
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
                    <label className="block text-lg font-medium text-gray-200 mb-3">Property Type</label>
                    <div className="space-y-3">
                        {ALL_PROPERTY_TYPES.map(type => (
                            <label key={type} className="flex items-center">
                                <input type="checkbox" className="h-5 w-5 text-brand bg-gray-700 border-gray-600 rounded focus:ring-brand" checked={filters.propertyTypes?.includes(type)} onChange={() => handleTypeChange(type)} />
                                <span className="ml-3 text-gray-200">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-lg font-medium text-gray-200 mb-3">Amenities</label>
                    <div className="space-y-3">
                        {COMMON_AMENITIES.map(amenity => (
                            <label key={amenity} className="flex items-center">
                                <input type="checkbox" className="h-5 w-5 text-brand bg-gray-700 border-gray-600 rounded focus:ring-brand" checked={filters.amenities?.includes(amenity.toLowerCase())} onChange={() => handleAmenityChange(amenity)} />
                                <span className="ml-3 text-gray-200">{amenity}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <footer className="p-4 bg-gray-800 border-t border-gray-700">
                <button onClick={handleApplyAndClose} className="w-full bg-brand text-gray-900 font-bold py-3 rounded-lg">Show Stays</button>
            </footer>
        </div>
    )
}


const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ navigate, initialFilters }) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
    
    const handleApplyFilters = () => {
        fetchProperties(filters);
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-sm text-gray-400">{properties.length > 0 ? `${properties.length} stays found` : 'Searching...'}</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-50">
                        Stays {filters.location ? `in "${filters.location}"` : "across India"}
                    </h1>
                </div>
                <button onClick={() => setIsFilterModalOpen(true)} className="md:hidden bg-gray-700 text-gray-50 font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
                    <span>Filters</span>
                </button>
            </div>

            <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onFilterChange={setFilters} onApply={handleApplyFilters} />

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
                        <PropertyCard key={prop.id} property={prop} navigate={navigate} searchFilters={filters} />
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
