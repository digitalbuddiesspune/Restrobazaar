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
  onYearChange = () => { },
  selectedGraphCity = '',
  onGraphCityChange = () => { }
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

            {/* Vendor Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Vendor:</label>
              <select
                value={filters.vendorId || ''}
                onChange={(e) => onFilterChange('vendorId', e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white min-w-[140px]"
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.businessName || vendor.legalName || vendor.email}
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
          <div className="relative group overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
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
          <div className="relative group overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-1">
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
          <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1">
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
          <div className="relative group overflow-hidden bg-gradient-to-br from-red-500 via-rose-600 to-pink-600 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 transform hover:-translate-y-1">
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
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1">
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
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1">
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
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1">
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
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1">
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
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1">
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
          onYearChange={onYearChange}
          cities={cities}
          selectedCity={selectedGraphCity}
          onCityChange={onGraphCityChange}
        />
      </div>
    </div>
  );
};

export default OverviewStats;
