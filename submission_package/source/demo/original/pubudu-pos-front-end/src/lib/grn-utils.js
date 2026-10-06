// lib/grn-utils.js
import api from './api';

/**
 * Get stock price from latest GRN for a product
 * @param {string} productCode - Product code to search for
 * @returns {Promise<Object|null>} Latest GRN item data or null
 */
export async function getLatestGRNStockPrice(productCode) {
  try {
    // Fetch all GRNs with items
    const response = await api.get('/grns', {
      params: {
        'with_items': 1,
        'per_page': 1000 // Get enough to search through
      }
    });
    
    if (response.data.success && response.data.data) {
      const grns = response.data.data;
      
      // Flatten all GRN items and filter by product code
      let allItems = [];
      
      grns.forEach(grn => {
        if (grn.items && Array.isArray(grn.items)) {
          grn.items.forEach(item => {
            if (item.product_code === productCode) {
              allItems.push({
                ...item,
                grn_date: grn.grn_date,
                grn_code: grn.grn_code
              });
            }
          });
        }
      });
      
      // Sort by date (newest first) and then by GRN code
      allItems.sort((a, b) => {
        const dateA = new Date(a.grn_date);
        const dateB = new Date(b.grn_date);
        
        if (dateB - dateA !== 0) {
          return dateB - dateA; // Newest date first
        }
        
        // If same date, sort by GRN code
        return b.grn_code.localeCompare(a.grn_code);
      });
      
      // Return the latest item
      return allItems.length > 0 ? allItems[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching GRN history:', error);
    return null;
  }
}

/**
 * Get latest GRN items for multiple products
 * @param {Array<string>} productCodes - Array of product codes
 * @returns {Promise<Object>} Map of product code to latest stock price
 */
export async function getLatestStockPrices(productCodes) {
  try {
    const response = await api.get('/grns', {
      params: {
        'with_items': 1,
        'per_page': 1000
      }
    });
    
    if (response.data.success && response.data.data) {
      const grns = response.data.data;
      const latestPrices = {};
      
      // Process all GRNs to find latest for each product
      grns.forEach(grn => {
        if (grn.items && Array.isArray(grn.items)) {
          grn.items.forEach(item => {
            const productCode = item.product_code;
            
            if (productCodes.includes(productCode)) {
              const itemDate = new Date(grn.grn_date);
              const existing = latestPrices[productCode];
              
              if (!existing || itemDate > new Date(existing.grn_date)) {
                latestPrices[productCode] = {
                  stock_price: item.stock_price,
                  main_branch_price: item.main_branch_price,
                  selling_price: item.selling_price,
                  discount1: item.discount1,
                  discount2: item.discount2,
                  discount3: item.discount3,
                  discount4: item.discount4,
                  actual_cost: item.actual_cost,
                  grn_date: grn.grn_date,
                  grn_code: grn.grn_code
                };
              }
            }
          });
        }
      });
      
      return latestPrices;
    }
    
    return {};
  } catch (error) {
    console.error('Error fetching latest stock prices:', error);
    return {};
  }
}