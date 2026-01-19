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

const OrdersGraph = ({ 
    ordersData, 
    selectedYear, 
    onYearChange, 
    cities = [], 
    selectedCity, 
    onCityChange,
    yAxisTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    yAxisDomain = [0, 100]
}) => {
    // Generate last 5 years
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 p-6 rounded-2xl shadow-lg border border-gray-200/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl mt-8 relative overflow-hidden">
            {/* Premium decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-indigo-100/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-100/20 to-purple-100/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Order Statistics {selectedYear}</h2>
                        <p className="text-sm text-gray-500 mt-1">Monthly order volume overview - {selectedYear}</p>
                    </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* City Filter - Only show if cities are provided */}
                    {cities && cities.length > 0 && (
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
                    )}

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
            </div>
            <div className="relative z-10 h-[350px] w-full bg-gradient-to-b from-white/50 via-transparent to-white/30 rounded-xl p-4 backdrop-blur-sm">
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
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                <stop offset="50%" stopColor="#4f46e5" stopOpacity={1} />
                                <stop offset="100%" stopColor="#4338ca" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="#e2e8f0" 
                            vertical={false}
                            strokeOpacity={0.6}
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                            dx={-10}
                            ticks={yAxisTicks}
                            domain={yAxisDomain}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(99, 102, 241, 0.1)', stroke: '#6366f1', strokeWidth: 1 }}
                            contentStyle={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                padding: '12px 16px',
                                backdropFilter: 'blur(10px)'
                            }}
                            itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                            labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
                        />
                        <Bar
                            dataKey="orders"
                            fill="url(#barGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={42}
                            animationDuration={1500}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default OrdersGraph;
