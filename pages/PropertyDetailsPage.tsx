import React, { useEffect, useState, useMemo } from 'react';
import { NavigateFunction, Page, Property, Review, User } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../hooks/useAuth';
import { generateDescription, summarizeReviews } from '../services/geminiService';

interface PropertyDetailsPageProps {
    navigate: NavigateFunction;
    propertyId: string;
    offerPrice?: number;
}

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" clipRule="evenodd" />
    </svg>
);

const HeartIcon: React.FC<{ filled: boolean, className?: string }> = ({ filled, className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
);

const dateToYyyyMmDd = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

const BookingWidget: React.FC<{ property: Property, navigate: NavigateFunction, offerPrice?: number }> = ({ property, navigate, offerPrice }) => {
    const { user } = useAuth();
    const [checkIn, setCheckIn] = useState<string>('');
    const [checkOut, setCheckOut] = useState<string>('');
    const [guests, setGuests] = useState<number>(1);
    
    const isHostOwner = user?.id === property.hostId;
    const pricePerNight = offerPrice || property.pricePerNight;

    const { nights, basePrice } = useMemo(() => {
        if (!checkIn || !checkOut) return { nights: 0, basePrice: 0 };
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (start >= end) return { nights: 0, basePrice: 0 };

        let totalNights = 0;
        let currentPrice = 0;
        const priceMap = new Map(property.priceOverrides?.map(o => [o.date, o.price]));

        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            totalNights++;
            const dateString = dateToYyyyMmDd(d);
            // An offer price overrides any date-specific prices.
            currentPrice += offerPrice || priceMap.get(dateString) || property.pricePerNight;
        }

        return { nights: totalNights, basePrice: currentPrice };
    }, [checkIn, checkOut, property.pricePerNight, property.priceOverrides, offerPrice]);

    const serviceFee = basePrice * 0.1;
    const taxes = basePrice * 0.05;
    const totalPrice = basePrice + serviceFee + taxes;

    const handleBooking = async () => {
        if (isHostOwner) return;
        if (!user) {
            alert("Please log in to book a stay.");
            return;
        }
        if (nights <= 0) {
            alert("Please select valid check-in and check-out dates.");
            return;
        }
        
        const bookingData = {
            propertyId: property.id,
            guestId: user.id,
            startDate: new Date(checkIn),
            endDate: new Date(checkOut),
            totalPrice: totalPrice,
            guests: guests,
        };
        
        const newBooking = await dataService.createBooking(bookingData);
        navigate(Page.CONFIRMATION, { bookingId: newBooking.id });
    };
    
    const dateInputStyle = { colorScheme: 'dark' };

    return (
        <div className="sticky top-28 p-6 border border-gray-700 rounded-lg bg-gray-800">
            {offerPrice && (
                <div className="mb-4 p-3 bg-green-900/50 text-green-300 rounded-lg text-center">
                    <p className="font-bold">Special Offer Applied!</p>
                    <p className="text-sm">Your host has offered you a special price.</p>
                </div>
            )}
            <p className="text-2xl mb-4">
                <span className="font-bold">₹{pricePerNight.toLocaleString('en-IN')}</span>
                <span className="text-gray-400 font-normal text-base"> night</span>
                 {offerPrice && <span className="text-sm ml-2 line-through text-gray-500">₹{property.pricePerNight.toLocaleString('en-IN')}</span>}
            </p>
            <div className="grid grid-cols-2 gap-px border border-gray-600 rounded-lg mb-4">
                <div className="p-2">
                    <label className="block text-xs font-bold text-gray-400">CHECK-IN</label>
                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full border-none p-0 focus:ring-0 text-sm bg-transparent" style={dateInputStyle} />
                </div>
                <div className="border-l border-gray-600 p-2">
                    <label className="block text-xs font-bold text-gray-400">CHECK-OUT</label>
                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn} className="w-full border-none p-0 focus:ring-0 text-sm bg-transparent" style={dateInputStyle} />
                </div>
            </div>
             <div className="border border-gray-600 rounded-lg p-2 mb-4">
                <label className="block text-xs font-bold text-gray-400">GUESTS</label>
                <input type="number" value={guests} onChange={e => setGuests(Number(e.target.value))} min="1" max={property.maxGuests} className="w-full border-none p-0 focus:ring-0 text-sm bg-transparent" />
            </div>

            <button onClick={handleBooking} disabled={isHostOwner} className="w-full bg-brand text-gray-900 py-3 rounded-lg font-bold hover:bg-brand-dark transition disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed">
                {isHostOwner ? 'This is your property' : 'Book Now'}
            </button>
            
            {nights > 0 && (
                 <div className="mt-4 space-y-2 text-gray-400">
                    <div className="flex justify-between">
                        <span>Base price for {nights} nights</span>
                        <span>₹{basePrice.toLocaleString('en-IN')}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Service fee</span>
                        <span>₹{serviceFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Taxes</span>
                        <span>₹{taxes.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-bold text-gray-50">
                        <span>Total</span>
                        <span>₹{totalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReviewSection: React.FC<{ propertyId: string }> = ({ propertyId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [summary, setSummary] = useState<string>('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            const fetchedReviews = await dataService.getReviewsByPropertyId(propertyId);
            setReviews(fetchedReviews);
            const userIds = [...new Set(fetchedReviews.map(r => r.guestId))];
            const fetchedUsers = await Promise.all(userIds.map(id => dataService.getUserById(id)));
            const usersMap = fetchedUsers.reduce((acc, user) => {
                if(user) acc[user.id] = user;
                return acc;
            }, {} as Record<string, User>);
            setUsers(usersMap);
        };
        fetchReviews();
    }, [propertyId]);

    const handleSummarize = async () => {
        setIsSummarizing(true);
        const result = await summarizeReviews(reviews);
        setSummary(result);
        setIsSummarizing(false);
    };

    if (reviews.length === 0) return <p>No reviews yet.</p>;

    return (
        <div className="py-10">
            <div className="flex items-center mb-6">
                <StarIcon className="w-6 h-6 text-yellow-400 mr-2" />
                <h2 className="text-2xl font-bold">{(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} · {reviews.length} reviews</h2>
            </div>

            <div className="mb-8">
                <button onClick={handleSummarize} disabled={isSummarizing} className="bg-accent text-gray-900 px-4 py-2 rounded-lg hover:bg-accent-dark transition disabled:bg-opacity-60 font-semibold">
                    {isSummarizing ? 'Summarizing...' : '✨ Summarize Reviews with AI'}
                </button>
                {summary && (
                    <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg review-summary" dangerouslySetInnerHTML={{ __html: summary.replace(/<p>/g, '<p class="text-gray-300">').replace(/<h2>/g, '<h2 class="text-gray-200 font-semibold text-lg mt-2 mb-1">').replace(/<ul>/g, '<ul class="list-disc list-inside text-gray-300 space-y-1">') }}></div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {reviews.slice(0, 4).map(review => (
                    <div key={review.id}>
                        <div className="flex items-center mb-2">
                            <img src={users[review.guestId]?.avatarUrl} alt={users[review.guestId]?.name} className="w-10 h-10 rounded-full mr-4" />
                            <div>
                                <p className="font-semibold text-gray-200">{users[review.guestId]?.name}</p>
                                <p className="text-sm text-gray-400">{review.date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <p className="text-gray-300 line-clamp-3">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GalleryModal: React.FC<{ images: string[], startIndex: number, onClose: () => void }> = ({ images, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const nextImage = () => setCurrentIndex(prev => (prev + 1) % images.length);
    const prevImage = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl">&times;</button>
            <button onClick={e => { e.stopPropagation(); prevImage(); }} className="absolute left-4 text-white text-4xl">&#8249;</button>
            <button onClick={e => { e.stopPropagation(); nextImage(); }} className="absolute right-4 text-white text-4xl">&#8250;</button>
            <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
                <img src={images[currentIndex]} alt="Gallery view" className="w-full h-full object-contain" onClick={e => e.stopPropagation()} />
            </div>
        </div>
    )
}

const PropertyDetailsPage: React.FC<PropertyDetailsPageProps> = ({ navigate, propertyId, offerPrice }) => {
    const { user, toggleWishlist } = useAuth();
    const [property, setProperty] = useState<Property | null>(null);
    const [host, setHost] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [isGalleryOpen, setGalleryOpen] = useState(false);
    const [galleryStartIndex, setGalleryStartIndex] = useState(0);

    const isWishlisted = user?.wishlist.includes(propertyId) ?? false;
    
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const prop = await dataService.getPropertyById(propertyId);
            if (prop) {
                setProperty(prop);
                const hostUser = await dataService.getUserById(prop.hostId);
                setHost(hostUser || null);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [propertyId]);

    const handleGenerateDescription = async () => {
        if (!property) return;
        setIsGeneratingDesc(true);
        const desc = await generateDescription(property);
        setProperty({ ...property, description: desc });
        setIsGeneratingDesc(false);
    };

    const handleWishlistClick = () => {
        if (!user) {
            alert('Please log in to save this property.');
            return;
        }
        toggleWishlist(propertyId);
    };
    
    const handleContactHost = async () => {
        if (!user || !property) {
            alert('Please log in to contact the host.');
            return;
        }
        const convo = await dataService.getOrCreateConversation(user.id, property.id);
        navigate(Page.INBOX, { conversationId: convo.id });
    };

    const openGallery = (index: number) => {
        setGalleryStartIndex(index);
        setGalleryOpen(true);
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!property || !host) return <div className="text-center py-20">Property not found.</div>;

    const isOwnListing = user?.id === host.id;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-3xl font-bold mb-1">{property.title}</h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span>{property.rating} ({property.reviewCount} reviews)</span>
                        <span>·</span>
                        <span className="underline cursor-pointer">{property.location.city}, {property.location.state}, {property.location.country}</span>
                    </div>
                </div>
                 <button onClick={handleWishlistClick} className="flex items-center space-x-2 px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition">
                    <HeartIcon filled={isWishlisted} className={`w-6 h-6 ${isWishlisted ? 'text-red-500' : 'text-gray-200'}`} />
                    <span className="font-semibold hidden sm:block">{isWishlisted ? 'Saved' : 'Save'}</span>
                </button>
            </div>
            
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px] mb-12 overflow-hidden rounded-xl cursor-pointer" onClick={() => openGallery(0)}>
                <div className="col-span-2 row-span-2">
                    <img src={property.images[0]} alt="Main" className="w-full h-full object-cover hover:opacity-90 transition" />
                </div>
                {property.images.slice(1, 5).map((img, i) => (
                    <div key={i} className={i > 1 ? 'hidden sm:block' : ''}>
                         <img onClick={(e) => {e.stopPropagation(); openGallery(i+1)}} src={img} alt={`View ${i+1}`} className="w-full h-full object-cover hover:opacity-90 transition" />
                    </div>
                ))}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2">
                    <div className="pb-8 border-b border-gray-700">
                        <div className="flex justify-between items-start">
                             <div 
                                className="cursor-pointer group"
                                onClick={() => navigate(Page.HOST_PROFILE, { hostId: host.id })}
                             >
                                <h2 className="text-2xl font-semibold group-hover:underline">Entire {property.type} hosted by {host.name}</h2>
                                <p className="text-gray-400">{property.maxGuests} guests · {property.bedrooms} bedrooms · {property.bathrooms} bathrooms</p>
                            </div>
                            <img 
                                src={host.avatarUrl} 
                                alt={host.name} 
                                className="w-14 h-14 rounded-full cursor-pointer" 
                                onClick={() => navigate(Page.HOST_PROFILE, { hostId: host.id })}
                            />
                        </div>
                        {!isOwnListing && user && (
                            <button 
                                onClick={handleContactHost}
                                className="mt-4 bg-gray-700 text-gray-50 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition"
                            >
                                Contact host
                            </button>
                        )}
                    </div>

                    <div className="py-10 border-b border-gray-700">
                         <h3 className="text-xl font-semibold mb-4">About this place</h3>
                         <p className="text-gray-300 whitespace-pre-line">{property.description}</p>
                         {!property.description && (
                            <button onClick={handleGenerateDescription} disabled={isGeneratingDesc} className="mt-4 bg-gray-700 text-gray-50 px-4 py-2 rounded-lg text-sm hover:bg-gray-600 disabled:bg-gray-500">
                                {isGeneratingDesc ? 'Generating...' : '✨ Generate with AI'}
                            </button>
                         )}
                    </div>
                     <div className="py-10 border-b border-gray-700">
                         <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300">
                            {property.amenities.map(amenity => (
                                <div key={amenity} className="flex items-center space-x-3">
                                    <span className="text-xl text-brand">✓</span>
                                    <span>{amenity}</span>
                                </div>
                            ))}
                         </div>
                    </div>
                     <div className="border-b border-gray-700">
                        <ReviewSection propertyId={property.id} />
                     </div>
                     <div className="py-10">
                        <h3 className="text-xl font-semibold mb-4">Where you'll be</h3>
                        <p className="mb-4 text-gray-300">{property.location.city}, {property.location.state}, {property.location.country}</p>
                        <div className="h-96 bg-gray-800 rounded-xl overflow-hidden">
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.location.lng - 0.01}%2C${property.location.lat - 0.01}%2C${property.location.lng + 0.01}%2C${property.location.lat + 0.01}&layer=mapnik&marker=${property.location.lat}%2C${property.location.lng}`}
                            ></iframe>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-1">
                    <BookingWidget property={property} navigate={navigate} offerPrice={offerPrice} />
                </div>
            </div>
            {isGalleryOpen && <GalleryModal images={property.images} startIndex={galleryStartIndex} onClose={() => setGalleryOpen(false)} />}
        </div>
    );
};

export default PropertyDetailsPage;