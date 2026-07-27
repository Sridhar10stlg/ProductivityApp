import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { TaskList, Task, SubTask, TaskStats, CreateTaskData, UpdateTaskData, SmartView } from '../types/todo.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const todoApi = createApi({
  reducerPath: 'todoApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Task', 'TaskList', 'TaskStats'],
  endpoints: (builder) => ({
    // ─── Lists ────────────────────────────────────
    getLists: builder.query<TaskList[], void>({
      query: () => '/lists',
      transformResponse: (response: ApiResponse<TaskList[]>) => response.data,
      providesTags: ['TaskList'],
    }),

    createList: builder.mutation<TaskList, { name: string; icon?: string; color?: string }>({
      query: (body) => ({ url: '/lists', method: 'POST', body }),
      transformResponse: (response: ApiResponse<TaskList>) => response.data,
      invalidatesTags: ['TaskList'],
    }),

    updateList: builder.mutation<TaskList, { id: number; data: Partial<{ name: string; icon: string; color: string; sortOrder: number }> }>({
      query: ({ id, data }) => ({ url: `/lists/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<TaskList>) => response.data,
      invalidatesTags: ['TaskList'],
    }),

    deleteList: builder.mutation<void, number>({
      query: (id) => ({ url: `/lists/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TaskList', 'Task', 'TaskStats'],
    }),

    // ─── Tasks ────────────────────────────────────
    getTasks: builder.query<Task[], { view?: SmartView; listId?: number }>({
      query: (params) => ({ url: '/tasks', params }),
      transformResponse: (response: ApiResponse<Task[]>) => response.data,
      providesTags: ['Task'],
    }),

    getTask: builder.query<Task, number>({
      query: (id) => `/tasks/${id}`,
      transformResponse: (response: ApiResponse<Task>) => response.data,
      providesTags: ['Task'],
    }),

    createTask: builder.mutation<Task, CreateTaskData>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      transformResponse: (response: ApiResponse<Task>) => response.data,
      invalidatesTags: ['Task', 'TaskStats', 'TaskList'],
    }),

    updateTask: builder.mutation<Task, { id: number; data: UpdateTaskData }>({
      query: ({ id, data }) => ({ url: `/tasks/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<Task>) => response.data,
      invalidatesTags: ['Task', 'TaskStats', 'TaskList'],
    }),

    deleteTask: builder.mutation<void, number>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Task', 'TaskStats', 'TaskList'],
    }),

    getTaskStats: builder.query<TaskStats, void>({
      query: () => '/tasks/stats',
      transformResponse: (response: ApiResponse<TaskStats>) => response.data,
      providesTags: ['TaskStats'],
    }),

    // ─── Sub-tasks ────────────────────────────────
    createSubTask: builder.mutation<SubTask, { taskId: number; title: string }>({
      query: ({ taskId, title }) => ({ url: `/tasks/${taskId}/subtasks`, method: 'POST', body: { title } }),
      transformResponse: (response: ApiResponse<SubTask>) => response.data,
      invalidatesTags: ['Task'],
    }),

    updateSubTask: builder.mutation<SubTask, { taskId: number; id: number; data: Partial<{ title: string; completed: boolean }> }>({
      query: ({ taskId, id, data }) => ({ url: `/tasks/${taskId}/subtasks/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<SubTask>) => response.data,
      invalidatesTags: ['Task'],
    }),

    deleteSubTask: builder.mutation<void, { taskId: number; id: number }>({
      query: ({ taskId, id }) => ({ url: `/tasks/${taskId}/subtasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Task'],
    }),
  }),
});

export const {
  useGetListsQuery,
  useCreateListMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetTaskStatsQuery,
  useCreateSubTaskMutation,
  useUpdateSubTaskMutation,
  useDeleteSubTaskMutation,
} = todoApi;
