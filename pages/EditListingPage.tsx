import React, { useState, useReducer, useEffect } from 'react';
import { NavigateFunction, Page, Property } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import { generateDescription, suggestTitle, suggestPrice, categorizePropertyImages } from '../services/geminiService';

interface EditListingPageProps {
    navigate: NavigateFunction;
    propertyId: string;
}

const ALL_AMENITIES = ['Pool', 'Wifi', 'Air Conditioning', 'Kitchen', 'Parking', 'Garden', 'Beach Access', 'Heating', 'Elevator', 'Terrace', 'Workspace'];
const PROPERTY_TYPES: Property['type'][] = ['Apartment', 'House', 'Villa', 'Cottage'];

type State = Partial<Property>;
type Action = 
    | { type: 'SET_STATE'; payload: State }
    | { type: 'SET_FIELD'; field: keyof State; value: any }
    | { type: 'SET_LOCATION_FIELD'; field: keyof Property['location']; value: any }
    | { type: 'TOGGLE_AMENITY'; amenity: string };

function formReducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_STATE':
            return action.payload;
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'SET_LOCATION_FIELD':
            return { ...state, location: { ...state.location!, [action.field]: action.value } };
        case 'TOGGLE_AMENITY':
            const amenities = state.amenities || [];
            const newAmenities = amenities.includes(action.amenity)
                ? amenities.filter(a => a !== action.amenity)
                : [...amenities, action.amenity];
            return { ...state, amenities: newAmenities };
        default:
            return state;
    }
}

const ProgressBar: React.FC<{ step: number, totalSteps: number }> = ({ step, totalSteps }) => (
    <div className="w-full bg-gray-700 rounded-full h-1.5 mb-8">
        <div className="bg-brand h-1.5 rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
    </div>
);

