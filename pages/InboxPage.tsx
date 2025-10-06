import React, { useState, useEffect, useRef } from 'react';
import { NavigateFunction, Page, Conversation, Property, User, Booking } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';

interface InboxPageProps {
    navigate: NavigateFunction;
    initialBookingId?: string;
}

const InboxPage: React.FC<InboxPageProps> = ({ navigate, initialBookingId }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [relatedData, setRelatedData] = useState<Record<string, { property?: Property, otherUser?: User, booking?: Booking }>>({});
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchConversations = async (keepSelection = false) => {
        if (!user) return;
        setLoading(true);
        const convos = await dataService.getConversationsByUserId(user.id);
        setConversations(convos);
        
        if (keepSelection && selectedConversation) {
            const updatedSelected = convos.find(c => c.id === selectedConversation.id);
            if (updatedSelected) setSelectedConversation(updatedSelected);
        }

        const dataPromises = convos.map(async (convo) => {
            const property = await dataService.getPropertyById(convo.propertyId);
            const otherUserId = convo.participantIds.find(id => id !== user.id);
            const otherUser = otherUserId ? await dataService.getUserById(otherUserId) : undefined;
            const booking = await dataService.getBookingById(convo.id);
            return { id: convo.id, data: { property, otherUser, booking }};
        });
        const fetchedData = await Promise.all(dataPromises);
        const dataMap = fetchedData.reduce((acc, { id, data }) => ({...acc, [id]: data }), {});
        setRelatedData(dataMap);

        if (initialBookingId && !selectedConversation) {
            const initialConvo = convos.find(c => c.id === initialBookingId);
            setSelectedConversation(initialConvo || convos[0] || null);
        } else if (!selectedConversation) {
            setSelectedConversation(convos[0] || null);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchConversations();
    }, [user, initialBookingId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedConversation?.messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!newMessage.trim() || !selectedConversation || !user) return;

        try {
             await dataService.sendMessage(selectedConversation.id, {
                senderId: user.id,
                text: newMessage,
            });
            setNewMessage('');
            await fetchConversations(true); // pass true to keep selection
        } catch (err: any) {
            setError(err.message || "Failed to send message.");
        }
    };
    
    const renderReservationDetails = () => {
        if (!selectedConversation) return null;
        const data = relatedData[selectedConversation.id];
        if (!data?.booking || !data?.property) return null;

        return (
            <div className="p-4 space-y-4">
                <h3 className="font-bold text-lg text-gray-50">Reservation Details</h3>
                <img src={data.property.images[0]} alt={data.property.title} className="rounded-lg object-cover w-full h-32" />
                <div>
                    <p className="font-semibold text-gray-200">{data.property.title}</p>
                    <p className="text-sm text-gray-400">{data.property.location.city}</p>
                </div>
                <div className="text-sm space-y-2 border-t border-gray-700 pt-4 text-gray-300">
                    <div className="flex justify-between"><span>Dates:</span> <strong>{new Date(data.booking.startDate).toLocaleDateString()} - {new Date(data.booking.endDate).toLocaleDateString()}</strong></div>
                    <div className="flex justify-between"><span>Guests:</span> <strong>{data.booking.guests}</strong></div>
                    <div className="flex justify-between"><span>Total:</span> <strong>₹{data.booking.totalPrice.toLocaleString('en-IN')}</strong></div>
                </div>
                 <button onClick={() => navigate(Page.PROPERTY, { id: data.property!.id })} className="w-full text-center bg-gray-700 py-2 rounded-lg hover:bg-gray-600 transition text-sm font-semibold">View Listing</button>
            </div>
        )
    };


    if (loading && conversations.length === 0) return <div className="text-center py-20">Loading messages...</div>;
    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-50">Messages</h1>
            <div className="flex h-[75vh] border border-gray-700 rounded-lg bg-gray-800 shadow-sm overflow-hidden">
                {/* Conversation List */}
                <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
                    {conversations.map(convo => {
                        const data = relatedData[convo.id];
                        const lastMessage = convo.messages[convo.messages.length - 1];
                        return (
                            <div 
                                key={convo.id} 
                                onClick={() => setSelectedConversation(convo)}
                                className={`p-4 cursor-pointer hover:bg-gray-700/60 border-l-4 ${selectedConversation?.id === convo.id ? 'bg-gray-700 border-brand' : 'border-transparent'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <img src={data?.otherUser?.avatarUrl} alt={data?.otherUser?.name} className="w-12 h-12 rounded-full flex-shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="font-bold truncate text-gray-200">{data?.otherUser?.name}</p>
                                        <p className="text-sm font-semibold text-gray-300 truncate">{data?.property?.title}</p>
                                        <p className="text-sm text-gray-400 truncate">{lastMessage?.text}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Message View */}
                <div className="w-2/3 flex flex-col">
                    {selectedConversation ? (
                        <>
                             <div className="p-4 border-b border-gray-700 flex items-center space-x-4">
                               <img src={relatedData[selectedConversation.id]?.otherUser?.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                               <div>
                                    <p className="font-bold text-gray-50">{relatedData[selectedConversation.id]?.otherUser?.name}</p>
                                    <p className="text-sm text-gray-400 cursor-pointer hover:underline" onClick={() => navigate(Page.PROPERTY, { id: selectedConversation.propertyId })}>
                                        {relatedData[selectedConversation.id]?.property?.title}
                                    </p>
                               </div>
                            </div>
                            <div className="flex-grow p-6 overflow-y-auto bg-gray-900">
                                <div className="space-y-4">
                                {selectedConversation.messages.map(msg => (
                                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                        {msg.senderId !== user.id && <img src={relatedData[selectedConversation.id]?.otherUser?.avatarUrl} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />}
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.senderId === user.id ? 'bg-brand text-gray-900 font-medium rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-700 bg-gray-800">
                                 {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                                    <input 
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full p-3 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-brand bg-gray-700"
                                    />
                                    <button type="submit" className="bg-brand text-gray-900 rounded-full p-3 hover:bg-brand-dark transition">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <p>Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
                 {/* Reservation Details */}
                <div className="w-1/3 border-l border-gray-700 overflow-y-auto bg-gray-800/50">
                   {renderReservationDetails()}
                </div>
            </div>
        </div>
    );
};

export default InboxPage;