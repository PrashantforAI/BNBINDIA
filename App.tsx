import React, { useState, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { View, Page, HOST_PAGES } from './types';

// Guest Pages
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import DashboardPage from './pages/DashboardPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import InboxPage from './pages/InboxPage';
import HostProfilePage from './pages/HostProfilePage';


// Host Pages & Layout
import HostDashboardLayout from './components/HostDashboardLayout';
import HostDashboardPage from './pages/HostDashboardPage';
import HostListingsPage from './pages/HostListingsPage';
import HostCalendarPage from './pages/HostCalendarPage';
import HostReservationsPage from './pages/HostReservationsPage';
import HostInsightsPage from './pages/HostInsightsPage';
import HostEarningsPage from './pages/HostEarningsPage';
import CreateListingPage from './pages/CreateListingPage';
import ManageListingPage from './pages/ManageListingPage';
import EditListingPage from './pages/EditListingPage';

const AppContent: React.FC = () => {
    const [view, setView] = useState<View>({ page: Page.HOME, params: {} });
    const { user } = useAuth();
    const [isHostSidebarOpen, setIsHostSidebarOpen] = useState(false);

    const navigate = useCallback((page: Page, params: Record<string, any> = {}) => {
        setView({ page, params });
        window.scrollTo(0, 0);
        setIsHostSidebarOpen(false); // Close sidebar on navigation
    }, []);

    const isHostView = useMemo(() => user?.isHost && HOST_PAGES.includes(view.page), [user, view.page]);

    const renderPage = useMemo(() => {
        const props = { navigate, ...view.params };
        switch (view.page) {
            // Guest Pages
            case Page.HOME: return <HomePage {...props} />;
            case Page.SEARCH: return <SearchResultsPage navigate={navigate} initialFilters={view.params.filters} />;
            case Page.PROPERTY: return <PropertyDetailsPage navigate={navigate} propertyId={view.params.id as string} offerPrice={view.params.offerPrice as number | undefined} />;
            case Page.DASHBOARD: return <DashboardPage {...props} />;
            case Page.CONFIRMATION: return <BookingConfirmationPage navigate={navigate} bookingId={view.params.bookingId as string} />;
            case Page.INBOX: return <InboxPage navigate={navigate} initialConversationId={view.params.conversationId as string} />;
            case Page.HOST_PROFILE: return <HostProfilePage navigate={navigate} hostId={view.params.hostId as string} />;

            // Host Pages
            case Page.HOST_TODAY: return <HostDashboardPage {...props} />;
            case Page.HOST_LISTINGS: return <HostListingsPage {...props} />;
            case Page.HOST_CALENDAR: return <HostCalendarPage {...props} />;
            case Page.HOST_RESERVATIONS: return <HostReservationsPage {...props} />;
            case Page.HOST_INSIGHTS: return <HostInsightsPage {...props} />;
            case Page.HOST_EARNINGS: return <HostEarningsPage {...props} />;
            case Page.CREATE_LISTING: return <CreateListingPage {...props} />;
            case Page.MANAGE_LISTING: return <ManageListingPage navigate={navigate} propertyId={view.params.id as string} />;
            case Page.EDIT_LISTING: return <EditListingPage navigate={navigate} propertyId={view.params.id as string} />;

            default: return <HomePage navigate={navigate} />;
        }
    }, [view, navigate]);
    
    // Redirect logic
    useMemo(() => {
        const isProtectedHostPage = HOST_PAGES.includes(view.page);
        const isProtectedGuestPage = [Page.DASHBOARD, Page.INBOX, Page.CONFIRMATION].includes(view.page);

        if ((isProtectedHostPage && !user?.isHost) || (isProtectedGuestPage && !user)) {
            navigate(Page.HOME);
        }
    }, [view.page, user, navigate]);


    if (isHostView) {
        return (
             <div className="flex min-h-screen bg-gray-900 text-gray-200 font-sans">
                <HostDashboardLayout navigate={navigate} currentPage={view.page} isOpen={isHostSidebarOpen} setIsOpen={setIsHostSidebarOpen} />
                <main className="flex-grow p-4 md:p-8 overflow-auto">
                    {renderPage}
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Header navigate={navigate} currentPage={view.page} onMenuClick={() => setIsHostSidebarOpen(true)} />
            <main className="flex-grow">
                {renderPage}
            </main>
            <Footer />
        </div>
    );
};

const App: React.FC = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;