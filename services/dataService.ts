import { Property, User, Booking, Review, SearchFilters, PriceOverride, Conversation, Message } from '../types';

const users: User[] = [
    { id: 'user1', name: 'Rohan Sharma', email: 'rohan@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=user1', isHost: true, wishlist: ['prop4'] },
    { id: 'user2', name: 'Priya Patel', email: 'priya@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=user2', isHost: false, wishlist: [] },
    { id: 'user3', name: 'Amit Singh', email: 'amit@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=user3', isHost: true, wishlist: ['prop1', 'prop7'] },
    { id: 'user4', name: 'Sunita Rao', email: 'sunita@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=user4', isHost: false, wishlist: [] },
];

let properties: Property[] = [
    // Lonavala
    { id: 'prop1', title: 'Serene Villa with Private Pool', description: '', location: { city: 'Lonavala', state: 'Maharashtra', country: 'India', lat: 18.75, lng: 73.41 }, pricePerNight: 12000, hostId: 'user1', images: ['https://picsum.photos/seed/prop1/800/600', 'https://picsum.photos/seed/prop1a/800/600', 'https://picsum.photos/seed/prop1b/800/600', 'https://picsum.photos/seed/prop1c/800/600', 'https://picsum.photos/seed/prop1d/800/600'], amenities: ['Pool', 'Wifi', 'Air Conditioning', 'Kitchen', 'Parking'], bedrooms: 4, bathrooms: 4, maxGuests: 10, rating: 4.8, reviewCount: 45, type: 'Villa',
      priceOverrides: [
        { date: '2024-12-24', price: 18000 },
        { date: '2024-12-25', price: 20000 },
        { date: '2024-12-31', price: 25000 },
      ]
    },
    { id: 'prop2', title: 'Cozy Mountain View Cottage', description: 'A charming cottage nestled in the hills of Lonavala, offering breathtaking views and a tranquil escape. Perfect for couples and small families looking for a peaceful getaway.', location: { city: 'Lonavala', state: 'Maharashtra', country: 'India', lat: 18.76, lng: 73.40 }, pricePerNight: 6500, hostId: 'user3', images: ['https://picsum.photos/seed/prop2/800/600', 'https://picsum.photos/seed/prop2a/800/600'], amenities: ['Wifi', 'Kitchen', 'Heating', 'Garden'], bedrooms: 2, bathrooms: 2, maxGuests: 4, rating: 4.9, reviewCount: 62, type: 'Cottage' },
    // Goa
    { id: 'prop3', title: 'Luxury Beachfront Apartment', description: 'Stunning apartment with direct access to Candolim beach. Enjoy modern amenities and spectacular ocean views from your private balcony.', location: { city: 'Goa', state: 'Goa', country: 'India', lat: 15.51, lng: 73.76 }, pricePerNight: 9500, hostId: 'user1', images: ['https://picsum.photos/seed/prop3/800/600', 'https://picsum.photos/seed/prop3a/800/600', 'https://picsum.photos/seed/prop3b/800/600'], amenities: ['Wifi', 'Air Conditioning', 'Kitchen', 'Beach Access'], bedrooms: 2, bathrooms: 2, maxGuests: 4, rating: 4.7, reviewCount: 88, type: 'Apartment' },
    { id: 'prop4', title: 'Traditional Goan-Portuguese House', description: 'Experience authentic Goan hospitality in this beautifully restored Portuguese-style house. Features a lush garden and is a short drive from popular beaches.', location: { city: 'Goa', state: 'Goa', country: 'India', lat: 15.49, lng: 73.82 }, pricePerNight: 15000, hostId: 'user3', images: ['https://picsum.photos/seed/prop4/800/600', 'https://picsum.photos/seed/prop4a/800/600'], amenities: ['Garden', 'Wifi', 'Kitchen', 'Parking'], bedrooms: 5, bathrooms: 5, maxGuests: 12, rating: 4.9, reviewCount: 51, type: 'House' },
    // Mumbai
    { id: 'prop5', title: 'Chic Urban Loft in Bandra', description: 'A stylish and modern loft in the heart of Bandra West. Close to trendy cafes, boutiques, and the Carter Road promenade.', location: { city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.05, lng: 72.84 }, pricePerNight: 8000, hostId: 'user1', images: ['https://picsum.photos/seed/prop5/800/600', 'https://picsum.photos/seed/prop5a/800/600'], amenities: ['Wifi', 'Air Conditioning', 'Kitchen', 'Elevator'], bedrooms: 1, bathrooms: 1, maxGuests: 2, rating: 4.6, reviewCount: 112, type: 'Apartment' },
     // Pune
    { id: 'prop6', title: 'Spacious Koregaon Park Flat', description: 'A large, airy apartment in the upscale Koregaon Park neighborhood, known for its greenery and vibrant nightlife. Perfect for families or groups.', location: { city: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.53, lng: 73.88 }, pricePerNight: 7200, hostId: 'user3', images: ['https://picsum.photos/seed/prop6/800/600', 'https://picsum.photos/seed/prop6a/800/600'], amenities: ['Wifi', 'Air Conditioning', 'Kitchen', 'Parking', 'Elevator'], bedrooms: 3, bathrooms: 3, maxGuests: 6, rating: 4.7, reviewCount: 75, type: 'Apartment' },
    // Bangalore
    { id: 'prop7', title: 'Tech Hub Penthouse, Indiranagar', description: 'Luxurious penthouse with a rooftop terrace in the bustling Indiranagar area. Ideal for business travelers and those looking to explore Bangalore\'s famous food scene.', location: { city: 'Bangalore', state: 'Karnataka', country: 'India', lat: 12.97, lng: 77.64 }, pricePerNight: 11000, hostId: 'user1', images: ['https://picsum.photos/seed/prop7/800/600', 'https://picsum.photos/seed/prop7a/800/600'], amenities: ['Wifi', 'Air Conditioning', 'Kitchen', 'Terrace', 'Workspace'], bedrooms: 2, bathrooms: 3, maxGuests: 4, rating: 4.8, reviewCount: 95, type: 'Apartment' },
    // Delhi
    { id: 'prop8', title: 'Heritage Haveli in Hauz Khas', description: 'Stay in a piece of history. This beautifully restored Haveli overlooks the Hauz Khas lake and fort ruins, offering a unique blend of tradition and modern comfort.', location: { city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.55, lng: 77.19 }, pricePerNight: 13500, hostId: 'user3', images: ['https://picsum.photos/seed/prop8/800/600', 'https://picsum.photos/seed/prop8a/800/600'], amenities: ['Wifi', 'Air Conditioning', 'Courtyard', 'Kitchen'], bedrooms: 3, bathrooms: 3, maxGuests: 6, rating: 4.9, reviewCount: 68, type: 'House' },
];

