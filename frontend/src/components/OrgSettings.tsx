import { useState, useEffect } from 'react';
import {
  getOrgDetails,
  updateOrgDetails,
  getIdentityProviders,
  createIdentityProvider,
  deleteIdentityProvider,
} from '../services/api';
import type { OrgDetails, IdentityProvider } from '../types';

export function OrgSettings() {
  const [details, setDetails] = useState<OrgDetails | null>(null);
  const [providers, setProviders] = useState<IdentityProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // New IdP form
  const [showNewIdp, setShowNewIdp] = useState(false);
  const [newIdpName, setNewIdpName] = useState('');
  const [newIdpStrategy, setNewIdpStrategy] = useState('oidc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [detailsRes, providersRes] = await Promise.all([
          getOrgDetails(),
          getIdentityProviders(),
        ]);

        if (detailsRes.success && detailsRes.data) {
          setDetails(detailsRes.data);
          setDisplayName(detailsRes.data.display_name || '');
          setLogoUrl(detailsRes.data.branding?.logo_url || '');
        }
        if (providersRes.success && providersRes.data) {
          setProviders(providersRes.data);
        }

        if (!detailsRes.success) {
          setError(detailsRes.error || 'Failed to load organization');
        }
      } catch {
        setError('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: Partial<OrgDetails> = {
        display_name: displayName,
        branding: {
          logo_url: logoUrl || undefined,
        },
      };

      const response = await updateOrgDetails(updates);
      if (response.success && response.data) {
        setDetails(response.data);
        setSuccess('Organization settings saved successfully');
      } else {
        setError(response.error || 'Failed to save settings');
      }
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateIdp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await createIdentityProvider({
        name: newIdpName,
        strategy: newIdpStrategy,
      });

      if (response.success && response.data) {
        setProviders([...providers, response.data]);
        setShowNewIdp(false);
        setNewIdpName('');
        setNewIdpStrategy('oidc');
        setSuccess('Identity provider created successfully');
      } else {
        setError(response.error || 'Failed to create identity provider');
      }
    } catch {
      setError('Failed to create identity provider');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIdp = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this identity provider?')) {
      return;
    }

    try {
      const response = await deleteIdentityProvider(providerId);
      if (response.success) {
        setProviders(providers.filter((p) => p.id !== providerId));
        setSuccess('Identity provider deleted');
      } else {
        setError(response.error || 'Failed to delete identity provider');
      }
    } catch {
      setError('Failed to delete identity provider');
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        <span>Loading organization settings...</span>
      </div>
    );
  }

  if (!details) {
    return <div className="error-message">Organization not found</div>;
  }

  return (
    <div className="org-settings">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSaveDetails} className="card">
        <h3 className="section-title">Organization Settings</h3>

        <div className="form-group">
          <label className="form-label">Organization ID</label>
          <input
            type="text"
            className="form-input"
            value={details.id}
            disabled
          />
        </div>

        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-input"
            value={details.name}
            disabled
          />
        </div>

        <div className="form-group">
          <label className="form-label">Display Name</label>
          <input
            type="text"
            className="form-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Logo URL</label>
          <input
            type="url"
            className="form-input"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          {logoUrl && (
            <img src={logoUrl} alt="Logo preview" className="logo-preview" />
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="spinner" /> : null}
          Save Changes
        </button>
      </form>

      <div className="card mt-6">
        <div className="section-header">
          <h3 className="section-title">Identity Providers</h3>
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={() => setShowNewIdp(true)}
          >
            Add Provider
          </button>
        </div>

        {showNewIdp && (
          <form onSubmit={handleCreateIdp} className="new-idp-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newIdpName}
                  onChange={(e) => setNewIdpName(e.target.value)}
                  placeholder="Provider name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Strategy</label>
                <select
                  className="form-input"
                  value={newIdpStrategy}
                  onChange={(e) => setNewIdpStrategy(e.target.value)}
                >
                  <option value="oidc">OIDC</option>
                  <option value="samlp">SAML</option>
                  <option value="google-oauth2">Google</option>
                  <option value="waad">Azure AD</option>
                  <option value="okta">Okta</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                Create
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowNewIdp(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="providers-list">
          {providers.length === 0 ? (
            <p className="text-secondary">No identity providers configured.</p>
          ) : (
            providers.map((provider) => (
              <div key={provider.id} className="provider-item">
                <div className="provider-info">
                  <span className="provider-name">{provider.display_name || provider.name}</span>
                  <span className="provider-strategy">{provider.strategy}</span>
                </div>
                <div className="provider-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteIdp(provider.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .org-settings {
          max-width: 800px;
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 40px;
          color: var(--color-text-secondary);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-header .section-title {
          margin-bottom: 0;
        }

        .logo-preview {
          max-width: 200px;
          max-height: 80px;
          margin-top: 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 8px;
        }

        .new-idp-form {
          background: var(--color-surface);
          padding: 16px;
          border-radius: var(--radius-md);
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .providers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .provider-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
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
          background: var(--color-background);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }

        .provider-actions {
          display: flex;
          gap: 8px;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
