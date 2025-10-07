import React, { useEffect, useState } from 'react';
import { NavigateFunction, Page, Property, SearchFilters } from '../types';
import { dataService } from '../services/dataService';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';

interface HomePageProps {
    navigate: NavigateFunction;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            const props = await dataService.getProperties();
            setProperties(props);
            setLoading(false);
        };
        fetchProperties();
    }, []);

    const handleSearch = (filters: SearchFilters) => {
        navigate(Page.SEARCH, { filters });
    };

    return (
        <div>
            <div className="relative h-[500px] bg-cover bg-center bg-gray-800">
                <img src="https://picsum.photos/seed/hero/1600/800" alt="Serene destination" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
                <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-gray-50 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 drop-shadow-lg">Find your next getaway</h1>
                    <p className="text-lg sm:text-xl max-w-2xl mb-8 drop-shadow">Discover entire homes and private rooms perfect for any trip in India.</p>
                </div>
            </div>
            
            <div className="-mt-16 relative z-10 px-4">
                 <SearchBar onSearch={handleSearch} />
            </div>

            <div className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold mb-8 text-gray-50">Featured Stays</h2>
                {loading ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {Array.from({ length: 8 }).map((_, i) => (
                             <div key={i} className="animate-pulse">
                                 <div className="bg-gray-800 h-64 rounded-xl"></div>
                                 <div className="mt-3 bg-gray-800 h-6 rounded-md w-3/4"></div>
                                 <div className="mt-2 bg-gray-800 h-4 rounded-md w-1/2"></div>
                                 <div className="mt-2 bg-gray-800 h-4 rounded-md w-1/3"></div>
                             </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {properties.slice(0, 8).map(prop => (
                            <PropertyCard key={prop.id} property={prop} navigate={navigate} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;