let bookings: Booking[] = [
    { id: 'book1', propertyId: 'prop1', guestId: 'user2', startDate: new Date('2024-12-22'), endDate: new Date('2024-12-26'), totalPrice: 60000, guests: 8, status: 'upcoming' },
    { id: 'book2', propertyId: 'prop3', guestId: 'user4', startDate: new Date('2024-06-20'), endDate: new Date('2024-06-25'), totalPrice: 47500, guests: 4, status: 'completed' },
    { id: 'book3', propertyId: 'prop5', guestId: 'user2', startDate: new Date('2024-09-01'), endDate: new Date('2024-09-05'), totalPrice: 32000, guests: 2, status: 'upcoming' },
];

const reviews: Review[] = [
    { id: 'rev1', propertyId: 'prop1', guestId: 'user2', rating: 5, comment: 'Absolutely stunning villa! The pool was fantastic and the host was very helpful. We had a great family vacation.', date: new Date('2024-05-16') },
    { id: 'rev2', propertyId: 'prop1', guestId: 'user4', rating: 4, comment: 'Great location and beautiful property. The wifi was a bit slow, but everything else was perfect.', date: new Date('2024-04-20') },
    { id: 'rev3', propertyId: 'prop3', guestId: 'user4', rating: 5, comment: 'The view from the apartment is unbeatable. Waking up to the sound of waves was magical. Highly recommend!', date: new Date('2024-06-26') },
    { id: 'rev4', propertyId: 'prop4', guestId: 'user2', rating: 5, comment: 'Felt like royalty in this Goan house. It\'s spacious, clean, and has such a unique character.', date: new Date('2024-03-10') },
];

