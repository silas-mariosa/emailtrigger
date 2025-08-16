# 🚨 Sistema de Pausa Automática - Proteção da Integridade do Domínio

## 🎯 Visão Geral

O sistema implementa uma **pausa automática inteligente** que detecta situações críticas que podem comprometer a integridade do domínio e pausa automaticamente o envio de emails para proteger a reputação.

## 🛡️ Situações Críticas Detectadas

### **1. Limites da Hostinger**

- **Limite diário atingido**: 3.000 emails em 24 horas
- **Rate limit exceeded**: Muitas requisições em pouco tempo
- **Quota exceeded**: Cota de envio excedida

### **2. Problemas de Reputação**

- **Bounce rate too high**: Taxa de retorno muito alta
- **Complaint rate too high**: Taxa de reclamações muito alta
- **Spam detected**: Email detectado como spam
- **Domain blocked**: Domínio bloqueado

### **3. Erros de Conta**

- **Account suspended**: Conta suspensa
- **Invalid credentials**: Credenciais inválidas
- **Authentication failed**: Falha na autenticação

### **4. Problemas de Rede**

- **Connection timeout**: Timeout de conexão
- **SMTP error**: Erro no servidor SMTP
- **Network error**: Erro de rede

## ⚙️ Funcionamento do Sistema

### **1. Detecção Automática**

```typescript
function detectCriticalIssues(
  situacao: string,
  errorMessage?: string
): boolean {
  const criticalSituations = [
    "Limite diário atingido",
    "Limite diário da Hostinger atingido",
    "Daily limit reached",
    "Quota exceeded",
    "Rate limit exceeded",
    "Too many requests",
    "Account suspended",
    "Domain blocked",
    "Spam detected",
    "Bounce rate too high",
    "Complaint rate too high",
  ];

  const criticalErrors = [
    "bounce",
    "invalid",
    "blocked",
    "suspended",
    "quota",
    "limit",
    "rate limit",
    "spam",
    "complaint",
    "reputation",
  ];

  // Verificar situações críticas
  const isCriticalSituation = criticalSituations.some((situation) =>
    situacao.toLowerCase().includes(situation.toLowerCase())
  );

  // Verificar erros críticos
  const isCriticalError =
    errorMessage &&
    criticalErrors.some((error) =>
      errorMessage.toLowerCase().includes(error.toLowerCase())
    );

  return isCriticalSituation || isCriticalError;
}
```

### **2. Pausa Automática**

```typescript
function pauseEmailSending(reason: string) {
  const statusData = {
    isPaused: true,
    pauseReason: reason,
    pausedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  fs.writeFileSync(
    statusFilePath,
    JSON.stringify(statusData, null, 2),
    "utf-8"
  );
  console.log(
    `🚨 [PAUSA AUTOMÁTICA] Sistema pausado automaticamente: ${reason}`
  );
}
```

### **3. Verificação de Limite Diário**

```typescript
function checkDailyLimit(): boolean {
  const emailsEnviadosHoje = todayEmails.length;

  // Se atingiu o limite, pausar automaticamente
  if (emailsEnviadosHoje >= DAILY_LIMIT) {
    pauseEmailSending(
      `Limite diário da Hostinger atingido (${emailsEnviadosHoje}/${DAILY_LIMIT} emails)`
    );
    return false;
  }

  return true;
}
```

## 📊 Interface de Monitoramento

### **Card de Pausa Automática**

Quando uma pausa automática é ativada, o dashboard mostra:

```
🚨 Pausa Automática
Limite diário da Hostinger atingido (3,000/3,000 emails)
Pausado em: 14/01/2025 15:30:45
Sistema pausado automaticamente para proteger a integridade do domínio
```

### **Informações Retornadas pela API**

```json
{
  "isPaused": true,
  "pauseReason": "Limite diário da Hostinger atingido (3,000/3,000 emails)",
  "pausedAt": "2025-01-14T18:30:45.123Z",
  "statusDetalhado": "pausado"
}
```

## 🔄 Processo de Recuperação

### **1. Pausa Manual**

- Usuário pode pausar manualmente a qualquer momento
- Sistema registra motivo da pausa manual

### **2. Retomada Manual**

- Usuário deve clicar em "Retomar" para continuar
- Sistema limpa informações de pausa automática
- Verifica se a situação crítica foi resolvida

### **3. Retomada Automática**

- **Limite diário**: Retoma automaticamente no próximo dia (00:00)
- **Erros temporários**: Pode retomar após verificação manual
- **Problemas críticos**: Requer intervenção manual

## 📝 Logs do Sistema

### **Logs de Pausa Automática**

```
🚨 [PAUSA AUTOMÁTICA] Sistema pausado automaticamente: Limite diário da Hostinger atingido (3,000/3,000 emails)
🚨 [CRÍTICO] Situação crítica detectada: Rate limit exceeded
🚨 [PAUSA AUTOMÁTICA] Sistema pausado automaticamente: Erro crítico detectado: Account suspended
```

### **Logs de Verificação**

```
📊 [LIMITE] Emails enviados hoje: 2,999/3,000
📊 [LIMITE] Limite restante: 1
📊 [LIMITE] Emails enviados hoje: 3,000/3,000
🚨 [PAUSA AUTOMÁTICA] Sistema pausado automaticamente: Limite diário da Hostinger atingido (3,000/3,000 emails)
```

## 🎯 Benefícios

### **1. Proteção da Reputação**

- ✅ Evita envios excessivos que podem marcar o domínio como spam
- ✅ Protege contra bloqueios da provedora de email
- ✅ Mantém boa reputação do domínio

### **2. Conformidade com Limites**

- ✅ Respeita automaticamente os limites da Hostinger
- ✅ Evita violações de políticas da provedora
- ✅ Mantém conta em conformidade

### **3. Prevenção de Problemas**

- ✅ Detecta problemas antes que se tornem críticos
- ✅ Pausa proativamente quando necessário
- ✅ Reduz risco de suspensão da conta

### **4. Monitoramento Inteligente**

- ✅ Logs detalhados de todas as situações
- ✅ Interface clara mostrando motivo da pausa
- ✅ Histórico completo de pausas automáticas

## ⚠️ Considerações Importantes

### **1. Pausas Automáticas**

- Sistema pausa automaticamente em situações críticas
- Usuário deve verificar o motivo antes de retomar
- Algumas situações requerem intervenção manual

### **2. Retomada Segura**

- Sempre verifique se o problema foi resolvido
- Monitore logs após retomar o envio
- Considere reduzir volume se problemas persistirem

### **3. Monitoramento Contínuo**

- Acompanhe logs de pausa automática
- Monitore reputação do domínio
- Verifique limites da provedora regularmente

## 🔧 Configuração

### **Situações Críticas Configuráveis**

```typescript
const criticalSituations = [
  "Limite diário atingido",
  "Limite diário da Hostinger atingido",
  "Daily limit reached",
  "Quota exceeded",
  "Rate limit exceeded",
  "Too many requests",
  "Account suspended",
  "Domain blocked",
  "Spam detected",
  "Bounce rate too high",
  "Complaint rate too high",
];
```

### **Erros Críticos Configuráveis**

```typescript
const criticalErrors = [
  "bounce",
  "invalid",
  "blocked",
  "suspended",
  "quota",
  "limit",
  "rate limit",
  "spam",
  "complaint",
  "reputation",
];
```

O sistema está configurado para ser **proativo** na proteção da integridade do domínio, pausando automaticamente quando detecta qualquer situação que possa comprometer a reputação ou conformidade com as políticas da provedora.
