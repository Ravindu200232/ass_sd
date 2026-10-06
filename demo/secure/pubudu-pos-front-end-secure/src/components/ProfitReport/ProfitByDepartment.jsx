import React from 'react';
import { Badge } from '@/components/ui/badge';

export function ProfitByDepartment({ profitByDepartment }) {
  if (!profitByDepartment || profitByDepartment.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
            <svg 
              className="w-6 h-6 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold">No Department Data</h3>
        <p>No department-wise profit data available for selected filters</p>
      </div>
    );
  }

  // Calculate summary stats
  const profitableDepartments = profitByDepartment.filter(dept => dept.profit > 0).length;
  const topDepartmentMargin = Math.max(...profitByDepartment.map(dept => parseFloat(dept.margin) || 0)).toFixed(1);
  const maxRevenue = Math.max(...profitByDepartment.map(d => d.revenue));
  const maxCost = Math.max(...profitByDepartment.map(d => d.cost));

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="text-sm text-blue-600 mb-1">Total Departments</div>
          <div className="text-2xl font-bold text-blue-700">{profitByDepartment.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="text-sm text-green-600 mb-1">Profitable Departments</div>
          <div className="text-2xl font-bold text-green-700">
            {profitableDepartments}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="text-sm text-purple-600 mb-1">Top Department Margin</div>
          <div className="text-2xl font-bold text-purple-700">
            {topDepartmentMargin}%
          </div>
        </div>
      </div>

      {/* Department Cards */}
      {profitByDepartment.map((dept, index) => (
        <DepartmentCard 
          key={dept.department_id || index} 
          dept={dept} 
          maxRevenue={maxRevenue}
          maxCost={maxCost}
        />
      ))}
    </div>
  );
}

function DepartmentCard({ dept, maxRevenue, maxCost }) {
  const isProfitable = dept.profit > 0;
  const marginColor = dept.margin > 20 ? 'text-green-600' : dept.margin > 10 ? 'text-yellow-600' : 'text-red-600';
  const badgeColor = isProfitable ? 'default' : 'destructive';
  
  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
      {/* Header with department name and profit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isProfitable ? 'bg-green-100' : 'bg-red-100'}`}>
            <svg 
              className={`w-5 h-5 ${isProfitable ? 'text-green-600' : 'text-red-600'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
              />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{dept.department_name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">ID: {dept.department_id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isProfitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {dept.invoice_count} inv / {dept.grn_count} GRN
              </span>
            </div>
          </div>
        </div>
        
        <Badge variant={badgeColor} className="px-3 py-1.5 text-sm">
          <span className="font-bold">
            {isProfitable ? '+' : ''}LKR {Math.abs(dept.profit).toLocaleString()}
          </span>
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <StatItem 
          label="Revenue" 
          value={`LKR ${dept.revenue.toLocaleString()}`}
          colorClass="text-blue-600"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        
        <StatItem 
          label="Cost" 
          value={`LKR ${dept.cost.toLocaleString()}`}
          colorClass="text-red-600"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        
        <StatItem 
          label="Margin" 
          value={`${dept.margin}%`}
          colorClass={marginColor}
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
        
        <StatItem 
          label="Efficiency" 
          value={dept.revenue > 0 && dept.cost > 0 ? 
            `${((dept.revenue / dept.cost) * 100).toFixed(1)}%` : '0%'
          }
          colorClass={
            dept.revenue > 0 && dept.cost > 0 ? 
              (dept.revenue / dept.cost > 1.2 ? 'text-green-600' : 
               dept.revenue / dept.cost > 1 ? 'text-yellow-600' : 'text-red-600')
              : 'text-gray-400'
          }
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </div>

      {/* Progress Bars */}
      {maxRevenue > 0 && maxCost > 0 && (
        <div className="mt-4 space-y-2">
          <ProgressBar 
            label="Revenue" 
            value={dept.revenue} 
            maxValue={maxRevenue}
            color="bg-blue-500"
          />
          <ProgressBar 
            label="Cost" 
            value={dept.cost} 
            maxValue={maxCost}
            color="bg-red-500"
          />
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, colorClass, icon }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-gray-500 mb-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
        <span className="text-xs">{label}</span>
      </div>
      <div className={`font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
}

function ProgressBar({ label, value, maxValue, color }) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>LKR {value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Export for main component
export default ProfitByDepartment;