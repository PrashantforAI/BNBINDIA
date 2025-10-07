import React, { useEffect, useState, useMemo } from 'react';
import { NavigateFunction, Page, Property, Review, User, Booking } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../hooks/useAuth';
import { summarizeReviews, getNearbyAttractions } from '../services/geminiService';

// --- HELPER & ICON COMPONENTS ---

const StarIcon = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" clipRule="evenodd" />
    </svg>
);

const AmenityIcon = ({ name, className = 'w-6 h-6' }) => {
    // FIX: Use React.JSX.Element to specify the type for JSX elements.
    const icons: Record<string, React.JSX.Element> = {
        'Pool': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>,
        'Wifi': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" /></svg>,
        'Air Conditioning': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>,
        'Kitchen': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
        'Parking': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 1.5 12V5.625c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v6.75a3.375 3.375 0 0 0-3.375 3.375v1.875" /></svg>,
        'Garden': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c1.355 0 2.707-.157 4-.447M12 21c-1.355 0-2.707-.157-4-.447m8-.894a4.502 4.502 0 0 0-8 0" /></svg>,
        'Workspace': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.97 2.122L7.03 21.75H17.97l-1.03-1.372A3 3 0 0 1 15 18.257V17.25m-6 0h6M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /></svg>,
        'TV': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3.75v3.75m-3.75-3.75v3.75m-3.75-3.75h15a1.5 1.5 0 0 0 1.5-1.5v-8.25a1.5 1.5 0 0 0-1.5-1.5h-15a1.5 1.5 0 0 0-1.5 1.5v8.25a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>,
        'Washing Machine': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9.563V9.313a2.25 2.25 0 0 1 4.5 0v.25m-4.5 0a2.25 2.25 0 0 0 4.5 0M9 9.563l-1.5-1.5M15 9.563l1.5-1.5M12 18.375a3.375 3.375 0 0 0-3.375-3.375h-.142c-.254 0-.495.052-.714.147l-1.127.451a.75.75 0 0 0-.49 1.124l1.323 2.646a3.375 3.375 0 0 0 6.012 0l1.323-2.646a.75.75 0 0 0-.49-1.124l-1.127-.451a3.375 3.375 0 0 0-3.486 3.227Z" /></svg>,
        'Balcony': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m-3-1-3-1M15.75 3v-1.5A2.25 2.25 0 0 0 13.5 0h-3A2.25 2.25 0 0 0 8.25 1.5V3m0 13.5 3-1m0 0-3-1m3 1v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25" /></svg>,
        'Projector': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.97 2.122L7.03 21.75H17.97l-1.03-1.372A3 3 0 0 1 15 18.257V17.25m-6 0h6" /><path strokeLinecap="round" strokeLinejoin="round" d="m12.75 8.25-1.5 1.5-1.5-1.5m1.5-1.5-1.5-1.5-1.5 1.5M12 3.75l-1.5 1.5-1.5-1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="m12.75 12.75-1.5 1.5-1.5-1.5m1.5-1.5-1.5-1.5-1.5 1.5M12 8.25l-1.5 1.5-1.5-1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.75H3" /></svg>,
    };
    return icons[name] || icons['Pool'];
};

const dateToYyyyMmDd = (date: Date) => date.toISOString().split('T')[0];

// --- MAIN PAGE & SUB-COMPONENTS ---

interface PropertyDetailsPageProps {
    navigate: NavigateFunction;
    propertyId: string;
    offerPrice?: number;
}

