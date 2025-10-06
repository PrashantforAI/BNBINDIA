import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 border-t border-gray-700">
            <div className="container mx-auto py-8 px-4 text-center">
                <div className="flex justify-center space-x-6 mb-4 text-sm text-gray-400">
                    <a href="#" className="hover:underline hover:text-gray-200">About</a>
                    <a href="#" className="hover:underline hover:text-gray-200">Privacy</a>
                    <a href="#" className="hover:underline hover:text-gray-200">Terms</a>
                    <a href="#" className="hover:underline hover:text-gray-200">Help Centre</a>
                    <a href="#" className="hover:underline hover:text-gray-200">Destinations</a>
                </div>
                <div className="text-center text-gray-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} bnb India, Inc. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;