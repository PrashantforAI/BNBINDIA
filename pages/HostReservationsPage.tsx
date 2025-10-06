import React, { useState, useEffect, useMemo } from 'react';
import { NavigateFunction, Page, Booking, Property, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';

interface HostReservationsPageProps {
    navigate: NavigateFunction;
}

const HostReservationsPage: React.FC<HostReservationsPageProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [reservations, setReservations] = useState<Booking[]>([]);
    const [properties, setProperties] = useState<Record<string, Property>>({});
    const [guests, setGuests] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            const hostReservations = await dataService.getHostReservations(user.id);
            setReservations(hostReservations.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
            
            const propertyIds = [...new Set(hostReservations.map(r => r.propertyId))];
            const guestIds = [...new Set(hostReservations.map(r => r.guestId))];

            const propsData = await Promise.all(propertyIds.map(id => dataService.getPropertyById(id)));
            const guestsData = await Promise.all(guestIds.map(id => dataService.getUserById(id)));

            setProperties(propsData.reduce((acc, p) => p ? { ...acc, [p.id]: p } : acc, {}));
            setGuests(guestsData.reduce((acc, g) => g ? { ...acc, [g.id]: g } : acc, {}));

            setLoading(false);
        };
        fetchData();
    }, [user]);

    const filteredReservations = useMemo(() => {
        const now = new Date();
        switch(activeTab) {
            case 'upcoming':
                return reservations.filter(r => new Date(r.endDate) >= now);
            case 'completed':
                return reservations.filter(r => new Date(r.endDate) < now);
            case 'all':
            default:
                return reservations;
        }
    }, [reservations, activeTab]);

    if (loading) return <div>Loading reservations...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-50 mb-6">Reservations</h1>

             <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('upcoming')} className={`${activeTab === 'upcoming' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Upcoming</button>
                    <button onClick={() => setActiveTab('completed')} className={`${activeTab === 'completed' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Completed</button>
                    <button onClick={() => setActiveTab('all')} className={`${activeTab === 'all' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>All</button>
                </nav>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-200 sm:pl-6">Guest</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">Dates</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">Listing</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">Total Payout</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 bg-gray-800/50">
                            {filteredReservations.map((res) => (
                                <tr key={res.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-200 sm:pl-6">{guests[res.guestId]?.name || 'N/A'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{new Date(res.startDate).toLocaleDateString()} - {new Date(res.endDate).toLocaleDateString()}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400 truncate max-w-xs">{properties[res.propertyId]?.title || 'N/A'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 font-semibold">₹{(res.totalPrice * 0.95).toLocaleString('en-IN')}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <button onClick={() => navigate(Page.INBOX, { bookingId: res.id })} className="text-brand hover:text-brand-dark">Message</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredReservations.length === 0 && <p className="text-center py-12 text-gray-400">No {activeTab} reservations found.</p>}
            </div>
        </div>
    );
};

export default HostReservationsPage;
