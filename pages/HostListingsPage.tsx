import React, { useState, useEffect } from 'react';
import { NavigateFunction, Page, Property } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import HostListingCard from '../components/HostListingCard';

interface HostListingsPageProps {
    navigate: NavigateFunction;
}

const HostListingsPage: React.FC<HostListingsPageProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [listings, setListings] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchListings = async () => {
            setLoading(true);
            const allProperties = await dataService.getProperties({ location: '', guests: 0 }); // hack to get all properties
            const hostProperties = (await dataService.getHostDashboardData(user.id)).properties;
            setListings(hostProperties);
            setLoading(false);
        };

        fetchListings();
    }, [user]);

    if (loading) return <div>Loading listings...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-50">Your Listings ({listings.length})</h1>
                <button 
                    onClick={() => navigate(Page.CREATE_LISTING)}
                    className="bg-brand text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-brand-dark transition"
                >
                    + Create Listing
                </button>
            </div>
            
             {listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {listings.map(property => (
                        <HostListingCard key={property.id} property={property} navigate={navigate} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-lg">
                    <h3 className="text-xl font-medium text-gray-50">You have no listings yet</h3>
                    <p className="mt-1 text-sm text-gray-400">Get started by creating your first listing to welcome guests.</p>
                </div>
            )}
        </div>
    );
};

export default HostListingsPage;
