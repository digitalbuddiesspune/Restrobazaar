import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const OrdersGraph = ({ ordersData, selectedYear, onYearChange, cities = [], selectedCity, onCityChange }) => {
    // Generate last 5 years
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg mt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Order Statistics {selectedYear}</h2>
                    <p className="text-sm text-gray-400 mt-1">Monthly order volume overview - {selectedYear}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* City Filter */}
                    <select
                        value={selectedCity}
                        onChange={(e) => onCityChange(e.target.value)}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-w-[120px]"
                    >
                        <option value="">All Cities</option>
                        {cities.map(city => (
                            <option key={city._id} value={city._id}>{city.name}</option>
                        ))}
                    </select>

                    {/* Year Filter */}
                    <select
                        value={selectedYear}
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Orders
                    </div>
                </div>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={ordersData}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                            dx={-10}
                            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                padding: '12px 16px'
                            }}
                            itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                            labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
                        />
                        <Bar
                            dataKey="orders"
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                            barSize={40}
                            animationDuration={1500}
                        >
                            {/* Optional: Add gradient or custom shape if needed, but solid color is clean */}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default OrdersGraph;
