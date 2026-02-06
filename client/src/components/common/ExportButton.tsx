import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

interface ExportButtonProps {
  endpoint: string;
  filename: string;
  label?: string;
  params?: Record<string, string>;
}

export default function ExportButton({ endpoint, filename, label = 'Export CSV', params = {} }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams(params);
      const response = await api.get(`${endpoint}?${searchParams}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  );
}
