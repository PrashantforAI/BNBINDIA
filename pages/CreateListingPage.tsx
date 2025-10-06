import React, { useState, useReducer } from 'react';
import { NavigateFunction, Page, Property } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import { generateDescription, suggestTitle, suggestPrice, categorizePropertyImages } from '../services/geminiService';

interface CreateListingPageProps {
    navigate: NavigateFunction;
}

const ALL_AMENITIES = ['Pool', 'Wifi', 'Air Conditioning', 'Kitchen', 'Parking', 'Garden', 'Beach Access', 'Heating', 'Elevator', 'Terrace', 'Workspace'];
const PROPERTY_TYPES: Property['type'][] = ['Apartment', 'House', 'Villa', 'Cottage'];

type State = Partial<Property>;
type Action = 
    | { type: 'SET_FIELD'; field: keyof State; value: any }
    | { type: 'SET_LOCATION_FIELD'; field: keyof Property['location']; value: any }
    | { type: 'TOGGLE_AMENITY'; amenity: string };

const initialState: State = {
    title: '',
    description: '',
    location: { city: '', state: '', country: 'India', lat: 0, lng: 0 },
    pricePerNight: 0,
    amenities: [],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    type: 'Apartment',
    images: [],
    status: 'listed'
};

function formReducer(state: State, action: Action): State {
    switch(action.type) {
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

const CreateListingPage: React.FC<CreateListingPageProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [state, dispatch] = useReducer(formReducer, initialState);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isCategorizing, setIsCategorizing] = useState(false);
    const [imageCategories, setImageCategories] = useState<string[]>([]);
    const [hostNotes, setHostNotes] = useState('');
    
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

            // FIX: Explicitly type 'file' as File to resolve TypeScript inference issue.
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
        URL.revokeObjectURL(newImages[index]); // Clean up blob URL to prevent memory leaks
        newImages.splice(index, 1);
        dispatch({ type: 'SET_FIELD', field: 'images', value: newImages });

        const newCategories = [...imageCategories];
        newCategories.splice(index, 1);
        setImageCategories(newCategories);
    };

    const handleSubmit = async () => {
        if (!user) return;
        
        const newPropertyData = { ...state, hostId: user.id } as Omit<Property, 'id' | 'rating' | 'reviewCount'>;
        
        if ((state.images?.length ?? 0) < 1) {
            alert('Please upload at least one photo.');
            setStep(3); // Go back to photo step
            return;
        }

        if (!newPropertyData.title || !newPropertyData.location.city || !newPropertyData.location.state || newPropertyData.pricePerNight <= 0) {
            alert('Please fill in all required fields: title, city, state, and a valid price.');
            return;
        }

        const newProperty = await dataService.createProperty(newPropertyData);
        alert('Listing created successfully!');
        navigate(Page.HOST_LISTINGS);
    };

    const renderStep = () => {
        switch(step) {
            case 1: // Location & Basics
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Tell us about your place</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-medium text-gray-200">Property Type</label>
                                <select value={state.type} onChange={e => dispatch({type: 'SET_FIELD', field: 'type', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md">
                                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-200">City</label>
                                    <input type="text" placeholder="e.g., Lonavala" value={state.location?.city} onChange={e => dispatch({type: 'SET_LOCATION_FIELD', field: 'city', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-200">State</label>
                                    <input type="text" placeholder="e.g., Maharashtra" value={state.location?.state} onChange={e => dispatch({type: 'SET_LOCATION_FIELD', field: 'state', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
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
                        <h2 className="text-2xl font-bold mb-6">What amenities do you offer?</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {ALL_AMENITIES.map(amenity => (
                                <label key={amenity} className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${state.amenities?.includes(amenity) ? 'bg-brand/10 text-brand border-brand' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>
                                    <input type="checkbox" checked={state.amenities?.includes(amenity)} onChange={() => dispatch({type: 'TOGGLE_AMENITY', amenity})} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-brand focus:ring-brand" />
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
                        <h2 className="text-2xl font-bold mb-4">Upload photos of your place</h2>
                        <p className="text-gray-400 mb-6">Start with a great cover photo. You can add up to 5 photos.</p>
                        <div className="p-6 border-2 border-dashed border-gray-700 rounded-lg text-center">
                            <input
                                type="file"
                                id="photo-upload"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={!canUploadMore}
                            />
                            <label htmlFor="photo-upload" className={`font-bold py-2 px-4 rounded-lg transition ${canUploadMore ? 'bg-brand text-gray-900 cursor-pointer hover:bg-brand-dark' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
                                {canUploadMore ? 'Upload Images' : 'Maximum photos reached'}
                            </label>
                            {isCategorizing && <p className="text-sm text-accent mt-2 text-center">✨ AI is categorizing your new photos...</p>}
                        </div>
                        {state.images && state.images.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold mb-2">Image Previews</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {state.images.map((img, index) => (
                                        <div key={img} className="relative group">
                                            <img src={img} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                                            <button 
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >&times;</button>
                                            {index === 0 && <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">Cover Photo</div>}
                                            {imageCategories[index] && (
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
                        <h2 className="text-2xl font-bold mb-6">Describe your place</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-medium text-gray-200">Title</label>
                                <div className="flex items-center space-x-2">
                                    <input type="text" placeholder="Catchy title for your property" value={state.title} onChange={e => dispatch({type: 'SET_FIELD', field: 'title', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                    <button onClick={handleSuggestTitle} disabled={isLoadingAI} className="bg-accent text-gray-900 font-semibold px-3 py-2 rounded-md text-sm shrink-0 hover:bg-accent-dark disabled:bg-opacity-60">✨ Suggest</button>
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium text-gray-200">Description</label>
                                <textarea rows={5} placeholder="A short description of your place" value={state.description} onChange={e => dispatch({type: 'SET_FIELD', field: 'description', value: e.target.value})} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                            </div>
                             <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                                 <label className="block font-medium text-accent">Host Notes for AI Co-Pilot</label>
                                 <p className="text-sm text-accent/80 mb-2">Help the AI write a better description. Mention unique features, nearby attractions, or rules. The AI will use this as its main source of information.</p>
                                 <textarea
                                    rows={4}
                                    placeholder="e.g., 'Highlight the sea view from the balcony. Mention the kitchen was recently renovated. Quiet neighborhood, not suitable for parties.'"
                                    value={hostNotes}
                                    onChange={e => setHostNotes(e.target.value)}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                                 />
                            </div>
                            <button onClick={handleGenerateDescription} disabled={isLoadingAI} className="mt-2 bg-accent text-gray-900 font-semibold px-3 py-2 rounded-md text-sm hover:bg-accent-dark disabled:bg-opacity-60">✨ Generate with AI</button>
                        </div>
                    </div>
                );
            case 5: // Price
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Set your price</h2>
                        <div>
                            <label className="block font-medium text-gray-200">Price per night (INR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                <input type="number" placeholder="5000" min="0" value={state.pricePerNight} onChange={e => dispatch({type: 'SET_FIELD', field: 'pricePerNight', value: Number(e.target.value)})} className="w-full p-2 pl-6 bg-gray-700 border border-gray-600 rounded-md" />
                            </div>
                             <button onClick={handleSuggestPrice} disabled={isLoadingAI} className="mt-4 bg-accent text-gray-900 font-semibold px-3 py-2 rounded-md text-sm hover:bg-accent-dark disabled:bg-opacity-60">✨ Suggest a competitive price</button>
                             {isLoadingAI && <p className="text-sm text-accent mt-2">AI is thinking...</p>}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-50">Become a host</h1>
            <p className="text-gray-400 mb-8">Let's get your place set up for guests.</p>

            <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg border border-gray-700">
                <ProgressBar step={step} totalSteps={5} />
                <div className="min-h-[400px]">
                    {renderStep()}
                </div>
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
                    <button onClick={prevStep} disabled={step === 1} className="text-gray-200 font-bold py-2 px-4 rounded disabled:opacity-50">Back</button>
                    {step < 5 ? (
                        <button onClick={nextStep} className="bg-brand text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-brand-dark">Next</button>
                    ) : (
                        <button onClick={handleSubmit} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">Publish Listing</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateListingPage;