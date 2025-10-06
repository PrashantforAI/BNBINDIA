import React, { useState, useEffect } from 'react';
import { NavigateFunction, Page, Property, Booking, PriceOverride } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import HostCalendar from '../components/HostCalendar';

interface ManageListingPageProps {
    navigate: NavigateFunction;
    propertyId: string;
}

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
                // Property not found or user is not the host
                navigate(Page.DASHBOARD);
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
             // Optionally add a success notification
        }
    };

    if (loading) return <div className="text-center py-20">Loading listing details...</div>;
    if (!property) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={() => navigate(Page.DASHBOARD)} className="text-brand font-semibold mb-4 hover:underline">&larr; Back to Dashboard</button>
            <h1 className="text-3xl font-bold text-gray-50">{property.title}</h1>
            <p className="text-gray-400 mb-8">{property.location.city}, {property.location.state}</p>
            
            <div>
                {/* Tab navigation can be added here in the future */}
                <h2 className="text-2xl font-bold mb-4 text-gray-50">Calendar & Pricing</h2>
                <HostCalendar property={property} bookings={bookings} onPriceChange={handlePriceChange} />
            </div>
        </div>
    );
};

export default ManageListingPage;