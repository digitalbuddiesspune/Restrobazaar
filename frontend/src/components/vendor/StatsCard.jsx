const StatsCard = ({ title, value, icon, trend, trendValue, color = 'blue', comparisonText = 'vs yesterday' }) => {
  // Define gradient classes and icon colors for each card type
  const cardStyles = {
    blue: {
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      shadow: 'hover:shadow-blue-500/30',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-100',
      bgIcon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      )
    },
    green: {
      gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
      shadow: 'hover:shadow-emerald-500/30',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-100',
      bgIcon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    orange: {
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      shadow: 'hover:shadow-orange-500/30',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-100',
      bgIcon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    red: {
      gradient: 'from-red-500 via-rose-600 to-pink-600',
      shadow: 'hover:shadow-red-500/30',
      iconColor: 'text-red-600',
      textColor: 'text-red-100',
      bgIcon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
  };

  const style = cardStyles[color] || cardStyles.blue;

  return (
    <div className={`relative group overflow-hidden bg-gradient-to-br ${style.gradient} rounded-2xl shadow-lg ${style.shadow} transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl`}>
      {/* Large background icon */}
      <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-500">
        {style.bgIcon}
      </div>
      
      {/* Card content */}
      <div className="relative p-2 sm:p-4 flex flex-row items-center gap-2 sm:gap-3 text-left">
        {/* White icon container */}
        <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-lg ring-1 sm:ring-2 ring-white/20 backdrop-blur-sm">
          <div className={`${style.iconColor}`}>
            {icon}
          </div>
        </div>
        
        {/* Text content */}
        <div className="flex flex-col flex-1">
          <p className={`${style.textColor} text-xs font-semibold tracking-wide`}>{title}</p>
          <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">{value || 0}</h3>
          {trend && (
            <div className="flex items-center mt-1">
              <span className={`text-xs font-semibold ${trend === 'up' ? 'text-white' : 'text-white/90'}`}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
              <span className={`${style.textColor} text-xs ml-1.5 opacity-90`}>{comparisonText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

