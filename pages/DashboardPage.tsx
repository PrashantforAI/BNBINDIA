import React, { useState, useEffect } from 'react';
import { NavigateFunction, Page, Booking, Property } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';

interface DashboardPageProps {
    navigate: NavigateFunction;
}

const TripCard: React.FC<{ booking: Booking, navigate: NavigateFunction }> = ({ booking, navigate }) => {
    const [property, setProperty] = useState<Property | null>(null);

    useEffect(() => {
        const fetchProperty = async () => {
            const prop = await dataService.getPropertyById(booking.propertyId);
            setProperty(prop || null);
        };
        fetchProperty();
    }, [booking.propertyId]);

    if (!property) return <div className="border border-gray-700 rounded-lg p-4 animate-pulse bg-gray-800 h-40"></div>;

    return (
        <div className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/60 transition bg-gray-800">
            <div 
                className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6"
            >
                <img 
                    src={property.images[0]} 
                    alt={property.title} 
                    className="w-full md:w-40 h-32 object-cover rounded-lg cursor-pointer"
                    onClick={() => navigate(Page.PROPERTY, { id: property.id })}
                />
                <div className="flex-grow">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${booking.status === 'upcoming' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
                        {booking.status.toUpperCase()}
                    </span>
                    <h3 
                        className="font-bold text-lg mt-2 cursor-pointer hover:underline text-gray-50"
                        onClick={() => navigate(Page.PROPERTY, { id: property.id })}
                    >
                        {property.title}
                    </h3>
                    <p className="text-sm text-gray-400">{property.location.city}, {property.location.state}</p>
                    <p className="text-sm text-gray-200 mt-2">
                        {booking.startDate.toLocaleDateString()} - {booking.endDate.toLocaleDateString()}
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-gray-50">₹{booking.totalPrice.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-400">Total Price</p>
                     <button 
                        onClick={() => navigate(Page.INBOX, { conversationId: booking.id })}
                        className="mt-3 text-sm bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold transition"
                    >
                        Message Host
                    </button>
                </div>
            </div>
        </div>
    );
};


const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchGuestBookings = async () => {
            setLoading(true);
            const userBookings = await dataService.getBookingsByUserId(user.id);
            setBookings(userBookings.sort((a,b) => b.startDate.getTime() - a.startDate.getTime()));
            setLoading(false);
        };

        fetchGuestBookings();
    }, [user]);

    if (loading) return <div className="text-center p-10">Loading your trips...</div>;
    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-50">My Trips</h1>
            
            {bookings.length > 0 ? (
                <div className="space-y-6">
                    {bookings.map(booking => (
                        <TripCard key={booking.id} booking={booking} navigate={navigate} />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
                    <h3 className="text-xl font-medium text-gray-50">No trips booked... yet!</h3>
                    <p className="mt-1 text-sm text-gray-400">Time to dust off your bags and start planning your next adventure.</p>
                     <button onClick={() => navigate(Page.HOME)} className="mt-4 bg-brand text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-brand-dark transition">
                        Start exploring
                    </button>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;