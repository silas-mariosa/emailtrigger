# 🐳 Guia de Deploy - Smart Gabinete Email System

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Acesso ao servidor via SSH
- Domínio configurado (opcional, mas recomendado)

## 🚀 Deploy Rápido

### 1. **Preparar o Servidor**

```bash
# Atualizar o sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker (se não estiver instalado)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

### 2. **Configurar Variáveis de Ambiente**

```bash
# Criar arquivo .env
cat > .env << EOF
EMAIL=contato@smartgabinete.com.br
PASSWORD=sua_senha_smtp_hostinger
NODE_ENV=production
EOF
```

### 3. **Deploy Básico (Sem SSL)**

```bash
# Clonar o repositório
git clone <seu-repositorio>
cd emailtrigger

# Build e deploy
docker-compose up -d --build

# Verificar logs
docker-compose logs -f emailtrigger
```

### 4. **Deploy com SSL (Recomendado)**

```bash
# Criar diretório para certificados SSL
mkdir -p ssl

# Gerar certificado auto-assinado (para teste)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem \
  -subj "/C=BR/ST=SP/L=Sao Paulo/O=Smart Gabinete/CN=localhost"

# Deploy com Nginx
docker-compose --profile production up -d --build
```

## 🔧 Configurações Avançadas

### **SSL com Let's Encrypt**

```bash
# Instalar Certbot
sudo apt install certbot

# Obter certificado
sudo certbot certonly --standalone -d seudominio.com.br

# Copiar certificados
sudo cp /etc/letsencrypt/live/seudominio.com.br/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/seudominio.com.br/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

### **Configurar DNS Records**

```bash
# SPF Record
TXT @ "v=spf1 include:hostinger.com ~all"

# A Record (se usando IP fixo)
A @ seu_ip_do_servidor
```

## 📊 Monitoramento

### **Verificar Status**

```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Health check
curl http://localhost/health
```

### **Backup dos Dados**

```bash
# Backup dos dados de e-mail
docker run --rm -v emailtrigger_email_data:/data -v $(pwd):/backup alpine tar czf /backup/email-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restaurar backup
docker run --rm -v emailtrigger_email_data:/data -v $(pwd):/backup alpine tar xzf /backup/email-backup-20241201.tar.gz -C /data
```

## 🔒 Segurança

### **Firewall**

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### **Atualizações Automáticas**

```bash
# Criar script de atualização
cat > update.sh << 'EOF'
#!/bin/bash
cd /path/to/emailtrigger
git pull
docker-compose down
docker-compose up -d --build
docker system prune -f
EOF

chmod +x update.sh

# Adicionar ao crontab (atualizar semanalmente)
echo "0 2 * * 0 /path/to/emailtrigger/update.sh" | crontab -
```

## 🚨 Troubleshooting

### **Problemas Comuns**

1. **Container não inicia**

   ```bash
   # Verificar logs
   docker-compose logs emailtrigger

   # Verificar variáveis de ambiente
   docker-compose config
   ```

2. **E-mails não são enviados**

   ```bash
   # Verificar configurações SMTP
   docker-compose exec emailtrigger env | grep EMAIL

   # Testar conexão SMTP
   docker-compose exec emailtrigger node -e "
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransporter({
     host: 'smtp.hostinger.com',
     port: 465,
     secure: true,
     auth: {
       user: process.env.EMAIL,
       pass: process.env.PASSWORD
     }
   });
   transporter.verify((error, success) => {
     console.log(error || 'SMTP funcionando!');
   });
   "
   ```

3. **Problemas de SSL**

   ```bash
   # Verificar certificados
   openssl x509 -in ssl/cert.pem -text -noout

   # Testar conexão SSL
   openssl s_client -connect localhost:443 -servername seudominio.com.br
   ```

### **Logs Importantes**

```bash
# Logs da aplicação
docker-compose logs emailtrigger

# Logs do Nginx
docker-compose logs nginx

# Logs do sistema
journalctl -u docker.service -f
```

## 📈 Monitoramento de Performance

### **Métricas do Sistema**

```bash
# Uso de recursos
docker stats

# Espaço em disco
df -h

# Uso de memória
free -h
```

### **Monitoramento de E-mails**

```bash
# Verificar estatísticas
curl http://localhost/api/email-reputation

# Verificar arquivos de dados
docker-compose exec emailtrigger ls -la /app/public/data/
```

## 🔄 Atualizações

### **Atualizar Aplicação**

```bash
# Parar containers
docker-compose down

# Pull das mudanças
git pull

# Rebuild e restart
docker-compose up -d --build

# Limpar imagens antigas
docker system prune -f
```

### **Rollback**

```bash
# Voltar para versão anterior
git checkout <commit-hash>

# Rebuild
docker-compose up -d --build
```

## 📞 Suporte

Para problemas ou dúvidas:

- Verificar logs: `docker-compose logs`
- Health check: `curl http://localhost/health`
- Status: `docker-compose ps`

---

**⚠️ IMPORTANTE**: Sempre faça backup dos dados antes de atualizações e mantenha as variáveis de ambiente seguras!
