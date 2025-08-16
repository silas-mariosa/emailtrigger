# 📧 Limites da Hostinger - Sistema de Envio de Emails

## 🎯 Visão Geral

O sistema foi otimizado para respeitar os limites específicos da Hostinger, garantindo que o envio de emails funcione de forma eficiente e sem violar as políticas da provedora.

## 📊 Limites da Hostinger

### **Limites Principais**

- **Envio de mensagem diária**: **3.000 emails em 24 horas**
- **Destinatários por mensagem**: **100 destinatários** (Para, Cc e Cco)
- **Tamanho do email de saída**: **35 MB**
- **Tamanho do anexo**: **25 MB**

### **Outros Limites**

- **Armazenamento por caixa de email**: **50.00 GB**
- **Mensagens por caixa de email**: **300.000 emails**
- **Aliases por caixa de email**: **50 aliases**
- **Encaminhamentos por caixa de email**: **50 forwards**

## ⚙️ Configurações do Sistema

### **Configurações Otimizadas**

```typescript
// Configurações baseadas nos limites da Hostinger
const EMAIL_BATCH_SIZE = 10; // Lotes de 10 emails (dentro do limite de 100 destinatários)
const BATCH_DELAY = 300000; // 5 minutos entre lotes (para respeitar limite diário)
const DAILY_LIMIT = 3000; // Limite diário da Hostinger: 3.000 emails em 24 horas
const MAX_RECIPIENTS_PER_EMAIL = 100; // Limite da Hostinger: 100 destinatários por email
const MAX_EMAIL_SIZE = 35; // Limite da Hostinger: 35 MB por email
const MAX_ATTACHMENT_SIZE = 25; // Limite da Hostinger: 25 MB por anexo
```

### **Configuração SMTP Otimizada**

```typescript
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  pool: true,
  maxConnections: 5, // Aumentado para melhor performance
  maxMessages: 50, // Aumentado para lotes maiores
  rateLimit: 10, // Máximo 10 e-mails por segundo (dentro dos limites)
  rateDelta: 100, // 100ms entre envios
});
```

## 📈 Estratégia de Envio

### **1. Lotes Otimizados**

- **Tamanho do lote**: 10 emails por vez
- **Justificativa**: Permite envio eficiente sem atingir o limite de 100 destinatários

### **2. Cooldown Inteligente**

- **Delay entre lotes**: 5 minutos
- **Cálculo**: 3.000 emails ÷ 24 horas = ~125 emails/hora = ~2 emails/minuto
- **Estratégia**: 10 emails a cada 5 minutos = 120 emails/hora (dentro do limite)

### **3. Monitoramento de Limite Diário**

```typescript
function checkDailyLimit(): boolean {
  const emailsEnviadosHoje = todayEmails.length;
  const limiteRestante = DAILY_LIMIT - emailsEnviadosHoje;

  console.log(
    `📊 [LIMITE] Emails enviados hoje: ${emailsEnviadosHoje}/${DAILY_LIMIT}`
  );
  console.log(`📊 [LIMITE] Limite restante: ${limiteRestante}`);

  return emailsEnviadosHoje < DAILY_LIMIT;
}
```

## 🚀 Benefícios da Otimização

### **1. Conformidade com Limites**

- ✅ Respeita limite diário de 3.000 emails
- ✅ Não excede 100 destinatários por email
- ✅ Mantém emails dentro do limite de 35 MB

### **2. Performance Otimizada**

- ✅ Envio em lotes eficientes
- ✅ Cooldown calculado matematicamente
- ✅ Monitoramento em tempo real

### **3. Prevenção de Problemas**

- ✅ Evita bloqueios por excesso de envio
- ✅ Mantém reputação do domínio
- ✅ Reduz risco de spam

## 📊 Cálculos de Capacidade

### **Capacidade Diária**

- **Limite da Hostinger**: 3.000 emails/dia
- **Lotes por dia**: 3.000 ÷ 10 = 300 lotes
- **Tempo entre lotes**: 5 minutos
- **Tempo total**: 300 × 5 = 1.500 minutos = 25 horas

### **Capacidade por Estado**

- **São Paulo**: 226 candidatos únicos
- **Tempo estimado**: 226 ÷ 10 = 23 lotes × 5 min = 115 minutos (~2 horas)

### **Capacidade Total**

- **Todos os estados**: ~50.000 candidatos únicos
- **Tempo estimado**: 50.000 ÷ 10 = 5.000 lotes × 5 min = 25.000 minutos (~17 dias)

## 🔧 Monitoramento

### **Logs de Limite**

```
📊 [LIMITE] Emails enviados hoje: 1,234/3,000
📊 [LIMITE] Limite restante: 1,766
```

### **Logs de Lote**

```
📦 [LOTE 1] Iniciando envio do lote 1 de 10 e-mails
⏰ [COOLDOWN] Aguardando 300 segundos antes do próximo lote (2)...
```

### **Logs de Filtro**

```
🗺️ [FILTRO] Filtrando por estado: São Paulo
📊 [FILTRO] Total de candidatos no estado São Paulo: 226
```

## ⚠️ Considerações Importantes

### **1. Limite Diário**

- O sistema para automaticamente quando atinge 3.000 emails
- Reinicia no próximo dia às 00:00
- Monitoramento contínuo durante o envio

### **2. Filtro por Estado**

- Reduz significativamente o volume de envios
- Permite campanhas direcionadas
- Otimiza uso do limite diário

### **3. Pausa/Retomada**

- Sistema pode ser pausado a qualquer momento
- Retoma de onde parou
- Respeita limites mesmo após retomada

## 📝 Recomendações

### **1. Planejamento de Campanhas**

- Use filtros por estado para campanhas menores
- Monitore o progresso diário
- Planeje campanhas grandes com antecedência

### **2. Monitoramento**

- Acompanhe os logs de limite
- Verifique estatísticas por estado
- Monitore a reputação do domínio

### **3. Otimização**

- O sistema já está otimizado para os limites
- Não altere as configurações sem necessidade
- Mantenha backups dos logs de envio
