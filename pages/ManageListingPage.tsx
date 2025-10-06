import React, { useState, useEffect } from 'react';
import { NavigateFunction, Page, Property, Booking, PriceOverride } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import HostCalendar from '../components/HostCalendar';

interface ManageListingPageProps {
    navigate: NavigateFunction;
    propertyId: string;
}

const Toggle: React.FC<{ enabled: boolean, onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        onClick={() => onChange(!enabled)}
        className={`${enabled ? 'bg-brand' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
    >
        <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
    </button>
);


const ManageListingPage: React.FC<ManageListingPageProps> = ({ navigate, propertyId }) => {
    const { user } = useAuth();
    const [property, setProperty] = useState<Property | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !propertyId) return;

        const fetchListingData = async () => {
            setLoading(true);
            const propData = await dataService.getPropertyById(propertyId);
            
            if (propData && propData.hostId === user.id) {
                setProperty(propData);
                const propBookings = await dataService.getBookingsByPropertyId(propertyId);
                setBookings(propBookings);
            } else {
                navigate(Page.HOST_LISTINGS);
            }
            setLoading(false);
        };

        fetchListingData();
    }, [user, propertyId, navigate]);

    const handlePriceChange = async (overrides: PriceOverride[]) => {
        if (!property) return;

        const updatedProperty = await dataService.updateProperty(property.id, { priceOverrides: overrides });
        if (updatedProperty) {
            setProperty(updatedProperty);
        }
    };

    const handleStatusChange = async (newStatus: 'listed' | 'unlisted') => {
        if (!property) return;

        const updatedProperty = await dataService.updateProperty(property.id, { status: newStatus });
        if (updatedProperty) {
            setProperty(updatedProperty);
        }
    };

    if (loading) return <div className="py-20 text-center">Loading listing details...</div>;
    if (!property) return null;

    return (
        <div className="space-y-8">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-50">{property.title}</h1>
                    <p className="text-gray-400 mt-1">{property.location.city}, {property.location.state}</p>
                </div>
                <button 
                    onClick={() => navigate(Page.EDIT_LISTING, { id: property.id })}
                    className="bg-gray-700 text-gray-50 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition"
                >
                    Edit Listing Details
                </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-gray-50">Listing Status</h3>
                    <p className="text-sm text-gray-400">
                        {property.status === 'listed' ? 'Visible to guests and available for booking.' : 'Hidden from search results.'}
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <span className={`font-semibold ${property.status === 'listed' ? 'text-green-400' : 'text-gray-400'}`}>
                        {property.status === 'listed' ? 'Listed' : 'Unlisted'}
                    </span>
                    <Toggle enabled={property.status === 'listed'} onChange={(e) => handleStatusChange(e ? 'listed' : 'unlisted')} />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-50">Calendar & Pricing</h2>
                <HostCalendar property={property} bookings={bookings} onPriceChange={handlePriceChange} />
            </div>
        </div>
    );
};

export default ManageListingPage;