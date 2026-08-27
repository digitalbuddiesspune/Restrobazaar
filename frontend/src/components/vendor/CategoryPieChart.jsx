import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#4f46e5',
  '#db2777',
  '#64748b',
];

const CategoryPieChart = ({ data = [], title = 'Products by Category' }) => {
  const chartData = (data || [])
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl shadow-lg border border-gray-200/50 backdrop-blur-sm p-5 h-full flex flex-col min-h-[420px] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/20 to-indigo-100/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="relative z-10 mb-3 shrink-0">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {total} product{total === 1 ? '' : 's'} across {chartData.length} categor
          {chartData.length === 1 ? 'y' : 'ies'}
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="relative z-10 flex-1 flex items-center justify-center text-sm text-gray-500">
          No product category data available
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="42%"
                  outerRadius="68%"
                  paddingAngle={2}
                  labelLine={false}
                  label={({ percent, cx, cy, midAngle, outerRadius }) => {
                    if (percent < 0.08) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius * 0.72;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#fff"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={700}
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} product${value === 1 ? '' : 's'}`,
                    name,
                  ]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100/80 shrink-0">
            <ul className="grid grid-cols-1 gap-1.5 max-h-28 overflow-y-auto pr-1">
              {chartData.map((entry, index) => {
                const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                return (
                  <li
                    key={entry.name}
                    className="flex items-center justify-between gap-2 text-xs text-gray-700"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate font-medium" title={entry.name}>
                        {entry.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-gray-500 tabular-nums">
                      {entry.value} ({pct}%)
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPieChart;