let conversations: Conversation[] = [
    {
        id: 'book1',
        propertyId: 'prop1',
        participantIds: ['user1', 'user2'],
        messages: [
            { id: 'msg1', senderId: 'user2', text: 'Hi Rohan, looking forward to our stay! Can we check in a bit earlier, around 1 PM?', timestamp: new Date(new Date('2024-12-20').setHours(10, 30)) },
            { id: 'msg2', senderId: 'user1', text: 'Hi Priya, glad to have you! 1 PM should be fine. We\'ll have the villa ready for you.', timestamp: new Date(new Date('2024-12-20').setHours(11, 15)) },
        ],
    },
    {
        id: 'book3',
        propertyId: 'prop5',
        participantIds: ['user1', 'user2'],
        messages: [
             { id: 'msg3', senderId: 'user2', text: 'Hey, just confirming our booking for next week!', timestamp: new Date(new Date('2024-08-25').setHours(18, 0)) },
        ],
    }
];

export const dataService = {
    getProperties: (filters: SearchFilters = {}): Promise<Property[]> => {
        return new Promise(resolve => {
            let filteredProperties = [...properties];
            
            if (filters.location) {
                filteredProperties = filteredProperties.filter(p => 
                    p.location.city.toLowerCase().includes(filters.location!.toLowerCase()) ||
                    p.location.state.toLowerCase().includes(filters.location!.toLowerCase())
                );
            }
            if (filters.guests) {
                filteredProperties = filteredProperties.filter(p => p.maxGuests >= filters.guests!);
            }
            if (filters.priceMin) {
                filteredProperties = filteredProperties.filter(p => p.pricePerNight >= filters.priceMin!);
            }
            if (filters.priceMax) {
                filteredProperties = filteredProperties.filter(p => p.pricePerNight <= filters.priceMax!);
            }
            if(filters.bedrooms) {
                filteredProperties = filteredProperties.filter(p => p.bedrooms >= filters.bedrooms!);
            }
            if(filters.amenities && filters.amenities.length > 0) {
                 filteredProperties = filteredProperties.filter(p => 
                    filters.amenities!.every(amenity => p.amenities.map(a => a.toLowerCase()).includes(amenity.toLowerCase()))
                );
            }
             if(filters.propertyTypes && filters.propertyTypes.length > 0) {
                filteredProperties = filteredProperties.filter(p => 
                   filters.propertyTypes!.includes(p.type)
               );
           }
            
            setTimeout(() => resolve(filteredProperties), 300); // Simulate network delay
        });
    },
    getPropertyById: (id: string): Promise<Property | undefined> => {
         return new Promise(resolve => {
            setTimeout(() => resolve(properties.find(p => p.id === id)), 200);
        });
    },
    getUserById: (id: string): Promise<User | undefined> => {
        return new Promise(resolve => {
            setTimeout(() => resolve(users.find(u => u.id === id)), 100);
        });
    },
    getReviewsByPropertyId: (propertyId: string): Promise<Review[]> => {
        return new Promise(resolve => {
            setTimeout(() => resolve(reviews.filter(r => r.propertyId === propertyId).sort((a,b) => b.date.getTime() - a.date.getTime())), 200);
        });
    },
    getBookingsByUserId: (userId: string): Promise<Booking[]> => {
        return new Promise(resolve => {
            const userBookings = bookings.filter(b => b.guestId === userId || properties.find(p => p.id === b.propertyId)?.hostId === userId);
            setTimeout(() => resolve(userBookings), 200);
        });
    },
    getBookingsByPropertyId: (propertyId: string): Promise<Booking[]> => {
        return new Promise(resolve => {
            setTimeout(() => resolve(bookings.filter(b => b.propertyId === propertyId)), 200);
        });
    },
    getBookingById: (bookingId: string): Promise<Booking | undefined> => {
        return new Promise(resolve => {
            setTimeout(() => resolve(bookings.find(b => b.id === bookingId)), 100);
        });
    },
    createBooking: (bookingData: Omit<Booking, 'id' | 'status'>): Promise<Booking> => {
        return new Promise(resolve => {
            const newBooking: Booking = {
                ...bookingData,
                id: `book${Date.now()}`,
                status: 'upcoming'
            };
            bookings.push(newBooking);
            setTimeout(() => resolve(newBooking), 500);
        });
    },
    createProperty: (propertyData: Omit<Property, 'id' | 'rating' | 'reviewCount'>): Promise<Property> => {
        return new Promise(resolve => {
            const newProperty: Property = {
                ...propertyData,
                id: `prop${Date.now()}`,
                rating: 0,
                reviewCount: 0,
            };
            properties.unshift(newProperty);
            setTimeout(() => resolve(newProperty), 500);
        });
    },
    updateProperty: (propertyId: string, updatedData: Partial<Property>): Promise<Property | undefined> => {
        return new Promise((resolve) => {
            const propertyIndex = properties.findIndex(p => p.id === propertyId);
            if (propertyIndex !== -1) {
                properties[propertyIndex] = { ...properties[propertyIndex], ...updatedData };
                setTimeout(() => resolve(properties[propertyIndex]), 300);
            } else {
                setTimeout(() => resolve(undefined), 300);
            }
        });
    },
    getUsers: (): Promise<User[]> => {
        return new Promise(resolve => {
            setTimeout(() => resolve(users), 100);
        });
    },
    getConversationsByUserId: (userId: string): Promise<Conversation[]> => {
        return new Promise(resolve => {
            const userConversations = conversations.filter(c => c.participantIds.includes(userId));
            // Sort by most recent message
            userConversations.sort((a, b) => {
                const lastMsgA = a.messages[a.messages.length - 1]?.timestamp || 0;
                const lastMsgB = b.messages[b.messages.length - 1]?.timestamp || 0;
                return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
            });
            setTimeout(() => resolve(userConversations), 200);
        });
    },
    getConversationByBookingId: (bookingId: string): Promise<Conversation | undefined> => {
        return new Promise(resolve => {
            setTimeout(() => resolve(conversations.find(c => c.id === bookingId)), 100);
        });
    },
    sendMessage: (bookingId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Conversation> => {
        return new Promise((resolve, reject) => {
            let conversation = conversations.find(c => c.id === bookingId);
            const booking = bookings.find(b => b.id === bookingId);
            const property = properties.find(p => p.id === booking?.propertyId);

            if (!booking || !property) {
                 return reject(new Error("Booking or property not found"));
            }

            if (!conversation) {
                // Create a new conversation if it doesn't exist
                conversation = {
                    id: bookingId,
                    propertyId: booking.propertyId,
                    participantIds: [booking.guestId, property.hostId],
                    messages: [],
                };
                conversations.push(conversation);
            }
            
            const newMessage: Message = {
                ...message,
                id: `msg${Date.now()}`,
                timestamp: new Date(),
            };
            conversation.messages.push(newMessage);

            setTimeout(() => resolve(conversation!), 300);
        });
    },
    getHostDashboardData: (hostId: string): Promise<{
        properties: Property[],
        bookings: Booking[],
        reviews: Review[],
        conversations: Conversation[],
    }> => {
        return new Promise(resolve => {
            const hostProperties = properties.filter(p => p.hostId === hostId);
            const hostPropertyIds = hostProperties.map(p => p.id);
            
            const hostBookings = bookings.filter(b => hostPropertyIds.includes(b.propertyId));
            const hostReviews = reviews.filter(r => hostPropertyIds.includes(r.propertyId));
            const hostConversations = conversations.filter(c => hostPropertyIds.includes(c.propertyId));

            setTimeout(() => resolve({
                properties: hostProperties,
                bookings: hostBookings,
                reviews: hostReviews,
                conversations: hostConversations,
            }), 400);
        });
    },
};