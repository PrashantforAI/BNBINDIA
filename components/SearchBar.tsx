import React, { useState } from 'react';
import { SearchFilters } from '../types';
import { parseSearchQuery } from '../services/geminiService';

interface SearchBarProps {
    onSearch: (filters: SearchFilters) => void;
}

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
    </svg>
);

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [location, setLocation] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [aiQuery, setAiQuery] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);

    const handleSearch = () => {
        onSearch({
            location,
            checkIn: checkIn ? new Date(checkIn) : undefined,
            checkOut: checkOut ? new Date(checkOut) : undefined,
            guests: guests > 0 ? guests : undefined,
        });
    };

    const handleAiSearch = async () => {
        if (!aiQuery) return;
        setIsLoadingAi(true);
        try {
            const filters = await parseSearchQuery(aiQuery);
            onSearch(filters);
        } catch (error) {
            console.error("AI search failed", error);
        } finally {
            setIsLoadingAi(false);
        }
    };
    
    // Style for date input to show placeholder
    const dateInputStyle = {
      colorScheme: 'dark',
    };

    return (
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl max-w-4xl mx-auto border border-gray-700 shadow-2xl shadow-black/30">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center">
                <div className="p-2">
                    <label htmlFor="location" className="block text-xs font-bold text-gray-200 px-2">Location</label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Search destinations"
                        className="w-full text-sm text-gray-200 focus:outline-none px-2 py-1 bg-transparent"
                    />
                </div>
                <div className="p-2 md:border-l border-gray-700">
                     <label htmlFor="check-in" className="block text-xs font-bold text-gray-200 px-2">Check in</label>
                     <input
                        id="check-in"
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full text-sm text-gray-200 focus:outline-none px-2 py-1 bg-transparent"
                        style={dateInputStyle}
                    />
                </div>
                <div className="p-2 md:border-l border-gray-700">
                    <label htmlFor="check-out" className="block text-xs font-bold text-gray-200 px-2">Check out</label>
                    <input
                        id="check-out"
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full text-sm text-gray-200 focus:outline-none px-2 py-1 bg-transparent"
                        style={dateInputStyle}
                    />
                </div>
                <div className="p-2 md:border-l border-gray-700 flex items-center justify-between">
                    <div>
                        <label htmlFor="guests" className="block text-xs font-bold text-gray-200 px-2">Guests</label>
                        <input
                            id="guests"
                            type="number"
                            value={guests}
                            onChange={(e) => setGuests(Number(e.target.value))}
                            min="1"
                            className="w-full text-sm text-gray-200 focus:outline-none px-2 py-1 bg-transparent"
                        />
                    </div>
                    <button onClick={handleSearch} className="bg-brand rounded-full p-3 text-white hover:bg-brand-dark transition-colors">
                        <SearchIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
             <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-200 flex-shrink-0">✨ Try AI Search:</span>
                    <input
                        type="text"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        placeholder="e.g., pet-friendly villa with pool in Lonavala for Diwali"
                        className="w-full text-sm text-gray-200 focus:outline-none px-2 py-1.5 bg-gray-700/80 rounded-md focus:ring-2 focus:ring-accent"
                        onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                        disabled={isLoadingAi}
                    />
                    <button onClick={handleAiSearch} disabled={isLoadingAi} className="bg-accent text-gray-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-accent-dark transition disabled:bg-opacity-50">
                        {isLoadingAi ? '...' : 'Go'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SearchBar;