# Planejamento Completo de Jornadas do Usuário - Pinubi

## 📋 Visão Geral

Este documento apresenta o planejamento completo das jornadas do usuário para o aplicativo Pinubi, organizadas por prioridade de implementação e detalhando regras de UX/UI, fluxos de telas e requisitos técnicos baseados na documentação do projeto.

## 🎯 Prioridades de Implementação

### **FASE 1: CORE MVP (Essencial para funcionamento)**
Jornadas que a aplicação **PRECISA TER** para funcionar básicamente.

### **FASE 2: FUNCIONALIDADES SOCIAIS (Growth)**
Jornadas que tornam o app diferenciado e viral.

### **FASE 3: MONETIZAÇÃO E AVANÇADO (Scale)**
Jornadas para receita e retenção a longo prazo.

---

## 🚀 FASE 1: CORE MVP (Prioridade Máxima)

### 1. **JORNADA: Authentication & Onboarding**

#### **Sign In / Sign Up**
- **Fluxo**: Tela única com opções sociais (Google)
  - Sign In Login com Google (SignUp acontece aqui também) e Email/Senha
  - Sign Up com email e senha
- **Regras UX/UI**:
  - Login social OBRIGATÓRIO 
  - Login com email/senha OBRIGATÓRIO
  - Botões grandes e acessíveis
  - Loading states claros
  - Fallback para erro de conexão
- **Estado do usuário**: `isValidated: false, isActive: false`

#### **Onboarding Completo**
- **Tela 1**: Boas-vindas + apresentação do app
- **Tela 2**: Configurar preferências iniciais
  - Categorias favoritas (japonês, italiano, etc.)
  - Faixa de preço preferida
  - Tipo de experiência (romântico, casual, família)
- **Tela 3**: Solicitar permissão de localização
  - Explicar benefícios claramente
  - Opção "Pular por agora" disponível
- **Tela 4**: **Sistema de Convites (EARLY ACCESS)**
  - Input para código de 6 caracteres
  - Validação em tempo real
  - Mensagens de erro amigáveis
  - Link "Como conseguir um código?"

#### **Ativação Automática**
- Criação automática de listas: "Quero Visitar" e "Favoritas"
- Distribuição de 5 créditos iniciais
- Estado final: `isValidated: true, isActive: true`

### 2. **JORNADA: Buscar e Adicionar Lugares**

#### **Busca de Lugares**
- **Interface**: Barra de busca com autocomplete
- **Regras UX/UI**:
  - Autocomplete após 2 caracteres
  - Debouncing de 300ms
  - Histórico de buscas recentes
  - Sugestões baseadas em localização
- **Fluxo**:
  1. Usuário digita → Autocomplete do Google Maps
  2. Seleciona lugar → Verifica cache local
  3. Se não existe → Busca Place Details
  4. Apresenta dados completos

#### **Visualizar Detalhes do Lugar**
- **Tela de Detalhes**:
  - **Header**: Nome, categoria, distância
  - **Seção 1**: 3 tipos de nota
    - Google Maps (referência)
    - Nota pessoal (se já avaliou)
    - Média dos amigos (se aplicável)
  - **Seção 2**: Informações básicas
    - Endereço completo
    - Telefone/website (se disponível)
    - Horário de funcionamento
  - **Seção 3**: Ações rápidas
    - "Adicionar à Lista" (botão principal)
    - "Quero Visitar" (botão secundário)
    - "Já Visitei" (se aplicável)

#### **Adicionar à Lista**
- **Modal/Bottom Sheet**:
  - Lista das listas do usuário
  - Botão "Nova Lista" sempre visível
  - Contadores de lugares por lista
  - **Limite Free**: máx 15 lugares por lista

### 3. **JORNADA: CRUD de Listas**

#### **Visualizar Listas**
- **Tela Principal de Listas**:
  - Grid/lista com cards das listas
  - **Card design**:
    - Emoji + Título
    - Contador de lugares
    - Status (pública/privada)
    - Preview de 3 primeiros lugares
  - **Listas especiais destacadas**:
    - "Quero Visitar" (não deletável)
    - "Favoritas" (não deletável)
    - "Recomendações da Pinubi" (sistema)

