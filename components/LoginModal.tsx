import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { users, login, loading } = useAuth();

    if (!isOpen) return null;

    const handleLogin = (userId: string) => {
        login(userId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-xl border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-50">Log in</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="text-gray-400 mb-6">Select a profile to continue (demo):</p>
                {loading ? (
                    <p>Loading users...</p>
                ) : (
                    <div className="space-y-4">
                        {users.map(user => (
                            <div 
                                key={user.id} 
                                onClick={() => handleLogin(user.id)}
                                className="flex items-center space-x-4 p-3 border border-gray-700 rounded-lg hover:bg-gray-700 cursor-pointer transition"
                            >
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full"/>
                                <div>
                                    <p className="font-semibold text-gray-200">{user.name}</p>
                                    <p className="text-sm text-gray-400">{user.isHost ? 'Host & Guest' : 'Guest'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginModal;