import React, { useState, useEffect } from 'react';
import { NavigateFunction, Page, Booking, Property, Conversation, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';

interface HostDashboardPageProps {
    navigate: NavigateFunction;
}

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
};

const WelcomeHeader: React.FC<{ name: string }> = ({ name }) => (
    <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-50">Welcome back, {name}</h1>
        <p className="text-gray-400 mt-1">Here's what's happening with your listings today.</p>
    </div>
);

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center space-x-4">
        <div className="bg-brand/10 text-brand p-3 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-gray-50">{value}</p>
        </div>
    </div>
);

const GuestActivityCard: React.FC<{
    booking: Booking;
    property?: Property;
    guest?: User;
    activity: 'Checking in' | 'Checking out' | 'Currently staying';
    navigate: NavigateFunction;
}> = ({ booking, property, guest, activity, navigate }) => {
    let activityColor = 'text-green-400';
    if (activity === 'Checking out') activityColor = 'text-yellow-400';
    if (activity === 'Currently staying') activityColor = 'text-blue-400';

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center space-x-4">
            <img src={guest?.avatarUrl} alt={guest?.name} className="w-12 h-12 rounded-full" />
            <div className="flex-grow">
                <p className={`font-bold ${activityColor}`}>{activity}</p>
                <p className="text-gray-200 font-semibold">{guest?.name}</p>
                <p className="text-sm text-gray-400 cursor-pointer hover:underline" onClick={() => navigate(Page.MANAGE_LISTING, { id: property?.id })}>
                    {property?.title}
                </p>
            </div>
            <button onClick={() => navigate(Page.INBOX, { bookingId: booking.id })} className="bg-gray-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-600">
                Message
            </button>
        </div>
    );
};

const HostDashboardPage: React.FC<HostDashboardPageProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        properties: Property[];
        bookings: Booking[];
        conversations: Conversation[];
    } | null>(null);
    const [users, setUsers] = useState<Record<string, User>>({});

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            const hostData = await dataService.getHostDashboardData(user.id);
            setData(hostData);

            const userIds = new Set<string>();
            hostData.bookings.forEach(b => userIds.add(b.guestId));
            const fetchedUsers = await Promise.all(Array.from(userIds).map(id => dataService.getUserById(id)));
            const usersMap = fetchedUsers.reduce((acc, u) => {
                if (u) acc[u.id] = u;
                return acc;
            }, {} as Record<string, User>);
            setUsers(usersMap);

            setLoading(false);
        };
        fetchData();
    }, [user]);

    if (loading) return <div>Loading...</div>;
    if (!user || !data) return null;

    const today = new Date();
    const checkingIn = data.bookings.filter(b => isToday(b.startDate) && b.status === 'upcoming');
    const checkingOut = data.bookings.filter(b => isToday(b.endDate) && b.status === 'upcoming');
    const currentlyStaying = data.bookings.filter(b => b.startDate < today && b.endDate > today && b.status === 'upcoming');
    const unreadMessages = data.conversations.filter(c => c.messages.length > 0 && c.messages[c.messages.length - 1].senderId !== user.id).length;

    return (
        <div>
            <WelcomeHeader name={user.name.split(' ')[0]} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Checking In Today" value={checkingIn.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>} />
                <StatCard title="Checking Out Today" value={checkingOut.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>} />
                <StatCard title="Currently Staying" value={currentlyStaying.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                <StatCard title="Unread Messages" value={unreadMessages} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-50">Today's Activity</h2>
                     <div className="space-y-4">
                        {checkingIn.map(b => <GuestActivityCard key={b.id} booking={b} property={data.properties.find(p => p.id === b.propertyId)} guest={users[b.guestId]} activity="Checking in" navigate={navigate} />)}
                        {currentlyStaying.map(b => <GuestActivityCard key={b.id} booking={b} property={data.properties.find(p => p.id === b.propertyId)} guest={users[b.guestId]} activity="Currently staying" navigate={navigate} />)}
                        {checkingOut.map(b => <GuestActivityCard key={b.id} booking={b} property={data.properties.find(p => p.id === b.propertyId)} guest={users[b.guestId]} activity="Checking out" navigate={navigate} />)}
                        {checkingIn.length + checkingOut.length + currentlyStaying.length === 0 && (
                            <p className="text-gray-400 text-center py-8 bg-gray-800 rounded-lg">No guest activity today.</p>
                        )}
                    </div>
                </div>
                 <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-50">Quick Links</h2>
                     <div className="space-y-3">
                        <button onClick={() => navigate(Page.HOST_LISTINGS)} className="w-full text-left font-semibold p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition">Manage All Listings</button>
                        <button onClick={() => navigate(Page.HOST_CALENDAR)} className="w-full text-left font-semibold p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition">Update Calendar</button>
                        <button onClick={() => navigate(Page.HOST_RESERVATIONS)} className="w-full text-left font-semibold p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition">View All Reservations</button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HostDashboardPage;
