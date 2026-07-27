export type Priority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type SourceType = 'TASK' | 'SUBTASK' | 'MANUAL';
export type RowColor = 'gold' | 'green' | 'red';

export interface WorklogEntry {
  id: number;
  date: string;
  natureOfWork: string | null;
  account: string | null;
  projectWork: string | null;
  importantTasksFeatures: string | null;
  toolsTechSkills: string | null;
  remarks: string | null;
  attachments: string | null;
  priority: Priority;
  rowColor: RowColor | null;
  sourceType: SourceType;
  sourceId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateWorklogData {
  date?: string;
  natureOfWork?: string | null;
  account?: string | null;
  projectWork?: string | null;
  importantTasksFeatures?: string | null;
  toolsTechSkills?: string | null;
  remarks?: string | null;
  attachments?: string | null;
  priority?: Priority;
  rowColor?: RowColor | null;
}

export interface CreateWorklogData {
  date: string;
  natureOfWork?: string | null;
  account?: string | null;
  projectWork?: string | null;
  importantTasksFeatures?: string | null;
  toolsTechSkills?: string | null;
  remarks?: string | null;
  attachments?: string | null;
  priority?: Priority;
  sourceType?: SourceType;
  sourceId?: number | null;
}

export type WorklogColumn = keyof Omit<WorklogEntry, 'id' | 'sourceType' | 'sourceId' | 'createdAt' | 'updatedAt'>;
