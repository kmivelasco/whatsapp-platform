import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Header from '../components/layout/Header';
import { Plus, Trash2, Building2, Users, Bot } from 'lucide-react';

export default function OrganizationsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '' });

  const { data } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => { const { data } = await api.get('/organizations'); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (input: any) => { const { data } = await api.post('/organizations', input); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['organizations'] }); setEditing(null); toast.success('Organization created'); },
    onError: () => toast.error('Failed to create organization'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/organizations/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['organizations'] }); toast.success('Organization deleted'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete organization'),
  });

  const handleNew = () => {
    setForm({ name: '', slug: '' });
    setEditing('new');
  };

  const handleSave = () => {
    if (editing === 'new') {
      createMutation.mutate(form);
    }
  };

  const orgs = data?.data ?? [];

  return (
    <div className="flex flex-col h-full">
      <Header title="Organizations" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">All Organizations</h3>
            <button onClick={handleNew} className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
              <Plus className="w-4 h-4" /> New Organization
            </button>
          </div>

          {editing === 'new' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') })}
                    placeholder="Organization name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="organization-slug"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">Create</button>
                <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {orgs.map((org: any) => (
              <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{org.name}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{org.slug}</span>
                    {!org.isActive && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {org._count?.users ?? 0} users</span>
                    <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> {org._count?.botConfigs ?? 0} bots</span>
                    <span>{org._count?.clients ?? 0} clients</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => deleteMutation.mutate(org.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
