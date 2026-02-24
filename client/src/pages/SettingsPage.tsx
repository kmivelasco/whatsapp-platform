import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Header from '../components/layout/Header';
import { Plus, Trash2, Users, Bot, UserPlus, X, Smartphone } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import WhatsAppWebConnect from '../components/settings/WhatsAppWebConnect';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'bot' | 'whatsapp' | 'users'>('bot');

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
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'whatsapp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            WhatsApp
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
        {activeTab === 'bot' && <BotConfigTab />}
        {activeTab === 'whatsapp' && <WhatsAppTab />}
        {activeTab === 'users' && <UsersTab />}
      </div>
    </div>
  );
}

function WhatsAppTab() {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['bot-configs'],
    queryFn: async () => { const { data } = await api.get('/bot-configs'); return data; },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <div className="text-center py-12">
        <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700">No hay bots configurados</h3>
        <p className="text-sm text-gray-500 mt-1">
          Primero creá un bot en la pestaña "Bot Config" y después conectá WhatsApp acá.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Conexión WhatsApp</h3>
        <p className="text-sm text-gray-500 mt-1">
          Conectá tu número de WhatsApp escaneando el QR code. Tu número sigue funcionando normalmente en el celular.
          Los mensajes que recibas se procesarán con el bot de IA configurado.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="shrink-0">
            <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Dos formas de conectar WhatsApp</h4>
            <div className="mt-2 text-xs text-blue-700 space-y-1">
              <p><strong>QR Code (WhatsApp Web)</strong> — Escaneá con tu celular. Rápido, usa tu número actual. Ideal para probar.</p>
              <p><strong>Cloud API (Meta)</strong> — Configurá en la pestaña Bot Config con las credenciales de Meta Developers. Ideal para producción.</p>
            </div>
          </div>
        </div>
      </div>

      {configs.map((config: any) => (
        <WhatsAppWebConnect
          key={config.id}
          botConfigId={config.id}
          botName={config.name}
        />
      ))}
    </div>
  );
}

