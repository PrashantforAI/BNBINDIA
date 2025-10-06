export interface Property {
    id: string;
    title: string;
    description: string;
    location: {
        city: string;
        state: string;
        country: string;
        lat: number;
        lng: number;
    };
    pricePerNight: number;
    hostId: string;
    images: string[];
    amenities: string[];
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    rating: number;
    reviewCount: number;
    type: 'Villa' | 'Apartment' | 'House' | 'Cottage';
    status: 'listed' | 'unlisted';
    priceOverrides?: PriceOverride[];
}

export interface PriceOverride {
    date: string; // YYYY-MM-DD
    price: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    isHost: boolean;
    wishlist: string[];
}

export interface Booking {
    id:string;
    propertyId: string;
    guestId: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    guests: number;
    status: 'upcoming' | 'completed' | 'cancelled';
}

export interface Review {
    id: string;
    propertyId: string;
    guestId: string;
    rating: number;
    comment: string;
    date: Date;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
}

export interface Conversation {
    id: string; // bookingId
    propertyId: string;
    participantIds: string[];
    messages: Message[];
}


export enum Page {
    // Guest Pages
    HOME = 'HOME',
    SEARCH = 'SEARCH',
    PROPERTY = 'PROPERTY',
    DASHBOARD = 'DASHBOARD',
    CONFIRMATION = 'CONFIRMATION',
    INBOX = 'INBOX',

    // Host Pages
    HOST_TODAY = 'HOST_TODAY',
    HOST_LISTINGS = 'HOST_LISTINGS',
    HOST_CALENDAR = 'HOST_CALENDAR',
    HOST_RESERVATIONS = 'HOST_RESERVATIONS',
    HOST_INSIGHTS = 'HOST_INSIGHTS',
    HOST_EARNINGS = 'HOST_EARNINGS',
    CREATE_LISTING = 'CREATE_LISTING',
    MANAGE_LISTING = 'MANAGE_LISTING',
    EDIT_LISTING = 'EDIT_LISTING',
}

export const HOST_PAGES = [
    Page.HOST_TODAY, Page.HOST_LISTINGS, Page.HOST_CALENDAR, Page.HOST_RESERVATIONS,
    Page.HOST_INSIGHTS, Page.HOST_EARNINGS, Page.CREATE_LISTING, Page.MANAGE_LISTING,
    Page.EDIT_LISTING,
];

export interface View {
    page: Page;
    params: Record<string, any>;
}

export type NavigateFunction = (page: Page, params?: Record<string, any>) => void;

export interface SearchFilters {
    location?: string;
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    amenities?: string[];
    propertyTypes?: string[];
}