const PropertyDetailsPage: React.FC<PropertyDetailsPageProps> = ({ navigate, propertyId, offerPrice }) => {
    const { user, toggleWishlist } = useAuth();
    const [property, setProperty] = useState<Property | null>(null);
    const [host, setHost] = useState<User | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviewUsers, setReviewUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isGalleryOpen, setGalleryOpen] = useState(false);
    const [isAmenitiesOpen, setAmenitiesOpen] = useState(false);
    const [isReviewsOpen, setReviewsOpen] = useState(false);
    const [isBookingModalOpen, setBookingModalOpen] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const prop = await dataService.getPropertyById(propertyId);
            if (prop) {
                setProperty(prop);
                const [hostUser, fetchedReviews, propBookings] = await Promise.all([
                    dataService.getUserById(prop.hostId),
                    dataService.getReviewsByPropertyId(prop.id),
                    dataService.getBookingsByPropertyId(prop.id)
                ]);

                setHost(hostUser || null);
                setReviews(fetchedReviews);
                setBookings(propBookings);

                const userIds = [...new Set(fetchedReviews.map(r => r.guestId))];
                const users = await Promise.all(userIds.map(id => dataService.getUserById(id)));
                setReviewUsers(users.reduce((acc, u) => u ? {...acc, [u.id]: u} : acc, {}));

            }
            setLoading(false);
        };
        fetchDetails();
    }, [propertyId]);

    const handleWishlistClick = () => {
        if (!user) { alert('Please log in to save this property.'); return; }
        toggleWishlist(propertyId);
    };
    
    const handleReserve = (bookingDetails: Omit<Booking, 'id' | 'status' | 'guestId' | 'propertyId'>) => {
        if (!user) {
            alert("Please log in to make a reservation.");
            return;
        }
        if (!property) return;

        const newBooking = {
            ...bookingDetails,
            guestId: user.id,
            propertyId: property.id,
        };
        
        dataService.createBooking(newBooking).then(createdBooking => {
            navigate(Page.CONFIRMATION, { bookingId: createdBooking.id });
        });
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!property || !host) return <div className="text-center py-20">Property not found.</div>;

    const isWishlisted = user?.wishlist.includes(propertyId) ?? false;
    
    return (
        <div className="bg-gray-900 text-gray-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ListingHeader property={property} isWishlisted={isWishlisted} onWishlistClick={handleWishlistClick} />
                <PhotoGallery images={property.images} onShowAll={() => setGalleryOpen(true)} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 xl:gap-x-24 mt-8">
                    <div className="lg:col-span-2">
                        <ListingInfo property={property} host={host} />
                        <Divider />
                        <ListingHighlights highlights={property.highlights} />
                        <Divider />
                        <Description description={property.description} />
                        <Divider />
                        <SleepingArrangements arrangements={property.sleepingArrangements} />
                        <Divider />
                        <AmenitiesSection amenities={property.amenities} onShowAll={() => setAmenitiesOpen(true)} />
                        <Divider />
                        <AvailabilityCalendar propertyId={property.id} />
                    </div>
                    <div className="lg:col-span-1 relative">
                        <StickyBookingWidget property={property} offerPrice={offerPrice} onReserve={handleReserve} bookings={bookings} />
                    </div>
                </div>

                <Divider />
                <ReviewsSection reviews={reviews} users={reviewUsers} propertyRating={property.rating} onShowAll={() => setReviewsOpen(true)} />
                <Divider />
                <ExploreNearbySection location={property.location} />
                <Divider />
                <MapSection location={property.location} />
                <Divider />
                <HostSection host={host} property={property} navigate={navigate} currentUser={user} />
                <Divider />
                <ThingsToKnow property={property} />
            </div>
            
            <MobileBookingFooter property={property} onReserveClick={() => setBookingModalOpen(true)} />
            {isGalleryOpen && <GalleryModal images={property.images} onClose={() => setGalleryOpen(false)} />}
            {isAmenitiesOpen && <AmenitiesModal amenities={property.amenities} onClose={() => setAmenitiesOpen(false)} />}
            {isReviewsOpen && <ReviewsModal reviews={reviews} users={reviewUsers} onClose={() => setReviewsOpen(false)} />}
            {isBookingModalOpen && (
                <MobileBookingModal
                    property={property}
                    offerPrice={offerPrice}
                    onClose={() => setBookingModalOpen(false)}
                    onReserve={handleReserve}
                    bookings={bookings}
                />
            )}
        </div>
    );
};

const Divider = () => <hr className="border-gray-700 my-8" />;

