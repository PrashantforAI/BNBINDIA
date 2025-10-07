import { GoogleGenAI, Type } from "@google/genai";
import { Property, Review, SearchFilters, Booking } from "../types";

// Ensure API_KEY is available, otherwise throw an error.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export const parseSearchQuery = async (query: string): Promise<Partial<SearchFilters>> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an intelligent search assistant for 'StayIn', a vacation rental website in India. Parse the following user query and extract location, dates, number of guests, and desired amenities. Today's date is ${new Date().toDateString()}. Dates should be in YYYY-MM-DD format. Assume the current year if not specified. Output a JSON object. Query: "${query}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        location: { type: Type.STRING, description: "City or area in India, e.g., 'Goa' or 'Lonavala'" },
                        checkIn: { type: Type.STRING, description: "Check-in date in YYYY-MM-DD format" },
                        checkOut: { type: Type.STRING, description: "Check-out date in YYYY-MM-DD format" },
                        guests: { type: Type.INTEGER, description: "Number of guests" },
                        amenities: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "List of requested amenities like 'pool', 'pet-friendly', etc."
                        }
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        const filters: Partial<SearchFilters> = {};
        if (parsed.location) filters.location = parsed.location;
        if (parsed.checkIn) filters.checkIn = new Date(parsed.checkIn);
        if (parsed.checkOut) filters.checkOut = new Date(parsed.checkOut);
        if (parsed.guests) filters.guests = Number(parsed.guests);
        if (parsed.amenities) filters.amenities = parsed.amenities.map((a: string) => a.toLowerCase());

        return filters;
    } catch (error) {
        console.error("Error parsing search query with Gemini:", error);
        return {};
    }
};

export const generateDescription = async (property: Partial<Property>, hostNotes?: string): Promise<string> => {
    let prompt: string;
    if (hostNotes && hostNotes.trim()) {
        prompt = `Generate a compelling and attractive property description for a vacation rental listing in India called 'StayIn'. Use the following host's notes as the primary source of truth: "${hostNotes}".
Also consider these property details to fill in any gaps:
- Property Type: ${property.type}
- Location: ${property.location?.city}
- Bedrooms: ${property.bedrooms}
- Amenities: ${property.amenities?.join(', ')}
The description should be warm, inviting, and under 150 words. Do not use markdown. Synthesize the notes and details into a cohesive, well-written paragraph.`;
    } else {
        prompt = `Generate a compelling and attractive property description for a vacation rental listing in India called 'StayIn'. The property is a ${property.type} with ${property.bedrooms} bedrooms, located in ${property.location?.city}. Highlight these amenities: ${property.amenities?.join(', ')}. The description should be warm, inviting, and under 150 words. Do not use markdown.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating description:", error);
        return "A beautiful property with amazing amenities. Book your stay now for an unforgettable experience!";
    }
};

export const categorizePropertyImages = async (base64Images: string[]): Promise<string[]> => {
    if (base64Images.length === 0) return [];

    const imageParts = base64Images.map(imgData => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: imgData,
        },
    }));

    const prompt = `You are an expert real estate photo analyst. For each of the following images, categorize it into one of these categories: Living Room, Bedroom, Kitchen, Bathroom, Exterior, Pool, Dining Area, Other.
    Return a JSON array of strings, where each string is the category for the corresponding image in the input array. There must be exactly ${base64Images.length} categories in the array.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [...imageParts, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const jsonText = response.text.trim();
        const categories = JSON.parse(jsonText);
        
        if (Array.isArray(categories) && categories.length === base64Images.length) {
            return categories;
        } else {
            console.error("Mismatch in number of images and categories returned by AI. Expected", base64Images.length, "got", categories.length);
            return base64Images.map(() => 'Other');
        }
    } catch (error) {
        console.error("Error categorizing images:", error);
        return base64Images.map(() => 'Other');
    }
};


export const summarizeReviews = async (reviews: Review[]): Promise<string> => {
     if (reviews.length === 0) return "No reviews yet. Be the first to stay and share your experience!";
    
    const prompt = `Summarize the following reviews for a vacation rental. Identify the main positive and negative themes mentioned by guests. Provide the output as a single block of text formatted with HTML. Start with a summary paragraph in a <p> tag. Then, create a <h2>Pros</h2> heading followed by a <ul> list of a few positive points. After that, create a <h2>Cons</h2> heading followed by a <ul> list of a few negative points. Reviews:\n${reviews.map(r => `- ${r.comment}`).join('\n')}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing reviews:", error);
        return "<p>Could not summarize reviews at this time.</p>";
    }
};

export const suggestTitle = async (type: string, city: string): Promise<string> => {
    const prompt = `Generate a short, catchy, and appealing title for a vacation rental listing. The property is a '${type}' located in '${city}', India. The title should be under 10 words. Examples: 'Serene Villa with Private Pool', 'Chic Urban Loft in Bandra'.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.replace(/["']/g, ""); // Remove quotes from the response
    } catch (error) {
        console.error("Error suggesting title:", error);
        return `A lovely ${type} in ${city}`;
    }
};

export const suggestPrice = async (property: Partial<Property>): Promise<number> => {
    const prompt = `Based on the following vacation rental details in India, suggest a competitive price per night in Indian Rupees (INR).
- Property Type: ${property.type}
- Location: ${property.location?.city}
- Guests: ${property.maxGuests}
- Bedrooms: ${property.bedrooms}
- Amenities: ${property.amenities?.join(', ')}
Return only a single number representing the price, without any currency symbols or text. For example: 8500`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const priceText = response.text.trim();
        const price = parseInt(priceText, 10);
        return isNaN(price) ? 5000 : Math.round(price / 100) * 100; // Return a default or rounded price
    } catch (error) {
        console.error("Error suggesting price:", error);
        return 5000; // Default price on error
    }
};

export const suggestMessageReply = async (message: string, propertyTitle: string): Promise<string[]> => {
    const prompt = `You are a helpful and friendly host assistant for a vacation rental platform. A guest sent the following message regarding the property '${propertyTitle}': '${message}'.
Generate 3 short, distinct, and helpful reply suggestions a host could send. Each suggestion should be a complete, self-contained response.
Output a JSON array of strings.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error suggesting message replies:", error);
        return ["Sorry, I can't generate suggestions right now."];
    }
};

export const generatePerformanceInsights = async (properties: Property[], reviews: Review[]): Promise<string[]> => {
    const prompt = `You are an expert vacation rental analyst. Analyze the following data for a host's listings and reviews in India. Provide 3 actionable, data-driven insights to help them improve their performance. Focus on pricing, amenities, and guest feedback. Each insight should be a short, clear sentence. Output a JSON array of strings.
Data:
Properties: ${JSON.stringify(properties.map(p => ({ title: p.title, price: p.pricePerNight, rating: p.rating, city: p.location.city, amenities: p.amenities })))}
Reviews: ${JSON.stringify(reviews.map(r => r.comment))}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating performance insights:", error);
        return ["Could not generate insights at this time. Please try again later."];
    }
};

