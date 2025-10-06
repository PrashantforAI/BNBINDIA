import React, { useState, useMemo, useEffect } from 'react';
import { NavigateFunction, Page, Property, Booking, PriceOverride } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';

const dateToYyyyMmDd = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

// FIX: Destructure props to make them available within the component scope.
const MasterCalendar: React.FC<{
    properties: Property[];
    bookings: Booking[];
}> = ({ properties, bookings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [customPrice, setCustomPrice] = useState<string>('');
    const [allProperties, setAllProperties] = useState<Property[]>(properties);

    const selectedProperty = useMemo(() => {
        return allProperties.find(p => p.id === selectedPropertyId);
    }, [selectedPropertyId, allProperties]);

    const bookingsByProperty = useMemo(() => {
        const map = new Map<string, Set<string>>();
        bookings.forEach(booking => {
            if (!map.has(booking.propertyId)) {
                map.set(booking.propertyId, new Set());
            }
            const bookedDates = map.get(booking.propertyId)!;
            for (let d = new Date(booking.startDate); d <= booking.endDate; d.setDate(d.getDate() + 1)) {
                bookedDates.add(dateToYyyyMmDd(d));
            }
        });
        return map;
    }, [bookings]);

    const calendar = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push({ key: `empty-${i}`, empty: true });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ key: `${year}-${month}-${i}`, day: i, date: new Date(year, month, i) });
        }
        return days;
    }, [currentDate]);

    const handleApplyPrice = async () => {
        if (!selectedProperty) return;
        const price = parseInt(customPrice, 10);
        if (isNaN(price) || price < 0) {
            alert("Please enter a valid price.");
            return;
        }

        const priceOverrides = new Map(selectedProperty.priceOverrides?.map(o => [o.date, o.price]));
        selectedDates.forEach(date => {
            priceOverrides.set(date, price);
        });

        // FIX: Explicitly cast `date` and `price` to their correct types to resolve the `unknown` type error from the Map iterator.
        const updatedOverrides = Array.from(priceOverrides.entries()).map(([date, price]) => ({ date: date as string, price: price as number }));
        const updatedProp = await dataService.updateProperty(selectedProperty.id, { priceOverrides: updatedOverrides });

        if (updatedProp) {
            setAllProperties(prevProps => prevProps.map(p => p.id === updatedProp.id ? updatedProp : p));
            setSelectedDates([]);
            setCustomPrice('');
        }
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const handleDateClick = (dateString: string) => {
        if (!selectedProperty) {
            alert("Please select a property to edit prices.");
            return;
        }
        const isBooked = bookingsByProperty.get(selectedProperty.id)?.has(dateString);
        if (isBooked) return;
        
        setSelectedDates(prev => {
            if (prev.includes(dateString)) {
                return prev.filter(d => d !== dateString);
            } else {
                return [...prev, dateString];
            }
        });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => changeMonth(-1)} className="font-bold p-2 rounded-full hover:bg-gray-700">&lt;</button>
                <h3 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="font-bold p-2 rounded-full hover:bg-gray-700">&gt;</button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2 py-2 border-b border-t border-gray-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendar.map(dayInfo => {
                    if (dayInfo.empty) return <div key={dayInfo.key}></div>;
                    
                    const dateString = dateToYyyyMmDd(dayInfo.date!);
                    const isSelected = selectedDates.includes(dateString);
                    const isPast = dayInfo.date! < new Date(new Date().toDateString());

                    return (
                        <div key={dayInfo.key} 
                             className={`p-2 h-28 flex flex-col rounded-md transition-colors ${isPast ? 'bg-gray-900' : 'cursor-pointer hover:bg-gray-700'} ${isSelected && selectedProperty ? 'bg-brand text-gray-900' : 'bg-gray-800'}`}
                             onClick={() => !isPast && handleDateClick(dateString)}>
                            <span className={`font-bold ${isPast ? 'text-gray-600' : ''}`}>{dayInfo.day}</span>
                            <div className="text-xs mt-1 space-y-0.5 overflow-y-auto">
                                {allProperties.map(p => {
                                    const isBooked = bookingsByProperty.get(p.id)?.has(dateString);
                                    if(isBooked) {
                                        return <div key={p.id} className="truncate bg-red-900/50 text-red-300 px-1 rounded-sm">{p.title.split(' ')[0]}</div>
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="font-semibold mb-2">Edit prices for a specific listing</h4>
                 <select
                    value={selectedPropertyId || ''}
                    onChange={(e) => {
                        setSelectedPropertyId(e.target.value);
                        setSelectedDates([]);
                    }}
                    className="w-full md:w-1/2 p-2 bg-gray-700 border border-gray-600 rounded-md mb-4"
                >
                    <option value="" disabled>Select a property...</option>
                    {allProperties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>

                {selectedProperty && selectedDates.length > 0 && (
                    <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                        <h4 className="font-semibold mb-2">Update price for {selectedDates.length} selected date(s) on "{selectedProperty.title}"</h4>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="number"
                                placeholder={`Default: ₹${selectedProperty.pricePerNight}`}
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                                className="p-2 border border-gray-600 rounded-md w-40 bg-gray-800"
                            />
                            <button onClick={handleApplyPrice} className="bg-brand text-gray-900 font-semibold px-4 py-2 rounded-md hover:bg-brand-dark">Apply</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const HostCalendarPage: React.FC<{ navigate: NavigateFunction }> = ({ navigate }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ properties: Property[], bookings: Booking[] } | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            const hostData = await dataService.getHostDashboardData(user.id);
            setData({ properties: hostData.properties, bookings: hostData.bookings });
            setLoading(false);
        };
        fetchData();
    }, [user]);

    if (loading) return <div>Loading calendar...</div>;
    if (!data) return null;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-50 mb-6">Calendar</h1>
            <MasterCalendar properties={data.properties} bookings={data.bookings} />
        </div>
    );
};

export default HostCalendarPage;