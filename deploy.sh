#!/bin/bash

# Script de Deploy - Smart Gabinete Email System
# Uso: ./deploy.sh [production|development]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Instale o Docker primeiro."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
    fi
    
    log "Docker e Docker Compose encontrados"
}

# Verificar arquivo .env
check_env() {
    if [ ! -f .env ]; then
        warn "Arquivo .env não encontrado. Criando exemplo..."
        cat > .env << EOF
# Configurações SMTP
EMAIL=contato@smartgabinete.com.br
PASSWORD=sua_senha_smtp_hostinger

# Configurações do Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF
        error "Arquivo .env criado. Configure suas credenciais SMTP e execute novamente."
    fi
    
    log "Arquivo .env encontrado"
}

# Backup dos dados
backup_data() {
    if docker volume ls | grep -q emailtrigger_email_data; then
        log "Fazendo backup dos dados..."
        BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        docker run --rm -v emailtrigger_email_data:/data -v $(pwd):/backup alpine tar czf /backup/$BACKUP_FILE -C /data . 2>/dev/null || warn "Não foi possível fazer backup (volume pode estar vazio)"
        log "Backup salvo como $BACKUP_FILE"
    fi
}

# Deploy básico
deploy_basic() {
    log "Iniciando deploy básico..."
    
    # Parar containers existentes
    docker-compose down 2>/dev/null || true
    
    # Build e start
    docker-compose up -d --build
    
    log "Deploy básico concluído!"
    log "Aplicação disponível em: http://localhost:3000"
}

# Deploy com SSL
deploy_production() {
    log "Iniciando deploy com SSL..."
    
    # Verificar certificados SSL
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        warn "Certificados SSL não encontrados. Gerando certificado auto-assinado..."
        mkdir -p ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem -out ssl/cert.pem \
            -subj "/C=BR/ST=SP/L=Sao Paulo/O=Smart Gabinete/CN=localhost" 2>/dev/null || \
            error "Falha ao gerar certificado SSL"
    fi
    
    # Parar containers existentes
    docker-compose down 2>/dev/null || true
    
    # Build e start com Nginx
    docker-compose --profile production up -d --build
    
    log "Deploy com SSL concluído!"
    log "Aplicação disponível em: https://localhost"
}

# Verificar saúde da aplicação
health_check() {
    log "Verificando saúde da aplicação..."
    
    # Aguardar aplicação inicializar
    sleep 10
    
    # Testar endpoint de saúde
    if curl -f http://localhost:3000/api/email-reputation >/dev/null 2>&1; then
        log "✅ Aplicação está funcionando corretamente!"
    else
        warn "⚠️  Aplicação pode não estar funcionando. Verifique os logs:"
        echo "docker-compose logs emailtrigger"
    fi
}

# Limpeza
cleanup() {
    log "Limpando imagens não utilizadas..."
    docker system prune -f
}

# Função principal
main() {
    local ENV=${1:-production}
    
    log "🚀 Iniciando deploy do Smart Gabinete Email System..."
    log "Ambiente: $ENV"
    
    # Verificações
    check_docker
    check_env
    
    # Backup
    backup_data
    
    # Deploy baseado no ambiente
    if [ "$ENV" = "production" ]; then
        deploy_production
    else
        deploy_basic
    fi
    
    # Verificações pós-deploy
    health_check
    cleanup
    
    log "🎉 Deploy concluído com sucesso!"
    
    # Informações úteis
    echo
    echo -e "${BLUE}📋 Comandos úteis:${NC}"
    echo "  Ver logs: docker-compose logs -f"
    echo "  Status: docker-compose ps"
    echo "  Parar: docker-compose down"
    echo "  Reiniciar: docker-compose restart"
    echo
    echo -e "${BLUE}🔗 URLs:${NC}"
    if [ "$ENV" = "production" ]; then
        echo "  Aplicação: https://localhost"
    else
        echo "  Aplicação: http://localhost:3000"
    fi
    echo "  Health Check: http://localhost:3000/api/email-reputation"
    echo
}

# Executar função principal
main "$@"
