import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { logout, getStoredUser } from '../lib/api';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const user = typeof window !== 'undefined' ? getStoredUser() : null;

  // Don't show layout on login/register page
  if (router.pathname === '/') {
    return <div className="public-shell">{children}</div>;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="flex-gap">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
              E
            </div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Ethara AI</h2>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className={`nav-item ${router.pathname === '/dashboard' ? 'active' : ''}`}>
            📊 Dashboard
          </Link>
          <div style={{ marginTop: 24, marginBottom: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 12px' }}>
            Your Work
          </div>
          <Link href="/dashboard" className="nav-item">
            📋 Projects
          </Link>
          {user?.role === 'ADMIN' && (
             <Link href="/dashboard" className="nav-item">
               👥 Team Members
             </Link>
          )}
        </nav>
        <div style={{ padding: 20, borderTop: '1px solid var(--border-color)' }}>
          <div className="flex-gap" style={{ marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="top-bar">
          <div className="search-bar" style={{ width: 300 }}>
             <input type="text" placeholder="Search projects and tasks..." style={{ borderRadius: 20, background: 'var(--bg-secondary)' }} />
          </div>
          <div className="flex-gap">
            <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
              + Create
            </button>
          </div>
        </header>
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}
