import React, { useState, useEffect, useRef } from 'react';
import { NavigateFunction, Page, Conversation, Property, User, Booking, Message } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import { moderateMessage } from '../services/geminiService';

interface InboxPageProps {
    navigate: NavigateFunction;
    initialConversationId?: string;
}

const SharedPropertyCard: React.FC<{ propertyId: string; navigate: NavigateFunction; }> = ({ propertyId, navigate }) => {
    const [property, setProperty] = useState<Property | null>(null);
    useEffect(() => {
        dataService.getPropertyById(propertyId).then(p => setProperty(p || null));
    }, [propertyId]);

    if (!property) return <div className="p-2 rounded-lg bg-gray-600 animate-pulse h-24 my-2"></div>;

    return (
        <div className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 cursor-pointer my-2" onClick={() => navigate(Page.PROPERTY, { id: property.id })}>
            <div className="flex space-x-3">
                <img src={property.images[0]} alt={property.title} className="w-20 h-20 object-cover rounded-md" />
                <div>
                    <p className="font-bold text-sm text-gray-50">{property.title}</p>
                    <p className="text-xs text-gray-300">{property.location.city}</p>
                    <p className="text-sm font-semibold mt-1 text-gray-50">₹{property.pricePerNight.toLocaleString()}/night</p>
                </div>
            </div>
        </div>
    );
};

const OfferCard: React.FC<{ message: Message; conversation: Conversation; user: User; navigate: NavigateFunction; onUpdate: () => void; }> = ({ message, conversation, user, navigate, onUpdate }) => {
    const isHost = user.id !== message.senderId;

    const handleAccept = async () => {
        await dataService.updateMessage(conversation.id, message.id, { offerStatus: 'accepted' });
        const property = await dataService.getPropertyById(conversation.propertyId);
        onUpdate();
        if (property && message.offer) {
            navigate(Page.PROPERTY, { id: property.id, offerPrice: message.offer.pricePerNight });
        }
    };
    
    let statusText = 'Offer Sent';
    let statusColor = 'bg-blue-900/50 text-blue-300';
    if(message.offerStatus === 'accepted') {
        statusText = 'Offer Accepted';
        statusColor = 'bg-green-900/50 text-green-300';
    }

    return (
         <div className="p-3 rounded-lg bg-gray-600 my-2">
            <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-gray-50">Special Offer</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor}`}>{statusText}</span>
            </div>
            <p className="text-sm text-gray-300 italic mb-2">"{message.offer?.notes}"</p>
            <div className="border-t border-gray-500 pt-2">
                <p className="text-lg font-bold text-gray-50">₹{message.offer?.pricePerNight.toLocaleString()}<span className="text-sm font-normal text-gray-300">/night</span></p>
            </div>
            {isHost && message.offerStatus === 'pending' && (
                <button onClick={handleAccept} className="w-full text-center bg-brand text-gray-900 font-bold py-2 mt-3 rounded-lg hover:bg-brand-dark transition text-sm">
                    Accept & Book Now
                </button>
            )}
        </div>
    );
};

const SharePropertyModal: React.FC<{ isOpen: boolean, onClose: () => void, onSelect: (propertyId: string) => void, currentPropertyId: string }> = ({ isOpen, onClose, onSelect, currentPropertyId }) => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);

    useEffect(() => {
        if (isOpen && user) {
            dataService.getPropertiesByHostId(user.id).then(props => {
                setProperties(props.filter(p => p.id !== currentPropertyId));
            });
        }
    }, [isOpen, user, currentPropertyId]);

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-xl border border-gray-700 animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-gray-50">Share another property</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {properties.map(p => (
                        <div key={p.id} onClick={() => onSelect(p.id)} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                            <img src={p.images[0]} alt={p.title} className="w-16 h-16 object-cover rounded-md" />
                            <div>
                                <p className="font-semibold text-gray-200">{p.title}</p>
                                <p className="text-sm text-gray-400">{p.location.city}</p>
                            </div>
                        </div>
                    ))}
                     {properties.length === 0 && <p className="text-gray-400 text-center py-4">You have no other properties to share.</p>}
                </div>
            </div>
        </div>
    )
};

