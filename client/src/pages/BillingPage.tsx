import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Crown, CheckCircle2, Loader2, ArrowRight, Shield, AlertTriangle, Zap, XCircle } from 'lucide-react';
import api from '../api/client';

interface SubscriptionData {
  plan: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
}

export default function BillingPage() {
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'approved') {
      setSuccessMessage(true);
      loadSubscription();
      setTimeout(() => setSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  async function loadSubscription() {
    try {
      const { data } = await api.get('/rebill/subscription');
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const { data } = await api.post('/rebill/checkout');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      alert('Error al crear la suscripcion');
      setSubscribing(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Estas seguro de que queres cancelar tu suscripcion?')) return;

    setCanceling(true);
    try {
      await api.post('/rebill/cancel');
      await loadSubscription();
    } catch (error) {
      alert('Error al cancelar la suscripcion');
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const isPro = subscription?.plan === 'pro';
  const isTrial = subscription?.plan === 'trial';
  const isExpired = subscription?.plan === 'expired' || subscription?.plan === 'canceled' || subscription?.plan === 'past_due';

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plan & Billing</h1>
        <p className="mt-1 text-gray-500">
          Gestiona tu suscripcion y accede a todas las funcionalidades.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-700">
            Suscripcion activada correctamente. Tu prueba gratis de 7 dias comenzo.
          </p>
        </div>
      )}

      {/* Expired warning */}
      {isExpired && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-700">
            Tu suscripcion expiro. Activa el plan Pro para seguir usando la plataforma.
          </p>
        </div>
      )}

      {/* Current plan banner */}
      <div className={`mb-8 flex items-center gap-4 rounded-xl border p-6 ${
        isPro ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
      }`}>
        <div className={`rounded-xl p-3 ${isPro ? 'bg-blue-100' : 'bg-gray-100'}`}>
          {isPro ? (
            <Crown className="h-6 w-6 text-blue-600" />
          ) : (
            <Zap className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Plan {isPro ? 'Pro' : isTrial ? `Trial (${trialDaysLeft} dias restantes)` : 'Inactivo'}
          </h2>
          <p className="text-sm text-gray-500">
            {isPro
              ? 'Acceso completo a todas las funcionalidades'
              : isTrial
              ? 'Prueba gratis con funcionalidades completas'
              : 'Activa tu plan para continuar'}
          </p>
        </div>
        {isPro && (
          <div className="ml-auto flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600">Activo</span>
          </div>
        )}
      </div>

      {/* Plan card */}
      <div className="rounded-xl border border-blue-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">WhatsApp CRM Pro</h3>
            <p className="text-sm text-gray-500">Todo lo que necesitas para gestionar tus clientes</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-blue-600">$150</span>
            <span className="text-gray-400"> USD/mes</span>
            <p className="text-xs text-gray-400 mt-1">7 dias de prueba gratis</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            'Bot IA con GPT-4o',
            'Inbox en tiempo real',
            'Toggle IA / Humano',
            'Conversaciones ilimitadas',
            'Analytics y metricas',
            'Export CSV / PDF',
            'Multi-agente',
            'Soporte prioritario',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        {isPro ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 border border-green-200 py-3 text-sm font-semibold text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Plan activo
            </div>
            <button
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {canceling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Cancelar suscripcion
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {subscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Empezar 7 dias gratis
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Security note */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <Shield className="mt-0.5 h-5 w-5 text-blue-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-900">Pago seguro</p>
          <p className="text-xs text-gray-500">
            Tus datos de pago son procesados de forma segura. Nunca almacenamos tu informacion financiera. Podes cancelar en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  );
}
