import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, Minus, Star, Package } from 'lucide-react';

export function TopProductsTable({ topProducts }) {
  if (!topProducts || topProducts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold">No Product Data</h3>
        <p>No product profit data available for selected filters</p>
      </div>
    );
  }

  // Calculate summary stats
  const totalProfit = topProducts.reduce((sum, product) => sum + (parseFloat(product.profit) || 0), 0);
  const totalRevenue = topProducts.reduce((sum, product) => sum + (parseFloat(product.revenue) || 0), 0);
  const avgMargin = topProducts.length > 0 
    ? (topProducts.reduce((sum, product) => sum + (parseFloat(product.margin) || 0), 0) / topProducts.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-blue-600 mb-1">Total Products</div>
              <div className="text-2xl font-bold text-blue-700">{topProducts.length}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-green-600 mb-1">Total Profit</div>
              <div className="text-2xl font-bold text-green-700">
                LKR {totalProfit.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-purple-600 mb-1">Avg Margin</div>
              <div className="text-2xl font-bold text-purple-700">
                {avgMargin}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Product Details</TableHead>
              <TableHead className="text-right">Quantity Sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-center">Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProducts.map((product, index) => (
              <ProductRow 
                key={product.product_code || index} 
                product={product} 
                index={index}
                rank={index + 1}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <Star className="w-4 h-4" />
            Top Performing Product
          </h4>
          {topProducts.length > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{topProducts[0].product_name}</div>
                <div className="text-sm text-amber-600">Code: {topProducts[0].product_code}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-amber-700">
                  LKR {topProducts[0].profit.toLocaleString()}
                </div>
                <div className="text-sm text-amber-600">
                  {topProducts[0].margin}% margin
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <h4 className="font-semibold text-slate-800 mb-2">Product Range</h4>
          <div className="text-sm text-slate-600">
            <div className="flex justify-between mb-1">
              <span>Highest Margin:</span>
              <span className="font-medium">
                {Math.max(...topProducts.map(p => parseFloat(p.margin) || 0)).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Revenue from Top 10:</span>
              <span className="font-medium">
                LKR {totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, rank }) {
  const isProfitable = product.profit > 0;
  const margin = parseFloat(product.margin) || 0;
  
  // Determine margin category
  let marginCategory = 'low';
  let marginColor = 'text-red-600';
  let marginBg = 'bg-red-100';
  
  if (margin > 30) {
    marginCategory = 'excellent';
    marginColor = 'text-green-600';
    marginBg = 'bg-green-100';
  } else if (margin > 20) {
    marginCategory = 'good';
    marginColor = 'text-green-600';
    marginBg = 'bg-green-100';
  } else if (margin > 10) {
    marginCategory = 'average';
    marginColor = 'text-yellow-600';
    marginBg = 'bg-yellow-100';
  }

  // Determine rank badge color
  const rankColors = {
    1: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
    2: 'bg-gradient-to-r from-gray-300 to-gray-400 text-white',
    3: 'bg-gradient-to-r from-amber-600 to-orange-500 text-white'
  };

  const rankColor = rankColors[rank] || 'bg-gray-100 text-gray-800';

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      {/* Rank */}
      <TableCell className="text-center">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${rankColor} font-bold`}>
          {rank}
        </div>
      </TableCell>
      
      {/* Product Details */}
      <TableCell>
        <div>
          <div className="font-medium flex items-center gap-2">
            {product.product_name}
            {rank <= 3 && (
              <Badge variant="outline" className="text-xs">
                {rank === 1 ? '🏆 Best' : rank === 2 ? '🥈 2nd' : '🥉 3rd'}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
              {product.product_code || 'N/A'}
            </code>
            {marginCategory === 'excellent' && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                High Performer
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      
      {/* Quantity Sold */}
      <TableCell className="text-right">
        <div className="font-medium">{product.quantity_sold?.toLocaleString() || 0}</div>
        <div className="text-xs text-gray-500">
          {product.invoice_count || 0} invoices
        </div>
      </TableCell>
      
      {/* Revenue */}
      <TableCell className="text-right">
        <div className="font-medium">
          LKR {(product.revenue || 0).toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">
          Avg: LKR {product.quantity_sold > 0 ? 
            ((product.revenue || 0) / product.quantity_sold).toLocaleString(undefined, { minimumFractionDigits: 0 }) 
            : '0'}
        </div>
      </TableCell>
      
      {/* Profit */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {isProfitable ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <Badge variant={isProfitable ? 'default' : 'destructive'} className="min-w-[100px]">
            {isProfitable ? '+' : ''}LKR {(product.profit || 0).toLocaleString()}
          </Badge>
        </div>
      </TableCell>
      
      {/* Margin */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <div className={`px-2 py-1 rounded ${marginBg} ${marginColor} font-medium`}>
            {margin}%
          </div>
          <MarginBar margin={margin} />
        </div>
      </TableCell>
      
      {/* Performance */}
      <TableCell className="text-center">
        <PerformanceIndicator 
          profit={product.profit}
          margin={margin}
          quantity={product.quantity_sold}
        />
      </TableCell>
    </TableRow>
  );
}

function MarginBar({ margin }) {
  const width = Math.min(margin, 100);
  
  let barColor = 'bg-red-500';
  if (margin > 30) barColor = 'bg-green-500';
  else if (margin > 20) barColor = 'bg-green-400';
  else if (margin > 10) barColor = 'bg-yellow-500';
  
  return (
    <div className="w-20 bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function PerformanceIndicator({ profit, margin, quantity }) {
  // Calculate performance score (simplified)
  const profitScore = profit > 0 ? Math.min(profit / 10000, 1) * 40 : 0;
  const marginScore = Math.min(margin / 50, 1) * 40;
  const volumeScore = Math.min(quantity / 100, 1) * 20;
  const totalScore = profitScore + marginScore + volumeScore;
  
  let performance = 'Low';
  let color = 'text-red-600';
  let bg = 'bg-red-100';
  
  if (totalScore > 80) {
    performance = 'Excellent';
    color = 'text-green-600';
    bg = 'bg-green-100';
  } else if (totalScore > 60) {
    performance = 'Good';
    color = 'text-green-600';
    bg = 'bg-green-100';
  } else if (totalScore > 40) {
    performance = 'Average';
    color = 'text-yellow-600';
    bg = 'bg-yellow-100';
  }
  
  return (
    <div className="inline-flex flex-col items-center">
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
        {performance}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {totalScore.toFixed(0)}/100
      </div>
    </div>
  );
}

// Export for main component
export default TopProductsTable;