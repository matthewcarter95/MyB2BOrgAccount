import { useAuth } from '../hooks/useAuth';
import { OrgSelector } from '../components/OrgSelector';
import { OrgSettings } from '../components/OrgSettings';
import { OrgDetails } from '../components/OrgDetails';

export function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-page">
        <span className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <div className="error-message">
            Please log in to access the dashboard.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div className="dashboard-welcome">
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome back, {user.name || user.email}
            </p>
          </div>
          <div className="dashboard-actions">
            <OrgSelector />
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon org-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"
                />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Organization</span>
              <span className="stat-value">{user.orgId || 'Not selected'}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon role-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Role</span>
              <span className="stat-value">
                {user.isAdmin ? (
                  <span className="badge badge-admin">Admin</span>
                ) : (
                  <span className="badge badge-member">Member</span>
                )}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon tier-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"
                />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Subscription</span>
              <span className="stat-value capitalize">{user.subscriptionTier}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {user.isAdmin ? (
            <OrgSettings />
          ) : (
            <OrgDetails />
          )}
        </div>
      </div>

      <style>{`
        .dashboard-page {
          min-height: calc(100vh - 70px);
          padding: 40px 0;
          background: var(--color-surface);
        }

        .dashboard-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .dashboard-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 4px;
        }

        .dashboard-subtitle {
          color: var(--color-text-secondary);
          font-size: 1.125rem;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 20px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
        }

        .stat-icon.org-icon {
          background: rgba(10, 30, 103, 0.1);
          color: var(--color-primary);
        }

        .stat-icon.role-icon {
          background: rgba(115, 197, 77, 0.15);
          color: var(--color-accent);
        }

        .stat-icon.tier-icon {
          background: rgba(108, 117, 125, 0.1);
          color: var(--color-text-secondary);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .stat-value {
          font-weight: 600;
          color: var(--color-text);
        }

        .capitalize {
          text-transform: capitalize;
        }

        .dashboard-content {
          background: var(--color-background);
          border-radius: var(--radius-lg);
          padding: 32px;
          border: 1px solid var(--color-border);
        }

        @media (max-width: 992px) {
          .dashboard-stats {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
          }

          .dashboard-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
