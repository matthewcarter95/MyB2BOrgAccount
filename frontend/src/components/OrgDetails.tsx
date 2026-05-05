import { useState, useEffect } from 'react';
import { getOrgDetails, getOrgConfig, getIdentityProviders } from '../services/api';
import type { OrgDetails as OrgDetailsType, OrgConfig, IdentityProvider } from '../types';

export function OrgDetails() {
  const [details, setDetails] = useState<OrgDetailsType | null>(null);
  const [config, setConfig] = useState<OrgConfig | null>(null);
  const [providers, setProviders] = useState<IdentityProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [detailsRes, configRes, providersRes] = await Promise.all([
          getOrgDetails(),
          getOrgConfig(),
          getIdentityProviders(),
        ]);

        if (detailsRes.success && detailsRes.data) {
          setDetails(detailsRes.data);
        }
        if (configRes.success && configRes.data) {
          setConfig(configRes.data);
        }
        if (providersRes.success && providersRes.data) {
          setProviders(providersRes.data);
        }

        if (!detailsRes.success) {
          setError(detailsRes.error || 'Failed to load organization details');
        }
      } catch {
        setError('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        <span>Loading organization details...</span>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!details) {
    return <div className="error-message">Organization not found</div>;
  }

  return (
    <div className="org-details">
      <div className="card">
        <h3 className="section-title">Organization Information</h3>

        <div className="info-grid">
          <div className="info-item">
            <label className="info-label">Organization ID</label>
            <span className="info-value">{details.id}</span>
          </div>
          <div className="info-item">
            <label className="info-label">Name</label>
            <span className="info-value">{details.name}</span>
          </div>
          {details.display_name && (
            <div className="info-item">
              <label className="info-label">Display Name</label>
              <span className="info-value">{details.display_name}</span>
            </div>
          )}
        </div>

        {details.branding?.logo_url && (
          <div className="branding-section">
            <label className="info-label">Logo</label>
            <img
              src={details.branding.logo_url}
              alt={`${details.name} logo`}
              className="org-logo"
            />
          </div>
        )}
      </div>

      {providers.length > 0 && (
        <div className="card mt-6">
          <h3 className="section-title">Identity Providers</h3>
          <div className="providers-list">
            {providers.map((provider) => (
              <div key={provider.id} className="provider-item">
                <div className="provider-info">
                  <span className="provider-name">{provider.display_name || provider.name}</span>
                  <span className="provider-strategy">{provider.strategy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {config && config.enabled_connections.length > 0 && (
        <div className="card mt-6">
          <h3 className="section-title">Enabled Connections</h3>
          <div className="connections-list">
            {config.enabled_connections.map((conn) => (
              <div key={conn.connection_id} className="connection-item">
                <span className="connection-id">{conn.connection_id}</span>
                <div className="connection-badges">
                  {conn.assign_membership_on_login && (
                    <span className="badge badge-member">Auto-assign</span>
                  )}
                  {conn.show_as_button && (
                    <span className="badge badge-admin">Button</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .org-details {
          max-width: 800px;
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 40px;
          color: var(--color-text-secondary);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .info-value {
          font-size: 1rem;
          color: var(--color-text);
        }

        .branding-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--color-border);
        }

        .org-logo {
          max-width: 200px;
          max-height: 80px;
          margin-top: 8px;
        }

        .providers-list,
        .connections-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .provider-item,
        .connection-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: var(--color-surface);
          border-radius: var(--radius-md);
        }

        .provider-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .provider-name {
          font-weight: 500;
        }

        .provider-strategy {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .connection-id {
          font-family: monospace;
          font-size: 0.875rem;
        }

        .connection-badges {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