const ListingHeader: React.FC<{property: Property, isWishlisted: boolean, onWishlistClick: () => void}> = ({ property, isWishlisted, onWishlistClick }) => (
    <header className="mb-4">
        <h1 className="text-3xl font-bold mb-1">{property.title}</h1>
        <div className="flex flex-wrap items-center space-x-4 text-sm">
            <div className="flex items-center">
                <StarIcon />
                <span className="font-semibold ml-1">{property.rating.toFixed(1)}</span>
                <span className="text-gray-400">({property.reviewCount} reviews)</span>
            </div>
            <span className="text-gray-500">·</span>
            {property.hostId === 'user1' && (
                <>
                    <div className="flex items-center font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Superhost
                    </div>
                    <span className="text-gray-500">·</span>
                </>
            )}
            <a href="#map" className="font-semibold underline hover:text-gray-50 transition">{property.location.city}, {property.location.state}, {property.location.country}</a>
        </div>
    </header>
);

const PhotoGallery: React.FC<{images: string[], onShowAll: () => void}> = ({ images, onShowAll }) => (
    <div className="relative grid grid-cols-4 grid-rows-2 gap-2 h-[55vh] max-h-[500px] rounded-xl overflow-hidden mt-6">
        <div className="col-span-4 sm:col-span-2 row-span-2 h-full cursor-pointer" onClick={onShowAll}>
            <img src={images[0]} alt="Main listing" className="w-full h-full object-cover hover:brightness-90 transition" />
        </div>
        {images.slice(1, 5).map((img, i) => (
            <div key={i} className="hidden sm:block h-full cursor-pointer" onClick={onShowAll}>
                <img src={img} alt={`Listing view ${i+1}`} className="w-full h-full object-cover hover:brightness-90 transition" />
            </div>
        ))}
        <button onClick={onShowAll} className="absolute bottom-4 right-4 bg-gray-900/80 text-white font-semibold px-4 py-2 rounded-lg border border-gray-50/50 backdrop-blur-sm hover:bg-gray-800 transition">
            Show all photos
        </button>
    </div>
);

const ListingInfo: React.FC<{property: Property, host: User}> = ({ property, host }) => (
    <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-semibold">Entire {property.type.toLowerCase()} in {property.location.city}</h2>
            <p className="text-gray-400 mt-1">{property.maxGuests} guests · {property.bedrooms} bedrooms · {property.bedrooms} beds · {property.bathrooms} bathrooms</p>
        </div>
        <img src={host.avatarUrl} alt={host.name} className="w-14 h-14 rounded-full flex-shrink-0" />
    </div>
);

const ListingHighlights: React.FC<{highlights: Property['highlights']}> = ({ highlights = [] }) => (
    <div className="space-y-4">
        {highlights.map(h => (
            <div key={h.title} className="flex items-center space-x-4">
                <AmenityIcon name={h.title} className="w-6 h-6 text-brand" />
                <div>
                    <p className="font-semibold">{h.title}</p>
                    <p className="text-gray-400 text-sm">{h.subtitle}</p>
                </div>
            </div>
        ))}
    </div>
);

const Description: React.FC<{description: string}> = ({ description }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4">About this place</h3>
        <p className="text-gray-300 whitespace-pre-line">{description}</p>
    </div>
);

const SleepingArrangements: React.FC<{arrangements: Property['sleepingArrangements']}> = ({ arrangements = [] }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4">Where you'll sleep</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {arrangements.map(room => (
                <div key={room.room} className="border border-gray-700 p-4 rounded-lg">
                    <AmenityIcon name="Bed" className="w-7 h-7 mb-2" />
                    <p className="font-semibold">{room.room}</p>
                    <p className="text-gray-400 text-sm">{room.beds.map(b => `${b.count} ${b.type}`).join(', ')}</p>
                </div>
            ))}
        </div>
    </div>
);