const EditListingPage: React.FC<EditListingPageProps> = ({ navigate, propertyId }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [state, dispatch] = useReducer(formReducer, {});
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isCategorizing, setIsCategorizing] = useState(false);
    const [imageCategories, setImageCategories] = useState<string[]>([]);
    const [hostNotes, setHostNotes] = useState('');
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchProperty = async () => {
            setLoading(true);
            const prop = await dataService.getPropertyById(propertyId);
            if (prop && prop.hostId === user?.id) {
                dispatch({ type: 'SET_STATE', payload: prop });
                setImageCategories(Array(prop.images.length).fill('')); // Existing images have no AI category
            } else {
                navigate(Page.HOST_LISTINGS);
            }
            setLoading(false);
        };
        fetchProperty();
    }, [propertyId, user, navigate]);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    };

    // AI Handlers
    const handleSuggestTitle = async () => {
        if (!state.type || !state.location?.city) return;
        setIsLoadingAI(true);
        const title = await suggestTitle(state.type, state.location.city);
        dispatch({ type: 'SET_FIELD', field: 'title', value: title });
        setIsLoadingAI(false);
    };

    const handleGenerateDescription = async () => {
        setIsLoadingAI(true);
        const description = await generateDescription(state, hostNotes);
        dispatch({ type: 'SET_FIELD', field: 'description', value: description });
        setIsLoadingAI(false);
    };
    
    const handleSuggestPrice = async () => {
        setIsLoadingAI(true);
        const price = await suggestPrice(state);
        dispatch({ type: 'SET_FIELD', field: 'pricePerNight', value: price });
        setIsLoadingAI(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const currentCount = state.images?.length ?? 0;
            const canUploadCount = 5 - currentCount;

            if (canUploadCount <= 0) {
                alert("You can only upload a maximum of 5 images.");
                return;
            }

            const filesToUpload = files.slice(0, canUploadCount);
            if(filesToUpload.length === 0) return;

            const imageUrls = filesToUpload.map((file: File) => URL.createObjectURL(file));

            const newImages = [...(state.images || []), ...imageUrls];
            const newCategories = [...imageCategories, ...Array(filesToUpload.length).fill('Categorizing...')];
            
            dispatch({ type: 'SET_FIELD', field: 'images', value: newImages });
            setImageCategories(newCategories);
            setIsCategorizing(true);

            try {
                const base64Promises = filesToUpload.map(fileToBase64);
                const base64Images = await Promise.all(base64Promises);
                
                const categories = await categorizePropertyImages(base64Images);

                setImageCategories(prev => {
                    const updated = [...prev];
                    const startIndex = currentCount;
                    for (let i = 0; i < categories.length; i++) {
                        updated[startIndex + i] = categories[i];
                    }
                    return updated;
                });
            } catch (error) {
                console.error("Failed to categorize images:", error);
                 setImageCategories(prev => {
                    const updated = [...prev];
                    const startIndex = currentCount;
                     for (let i = 0; i < filesToUpload.length; i++) {
                        updated[startIndex + i] = 'Error';
                    }
                    return updated;
                });
            } finally {
                setIsCategorizing(false);
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...(state.images || [])];
        const removedUrl = newImages[index];
        // Only revoke if it's a blob URL
        if (removedUrl.startsWith('blob:')) {
            URL.revokeObjectURL(removedUrl);
        }
        newImages.splice(index, 1);
        dispatch({ type: 'SET_FIELD', field: 'images', value: newImages });

        const newCategories = [...imageCategories];
        newCategories.splice(index, 1);
        setImageCategories(newCategories);
    };

    const handleSubmit = async () => {
        if (!user || !state.id) return;
        
        await dataService.updateProperty(state.id, state);
        alert('Listing updated successfully!');
        navigate(Page.MANAGE_LISTING, { id: state.id });
    };
    
    if (loading) return <div>Loading listing for editing...</div>;

    const renderStep = () => {
        switch(step) {
            case 1: // Location & Basics
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Update your place's details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-medium text-gray-200">Property Type</label>
                                <select value={state.type} onChange={e => dispatch({type: 'SET_FIELD', field: 'type', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md">
                                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-200">City</label>
                                    <input type="text" placeholder="e.g., Lonavala" value={state.location?.city} onChange={e => dispatch({type: 'SET_LOCATION_FIELD', field: 'city', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-200">State</label>
                                    <input type="text" placeholder="e.g., Maharashtra" value={state.location?.state} onChange={e => dispatch({type: 'SET_LOCATION_FIELD', field: 'state', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-200">Max Guests</label>
                                    <input type="number" min="1" value={state.maxGuests} onChange={e => dispatch({type: 'SET_FIELD', field: 'maxGuests', value: Number(e.target.value)})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-200">Bedrooms</label>
                                    <input type="number" min="0" value={state.bedrooms} onChange={e => dispatch({type: 'SET_FIELD', field: 'bedrooms', value: Number(e.target.value)})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-200">Bathrooms</label>
                                    <input type="number" min="1" value={state.bathrooms} onChange={e => dispatch({type: 'SET_FIELD', field: 'bathrooms', value: Number(e.target.value)})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2: // Amenities
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Update your amenities</h2>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {ALL_AMENITIES.map(amenity => (
                                <label key={amenity} className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${state.amenities?.includes(amenity) ? 'bg-brand/10 text-brand border-brand shadow-md' : 'bg-gray-800 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'}`}>
                                    <input type="checkbox" checked={state.amenities?.includes(amenity)} onChange={() => dispatch({type: 'TOGGLE_AMENITY', amenity})} className="hidden" />
                                     <span className={`w-5 h-5 rounded-md border-2 flex-shrink-0 ${state.amenities?.includes(amenity) ? 'bg-brand border-brand-dark' : 'border-gray-600'}`}>
                                        {state.amenities?.includes(amenity) && <svg className="w-full h-full text-gray-900" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                    </span>
                                    <span>{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 3: // Photos
                const canUploadMore = (state.images?.length ?? 0) < 5;
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Manage your photos</h2>
                        <p className="text-gray-400 mb-6">You can add up to 5 photos. The first photo is your cover photo.</p>
                        <div className="p-6 border-2 border-dashed border-gray-700 rounded-lg text-center">
                            <input type="file" id="photo-upload" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={!canUploadMore} />
                            <label htmlFor="photo-upload" className={`font-bold py-2 px-4 rounded-lg transition ${canUploadMore ? 'bg-brand text-gray-900 cursor-pointer hover:bg-brand-dark' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
                                {canUploadMore ? 'Upload More' : 'Maximum photos reached'}
                            </label>
                            {isCategorizing && <p className="text-sm text-accent mt-2 text-center">✨ AI is categorizing your new photos...</p>}
                        </div>
                        {state.images && state.images.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold mb-2">Current Photos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {state.images.map((img, index) => (
                                        <div key={img} className="relative group">
                                            <img src={img} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                                            <button onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                            {index === 0 && <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">Cover Photo</div>}
                                            {imageCategories[index] && imageCategories[index] !== '' && (
                                                <div className={`absolute bottom-0 right-0 text-gray-900 text-xs font-bold px-2 py-1 rounded-tl-lg rounded-br-lg ${imageCategories[index] === 'Categorizing...' ? 'bg-yellow-400' : 'bg-accent/90'}`}>
                                                    {imageCategories[index]}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 4: // Title & Description
                 return (
                     <div>
                        <h2 className="text-2xl font-bold mb-6">Update your description</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-medium text-gray-200">Title</label>
                                <div className="flex items-center space-x-2">
                                    <input type="text" value={state.title} onChange={e => dispatch({type: 'SET_FIELD', field: 'title', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                    <button onClick={handleSuggestTitle} disabled={isLoadingAI} className="bg-accent text-gray-900 font-bold px-3 py-2 rounded-md text-sm shrink-0 hover:bg-accent-dark disabled:bg-opacity-60">✨ Suggest</button>
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium text-gray-200">Description</label>
                                <textarea rows={5} value={state.description} onChange={e => dispatch({type: 'SET_FIELD', field: 'description', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                            </div>
                             <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                                 <label className="block font-medium text-accent">Host Notes for AI Co-Pilot</label>
                                 <p className="text-sm text-accent/80 mb-2">Help the AI write a better description. The AI will use this as its main source of information.</p>
                                 <textarea rows={4} placeholder="e.g., 'Highlight the sea view from the balcony...'" value={hostNotes} onChange={e => setHostNotes(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                            </div>
                            <button onClick={handleGenerateDescription} disabled={isLoadingAI} className="mt-2 bg-accent text-gray-900 font-bold px-3 py-2 rounded-md text-sm hover:bg-accent-dark disabled:bg-opacity-60">✨ Generate with AI</button>
                        </div>
                    </div>
                );
            case 5: // Price
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Update your price</h2>
                        <div>
                            <label className="block font-medium text-gray-200">Price per night (INR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                <input type="number" placeholder="5000" min="0" value={state.pricePerNight} onChange={e => dispatch({type: 'SET_FIELD', field: 'pricePerNight', value: Number(e.target.value)})} className="w-full p-2 pl-6 bg-gray-700 border border-gray-600 rounded-md" />
                            </div>
                             <button onClick={handleSuggestPrice} disabled={isLoadingAI} className="mt-4 bg-accent text-gray-900 font-bold px-3 py-2 rounded-md text-sm hover:bg-accent-dark disabled:bg-opacity-60">✨ Suggest a competitive price</button>
                             {isLoadingAI && <p className="text-sm text-accent mt-2">AI is thinking...</p>}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={() => navigate(Page.MANAGE_LISTING, { id: propertyId })} className="text-brand font-semibold mb-4 hover:underline">&larr; Back to Listing Management</button>
            <h1 className="text-3xl font-bold mb-8 text-gray-50">Editing: {state.title || 'Your Listing'}</h1>
            
            <div className="max-w-2xl mx-auto bg-gray-800 p-6 md:p-8 rounded-lg border border-gray-700">
                <ProgressBar step={step} totalSteps={5} />
                <div className="min-h-[400px]">
                    {renderStep()}
                </div>
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
                    <button onClick={prevStep} disabled={step === 1} className="text-gray-200 font-bold py-2 px-4 rounded disabled:opacity-50 hover:bg-gray-700/50">Back</button>
                    {step < 5 ? (
                        <button onClick={nextStep} className="bg-brand text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-brand-dark transition-colors">Next</button>
                    ) : (
                        <button onClick={handleSubmit} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">Save Changes</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditListingPage;