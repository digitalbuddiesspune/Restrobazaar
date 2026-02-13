import OrdersGraph from "./OrdersGraph";

const OverviewStats = ({
  stats,
  todayOrdersStats = { total: 0, pending: 0, delivered: 0, cancelled: 0 },
  filters = { cityId: '', vendorId: '' },
  onFilterChange = () => { },
  onResetFilters = () => { },
  cities = [],
  vendors = [],
  monthlyOrdersData = [],
  selectedYear = new Date().getFullYear(),
  selectedMonth = new Date().getMonth(),
  onYearChange = () => { },
  onMonthChange = () => { },
  selectedGraphCity = '',
  onGraphCityChange = () => { },

  pendingOrders = [],
  pendingStartDate = '',
  setPendingStartDate = () => { },
  pendingEndDate = '',
  setPendingEndDate = () => { },
  pendingCity = '',
  setPendingCity = () => { },
  onClearPendingFilters = () => { },
  onCardClick = () => { },
  onOrderCardClick = () => { }
}) => {
  return (
    <div className="space-y-6">
      {/* Today's Orders Statistics */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Today's Orders</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            {/* Service City Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Service City:</label>
              <select
                value={filters.cityId || ''}
                onChange={(e) => onFilterChange('cityId', e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white min-w-[140px]"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city._id} value={city._id}>
                    {city.displayName || city.name}{city.state ? `, ${city.state}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            {(filters.cityId || filters.vendorId) && (
              <button
                onClick={onResetFilters}
                className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded-lg transition-colors whitespace-nowrap"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Today's Total Orders */}
          <div 
            onClick={() => onOrderCardClick(null)}
            className="relative group overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-500">
              <svg className="w-24 h-24 sm:w-32 sm:h-32 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="relative p-3 sm:p-6 flex flex-row items-center gap-3 sm:gap-5 text-left">
              <div className="p-2 sm:p-3 bg-white rounded-xl shadow-lg ring-2 sm:ring-4 ring-white/20 backdrop-blur-sm">
                <svg className="w-5 h-5 sm:w-8 sm:h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-blue-100 text-xs sm:text-sm font-semibold tracking-wide">Total</p>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">{todayOrdersStats.total || 0}</h3>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div 
            onClick={() => onOrderCardClick('pending')}
            className="relative group overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-500">
              <svg className="w-24 h-24 sm:w-32 sm:h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="relative p-3 sm:p-6 flex flex-row items-center gap-3 sm:gap-5 text-left">
              <div className="p-2 sm:p-3 bg-white rounded-xl shadow-lg ring-2 sm:ring-4 ring-white/20 backdrop-blur-sm">
                <svg className="w-5 h-5 sm:w-8 sm:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-orange-100 text-xs sm:text-sm font-semibold tracking-wide">Pending</p>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">{todayOrdersStats.pending || 0}</h3>
              </div>
            </div>
          </div>

          {/* Delivered Orders */}
          <div 
            onClick={() => onOrderCardClick('delivered')}
            className="relative group overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-500">
              <svg className="w-24 h-24 sm:w-32 sm:h-32 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="relative p-3 sm:p-6 flex flex-row items-center gap-3 sm:gap-5 text-left">
              <div className="p-2 sm:p-3 bg-white rounded-xl shadow-lg ring-2 sm:ring-4 ring-white/20 backdrop-blur-sm">
                <svg className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-emerald-100 text-xs sm:text-sm font-semibold tracking-wide">Delivered</p>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">{todayOrdersStats.delivered || 0}</h3>
              </div>
            </div>
          </div>

          {/* Cancelled Orders */}
          <div 
            onClick={() => onOrderCardClick('cancelled')}
            className="relative group overflow-hidden bg-gradient-to-br from-red-500 via-rose-600 to-pink-600 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-500">
              <svg className="w-24 h-24 sm:w-32 sm:h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="relative p-3 sm:p-6 flex flex-row items-center gap-3 sm:gap-5 text-left">
              <div className="p-2 sm:p-3 bg-white rounded-xl shadow-lg ring-2 sm:ring-4 ring-white/20 backdrop-blur-sm">
                <svg className="w-5 h-5 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-red-100 text-xs sm:text-sm font-semibold tracking-wide">Cancelled</p>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">{todayOrdersStats.cancelled || 0}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* General Statistics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">General Statistics</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
          {/* Total Products */}
          <div 
            onClick={() => onCardClick('products')}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex flex-row items-center gap-3 sm:gap-4 text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Products</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{stats.products}</h3>
              </div>
            </div>
          </div>

          {/* Total Cities */}
          <div 
            onClick={() => onCardClick('cities')}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex flex-row items-center gap-3 sm:gap-4 text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Cities</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{stats.cities}</h3>
              </div>
            </div>
          </div>

          {/* Total Categories */}
          <div 
            onClick={() => onCardClick('categories')}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex flex-row items-center gap-3 sm:gap-4 text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Categories</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{stats.categories}</h3>
              </div>
            </div>
          </div>

          {/* Total Vendors */}
          <div 
            onClick={() => onCardClick('vendors')}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex flex-row items-center gap-3 sm:gap-4 text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Vendors</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{stats.vendors}</h3>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div 
            onClick={() => onCardClick('users')}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex flex-row items-center gap-3 sm:gap-4 text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Users</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{stats.users || 0}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Orders Graph */}
      <div>
        <OrdersGraph
          ordersData={monthlyOrdersData}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={onYearChange}
          onMonthChange={onMonthChange}
          cities={cities}
          selectedCity={selectedGraphCity}
          onCityChange={onGraphCityChange}
        />
      </div>

      {/* Unpaid Orders Table - by payment status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">Unpaid Orders</h2>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                {pendingOrders.length}
              </span>
            </div>
            <p className="text-sm text-gray-500 hidden sm:block">Orders with unpaid payment status</p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 w-full sm:w-auto mt-4 md:mt-0">
            {/* City Filter */}
            <select
              value={pendingCity}
              onChange={(e) => setPendingCity(e.target.value)}
              className="col-span-2 sm:w-auto px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:focus:border-amber-500 transition-all cursor-pointer min-w-[120px]"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city._id} value={city._id}>{city.name}</option>
              ))}
            </select>

            {/* Date Filters */}
            <input
              type="date"
              value={pendingStartDate}
              onChange={(e) => setPendingStartDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
              placeholder="Start Date"
            />
            <span className="hidden sm:inline text-gray-400">-</span>
            <input
              type="date"
              value={pendingEndDate}
              onChange={(e) => setPendingEndDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
              placeholder="End Date"
            />

            {(pendingCity || pendingStartDate || pendingEndDate) && (
              <button
                onClick={onClearPendingFilters}
                className="col-span-2 sm:col-span-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 w-full sm:w-auto"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">User ID</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Mobile</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-xs text-gray-500">
                    No unpaid orders found
                  </td>
                </tr>
              ) : (
                pendingOrders.map((order) => (
                  <tr key={order._id || order.order_id} className="hover:bg-gray-50 transition-colors even:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 leading-tight">#{(() => {
                        const orderId = order.order_id || order._id || 'N/A';
                        if (!orderId || orderId === 'N/A') return 'N/A';
                        const idString = String(orderId);
                        return idString.length > 6 ? idString.slice(-6) : idString;
                      })()}</span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="text-sm text-gray-500 leading-tight">{(() => {
                        const userId = order.userId?._id || order.userId || 'N/A';
                        if (!userId || userId === 'N/A') return 'N/A';
                        const idString = String(userId);
                        return idString.length > 6 ? idString.slice(-6) : idString;
                      })()}</span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs mr-3">
                          {(order.Customer_Name || order.userId?.name || 'U').charAt(0)}
                        </div>
                        <div className="text-sm font-medium text-gray-900 leading-tight">{order.Customer_Name || order.userId?.name || 'Unknown'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 leading-tight">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {order.Customer_Mobile_No || order.userId?.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 leading-tight">₹{order.Net_total || order.totalAmount || 0}</span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 leading-tight">
                      {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                        {order.Order_status || order.orderStatus || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewStats;
