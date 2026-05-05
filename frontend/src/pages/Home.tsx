import { useAuth } from '../hooks/useAuth';
import { CommodityPrices } from '../components/CommodityPrices';

export function Home() {
  const { login, signup } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="text-accent">e-ADM</span> Online Services
            </h1>
            <p className="hero-subtitle">
              Your trusted partner for agricultural commodities trading and organization management.
              Access real-time market data and manage your organization with ease.
            </p>
            <div className="hero-actions">
              <button onClick={signup} className="btn btn-accent btn-lg">
                Get Started
              </button>
              <button onClick={login} className="btn btn-outline btn-lg">
                Sign In
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="hero-card-icon">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path
                    fill="currentColor"
                    d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99l1.5 1.5z"
                  />
                </svg>
              </div>
              <span className="hero-card-text">Real-time Market Data</span>
            </div>
            <div className="hero-card">
              <div className="hero-card-icon">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                  />
                </svg>
              </div>
              <span className="hero-card-text">Global Trading Network</span>
            </div>
            <div className="hero-card">
              <div className="hero-card-icon">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path
                    fill="currentColor"
                    d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
                  />
                </svg>
              </div>
              <span className="hero-card-text">Secure Organization Management</span>
            </div>
          </div>
        </div>
      </section>

      <section className="commodities-section">
        <div className="container">
          <h2 className="section-heading">
            <span className="heading-accent" />
            Commodity Futures Prices
          </h2>
          <p className="section-description">
            Stay informed with the latest agricultural commodity futures prices.
          </p>
          <CommodityPrices />
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-heading">
            <span className="heading-accent" />
            Why Choose e-ADM?
          </h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path
                    fill="currentColor"
                    d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
                  />
                </svg>
              </div>
              <h3 className="feature-title">Organization Management</h3>
              <p className="feature-description">
                Easily manage your organization settings, identity providers, and team members from a single dashboard.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path
                    fill="currentColor"
                    d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                  />
                </svg>
              </div>
              <h3 className="feature-title">Enterprise Security</h3>
              <p className="feature-description">
                Secure single sign-on with support for SAML, OIDC, and social identity providers.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path
                    fill="currentColor"
                    d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"
                  />
                </svg>
              </div>
              <h3 className="feature-title">Market Intelligence</h3>
              <p className="feature-description">
                Access real-time commodity prices and market data to make informed trading decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .home-page {
          min-height: calc(100vh - 70px);
        }

        .hero {
          background: linear-gradient(135deg, var(--color-primary) 0%, #0d2580 100%);
          padding: 80px 0;
          color: white;
        }

        .hero .container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 20px;
        }

        .text-accent {
          color: var(--color-accent);
        }

        .hero-subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
        }

        .hero-actions .btn-outline {
          border-color: white;
          color: white;
        }

        .hero-actions .btn-outline:hover {
          background: white;
          color: var(--color-primary);
        }

        .hero-visual {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hero-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 20px 24px;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hero-card-icon {
          color: var(--color-accent);
        }

        .hero-card-text {
          font-size: 1.125rem;
          font-weight: 500;
        }

        .commodities-section,
        .features-section {
          padding: 80px 0;
        }

        .commodities-section {
          background: var(--color-surface);
        }

        .section-heading {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .heading-accent {
          width: 4px;
          height: 32px;
          background: var(--color-accent);
          border-radius: 2px;
        }

        .section-description {
          color: var(--color-text-secondary);
          margin-bottom: 32px;
          font-size: 1.125rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .feature-card {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 32px;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .feature-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(115, 197, 77, 0.15);
          color: var(--color-accent);
          border-radius: var(--radius-md);
          margin-bottom: 20px;
        }

        .feature-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-primary);
          margin-bottom: 12px;
        }

        .feature-description {
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 992px) {
          .hero .container {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-actions {
            justify-content: center;
          }

          .hero-visual {
            display: none;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .hero {
            padding: 60px 0;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .hero-actions {
            flex-direction: column;
          }

          .section-heading {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
