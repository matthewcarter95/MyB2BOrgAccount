import { useState, useEffect } from 'react';
import { getCommodities } from '../services/api';
import type { CommodityPrice } from '../types';

export function CommodityPrices() {
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const response = await getCommodities();
        if (response.success && response.data) {
          setCommodities(response.data);
        } else {
          setError(response.error || 'Failed to load prices');
        }
      } catch {
        setError('Failed to load prices');
      } finally {
        setLoading(false);
      }
    };

    fetchCommodities();

    // Refresh every 60 seconds
    const interval = setInterval(fetchCommodities, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="commodity-loading">
        <span className="spinner" />
        <span>Loading prices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  return (
    <div className="commodity-grid">
      {commodities.map((commodity) => (
        <div key={commodity.symbol} className="commodity-card">
          <div className="commodity-header">
            <span className="commodity-symbol">{commodity.symbol}</span>
            <span className="commodity-name">{commodity.name}</span>
          </div>
          <div className="commodity-price">
            {commodity.price.toFixed(2)}
            <span className="commodity-unit">{commodity.unit}</span>
          </div>
          <div className={`commodity-change ${commodity.change >= 0 ? 'positive' : 'negative'}`}>
            {commodity.change >= 0 ? '+' : ''}
            {commodity.change.toFixed(2)} ({commodity.changePercent.toFixed(2)}%)
          </div>
        </div>
      ))}

      <style>{`
        .commodity-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
          color: var(--color-text-secondary);
        }

        .commodity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .commodity-card {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          transition: box-shadow 0.2s;
        }

        .commodity-card:hover {
          box-shadow: var(--shadow-md);
        }

        .commodity-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .commodity-symbol {
          background: var(--color-primary);
          color: white;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .commodity-name {
          font-weight: 500;
          color: var(--color-text);
        }

        .commodity-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 4px;
        }

        .commodity-unit {
          font-size: 0.875rem;
          font-weight: 400;
          color: var(--color-text-secondary);
          margin-left: 4px;
        }

        .commodity-change {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .commodity-change.positive {
          color: var(--color-accent);
        }

        .commodity-change.negative {
          color: var(--color-error);
        }
      `}</style>
    </div>
  );
}
