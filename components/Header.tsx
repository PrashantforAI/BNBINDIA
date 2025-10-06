import React, { useState, useRef, useEffect } from 'react';
import { NavigateFunction, Page } from '../types';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';

interface HeaderProps {
    navigate: NavigateFunction;
}

const Logo: React.FC<{ navigate: NavigateFunction }> = ({ navigate }) => (
    <div onClick={() => navigate(Page.HOME)} className="flex items-center space-x-3 cursor-pointer flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-10 h-10">
            <defs>
                <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" in="SourceGraphic" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <path 
                d="M83.75 45.42c0-14.8-11.95-26.75-26.75-26.75S30.25 30.62 30.25 45.42c0 10.9 6.55 20.25 15.75 24.5v11.33c0 1.25.9 2.25 2.1 2.25h1.9c1.2 0 2.1-.9 2.1-2.25V69.92c9.2-4.25 15.75-13.6 15.75-24.5zm-26.75 9.5c-5.25 0-9.5-4.25-9.5-9.5s4.25-9.5 9.5-9.5 9.5 4.25 9.5 9.5-4.25 9.5-9.5 9.5z" 
                fill="#00f6ff" 
                filter="url(#logo-glow)"
            />
            <path 
                d="M91.3,39.6,52.8,4.1c-1.6-1.5-4-1.5-5.6,0L8.7,39.6C7.5,40.7,7,42.2,7,43.8V89c0,4.4,3.6,8,8,8H85c4.4,0,8-3.6,8-8V43.8C93,42.2,92.5,40.7,91.3,39.6z M50,28c9.9,0,18,8.1,18,18s-8.1,18-18,18s-18-8.1-18-18S40.1,28,50,28z M85,89H15V43.8L50,11.5l35,32.3V89z" 
                fill="#00c7d4" 
            />
        </svg>
        <span className="text-2xl font-bold text-gray-50 hidden md:block tracking-tight">bnb India</span>
    </div>
);


const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
    </svg>
);


const UserMenu: React.FC<{ navigate: NavigateFunction }> = ({ navigate }) => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = (page: Page) => {
        navigate(page);
        setIsOpen(false);
    }
    
    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-2 rounded-full border border-gray-700 hover:bg-gray-800 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <img src={user?.avatarUrl || 'https://i.pravatar.cc/150?u=guest'} alt="User" className="w-8 h-8 rounded-full" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg z-20 py-2 border border-gray-700">
                    <a onClick={() => handleNavigate(Page.DASHBOARD)} className="block px-4 py-2 text-gray-200 hover:bg-gray-700 cursor-pointer">Dashboard</a>
                    <a onClick={() => handleNavigate(Page.INBOX)} className="block px-4 py-2 text-gray-200 hover:bg-gray-700 cursor-pointer">Inbox</a>
                    {user?.isHost && <a onClick={() => handleNavigate(Page.HOST_TOOLS)} className="block px-4 py-2 text-gray-200 hover:bg-gray-700 cursor-pointer">Host Tools</a>}
                    {!user?.isHost && <a className="block px-4 py-2 text-gray-200 hover:bg-gray-700 cursor-pointer">Become a Host</a>}
                    <div className="border-t my-2 border-gray-700"></div>
                    <a onClick={() => { logout(); setIsOpen(false); }} className="block px-4 py-2 text-gray-200 hover:bg-gray-700 cursor-pointer">Log out</a>
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleHeaderSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if(searchQuery.trim()){
            navigate(Page.SEARCH, { filters: { location: searchQuery.trim() }});
            setSearchQuery('');
        }
    }

    const renderHostNav = () => (
        <nav className="flex items-center space-x-6 text-sm font-medium text-gray-200">
            <a onClick={() => navigate(Page.DASHBOARD)} className="hover:text-brand cursor-pointer">Listings</a>
            <a onClick={() => navigate(Page.INBOX)} className="hover:text-brand cursor-pointer">Messages</a>
            <button onClick={() => navigate(Page.HOME)} className="border border-gray-700 px-4 py-2 rounded-full hover:bg-gray-800 transition">Switch to travelling</button>
        </nav>
    );

    const renderGuestNav = () => (
        <div className="hidden sm:block flex-1 max-w-lg mx-4">
            <form onSubmit={handleHeaderSearch} className="w-full">
                <div className="relative flex items-center text-gray-400 focus-within:text-gray-200">
                    <input 
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Start your search"
                        className="w-full pl-4 pr-12 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                     <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-brand text-white rounded-full hover:bg-brand-dark">
                        <SearchIcon className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );


    return (
        <>
            <header className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 p-4 border-b border-gray-700">
                <div className="container mx-auto flex justify-between items-center">
                    <Logo navigate={navigate} />

                    {user?.isHost ? renderHostNav() : renderGuestNav()}
                    
                    <div className="flex items-center space-x-4 flex-shrink-0">
                        {user ? (
                            <UserMenu navigate={navigate} />
                        ) : (
                             <nav className="flex items-center space-x-4">
                                <a className="font-medium text-gray-200 hover:text-brand hidden md:block cursor-pointer">Become a Host</a>
                                <button onClick={() => setIsLoginModalOpen(true)} className="bg-brand text-gray-900 px-4 py-2 rounded-full font-semibold hover:bg-brand-dark transition">
                                    Log in
                                </button>
                            </nav>
                        )}
                    </div>
                </div>
            </header>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
};

export default Header;