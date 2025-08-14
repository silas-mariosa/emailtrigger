# 🔧 Guia de Solução de Problemas SMTP

## 🚨 **Erro Atual: Authentication Failed**

```
Error: Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)
```

## 🔍 **Diagnóstico Rápido**

### **1. Verificar Variáveis de Ambiente**

```bash
# Verificar se as variáveis estão definidas
echo $EMAIL
echo $PASSWORD

# Ou no Windows
echo %EMAIL%
echo %PASSWORD%
```

### **2. Testar Configuração SMTP**

```bash
# Executar script de teste
node test-smtp.js
```

## 🛠️ **Soluções por Ordem de Prioridade**

### **Solução 1: Verificar Credenciais Hostinger**

#### **A. Acessar Painel Hostinger**
1. Faça login no [painel do Hostinger](https://hpanel.hostinger.com)
2. Vá para **Email** → **Gerenciar**
3. Selecione seu domínio

#### **B. Verificar Configurações SMTP**
- **Host SMTP**: `smtp.hostinger.com`
- **Porta**: `465` (SSL) ou `587` (TLS)
- **Segurança**: SSL/TLS

#### **C. Criar Senha de Aplicativo**
1. No painel do Hostinger, vá para **Email** → **Configurações**
2. Procure por **"Senhas de Aplicativo"** ou **"App Passwords"**
3. Crie uma nova senha de aplicativo
4. **IMPORTANTE**: Use esta senha, NÃO a senha da sua conta

### **Solução 2: Configurar Variáveis de Ambiente**

#### **A. Criar arquivo .env**

```bash
# No diretório do projeto
cat > .env << EOF
EMAIL=contato@smartgabinete.com.br
PASSWORD=sua_senha_de_aplicativo_aqui
NODE_ENV=production
EOF
```

#### **B. Verificar se o arquivo foi criado**

```bash
# Verificar conteúdo (sem mostrar a senha)
cat .env | sed 's/PASSWORD=.*/PASSWORD=***/'
```

### **Solução 3: Testar Configuração**

```bash
# Instalar dependências se necessário
npm install nodemailer

# Executar teste
node test-smtp.js
```

## 🔧 **Configurações Alternativas**

### **Configuração 1: Porta 587 (TLS)**

```javascript
const transporter = nodemailer.createTransporter({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false, // false para TLS
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

### **Configuração 2: Porta 465 (SSL)**

```javascript
const transporter = nodemailer.createTransporter({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // true para SSL
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  }
});
```

### **Configuração 3: Gmail (Alternativa)**

```javascript
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'seu-email@gmail.com',
    pass: 'sua-senha-de-app-gmail'
  }
});
```

## 🚨 **Problemas Comuns e Soluções**

### **Problema 1: "Authentication Failed"**

**Causas:**
- Senha incorreta
- Usando senha da conta em vez de senha de aplicativo
- E-mail não está ativo

**Soluções:**
1. Verificar se está usando senha de aplicativo
2. Recriar senha de aplicativo no Hostinger
3. Verificar se o e-mail está ativo

### **Problema 2: "Connection Timeout"**

**Causas:**
- Firewall bloqueando
- Configuração de rede
- Hostinger temporariamente indisponível

**Soluções:**
1. Verificar firewall
2. Tentar porta 587 em vez de 465
3. Aguardar alguns minutos e tentar novamente

### **Problema 3: "Invalid Host"**

**Causas:**
- Host SMTP incorreto
- Problema de DNS

**Soluções:**
1. Verificar se o host está correto: `smtp.hostinger.com`
2. Testar conectividade: `ping smtp.hostinger.com`

## 📋 **Checklist de Verificação**

### **✅ Configurações Básicas**
- [ ] E-mail está ativo no Hostinger
- [ ] Senha de aplicativo criada
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivo .env criado

### **✅ Configurações SMTP**
- [ ] Host: `smtp.hostinger.com`
- [ ] Porta: `465` (SSL) ou `587` (TLS)
- [ ] SSL/TLS habilitado
- [ ] Credenciais corretas

### **✅ Testes**
- [ ] Script de teste executado
- [ ] Conexão SMTP verificada
- [ ] E-mail de teste enviado
- [ ] Logs verificados

## 🔍 **Comandos de Diagnóstico**

### **Testar Conectividade**

```bash
# Testar conexão com servidor SMTP
telnet smtp.hostinger.com 465

# Ou usando openssl
openssl s_client -connect smtp.hostinger.com:465
```

### **Verificar DNS**

```bash
# Verificar resolução DNS
nslookup smtp.hostinger.com

# Verificar registros MX
nslookup -type=mx smartgabinete.com.br
```

### **Verificar Logs**

```bash
# Logs da aplicação
npm run dev

# Verificar logs do sistema
tail -f /var/log/mail.log
```

## 📞 **Suporte Hostinger**

Se os problemas persistirem:

1. **Contato**: [Suporte Hostinger](https://www.hostinger.com/contact)
2. **Documentação**: [SMTP Hostinger](https://www.hostinger.com/tutorials/email/configure-smtp-settings)
3. **Chat Online**: Disponível no painel do Hostinger

## 🚀 **Próximos Passos**

1. **Execute o teste**: `node test-smtp.js`
2. **Verifique as credenciais** no painel do Hostinger
3. **Crie senha de aplicativo** se necessário
4. **Atualize o arquivo .env** com as credenciais corretas
5. **Teste novamente** a aplicação

---

**⚠️ IMPORTANTE**: Nunca compartilhe suas credenciais SMTP e sempre use senhas de aplicativo em vez de senhas de conta!

