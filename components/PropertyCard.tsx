
import React from 'react';
import { Property, NavigateFunction, Page, SearchFilters } from '../types';
import { useAuth } from '../hooks/useAuth';

interface PropertyCardProps {
    property: Property;
    navigate: NavigateFunction;
    searchFilters?: SearchFilters;
}

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" clipRule="evenodd" />
    </svg>
);

const HeartIcon: React.FC<{ filled: boolean, onClick: (e: React.MouseEvent) => void, className?: string }> = ({ filled, onClick, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="white" strokeWidth={1.5} className={className} onClick={onClick}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
);


const PropertyCard: React.FC<PropertyCardProps> = ({ property, navigate, searchFilters }) => {
    const { user, toggleWishlist } = useAuth();
    const isWishlisted = user?.wishlist.includes(property.id) ?? false;

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            alert('Please log in to add properties to your wishlist.');
            return;
        }
        toggleWishlist(property.id);
    };

    return (
        <div 
            className="group cursor-pointer transition-all duration-300 hover:-translate-y-1"
            onClick={() => navigate(Page.PROPERTY, { id: property.id, ...searchFilters })}
        >
            <div className="relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl group-hover:shadow-black/30 transition-shadow duration-300">
                <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <HeartIcon 
                    filled={isWishlisted}
                    onClick={handleWishlistClick}
                    className={`absolute top-4 right-4 w-7 h-7 cursor-pointer transition-all duration-300 active:scale-90 drop-shadow-lg transform hover:scale-110 ${isWishlisted ? 'text-red-500' : 'text-transparent'}`}
                />
            </div>
            <div className="mt-3 px-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-50 truncate pr-2">{property.title}</h3>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-200 text-sm font-semibold">{property.rating.toFixed(1)}</span>
                    </div>
                </div>
                <p className="text-gray-400 text-sm">{property.location.city}, {property.location.state}</p>
                <p className="mt-1">
                    <span className="font-semibold text-gray-50 text-lg">₹{property.pricePerNight.toLocaleString('en-IN')}</span>
                    <span className="text-gray-400"> night</span>
                </p>
            </div>
        </div>
    );
};

export default PropertyCard;
