import axios from 'axios'
import type { Customer, AnalyticsSummary } from '../types'

const api = axios.create({ baseURL: '/api' })

export const customersApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<{ data: Customer[]; meta: { total: number } }>('/customers', { params }).then(r => r.data),
  get: (id: string) =>
    api.get<{ data: Customer }>(`/customers/${id}`).then(r => r.data.data),
  create: (data: Partial<Customer>) =>
    api.post<{ data: Customer }>('/customers', data).then(r => r.data.data),
  update: (id: string, data: Partial<Customer>) =>
    api.put<{ data: Customer }>(`/customers/${id}`, data).then(r => r.data.data),
  delete: (id: string) => api.delete(`/customers/${id}`),
}

export const analyticsApi = {
  summary: () => api.get<{ data: AnalyticsSummary }>('/analytics/summary').then(r => r.data.data),
  trends: () => api.get<{ data: { date: string; count: number }[] }>('/analytics/trends').then(r => r.data.data),
  budgetDistribution: () => api.get<{ data: { label: string; count: number }[] }>('/analytics/budget-distribution').then(r => r.data.data),
  locationBreakdown: () => api.get<{ data: { location: string; count: number; avg_budget: number }[] }>('/analytics/location-breakdown').then(r => r.data.data),
}

export const queryApi = {
  query: (query: string) =>
    api.post<{ data: { customers: Customer[]; insights: string; total: number } }>('/query', { query }).then(r => r.data.data),
}
