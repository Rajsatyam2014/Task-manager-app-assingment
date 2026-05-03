export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Role = 'ADMIN' | 'MEMBER';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  projectId: string;
  assignee?: User | null;
  assigneeId?: string | null;
};

export type ProjectMember = {
  id: string;
  role: Role;
  user: User;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  owner: User;
  members: ProjectMember[];
  tasks: Task[];
};
