import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Header from '../components/layout/Header';
import { Plus, Trash2, Check, Users, Bot } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'bot' | 'users'>('bot');

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bot' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Bot className="w-4 h-4" />
            Bot Config
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        </div>
      </Header>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'bot' ? <BotConfigTab /> : <UsersTab />}
      </div>
    </div>
  );
}

function BotConfigTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', systemPrompt: '', model: 'gpt-4o', temperature: 0.7, maxTokens: 1024, isActive: false });

  const { data: configs } = useQuery({
    queryKey: ['bot-configs'],
    queryFn: async () => { const { data } = await api.get('/bot-configs'); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (input: any) => { const { data } = await api.post('/bot-configs', input); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bot-configs'] }); setEditing(null); toast.success('Config created'); },
    onError: () => toast.error('Failed to create config'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: any) => { const { data } = await api.put(`/bot-configs/${id}`, input); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bot-configs'] }); setEditing(null); toast.success('Config updated'); },
    onError: () => toast.error('Failed to update config'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/bot-configs/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bot-configs'] }); toast.success('Config deleted'); },
    onError: () => toast.error('Failed to delete config'),
  });

  const handleNew = () => {
    setForm({ name: '', systemPrompt: '', model: 'gpt-4o', temperature: 0.7, maxTokens: 1024, isActive: false });
    setEditing('new');
  };

  const handleEdit = (config: any) => {
    setForm({ name: config.name, systemPrompt: config.systemPrompt, model: config.model, temperature: config.temperature, maxTokens: config.maxTokens, isActive: config.isActive });
    setEditing(config.id);
  };

  const handleSave = () => {
    if (editing === 'new') {
      createMutation.mutate(form);
    } else if (editing) {
      updateMutation.mutate({ id: editing, ...form });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Bot Configurations</h3>
        <button onClick={handleNew} className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" /> New Config
        </button>
      </div>

      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
            <textarea value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <input type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
              <input type="number" min="1" max="16384" value={form.maxTokens} onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">Save</button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {configs?.map((config: any) => (
          <div key={config.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{config.name}</span>
                {config.isActive && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{config.model}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{config.systemPrompt}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => handleEdit(config)} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">Edit</button>
              <button onClick={() => deleteMutation.mutate(config.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const { data } = await api.get('/users'); return data; },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data } = await api.put(`/users/${id}`, { role });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Role updated'); },
    onError: () => toast.error('Failed to update role'),
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">User Management</h3>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => updateRoleMutation.mutate({ id: user.id, role: e.target.value })}
                    className="px-2 py-1 border border-gray-200 rounded text-xs"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="AGENT">Agent</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
