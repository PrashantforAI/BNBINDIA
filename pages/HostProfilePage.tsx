import React, { useState, useEffect } from 'react';
import { NavigateFunction, Page, Property, User } from '../types';
import { dataService } from '../services/dataService';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../hooks/useAuth';
import BackButton from '../components/BackButton';

interface HostProfilePageProps {
    navigate: NavigateFunction;
    hostId: string;
}

const HostProfilePage: React.FC<HostProfilePageProps> = ({ navigate, hostId }) => {
    const { user: currentUser } = useAuth();
    const [host, setHost] = useState<User | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const hostData = await dataService.getUserById(hostId);
            if (hostData) {
                setHost(hostData);
                const hostProperties = await dataService.getPropertiesByHostId(hostId);
                setProperties(hostProperties);
            }
            setLoading(false);
        };
        fetchData();
    }, [hostId]);

    if (loading) {
        return <div className="text-center py-20">Loading host profile...</div>;
    }

    if (!host) {
        return <div className="text-center py-20">Host not found.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <BackButton className="mb-8" />
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-12">
                    <img src={host.avatarUrl} alt={host.name} className="w-32 h-32 rounded-full mb-4 md:mb-0 border-4 border-gray-700"/>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold text-gray-50">{host.name}</h1>
                        <p className="text-gray-400 mt-2">{host.isHost ? "Host" : ""}</p>
                        <p className="mt-4 text-gray-300 max-w-xl">{host.about}</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-50">Listings from {host.name.split(' ')[0]} ({properties.length})</h2>
                    {properties.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {properties.map(prop => (
                                <PropertyCard key={prop.id} property={prop} navigate={navigate} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg">
                            <p className="text-gray-400">{host.name} has no active listings right now.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HostProfilePage;