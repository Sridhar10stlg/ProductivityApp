export type Priority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type SmartView = 'myday' | 'important' | 'planned' | 'all';

export interface TaskList {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  taskCount: number;
}

export interface SubTask {
  id: number;
  title: string;
  completed: boolean;
  sortOrder: number;
  taskId: number;
}

export interface Task {
  id: number;
  title: string;
  note: string | null;
  completed: boolean;
  completedAt: string | null;
  important: boolean;
  myDay: boolean;
  myDayDate: string | null;
  dueDate: string | null;
  priority: Priority;
  sortOrder: number;
  listId: number | null;
  list: TaskList | null;
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  myDay: number;
  important: number;
  planned: number;
  all: number;
  lists: Record<number, number>;
}

export interface CreateTaskData {
  title: string;
  note?: string;
  dueDate?: string;
  priority?: Priority;
  listId?: number;
  important?: boolean;
  myDay?: boolean;
}

export interface UpdateTaskData {
  title?: string;
  note?: string | null;
  completed?: boolean;
  important?: boolean;
  myDay?: boolean;
  dueDate?: string | null;
  priority?: Priority;
  listId?: number | null; // null = take the task out of its list
  sortOrder?: number;
}
