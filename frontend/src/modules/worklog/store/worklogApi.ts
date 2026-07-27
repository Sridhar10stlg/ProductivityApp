import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { WorklogEntry, CreateWorklogData, UpdateWorklogData } from '../types/worklog.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const worklogApi = createApi({
  reducerPath: 'worklogApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Worklog'],
  endpoints: (builder) => ({
    getWorklogs: builder.query<WorklogEntry[], { from?: string; to?: string }>({
      query: (params) => ({ url: '/worklog', params }),
      transformResponse: (response: ApiResponse<WorklogEntry[]>) => response.data,
      providesTags: ['Worklog'],
    }),

    createWorklog: builder.mutation<WorklogEntry, CreateWorklogData>({
      query: (body) => ({ url: '/worklog', method: 'POST', body }),
      transformResponse: (response: ApiResponse<WorklogEntry>) => response.data,
      invalidatesTags: ['Worklog'],
    }),

    updateWorklog: builder.mutation<WorklogEntry, { id: number; data: UpdateWorklogData }>({
      query: ({ id, data }) => ({ url: `/worklog/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<WorklogEntry>) => response.data,
      invalidatesTags: ['Worklog'],
    }),

    deleteWorklog: builder.mutation<void, number>({
      query: (id) => ({ url: `/worklog/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Worklog'],
    }),
  }),
});

export const {
  useGetWorklogsQuery,
  useCreateWorklogMutation,
  useUpdateWorklogMutation,
  useDeleteWorklogMutation,
} = worklogApi;
