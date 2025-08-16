# 🗺️ Filtro por Estado - Sistema de Envio de Emails

## 📋 Visão Geral

O sistema agora permite filtrar o envio de emails por estado específico, facilitando campanhas direcionadas e melhor controle sobre o processo de envio.

**🎯 Filtro por Nome Completo do Estado**: O sistema usa os nomes completos dos estados (ex: "São Paulo", "Rio de Janeiro", "Minas Gerais") em vez de siglas, garantindo maior clareza e precisão no filtro.

## ✨ Funcionalidades

### 1. **Seletor de Estado**

- Dropdown com todos os estados disponíveis nos dados
- Opção "Todos os Estados" para envio geral
- Interface intuitiva com ícone de localização

### 2. **Filtro Inteligente**

- Filtra candidatos automaticamente por estado selecionado
- Atualiza estatísticas em tempo real
- Mostra contagem específica de candidatos por estado

### 3. **APIs Atualizadas**

#### `/api/get-estados`

- **GET**: Retorna lista de todos os estados disponíveis
- **Resposta**:

```json
{
  "estados": [
    "Acre",
    "Alagoas",
    "Amapá",
    "Amazonas",
    "Bahia",
    "Ceará",
    "Distrito Federal",
    "Espírito Santo",
    "Goiás",
    "Maranhão",
    "Mato Grosso",
    "Mato Grosso do Sul",
    "Minas Gerais",
    "Paraná",
    "Paraíba",
    "Pará",
    "Pernambuco",
    "Piauí",
    "Rio Grande do Norte",
    "Rio Grande do Sul",
    "Rio de Janeiro",
    "Rondônia",
    "Roraima",
    "Santa Catarina",
    "Sergipe",
    "São Paulo"
  ],
  "totalEstados": 26
}
```

#### `/api/send-emails` (Atualizada)

- **POST**: Aceita parâmetro `estado` no body
- **Exemplo**:

```json
{
  "estado": "São Paulo"
}
```

- **Resposta**: Inclui informação sobre o estado filtrado

#### `/api/get-email-stats` (Atualizada)

- **GET**: Aceita parâmetro `estado` na URL
- **Exemplo**: `/api/get-email-stats?estado=São Paulo`
- **Resposta**: Estatísticas específicas do estado

## 🎯 Como Usar

### 1. **Selecionar Estado**

1. Acesse o dashboard de envio de emails
2. Localize o seletor "Filtrar por Estado"
3. Escolha um estado específico ou "Todos os Estados"

### 2. **Verificar Estatísticas**

- O card "Progresso" mostra estatísticas específicas do estado
- Contadores são atualizados automaticamente
- Badge indica o estado selecionado

### 3. **Iniciar Envio**

- Clique em "Iniciar Envio"
- O sistema enviará apenas para candidatos do estado selecionado
- Logs e estatísticas são filtrados por estado

## 📊 Interface

### **Seletor de Estado**

```
🗺️ Filtrar por Estado: [Dropdown ▼] [Estado: São Paulo]
Total de estados disponíveis: 26
• Candidatos no estado São Paulo: 1,234
```

### **Card de Progresso**

```
Progresso - São Paulo
Restantes: 567
Total Únicos: 1,234
[████████░░] 54% concluído
Estado: São Paulo
```

## 🔧 Configuração

### **Valores Padrão**

- Estado inicial: "Todos os Estados"
- Filtro: Aplicado automaticamente quando estado é selecionado
- Atualização: A cada 5 segundos

### **Comportamento**

- **"Todos os Estados"**: Envia para todos os candidatos
- **Estado específico**: Filtra apenas candidatos daquele estado
- **Estatísticas**: Atualizadas conforme filtro aplicado

## 🚀 Benefícios

1. **Campanhas Direcionadas**: Envie apenas para estados específicos
2. **Melhor Controle**: Monitore progresso por região
3. **Eficiência**: Reduza volume de envios desnecessários
4. **Análise**: Estatísticas detalhadas por estado

## 📝 Logs

O sistema registra informações sobre o filtro aplicado:

```
🗺️ [FILTRO] Filtrando por estado: São Paulo
📊 [FILTRO] Total de candidatos no estado São Paulo: 1,234
```

## 🔄 Compatibilidade

- ✅ Funciona com todas as funcionalidades existentes
- ✅ Mantém sistema de cooldown
- ✅ Preserva prevenção de duplicatas
- ✅ Compatível com pausa/retomada
- ✅ Integrado com monitoramento detalhado

## 🎨 Interface Responsiva

- Seletor adaptável para diferentes tamanhos de tela
- Badges informativos sobre estado selecionado
- Contadores em tempo real
- Indicadores visuais de progresso
