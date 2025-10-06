import React, { useState, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { View, Page } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import DashboardPage from './pages/DashboardPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import CreateListingPage from './pages/CreateListingPage';
import ManageListingPage from './pages/ManageListingPage';
import InboxPage from './pages/InboxPage';
import HostToolsPage from './pages/HostToolsPage';

const AppContent: React.FC = () => {
    const [view, setView] = useState<View>({ page: Page.HOME, params: {} });
    const { user } = useAuth();

    const navigate = useCallback((page: Page, params: Record<string, any> = {}) => {
        setView({ page, params });
        window.scrollTo(0, 0);
    }, []);

    const renderPage = useMemo(() => {
        switch (view.page) {
            case Page.HOME:
                return <HomePage navigate={navigate} />;
            case Page.SEARCH:
                return <SearchResultsPage navigate={navigate} initialFilters={view.params.filters} />;
            case Page.PROPERTY:
                return <PropertyDetailsPage navigate={navigate} propertyId={view.params.id as string} />;
            case Page.DASHBOARD:
                 if (!user) {
                    navigate(Page.HOME);
                    return null;
                }
                return <DashboardPage navigate={navigate} />;
            case Page.CONFIRMATION:
                return <BookingConfirmationPage navigate={navigate} bookingId={view.params.bookingId as string} />;
            case Page.CREATE_LISTING:
                if (!user || !user.isHost) {
                    navigate(Page.HOME);
                    return null;
                }
                return <CreateListingPage navigate={navigate} />;
            case Page.MANAGE_LISTING:
                if (!user || !user.isHost) {
                    navigate(Page.HOME);
                    return null;
                }
                return <ManageListingPage navigate={navigate} propertyId={view.params.id as string} />;
             case Page.INBOX:
                if (!user) {
                    navigate(Page.HOME);
                    return null;
                }
                return <InboxPage navigate={navigate} initialBookingId={view.params.bookingId as string} />;
            case Page.HOST_TOOLS:
                if (!user || !user.isHost) {
                    navigate(Page.HOME);
                    return null;
                }
                return <HostToolsPage navigate={navigate} />;
            default:
                return <HomePage navigate={navigate} />;
        }
    }, [view, navigate, user]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Header navigate={navigate} />
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