#### **Criar Nova Lista**
- **Tela de Criação**:
  - **Step 1**: Dados básicos
    - Picker de emoji
    - Campo título (obrigatório)
    - Descrição (opcional)
  - **Step 2**: Configurações
    - Toggle Pública/Privada
    - Tags para categorização
    - **Limite Free**: máx 5 listas totais
  - **Validação**: Verificar limites antes de salvar

#### **Editar Lista**
- **Tela similar à criação**
- **Restrições**:
  - Listas automáticas não podem ser renomeadas/deletadas
  - Apenas dono pode editar
- **Ações destrutivas** com confirmação

#### **Visualizar Lugares da Lista**
- **Layout**: Lista ou grid responsivo
- **Card de Lugar**:
  - Foto (se disponível)
  - Nome + categoria
  - Nota pessoal (se avaliado)
  - Status: quer visitar/já visitou
  - Ações: editar nota, remover
- **Ações em lote**:
  - Marcar como visitado
  - Copiar para outra lista
  - Remover selecionados

### 4. **JORNADA: Visualização no Mapa**

#### **Mapa Principal**
- **Interface**:
  - Google Maps nativo
  - Botão "Minha Localização"
  - FAB para filtros
  - Bottom sheet com lista de lugares
- **Markers**:
  - Diferentes cores por categoria
  - Clustering quando zoom baixo
  - Info window com dados básicos
- **Performance**:
  - Máximo 100 markers simultâneos
  - Reload apenas com movimento > 1km
  - Cache de viewport por 5 minutos

#### **Filtros do Mapa**
- **Bottom Sheet de Filtros**:
  - **Região**: Próximo (5km), Cidade, Estado
  - **Categoria**: Todos, Restaurantes, Bares, etc.
  - **Preço**: $ a $$$$
  - **Meus Dados**: Quero Visitar, Favoritas, Visitados
- **Aplicação**: Filtros em memória pós-query geográfica

#### **Visualizar Lista no Mapa**
- **Entrada**: Deep link ou botão "Ver no Mapa" na lista
- **Comportamento**:
  - Centralizar no primeiro lugar da lista
  - Destacar markers da lista específica
  - Bottom sheet com navegação entre lugares
  - Opção "Ver todos" para remover filtro

---

## 📈 FASE 2: FUNCIONALIDADES SOCIAIS (Growth)

### 5. **JORNADA: Sistema de Reviews**

#### **Avaliar Lugar**
- **Trigger**: Botão "Avaliar" na tela do lugar
- **Pré-requisito**: Marcar como "Já Visitei"
- **Tela de Review**:
  - **Step 1**: Tipo de avaliação
    - Tabs: Geral, Comida, Bebida, Serviço, Ambiente
    - Permite múltiplas avaliações
  - **Step 2**: Nota e feedback
    - Slider 0-10 com decimais (8.7)
    - Toggle "Voltaria?" (sim/não)
    - Campo de comentário
  - **Step 3**: Fotos (opcional)
    - Máximo 5 fotos
    - Compressão automática
    - Upload para Cloudflare R2

#### **Visualizar Reviews**
- **Na tela do lugar**:
  - Seção de reviews dos amigos
  - Reviews próprias destacadas
  - Link "Ver todas as reviews"
- **Tela de Reviews**:
  - Filtro por tipo (comida, ambiente, etc.)
  - Ordenação por data/nota
  - Interface de curtir reviews

### 6. **JORNADA: Sistema Social**

#### **Seguir Usuários**
- **Busca de usuários**: Por username/email
- **Fluxo de Follow**:
  - Perfil público → Follow imediato
  - Perfil privado → Solicitação + notificação
- **Feed de Atividades**:
  - Lugares adicionados por amigos
  - Reviews recentes
  - Listas criadas
  - Atualizações em tempo real

#### **Match Social**
- **Tela de Criação**:
  - Selecionar amigos (mín 2, máx 10)
  - Escolher categoria/filtros
  - Configurar localização e raio
- **Algoritmo**:
  - Cruzar preferências do grupo
  - Considerar histórico de avaliações
  - Ranquear por compatibilidade
