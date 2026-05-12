import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reauth } from '../services/api';

export function OrgSelector() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="org-selector">
      <button
        className="org-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="org-current">{user.orgId}</span>
        <svg
          className={`org-chevron ${isOpen ? 'open' : ''}`}
          viewBox="0 0 24 24"
          width="16"
          height="16"
        >
          <path
            fill="currentColor"
            d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="org-dropdown">
          <button
            className="org-option active"
            onClick={() => setIsOpen(false)}
          >
            {user.orgId}
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </button>
          <div className="org-divider" />
          <button
            className="org-option org-option-reauth"
            onClick={() => { setIsOpen(false); reauth(); }}
          >
            Switch organization&hellip;
          </button>
        </div>
      )}

      <style>{`
        .org-selector {
          position: relative;
        }

        .org-selector-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .org-selector-button:hover {
          border-color: var(--color-primary);
        }

        .org-current {
          font-weight: 500;
          color: var(--color-text);
        }

        .org-chevron {
          color: var(--color-text-secondary);
          transition: transform 0.2s;
        }

        .org-chevron.open {
          transform: rotate(180deg);
        }

        .org-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 50;
          overflow: hidden;
        }

        .org-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px 12px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .org-option:hover {
          background: var(--color-surface);
        }

        .org-option.active {
          color: var(--color-primary);
          font-weight: 500;
        }

        .org-divider {
          height: 1px;
          background: var(--color-border);
          margin: 4px 0;
        }

        .org-option-reauth {
          color: var(--color-text-secondary);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
