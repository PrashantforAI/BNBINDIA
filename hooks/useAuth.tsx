
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
    user: User | null;
    users: User[];
    login: (userId: string) => void;
    logout: () => void;
    loading: boolean;
    toggleWishlist: (propertyId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const allUsers = await dataService.getUsers();
            setUsers(allUsers);
            
            const storedUserId = localStorage.getItem('stayin-userid');
            if (storedUserId) {
                const loggedInUser = allUsers.find(u => u.id === storedUserId);
                if (loggedInUser) {
                    setUser(loggedInUser);
                }
            }
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const login = (userId: string) => {
        const userToLogin = users.find(u => u.id === userId);
        if (userToLogin) {
            setUser(userToLogin);
            localStorage.setItem('stayin-userid', userId);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('stayin-userid');
    };

    const toggleWishlist = (propertyId: string) => {
        if (!user) return;

        setUser(currentUser => {
            if (!currentUser) return null;
            const newWishlist = currentUser.wishlist.includes(propertyId)
                ? currentUser.wishlist.filter(id => id !== propertyId)
                : [...currentUser.wishlist, propertyId];
            
            // In a real app, you'd also make an API call here to update the backend.
            return { ...currentUser, wishlist: newWishlist };
        });
    };

    return (
        <AuthContext.Provider value={{ user, users, login, logout, loading, toggleWishlist }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
