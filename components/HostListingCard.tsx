import React from 'react';
import { Property, NavigateFunction, Page } from '../types';

interface HostListingCardProps {
    property: Property;
    navigate: NavigateFunction;
}

const HostListingCard: React.FC<HostListingCardProps> = ({ property, navigate }) => {
    return (
        <div 
            className="group cursor-pointer"
            onClick={() => navigate(Page.MANAGE_LISTING, { id: property.id })}
        >
            <div className="relative overflow-hidden rounded-lg border border-gray-700">
                <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-56 object-cover"
                />
                 <div className="absolute top-3 left-3 bg-gray-900/80 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 text-gray-50 backdrop-blur-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Listed</span>
                </div>
            </div>
            <div className="mt-3">
                <h3 className="font-semibold text-gray-200 truncate">{property.title}</h3>
                <p className="text-gray-400 text-sm">{property.location.city}, {property.location.state}</p>
            </div>
        </div>
    );
};

export default HostListingCard;