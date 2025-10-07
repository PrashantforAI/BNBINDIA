import React, { useState, useEffect } from 'react';
// FIX: Import the 'User' type.
import { NavigateFunction, Page, Property, Booking, PriceOverride, CalendarEvent, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import HostCalendar from '../components/HostCalendar';
import BackButton from '../components/BackButton';

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
    const [guests, setGuests] = useState<Record<string, User>>({});

    useEffect(() => {
        if (!user || !propertyId) return;

        const fetchListingData = async () => {
            setLoading(true);
            const propData = await dataService.getPropertyById(propertyId);
            
            if (propData && propData.hostId === user.id) {
                setProperty(propData);
                const propBookings = await dataService.getBookingsByPropertyId(propertyId);
                setBookings(propBookings);
                
                const guestIds = [...new Set(propBookings.map(b => b.guestId))];
                const guestsData = await Promise.all(guestIds.map(id => dataService.getUserById(id)));
                setGuests(guestsData.reduce((acc, g) => g ? { ...acc, [g.id]: g } : acc, {}));

            } else {
                navigate(Page.HOST_LISTINGS);
            }
            setLoading(false);
        };

        fetchListingData();
    }, [user, propertyId, navigate]);

    const handlePropertyUpdate = async (updates: Partial<Property>) => {
        if (!property) return;

        const updatedProperty = await dataService.updateProperty(property.id, updates);
        if (updatedProperty) {
            setProperty(updatedProperty);
        }
    };
    
    const handlePriceChange = (overrides: PriceOverride[]) => handlePropertyUpdate({ priceOverrides: overrides });
    const handleEventsChange = (events: CalendarEvent[]) => handlePropertyUpdate({ events });
    const handleStatusChange = (newStatus: 'listed' | 'unlisted') => handlePropertyUpdate({ status: newStatus });


    if (loading) return <div className="py-20 text-center">Loading listing details...</div>;
    if (!property) return null;

    return (
        <div className="space-y-8">
            <BackButton onClick={() => navigate(Page.HOST_LISTINGS)} className="mb-4" />
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
                <HostCalendar 
                    property={property} 
                    bookings={bookings} 
                    guests={guests}
                    onPriceChange={handlePriceChange} 
                    onEventsChange={handleEventsChange}
                />
            </div>
        </div>
    );
};

export default ManageListingPage;