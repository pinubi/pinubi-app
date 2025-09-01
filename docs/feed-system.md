# Sistema de Feed - Pinubi

## 📋 Visão Geral

O sistema de feed da Pinubi é responsável por mostrar atividades relevantes dos usuários de forma personalizada, considerando relacionamentos sociais, proximidade geográfica e preferências pessoais.

## 🎯 Funcionalidades Implementadas

### 1. **Feed Personalizado** (`getUserFeed`)
- **Objetivo**: Mostrar atividades relevantes baseadas em relacionamentos sociais
- **Fontes**: 
  - Atividades de usuários seguidos (cache)
  - Feed geográfico (lugares próximos)
- **Algoritmo de Relevância**: Score baseado em 5 fatores
- **Rate Limiting**: 100 requests/hora por usuário

### 2. **Feed de Descoberta** (`getDiscoveryFeed`)
- **Objetivo**: Mostrar lugares trending na região do usuário
- **Critério**: Lugares com mais atividade nos últimos 7 dias
- **Filtro**: Distância máxima configurável (padrão: 25km)
- **Rate Limiting**: 50 requests/hora por usuário

### 3. **Sistema de Cache Inteligente**
- **Trigger**: `onActivityCreated` distribui automaticamente atividades para feeds relevantes
- **TTL**: 30 dias para itens cached
- **Performance**: Máximo 450 operações por batch

## 🧮 Algoritmo de Relevância

### Fatores de Score (0-10):

1. **Proximidade Social** (peso: 30%)
   - Usuário seguido: 10 pontos
   - Seguidor: 7 pontos
   - Mesma região: 3 pontos

2. **Proximidade Geográfica** (peso: 20%)
   - ≤ 1km: 10 pontos
   - ≤ 5km: 8 pontos
   - ≤ 15km: 6 pontos
   - ≤ 50km: 4 pontos
   - ≤ 200km: 2 pontos

3. **Match de Categoria** (peso: 20%)
   - Baseado nas preferências do usuário
   - Intersection entre categorias do lugar e usuário

4. **Recência** (peso: 20%)
   - ≤ 2h: 10 pontos
   - ≤ 12h: 8 pontos
   - ≤ 24h: 6 pontos
   - ≤ 3 dias: 4 pontos
   - ≤ 1 semana: 2 pontos

5. **Engajamento** (peso: 10%)
   - Rating alto: +3 pontos
   - Muitos places na lista: +2 pontos
   - Tem fotos: +1 ponto

## 📊 Estrutura de Dados

### Coleção `userFeeds/{userId}/items`
```javascript
{
  activityId: "activity123",
  authorId: "user456",
  authorName: "João Silva",
  type: "place_reviewed",
  data: {
    placeId: "place789",
    placeName: "Sushi Yasuda",
    rating: 9.5,
    // ... outros dados da atividade
  },
  relevanceScore: 8.7,
  isFollowing: true,
  createdAt: Timestamp,
  expiresAt: Timestamp // 30 dias no futuro
}
```

### Tipos de Atividade Suportados:
- `place_added` - Usuário adicionou lugar a uma lista
- `place_visited` - Usuário visitou um lugar
- `place_reviewed` - Usuário avaliou um lugar
- `list_created` - Usuário criou uma nova lista
- `list_purchased` - Usuário comprou uma lista
- `user_followed` - Usuário começou a seguir alguém

## 🚀 Uso no Client-Side

### 1. Buscar Feed Principal
```typescript
const feedResponse = await getUserFeed({
  limit: 20,
  includeGeographic: true,
  maxDistance: 50, // km
  types: ['place_reviewed', 'place_visited'] // opcional
});
```

### 2. Paginação
```typescript
const nextPage = await getUserFeed({
  limit: 20,
  lastTimestamp: feedResponse.items[feedResponse.items.length - 1].createdAt
});
```

### 3. Feed de Descoberta
```typescript
const discoveryResponse = await getDiscoveryFeed({
  limit: 15,
  maxDistance: 25 // km
});
```

### 4. Refresh Manual
```typescript
await refreshUserFeed(); // Limpa cache antigo
const freshFeed = await getUserFeed({ limit: 20 });
```

## 📱 Implementação Client-Side Recomendada

### React/React Native Hook
```typescript
export const useFeed = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = async (refresh = false) => {
    setLoading(true);
    try {
      const response = await getUserFeed({
        limit: 20,
        lastTimestamp: refresh ? null : items[items.length - 1]?.createdAt
      });

      if (refresh) {
        setItems(response.items);
      } else {
        setItems(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Erro ao carregar feed:', error);
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, hasMore, loadFeed };
};
```

### Infinite Scroll
```typescript
const FeedComponent = () => {
  const { items, loading, hasMore, loadFeed } = useFeed();

  useEffect(() => {
    loadFeed(true); // Carregamento inicial
  }, []);

  const onRefresh = () => loadFeed(true);
  const onEndReached = () => hasMore && !loading && loadFeed(false);

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <FeedItemComponent item={item} />}
      onRefresh={onRefresh}
      refreshing={loading}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
    />
  );
};
```

## ⚡ Performance e Otimizações

### 1. **Cache Strategy**
- Feed cached para relacionamentos diretos (seguidos)
- TTL de 30 dias com limpeza automática
- Distribuição em background via triggers

### 2. **Rate Limiting**
- Feed principal: 100 req/h por usuário
- Discovery: 50 req/h por usuário
- Refresh: 10 req/h por usuário

### 3. **Paginação Inteligente**
- Combina cache + feed geográfico conforme necessário
- Limite padrão: 20 items por página
- Busca extra para filtrar por relevância

### 4. **Indexação Recomendada**
```javascript
// Collection: userFeeds/{userId}/items
- expiresAt
- relevanceScore
- type
- createdAt

// Compound indexes:
- expiresAt + relevanceScore + createdAt
- type + relevanceScore
```

## 🔄 Fluxo de Distribuição

### Quando uma atividade é criada:
1. **Trigger** `onActivityCreated` é executado
2. **Verificação** se atividade é pública
3. **Busca** seguidores do autor
4. **Cálculo** de relevância para cada seguidor
5. **Filtro** por score mínimo (≥ 5)
6. **Distribuição** em batches de 450 operações
7. **Cache** com TTL de 30 dias

## 🛠️ Próximas Melhorias

### Fase 2 - Features Avançadas
- [ ] **ML Personalização**: Aprendizado baseado em interações
- [ ] **Feed Temático**: Filtros por categoria/interesse
- [ ] **Histórico de Visualização**: Não repetir items já vistos
- [ ] **Push Notifications**: Alertas para atividades relevantes

### Fase 3 - Otimizações
- [ ] **Edge Caching**: CDN para usuários ativos
- [ ] **Real-time Updates**: WebSockets para feed em tempo real
- [ ] **Analytics**: Métricas de engajamento
- [ ] **A/B Testing**: Diferentes algoritmos de relevância

## 🚨 Monitoramento

### Métricas Importantes:
- **Latência**: Tempo de resposta do `getUserFeed`
- **Cache Hit Rate**: % de items servidos do cache
- **Relevance Score**: Distribuição de scores no feed
- **Geographic Coverage**: % de users com feed geográfico
- **Engagement**: Clicks/views nos items do feed

### Logs Importantes:
- Distribuição de atividades para feeds
- Erros de cálculo de relevância
- Timeouts em consultas geográficas
- Rate limiting ativado
