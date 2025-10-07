import React from 'react';
import { NavigateFunction, Page } from '../types';

interface HostDashboardLayoutProps {
    navigate: NavigateFunction;
    currentPage: Page;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
    navigate: NavigateFunction;
    page: Page;
    currentPage: Page;
    children: React.ReactNode;
    icon: React.ReactNode;
}> = ({ navigate, page, currentPage, children, icon }) => {
    const isActive = currentPage === page;
    return (
        <a
            onClick={() => navigate(page)}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                isActive ? 'bg-brand text-gray-900 font-bold' : 'text-gray-200 hover:bg-gray-700'
            }`}
        >
            {icon}
            <span>{children}</span>
        </a>
    );
};

// SVG Icons
const TodayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const ListingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4.118 8.882A1 1 0 015 8h10a1 1 0 01.882.882V14a1 1 0 01-1 1H5a1 1 0 01-1-.882V8.882z" clipRule="evenodd" /></svg>;
const ReservationsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd" /></svg>;
const InsightsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a1 1 0 100 2h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 011-1h1a1 1 0 100-2H6a1 1 0 01-1-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" /></svg>;
const EarningsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.552-.257m.046 4.721a.75.75 0 00-.705-1.742a.75.75 0 00-.705 1.742m.705 1.742a.75.75 0 00.705-1.742a.75.75 0 00-.705 1.742m0 1.742a.75.75 0 00.705-1.742a.75.75 0 00-.705 1.742M10 20a10 10 0 100-20 10 10 0 000 20zM7 13a1 1 0 100-2 1 1 0 000 2zm.002-4a1 1 0 100 2 1 1 0 000-2zm3.996-1a1 1 0 100 2 1 1 0 000-2zm1.996 4a1 1 0 100-2 1 1 0 000 2z" /></svg>;

const HostDashboardLayout: React.FC<HostDashboardLayoutProps> = ({ navigate, currentPage, isOpen, setIsOpen }) => {
    return (
        <>
        {/* Overlay for mobile */}
        <div 
            className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
        ></div>
        <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-gray-800 p-4 flex-shrink-0 flex flex-col border-r border-gray-700 z-30 transform transition-transform lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
             <div onClick={() => navigate(Page.HOME)} className="flex items-center space-x-2 cursor-pointer flex-shrink-0 px-2 mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8">
                    <defs><filter id="logo-glow-sidebar"><feGaussianBlur stdDeviation="3.5" result="coloredBlur" in="SourceGraphic" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                    <path d="M91.3,39.6,52.8,4.1c-1.6-1.5-4-1.5-5.6,0L8.7,39.6C7.5,40.7,7,42.2,7,43.8V89c0,4.4,3.6,8,8,8H85c4.4,0,8-3.6,8-8V43.8C93,42.2,92.5,40.7,91.3,39.6z M50,28c9.9,0,18,8.1,18,18s-8.1,18-18,18s-18-8.1-18-18S40.1,28,50,28z M85,89H15V43.8L50,11.5l35,32.3V89z" fill="#00c7d4" />
                </svg>
                <span className="text-xl font-bold text-gray-50 tracking-tight">bnb India</span>
            </div>
            <nav className="flex-grow space-y-2">
                <NavLink navigate={navigate} page={Page.HOST_TODAY} currentPage={currentPage} icon={<TodayIcon />}>Today</NavLink>
                <NavLink navigate={navigate} page={Page.HOST_LISTINGS} currentPage={currentPage} icon={<ListingsIcon />}>Listings</NavLink>
                <NavLink navigate={navigate} page={Page.HOST_CALENDAR} currentPage={currentPage} icon={<CalendarIcon />}>Calendar</NavLink>
                <NavLink navigate={navigate} page={Page.HOST_RESERVATIONS} currentPage={currentPage} icon={<ReservationsIcon />}>Reservations</NavLink>
                <NavLink navigate={navigate} page={Page.HOST_INSIGHTS} currentPage={currentPage} icon={<InsightsIcon />}>Insights</NavLink>
                <NavLink navigate={navigate} page={Page.HOST_EARNINGS} currentPage={currentPage} icon={<EarningsIcon />}>Earnings</NavLink>
            </nav>
            <div className="mt-auto">
                 <button onClick={() => navigate(Page.HOME)} className="w-full text-center border border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm font-medium">
                    Switch to travelling
                 </button>
            </div>
        </aside>
        </>
    );
};

export default HostDashboardLayout;