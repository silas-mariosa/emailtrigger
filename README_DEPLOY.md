# 🐳 Deploy com Docker - Smart Gabinete Email System

## 📋 Arquivos Criados

✅ **Dockerfile** - Configuração do container Docker  
✅ **docker-compose.yml** - Orquestração dos serviços  
✅ **nginx.conf** - Configuração do proxy reverso  
✅ **.dockerignore** - Otimização do build  
✅ **deploy.sh** - Script de deploy automatizado  
✅ **DEPLOY.md** - Guia completo de deploy

## 🚀 Deploy Rápido

### **1. Preparar o Servidor (Linux/Ubuntu)**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### **2. Configurar Variáveis de Ambiente**

```bash
# Criar arquivo .env
cat > .env << EOF
EMAIL=contato@smartgabinete.com.br
PASSWORD=sua_senha_smtp_hostinger
NODE_ENV=production
EOF
```

### **3. Deploy Automático**

```bash
# Tornar script executável
chmod +x deploy.sh

# Deploy básico
./deploy.sh development

# Deploy com SSL
./deploy.sh production
```

## 🔧 Deploy Manual

### **Deploy Básico (Sem SSL)**

```bash
# Build e start
docker-compose up -d --build

# Verificar logs
docker-compose logs -f emailtrigger
```

### **Deploy com SSL**

```bash
# Gerar certificado SSL
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem \
  -subj "/C=BR/ST=SP/L=Sao Paulo/O=Smart Gabinete/CN=localhost"

# Deploy com Nginx
docker-compose --profile production up -d --build
```

## 📊 Monitoramento

### **Comandos Úteis**

```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Health check
curl http://localhost:3000/api/email-reputation

# Parar aplicação
docker-compose down

# Reiniciar
docker-compose restart
```

### **Backup dos Dados**

```bash
# Backup
docker run --rm -v emailtrigger_email_data:/data -v $(pwd):/backup alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .

# Restaurar
docker run --rm -v emailtrigger_email_data:/data -v $(pwd):/backup alpine tar xzf /backup/backup-20241201.tar.gz -C /data
```

## 🔒 Configurações de Segurança

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

### **Firewall**

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🚨 Troubleshooting

### **Problemas Comuns**

1. **Container não inicia**

   ```bash
   docker-compose logs emailtrigger
   docker-compose config
   ```

2. **E-mails não são enviados**

   ```bash
   # Verificar variáveis de ambiente
   docker-compose exec emailtrigger env | grep EMAIL

   # Testar SMTP
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

   # Testar conexão
   openssl s_client -connect localhost:443
   ```

## 📈 Atualizações

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

## 🌐 URLs Importantes

- **Aplicação**: http://localhost:3000 (básico) / https://localhost (SSL)
- **Health Check**: http://localhost:3000/api/email-reputation
- **Estatísticas**: http://localhost:3000/api/email-reputation
- **Opt-out**: http://localhost:3000/api/unsubscribe

## 📞 Suporte

Para problemas:

1. Verificar logs: `docker-compose logs`
2. Health check: `curl http://localhost:3000/api/email-reputation`
3. Status: `docker-compose ps`

---

**⚠️ IMPORTANTE**:

- Configure as variáveis de ambiente no arquivo `.env`
- Faça backup dos dados antes de atualizações
- Mantenha as credenciais SMTP seguras
- Monitore as métricas de reputação regularmente
