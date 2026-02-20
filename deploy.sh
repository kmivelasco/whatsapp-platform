#!/bin/bash
# ==========================================
# Spark CRM - Deploy Script para VPS Hostinger
# ==========================================
# Conectarse al VPS por SSH y ejecutar este script

set -e

echo "🚀 Spark CRM — Deploy en VPS Hostinger"
echo "========================================"

# 1. Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado."
    echo "⚠️  Cerrá y abrí la sesión SSH, después volvé a ejecutar este script."
    exit 0
fi

# 2. Instalar Docker Compose plugin si no está
if ! docker compose version &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
fi

# 3. Crear directorio de la app
APP_DIR="/opt/sparkcrm"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
cd $APP_DIR

# 4. Clonar o actualizar el repo
if [ -d ".git" ]; then
    echo "🔄 Actualizando código..."
    git pull origin main
else
    echo "📥 Clonando repositorio..."
    git clone https://github.com/kmivelasco/whatsapp-platform.git .
fi

# 5. Crear .env si no existe
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creando archivo .env de producción..."
    echo "   Voy a pedirte algunos valores."
    echo ""

    # Generar JWT secret automáticamente
    JWT_SEC=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '\n/')
    DB_PASS=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -d '\n/')

    read -p "🔑 OpenAI API Key: " OPENAI_KEY
    read -p "💳 Rebill API Key: " REBILL_KEY
    read -p "📋 Rebill Plan ID: " REBILL_PLAN

    cat > .env << ENVEOF
DB_PASSWORD=${DB_PASS}
JWT_SECRET=${JWT_SEC}
OPENAI_API_KEY=${OPENAI_KEY}
REBILL_API_KEY=${REBILL_KEY}
REBILL_PLAN_ID=${REBILL_PLAN}
ENVEOF

    echo "✅ .env creado con passwords generadas automáticamente"
fi

# 6. Build y deploy
echo ""
echo "🔨 Construyendo y desplegando (puede demorar unos minutos la primera vez)..."
docker compose -f docker-compose.production.yml build app
docker compose -f docker-compose.production.yml up -d

echo ""
echo "⏳ Esperando que los servicios arranquen..."
sleep 15

# 7. Verificar salud
echo "🏥 Verificando servicios..."
if curl -sf http://localhost:3001/api/health > /dev/null; then
    echo "✅ App corriendo correctamente!"
else
    echo "⚠️  La app aún no responde. Verificá los logs:"
    echo "   docker compose -f docker-compose.production.yml logs app"
fi

echo ""
echo "========================================"
echo "✅ Deploy completado!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Apuntá el DNS de plataformabot.spark101.tech a la IP de este VPS"
echo "      (Registro tipo A → IP del VPS)"
echo "   2. Caddy generará el certificado SSL automáticamente"
echo "   3. Accedé a https://plataformabot.spark101.tech"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:     docker compose -f docker-compose.production.yml logs -f"
echo "   Ver logs app: docker compose -f docker-compose.production.yml logs -f app"
echo "   Reiniciar:    docker compose -f docker-compose.production.yml restart"
echo "   Parar:        docker compose -f docker-compose.production.yml down"
echo "   Actualizar:   git pull && docker compose -f docker-compose.production.yml up -d --build"
echo "========================================"
