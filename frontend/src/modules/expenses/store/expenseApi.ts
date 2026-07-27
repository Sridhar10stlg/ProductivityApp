import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Transaction,
  Category,
  Account,
  Budget,
  BudgetSummaryItem,
  BudgetFormData,
  DailyTotal,
  MonthlySummary,
  YearlySummary,
  CategoryBreakdownItem,
  TransactionFormData,
  TransactionType,
} from '../types/expense.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const transactionApi = createApi({
  reducerPath: 'transactionApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Transaction', 'Category', 'Summary', 'Account', 'Budget'],
  endpoints: (builder) => ({
    // Transactions CRUD
    getTransactions: builder.query<Transaction[], { year?: number; month?: number; type?: TransactionType; categoryId?: number; accountId?: number; accountIds?: string }>({
      query: (params) => ({ url: '/transactions', params }),
      transformResponse: (response: ApiResponse<Transaction[]>) => response.data,
      providesTags: ['Transaction'],
    }),

    createTransaction: builder.mutation<Transaction, TransactionFormData>({
      query: (body) => ({ url: '/transactions', method: 'POST', body }),
      transformResponse: (response: ApiResponse<Transaction>) => response.data,
      invalidatesTags: ['Transaction', 'Summary'],
    }),

    updateTransaction: builder.mutation<Transaction, { id: number; data: Partial<TransactionFormData> }>({
      query: ({ id, data }) => ({ url: `/transactions/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<Transaction>) => response.data,
      invalidatesTags: ['Transaction', 'Summary'],
    }),

    deleteTransaction: builder.mutation<void, number>({
      query: (id) => ({ url: `/transactions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Transaction', 'Summary'],
    }),

    // Summaries
    getDailyTotals: builder.query<DailyTotal[], { year: number; month: number; accountId?: number; accountIds?: string }>({
      query: (params) => ({ url: '/transactions/summary/daily', params }),
      transformResponse: (response: ApiResponse<DailyTotal[]>) => response.data,
      providesTags: ['Summary'],
    }),

    getMonthlySummary: builder.query<MonthlySummary, { year: number; month: number; accountId?: number; accountIds?: string }>({
      query: (params) => ({ url: '/transactions/summary/monthly', params }),
      transformResponse: (response: ApiResponse<MonthlySummary>) => response.data,
      providesTags: ['Summary'],
    }),

    getYearlySummary: builder.query<YearlySummary, { year: number; accountId?: number; accountIds?: string }>({
      query: (params) => ({ url: '/transactions/summary/yearly', params }),
      transformResponse: (response: ApiResponse<YearlySummary>) => response.data,
      providesTags: ['Summary'],
    }),

    getCategorySummary: builder.query<CategoryBreakdownItem[], { year: number; month?: number; type?: TransactionType; accountId?: number; accountIds?: string }>({
      query: (params) => ({ url: '/transactions/summary/category', params }),
      transformResponse: (response: ApiResponse<CategoryBreakdownItem[]>) => response.data,
      providesTags: ['Summary'],
    }),

    // Categories
    getCategories: builder.query<Category[], { type?: TransactionType } | void>({
      query: (params) => ({ url: '/categories', params: params || {} }),
      transformResponse: (response: ApiResponse<Category[]>) => response.data,
      providesTags: ['Category'],
    }),

    createCategory: builder.mutation<Category, { name: string; type: TransactionType; icon?: string; color?: string }>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      transformResponse: (response: ApiResponse<Category>) => response.data,
      invalidatesTags: ['Category'],
    }),

    // Accounts
    getAccounts: builder.query<Account[], void>({
      query: () => '/accounts',
      transformResponse: (response: ApiResponse<Account[]>) => response.data,
      providesTags: ['Account'],
    }),

    createAccount: builder.mutation<Account, { name: string; icon?: string; color?: string }>({
      query: (body) => ({ url: '/accounts', method: 'POST', body }),
      transformResponse: (response: ApiResponse<Account>) => response.data,
      invalidatesTags: ['Account'],
    }),

    // Budgets
    getBudgets: builder.query<Budget[], void>({
      query: () => '/budgets',
      transformResponse: (response: ApiResponse<Budget[]>) => response.data,
      providesTags: ['Budget'],
    }),

    getBudgetSummary: builder.query<BudgetSummaryItem[], void>({
      query: () => '/budgets/summary',
      transformResponse: (response: ApiResponse<BudgetSummaryItem[]>) => response.data,
      providesTags: ['Budget', 'Transaction'],
    }),

    createBudget: builder.mutation<Budget, BudgetFormData>({
      query: (body) => ({ url: '/budgets', method: 'POST', body }),
      transformResponse: (response: ApiResponse<Budget>) => response.data,
      invalidatesTags: ['Budget'],
    }),

    updateBudget: builder.mutation<Budget, { id: number; data: Partial<BudgetFormData> }>({
      query: ({ id, data }) => ({ url: `/budgets/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<Budget>) => response.data,
      invalidatesTags: ['Budget'],
    }),

    deleteBudget: builder.mutation<void, number>({
      query: (id) => ({ url: `/budgets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Budget'],
    }),

    // Import/Export
    importExcel: builder.mutation<
      { totalRows: number; imported: number; skipped: number; accountsCreated: number; categoriesCreated: number },
      FormData
    >({
      query: (formData) => ({
        url: '/data/import',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<{ totalRows: number; imported: number; skipped: number; accountsCreated: number; categoriesCreated: number }>) => response.data,
      invalidatesTags: ['Transaction', 'Summary', 'Category', 'Account'],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useGetDailyTotalsQuery,
  useGetMonthlySummaryQuery,
  useGetYearlySummaryQuery,
  useGetCategorySummaryQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetAccountsQuery,
  useCreateAccountMutation,
  useImportExcelMutation,
  useGetBudgetsQuery,
  useGetBudgetSummaryQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} = transactionApi;