const AmenitiesSection: React.FC<{amenities: string[], onShowAll: () => void}> = ({ amenities, onShowAll }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
            <div className="grid grid-cols-2 gap-y-4">
                {amenities.slice(0, 10).map(amenity => (
                    <div key={amenity} className="flex items-center space-x-3">
                        <AmenityIcon name={amenity} />
                        <span>{amenity}</span>
                    </div>
                ))}
            </div>
            {amenities.length > 10 && (
                <button onClick={onShowAll} className="mt-6 font-semibold border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-800 transition">
                    Show all {amenities.length} amenities
                </button>
            )}
        </div>
    );
};

const AIReviewSummary: React.FC<{ reviews: Review[] }> = ({ reviews }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        summarizeReviews(reviews)
            .then(setSummary)
            .finally(() => setIsLoading(false));
    }, [reviews]);

    return (
        <div className="p-6 rounded-lg bg-gray-800/50 border border-gray-700 mb-8">
            <h3 className="text-xl font-bold text-gray-50 flex items-center space-x-2">
                <span>✨</span>
                <span>AI Review Summary</span>
            </h3>
            {isLoading ? (
                <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                </div>
            ) : (
                <div className="prose prose-invert prose-sm text-gray-300 mt-4" dangerouslySetInnerHTML={{ __html: summary }} />
            )}
        </div>
    );
};


