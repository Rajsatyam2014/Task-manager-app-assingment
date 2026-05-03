import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { request } from '../lib/api';
import type { Task } from '../lib/types';

interface KanbanProps {
  tasks: Task[];
  onUpdate: () => void;
  onTaskClick: (task: Task) => void;
}

export default function Kanban({ tasks, onUpdate, onTaskClick }: KanbanProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const columns = {
    TO_DO: tasks.filter((t) => t.status === 'TO_DO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    COMPLETED: tasks.filter((t) => t.status === 'COMPLETED'),
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination, source } = result;
    if (destination.droppableId === source.droppableId) return; // No change

    const newStatus = destination.droppableId as Task['status'];

    setLoading(draggableId);
    try {
      await request(`/api/tasks/${draggableId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate();
    } catch (err) {
      console.error('Update failed', err);
    } finally {
      setLoading(null);
    }
  };

  const statusConfig = {
    TO_DO: { label: 'To Do', color: 'var(--status-todo)' },
    IN_PROGRESS: { label: 'In Progress', color: 'var(--status-in-progress)' },
    COMPLETED: { label: 'Done', color: 'var(--status-done)' },
  };

  const priorityColors: Record<string, string> = {
    HIGH: 'var(--priority-high)',
    MEDIUM: 'var(--priority-medium)',
    LOW: 'var(--priority-low)',
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {Object.entries(columns).map(([status, tasks]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          return (
            <div key={status} className="kanban-column">
              <div className="kanban-column-header">
                <div className="flex-gap">
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: config.color }}></div>
                  <h3 style={{ color: config.color }}>{config.label}</h3>
                  <span className="kanban-count">{tasks.length}</span>
                </div>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-tasks ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-task ${snapshot.isDragging ? 'dragging' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: loading === task.id ? 0.5 : 1,
                            }}
                            onClick={() => onTaskClick(task)}
                          >
                            <div className="task-id">{task.id.slice(0, 8).toUpperCase()}</div>
                            <h4 className="kanban-task-title">{task.title}</h4>
                            <div className="kanban-task-footer">
                              <span className="badge" style={{ background: priorityColors[task.priority] + '20', color: priorityColors[task.priority] }}>
                                {task.priority}
                              </span>
                              {task.assignee ? (
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'white', fontWeight: 'bold' }} title={task.assignee.name}>
                                  {task.assignee.name.charAt(0)}
                                </div>
                              ) : (
                                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  ?
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <div 
                      style={{ padding: 12, color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }}
                      className="hover-bg"
                      onClick={() => onTaskClick({ status } as any)}
                    >
                      + Create issue
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}