import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Habit,
  HabitPhase,
  HabitSettings,
  DayScore,
  SaveDayData,
  StreaksConfig,
  StreaksSummary,
  WeeklyReview,
  LeetCodeData,
  LeetCodeEntry,
  LeetCodeFormData,
  StreaksImportResult,
  HabitGroup,
  HabitStats,
  JsonPreviewHabit,
  JsonMappingItem,
  JsonImportResult,
} from '../types/streaks.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const streaksApi = createApi({
  reducerPath: 'streaksApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1/streaks' }),
  // StreakConfig: settings, phases, habits. StreakDay: anything computed from the daily log.
  tagTypes: ['StreakConfig', 'StreakDay', 'LeetCode'],
  endpoints: (builder) => ({
    // ─── Configuration ───
    getConfig: builder.query<StreaksConfig, void>({
      query: () => '/config',
      transformResponse: (response: ApiResponse<StreaksConfig>) => response.data,
      providesTags: ['StreakConfig'],
    }),

    updateSettings: builder.mutation<HabitSettings, Partial<Omit<HabitSettings, 'id'>>>({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
      transformResponse: (response: ApiResponse<HabitSettings>) => response.data,
      invalidatesTags: ['StreakConfig', 'StreakDay', 'LeetCode'],
    }),

    replacePhases: builder.mutation<HabitPhase[], HabitPhase[]>({
      query: (phases) => ({ url: '/phases', method: 'PUT', body: { phases } }),
      transformResponse: (response: ApiResponse<HabitPhase[]>) => response.data,
      invalidatesTags: ['StreakConfig', 'StreakDay'],
    }),

    createHabit: builder.mutation<Habit, { name: string; group: HabitGroup; activeFromPhase: number }>({
      query: (body) => ({ url: '/habits', method: 'POST', body }),
      transformResponse: (response: ApiResponse<Habit>) => response.data,
      invalidatesTags: ['StreakConfig', 'StreakDay'],
    }),

    updateHabit: builder.mutation<Habit, { id: number; data: Partial<Pick<Habit, 'name' | 'group' | 'activeFromPhase' | 'archived'>> }>({
      query: ({ id, data }) => ({ url: `/habits/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<Habit>) => response.data,
      invalidatesTags: ['StreakConfig', 'StreakDay'],
    }),

    reorderHabits: builder.mutation<Habit[], number[]>({
      query: (ids) => ({ url: '/habits/order', method: 'PUT', body: { ids } }),
      transformResponse: (response: ApiResponse<Habit[]>) => response.data,
      invalidatesTags: ['StreakConfig', 'StreakDay'],
    }),

    deleteHabit: builder.mutation<void, number>({
      query: (id) => ({ url: `/habits/${id}`, method: 'DELETE' }),
      invalidatesTags: ['StreakConfig', 'StreakDay'],
    }),

    // ─── Daily log ───
    getDays: builder.query<DayScore[], { from: string; to: string }>({
      query: (params) => ({ url: '/days', params }),
      transformResponse: (response: ApiResponse<DayScore[]>) => response.data,
      providesTags: ['StreakDay'],
    }),

    saveDay: builder.mutation<DayScore, { date: string; data: SaveDayData }>({
      query: ({ date, data }) => ({ url: `/days/${date}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<DayScore>) => response.data,
      invalidatesTags: ['StreakDay'],
    }),

    // ─── Reports ───
    getSummary: builder.query<StreaksSummary, void>({
      query: () => '/summary',
      transformResponse: (response: ApiResponse<StreaksSummary>) => response.data,
      providesTags: ['StreakDay', 'StreakConfig'],
    }),

    getWeekly: builder.query<WeeklyReview, void>({
      query: () => '/weekly',
      transformResponse: (response: ApiResponse<WeeklyReview>) => response.data,
      providesTags: ['StreakDay', 'StreakConfig'],
    }),

    getHabitStats: builder.query<HabitStats, number>({
      query: (id) => `/habits/${id}/stats`,
      transformResponse: (response: ApiResponse<HabitStats>) => response.data,
      providesTags: ['StreakDay', 'StreakConfig'],
    }),

    // ─── LeetCode ───
    getLeetCode: builder.query<LeetCodeData, void>({
      query: () => '/leetcode',
      transformResponse: (response: ApiResponse<LeetCodeData>) => response.data,
      providesTags: ['LeetCode'],
    }),

    createLeetCode: builder.mutation<LeetCodeEntry, LeetCodeFormData>({
      query: (body) => ({ url: '/leetcode', method: 'POST', body }),
      transformResponse: (response: ApiResponse<LeetCodeEntry>) => response.data,
      invalidatesTags: ['LeetCode'],
    }),

    updateLeetCode: builder.mutation<LeetCodeEntry, { id: number; data: Partial<LeetCodeFormData> }>({
      query: ({ id, data }) => ({ url: `/leetcode/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<LeetCodeEntry>) => response.data,
      invalidatesTags: ['LeetCode'],
    }),

    deleteLeetCode: builder.mutation<void, number>({
      query: (id) => ({ url: `/leetcode/${id}`, method: 'DELETE' }),
      invalidatesTags: ['LeetCode'],
    }),

    // ─── Import ───
    importStreaks: builder.mutation<StreaksImportResult, { file: File; overwriteSettings: boolean }>({
      query: ({ file, overwriteSettings }) => {
        const body = new FormData();
        body.append('file', file);
        return { url: `/data/import?overwriteSettings=${overwriteSettings}`, method: 'POST', body };
      },
      transformResponse: (response: ApiResponse<StreaksImportResult>) => response.data,
      invalidatesTags: ['StreakConfig', 'StreakDay', 'LeetCode'],
    }),

    previewJsonImport: builder.mutation<JsonPreviewHabit[], File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/data/import-json/preview', method: 'POST', body };
      },
      transformResponse: (response: ApiResponse<JsonPreviewHabit[]>) => response.data,
    }),

    importJson: builder.mutation<JsonImportResult, { file: File; mapping: JsonMappingItem[] }>({
      query: ({ file, mapping }) => {
        const body = new FormData();
        body.append('file', file);
        body.append('mapping', JSON.stringify(mapping));
        return { url: '/data/import-json', method: 'POST', body };
      },
      transformResponse: (response: ApiResponse<JsonImportResult>) => response.data,
      invalidatesTags: ['StreakConfig', 'StreakDay'],
    }),
  }),
});

export const {
  useGetConfigQuery,
  useUpdateSettingsMutation,
  useReplacePhasesMutation,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  useReorderHabitsMutation,
  useDeleteHabitMutation,
  useGetDaysQuery,
  useSaveDayMutation,
  useGetSummaryQuery,
  useGetWeeklyQuery,
  useGetHabitStatsQuery,
  useGetLeetCodeQuery,
  useCreateLeetCodeMutation,
  useUpdateLeetCodeMutation,
  useDeleteLeetCodeMutation,
  useImportStreaksMutation,
  usePreviewJsonImportMutation,
  useImportJsonMutation,
} = streaksApi;
