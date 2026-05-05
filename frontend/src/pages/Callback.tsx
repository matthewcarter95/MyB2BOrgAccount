import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');

    if (error) {
      // Redirect to home with error
      navigate(`/?error=${encodeURIComponent(error)}`);
      return;
    }

    // The BFF handles the callback and sets the cookie, then redirects to /dashboard
    // If we're here without being redirected, something went wrong
    // Give it a moment, then redirect to home
    const timeout = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigate, searchParams]);

  return (
    <div className="callback-page">
      <div className="callback-content">
        <span className="spinner large" />
        <p>Completing authentication...</p>
      </div>

      <style>{`
        .callback-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .callback-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }

        .callback-content p {
          color: var(--color-text-secondary);
          font-size: 1.125rem;
        }

        .spinner.large {
          width: 48px;
          height: 48px;
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}