export const draftReviewResponse = async (review: Review, propertyTitle: string): Promise<string> => {
    const prompt = `You are a friendly and professional host. A guest left the following review for your property '${propertyTitle}':
Rating: ${review.rating}/5
Comment: '${review.comment}'

Draft a warm, polite, and personalized response to this review. If it's positive, express gratitude and invite them back. If it's negative or mixed, acknowledge their feedback gracefully and mention you'll look into the issues. The response should be a single paragraph. Do not use markdown.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error drafting review response:", error);
        return "Thank you for your feedback. We appreciate you taking the time to share your experience.";
    }
};

export const moderateMessage = async (text: string): Promise<{ compliant: boolean; reason: string }> => {
    const prompt = `You are a content moderator for a vacation rental platform's chat feature. Your role is to ensure that users do not share contact information or external links to communicate outside the platform.
    Analyze the following message and determine if it violates our policies.
    Policies:
    1.  Do not allow phone numbers (e.g., 9876543210, 987-654-3210, +91 98765 43210).
    2.  Do not allow email addresses (e.g., user@example.com).
    3.  Do not allow social media handles or links (e.g., @myprofile, instagram.com/user).
    4.  Do not allow any external URLs or links (e.g., http://, www., .com, .in).

    Message to analyze: "${text}"

    Return a JSON object indicating if the message is compliant. If it is not compliant, provide a brief, user-friendly reason.
    - If compliant, return {"compliant": true, "reason": ""}.
    - If not compliant, return {"compliant": false, "reason": "Your message was blocked because it appears to contain contact information or an external link. Please remove it and try again."}.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        compliant: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error moderating message:", error);
        // Fail safe: if moderation fails, assume it's compliant to not block users unnecessarily.
        return { compliant: true, reason: "" };
    }
};

export const suggestPricingStrategy = async (property: Property, bookings: Booking[]): Promise<string> => {
    const prompt = `You are an expert vacation rental pricing analyst for the Indian market.
    Analyze the following property and its booking data to provide 3 actionable pricing suggestions.
    Consider weekends, upcoming holidays in India (like Diwali, Christmas, New Year), and seasonality.
    Keep suggestions brief and clear. Output should be a single block of text formatted with HTML, with each suggestion in a <li> tag inside a <ul>.

    Property Details:
    - Type: ${property.type}
    - Location: ${property.location.city}, ${property.location.state}
    - Base Price: ₹${property.pricePerNight}/night
    - Amenities: ${property.amenities.join(', ')}
    - Max Guests: ${property.maxGuests}

    Existing Bookings:
    ${bookings.map(b => `- ${b.startDate.toISOString().split('T')[0]} to ${b.endDate.toISOString().split('T')[0]}`).join('\n')}

    Example output: "<ul><li>Increase weekend prices by 20% as demand is higher.</li><li>Consider a 15% price hike for the Christmas and New Year period.</li><li>Offer a 10% discount for weekday stays longer than 3 nights to improve occupancy.</li></ul>"
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error suggesting pricing strategy:", error);
        return "<ul><li>Could not generate suggestions at this time.</li></ul>";
    }
};