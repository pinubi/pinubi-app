# Sistema de Follow/Unfollow - Pinubi

## 📋 Funcionalidades Implementadas

### ✅ **Funções de Relacionamento:**

1. **`followUser`** - Seguir usuário
2. **`unfollowUser`** - Deixar de seguir usuário  
3. **`checkFollowStatus`** - Verificar status de relacionamento

### ✅ **Funções de Listagem de Relacionamentos:**

4. **`getFollowers`** - Listar seguidores de um usuário
5. **`getFollowing`** - Listar quem o usuário está seguindo
6. **`getFollowStats`** - Obter estatísticas de relacionamento

### ✅ **Funções de Descoberta de Usuários:**

7. **`searchUsers`** - Buscar usuários por nome
8. **`findNearbyUsers`** - Encontrar usuários próximos geograficamente
9. **`getUserSuggestions`** - Sugestões inteligentes baseadas em interesses/atividade
10. **`exploreUsersByCategory`** - Explorar usuários por categoria/interesse

## 🚀 Como Usar no Client-Side

### � **LISTAGEM DE RELACIONAMENTOS**

### 1. **Listar Seguidores**

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

const getFollowers = httpsCallable(functions, 'getFollowers');

// Listar seguidores do usuário atual
try {
  const result = await getFollowers({
    limit: 20,
    startAfter: null // Para paginação
  });
  
  const { followers, hasMore, lastDoc } = result.data;
  
  console.log(`${followers.length} seguidores encontrados`);
  followers.forEach(follower => {
    console.log(`${follower.name} (@${follower.username})`);
    console.log(`Seguiu em: ${follower.followedAt.toDate()}`);
  });
  
  // Para próxima página
  if (hasMore) {
    const nextPage = await getFollowers({
      limit: 20,
      startAfter: lastDoc
    });
  }
  
} catch (error) {
  console.error('❌ Erro ao buscar seguidores:', error.message);
}
```

### 2. **Listar Quem Você Está Seguindo**

```typescript
const getFollowing = httpsCallable(functions, 'getFollowing');

// Listar usuários que estou seguindo
try {
  const result = await getFollowing({
    limit: 20,
    startAfter: null
  });
  
  const { following, hasMore, lastDoc } = result.data;
  
  console.log(`Seguindo ${following.length} usuários`);
  following.forEach(user => {
    console.log(`${user.name} (@${user.username})`);
    console.log(`${user.followersCount} seguidores`);
  });
  
} catch (error) {
  console.error('❌ Erro ao buscar seguindo:', error.message);
}
```

### 3. **Obter Estatísticas de Relacionamento**

```typescript
const getFollowStats = httpsCallable(functions, 'getFollowStats');

// Obter contadores de follow/followers
try {
  const result = await getFollowStats({
    userId: 'user123' // Opcional, se não informado usa o usuário atual
  });
  
  const { followersCount, followingCount } = result.data;
  
  console.log(`${followersCount} seguidores, ${followingCount} seguindo`);
  
} catch (error) {
  console.error('❌ Erro ao buscar estatísticas:', error.message);
}
```

### �🔍 **DESCOBERTA DE USUÁRIOS**

### 1. **Buscar Usuários por Nome**

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

const searchUsers = httpsCallable(functions, 'searchUsers');

// Buscar usuários
try {
  const result = await searchUsers({
    query: 'João Silva',
    limit: 20,
    startAfter: null // Para paginação
  });
  
  const { users, hasMore, query } = result.data;
  
  console.log(`Encontrados ${users.length} usuários para "${query}"`);
  users.forEach(user => {
    console.log(`${user.displayName} - ${user.isFollowing ? 'Seguindo' : 'Não seguindo'}`);
  });
  
} catch (error) {
  console.error('❌ Erro na busca:', error.message);
}
```

### 2. **Encontrar Usuários Próximos**

