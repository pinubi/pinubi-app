# Requisitos Técnicos - Pinubi

## 1. Gestão de Listas

### 1.1 Criação de Listas

- Adicionar um emoji
- Adicionar um título
- Definir visibilidade (pública ou privada)
- Adicionar usuários como editores
- Adicionar lugares do Google Maps
- Contador automático de quantidade de lugares
- Adicionar tags para filtros

### 1.2 Permissões de Listas

- Cada lista tem apenas um dono
- Somente o dono pode excluir a lista
- Editores podem visualizar ou editar (conforme permissão definida pelo dono)

### 1.3 Listas Pré-cadastradas

- Todo usuário recebe 2 listas automáticas:
  - "Quero Visitar"
  - "Favoritas"
- Estas listas não podem ser excluídas ou renomeadas

### 1.4 Lista Especial da Plataforma

- "Recomendações da Pinubi" - visível para todos os usuários

### 1.5 Monetização de Listas

- Apenas listas privadas podem ser monetizadas
- Dono define o valor a ser cobrado
- Divisão de receita: 80% para o dono, 20% para a plataforma
- Usuário que compra mantém acesso permanente (cópia preservada mesmo se original for deletada)
- Listas monetizadas mostram informações básicas, mas conteúdo apenas após pagamento

## 2. Gestão de Lugares

### 2.1 Origem dos Dados

- Lugares vindos da API do Google Maps
- Armazenamento em cache local após primeira adição
- Atualização semanal via trigger para sincronizar com Google Maps

### 2.2 Interações com Lugares

- Copiar lugar individual para outra lista
- Copiar lista inteira
- Marcar como visitado
- Adicionar reviews

### 2.3 Sistema de Reviews

- Indicar se voltaria ou não
- Adicionar fotos
- Nota de 0 a 10 (aceita decimais, ex: 5.6)
- Comentários
- Múltiplas reviews por lugar (ex: comida, bebida, sobremesa)
- Cálculo de média automático
- Tipos de lugares: restaurantes, hotéis fazenda, baladas, parques, etc.

### 2.4 Visualização de Notas

- Nota geral do Google
- Nota do próprio usuário
- Nota média dos amigos

## 3. Sistema de Usuários

### 3.0 Sistema de Convites e Onboarding (Early Stage)

- **Fluxo de Onboarding**: Usuário faz login social → passa pelo onboarding → deve fornecer código de convite válido para ativação
- **Estados do Usuário**:
  - **Onboarding**: `isValidated: false, isActive: false` - pode apenas atualizar próprio perfil
  - **Ativo**: `isValidated: true, isActive: true` - acesso completo ao app
- **Sistema de Convites**:
  - Cada usuário validado recebe código único (6 caracteres alfanuméricos)
  - Máximo 5 usos por código
  - Convites não expiram
  - Convidador ganha 10 créditos de IA por usuário validado
  - Rastreamento completo: quem convidou quem
- **Segurança**: Firestore rules impedem acesso às coleções até validação completa
- **Ativação Automática**:
  - Criação de listas automáticas ("Quero Visitar", "Favoritas")
  - Criação de perfil público e configurações
  - Distribuição de 5 créditos iniciais para IA
- **Visualização**:
  - Quantidade de convites restantes
  - Lista de usuários convidados

### 3.1 Autenticação

- **Login Social**: Autenticação exclusiva via redes sociais (Google, Facebook, Apple)
- **Sem Validação**: Não há validação de email/telefone (dados vêm das redes sociais)
- **Controle de Acesso**: Baseado em códigos de convite durante early access

### 3.2 Relacionamento entre Usuários

- Seguir outros usuários
- Receber atualizações de atividades:
  - Adicionou um lugar
  - Visitou um lugar
  - Avaliou um lugar
  - Comprou uma lista
  - Match social

### 3.2 Tipos de Conta

#### Usuário Free

- Máximo 5 listas (incluindo as 2 automáticas)
- Máximo 15 lugares por lista
- 5 créditos mensais para IA (ganham +10 por usuário convidado)
- Perfil sempre público (não pode alterar para privado)
- Não pode compartilhar listas com outros usuários (apenas visualização própria)
- Sem acesso a métricas avançadas
- Máximo 2 votações por mês
- **Estado de Ativação**: Deve passar pelo processo de validação via convite

#### Usuário Premium

- Listas e lugares ilimitados
- Pode tornar perfil privado (controle total de privacidade)
- Compartilhamento ilimitado de listas (editores e visualizadores)
- Votações ilimitadas
- Acesso completo a métricas:
  - Quantos acessos às suas listas
  - Lugares com mais interesse
  - Perfis com mais match de preferências
  - Analytics detalhado de engajamento
- 20 créditos mensais para IA (5 base + 15 premium)
- **Estado de Ativação**: Mesmo processo de validação via convite

