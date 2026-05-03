import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { request, logout, getStoredUser } from '../lib/api';
import Kanban from '../components/Kanban';
import type { Project, Task, User } from '../lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = getStoredUser();

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [
        request<Project[]>('/api/projects'),
        request<Task[]>('/api/tasks'),
      ];
      if (user?.role === 'ADMIN') {
        promises.push(request<User[]>('/api/auth/users'));
      }
      const results = await Promise.all(promises);
      setProjects(results[0]);
      setTasks(results[1]);
      if (user?.role === 'ADMIN') {
        setUsers(results[2]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loading failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create project failed');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <main className="main-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspace</h1>
          <p className="small-text">Manage projects, invite teammates, and keep tasks moving.</p>
        </div>
        <button className="secondary" type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="dashboard-grid">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Create a new project</h2>
          <form onSubmit={handleCreateProject}>
            <div className="form-group">
              <label htmlFor="projectName">Project name</label>
              <input
                id="projectName"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Team launch plan"
                required
                minLength={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectDescription">Description</label>
              <textarea
                id="projectDescription"
                rows={4}
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                placeholder="Add a short description"
              />
            </div>
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Task Board</h2>
          {tasks.length === 0 ? (
            <p className="small-text">No tasks found yet. Create a project and add tasks to get started.</p>
          ) : (
            <Kanban tasks={tasks} onUpdate={loadData} />
          )}
        </section>
      </div>

      <section style={{ marginTop: 32 }}>
        <h2>Projects</h2>
        {projects.length === 0 ? (
          <div className="card">
            <p className="small-text">✨ You don't have any projects yet. Create one to invite collaborators and assign tasks.</p>
          </div>
        ) : (
          <div className="grid">
            {projects.map((project) => (
              <button
                key={project.id}
                className="card secondary"
                type="button"
                onClick={() => router.push(`/project/${project.id}`)}
                style={{ textAlign: 'left', padding: '0', cursor: 'pointer' }}
              >
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ marginBottom: 'auto' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
                      {project.name}
                    </h3>
                    <p className="small-text" style={{ marginBottom: 12 }}>
                      {project.description || 'No description yet'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                    <span className="small-text">by {project.owner.name}</span>
                    <span className="badge">{project.tasks?.length ?? 0} tasks</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {user?.role === 'ADMIN' && (
        <section>
          <h2>Employee Management</h2>
          <div style={{ marginBottom: 24 }}>
            <button className="secondary" onClick={() => {/* TODO: Add employee modal */}}>
              + Add Employee
            </button>
          </div>
          {users.length === 0 ? (
            <div className="card">
              <p className="small-text">No employees added yet. Add team members to assign them to projects and tasks.</p>
            </div>
          ) : (
            <div className="grid">
              {users.map((u) => (
                <div key={u.id} className="employee-card">
                  <h4>{u.name}</h4>
                  <p className="small-text" style={{ margin: '4px 0' }}>{u.email}</p>
                  <div style={{ marginTop: 12 }}>
                    <span className="badge">{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
