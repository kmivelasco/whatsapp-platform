import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Wifi, WifiOff, QrCode, Loader2, Phone, RefreshCw, Unplug } from 'lucide-react';
import api from '../../api/client';
import { useSocket } from '../../hooks/useSocket';

interface WhatsAppWebConnectProps {
  botConfigId: string;
  botName: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'qr' | 'connected';

export default function WhatsAppWebConnect({ botConfigId, botName }: WhatsAppWebConnectProps) {
  const queryClient = useQueryClient();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  // Fetch initial status
  const { data: statusData } = useQuery({
    queryKey: ['wa-web-status', botConfigId],
    queryFn: async () => {
      const { data } = await api.get(`/wa-web/status/${botConfigId}`);
      return data;
    },
    refetchInterval: status === 'connecting' || status === 'qr' ? 3000 : 30000,
  });

  useEffect(() => {
    if (statusData) {
      setStatus(statusData.status);
      setQrCode(statusData.qrCode);
      setPhoneNumber(statusData.phoneNumber);
    }
  }, [statusData]);

  // Listen for real-time status updates via Socket.io
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleStatus = (data: { botConfigId: string; status: ConnectionStatus; qrCode: string | null }) => {
      if (data.botConfigId === botConfigId) {
        setStatus(data.status);
        setQrCode(data.qrCode);
        if (data.status === 'connected') {
          toast.success('WhatsApp conectado!');
          queryClient.invalidateQueries({ queryKey: ['wa-web-status', botConfigId] });
        }
      }
    };

    socket.on('wa_web_status', handleStatus);
    return () => { socket.off('wa_web_status', handleStatus); };
  }, [socket, botConfigId, queryClient]);

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/wa-web/connect', { botConfigId });
      return data;
    },
    onSuccess: (data) => {
      setStatus(data.status);
      if (data.qrCode) setQrCode(data.qrCode);
      if (data.status === 'connected') {
        toast.success('Ya estás conectado!');
      }
    },
    onError: () => toast.error('Error al conectar'),
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await api.post('/wa-web/disconnect', { botConfigId });
    },
    onSuccess: () => {
      setStatus('disconnected');
      setQrCode(null);
      setPhoneNumber(null);
      toast.success('WhatsApp desconectado');
      queryClient.invalidateQueries({ queryKey: ['wa-web-status', botConfigId] });
    },
    onError: () => toast.error('Error al desconectar'),
  });

  const statusConfig = {
    disconnected: {
      color: 'bg-gray-100 text-gray-600',
      dot: 'bg-gray-400',
      text: 'Desconectado',
    },
    connecting: {
      color: 'bg-yellow-100 text-yellow-700',
      dot: 'bg-yellow-400',
      text: 'Conectando...',
    },
    qr: {
      color: 'bg-blue-100 text-blue-700',
      dot: 'bg-blue-400',
      text: 'Esperando escaneo QR',
    },
    connected: {
      color: 'bg-green-100 text-green-700',
      dot: 'bg-green-500',
      text: 'Conectado',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{botName}</h3>
            <p className="text-xs text-gray-500">WhatsApp Web Connection</p>
          </div>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${currentStatus.color}`}>
          <div className={`w-2 h-2 rounded-full ${currentStatus.dot} ${status === 'connecting' || status === 'qr' ? 'animate-pulse' : ''}`} />
          {currentStatus.text}
          {phoneNumber && status === 'connected' && (
            <span className="ml-1 font-mono">+{phoneNumber}</span>
          )}
        </div>
      </div>

      {/* QR Code area */}
      {status === 'qr' && qrCode && (
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
            <img src={qrCode} alt="QR Code" className="w-64 h-64" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Escaneá el QR con tu WhatsApp</p>
            <p className="text-xs text-gray-500 mt-1">
              Abrí WhatsApp → Menú (⋮) → Dispositivos vinculados → Vincular dispositivo
            </p>
          </div>
        </div>
      )}

      {/* Connecting spinner */}
      {status === 'connecting' && !qrCode && (
        <div className="flex flex-col items-center py-8 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Iniciando conexión...</p>
        </div>
      )}

      {/* Connected info */}
      {status === 'connected' && (
        <div className="bg-green-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">WhatsApp conectado y activo</p>
              <p className="text-xs text-green-600 mt-0.5">
                El bot está recibiendo y respondiendo mensajes automáticamente.
                Podés tomar control manual desde el chat de cada conversación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Disconnected info */}
      {status === 'disconnected' && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">No hay conexión activa</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Conectá tu WhatsApp escaneando un QR. Tu número sigue funcionando normalmente en el celular.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {status === 'disconnected' && (
          <button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {connectMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <QrCode className="w-4 h-4" />
            )}
            Conectar con QR
          </button>
        )}

        {(status === 'qr' || status === 'connecting') && (
          <button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${connectMutation.isPending ? 'animate-spin' : ''}`} />
            Regenerar QR
          </button>
        )}

        {status === 'connected' && (
          <button
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {disconnectMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Unplug className="w-4 h-4" />
            )}
            Desconectar
          </button>
        )}
      </div>
    </div>
  );
}
