import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { request } from '../lib/api';
import type { Task } from '../lib/types';

interface KanbanProps {
  tasks: Task[];
  onUpdate: () => void;
}

export default function Kanban({ tasks, onUpdate }: KanbanProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const columns = {
    TO_DO: tasks.filter((t) => t.status === 'TO_DO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    COMPLETED: tasks.filter((t) => t.status === 'COMPLETED'),
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
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
    TO_DO: { label: 'To Do', color: '#60a5fa' },
    IN_PROGRESS: { label: 'In Progress', color: '#fbbf24' },
    COMPLETED: { label: 'Completed', color: '#34d399' },
  };

  const priorityColors: Record<string, string> = {
    HIGH: '#ef4444',
    MEDIUM: '#f97316',
    LOW: '#3b82f6',
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {Object.entries(columns).map(([status, tasks]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          return (
            <div key={status} className="kanban-column">
              <div className="kanban-column-header" style={{ borderTopColor: config.color }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>{config.label}</h3>
                <span className="kanban-count">{tasks.length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-tasks ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {tasks.length === 0 ? (
                      <div className="kanban-empty">No tasks</div>
                    ) : (
                      tasks.map((task, index) => (
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
                            >
                              <div className="kanban-task-content">
                                <h4 className="kanban-task-title">{task.title}</h4>
                                {task.description && (
                                  <p className="kanban-task-description">{task.description}</p>
                                )}
                                <div className="kanban-task-footer">
                                  <span
                                    className="priority-badge"
                                    style={{ backgroundColor: priorityColors[task.priority] }}
                                  >
                                    {task.priority}
                                  </span>
                                  {task.assignee && (
                                    <span className="assignee-badge">{task.assignee.name}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
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