- **Tela de Resultados**:
  - Top 5 sugestões ranqueadas
  - Razões da recomendação
  - Votação dos participantes
  - Compartilhamento via link

#### **Votação Inteligente**
- **Criação**:
  - Título e descrição
  - Adicionar opções iniciais
  - Configurar: aceita sugestões? votos por pessoa?
  - Gerar link compartilhável
- **Interface de Votação**:
  - Cards dos lugares candidatos
  - Sistema de votos (coração, estrela)
  - Resultados em tempo real
  - Deep link para app

### 7. **JORNADA: Compartilhamento e Deep Links**

#### **Compartilhar Lista**
- **Opções**:
  - Link público (listas públicas)
  - Convite para edição (listas privadas)
  - QR Code para presencial
- **Deep Links**:
  - `pinubi://list/ABC123`
  - Fallback para web se app não instalado
  - Login obrigatório para conteúdo privado

#### **Compartilhar Lugar**
- **Formatos**:
  - Link direto: `pinubi://place/GOOGLE_PLACE_ID`
  - Card no WhatsApp com preview
  - Story no Instagram com localização

---

## 💰 FASE 3: MONETIZAÇÃO E AVANÇADO (Scale)

### 8. **JORNADA: Sistema de IA e Créditos**

#### **Fazer Pergunta para IA**
- **Interface**:
  - Chat input na tela principal
  - Prompts sugeridos como chips
  - Indicador de créditos restantes
- **Fluxo**:
  1. Verificar créditos (1 crédito = 1 pergunta)
  2. Construir contexto personalizado
  3. Enviar para OpenAI/Claude
  4. Processar resposta + validar lugares
  5. Apresentar sugestões com opção de adicionar
- **Tela de Resposta**:
  - Resposta da IA em chat bubble
  - Cards dos lugares sugeridos
  - Botão "Adicionar à Lista" em cada card
  - Feedback thumbs up/down

#### **Gerenciar Créditos**
- **Tela de Créditos**:
  - Saldo atual grande e destacado
  - Próximo reset mensal
  - Histórico de transações
  - Missões disponíveis
- **Sistema de Missões**:
  - Cards de missões com progresso
  - Recompensas claras (+10 créditos)
  - Gamificação com badges
- **Comprar Créditos**:
  - Pacotes: 10, 25, 50, 100 créditos
  - Preços escalonados
  - Integração com Stripe

### 9. **JORNADA: Listas Monetizadas**

#### **Criar Lista Premium**
- **Pré-requisito**: Lista privada com conteúdo
- **Configuração**:
  - Definir preço (mín R$ 1,00)
  - Criar descrição premium
  - Preview gratuito (5 primeiros lugares)
  - Configurar tags e categoria
- **Marketplace**:
  - Aparece em seção especial
  - Filtros por categoria/preço
  - Preview limitado antes da compra

#### **Comprar Lista Premium**
- **Fluxo de Compra**:
  1. Ver preview gratuito
  2. Botão "Comprar Acesso" → Stripe Checkout
  3. Pagamento aprovado → Acesso permanente
  4. Criar snapshot preservado
- **Divisão de Receita**: 80% vendedor, 20% plataforma
- **Acesso**: Permanente mesmo se original for deletada

#### **Dashboard do Vendedor**
- **Métricas**:
  - Vendas do dia/semana/mês
  - Visualizações vs conversões
  - Receita total e por lista
  - Rankings de performance
- **Gestão**:
  - Editar preços
  - Atualizar descrições
  - Ver feedback dos compradores

### 10. **JORNADA: Upgrade Premium**

#### **Limitações Free vs Premium**
- **Tela de Limites**:
  - Mostrar quando atingir limite Free
  - Comparativo claro Free vs Premium
  - CTA destacado para upgrade
- **Benefícios Premium**:
  - Listas e lugares ilimitados
  - Perfil privado
  - 20 créditos mensais IA
  - Métricas avançadas
  - Compartilhamento ilimitado

#### **Processo de Upgrade**
- **Integração Stripe**:
  - Assinatura mensal/anual
  - Preços regionalizados
  - Período de teste grátis
  - Cancelamento automático
- **Ativação**: Triggers automáticos atualizam limites

---