```typescript
const findNearbyUsers = httpsCallable(functions, 'findNearbyUsers');

// Encontrar usuários próximos
try {
  const result = await findNearbyUsers({
    radius: 50, // raio em km
    limit: 20
  });
  
  const { users, userLocation, radius } = result.data;
  
  console.log(`Usuários próximos em ${userLocation} (${radius}km):`);
  users.forEach(user => {
    console.log(`${user.displayName} - ${user.distance}km - Interesses: ${user.mutualInterests.join(', ')}`);
  });
  
} catch (error) {
  if (error.code === 'failed-precondition') {
    console.log('⚠️ Ative a localização para encontrar usuários próximos');
  } else {
    console.error('❌ Erro:', error.message);
  }
}
```

### 3. **Sugestões Inteligentes de Usuários**

```typescript
const getUserSuggestions = httpsCallable(functions, 'getUserSuggestions');

// Obter sugestões personalizadas
try {
  const result = await getUserSuggestions({
    limit: 15
  });
  
  const { suggestions, categories } = result.data;
  
  console.log('📊 Categorias de sugestões:');
  console.log(`- Amigos mútuos: ${categories.mutualFollows}`);
  console.log(`- Interesses similares: ${categories.similarInterests}`);
  console.log(`- Usuários próximos ativos: ${categories.nearbyActive}`);
  
  suggestions.forEach(suggestion => {
    console.log(`${suggestion.displayName} - Score: ${suggestion.relevanceScore}`);
    console.log(`Motivos: ${suggestion.reasons.join(', ')}`);
  });
  
} catch (error) {
  console.error('❌ Erro ao buscar sugestões:', error.message);
}
```

### 4. **Explorar por Categoria/Interesse**

```typescript
const exploreUsersByCategory = httpsCallable(functions, 'exploreUsersByCategory');

// Explorar usuários interessados em "Gastronomia"
try {
  const result = await exploreUsersByCategory({
    category: 'Gastronomia',
    limit: 20,
    orderBy: 'activity' // 'activity', 'followers', 'recent'
  });
  
  const { users, category, totalFound } = result.data;
  
  console.log(`${totalFound} usuários interessados em ${category}:`);
  users.forEach(user => {
    console.log(`${user.displayName} - Score: ${user.activityScore}`);
    console.log(`Stats: ${user.stats.followersCount} seguidores, ${user.stats.reviewsCount} reviews`);
    console.log(`Outros interesses: ${user.commonInterests.join(', ')}`);
  });
  
} catch (error) {
  console.error('❌ Erro ao explorar categoria:', error.message);
}
```

### 🔗 **FUNÇÕES DE RELACIONAMENTO**

### 5. **Seguir Usuário**

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

const followUser = httpsCallable(functions, 'followUser');

// Seguir usuário
try {
  const result = await followUser({
    userToFollowId: 'user123'
  });
  
  if (result.data.success) {
    console.log('✅ Usuário seguido com sucesso!');
    // Atualizar UI para mostrar "Seguindo"
  }
} catch (error) {
  if (error.code === 'already-exists') {
    console.log('⚠️ Você já segue este usuário');
  } else if (error.code === 'permission-denied') {
    console.log('🔒 Solicitação enviada para perfil privado');
  } else {
    console.error('❌ Erro ao seguir:', error.message);
  }
}
```

### 6. **Deixar de Seguir**

```typescript
const unfollowUser = httpsCallable(functions, 'unfollowUser');

// Deixar de seguir
try {
  const result = await unfollowUser({
    userToUnfollowId: 'user123'
  });
  
  if (result.data.success) {
    console.log('✅ Deixou de seguir com sucesso!');
    // Atualizar UI para mostrar "Seguir"
  }
} catch (error) {
  if (error.code === 'not-found') {
    console.log('⚠️ Você não segue este usuário');
  } else {
    console.error('❌ Erro ao deixar de seguir:', error.message);
  }
}
```

### 7. **Verificar Status de Relacionamento**

```typescript
const checkFollowStatus = httpsCallable(functions, 'checkFollowStatus');

