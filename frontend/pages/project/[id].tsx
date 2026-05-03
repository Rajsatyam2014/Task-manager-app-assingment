import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { request, logout } from '../../lib/api';
import type { Project, Task } from '../../lib/types';

const statusLabels: Record<string, string> = {
  TO_DO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProject = useCallback(async () => {
    if (!id || Array.isArray(id)) return;
    setLoading(true);
    setError('');

    try {
      const data = await request<Project>(`/api/projects/${id}`);
      setProject(data);
      if (data.members.length > 0) {
        setAssigneeId(data.members[0].user.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load project';
      setError(message);
      if (message.includes('Authentication') || message.includes('token')) {
        logout();
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/');
      return;
    }
    loadProject();
  }, [loadProject, router]);

  const projectMembers = useMemo(() => project?.members ?? [], [project]);

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!project) return;

    try {
      await request(`/api/projects/${project.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail, role: 'MEMBER' }),
      });
      setMemberEmail('');
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invitation failed');
    }
  };

  const handleAddTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!project) return;

    try {
      await request<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          projectId: project.id,
          dueDate: taskDueDate || undefined,
          assigneeId: assigneeId || undefined,
        }),
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task creation failed');
    }
  };

  const updateTaskStatus = async (task: Task, status: string) => {
    setError('');
    try {
      await request<Task>(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status,
          dueDate: task.dueDate || undefined,
          assigneeId: task.assigneeId || undefined,
        }),
      });
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const deleteTask = async (taskId: string) => {
    setError('');
    try {
      await request(`/api/tasks/${taskId}`, { method: 'DELETE' });
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (!project && loading) {
    return (
      <main className="main-shell">
        <p className="small-text">Loading project…</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="main-shell">
        <div className="page-header">
          <button className="secondary" type="button" onClick={() => router.push('/dashboard')}>
            Back to dashboard
          </button>
        </div>
        {error ? <div className="alert">{error}</div> : <p className="small-text">Project not found.</p>}
      </main>
    );
  }

  return (
    <main className="main-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="small-text">{project.description || 'No description provided.'}</p>
        </div>
        <button className="secondary" type="button" onClick={() => router.push('/dashboard')}>
          ← Back
        </button>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="dashboard-grid">
        <section className="card">
          <h2>Invite teammate</h2>
          <p className="small-text">Add existing users to this project to collaborate on tasks.</p>
          <form onSubmit={handleInvite}>
            <div className="form-group">
              <label htmlFor="memberEmail">Email address</label>
              <input
                id="memberEmail"
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                placeholder="teammate@company.com"
                required
              />
            </div>
            <button className="primary" type="submit">
              + Invite
            </button>
          </form>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1.1rem', fontWeight: 600 }}>Team Members ({projectMembers.length})</h3>
            {projectMembers.length === 0 ? (
              <p className="small-text">No members added yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {projectMembers.map((member) => (
                  <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(30, 40, 70, 0.4)', borderRadius: '10px' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: '#f1f5f9' }}>{member.user.name}</p>
                      <p className="small-text" style={{ margin: '4px 0 0' }}>{member.user.email}</p>
                    </div>
                    <span className="badge">{member.role.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <h2>Add a task</h2>
          <form onSubmit={handleAddTask}>
            <div className="form-group">
              <label htmlFor="taskTitle">Title</label>
              <input
                id="taskTitle"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Task description"
                required
                minLength={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="taskDescription">Details</label>
              <textarea
                id="taskDescription"
                rows={3}
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                placeholder="Add context and details"
              />
            </div>
            <div className="form-group">
              <label htmlFor="taskDueDate">Due date</label>
              <input
                id="taskDueDate"
                type="date"
                value={taskDueDate}
                onChange={(event) => setTaskDueDate(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="assigneeId">Assign to</label>
              <select
                id="assigneeId"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
              >
                <option value="">Unassigned</option>
                {projectMembers.map((member) => (
                  <option key={member.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="primary" type="submit">
              + Create task
            </button>
          </form>
        </section>
      </div>

      <section style={{ marginTop: 32 }}>
        <h2>Tasks ({project.tasks?.length || 0})</h2>
        {project.tasks?.length === 0 ? (
          <div className="card">
            <p className="small-text">✨ No tasks yet. Create one using the form above to get started.</p>
          </div>
        ) : (
          <div className="grid">
            {project.tasks?.map((task) => (
              <div key={task.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 600, color: '#f1f5f9' }}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="small-text" style={{ marginBottom: 8 }}>
                      {task.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`status-pill status-${task.status.toLowerCase()}`}>
                      {statusLabels[task.status]}
                    </span>
                    {task.assignee && (
                      <span className="small-text">👤 {task.assignee.name}</span>
                    )}
                    {task.dueDate && (
                      <span className="small-text">📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                  {(['TO_DO', 'IN_PROGRESS', 'COMPLETED'] as const).map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      className="secondary"
                      onClick={() => updateTaskStatus(task, statusOption)}
                      style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                    >
                      {statusLabels[statusOption]}
                    </button>
                  ))}
                  <button 
                    className="secondary" 
                    type="button" 
                    onClick={() => deleteTask(task.id)}
                    style={{ fontSize: '0.85rem', padding: '8px 12px', marginLeft: 'auto', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
