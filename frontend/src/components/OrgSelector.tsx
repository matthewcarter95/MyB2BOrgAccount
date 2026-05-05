import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { switchOrg } from '../services/api';

export function OrgSelector() {
  const { user, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!user || user.orgs.length <= 1) {
    return null;
  }

  const handleSwitch = async (orgId: string) => {
    if (orgId === user.orgId) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const response = await switchOrg(orgId);
      if (response.success) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setSwitching(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="org-selector">
      <button
        className="org-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
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
          {user.orgs.map((orgId) => (
            <button
              key={orgId}
              className={`org-option ${orgId === user.orgId ? 'active' : ''}`}
              onClick={() => handleSwitch(orgId)}
            >
              {orgId}
              {orgId === user.orgId && (
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </button>
          ))}
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

        .org-selector-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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
      `}</style>
    </div>
  );
}