// Verificar se está seguindo
try {
  const result = await checkFollowStatus({
    targetUserId: 'user123'
  });
  
  const { isFollowing, isFollowedBy, isMutual, followedAt } = result.data;
  
  console.log('Status do relacionamento:');
  console.log('Você segue:', isFollowing);
  console.log('Te segue de volta:', isFollowedBy);
  console.log('Follow mútuo:', isMutual);
  console.log('Seguindo desde:', followedAt);
  
} catch (error) {
  console.error('❌ Erro ao verificar status:', error.message);
}
```

## 📱 Exemplos de Componentes React/React Native

### 👥 **Componente de Lista de Seguidores**

```typescript
// components/FollowersList.tsx
import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface Follower {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followedAt: any;
}

interface FollowersListProps {
  userId?: string; // Se não informado, usa o usuário atual
}

export const FollowersList: React.FC<FollowersListProps> = ({ userId }) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<string | null>(null);

  const getFollowers = httpsCallable(functions, 'getFollowers');

  const loadFollowers = async (isLoadMore = false) => {
    try {
      setLoading(true);
      
      const result = await getFollowers({
        userId,
        limit: 20,
        startAfter: isLoadMore ? lastDoc : null
      });

      const { followers: newFollowers, hasMore: more, lastDoc: last } = result.data;

      if (isLoadMore) {
        setFollowers(prev => [...prev, ...newFollowers]);
      } else {
        setFollowers(newFollowers);
      }

      setHasMore(more);
      setLastDoc(last);

    } catch (error) {
      console.error('Erro ao carregar seguidores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  return (
    <div className="followers-list">
      <h3>Seguidores</h3>
      
      {loading && followers.length === 0 ? (
        <p>Carregando seguidores...</p>
      ) : (
        <>
          {followers.map(follower => (
            <div key={follower.id} className="follower-item">
              <img 
                src={follower.avatar || '/default-avatar.png'} 
                alt={follower.name}
                className="avatar"
              />
              <div className="info">
                <h4>{follower.name}</h4>
                <p>@{follower.username}</p>
                <p>{follower.bio}</p>
                <small>
                  {follower.followersCount} seguidores • 
                  Seguiu em {follower.followedAt?.toDate().toLocaleDateString()}
                </small>
              </div>
            </div>
          ))}

          {hasMore && (
            <button 
              onClick={() => loadFollowers(true)}
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
```

### 🔗 **Componente de Lista de Seguindo**

```typescript
// components/FollowingList.tsx
import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface Following {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followedAt: any;
}

export const FollowingList: React.FC = () => {
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<string | null>(null);

  const getFollowing = httpsCallable(functions, 'getFollowing');
  const unfollowUser = httpsCallable(functions, 'unfollowUser');

  const loadFollowing = async (isLoadMore = false) => {
    try {
      setLoading(true);
      
      const result = await getFollowing({
        limit: 20,
        startAfter: isLoadMore ? lastDoc : null
      });

      const { following: newFollowing, hasMore: more, lastDoc: last } = result.data;

      if (isLoadMore) {
        setFollowing(prev => [...prev, ...newFollowing]);
      } else {
        setFollowing(newFollowing);
      }

      setHasMore(more);
      setLastDoc(last);

    } catch (error) {
      console.error('Erro ao carregar seguindo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser({ userToUnfollowId: userId });
      
      // Remove da lista local
      setFollowing(prev => prev.filter(user => user.id !== userId));
      
    } catch (error) {
      console.error('Erro ao deixar de seguir:', error);
    }
  };

  useEffect(() => {
    loadFollowing();
  }, []);

  return (
    <div className="following-list">
      <h3>Seguindo</h3>
      
      {loading && following.length === 0 ? (
        <p>Carregando...</p>
      ) : (
        <>
          {following.map(user => (
            <div key={user.id} className="following-item">
              <img 
                src={user.avatar || '/default-avatar.png'} 
                alt={user.name}
                className="avatar"
              />
              <div className="info">
                <h4>{user.name}</h4>
                <p>@{user.username}</p>
                <p>{user.bio}</p>
                <small>{user.followersCount} seguidores</small>
              </div>
              <button 
                onClick={() => handleUnfollow(user.id)}
                className="unfollow-btn"
              >
                Deixar de seguir
              </button>
            </div>
          ))}

          {hasMore && (
            <button 
              onClick={() => loadFollowing(true)}
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
```

### 📊 **Componente de Estatísticas de Follow**

```typescript
// components/FollowStats.tsx
import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface FollowStatsProps {
  userId?: string;
  showLabels?: boolean;
}

export const FollowStats: React.FC<FollowStatsProps> = ({ 
  userId, 
  showLabels = true 
}) => {
  const [stats, setStats] = useState({
    followersCount: 0,
    followingCount: 0
  });
  const [loading, setLoading] = useState(true);

  const getFollowStats = httpsCallable(functions, 'getFollowStats');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getFollowStats({ userId });
        setStats(result.data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  if (loading) {
    return <div>Carregando estatísticas...</div>;
  }

  return (
    <div className="follow-stats">
      <div className="stat-item">
        <span className="count">{stats.followersCount}</span>
        {showLabels && <span className="label">Seguidores</span>}
      </div>
      <div className="stat-item">
        <span className="count">{stats.followingCount}</span>
        {showLabels && <span className="label">Seguindo</span>}
      </div>
    </div>
  );
};
```

## 📱 Exemplo de Componente React/React Native Completo

### Hook Customizado para Follow

```typescript
// hooks/useFollow.ts
import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  loading: boolean;
}

export const useFollow = (targetUserId: string) => {
  const [status, setStatus] = useState<FollowStatus>({
    isFollowing: false,
    isFollowedBy: false,
    isMutual: false,
    loading: true
  });

  const followUser = httpsCallable(functions, 'followUser');
  const unfollowUser = httpsCallable(functions, 'unfollowUser');
  const checkFollowStatus = httpsCallable(functions, 'checkFollowStatus');

  // Verificar status inicial
  useEffect(() => {
    if (targetUserId) {
      checkStatus();
    }
  }, [targetUserId]);

  const checkStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      const result = await checkFollowStatus({ targetUserId });
      const data = result.data;
      
      setStatus({
        isFollowing: data.isFollowing,
        isFollowedBy: data.isFollowedBy,
        isMutual: data.isMutual,
        loading: false
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFollow = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      if (status.isFollowing) {
        // Deixar de seguir
        await unfollowUser({ userToUnfollowId: targetUserId });
        setStatus(prev => ({
          ...prev,
          isFollowing: false,
          isMutual: false,
          loading: false
        }));
      } else {
        // Seguir
        await followUser({ userToFollowId: targetUserId });
        setStatus(prev => ({
          ...prev,
          isFollowing: true,
          isMutual: prev.isFollowedBy,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Erro ao seguir/deixar de seguir:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    ...status,
    handleFollow,
    refreshStatus: checkStatus
  };
};
```

### Hook para Descoberta de Usuários

```typescript
// hooks/useUserDiscovery.ts
import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface DiscoveryFilters {
  searchQuery?: string;
  category?: string;
  radius?: number;
  orderBy?: 'activity' | 'followers' | 'recent';
  limit?: number;
}

export const useUserDiscovery = () => {
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const searchUsers = httpsCallable(functions, 'searchUsers');
  const findNearbyUsers = httpsCallable(functions, 'findNearbyUsers');
  const getUserSuggestions = httpsCallable(functions, 'getUserSuggestions');
  const exploreUsersByCategory = httpsCallable(functions, 'exploreUsersByCategory');

  // Buscar usuários por nome
  const searchByName = useCallback(async (query: string, startAfter?: any) => {
    if (!query || query.trim().length < 2) return;

    try {
      setLoading(true);
      const result = await searchUsers({
        query: query.trim(),
        limit: 20,
        startAfter
      });

      const data = result.data;
      setUsers(startAfter ? [...users, ...data.users] : data.users);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  }, [users]);

  // Encontrar usuários próximos
  const findNearby = useCallback(async (radius = 50) => {
    try {
      setLoading(true);
      const result = await findNearbyUsers({
        radius,
        limit: 20
      });

      setUsers(result.data.users);
      setHasMore(false);
    } catch (error) {
      console.error('Erro ao buscar usuários próximos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter sugestões personalizadas
  const getSuggestions = useCallback(async (limit = 15) => {
    try {
      setLoading(true);
      const result = await getUserSuggestions({ limit });

      setSuggestions(result.data.suggestions);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Explorar por categoria
  const exploreByCategory = useCallback(async (filters: DiscoveryFilters) => {
    try {
      setLoading(true);
      const result = await exploreUsersByCategory({
        category: filters.category,
        limit: filters.limit || 20,
        orderBy: filters.orderBy || 'activity'
      });

      setUsers(result.data.users);
      setHasMore(false);
    } catch (error) {
      console.error('Erro ao explorar categoria:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setUsers([]);
    setSuggestions([]);
    setHasMore(false);
  }, []);

  return {
    users,
    suggestions,
    loading,
    hasMore,
    searchByName,
    findNearby,
    getSuggestions,
    exploreByCategory,
    clearResults
  };
};
```

### Componente de Descoberta de Usuários

```typescript
// components/UserDiscovery.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useUserDiscovery } from '../hooks/useUserDiscovery';
import { UserCard } from './UserCard';

const CATEGORIES = [
  'Gastronomia', 'Turismo', 'Cultura', 'Esportes', 
  'Música', 'Arte', 'Tecnologia', 'Natureza'
];

export const UserDiscovery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'nearby' | 'suggestions' | 'explore'>('suggestions');

  const {
    users,
    suggestions,
    loading,
    hasMore,
    searchByName,
    findNearby,
    getSuggestions,
    exploreByCategory,
    clearResults
  } = useUserDiscovery();

  useEffect(() => {
    // Carregar sugestões por padrão
    getSuggestions();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      clearResults();
      searchByName(searchQuery);
      setActiveTab('search');
    }
  };

  const handleNearby = () => {
    clearResults();
    findNearby(50); // 50km de raio
    setActiveTab('nearby');
  };

  const handleCategoryExplore = (category: string) => {
    setSelectedCategory(category);
    clearResults();
    exploreByCategory({ category, orderBy: 'activity' });
    setActiveTab('explore');
  };

  const renderUser = ({ item }) => (
    <UserCard user={item} showDistance={activeTab === 'nearby'} />
  );

  const renderSuggestion = ({ item }) => (
    <UserCard 
      user={item} 
      showRelevanceScore={true}
      showReasons={true}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header com Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suggestions' && styles.activeTab]}
          onPress={() => {
            setActiveTab('suggestions');
            getSuggestions();
          }}
        >
          <Text style={styles.tabText}>Para Você</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={styles.tabText}>Buscar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
          onPress={handleNearby}
        >
          <Text style={styles.tabText}>Próximos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'explore' && styles.activeTab]}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={styles.tabText}>Explorar</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      {activeTab === 'search' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar usuários..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Categories for Explore */}
      {activeTab === 'explore' && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Explorar Interesses:</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.selectedCategory
                ]}
                onPress={() => handleCategoryExplore(category)}
              >
                <Text style={styles.categoryText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={activeTab === 'suggestions' ? suggestions : users}
        renderItem={activeTab === 'suggestions' ? renderSuggestion : renderUser}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={() => {
          if (activeTab === 'suggestions') {
            getSuggestions();
          }
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'suggestions' 
                  ? 'Nenhuma sugestão disponível'
                  : 'Nenhum usuário encontrado'
                }
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600'
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white'
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchButtonText: {
    fontSize: 16
  },
  categoriesContainer: {
    padding: 16,
    backgroundColor: 'white'
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8
  },
  selectedCategory: {
    backgroundColor: '#007AFF'
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500'
  },
  listContainer: {
    padding: 16
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  }
});
```

### Componente de Botão Follow

```typescript
// hooks/useFollow.ts
import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  loading: boolean;
}

export const useFollow = (targetUserId: string) => {
  const [status, setStatus] = useState<FollowStatus>({
    isFollowing: false,
    isFollowedBy: false,
    isMutual: false,
    loading: true
  });

  const followUser = httpsCallable(functions, 'followUser');
  const unfollowUser = httpsCallable(functions, 'unfollowUser');
  const checkFollowStatus = httpsCallable(functions, 'checkFollowStatus');

  // Verificar status inicial
  useEffect(() => {
    if (targetUserId) {
      checkStatus();
    }
  }, [targetUserId]);

  const checkStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      const result = await checkFollowStatus({ targetUserId });
      const data = result.data;
      
      setStatus({
        isFollowing: data.isFollowing,
        isFollowedBy: data.isFollowedBy,
        isMutual: data.isMutual,
        loading: false
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFollow = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      if (status.isFollowing) {
        // Deixar de seguir
        await unfollowUser({ userToUnfollowId: targetUserId });
        setStatus(prev => ({
          ...prev,
          isFollowing: false,
          isMutual: false,
          loading: false
        }));
      } else {
        // Seguir
        await followUser({ userToFollowId: targetUserId });
        setStatus(prev => ({
          ...prev,
          isFollowing: true,
          isMutual: prev.isFollowedBy,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Erro ao seguir/deixar de seguir:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    ...status,
    handleFollow,
    refreshStatus: checkStatus
  };
};
```

### Componente de Botão Follow

```typescript
// components/FollowButton.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFollow } from '../hooks/useFollow';

interface Props {
  targetUserId: string;
  targetUserName: string;
}

export const FollowButton: React.FC<Props> = ({ targetUserId, targetUserName }) => {
  const { isFollowing, isMutual, loading, handleFollow } = useFollow(targetUserId);

  const getButtonText = () => {
    if (isMutual) return 'Seguindo mutuamente';
    if (isFollowing) return 'Seguindo';
    return 'Seguir';
  };

  const getButtonStyle = () => {
    if (isFollowing) {
      return [styles.button, styles.followingButton];
    }
    return [styles.button, styles.followButton];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleFollow}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          <Text style={styles.buttonText}>
            {getButtonText()}
          </Text>
          {isMutual && <Text style={styles.mutualIcon}>🤝</Text>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100
  },
  followButton: {
    backgroundColor: '#007AFF'
  },
  followingButton: {
    backgroundColor: '#34C759'
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  },
  mutualIcon: {
    marginLeft: 4,
    fontSize: 12
  }
});
```

## 🔄 Fluxo de Funcionamento

### **Seguir Usuário Público:**
```
1. Cliente chama followUser({ userToFollowId })
2. Verifica se usuário existe e está ativo
3. Verifica se perfil é público
4. Cria documento na collection 'follows'
5. Atualiza contadores nos perfis
6. Cria atividade 'user_followed' para o feed
7. Dá 5 créditos de IA para quem seguiu
8. Retorna sucesso
```

### **Seguir Usuário Privado:**
```
1. Cliente chama followUser({ userToFollowId })
2. Verifica se usuário existe e está ativo
3. Detecta que perfil é privado
4. Cria solicitação de amizade
5. Envia notificação para o usuário privado
6. Retorna "solicitação enviada"
```

### **Deixar de Seguir:**
```
1. Cliente chama unfollowUser({ userToUnfollowId })
2. Verifica se está seguindo o usuário
3. Remove documento da collection 'follows'
4. Atualiza contadores nos perfis (decrementa)
5. Retorna sucesso
```

## 📊 Estrutura de Dados

### Collection `follows`
```javascript
// Documento: followerId_followingId
{
  followerId: "user123",    // Quem segue
  followingId: "user456",   // Quem é seguido
  status: "active",         // "active" | "pending" | "blocked"
  createdAt: Timestamp
}
```

### Collection `profiles` - Contadores
```javascript
{
  followersCount: 150,      // Quantos seguem este usuário
  followingCount: 89,       // Quantos este usuário segue
  // ... outros campos
}
```

### Collection `activities` - Feed
```javascript
{
  userId: "user123",
  type: "user_followed",
  data: {
    followedUserId: "user456",
    followedUserName: "Maria Silva"
  },
  isPublic: true,
  createdAt: Timestamp
}
```

## ⚡ Rate Limiting

### **Funções de Relacionamento:**
- **`followUser`**: 50 requests/hora por usuário
- **`unfollowUser`**: 30 requests/hora por usuário
- **`checkFollowStatus`**: 100 requests/hora por usuário

### **Funções de Descoberta:**
- **`searchUsers`**: 50 requests/hora por usuário
- **`findNearbyUsers`**: 30 requests/hora por usuário
- **`getUserSuggestions`**: 20 requests/hora por usuário
- **`exploreUsersByCategory`**: 40 requests/hora por usuário

## 🎯 Recursos Implementados

### **Sistema de Relacionamentos:**
✅ **Seguir usuários públicos**  
✅ **Solicitações para perfis privados**  
✅ **Deixar de seguir**  
✅ **Verificar status de relacionamento**  
✅ **Contadores automáticos**  
✅ **Atividades para o feed**  
✅ **Follow mútuo detection**  
✅ **Créditos de IA como recompensa**

### **Sistema de Descoberta:**
✅ **Busca por nome (case-insensitive)**  
✅ **Busca geográfica com raio configurável**  
✅ **Sugestões inteligentes baseadas em:**
  - Amigos mútuos (seguidos dos seguidos)
  - Interesses similares
  - Atividade local
✅ **Exploração por categorias/interesses**  
✅ **Ordenação por atividade, seguidores ou recência**  
✅ **Filtros automáticos (excluir já seguidos)**  
✅ **Score de relevância para sugestões**  
✅ **Detecção de interesses mútuos**  
✅ **Rate limiting avançado**  

## 🔮 Próximas Melhorias

### **Sistema de Relacionamentos:**
- [ ] **Bloquear usuários**
- [ ] **Aceitar/rejeitar solicitações de amizade**
- [ ] **Lista de seguidores/seguindo**
- [ ] **Notificações de novos seguidores**

### **Sistema de Descoberta:**
- [ ] **Busca por hashtags/tags**
- [ ] **Filtros avançados (idade, tipo de conta, etc.)**
- [ ] **Sugestões baseadas em histórico de lugares visitados**
- [ ] **Ranking de usuários mais ativos por região**
- [ ] **Descoberta por QR Code**
- [ ] **Import de contatos do telefone**
- [ ] **Cache inteligente para sugestões**

## 🧠 Algoritmos de Sugestão

### **Score de Relevância (getUserSuggestions)**

O sistema combina múltiplos fatores para calcular a relevância de cada usuário:

1. **Amigos Mútuos** (Score: 8)
   - Usuários seguidos por pessoas que você segue
   - Indica confiabilidade social

2. **Interesses Similares** (Score: 2-10)
   - Baseado em categorias de preferências
   - Score aumenta com mais interesses em comum

3. **Atividade Local** (Score: 6-9)
   - Usuários da mesma cidade com atividade recente
   - Score aumenta com mais atividade

### **Score de Atividade do Usuário**

Calculado usando pesos específicos:
- **Reviews**: peso 3 (mais importante)
- **Listas criadas**: peso 2
- **Lugares adicionados**: peso 1
- **Seguidores**: peso 0.1

### **Filtros Automáticos**

- Excluir usuários já seguidos
- Apenas perfis públicos e ativos
- Usuários validados
- Remover duplicatas automáticas

### **Otimizações de Performance**

- Limite máximo por consulta para evitar timeout
- Busca paralela de dados relacionados
- Cache de resultados de distância geográfica
- Rate limiting para prevenir abuso
