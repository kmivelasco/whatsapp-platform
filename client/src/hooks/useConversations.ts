import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

interface ConversationFilters {
  page?: number;
  limit?: number;
  status?: string;
  mode?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useConversations(filters: ConversationFilters = {}) {
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, String(value));
        }
      });
      const { data } = await api.get(`/conversations?${params}`);
      return data;
    },
    refetchInterval: 10_000,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useMessages(conversationId: string | null, page = 1) {
  return useQuery({
    queryKey: ['messages', conversationId, page],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}/messages?page=${page}&limit=50`);
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { data } = await api.post(`/conversations/${conversationId}/messages`, { content });
      return data;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, mode }: { conversationId: string; mode: string }) => {
      const { data } = await api.put(`/conversations/${conversationId}/mode`, { mode });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: string }) => {
      const { data } = await api.put(`/conversations/${conversationId}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
