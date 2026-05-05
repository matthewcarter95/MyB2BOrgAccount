import type { CommodityPrice, ApiResponse } from '../types.js';

// Mock commodity futures prices
const COMMODITIES: CommodityPrice[] = [
  {
    symbol: 'ZC',
    name: 'Corn',
    price: 485.25,
    change: 3.50,
    changePercent: 0.73,
    unit: '¢/bu',
  },
  {
    symbol: 'ZS',
    name: 'Soybeans',
    price: 1245.75,
    change: -8.25,
    changePercent: -0.66,
    unit: '¢/bu',
  },
  {
    symbol: 'ZW',
    name: 'Wheat',
    price: 612.50,
    change: 5.75,
    changePercent: 0.95,
    unit: '¢/bu',
  },
  {
    symbol: 'ZM',
    name: 'Soybean Meal',
    price: 342.80,
    change: -2.10,
    changePercent: -0.61,
    unit: '$/ton',
  },
  {
    symbol: 'ZL',
    name: 'Soybean Oil',
    price: 45.82,
    change: 0.34,
    changePercent: 0.75,
    unit: '¢/lb',
  },
  {
    symbol: 'LE',
    name: 'Live Cattle',
    price: 186.45,
    change: 1.20,
    changePercent: 0.65,
    unit: '¢/lb',
  },
  {
    symbol: 'HE',
    name: 'Lean Hogs',
    price: 89.35,
    change: -0.85,
    changePercent: -0.94,
    unit: '¢/lb',
  },
  {
    symbol: 'KC',
    name: 'Coffee',
    price: 185.60,
    change: 2.45,
    changePercent: 1.34,
    unit: '¢/lb',
  },
];

export function handleGetCommodities(): ApiResponse<CommodityPrice[]> {
  // Add some randomness to simulate real-time prices
  const commodities = COMMODITIES.map((c) => ({
    ...c,
    price: c.price + (Math.random() - 0.5) * 2,
    change: c.change + (Math.random() - 0.5) * 0.5,
  }));

  // Recalculate change percent
  commodities.forEach((c) => {
    c.changePercent = (c.change / (c.price - c.change)) * 100;
  });

  return {
    success: true,
    data: commodities,
  };
}
