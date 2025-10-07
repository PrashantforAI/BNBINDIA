import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Property, Booking, PriceOverride, CalendarEvent, User } from '../types';
import { suggestPricingStrategy } from '../services/geminiService';
import { dataService } from '../services/dataService';

interface HostCalendarProps {
    property: Property;
    bookings: Booking[];
    guests: Record<string, User>;
    onPriceChange: (overrides: PriceOverride[]) => void;
    onEventsChange: (events: CalendarEvent[]) => void;
}

const dateToYyyyMmDd = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

const Toggle: React.FC<{ enabled: boolean, onChange: (enabled: boolean) => void, label: string }> = ({ enabled, onChange, label }) => (
    <label className="flex items-center space-x-2 cursor-pointer text-sm">
        <span>{label}</span>
        <button
            onClick={() => onChange(!enabled)}
            className={`${enabled ? 'bg-brand' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
        >
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
        </button>
    </label>
);

const getPriceColor = (price: number, basePrice: number): string => {
    const ratio = price / basePrice;
    if (ratio > 1.5) return 'bg-red-900/50 border-red-700/60';
    if (ratio > 1.1) return 'bg-yellow-800/50 border-yellow-700/60';
    if (ratio < 0.9) return 'bg-blue-900/50 border-blue-700/60';
    return 'bg-green-900/30 border-green-800/50';
};

const HostCalendar: React.FC<HostCalendarProps> = ({ property, bookings, guests, onPriceChange, onEventsChange }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [isPaintMode, setIsPaintMode] = useState(false);
    const [customPrice, setCustomPrice] = useState<string>('');
    const [aiSuggestions, setAiSuggestions] = useState<string>('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    
    const calendarGridRef = useRef<HTMLDivElement>(null);
    const priceOverrides = useMemo(() => new Map(property.priceOverrides?.map(o => [o.date, o.price])), [property.priceOverrides]);
    const eventsMap = useMemo(() => new Map(property.events?.map(e => [e.date, e])), [property.events]);
    const bookingsMap = useMemo(() => {
        const map = new Map<string, Booking>();
        bookings.forEach(booking => {
            for (let d = new Date(booking.startDate); d <= new Date(booking.endDate); d.setDate(d.getDate() + 1)) {
                map.set(dateToYyyyMmDd(d), booking);
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
        for (let i = 0; i < firstDay; i++) { days.push({ key: `empty-${i}`, empty: true }); }
        for (let i = 1; i <= daysInMonth; i++) { days.push({ key: `${year}-${month}-${i}`, day: i, date: new Date(year, month, i) }); }
        return days;
    }, [currentDate]);

    const handleSelectionStart = (dateString: string) => {
        setIsDragging(true);
        if (!isPaintMode) {
             setSelectedDates(new Set([dateString]));
        } else {
            const newDates = new Set(selectedDates);
            if (newDates.has(dateString)) newDates.delete(dateString);
            else newDates.add(dateString);
            setSelectedDates(newDates);
        }
    };
    
    const handleSelectionDrag = (dateString: string) => {
        if (!isDragging || isPaintMode) return;
        setSelectedDates(prev => new Set(prev).add(dateString));
    };

    useEffect(() => {
        const handleMouseUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);
    
    const handleApplyPrice = () => {
        const price = parseInt(customPrice, 10);
        if (isNaN(price) || price < 0) return alert("Please enter a valid price.");
        
        const newOverrides = new Map(priceOverrides);
        selectedDates.forEach(date => { if (!bookingsMap.has(date)) newOverrides.set(date, price); });
        
        onPriceChange(Array.from(newOverrides.entries()).map(([date, price]) => ({ date, price })));
        setSelectedDates(new Set());
        setCustomPrice('');
    };
    
    const handleAddEvent = (type: CalendarEvent['type']) => {
        const notes = type === 'maintenance' ? prompt('Notes for maintenance:') : undefined;
        const newEvents = new Map(eventsMap);
        selectedDates.forEach(date => {
            if (!bookingsMap.has(date)) {
                newEvents.set(date, { date, type, notes: notes ?? undefined });
            }
        });
        onEventsChange(Array.from(newEvents.values()));
        setSelectedDates(new Set());
    };
    
    const handleClearSelection = () => {
        const newOverrides = new Map(priceOverrides);
        const newEvents = new Map(eventsMap);
        selectedDates.forEach(date => {
            newOverrides.delete(date);
            newEvents.delete(date);
        });
        onPriceChange(Array.from(newOverrides.entries()).map(([date, price]) => ({ date, price })));
        onEventsChange(Array.from(newEvents.values()));
        setSelectedDates(new Set());
    };
    
    const handleGetSuggestions = async () => {
        setIsSuggesting(true);
        const result = await suggestPricingStrategy(property, bookings);
        setAiSuggestions(result);
        setIsSuggesting(false);
    };

    const changeMonth = (offset: number) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-grow bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="font-bold p-2 rounded-full hover:bg-gray-700">&lt;</button>
                    <h3 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={() => changeMonth(1)} className="font-bold p-2 rounded-full hover:bg-gray-700">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1" ref={calendarGridRef} onMouseLeave={() => setIsDragging(false)}>
                    {calendar.map(dayInfo => {
                        if (dayInfo.empty) return <div key={dayInfo.key}></div>;
                        
                        const dateString = dateToYyyyMmDd(dayInfo.date!);
                        const booking = bookingsMap.get(dateString);
                        const event = eventsMap.get(dateString);
                        const isSelected = selectedDates.has(dateString);
                        const price = priceOverrides.get(dateString) || property.pricePerNight;
                        const isPast = dayInfo.date! < new Date(new Date().toDateString());

                        let cellClass = `relative p-1.5 rounded-lg h-24 flex flex-col justify-between text-left transition-colors duration-150 border `;
                        let priceColor = getPriceColor(price, property.pricePerNight);

                        if (isPast) cellClass += ' bg-gray-900/50 text-gray-600 border-gray-700/50';
                        else if (booking) cellClass += ' bg-red-800/70 border-red-700/80 text-red-200 group';
                        else if (event) cellClass += ' bg-purple-900/60 border-purple-700/70 text-purple-200';
                        else if (isSelected) cellClass += ' bg-brand text-gray-900 ring-2 ring-offset-2 ring-offset-gray-800 ring-brand-dark border-transparent';
                        else cellClass += ` cursor-pointer ${priceColor}`;

                        return (
                            <div key={dayInfo.key} className={cellClass} 
                                onMouseDown={() => !isPast && !booking && !event && handleSelectionStart(dateString)}
                                onMouseEnter={() => !isPast && !booking && !event && handleSelectionDrag(dateString)}>
                                <span className="font-bold text-sm">{dayInfo.day}</span>
                                <div className="text-xs text-right">
                                    {booking && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-2 text-center z-10">
                                            <span className="font-bold text-white text-xs">Booked by {guests[booking.guestId]?.name.split(' ')[0]}</span>
                                        </div>
                                    )}
                                    {event && <span className="font-bold capitalize">{event.type}</span>}
                                    {!booking && !event && <span className={`font-bold ${isSelected ? 'text-gray-900' : ''}`}>₹{price/1000}k</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="lg:w-80 flex-shrink-0 space-y-4">
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                     <h4 className="font-semibold text-gray-50">Tools</h4>
                     <Toggle enabled={isPaintMode} onChange={setIsPaintMode} label="Paint Mode"/>
                     <button onClick={handleGetSuggestions} disabled={isSuggesting} className="w-full bg-accent text-gray-900 text-sm font-bold py-2 px-3 rounded-lg hover:bg-accent-dark disabled:opacity-50">
                        {isSuggesting ? 'Analyzing...' : '✨ Get AI Pricing Suggestions'}
                     </button>
                      {aiSuggestions && (
                        <div className="mt-2 p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-sm" dangerouslySetInnerHTML={{ __html: aiSuggestions }}></div>
                    )}
                 </div>
                {selectedDates.size > 0 && (
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="font-semibold mb-3 text-gray-50">{selectedDates.size} dates selected</h4>
                    <div className="space-y-3">
                         <div>
                            <label className="text-xs font-medium">Set Price (₹)</label>
                            <div className="flex space-x-2">
                                <input type="number" placeholder={`${property.pricePerNight}`} value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} className="p-2 border border-gray-600 rounded-md w-full bg-gray-700 text-sm" />
                                <button onClick={handleApplyPrice} className="bg-brand text-gray-900 font-semibold px-3 py-1 rounded-md hover:bg-brand-dark text-sm">Apply</button>
                            </div>
                        </div>
                        <div>
                             <label className="text-xs font-medium">Add Event</label>
                             <div className="flex space-x-2">
                                <button onClick={() => handleAddEvent('maintenance')} className="w-full bg-purple-800/50 hover:bg-purple-800/80 text-sm font-semibold px-3 py-2 rounded-md">Maintenance</button>
                                <button onClick={() => handleAddEvent('personal')} className="w-full bg-purple-800/50 hover:bg-purple-800/80 text-sm font-semibold px-3 py-2 rounded-md">Personal</button>
                             </div>
                        </div>
                        <button onClick={handleClearSelection} className="w-full bg-gray-600 text-gray-50 text-sm font-semibold px-3 py-2 rounded-md hover:bg-gray-500">Clear Overrides</button>
                    </div>
                </div>
                )}
            </div>
        </div>
    );
};

export default HostCalendar;