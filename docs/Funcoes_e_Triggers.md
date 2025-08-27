# Documentação de Funções e Triggers - Pinubi Functions

Este documento descreve todas as funções e triggers implementadas no sistema Pinubi, organizadas por categoria.

## 📋 Índice

- [Funções Administrativas](#-funções-administrativas)
- [Funções de Notificação](#-funções-de-notificação)
- [Funções de Localização e Lugares](#-funções-de-localização-e-lugares)
- [Funções de Avaliações](#-funções-de-avaliações)
- [Funções de Usuários](#-funções-de-usuários)
- [Triggers de Sistema](#-triggers-de-sistema)
- [Funções Agendadas](#-funções-agendadas)

---

## 🔧 Funções Administrativas

### `getSystemStats`

**Descrição:** Obtém estatísticas gerais da plataforma (usuários totais, ativos, novos hoje, notificações enviadas)

- **Permissão:** Apenas administradores
- **Retorna:** Contadores de usuários e notificações com timestamp de geração

### `getAdminActions`

**Descrição:** Consulta logs de ações administrativas com paginação

- **Permissão:** Apenas administradores
- **Parâmetros:** `limit`, `startAfter` (opcional)
- **Retorna:** Lista paginada de ações administrativas

### `forceLogout`

**Descrição:** Força logout de um usuário específico revogando seus tokens

- **Permissão:** Apenas administradores
- **Parâmetros:** `userId`
- **Ação:** Revoga tokens do Firebase Auth e registra ação

### `cleanupTestData`

**Descrição:** Remove dados de teste em ambiente de desenvolvimento

- **Permissão:** Apenas administradores em ambiente não-produção
- **Parâmetros:** `collections`, `confirmationPhrase`
- **Segurança:** Requer frase de confirmação específica

---

## 📱 Funções de Notificação

### `sendNotificationToUser`

**Descrição:** Envia notificação push para um usuário específico

- **Parâmetros:** `userId`, `title`, `body`, `data` (opcional)
- **Validação:** Verifica token FCM e preferências do usuário
- **Registro:** Salva histórico da notificação enviada

### `sendBulkNotification`

**Descrição:** Envia notificações em massa para múltiplos usuários

- **Permissão:** Apenas administradores
- **Parâmetros:** `title`, `body`, `userIds` (opcional), `data`
- **Limite:** Máximo 500 notificações por lote
- **Registro:** Salva estatísticas de envio (sucessos/falhas)

### `updateFCMToken`

**Descrição:** Atualiza token FCM de um usuário para recebimento de notificações

- **Autenticação:** Usuário deve estar logado
- **Parâmetros:** `fcmToken`
- **Ação:** Atualiza token no documento do usuário

---

## 📍 Funções de Localização e Lugares

### `findNearbyPlaces`

**Descrição:** Busca lugares próximos usando coordenadas geográficas e GeoFirestore

- **Parâmetros:** `latitude`, `longitude`, `radius` (padrão: 10km)
- **Tecnologia:** Utiliza GeoFirestore para consultas geográficas eficientes
- **Retorna:** Lista de lugares ordenados por distância com ratings e avaliações

### `addPlaceWithLocation`

**Descrição:** Adiciona um novo lugar com coordenadas geográficas

- **Parâmetros:** `name`, `description`, `category`, `latitude`, `longitude`, `address`
- **Validação:** Verifica se usuário está ativo
- **Tecnologia:** Salva usando GeoFirestore para indexação geográfica

### `updatePlaceLocation`

**Descrição:** Atualiza coordenadas de um lugar existente

- **Parâmetros:** `placeId`, `latitude`, `longitude`
- **Permissão:** Apenas o criador do lugar pode editar
- **Ação:** Atualiza coordenadas no GeoFirestore

### `getPlacesInMapView`

**Descrição:** Busca lugares dentro de uma área visível do mapa com filtros avançados

- **Parâmetros:** `center`, `radius`, `filters`, `pagination`, `bounds`
- **Filtros:** Categoria, avaliação mínima, tags, inclusão de reviews
- **Ordenação:** Distância, rating, data de criação
- **Paginação:** Suporte completo com controle de offset/limit

### `searchPlacesAdvanced`

**Descrição:** Busca avançada de lugares com múltiplos filtros e ordenação

- **Parâmetros:** `filters`, `location`, `pagination`, `sortBy`
- **Filtros:** Texto, categorias, faixa de preço, horário de funcionamento
- **Funcionalidade:** Cálculo de distância, filtro por tags, inclusão de reviews

### `getPlaceDetails`

**Descrição:** Obtém detalhes completos de um lugar usando Google Place ID com estratégia cache-first

- **Parâmetros:** `placeId`, `forceRefresh` (opcional), `language` (opcional, padrão: 'pt-BR')
- **Estratégia de Cache:**
  - Verifica dados locais primeiro (válidos por 7 dias)
  - Busca Google Places API apenas se necessário ou forçado
  - Fallback para dados antigos se API falhar
- **Funcionalidades:**
  - Integração completa com Google Places API
  - Processamento e normalização de dados
  - Categorização automática baseada em tipos
  - Geração de palavras-chave para busca
  - Preservação de dados da plataforma existentes
  - Analytics de acesso ao lugar
- **Tecnologia:** Utiliza GeoFirestore para armazenamento com índices geográficos
- **Retorna:** Dados completos do lugar, metadados de cache e origem dos dados

### `updateUserLocation`

**Descrição:** Salva/atualiza localização atual do usuário

- **Parâmetros:** `location` (lat, lng, accuracy), `address` (opcional)
- **Uso:** Para futuras consultas de lugares próximos
- **Armazenamento:** Coordenadas como GeoPoint no Firestore

### `getUserLocation`

**Descrição:** Recupera localização salva do usuário

- **Validação:** Verifica idade da localização (marca como obsoleta após 24h)
- **Retorna:** Coordenadas, endereço, timestamp e status de atualização

---

## ⭐ Funções de Avaliações

### `createReview`

**Descrição:** Cria nova avaliação para um lugar

- **Parâmetros:** `placeId`, `rating` (0-10), `reviewType`, `wouldReturn`, `comment`, `photos`, `isVisited`, `visitDate`
- **Tipos:** food, drink, dessert, service, ambiance, overall
- **Validação:** Previne avaliações duplicadas do mesmo tipo por usuário
- **Rate Limit:** 20 tentativas por hora por usuário

### `updateReview`

**Descrição:** Atualiza avaliação existente

- **Permissão:** Apenas o autor da avaliação
- **Validação:** Verifica duplicatas se tipo de avaliação for alterado
- **Atualização:** Recalcula interações do usuário com o lugar
- **Rate Limit:** 30 tentativas por hora por usuário

### `deleteReview`

**Descrição:** Remove avaliação existente

- **Permissão:** Apenas o autor da avaliação
- **Ação:** Recalcula métricas do lugar após remoção
- **Rate Limit:** 10 tentativas por hora por usuário

### `getPlaceReviews`

**Descrição:** Busca avaliações de um lugar específico

- **Parâmetros:** `placeId`, `limit`, `offset`, `reviewType`, `userId`
- **Filtros:** Por tipo de avaliação ou usuário específico
- **Ordenação:** Por data de criação (mais recentes primeiro)

### `getUserReviews`

**Descrição:** Busca todas as avaliações de um usuário

- **Parâmetros:** `userId`, `limit`, `offset`
- **Privacidade:** Respeita configurações de privacidade do perfil
- **Paginação:** Suporte completo com controle de limite

### `toggleReviewLike`

**Descrição:** Curte ou descrute uma avaliação

- **Ação:** Incrementa/decrementa contador de likes
- **Array:** Mantém lista de usuários que curtiram
- **Rate Limit:** 100 tentativas por hora por usuário

---

## 👥 Funções de Usuários

### `validateInviteAndActivateUser`

**Descrição:** Valida código de convite e ativa usuário completamente seguindo Database Schema

- **Parâmetros:** `inviteCode`
- **Ações:**
  - Ativa e valida usuário
  - Cria listas automáticas ("Quero Visitar" e "Favoritas")
  - Cria perfil público e configurações
  - Atribui créditos de IA iniciais
  - Registra convidador e oferece bônus
- **Rate Limit:** 5 tentativas por hora por usuário

### `getUserInviteStatus`

**Descrição:** Consulta status de convites do usuário

- **Retorna:** Código de convite, convites usados/disponíveis, lista de convidados
- **Rate Limit:** 20 consultas por hora por usuário

### `followUser`

**Descrição:** Sistema de seguir usuários com diferenciação público/privado

- **Perfis Públicos:** Segue imediatamente
- **Perfis Privados:** Cria solicitação de amizade
- **Bônus:** Oferece créditos de IA por seguir
- **Contadores:** Atualiza followers/following nos perfis
- **Rate Limit:** 50 tentativas por hora por usuário

### `getUserData`

**Descrição:** Busca dados completos de um usuário

- **Privacidade:** Retorna dados limitados para perfis privados não seguidos
- **Dados:** Usuário, perfil e configurações
- **Rate Limit:** 100 consultas por hora por usuário

### `updateUserProfile`

**Descrição:** Atualiza perfil do usuário

- **Campos:** `displayName`, `bio`, `avatar`, `profileVisibility`
- **Validação:** Nome entre 2-50 caracteres, bio até 300 caracteres
- **Restrição:** Perfil privado apenas para usuários Premium
- **Rate Limit:** 20 atualizações por hora por usuário

### `listUsers`

**Descrição:** Lista usuários do sistema

- **Permissão:** Apenas administradores
- **Paginação:** Suporte com `limit` e `startAfter`
- **Ordenação:** Por data de criação (mais recentes primeiro)
- **Rate Limit:** 10 consultas por hora por admin

### `deactivateUser`

**Descrição:** Desativa usuário (soft delete)

- **Permissão:** Administradores ou o próprio usuário
- **Ações:** Marca como inativo no Firestore e desabilita no Authentication
- **Rate Limit:** 5 tentativas por hora por usuário

### `validateInviteCode`

**Descrição:** Valida código de convite sem ativar o usuário

- **Uso:** Para validação prévia durante cadastro
- **Retorna:** Validade do código e dados do convidador
- **Rate Limit:** 10 tentativas por hora (inclui usuários anônimos)

---

## ⚡ Triggers de Sistema

### `onUserCreate` (Auth Trigger)

**Descrição:** Trigger executado quando um novo usuário é criado no Firebase Auth

- **Disparo:** Automaticamente quando `createUserWithEmailAndPassword` é executado
- **Ação:** Cria documento inicial do usuário no Firestore
- **Estado:** Inicializa usuário em estado de onboarding (`isValidated: false, isActive: false`)
- **Estrutura:** Segue completamente o Database Schema
- **Dados:** Usa informações do Auth (email, displayName, uid)
- **Código de Convite:** Gera automaticamente código único de 6 caracteres

### `onUserUpdate` (Firestore Trigger)

**Descrição:** Trigger executado quando documento do usuário é atualizado no Firestore

- **Monitoramento:**
  - Ativação do usuário (`isActive: false → true`) - cria perfil e configurações
  - Upgrade para Premium (atualiza créditos)
  - Mudança de visibilidade do perfil
  - Alteração de nome (sincroniza com perfil)
  - Mudança de email (atualiza Authentication)

### `onUserDelete` (Firestore Trigger)

**Descrição:** Trigger executado quando documento do usuário é deletado

- **Limpeza:** Remove perfil, configurações e dados do Authentication
- **Integridade:** Mantém integridade referencial do sistema

### `onReviewCreated`

**Descrição:** Trigger executado quando nova avaliação é criada

- **Ação:** Recalcula médias de avaliação do lugar
- **Atualização:** Atualiza documento do lugar com novas médias

### `onReviewUpdated`

**Descrição:** Trigger executado quando avaliação é atualizada

- **Condição:** Só recalcula se a nota foi alterada
- **Ação:** Atualiza médias do lugar

### `onReviewDeleted`

**Descrição:** Trigger executado quando avaliação é removida

- **Ação:** Recalcula médias do lugar sem a avaliação removida

---

## ⏰ Funções Agendadas

### `cleanupOldNotifications`

**Descrição:** Remove notificações antigas diariamente

- **Agendamento:** Todo dia às 2h da manhã
- **Critério:** Remove notificações com mais de 30 dias
- **Limite:** Processa máximo 500 notificações por execução

### `backupUserData`

**Descrição:** Realiza backup diário de dados críticos

- **Agendamento:** Todo dia às 3h da manhã
- **Dados:** Usuários e perfis
- **Armazenamento:** Google Cloud Storage com timestamp
- **Formato:** JSON estruturado por data

### `weeklyUserReport`

**Descrição:** Gera relatório semanal de usuários

- **Agendamento:** Segundas-feiras às 9h da manhã
- **Métricas:** Usuários ativos, novos usuários, notificações enviadas
- **Armazenamento:** Salva relatório na coleção 'reports'

### `updateSocialMetrics`

**Descrição:** Atualiza métricas sociais dos lugares

- **Agendamento:** Todo dia às 2h da manhã
- **Cálculo:** Médias de avaliações de amigos por lugar
- **Uso:** Para recomendações sociais personalizadas

---

## 🛡️ Recursos de Segurança

### Rate Limiting

- Implementado em todas as funções críticas
- Limites específicos por função e usuário
- Prevenção contra abuso e ataques

### Validação de Permissões

- Verificação de autenticação em funções sensíveis
- Controle de acesso baseado em roles (admin/user)
- Validação de propriedade de dados

### Validação de Dados

- Sanitização de inputs
- Validação de tipos e limites
- Prevenção contra dados malformados

### Logging Abrangente

- Log detalhado de todas as operações
- Tracking de erros com contexto
- Monitoramento de performance

---

## 📊 Tecnologias Utilizadas

- **Firebase Functions v2**: Runtime para Cloud Functions
- **GeoFirestore**: Consultas geográficas eficientes com otimizações para filtros combinados
- **Google Places API**: Integração para dados detalhados de lugares com cache inteligente
- **Firebase Admin SDK**: Gerenciamento completo do Firebase
- **Cloud Storage**: Backup de dados
- **Cloud Scheduler**: Funções agendadas
- **Rate Limiting**: Controle de tráfego customizado
- **Batch Operations**: Operações atômicas no Firestore
- **Cache Strategy**: Sistema cache-first para otimização de performance e redução de custos API

---

## 🔄 Fluxos Principais

### 1. Onboarding de Usuário

1. Signup com email/senha → Firebase Auth → Auth Trigger `onUserCreate` (estado onboarding)
2. Validação de convite → `validateInviteAndActivateUser` → Atualiza usuário
3. Firestore Trigger `onUserUpdate` → Ativação completa com listas e perfil automáticos

### 2. Sistema de Avaliações

1. Criação → `createReview` → `onReviewCreated` → Recálculo de médias
2. Atualização → `updateReview` → `onReviewUpdated` → Recálculo se necessário
3. Remoção → `deleteReview` → `onReviewDeleted` → Recálculo de médias

### 3. Sistema Social

1. Seguir usuário público → `followUser` → Atualização imediata
2. Solicitar perfil privado → `followUser` → Criação de friend request
3. Métricas sociais → `updateSocialMetrics` (agendada)

### 4. Gestão de Lugares

1. Busca geográfica → `findNearbyPlaces` / `getPlacesInMapView`
2. Busca avançada → `searchPlacesAdvanced`
3. Criação → `addPlaceWithLocation` (com GeoFirestore)
4. Detalhes com cache → `getPlaceDetails` → Cache check → Google API (se necessário) → Persistência

### 5. Cache e Otimização de Dados

1. **Cache-First Strategy**: Verificação local antes de API externa
2. **Google Places Integration**: Busca automática com fallback para dados antigos
3. **GeoFirestore Optimization**: Filtragem geográfica seguida de filtros em memória
4. **Analytics de Acesso**: Registro automático de visualizações de lugares

Esta documentação fornece uma visão completa de todas as funções e triggers disponíveis no sistema Pinubi, suas funcionalidades, parâmetros e interações.
