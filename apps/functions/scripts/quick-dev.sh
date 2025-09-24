#!/bin/bash

# 🚀 Quick Dev Tools - Comandos rápidos para desenvolvimento
# Uso: ./quick-dev.sh [comando]
#
# Comandos disponíveis:
#   start    - Iniciar emuladores
#   seed     - Popular dados iniciais  
#   test     - Testar fluxo
#   reset    - Limpar banco
#   status   - Verificar status
#   ui       - Abrir Emulator UI
#   build    - Compilar TypeScript

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="demo-pinubi-functions"

# Verificar se os emulators estão rodando
check_emulators() {
    curl -s http://localhost:4000 > /dev/null 2>&1
}

# Mostrar ajuda se nenhum parâmetro for passado
if [ $# -eq 0 ]; then
    echo -e "${BLUE}🚀 Quick Dev Tools - Pinubi Functions${NC}"
    echo ""
    echo -e "${YELLOW}Uso:${NC} ./quick-dev.sh [comando]"
    echo ""
    echo -e "${GREEN}Comandos disponíveis:${NC}"
    echo "  start    🚀 Iniciar emuladores"
    echo "  seed     🌱 Popular dados iniciais"
    echo "  test     🧪 Testar fluxo completo"
    echo "  reset    🧹 Limpar banco de dados"
    echo "  status   📊 Verificar status"
    echo "  ui       🌐 Abrir Emulator UI"
    echo "  build    📦 Compilar TypeScript"
    echo ""
    echo -e "${YELLOW}Exemplo:${NC} ./quick-dev.sh start"
    exit 0
fi

case "$1" in
    "start")
        echo -e "${BLUE}🚀 Iniciando emuladores...${NC}"
        if check_emulators; then
            echo -e "${YELLOW}⚠️  Emuladores já estão rodando!${NC}"
            exit 0
        fi
        export GCLOUD_PROJECT=$PROJECT_ID
        bun run tsc && firebase emulators:start --project=$PROJECT_ID
        ;;
        
    "seed")
        echo -e "${BLUE}🌱 Populando dados iniciais...${NC}"
        if ! check_emulators; then
            echo -e "${RED}❌ Emuladores não estão rodando! Execute: ./quick-dev.sh start${NC}"
            exit 1
        fi
        node scripts/emulator-seed-data.js
        ;;
        
    "test")
        echo -e "${BLUE}🧪 Testando fluxo completo...${NC}"
        if ! check_emulators; then
            echo -e "${RED}❌ Emuladores não estão rodando! Execute: ./quick-dev.sh start${NC}"
            exit 1
        fi
        
        # Limpar dados antes do teste
        echo -e "${YELLOW}🧹 Limpando dados do emulador antes do teste...${NC}"
        curl -X DELETE "http://localhost:8080/emulator/v1/projects/$PROJECT_ID/databases/(default)/documents" 2>/dev/null
        curl -X DELETE "http://localhost:9099/emulator/v1/projects/$PROJECT_ID/accounts" 2>/dev/null
        echo -e "${GREEN}✅ Dados limpos! Iniciando teste...${NC}"
        
        node scripts/emulator-test-user.js
        ;;
        
    "reset")
        echo -e "${BLUE}🧹 Limpando banco de dados...${NC}"
        if ! check_emulators; then
            echo -e "${RED}❌ Emuladores não estão rodando!${NC}"
            exit 1
        fi
        echo -e "${YELLOW}⚠️  Isso irá apagar todos os dados!${NC}"
        read -p "Confirma? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            curl -X DELETE "http://localhost:8080/emulator/v1/projects/$PROJECT_ID/databases/(default)/documents" 2>/dev/null
            curl -X DELETE "http://localhost:9099/emulator/v1/projects/$PROJECT_ID/accounts" 2>/dev/null
            echo -e "${GREEN}✅ Banco limpo!${NC}"
        fi
        ;;
        
    "status")
        echo -e "${BLUE}📊 Verificando status...${NC}"
        if check_emulators; then
            echo -e "${GREEN}✅ Emuladores rodando${NC}"
            echo "🌐 UI: http://localhost:4000"
        else
            echo -e "${RED}❌ Emuladores parados${NC}"
        fi
        ;;
        
    "ui")
        if check_emulators; then
            echo -e "${BLUE}🌐 Abrindo Emulator UI...${NC}"
            open http://localhost:4000 2>/dev/null || echo "🌐 Acesse: http://localhost:4000"
        else
            echo -e "${RED}❌ Emuladores não estão rodando!${NC}"
        fi
        ;;
        
    "build")
        echo -e "${BLUE}📦 Compilando TypeScript...${NC}"
        bun run tsc
        ;;
        
    *)
        echo -e "${RED}❌ Comando inválido: $1${NC}"
        echo -e "${YELLOW}💡 Use: ./quick-dev.sh (sem parâmetros) para ver a ajuda${NC}"
        exit 1
        ;;
esac
