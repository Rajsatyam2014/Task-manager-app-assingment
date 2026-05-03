import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { request, getStoredUser } from '../lib/api';
import type { Project, Task, User } from '../lib/types';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [request<Project[]>('/api/projects')];
      if (user?.role === 'ADMIN') {
        promises.push(request<User[]>('/api/auth/users'));
      }
      const results = await Promise.all(promises);
      setProjects(results[0]);
      if (user?.role === 'ADMIN') {
        setUsers(results[1]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loading failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.replace('/');
      return;
    }
    loadData();
  }, [router]);

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const project = await request<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      });
      setProjects((current) => [project, ...current]);
      setProjectName('');
      setProjectDescription('');
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create project failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Projects</h1>
          <p className="small-text">Select a project to view its Kanban board and tasks.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + New Project
          </button>
        )}
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚀</div>
          <h3 style={{ marginBottom: 8 }}>No projects yet</h3>
          <p className="small-text" style={{ maxWidth: 400, margin: '0 auto 24px' }}>
            Get started by creating your first project to invite team members and manage tasks.
          </p>
          {user?.role === 'ADMIN' && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="dashboard-grid">
          {projects.map((project) => (
            <motion.div 
              key={project.id}
              whileHover={{ y: -4 }}
              className="glass-panel"
              style={{ cursor: 'pointer', padding: 24, display: 'flex', flexDirection: 'column' }}
              onClick={() => router.push(`/project/${project.id}`)}
            >
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(47,129,247,0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <span className="badge" style={{ background: 'var(--bg-color)' }}>
                  {project.tasks?.length || 0} tasks
                </span>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{project.name}</h3>
              <p className="small-text" style={{ flex: 1, marginBottom: 20 }}>
                {project.description || 'No description provided.'}
              </p>
              <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <span className="small-text">Created by {project.owner.name}</span>
                <div className="flex-gap" style={{ gap: -8 }}>
                  {/* Placeholder avatars for members */}
                  {project.members?.slice(0,3).map((m, i) => (
                    <div key={m.id} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '2px solid var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', zIndex: 3-i }}>
                      {m.user.name.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content glass-panel"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-between" style={{ marginBottom: 24 }}>
              <h2>Create New Project</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>
                <input
                  id="projectName"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="e.g. Q4 Marketing Campaign"
                  required
                  minLength={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="projectDescription">Description (Optional)</label>
                <textarea
                  id="projectDescription"
                  rows={4}
                  value={projectDescription}
                  onChange={(event) => setProjectDescription(event.target.value)}
                  placeholder="Briefly describe the goal of this project..."
                />
              </div>
              <div className="flex-gap" style={{ justifyContent: 'flex-end', marginTop: 32 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
