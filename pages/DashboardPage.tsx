import React, { useState, useEffect } from 'react';
import { NavigateFunction, Page, Booking, Property } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import HostListingCard from '../components/HostListingCard';

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
                        onClick={() => navigate(Page.INBOX, { bookingId: booking.id })}
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
    const [listings, setListings] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    // Default to 'listings' if user is a host, otherwise 'trips'
    const [activeTab, setActiveTab] = useState<'trips' | 'listings'>(user?.isHost ? 'listings' : 'trips');

    useEffect(() => {
        if (!user) return;
        
        const fetchDashboardData = async () => {
            setLoading(true);
            const userBookings = await dataService.getBookingsByUserId(user.id);
            const userGuestBookings = userBookings.filter(b => b.guestId === user.id);
            setBookings(userGuestBookings);

            if (user.isHost) {
                const allProperties = await dataService.getProperties();
                const userListings = allProperties.filter(p => p.hostId === user.id);
                setListings(userListings);
            }
            
            setLoading(false);
        };

        fetchDashboardData();
    }, [user]);

    if (loading) return <div className="text-center p-10">Loading dashboard...</div>;
    if (!user) return null;
    
    const guestTrips = bookings.sort((a,b) => b.startDate.getTime() - a.startDate.getTime());

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8 text-gray-50">Welcome back, {user.name}</h1>
            
            <div className="border-b border-gray-700 mb-8">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                     {user.isHost && (
                        <button
                             onClick={() => setActiveTab('listings')}
                             className={`${activeTab === 'listings' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            My Listings
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('trips')}
                        className={`${activeTab === 'trips' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        My Trips
                    </button>
                </nav>
            </div>

            {activeTab === 'trips' && (
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-50">Your upcoming and past trips</h2>
                    {guestTrips.length > 0 ? (
                        <div className="space-y-6">
                            {guestTrips.map(booking => (
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
            )}

            {activeTab === 'listings' && user.isHost && (
                 <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-50">{listings.length} Listings</h2>
                        <button 
                            onClick={() => navigate(Page.CREATE_LISTING)}
                            className="bg-brand text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-brand-dark transition"
                        >
                            + Create New Listing
                        </button>
                    </div>
                     {listings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {listings.map(property => (
                                <HostListingCard key={property.id} property={property} navigate={navigate} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
                            <h3 className="text-xl font-medium text-gray-50">No listings yet</h3>
                            <p className="mt-1 text-sm text-gray-400">Get started by creating your first listing.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;