function BotConfigTab() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isPlatformAdmin = user?.role === 'ADMIN' && !user?.organizationId;

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', systemPrompt: '', aiProvider: 'openai' as 'openai' | 'anthropic', aiApiKey: '',
    model: 'gpt-4o', temperature: 0.7, maxTokens: 1024,
    organizationId: '',
    whatsappPhoneNumberId: '', whatsappApiToken: '', whatsappVerifyToken: '', whatsappBusinessAccountId: '',
  });

  const openaiModels = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ];
  const anthropicModels = [
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-haiku-4-20250506', label: 'Claude Haiku 4' },
  ];
  const availableModels = form.aiProvider === 'anthropic' ? anthropicModels : openaiModels;

  const { data: configs } = useQuery({
    queryKey: ['bot-configs'],
    queryFn: async () => { const { data } = await api.get('/bot-configs'); return data; },
  });

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data } = await api.get('/organizations');
      // Handle both { data: [...] } and direct array responses
      return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    },
    enabled: isPlatformAdmin,
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
    setForm({
      name: '', systemPrompt: '', aiProvider: 'openai', aiApiKey: '',
      model: 'gpt-4o', temperature: 0.7, maxTokens: 1024,
      organizationId: '',
      whatsappPhoneNumberId: '', whatsappApiToken: '', whatsappVerifyToken: '', whatsappBusinessAccountId: '',
    });
    setEditing('new');
  };

  const handleEdit = (config: any) => {
    setForm({
      name: config.name, systemPrompt: config.systemPrompt,
      aiProvider: config.aiProvider || 'openai', aiApiKey: config.aiApiKey || '',
      model: config.model, temperature: config.temperature, maxTokens: config.maxTokens,
      organizationId: config.organizationId || '',
      whatsappPhoneNumberId: config.whatsappPhoneNumberId || '',
      whatsappApiToken: config.whatsappApiToken || '',
      whatsappVerifyToken: config.whatsappVerifyToken || '',
      whatsappBusinessAccountId: config.whatsappBusinessAccountId || '',
    });
    setEditing(config.id);
  };

  const handleSave = () => {
    const payload = { ...form };
    // Send organizationId only if platform admin selected one
    if (!payload.organizationId) delete (payload as any).organizationId;
    if (editing === 'new') {
      createMutation.mutate(payload);
    } else if (editing) {
      updateMutation.mutate({ id: editing, ...payload });
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
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
              <select value={form.aiProvider} onChange={(e) => {
                const provider = e.target.value as 'openai' | 'anthropic';
                const defaultModel = provider === 'anthropic' ? 'claude-opus-4-20250514' : 'gpt-4o';
                setForm({ ...form, aiProvider: provider, model: defaultModel });
              }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.aiProvider === 'anthropic' ? 'Anthropic API Key' : 'OpenAI API Key'} <span className="text-gray-400 font-normal">(optional - uses server default if empty)</span>
              </label>
              <input type="password" value={form.aiApiKey} onChange={(e) => setForm({ ...form, aiApiKey: e.target.value })} placeholder={form.aiProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {availableModels.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Organization selector - only for platform admin */}
          {isPlatformAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <select
                value={form.organizationId}
                onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">-- Select Organization --</option>
                {organizations?.map((org: any) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
            <textarea value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <input type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
              <input type="number" min="1" max="150000" value={form.maxTokens} onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">WhatsApp Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
                <input type="text" value={form.whatsappPhoneNumberId} onChange={(e) => setForm({ ...form, whatsappPhoneNumberId: e.target.value })} placeholder="e.g. 981676281702836" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                <input type="password" value={form.whatsappApiToken} onChange={(e) => setForm({ ...form, whatsappApiToken: e.target.value })} placeholder="Meta Cloud API token" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verify Token</label>
                <input type="text" value={form.whatsappVerifyToken} onChange={(e) => setForm({ ...form, whatsappVerifyToken: e.target.value })} placeholder="Webhook verify token" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Account ID (optional)</label>
                <input type="text" value={form.whatsappBusinessAccountId} onChange={(e) => setForm({ ...form, whatsappBusinessAccountId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
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
                <span className={`px-2 py-0.5 text-xs rounded ${config.aiProvider === 'anthropic' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                  {config.aiProvider === 'anthropic' ? 'Claude' : 'OpenAI'} &middot; {config.model}
                </span>
                {config.whatsappPhoneNumberId && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">WA Connected</span>
                )}
                {config.organization && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{config.organization.name}</span>
                )}
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
  const authUser = useAuthStore((s) => s.user);
  const isPlatformAdmin = authUser?.role === 'ADMIN' && !authUser?.organizationId;

  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'AGENT', organizationId: '' });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const { data } = await api.get('/users'); return data; },
  });

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data } = await api.get('/organizations');
      return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    },
    enabled: isPlatformAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: async (input: any) => { const { data } = await api.post('/users', input); return data; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setNewUser({ name: '', email: '', password: '', role: 'AGENT', organizationId: '' });
      toast.success('User created successfully');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create user';
      toast.error(msg);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data } = await api.put(`/users/${id}`, { role });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Role updated'); },
    onError: () => toast.error('Failed to update role'),
  });

  const handleCreateUser = () => {
    const payload: any = { name: newUser.name, email: newUser.email, password: newUser.password, role: newUser.role };
    if (newUser.organizationId) payload.organizationId = newUser.organizationId;
    createUserMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
          {showCreate ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-900">New User</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="ADMIN">Admin</option>
                <option value="AGENT">Agent</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>

          {isPlatformAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <select
                value={newUser.organizationId}
                onChange={(e) => setNewUser({ ...newUser, organizationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">-- No Organization (Platform Admin) --</option>
                {organizations?.map((org: any) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Leave empty to create a platform-level admin</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreateUser}
              disabled={!newUser.name || !newUser.email || !newUser.password || newUser.password.length < 6}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create User
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Organization</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.organization ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{u.organization.name}</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">Platform</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
                    className="px-2 py-1 border border-gray-200 rounded text-xs"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="AGENT">Agent</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
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
