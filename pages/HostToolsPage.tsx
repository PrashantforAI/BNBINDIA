import React, { useState, useEffect } from 'react';
import { NavigateFunction, Page, Property, Booking, Review, Conversation, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import { generatePerformanceInsights, suggestMessageReply, draftReviewResponse } from '../services/geminiService';

interface HostToolsPageProps {
    navigate: NavigateFunction;
}

type HostData = {
    properties: Property[];
    bookings: Booking[];
    reviews: Review[];
    conversations: Conversation[];
}

const PerformanceInsights: React.FC<{ data: HostData }> = ({ data }) => {
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        const results = await generatePerformanceInsights(data.properties, data.reviews);
        setInsights(results);
        setIsLoading(false);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-50">Performance Insights</h3>
            <p className="text-sm text-gray-400 mb-4">Get AI-powered tips to improve your listings based on your performance data.</p>
            <button onClick={handleGenerate} disabled={isLoading} className="bg-accent text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-accent-dark transition disabled:opacity-50">
                {isLoading ? 'Analyzing...' : '✨ Generate Insights'}
            </button>
            {insights.length > 0 && (
                <div className="mt-4 space-y-3">
                    {insights.map((insight, index) => (
                        <div key={index} className="bg-gray-700/50 p-3 rounded-md text-gray-300 text-sm">{insight}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SmartResponder: React.FC<{ data: HostData, users: Record<string, User> }> = ({ data, users }) => {
    const { user } = useAuth();
    const [selectedMessage, setSelectedMessage] = useState<Conversation | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const messagesToReply = data.conversations.filter(c => c.messages.length > 0 && c.messages[c.messages.length - 1].senderId !== user?.id);

    const handleSuggest = async () => {
        if (!selectedMessage) return;
        setIsLoading(true);
        const lastMessage = selectedMessage.messages[selectedMessage.messages.length - 1];
        const property = data.properties.find(p => p.id === selectedMessage.propertyId);
        const results = await suggestMessageReply(lastMessage.text, property?.title || '');
        setSuggestions(results);
        setIsLoading(false);
    };
    
    useEffect(() => {
        setSuggestions([]);
    }, [selectedMessage]);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-50">Smart Responder</h3>
            <p className="text-sm text-gray-400 mb-4">Generate quick replies to guest messages.</p>
            
            <select
                onChange={(e) => setSelectedMessage(data.conversations.find(c => c.id === e.target.value) || null)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md mb-4"
                value={selectedMessage?.id || ''}
            >
                <option value="" disabled>Select a message to reply to...</option>
                {messagesToReply.map(convo => {
                     const otherUserId = convo.participantIds.find(id => id !== user?.id);
                     const guestName = users[otherUserId || '']?.name || 'Guest';
                     const lastMessage = convo.messages[convo.messages.length - 1];
                     return <option key={convo.id} value={convo.id}>{guestName}: "{lastMessage.text.substring(0, 40)}..."</option>
                })}
            </select>

            {selectedMessage && (
                <div>
                    <button onClick={handleSuggest} disabled={isLoading} className="bg-accent text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-accent-dark transition disabled:opacity-50">
                        {isLoading ? 'Thinking...' : '✨ Suggest Replies'}
                    </button>
                    {suggestions.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {suggestions.map((reply, index) => (
                                <button key={index} onClick={() => navigator.clipboard.writeText(reply)} className="w-full text-left bg-gray-700 p-3 rounded-md text-gray-300 text-sm hover:bg-gray-600">
                                    {reply} <span className="text-xs text-gray-500">(click to copy)</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ReviewResponder: React.FC<{ data: HostData, users: Record<string, User> }> = ({ data, users }) => {
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [response, setResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // In a real app, we'd filter for reviews that haven't been responded to.
    const recentReviews = data.reviews.slice(0, 10);

    const handleDraft = async () => {
        if (!selectedReview) return;
        setIsLoading(true);
        const property = data.properties.find(p => p.id === selectedReview.propertyId);
        const result = await draftReviewResponse(selectedReview, property?.title || '');
        setResponse(result);
        setIsLoading(false);
    };
    
    useEffect(() => {
        setResponse('');
    }, [selectedReview]);
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-50">Review Responder</h3>
            <p className="text-sm text-gray-400 mb-4">Draft professional responses to guest reviews.</p>

            <select
                onChange={(e) => setSelectedReview(data.reviews.find(r => r.id === e.target.value) || null)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md mb-4"
                value={selectedReview?.id || ''}
            >
                <option value="" disabled>Select a recent review...</option>
                {recentReviews.map(review => {
                     const guestName = users[review.guestId]?.name || 'Guest';
                     return <option key={review.id} value={review.id}>{review.rating}★ from {guestName}: "{review.comment.substring(0, 40)}..."</option>
                })}
            </select>

            {selectedReview && (
                <div>
                     <button onClick={handleDraft} disabled={isLoading} className="bg-accent text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-accent-dark transition disabled:opacity-50">
                        {isLoading ? 'Drafting...' : '✨ Draft Response'}
                    </button>
                    {response && (
                        <div className="mt-4">
                           <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={4} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                           <button onClick={() => navigator.clipboard.writeText(response)} className="mt-2 text-sm text-brand font-semibold hover:underline">Copy to clipboard</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const HostToolsPage: React.FC<HostToolsPageProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [hostData, setHostData] = useState<HostData | null>(null);
    const [allUsers, setAllUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            const data = await dataService.getHostDashboardData(user.id);
            setHostData(data);
            
            // Fetch all users to map IDs to names
            const usersList = await dataService.getUsers();
            const usersMap = usersList.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
            setAllUsers(usersMap);

            setLoading(false);
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="text-center py-20">Loading Host Tools...</div>;
    if (!hostData) return <div className="text-center py-20">Could not load host data.</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-2 text-gray-50">AI Host Toolkit</h1>
            <p className="text-gray-400 mb-8">Your AI assistant for easier, more profitable hosting.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    <PerformanceInsights data={hostData} />
                    <ReviewResponder data={hostData} users={allUsers} />
                </div>
                <div className="lg:col-span-1">
                    <SmartResponder data={hostData} users={allUsers} />
                </div>
            </div>
        </div>
    );
};

export default HostToolsPage;