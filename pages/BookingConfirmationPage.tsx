import React, { useEffect, useState } from 'react';
import { NavigateFunction, Page, Booking, Property } from '../types';
import { dataService } from '../services/dataService';

interface BookingConfirmationPageProps {
    navigate: NavigateFunction;
    bookingId: string;
}

const BookingConfirmationPage: React.FC<BookingConfirmationPageProps> = ({ navigate, bookingId }) => {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            setLoading(true);
            const bookingData = await dataService.getBookingById(bookingId);
            if (bookingData) {
                setBooking(bookingData);
                const propertyData = await dataService.getPropertyById(bookingData.propertyId);
                setProperty(propertyData || null);
            }
            setLoading(false);
        };
        fetchBookingDetails();
    }, [bookingId]);

    if (loading) return <div className="text-center py-20">Confirming your booking...</div>;
    if (!booking || !property) return <div className="text-center py-20">Could not find booking details.</div>;

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
             <div className="mx-auto w-20 h-20 mb-6 bg-green-900/50 rounded-full flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                 </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-50 mb-4">Your booking is confirmed!</h1>
            <p className="text-lg text-gray-400 mb-8">You're all set for your trip to {property.location.city}. A confirmation has been sent to your email.</p>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 md:p-8 text-left">
                <div className="flex flex-col md:flex-row md:space-x-8">
                    <img src={property.images[0]} alt={property.title} className="w-full md:w-1/3 h-48 object-cover rounded-lg mb-4 md:mb-0" />
                    <div className="flex-grow">
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-50">{property.title}</h2>
                        <p className="text-gray-400 mb-4">{property.location.city}, {property.location.state}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                            <div>
                                <p className="font-bold text-gray-200">Check-in</p>
                                <p className="text-gray-300">{booking.startDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                             <div>
                                <p className="font-bold text-gray-200">Check-out</p>
                                <p className="text-gray-300">{booking.endDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                             <div>
                                <p className="font-bold text-gray-200">Guests</p>
                                <p className="text-gray-300">{booking.guests}</p>
                            </div>
                            <div>
                                <p className="font-bold text-gray-200">Total Price</p>
                                <p className="text-gray-300">₹{booking.totalPrice.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <button 
                    onClick={() => navigate(Page.DASHBOARD)} 
                    className="bg-brand text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-brand-dark transition"
                >
                    View My Trips
                </button>
            </div>
        </div>
    );
};

export default BookingConfirmationPage;