const ReviewsSection: React.FC<{ reviews: Review[], users: Record<string, User>, propertyRating: number, onShowAll: () => void }> = ({ reviews, users, propertyRating, onShowAll }) => {
    if (reviews.length === 0) return <p>No reviews yet.</p>;

    const avgSubRatings = useMemo(() => {
        const totals = { cleanliness: 0, accuracy: 0, checkIn: 0, communication: 0, location: 0, value: 0, count: 0 };
        reviews.forEach(r => {
            if (r.subRatings) {
                totals.count++;
                (Object.keys(r.subRatings) as Array<keyof typeof r.subRatings>).forEach(key => {
                    totals[key] += r.subRatings![key];
                });
            }
        });
        if (totals.count === 0) return null;
        // FIX: Provide explicit types for accumulator and key to resolve TS error.
        return (Object.keys(totals) as Array<keyof typeof totals>).reduce((acc: Record<string, string>, key) => {
            if (key !== 'count') {
                const typedKey = key as keyof Omit<typeof totals, 'count'>;
                acc[typedKey] = (totals[typedKey] / totals.count).toFixed(1);
            }
            return acc;
        }, {});
    }, [reviews]);
    
    const lovedAttributes = ["Cleanliness", "Great Host", "Smooth Check-in", "Good Value", "Amazing Location", "Great Communication"];

    return (
        <div>
            <div className="flex items-center mb-6">
                <StarIcon className="w-6 h-6 text-yellow-400 mr-2" />
                <h2 className="text-2xl font-bold">{propertyRating.toFixed(1)} · {reviews.length} reviews</h2>
                 <div className="ml-4 bg-yellow-900/50 text-yellow-300 font-bold px-3 py-1 rounded-full text-sm">Guest Favourite</div>
            </div>
            <AIReviewSummary reviews={reviews} />
             <div className="relative w-full overflow-hidden my-6">
                <div className="flex animate-marquee">
                    {[...lovedAttributes, ...lovedAttributes].map((attr, i) => (
                        <div key={i} className="bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm mx-2 flex-shrink-0">{attr}</div>
                    ))}
                </div>
            </div>
            {avgSubRatings && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                    {Object.entries(avgSubRatings).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center space-x-2">
                                {/* FIX: Convert value to number for calculation */}
                                <div className="w-32 h-1 bg-gray-700 rounded-full"><div className="h-1 bg-gray-200 rounded-full" style={{width: `${(parseFloat(value) / 5) * 100}%`}}></div></div>
                                <span className="text-sm font-semibold w-8 text-right">{value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {reviews.slice(0, 4).map(review => (
                    <div key={review.id}>
                        <div className="flex items-center mb-2">
                            <img src={users[review.guestId]?.avatarUrl} alt={users[review.guestId]?.name} className="w-10 h-10 rounded-full mr-4" />
                            <div>
                                <p className="font-semibold text-gray-200">{users[review.guestId]?.name}</p>
                                <p className="text-sm text-gray-400">{new Date(review.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <p className="text-gray-300 line-clamp-3">{review.comment}</p>
                        {review.hostResponse && (
                             <div className="mt-3 p-3 bg-gray-800 border-l-2 border-gray-600">
                                <p className="font-semibold text-sm text-gray-300">Response from host</p>
                                <p className="text-gray-400 text-sm line-clamp-2">{review.hostResponse}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
             {reviews.length > 4 && (
                <button onClick={onShowAll} className="mt-8 font-semibold border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-800 transition">
                    Show all {reviews.length} reviews
                </button>
            )}
        </div>
    );
};

const ExploreNearbySection: React.FC<{ location: Property['location'] }> = ({ location }) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (location.lat && location.lng) {
            setIsLoading(true);
            getNearbyAttractions(location)
                .then(setContent)
                .finally(() => setIsLoading(false));
        } else {
            setContent('');
            setIsLoading(false);
        }
    }, [location]);

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <span>✨</span>
                <span>Explore the Area</span>
            </h3>
            <div className="p-6 rounded-lg bg-gray-800/50 border border-gray-700">
                {isLoading ? (
                    <div className="space-y-2">
                         <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                         <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-sm text-gray-300" dangerouslySetInnerHTML={{ __html: content }} />
                )}
            </div>
        </div>
    );
};

const AvailabilityCalendar: React.FC<{ propertyId: string }> = ({ propertyId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());

    useEffect(() => {
        dataService.getBookingsByPropertyId(propertyId).then(bookings => {
            const dates = new Set<string>();
            bookings.forEach(booking => {
                for (let d = new Date(booking.startDate); d < new Date(booking.endDate); d.setDate(d.getDate() + 1)) {
                    dates.add(dateToYyyyMmDd(d));
                }
            });
            setBookedDates(dates);
        });
    }, [propertyId]);

    const calendar = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) { days.push({ key: `empty-${i}`, empty: true }); }
        for (let i = 1; i <= daysInMonth; i++) { days.push({ key: `${year}-${month}-${i}`, day: i, date: new Date(year, month, i) }); }
        return days;
    }, [currentDate]);

    const changeMonth = (offset: number) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    const today = new Date(new Date().toDateString());

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Availability</h3>
            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="font-bold p-2 rounded-full hover:bg-gray-700">&lt;</button>
                    <h4 className="text-lg font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                    <button onClick={() => changeMonth(1)} className="font-bold p-2 rounded-full hover:bg-gray-700">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <div key={i}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {calendar.map(dayInfo => {
                        if (dayInfo.empty) return <div key={dayInfo.key}></div>;
                        const dateString = dateToYyyyMmDd(dayInfo.date!);
                        const isBooked = bookedDates.has(dateString);
                        const isPast = dayInfo.date! < today;
                        
                        let cellClass = `text-center p-2 rounded-full w-9 h-9 mx-auto flex items-center justify-center font-semibold `;
                        if(isPast) cellClass += 'text-gray-600 line-through';
                        else if(isBooked) cellClass += 'text-gray-500 line-through';
                        else cellClass += 'text-gray-200 bg-gray-700/50';

                        return <div key={dayInfo.key} className={cellClass}>{dayInfo.day}</div>;
                    })}
                </div>
            </div>
        </div>
    );
};