### 3.3 Perfil Privado vs Público

- Perfil privado: conteúdo visível apenas para amigos
- Listas públicas ou monetizadas permanecem acessíveis
- Solicitações de amizade requerem aprovação

## 4. Sistema de Créditos

### 4.1 Obtenção de Créditos

- Free: 5 créditos mensais gratuitos
- Premium: 15 créditos adicionais (total 20)
- Missões:
  - Convidar amigo: 10 créditos
  - Adicionar lugar: 2 créditos
  - Seguir amigo: 5 créditos
- Compra de pacotes adicionais

### 4.2 Uso de Créditos

- Desbloquear listas exclusivas da plataforma
- Fazer perguntas para IA

## 5. Visualização em Mapa

### 5.1 Funcionalidades do Mapa

- Baseado em Google Maps
- Markers para lugares
- Visualizar próprios lugares e de amigos

### 5.2 Filtros do Mapa

- Por região (País, Estado, Cidade, Zonas)
- Por categoria
- Por lista
- Por tag
- Recomendações da Pinubi
- Recomendações de amigos
- Onde amigos querem ir
- Onde amigos mais foram
- O que amigos mais gostaram
- Pesquisa por nome

### 5.3 Localização

- Solicitar permissão de localização
- Opção para solicitar novamente se negado
- Fallback via IP se localização desabilitada

### 5.4 Paginação e Performance

- **Modo Mapa**: Carregamento baseado em raio de visibilidade
  - Retorna apenas lugares dentro da área visível do mapa
  - Carregamento dinâmico conforme usuário navega/move no mapa
  - Otimização para evitar sobrecarga de markers
- **Modo Lista**: Paginação tradicional
  - Carregamento em lotes para evitar retornar todos os lugares de uma vez
  - Scroll infinito ou paginação por páginas
  - Melhoria na performance e experiência do usuário

## 6. Funcionalidades Sociais

### 6.1 Match Social

- Selecionar amigos para match
- Sugestões por categoria (ex: Top 3 japonês, Top 3 hambúrguer)
- Baseado em preferências e histórico do grupo
- Opção de notificar participantes
- Gerar link compartilhável
- Manter histórico de matches

### 6.2 Votação Inteligente

- Criar pool de votação
- Configurar se aceita sugestões de outros usuários
- Definir quantidade de votos por pessoa
- Gerar link único compartilhável
- Deeplink para aplicativo

### 6.3 Compartilhamento

- Gerar links públicos de listas
- Controle de acesso baseado em privacidade
- Links únicos para votações e matches

## 7. Inteligência Artificial

### 7.1 Sugestões Personalizadas

- Prompts pré-cadastrados de exemplo
- Prompts customizados
- Consideração de preferências e interações do usuário
- Histórico de pesquisas
- Opção de adicionar sugestões às listas

### 7.2 Recomendações

- Padrões de comportamento
- Cruzamento de informações entre amigos
- Sugestões de amigos (contatos, amigos de amigos)
- Sugestões de lugares

## 8. Sistema de Notificações

### 8.1 Triggers de Engajamento

- Notificação após X dias sem abrir o app

### 8.2 Notificações de Ações

- Match social
- Votação inteligente
- Solicitação de amigo
- Compra de lista privada
- Convites para listas

## 9. Rankings e Métricas

### 9.1 Rankings Públicos

- Melhores lugares
- Listas mais compradas
- Lugares mais visitados
- Lugares com mais reviews positivas

### 9.2 Métricas para Listas Monetizadas

- Quantidade de vendas
- Visualizações
- Faturamento (diário, semanal, mensal, histórico)

## 10. Gestão de Convites e Permissões

### 10.1 Convites para Listas

- Convite como editor ou visualizador
- Sistema de pendências
- Aceitar ou recusar convite

### 10.2 Solicitações de Amizade

- Para perfis privados: aprovação necessária
- Notificações para ambas as partes

## 11. Preferências do Usuário

- Perguntas na criação do perfil
- Utilização para IA e recomendações

## 12. Tecnologias

### 12.1 Infraestrutura

- Firebase (Cloud Functions, Triggers, Database, Authentication)
- Stripe (Pagamentos)
- Posthog (Monitoramento)
- Google
- Cloudflare R2

### 12.3 Rate Limiting

- Implementação de rate limiting nas Cloud Functions
- Limites diferenciados por tipo de usuário (Free/Premium)
- Controle de requisições por endpoint e período
- Proteção contra abuso e spam

### 12.2 Armazenamento de Imagens

- Uploads: armazenar apenas a URL no banco de dados; os arquivos de imagem serão salvos no Cloudflare R2.
- Distribuição: imagens servidas via CDN (Cloudflare CDN) com cache e otimizações (compressão, variantes responsivas).
- Segurança/controle: considerar URLs assinadas para uploads/expiração e políticas de retenção.
