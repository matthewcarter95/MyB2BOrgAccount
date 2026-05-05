import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Header() {
  const { isAuthenticated, isLoading, user, login, logout, signup } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">ADM</span>
            <span className="logo-text">e-ADM Online Services</span>
          </Link>

          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            )}
          </nav>

          <div className="header-actions">
            {isLoading ? (
              <span className="spinner" />
            ) : isAuthenticated ? (
              <div className="user-menu">
                {user?.picture && (
                  <img src={user.picture} alt="" className="user-avatar" />
                )}
                <span className="user-name">{user?.name || user?.email}</span>
                <button onClick={logout} className="btn btn-ghost btn-sm">
                  Log Out
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button onClick={login} className="btn btn-outline btn-sm">
                  Log In
                </button>
                <button onClick={signup} className="btn btn-accent btn-sm">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .header {
          background: var(--color-background);
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
          gap: 32px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--color-primary);
          color: var(--color-accent);
          font-weight: 700;
          font-size: 0.875rem;
          border-radius: var(--radius-md);
        }

        .logo-text {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .nav {
          display: flex;
          gap: 24px;
        }

        .nav-link {
          color: var(--color-text);
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: var(--color-primary);
          text-decoration: none;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .user-name {
          font-weight: 500;
          color: var(--color-text);
        }

        .auth-buttons {
          display: flex;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .logo-text {
            display: none;
          }

          .nav {
            display: none;
          }

          .user-name {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
