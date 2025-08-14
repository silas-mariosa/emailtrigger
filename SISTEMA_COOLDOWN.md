# Sistema de Cooldown - Email Trigger

## 🕐 Visão Geral

O sistema de cooldown foi implementado para controlar o intervalo entre envios de emails, evitando spam e melhorando a reputação do domínio.

## ⚙️ Configurações

### Cooldown Principal

- **Intervalo**: 1 minuto (60.000ms) entre lotes
- **Tamanho do Lote**: 5 emails por vez
- **Delay entre Emails**: 2 segundos

### Configurações Anti-Spam

```typescript
const EMAIL_BATCH_SIZE = 5; // Emails por lote
const BATCH_DELAY = 60000; // 1 minuto entre lotes
const DAILY_LIMIT = 100; // Limite diário
```

## 🎯 Funcionalidades Implementadas

### 1. **API de Status Melhorada**

- **Endpoint**: `/api/get-email-sending-status`
- **Novos Campos**:
  - `proximoEnvio`: Timestamp do próximo envio
  - `tempoRestante`: Tempo restante em milissegundos

### 2. **Verificação de Cooldown**

- **Função**: `checkCooldown()`
- **Retorna**: `{ hasCooldown: boolean, timeRemaining: number }`
- **Lógica**: Verifica se passou 1 minuto desde o último envio

### 3. **Interface Visual**

- **Card de Cooldown**: Mostra tempo restante em tempo real
- **Countdown**: Atualiza a cada segundo
- **Barra de Progresso**: Visual do tempo restante
- **Botão Inteligente**: Desabilitado durante cooldown

## 🎨 Interface do Usuário

### Card de Próximo Envio

```
┌─────────────────────┐
│   Próximo Envio     │
│                     │
│      00:45          │ ← Tempo restante
│   Aguardando...     │
│  ████████░░░░░░░░   │ ← Barra de progresso
└─────────────────────┘
```

### Estados do Botão

- **Normal**: "Iniciar Envio"
- **Cooldown**: "Aguardar (00:45)"
- **Processando**: "Processando..."
- **Pausado**: "Iniciar Envio" (desabilitado)

## 🔧 Implementação Técnica

### 1. **Cálculo do Cooldown**

```typescript
const ultimoEnvio = new Date(enviosSucesso[enviosSucesso.length - 1].dataEnvio);
const agora = new Date();
const tempoDecorrido = agora.getTime() - ultimoEnvio.getTime();
const cooldownMs = 60000; // 1 minuto

if (tempoDecorrido < cooldownMs) {
  const tempoRestante = cooldownMs - tempoDecorrido;
  return { hasCooldown: true, timeRemaining: tempoRestante };
}
```

### 2. **Countdown em Tempo Real**

```typescript
useEffect(() => {
  if (sendingStatus?.tempoRestante && sendingStatus.tempoRestante > 0) {
    setCountdown(Math.ceil(sendingStatus.tempoRestante / 1000));

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 0) {
          return prev - 1;
        }
        return null;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }
}, [sendingStatus?.tempoRestante]);
```

### 3. **Formatação do Tempo**

```typescript
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};
```

## 🚀 Fluxo de Funcionamento

### 1. **Início do Envio**

1. Usuário clica em "Iniciar Envio"
2. Sistema verifica se há cooldown ativo
3. Se há cooldown: retorna erro com tempo restante
4. Se não há cooldown: inicia o envio

### 2. **Durante o Envio**

1. Sistema envia lote de 5 emails
2. Aguarda 1 minuto (cooldown)
3. Envia próximo lote
4. Repete até terminar

### 3. **Interface Atualizada**

1. Card mostra tempo restante
2. Botão fica desabilitado durante cooldown
3. Countdown atualiza a cada segundo
4. Quando termina: botão fica disponível

## 📊 Benefícios

### 1. **Anti-Spam**

- ✅ Evita envios muito rápidos
- ✅ Melhora reputação do domínio
- ✅ Reduz chance de bloqueio

### 2. **Experiência do Usuário**

- ✅ Feedback visual claro
- ✅ Tempo restante em tempo real
- ✅ Botão inteligente

### 3. **Controle de Qualidade**

- ✅ Envios controlados
- ✅ Monitoramento em tempo real
- ✅ Logs detalhados

## 🔍 Monitoramento

### Logs do Sistema

```
[INFO] Iniciando envio do lote 1 de 5 e-mails
[INFO] Lote 1 enviado com sucesso
[INFO] Aguardando 60 segundos antes do próximo lote...
[INFO] Iniciando envio do lote 2 de 5 e-mails
```

### Status da API

```json
{
  "isPaused": false,
  "isSending": true,
  "totalSent": 15,
  "proximoEnvio": "2025-01-14T18:30:00.000Z",
  "tempoRestante": 45000,
  "lastUpdated": "2025-01-14T18:29:15.000Z"
}
```

## 🛠️ Personalização

### Alterar Intervalo de Cooldown

```typescript
// Em src/app/api/send-emails/route.ts
const BATCH_DELAY = 120000; // 2 minutos
```

### Alterar Tamanho do Lote

```typescript
// Em src/app/api/send-emails/route.ts
const EMAIL_BATCH_SIZE = 10; // 10 emails por lote
```

## 🎯 Resultados Esperados

- ✅ **Redução de Spam**: Envios mais espaçados
- ✅ **Melhor Reputação**: Domínio mais confiável
- ✅ **Controle Total**: Usuário sabe quando pode enviar
- ✅ **Experiência Fluida**: Interface responsiva e informativa

O sistema de cooldown garante que os envios sejam feitos de forma controlada e responsável! 🚀
