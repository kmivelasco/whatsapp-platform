import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

interface AnalyticsParams {
  from?: string;
  to?: string;
  groupBy?: string;
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/summary');
      return data;
    },
  });
}

export function useTokenUsage(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'tokens', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.set(k, v);
      });
      const { data } = await api.get(`/analytics/tokens?${searchParams}`);
      return data;
    },
  });
}

export function useCostBreakdown(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'costs', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.set(k, v);
      });
      const { data } = await api.get(`/analytics/costs?${searchParams}`);
      return data;
    },
  });
}

export function useMessageVolume(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'volume', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.set(k, v);
      });
      const { data } = await api.get(`/analytics/volume?${searchParams}`);
      return data;
    },
  });
}

export function useResponseTimes(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'response-times', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.set(k, v);
      });
      const { data } = await api.get(`/analytics/response-times?${searchParams}`);
      return data;
    },
  });
}
