import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { request, logout } from '../../lib/api';
import type { Project, Task } from '../../lib/types';
import Kanban from '../../components/Kanban';
import { motion } from 'framer-motion';

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Forms
  const [memberEmail, setMemberEmail] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [taskStatus, setTaskStatus] = useState('TO_DO');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProject = useCallback(async () => {
    if (!id || Array.isArray(id)) return;
    setLoading(true);
    setError('');

    try {
      const data = await request<Project>(`/api/projects/${id}`);
      setProject(data);
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
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
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
      setIsInviteModalOpen(false);
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
          status: taskStatus
        }),
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setIsTaskModalOpen(false);
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task creation failed');
    }
  };

  const openTaskModal = (task?: Partial<Task>) => {
    if (task && task.status) {
      setTaskStatus(task.status);
    } else {
      setTaskStatus('TO_DO');
    }
    // We are currently using this modal only for creation in this demo
    setTaskTitle('');
    setTaskDescription('');
    setIsTaskModalOpen(true);
  };

  if (!project && loading) {
    return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading project...</div>;
  }

  if (!project) {
    return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Project not found or you don't have access.</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <div className="flex-gap" style={{ marginBottom: 8 }}>
            <span className="small-text" style={{ textTransform: 'uppercase' }}>Projects</span>
            <span className="small-text">/</span>
            <span className="small-text">{project.name}</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>{project.name} Active Sprint</h1>
        </div>
        <div className="flex-gap">
          <div className="flex-gap" style={{ gap: -8, marginRight: 16 }}>
            {projectMembers.map((m, i) => (
               <div key={m.id} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '2px solid var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', zIndex: projectMembers.length-i }} title={m.user.name}>
                 {m.user.name.charAt(0)}
               </div>
            ))}
            <button 
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--text-secondary)', zIndex: 0, marginLeft: 8 }}
              onClick={() => setIsInviteModalOpen(true)}
              title="Add member"
            >
              +
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => openTaskModal()}>
            Create Issue
          </button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div style={{ flex: 1, minHeight: 0 }}>
        <Kanban tasks={project.tasks || []} onUpdate={loadProject} onTaskClick={openTaskModal} />
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content glass-panel"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 600 }}
          >
            <div className="flex-between" style={{ marginBottom: 24 }}>
              <h2>Create Issue</h2>
              <button onClick={() => setIsTaskModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label htmlFor="taskTitle">Summary</label>
                <input
                  id="taskTitle"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  rows={5}
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                  placeholder="Add details, acceptance criteria, etc."
                />
              </div>
              <div className="flex-gap" style={{ gap: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="assigneeId">Assignee</label>
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
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="taskStatus">Status</label>
                  <select
                    id="taskStatus"
                    value={taskStatus}
                    onChange={(event) => setTaskStatus(event.target.value)}
                  >
                    <option value="TO_DO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Done</option>
                  </select>
                </div>
              </div>
              <div className="flex-gap" style={{ justifyContent: 'flex-end', marginTop: 32 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content glass-panel"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-between" style={{ marginBottom: 24 }}>
              <h2>Add people to {project.name}</h2>
              <button onClick={() => setIsInviteModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label htmlFor="memberEmail">Email address</label>
                <input
                  id="memberEmail"
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="e.g. maria@company.com"
                  required
                />
              </div>
              <div className="flex-gap" style={{ justifyContent: 'flex-end', marginTop: 32 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsInviteModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
