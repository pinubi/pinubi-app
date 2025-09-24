#!/bin/bash

# Script para rodar emuladores em modo development
# Usa projeto demo para evitar warnings

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Iniciando Firebase Emulators em modo desenvolvimento...${NC}"

# Função para liberar uma porta específica
kill_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [[ -n "$pid" ]]; then
        echo -e "${YELLOW}🔄 Liberando $service_name (porta $port, PID: $pid)...${NC}"
        kill -9 $pid
    else
        echo -e "${GREEN}✅ $service_name (porta $port) já está livre${NC}"
    fi
}

# Liberar portas dos emuladores antes de iniciar
echo -e "${BLUE}🧹 Liberando portas dos emuladores...${NC}"
kill_port 9099 "Auth Emulator"
kill_port 5001 "Functions Emulator" 
kill_port 8080 "Firestore Emulator"
kill_port 9199 "Storage Emulator"
kill_port 8085 "Pub/Sub Emulator"
kill_port 4000 "Emulator UI"
echo ""

# Definir projeto demo
export GCLOUD_PROJECT=demo-pinubi-functions

# Compilar TypeScript
echo -e "${BLUE}📦 Compilando TypeScript...${NC}"
bun run tsc

# Iniciar emuladores com projeto demo
echo -e "${BLUE}🚀 Iniciando emuladores...${NC}"
firebase emulators:start --project=demo-pinubi-functions
