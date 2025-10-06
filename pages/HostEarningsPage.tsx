import React, { useMemo } from 'react';
import { NavigateFunction, Page } from '../types';

interface HostEarningsPageProps {
    navigate: NavigateFunction;
}

// Mock data for demonstration
const MOCK_TRANSACTIONS = [
    { id: 'txn1', date: '2024-07-15', type: 'Payout', amount: 45125, status: 'Paid', listing: 'Serene Villa' },
    { id: 'txn2', date: '2024-07-10', type: 'Reservation', amount: 30400, status: 'Upcoming', listing: 'Chic Urban Loft' },
    { id: 'txn3', date: '2024-07-01', type: 'Payout', amount: 89300, status: 'Paid', listing: 'Luxury Beachfront' },
    { id: 'txn4', date: '2024-06-25', type: 'Reservation', amount: 12000, status: 'Completed', listing: 'Tech Hub Penthouse' },
];

const MOCK_EARNINGS_CHART_DATA = [
    { month: 'Jan', earnings: 75000 }, { month: 'Feb', earnings: 88000 }, { month: 'Mar', earnings: 62000 },
    { month: 'Apr', earnings: 110000 }, { month: 'May', earnings: 95000 }, { month: 'Jun', earnings: 130000 },
];

const EarningsChart: React.FC<{ data: { month: string, earnings: number }[] }> = ({ data }) => {
    const maxEarning = useMemo(() => Math.max(...data.map(d => d.earnings)), [data]);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="font-bold text-lg mb-4 text-gray-50">Earnings Overview</h3>
            <div className="flex h-64 items-end space-x-4">
                {data.map(d => (
                    <div key={d.month} className="flex-1 flex flex-col items-center justify-end">
                        <div 
                            className="w-full bg-brand rounded-t-md hover:opacity-80 transition-all"
                            style={{ height: `${(d.earnings / maxEarning) * 100}%` }}
                        ></div>
                        <span className="text-xs text-gray-400 mt-2">{d.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HostEarningsPage: React.FC<HostEarningsPageProps> = ({ navigate }) => {
    const totalPaid = MOCK_TRANSACTIONS.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
    const upcomingPayout = MOCK_TRANSACTIONS.filter(t => t.status === 'Upcoming').reduce((sum, t) => sum + t.amount, 0);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-50 mb-6">Earnings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm">Total paid out</p>
                    <p className="text-3xl font-bold text-gray-50 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm">Upcoming payout</p>
                    <p className="text-3xl font-bold text-gray-50 mt-1">₹{upcomingPayout.toLocaleString('en-IN')}</p>
                </div>
            </div>

            <EarningsChart data={MOCK_EARNINGS_CHART_DATA} />

            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-50 mb-4">Transaction History</h2>
                 <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-200 sm:pl-6">Date</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">Type</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">Details</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 bg-gray-800/50">
                                {MOCK_TRANSACTIONS.map((txn) => (
                                    <tr key={txn.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-400 sm:pl-6">{txn.date}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{txn.type}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{txn.listing}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-200">₹{txn.amount.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HostEarningsPage;
