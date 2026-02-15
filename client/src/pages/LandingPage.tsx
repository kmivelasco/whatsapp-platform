import { Link } from 'react-router-dom';
import { MessageSquare, Bot, Users, BarChart3, Zap, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Inbox en Tiempo Real',
    description: 'Ve y responde todos tus chats de WhatsApp desde un unico dashboard. Mensajes en tiempo real via WebSocket.',
  },
  {
    icon: Bot,
    title: 'Bot IA con GPT-4o',
    description: 'Automatiza respuestas con inteligencia artificial. Configura el prompt, modelo y personalidad de tu bot.',
  },
  {
    icon: Users,
    title: 'Toggle IA / Humano',
    description: 'Cambia entre modo bot automatico y control manual con un click. El agente humano toma el control cuando lo necesites.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Completos',
    description: 'Metricas de uso, costos por modelo, volumen de mensajes y tiempos de respuesta en tiempo real.',
  },
  {
    icon: Zap,
    title: 'Multi-Agente',
    description: 'Asigna conversaciones a diferentes agentes. Roles: Admin, Agente y Viewer con permisos granulares.',
  },
  {
    icon: Shield,
    title: 'API Oficial de Meta',
    description: 'Integracion directa con WhatsApp Business Cloud API. Estable, seguro y sin riesgo de bloqueo.',
  },
];

const planFeatures = [
  'Bot IA con GPT-4o',
  'Inbox en tiempo real',
  'Toggle IA / Humano',
  'Conversaciones ilimitadas',
  'Analytics y metricas',
  'Export CSV / PDF',
  'Multi-agente',
  'Soporte prioritario',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            <span className="text-blue-600">Spark</span> CRM
          </h1>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <Link
              to="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Iniciar sesion
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm text-blue-700">
            <Zap className="h-4 w-4" />
            WhatsApp Business + Inteligencia Artificial
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
            Tu CRM de WhatsApp
            <br />
            <span className="text-blue-600">con IA integrada</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-500">
            Gestiona todas tus conversaciones de WhatsApp Business desde un dashboard.
            Bot con GPT-4o, inbox en tiempo real, analytics y control total.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Empezar 7 dias gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="rounded-xl border border-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Ver precios
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Todo lo que necesitas para WhatsApp Business
            </h2>
            <p className="text-gray-500">
              Una plataforma completa para gestionar tus clientes por WhatsApp.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Precio simple y transparente
          </h2>
          <p className="mb-12 text-gray-500">
            Un solo plan con todo incluido. 7 dias de prueba gratis.
          </p>

          <div className="rounded-2xl border-2 border-blue-200 bg-white p-8 shadow-lg">
            <div className="mb-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              7 dias gratis
            </div>
            <div className="mb-6">
              <span className="text-5xl font-bold text-gray-900">$150</span>
              <span className="text-gray-400 text-lg"> USD/mes</span>
            </div>
            <ul className="mb-8 space-y-3 text-left">
              {planFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Empezar prueba gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield className="h-3.5 w-3.5" />
              Pago seguro. Cancela cuando quieras.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Spark CRM. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