## 🎨 Guidelines de UX/UI Gerais

### **Design System**
- **Cores**: Paleta baseada em alimentação (cores quentes)
- **Typography**: San Francisco/Roboto com hierarquia clara
- **Icons**: Consistent icon family (Feather/Heroicons)
- **Spacing**: Grid de 8px para consistência

### **Navigation**
- **Bottom Tab Bar**:
  - Home (mapa/listas)
  - Buscar
  - IA Chat
  - Perfil
- **Stack Navigation**: Padrão iOS/Android
- **Deep Links**: Suporte completo para compartilhamento

### **Estados de Loading**
- **Skeletons** para carregamento de listas
- **Shimmer effect** para cards
- **Pull-to-refresh** em todas as listas
- **Infinite scroll** com loading footer

### **Feedback & Microinterações**
- **Haptic feedback** em ações importantes
- **Animações suaves** para transições
- **Toast notifications** para feedback
- **Empty states** ilustrados e informativos

### **Acessibilidade**
- **Voice Over** support completo
- **Dynamic Type** scaling
- **High contrast** mode
- **Semantic colors** para modo escuro

---

## ⚡ Otimizações Técnicas Críticas

### **Performance**
- **Lazy loading** de imagens
- **Viewport-based** map loading
- **Infinite scroll** com pagination
- **Cache strategy** para 5min viewport

### **Offline Support**
- **Cache** listas e lugares visualizados
- **Sync** quando volta online
- **Queue** ações offline para envio posterior

### **Analytics**
- **PostHog** integration em todas as telas
- **Funnel tracking** para conversões
- **A/B testing** capability
- **Crash reporting** integrado

---

## 📱 Wireframes de Referência

### **Tela Principal (Home)**
```
[Header: Logo + Notificações]
[Search Bar: "Buscar lugares..."]
[Tab Selector: Mapa | Listas]

[se Mapa]
  [Google Maps com markers]
  [Filtros FAB]
  [Bottom Sheet: Lugares próximos]

[se Listas]
  [Grid de Cards das Listas]
  [+ Nova Lista FAB]
```

### **Tela de Lista**
```
[Header: Nome da Lista + Menu ⋯]
[Contadores: 15 lugares | 3 visitados]
[Ações: Ver no Mapa | Compartilhar]

[Lista de Lugares]
  [Card] Foto | Nome | Categoria
         Status | Nota | Ações

[+ Adicionar Lugar FAB]
```

### **Tela de Lugar**
```
[Header: Foto Hero + Back]
[Título: Nome | Categoria | Distância]

[Notas Section]
  Google: 4.5⭐ | Você: 8.5 | Amigos: 7.8

[Info Section]
  📍 Endereço | 📞 Telefone | 🌐 Site
  ⏰ Funcionamento | 💰 Preço $$

[Ações]
  [Adicionar à Lista] [Quero Visitar]
  [Já Visitei] [Avaliar]
```

---

## 🚦 Roadmap de Implementação

### **Sprint 1-2: Auth & Core (2 semanas)**
- Authentication social
- Onboarding com convites
- Sistema de listas básico
- Busca de lugares

### **Sprint 3-4: Mapa & Details (2 semanas)**
- Integração Google Maps
- Visualização no mapa
- Detalhes de lugares
- Sistema de cache

### **Sprint 5-6: Reviews & Social Basic (2 semanas)**
- Sistema de reviews
- Seguir usuários
- Feed básico de atividades

### **Sprint 7-8: Advanced Social (2 semanas)**
- Match social
- Votações inteligentes
- Deep links e compartilhamento

### **Sprint 9-10: IA & Credits (2 semanas)**
- Sistema de créditos
- Integração IA
- Sistema de missões

### **Sprint 11-12: Monetização (2 semanas)**
- Listas premium
- Stripe integration
- Dashboard vendedor
- Upgrade premium

---

Este planejamento garante que o Pinubi tenha uma base sólida para lançamento (FASE 1), crescimento viral através de funcionalidades sociais (FASE 2), e sustentabilidade financeira através de monetização (FASE 3).

Cada jornada foi detalhada com base na documentação técnica existente, garantindo viabilidade de implementação e alinhamento com os requisitos do projeto.
