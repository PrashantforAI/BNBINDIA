import React, { useState, useEffect } from 'react';
import { NavigateFunction, Property, Booking, PriceOverride, CalendarEvent, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import HostCalendar from '../components/HostCalendar';

const HostCalendarPage: React.FC<{ navigate: NavigateFunction }> = ({ navigate }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [guests, setGuests] = useState<Record<string, User>>({});
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            const hostData = await dataService.getHostDashboardData(user.id);
            setAllProperties(hostData.properties);
            setAllBookings(hostData.bookings);
            
            if (hostData.properties.length > 0) {
                setSelectedPropertyId(hostData.properties[0].id);
            }

            const guestIds = [...new Set(hostData.bookings.map(b => b.guestId))];
            const guestsData = await Promise.all(guestIds.map(id => dataService.getUserById(id)));
            setGuests(guestsData.reduce((acc, g) => g ? { ...acc, [g.id]: g } : acc, {}));

            setLoading(false);
        };
        fetchData();
    }, [user]);

    const handlePropertyUpdate = async (propertyId: string, updates: Partial<Property>) => {
        const updatedProp = await dataService.updateProperty(propertyId, updates);
        if (updatedProp) {
            setAllProperties(prevProps => prevProps.map(p => p.id === updatedProp.id ? updatedProp : p));
        }
    };

    const selectedProperty = allProperties.find(p => p.id === selectedPropertyId);

    if (loading) return <div>Loading calendar...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-50">Calendar</h1>
                {allProperties.length > 0 && (
                    <select
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        className="w-full md:w-1/3 p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-50"
                    >
                        {allProperties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                )}
            </div>
            
            {selectedProperty ? (
                <HostCalendar
                    property={selectedProperty}
                    bookings={allBookings.filter(b => b.propertyId === selectedProperty.id)}
                    guests={guests}
                    onPriceChange={(overrides: PriceOverride[]) => handlePropertyUpdate(selectedProperty.id, { priceOverrides: overrides })}
                    onEventsChange={(events: CalendarEvent[]) => handlePropertyUpdate(selectedProperty.id, { events: events })}
                />
            ) : (
                <div className="text-center py-20 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400">You don't have any listings yet. Create a listing to manage its calendar.</p>
                </div>
            )}
        </div>
    );
};

export default HostCalendarPage;