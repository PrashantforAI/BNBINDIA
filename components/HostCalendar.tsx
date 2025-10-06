import React, { useState, useMemo, useEffect } from 'react';
import { Property, Booking, PriceOverride } from '../types';

interface HostCalendarProps {
    property: Property;
    bookings: Booking[];
    onPriceChange: (overrides: PriceOverride[]) => void;
}

const dateToYyyyMmDd = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

const HostCalendar: React.FC<HostCalendarProps> = ({ property, bookings, onPriceChange }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [customPrice, setCustomPrice] = useState<string>('');
    const [priceOverrides, setPriceOverrides] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        const overridesMap = new Map(property.priceOverrides?.map(o => [o.date, o.price]));
        setPriceOverrides(overridesMap);
    }, [property.priceOverrides]);

    const bookingsSet = useMemo(() => {
        const bookedDates = new Set<string>();
        bookings.forEach(booking => {
            for (let d = new Date(booking.startDate); d <= booking.endDate; d.setDate(d.getDate() + 1)) {
                bookedDates.add(dateToYyyyMmDd(d));
            }
        });
        return bookedDates;
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
    
    const handleDateClick = (dateString: string) => {
        if (bookingsSet.has(dateString)) return; // Don't allow selecting booked dates
        setSelectedDates(prev => {
            if (prev.includes(dateString)) {
                return prev.filter(d => d !== dateString);
            } else {
                return [...prev, dateString];
            }
        });
    };

    const handleApplyPrice = () => {
        const price = parseInt(customPrice, 10);
        if (isNaN(price) || price < 0) {
            alert("Please enter a valid price.");
            return;
        }
        const newOverrides = new Map(priceOverrides);
        selectedDates.forEach(date => {
            newOverrides.set(date, price);
        });
        setPriceOverrides(newOverrides);
        onPriceChange(Array.from(newOverrides.entries()).map(([date, price]) => ({ date, price })));
        setSelectedDates([]);
        setCustomPrice('');
    };

    const handleClearOverrides = () => {
        const newOverrides = new Map(priceOverrides);
        selectedDates.forEach(date => {
           newOverrides.delete(date);
        });
        setPriceOverrides(newOverrides);
        onPriceChange(Array.from(newOverrides.entries()).map(([date, price]) => ({ date, price })));
        setSelectedDates([]);
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="font-bold p-2 rounded-full hover:bg-gray-700">&lt;</button>
                <h3 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="font-bold p-2 rounded-full hover:bg-gray-700">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendar.map(dayInfo => {
                    if (dayInfo.empty) return <div key={dayInfo.key}></div>;
                    
                    const dateString = dateToYyyyMmDd(dayInfo.date!);
                    const isBooked = bookingsSet.has(dateString);
                    const isSelected = selectedDates.includes(dateString);
                    const overridePrice = priceOverrides.get(dateString);
                    const isPast = dayInfo.date! < new Date(new Date().toDateString());

                    let cellClass = 'p-2 rounded-lg h-24 flex flex-col justify-between text-left';
                    if (isPast && !isBooked) cellClass += ' bg-gray-900 text-gray-600';
                    else if (isBooked) cellClass += ' bg-red-900/40 text-red-300 line-through';
                    else if (isSelected) cellClass += ' bg-brand text-gray-900 ring-2 ring-brand-dark';
                    else cellClass += ' bg-gray-800 hover:bg-gray-700 cursor-pointer border border-gray-700';

                    return (
                        <div key={dayInfo.key} className={cellClass} onClick={() => !isPast && handleDateClick(dateString)}>
                            <span className="font-bold">{dayInfo.day}</span>
                            <div className="text-xs">
                                {overridePrice !== undefined ? (
                                    <span className={`font-bold ${isSelected ? 'text-gray-900' : 'text-green-400'}`}>₹{overridePrice}</span>
                                ) : (
                                    <span className={isSelected ? 'text-gray-900/80' : 'text-gray-400'}>₹{property.pricePerNight}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {selectedDates.length > 0 && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                    <h4 className="font-semibold mb-2">Update price for {selectedDates.length} selected date(s)</h4>
                    <div className="flex items-center space-x-2">
                        <input 
                            type="number"
                            placeholder="e.g., 15000"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            className="p-2 border border-gray-600 rounded-md w-32 bg-gray-800"
                        />
                        <button onClick={handleApplyPrice} className="bg-brand text-gray-900 font-semibold px-4 py-2 rounded-md hover:bg-brand-dark">Apply</button>
                        <button onClick={handleClearOverrides} className="bg-gray-600 text-gray-50 font-semibold px-4 py-2 rounded-md hover:bg-gray-500">Reset to Default</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostCalendar;