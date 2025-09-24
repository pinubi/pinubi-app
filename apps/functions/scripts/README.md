# Sistema de Testes - Pinubi Functions

Este diretório contém um sistema completo de testes e validação para o projeto Pinubi Functions.

## 📋 Scripts Disponíveis

### 1. Seed Data

```bash
npm run seed
# ou
node ./scripts/emulator-seed-data.js
```

Cria dados de teste seguindo exatamente o Database Schema.

### 2. Seed Data - Reviews

```bash
node ./scripts/seed-review-data.js
```

Cria dados específicos para o sistema de reviews:

- 4 usuários reviewers
- 4 lugares com diferentes categorias
- 12 reviews com diferentes tipos e notas
- Interações usuário-lugar
- Atividades de exemplo

### 3. Teste de Signup e Triggers

```bash
npm run test:signup
# ou
node ./scripts/test-user-signup.js
```

**NOVO!** Testa especificamente o fluxo de criação de usuário com email/senha e verifica todos os triggers:

- ✅ Criação de usuário com `createUserWithEmailAndPassword`
- ✅ Trigger `onUserCreate` - estrutura inicial do usuário
- ✅ Estado de onboarding correto após criação
- ✅ Validação de convite e ativação do usuário
- ✅ Trigger `onUserUpdate` - ativação e mudanças de estado
- ✅ Criação automática de perfil e settings após ativação
- ✅ Estrutura completa seguindo o Database Schema
- ✅ Testes de funções de usuário (getUserData, updateUserProfile, getUserLocation)
- ✅ Limpeza automática de dados de teste

### 4. Validação do Seed

```bash
npm run validate:seed
# ou
node ./scripts/validate-seed-data.js
```

Valida se os dados de seed estão corretos e completos.

### 5. Testes de Usuário Completos

```bash
npm run test:user-complete
# ou
node ./scripts/test-user-complete.js
```

Testa todos os casos de uso relacionados a usuários:

- Admin premium ativo
- Usuário free ativo
- Usuário inativo aguardando validação
- Sistema de convites
- Processo de ativação
- Controle de acesso

### 5. Testes de Places e Map

```bash
npm run test:places-map
# ou
node ./scripts/test-places-map.js
```

### 6. Testes do Sistema de Reviews

```bash
node ./scripts/test-review-system.js
```

Testa todas as funcionalidades estruturais do sistema de reviews:

- Criação de reviews
- Múltiplas reviews por lugar
- Cálculo de médias por categoria
- Interações usuário-lugar
- Validação de duplicatas
- Sistema de likes
- Queries de busca

### 7. Testes de Integração - Reviews

```bash
node ./scripts/test-review-integration.js
```

Testa a integração completa via Cloud Functions:

- createReview via HTTP
- updateReview via HTTP
- deleteReview via HTTP
- getPlaceReviews via HTTP
- getUserReviews via HTTP
- toggleReviewLike via HTTP
- Rate limiting
- Triggers automáticos

### 8. Teste Completo - Reviews

```bash
./scripts/test-review-complete.sh
```

Script bash que executa todo o pipeline de testes de reviews:

- Verificação de emulators
- Limpeza de dados antigos
- Seed de dados base
- Testes estruturais
- Testes de integração
- Validação final
- Relatório de cobertura

**Requer emulators rodando:**

```bash
firebase emulators:start
```

Testa funcionalidades de lugares e mapas:

- Estrutura dos places
- GeoFirestore
- Busca por proximidade
- Categorização
- Performance de consultas geográficas

### 5. Executar Todos os Testes

```bash
npm run test:all
# ou
node ./scripts/run-all-tests.js
```

Executa todos os testes em sequência com relatório consolidado.

### 6. Teste de Usuários (Legacy)

```bash
npm run test:users
# ou
node ./scripts/emulator-test-user.js
```

Script de teste de usuário original (mantido para compatibilidade).

## 🔧 Pré-requisitos

### 1. Emuladores Firebase

Certifique-se de que os emuladores estão rodando:

```bash
firebase emulators:start --project=demo-pinubi-functions
```

### 2. Dependências

Instale as dependências necessárias:

```bash
npm install
# ou
bun install
```

## 📊 Tipos de Teste

### ✅ Validações de Seed

- Usuários no Authentication
- Estrutura dos usuários no Firestore
- Coleções criadas (lists, places, activities, etc.)
- Estados de validação/ativação
- Relacionamentos sociais
- Geolocalização
- Métricas e contadores

### 👤 Testes de Usuário

- Usuário premium (admin)
- Usuário free ativo
- Usuário inativo
- Criação de novos usuários
- Sistema de convites
- Ativação de usuários
- Controle de acesso
- Relacionamentos sociais
- Sistema de créditos IA
- Métricas de usuário

### 📍 Testes de Places

- Estrutura básica dos places
- GeoFirestore integration
- Busca por proximidade
- Categorização
- Busca textual
- Adição em listas
- Performance de consultas
- Estrutura do Google Places
- Validação de coordenadas
- Cenários de uso real

## 🎯 Dados de Teste

### Usuários Criados

1. **Admin** (test-admin)

   - Email: admin@test.com
   - Senha: admin123
   - Tipo: Premium, Ativo, Validado
   - Créditos IA: 100
   - Convites: 100

2. **User1** (test-user-1)

   - Email: user1@test.com
   - Senha: password123
   - Tipo: Free, Ativo, Validado
   - Créditos IA: 5
   - Convites: 5

3. **User2** (test-user-2)
   - Email: user2@test.com
   - Senha: password123
   - Tipo: Free, INATIVO, NÃO Validado
   - Créditos IA: 0
   - Convites: 0

### Collections Criadas

- `users` - Dados completos conforme schema
- `profiles` - Apenas usuários validados
- `user-settings` - Apenas usuários validados
- `lists` - Listas automáticas para usuários ativos
- `places` - Places normais e com geolocalização
- `follows` - Relacionamentos sociais
- `activities` - Atividades do sistema
- `notifications` - Notificações de exemplo

## 📈 Interpretando Resultados

### ✅ Sucesso

- Código de saída: 0
- Todos os testes/validações passaram
- Sistema funcionando corretamente

### ❌ Falha

- Código de saída: 1
- Alguns testes falharam
- Verifique os erros reportados

### 📊 Relatórios

Cada script gera:

- Número total de testes
- Testes que passaram/falharam
- Taxa de sucesso
- Lista detalhada de erros (se houver)

## 🔍 Debugging

### Executar Script Individual

```bash
node ./scripts/validate-seed-data.js
node ./scripts/test-user-complete.js
node ./scripts/test-places-map.js
```

### Verificar Emuladores

```bash
# Firestore UI
http://localhost:4000

# Verificar se estão rodando
curl http://localhost:8080  # Firestore
curl http://localhost:9099  # Auth
```

### Logs Detalhados

Todos os scripts mostram logs detalhados em tempo real, incluindo:

- Cada teste executado
- Valores esperados vs encontrados
- Erros específicos com contexto

## 🚀 Workflow Recomendado

1. **Start emulators**:

   ```bash
   firebase emulators:start --project=demo-pinubi-functions
   ```

2. **Run seed**:

   ```bash
   npm run seed
   ```

3. **Validate seed**:

   ```bash
   npm run validate:seed
   ```

4. **Run all tests**:

   ```bash
   npm run test:all
   ```

5. **Check results** e fix any issues

6. **Repeat** as needed

## 🎛️ Configuração Avançada

### Timeouts

Scripts têm timeout de 2 minutos. Ajuste em `run-all-tests.js` se necessário.

### Portas dos Emuladores

- Firestore: 8080
- Auth: 9099
- Functions: 5001
- UI: 4000

### Project ID

Todos os testes usam `demo-pinubi-functions` para emuladores.

## 🤝 Contribuindo

Para adicionar novos testes:

1. Crie novo script em `scripts/`
2. Adicione ao `package.json`
3. Inclua no `run-all-tests.js`
4. Documente no README

### Template de Teste

```javascript
let testResults = { total: 0, passed: 0, failed: 0, errors: [] };

function test(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    console.log(`✅ ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${message}`);
    testResults.errors.push(message);
  }
}

// Usar test() para cada verificação
// Gerar relatório final
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique se emuladores estão rodando
2. Confirme que seed foi executado
3. Execute scripts individuais para isolar problemas
4. Verifique logs detalhados

---

**🎉 Sistema de testes completo e robusto para garantir qualidade do Pinubi Functions!**