const MapSection: React.FC<{location: Property['location']}> = ({ location }) => (
    <div id="map">
        <h3 className="text-xl font-semibold mb-4">Where you'll be</h3>
        <p className="mb-4 text-gray-300">{location.city}, {location.state}, {location.country}</p>
        <div className="h-96 bg-gray-800 rounded-xl overflow-hidden">
            <iframe
                width="100%" height="100%" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                loading="lazy" allowFullScreen
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01}%2C${location.lat - 0.01}%2C${location.lng + 0.01}%2C${location.lat + 0.01}&layer=mapnik&marker=${location.lat}%2C${location.lng}`}
            ></iframe>
        </div>
    </div>
);

const HostSection: React.FC<{host: User, property: Property, navigate: NavigateFunction, currentUser: User | null}> = ({ host, property, navigate, currentUser }) => {
    
    const handleMessageHost = async () => {
        if (!currentUser) {
            alert("Please log in to message the host.");
            return;
        }
        if (currentUser.id === host.id) {
            alert("You cannot message yourself.");
            return;
        }
        try {
            const conversation = await dataService.getOrCreateConversation(currentUser.id, property.id);
            navigate(Page.INBOX, { conversationId: conversation.id });
        } catch (error) {
            console.error("Error creating conversation:", error);
            alert("Could not start a conversation at this time.");
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <img src={host.avatarUrl} alt={host.name} className="w-24 h-24 rounded-full cursor-pointer" onClick={() => navigate(Page.HOST_PROFILE, { hostId: host.id })} />
                <div>
                    <h3 className="text-2xl font-bold">Hosted by {host.name}</h3>
                    <p className="text-sm text-gray-400">Joined in {host.joinDate}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                 <div className="flex items-center space-x-2">
                    <StarIcon /><span>{property.reviewCount} Reviews</span>
                 </div>
                 <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.27 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    <span>Response rate: {host.responseRate}%</span>
                 </div>
                 {host.isSuperhost && (
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <span>Superhost</span>
                    </div>
                 )}
                 <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    <span>Response time: {host.responseTime}</span>
                 </div>
            </div>
            <p className="mt-4 text-gray-300 line-clamp-3">{host.about}</p>
            <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button onClick={handleMessageHost} disabled={currentUser?.id === host.id} className="font-semibold border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    Message host
                </button>
                <button onClick={() => navigate(Page.HOST_PROFILE, { hostId: host.id })} className="font-semibold border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-800 transition">
                    Visit host profile
                </button>
            </div>
        </div>
    );
};

const ThingsToKnow: React.FC<{property: Property}> = ({ property }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4">Things to know</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
                <h4 className="font-semibold mb-2">House rules</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                    {property.houseRules?.map(rule => <li key={rule}>- {rule}</li>)}
                </ul>
            </div>
             <div>
                <h4 className="font-semibold mb-2">Health & safety</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                     {property.healthAndSafety?.map(item => <li key={item}>- {item}</li>)}
                </ul>
            </div>
             <div>
                <h4 className="font-semibold mb-2">Cancellation policy</h4>
                <p className="text-sm text-gray-300">{property.cancellationPolicy}</p>
            </div>
        </div>
    </div>
);

const BookingForm: React.FC<{
    property: Property;
    bookings: Booking[];
    offerPrice?: number;
    onReserve: (details: Omit<Booking, 'id' | 'status' | 'guestId' | 'propertyId'>) => void;
    isMobile?: boolean;
}> = ({ property, bookings, offerPrice, onReserve, isMobile = false }) => {
    const { user } = useAuth();
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const isHostOwner = user?.id === property.hostId;
    const pricePerNight = offerPrice || property.pricePerNight;
    
    useEffect(() => {
        if (checkIn && checkOut && checkOut <= checkIn) {
            setCheckOut('');
        }
    }, [checkIn, checkOut]);

    const { nights, basePrice, serviceFee, taxes, totalPrice } = useMemo(() => {
        if (!checkIn || !checkOut) return { nights: 0, basePrice: 0, serviceFee: 0, taxes: 0, totalPrice: 0 };
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (start >= end) return { nights: 0, basePrice: 0, serviceFee: 0, taxes: 0, totalPrice: 0 };
        
        // FIX: Use getTime() for correct date difference calculation
        const totalNights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (totalNights <= 0) return { nights: 0, basePrice: 0, serviceFee: 0, taxes: 0, totalPrice: 0 };

        const priceMap = new Map(property.priceOverrides?.map(o => [o.date, o.price]));

        let currentPrice = 0;
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dateString = dateToYyyyMmDd(d);
            currentPrice += offerPrice || priceMap.get(dateString) || property.pricePerNight;
        }
        
        const fee = currentPrice * 0.1;
        const tax = currentPrice * 0.05;
        const total = currentPrice + fee + tax;

        return { nights: totalNights, basePrice: currentPrice, serviceFee: fee, taxes: tax, totalPrice: total };
    }, [checkIn, checkOut, property.pricePerNight, property.priceOverrides, offerPrice]);

    const handleBooking = () => {
        setBookingError(null);
        if (!user) {
            alert("Please log in to book.");
            return;
        }
        if (nights <= 0) {
            setBookingError("Please select valid check-in and check-out dates.");
            return;
        }

        // Conflict validation
        const newBookingStart = new Date(checkIn);
        const newBookingEnd = new Date(checkOut);
        for (const existingBooking of bookings) {
            const existingStart = new Date(existingBooking.startDate);
            const existingEnd = new Date(existingBooking.endDate);
            if (newBookingStart < existingEnd && newBookingEnd > existingStart) {
                setBookingError("Selected dates are not available. Please choose different dates.");
                return;
            }
        }

        setIsBooking(true);
        onReserve({
            startDate: new Date(checkIn),
            endDate: new Date(checkOut),
            totalPrice: totalPrice,
            guests: guests,
        });
    };

    const minCheckoutDate = useMemo(() => {
        if (!checkIn) return undefined;
        const date = new Date(checkIn);
        date.setDate(date.getDate() + 2); // JS date objects are tricky with timezones, adding 2 then slicing gets the next day reliably
        return date.toISOString().split('T')[0];
    }, [checkIn]);

    return (
        <div className={isMobile ? "" : "p-6 border border-gray-700 rounded-xl bg-gray-800/50 backdrop-blur-sm shadow-2xl shadow-black/20"}>
            <div className="flex justify-between items-baseline mb-4">
                 <p className="text-2xl">
                    <span className="font-bold">₹{pricePerNight.toLocaleString('en-IN')}</span>
                    <span className="text-gray-400 font-normal text-base"> night</span>
                </p>
                {!isMobile && (
                    <div className="flex items-center space-x-1 text-sm">
                        <StarIcon />
                        <span className="font-semibold">{property.rating.toFixed(1)}</span>
                        <span className="text-gray-400">· {property.reviewCount} reviews</span>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-px border border-gray-600 rounded-lg mb-4">
                <div className="p-2">
                    <label className="block text-xs font-bold text-gray-400">CHECK-IN</label>
                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={dateToYyyyMmDd(new Date())} className="w-full border-none p-0 focus:ring-0 text-sm bg-transparent" style={{colorScheme: 'dark'}} />
                </div>
                <div className="border-l border-gray-600 p-2">
                    <label className="block text-xs font-bold text-gray-400">CHECK-OUT</label>
                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={minCheckoutDate} disabled={!checkIn} className="w-full border-none p-0 focus:ring-0 text-sm bg-transparent" style={{colorScheme: 'dark'}} />
                </div>
            </div>
             <div className="border border-gray-600 rounded-lg p-2 mb-4">
                <label className="block text-xs font-bold text-gray-400">GUESTS</label>
                <input type="number" value={guests} onChange={e => setGuests(Number(e.target.value))} min="1" max={property.maxGuests} className="w-full border-none p-0 focus:ring-0 text-sm bg-transparent" />
            </div>
            <button onClick={handleBooking} disabled={isHostOwner || isBooking || nights === 0} className="w-full bg-brand text-gray-900 py-3 rounded-lg font-bold text-lg hover:bg-brand-dark transition disabled:bg-gray-600 disabled:cursor-not-allowed">
                {isHostOwner ? "You are the host" : isBooking ? "Reserving..." : "Reserve"}
            </button>
            {bookingError && <p className="text-red-400 text-xs text-center mt-2">{bookingError}</p>}
            {nights > 0 && (
                 <div className="mt-4 space-y-2 text-gray-300 text-sm">
                    <p className="text-center text-gray-400 mb-2">You won't be charged yet</p>
                    <div className="flex justify-between">
                        <span className="underline">Base price for {nights} nights</span>
                        <span>₹{basePrice.toLocaleString('en-IN')}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="underline">Service fee</span>
                        <span>₹{serviceFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="underline">Taxes</span>
                        <span>₹{taxes.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-bold text-gray-50 text-base">
                        <span>Total</span>
                        <span>₹{totalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            )}
        </div>
    )
};


const StickyBookingWidget: React.FC<{property: Property; bookings: Booking[]; offerPrice?: number; onReserve: (details: Omit<Booking, 'id' | 'status' | 'guestId' | 'propertyId'>) => void;}> = ({ property, bookings, offerPrice, onReserve }) => (
    <div className="hidden lg:block sticky top-28">
        <BookingForm property={property} bookings={bookings} offerPrice={offerPrice} onReserve={onReserve} />
    </div>
);


const MobileBookingFooter: React.FC<{property: Property, onReserveClick: () => void}> = ({ property, onReserveClick }) => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-850 p-4 border-t border-gray-700 flex justify-between items-center z-40">
        <div>
            <p className="font-bold text-lg">₹{property.pricePerNight.toLocaleString('en-IN')} <span className="font-normal text-base text-gray-400">night</span></p>
        </div>
        <button onClick={onReserveClick} className="bg-brand text-gray-900 font-bold px-6 py-3 rounded-lg">
            Reserve
        </button>
    </div>
);

const MobileBookingModal: React.FC<{
    property: Property;
    bookings: Booking[];
    offerPrice?: number;
    onClose: () => void;
    onReserve: (details: Omit<Booking, 'id' | 'status' | 'guestId' | 'propertyId'>) => void;
}> = ({ property, bookings, offerPrice, onClose, onReserve }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-t-2xl p-6" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 left-4 text-gray-400">&times; Close</button>
                <BookingForm property={property} bookings={bookings} offerPrice={offerPrice} onReserve={onReserve} isMobile={true} />
            </div>
        </div>
    )
};

const GalleryModal: React.FC<{images: string[], onClose: () => void}> = ({ images, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-4 animate-fade-in" onClick={onClose}>
             <header className="flex justify-end">
                <button onClick={onClose} className="text-white text-3xl">&times;</button>
            </header>
            <div className="flex-grow overflow-y-auto mt-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                    {images.map((img, i) => <img key={i} src={img} alt={`Gallery view ${i+1}`} className="w-full h-auto object-contain rounded-lg" />)}
                </div>
            </div>
        </div>
    );
};

const AmenitiesModal: React.FC<{amenities: string[], onClose: () => void}> = ({ amenities, onClose }) => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col shadow-xl border border-gray-700" onClick={e => e.stopPropagation()}>
            <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold">What this place offers</h3>
                <button onClick={onClose} className="text-3xl">&times;</button>
            </header>
            <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                    {amenities.map(amenity => (
                        <div key={amenity} className="flex items-center space-x-3">
                            <AmenityIcon name={amenity} />
                            <span>{amenity}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const ReviewsModal: React.FC<{ reviews: Review[], users: Record<string, User>, onClose: () => void }> = ({ reviews, users, onClose }) => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg w-full max-w-3xl h-[80vh] flex flex-col shadow-xl border border-gray-700" onClick={e => e.stopPropagation()}>
            <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold">{reviews.length} Reviews</h3>
                <button onClick={onClose} className="text-3xl">&times;</button>
            </header>
            <div className="p-6 overflow-y-auto space-y-6">
                {reviews.map(review => (
                    <div key={review.id}>
                        <div className="flex items-center mb-2">
                            <img src={users[review.guestId]?.avatarUrl} alt={users[review.guestId]?.name} className="w-10 h-10 rounded-full mr-4" />
                            <div>
                                <p className="font-semibold text-gray-200">{users[review.guestId]?.name}</p>
                                <p className="text-sm text-gray-400">{new Date(review.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <p className="text-gray-300">{review.comment}</p>
                        {review.hostResponse && (
                             <div className="mt-3 p-3 bg-gray-700/50 border-l-2 border-gray-600">
                                <p className="font-semibold text-sm text-gray-300">Response from host</p>
                                <p className="text-gray-400 text-sm">{review.hostResponse}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
);


export default PropertyDetailsPage;