const MakeOfferModal: React.FC<{ isOpen: boolean, onClose: () => void, onSubmit: (price: number, notes: string) => void, defaultPrice: number }> = ({ isOpen, onClose, onSubmit, defaultPrice }) => {
    const [price, setPrice] = useState(defaultPrice);
    const [notes, setNotes] = useState('');
    
    const handleSubmit = () => {
        if(price > 0 && notes.trim()){
            onSubmit(price, notes);
        } else {
            alert('Please enter a valid price and notes for the offer.');
        }
    }
    
    if (!isOpen) return null;

     return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-700 animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-gray-50">Make a Special Offer</h3>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Offer Price per Night (₹)</label>
                        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Notes for Guest</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="e.g., Discount for a longer stay." className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 font-semibold">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-brand text-gray-900 hover:bg-brand-dark font-semibold">Send Offer</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const InboxPage: React.FC<InboxPageProps> = ({ navigate, initialConversationId }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [relatedData, setRelatedData] = useState<Record<string, { property?: Property, otherUser?: User, booking?: Booking }>>({});
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [isOfferModalOpen, setOfferModalOpen] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchConversations = async (keepSelection = false) => {
        if (!user) return;
        setLoading(true);
        const convos = await dataService.getConversationsByUserId(user.id);
        setConversations(convos);
        
        const currentSelectionId = keepSelection ? selectedConversation?.id : null;
        if (currentSelectionId) {
            const updatedSelected = convos.find(c => c.id === currentSelectionId);
            setSelectedConversation(updatedSelected || null);
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

        if (initialConversationId && !currentSelectionId) {
            const initialConvo = convos.find(c => c.id === initialConversationId);
            setSelectedConversation(initialConvo || convos[0] || null);
            if (initialConvo) setMobileView('chat');
        } else if (!currentSelectionId) {
            setSelectedConversation(convos[0] || null);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchConversations();
    }, [user, initialConversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedConversation?.messages]);

    useEffect(() => {
        if (conversations.length > 0 && !selectedConversation) {
            setSelectedConversation(conversations[0]);
        }
        if (window.innerWidth < 768) {
            setMobileView(selectedConversation ? 'chat' : 'list');
        }
    }, [conversations, selectedConversation]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setIsActionMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectConversation = (convo: Conversation) => {
        setSelectedConversation(convo);
        setMobileView('chat');
    };

    const handleSendMessage = async (messageData: Omit<Message, 'id' | 'timestamp' | 'senderId'>) => {
        setError(null);
        if (!selectedConversation || !user) return;
        setIsSending(true);

        if (messageData.text) {
            const moderationResult = await moderateMessage(messageData.text);
            if (!moderationResult.compliant) {
                setError(moderationResult.reason);
                setIsSending(false);
                return;
            }
        }

        try {
             await dataService.sendMessage(selectedConversation.id, { senderId: user.id, ...messageData });
            setNewMessage('');
            await fetchConversations(true);
        } catch (err: any) {
            setError(err.message || "Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };
    
    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(newMessage.trim() && !isSending) handleSendMessage({ text: newMessage });
    };
    
    const handleShareSelect = (propertyId: string) => {
        handleSendMessage({ propertyShareId: propertyId });
        setShareModalOpen(false);
    };
    
    const handleOfferSubmit = (price: number, notes: string) => {
        handleSendMessage({ offer: { pricePerNight: price, notes }, offerStatus: 'pending' });
        setOfferModalOpen(false);
    };

    const renderReservationDetails = () => {
        if (!selectedConversation) return null;
        const data = relatedData[selectedConversation.id];
        if (!data?.property) return null;

        return (
            <div className="p-4 space-y-4">
                <h3 className="font-bold text-lg text-gray-50">About the Listing</h3>
                <img src={data.property.images[0]} alt={data.property.title} className="rounded-lg object-cover w-full h-32" />
                <div>
                    <p className="font-semibold text-gray-200">{data.property.title}</p>
                    <p className="text-sm text-gray-400">{data.property.location.city}</p>
                </div>
                 {data.booking && (
                     <div className="text-sm space-y-2 border-t border-gray-700 pt-4 text-gray-300">
                        <div className="flex justify-between"><span>Dates:</span> <strong>{new Date(data.booking.startDate).toLocaleDateString()} - {new Date(data.booking.endDate).toLocaleDateString()}</strong></div>
                        <div className="flex justify-between"><span>Guests:</span> <strong>{data.booking.guests}</strong></div>
                    </div>
                 )}
                 <button onClick={() => navigate(Page.PROPERTY, { id: data.property!.id })} className="w-full text-center bg-gray-700 py-2 rounded-lg hover:bg-gray-600 transition text-sm font-semibold">View Listing</button>
            </div>
        )
    };

    if (loading && conversations.length === 0) return <div className="text-center py-20">Loading messages...</div>;
    if (!user) return null;
    
    const selectedProperty = selectedConversation ? relatedData[selectedConversation.id]?.property : null;
    const isHostForThisConvo = user.isHost && selectedProperty?.hostId === user.id;

    const showList = mobileView === 'list';
    const showChat = mobileView === 'chat';

    return (
        <div className="container mx-auto px-0 sm:px-4 py-0 sm:py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-50 px-4 sm:px-0">Messages</h1>
            <div className="flex h-[calc(100vh-160px)] sm:h-[75vh] border-0 sm:border sm:border-gray-700 sm:rounded-lg bg-gray-850 shadow-sm overflow-hidden">
                {/* Conversation List */}
                <div className={`w-full md:w-1/3 border-r border-gray-700 overflow-y-auto ${showChat && 'hidden md:block'}`}>
                    {conversations.map(convo => {
                        const data = relatedData[convo.id];
                        const lastMessage = convo.messages[convo.messages.length - 1];
                        return (
                            <div 
                                key={convo.id} 
                                onClick={() => handleSelectConversation(convo)}
                                className={`p-4 cursor-pointer hover:bg-gray-800/60 border-l-4 transition-colors ${selectedConversation?.id === convo.id ? 'bg-gray-800 border-brand' : 'border-transparent'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <img src={data?.otherUser?.avatarUrl} alt={data?.otherUser?.name} className="w-12 h-12 rounded-full flex-shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="font-bold truncate text-gray-200">{data?.otherUser?.name}</p>
                                        <p className="text-sm font-semibold text-gray-300 truncate">{data?.property?.title}</p>
                                        <p className="text-sm text-gray-400 truncate">{lastMessage?.text || (lastMessage?.offer ? 'Sent an offer' : 'Shared a property')}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Message View */}
                <div className={`w-full md:w-2/3 flex flex-col ${showList && 'hidden md:flex'}`}>
                    {selectedConversation ? (
                        <>
                             <div className="p-4 border-b border-gray-700 flex items-center space-x-4 bg-gray-850">
                               <button onClick={() => setMobileView('list')} className="md:hidden text-gray-300">&larr;</button>
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
                                        {msg.senderId !== user.id && <img src={relatedData[selectedConversation.id]?.otherUser?.avatarUrl} className="w-8 h-8 rounded-full flex-shrink-0 self-start" alt="" />}
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.senderId === user.id ? 'bg-brand text-gray-900 font-medium rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                            {msg.text && <p>{msg.text}</p>}
                                            {msg.propertyShareId && <SharedPropertyCard propertyId={msg.propertyShareId} navigate={navigate} />}
                                            {msg.offer && <OfferCard message={msg} conversation={selectedConversation} user={user} navigate={navigate} onUpdate={() => fetchConversations(true)} />}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-700 bg-gray-850">
                                 {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
                                <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
                                     {isHostForThisConvo && (
                                        <div ref={actionMenuRef}>
                                            <div className="relative sm:hidden">
                                                <button type="button" onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} className="p-3 text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                                </button>
                                                {isActionMenuOpen && (
                                                    <div className="absolute bottom-14 left-0 w-48 bg-gray-600 rounded-lg shadow-lg z-10 p-2 border border-gray-500">
                                                        <button type="button" onClick={() => { setShareModalOpen(true); setIsActionMenuOpen(false); }} className="w-full text-left p-2 rounded hover:bg-gray-500 text-gray-50">Share Property</button>
                                                        <button type="button" onClick={() => { setOfferModalOpen(true); setIsActionMenuOpen(false); }} className="w-full text-left p-2 rounded hover:bg-gray-500 text-gray-50">Make Offer</button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="hidden sm:flex space-x-1">
                                                <button type="button" onClick={() => setShareModalOpen(true)} disabled={isSending} title="Share another property" className="p-3 text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg></button>
                                                <button type="button" onClick={() => setOfferModalOpen(true)} disabled={isSending} title="Make a special offer" className="p-3 text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></button>
                                            </div>
                                        </div>
                                    )}
                                    <input 
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        disabled={isSending}
                                        className="w-full p-3 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-brand bg-gray-700 disabled:opacity-50"
                                    />
                                    <button type="submit" disabled={isSending} className="bg-brand text-gray-900 rounded-full p-3 hover:bg-brand-dark transition disabled:opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="hidden md:flex items-center justify-center h-full text-gray-400">
                            <p>Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
                 {/* Reservation Details */}
                <div className="w-1/3 border-l border-gray-700 overflow-y-auto bg-gray-800 hidden lg:block">
                   {renderReservationDetails()}
                </div>
            </div>
             {isHostForThisConvo && selectedProperty && <SharePropertyModal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} onSelect={handleShareSelect} currentPropertyId={selectedProperty.id} />}
             {isHostForThisConvo && selectedProperty && <MakeOfferModal isOpen={isOfferModalOpen} onClose={() => setOfferModalOpen(false)} onSubmit={handleOfferSubmit} defaultPrice={selectedProperty.pricePerNight} />}
        </div>
    );
};

export default InboxPage;