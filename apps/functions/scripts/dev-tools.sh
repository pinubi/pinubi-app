#!/bin/bash

# 🔧 Dev Tools Interativo - Script com navegação por setas
# Versão moderna do dev-tools.sh com interface interativa

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
PROJECT_ID="demo-pinubi-functions"
EMULATOR_UI="http://localhost:4000"

# Função para verificar se fzf está instalado
check_fzf() {
    if command -v fzf &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Menu interativo com FZF (se disponível)
show_interactive_menu_fzf() {
    local options=(
        "🚀 Iniciar emuladores"
        "🌱 Seed - Popular dados iniciais"
        "🧪 Test - Testar fluxo completo"
        "🧹 Reset - Limpar banco de dados"
        "📊 Status - Verificar emuladores"
        "🌐 Abrir Emulator UI"
        "📦 Build - Compilar TypeScript"
        "📋 Logs - Ver logs em tempo real"
        "🔓 Liberar portas ocupadas"
        "❌ Sair"
    )

    echo -e "${PURPLE}"
    echo "🔧 Pinubi Functions - Dev Tools"
    echo "================================="
    echo -e "${NC}"
    echo -e "${CYAN}Use ↑↓ para navegar, Enter para selecionar, ESC para sair${NC}"
    echo ""

    local choice=$(printf '%s\n' "${options[@]}" | fzf \
        --height=15 \
        --layout=reverse \
        --border=rounded \
        --header="Escolha uma opção:" \
        --prompt="› " \
        --pointer="▶" \
        --color="header:italic:underline,label:blue" \
        --no-info)

    if [[ -z "$choice" ]]; then
        echo -e "${YELLOW}👋 Operação cancelada${NC}"
        exit 0
    fi

    echo -e "${GREEN}Selecionado: $choice${NC}"
    echo ""
    
    return $(get_option_index "$choice")
}

# Menu interativo nativo em bash (sem dependências)
show_interactive_menu_native() {
    local options=(
        "🚀 Iniciar emuladores"
        "🌱 Seed - Popular dados iniciais"
        "🧪 Test - Testar fluxo completo"
        "🧹 Reset - Limpar banco de dados"
        "📊 Status - Verificar emuladores"
        "🌐 Abrir Emulator UI"
        "📦 Build - Compilar TypeScript"
        "📋 Logs - Ver logs em tempo real"
        "🔓 Liberar portas ocupadas"
        "❌ Sair"
    )
    
    local selected=0
    local total=${#options[@]}
    
    # Salvar configurações atuais do terminal
    local old_tty_settings=$(stty -g)
    
    # Configurar terminal para entrada raw
    stty -echo -icanon time 0 min 0
    
    # Esconder cursor
    tput civis
    
    trap 'stty $old_tty_settings; tput cnorm' EXIT
    
    while true; do
        clear
        echo -e "${PURPLE}"
        echo "🔧 Pinubi Functions - Dev Tools"
        echo "================================="
        echo -e "${NC}"
        echo -e "${CYAN}Use ↑↓ (ou j/k) para navegar, Enter para selecionar, q para sair${NC}"
        echo ""
        
        # Mostrar opções
        for i in "${!options[@]}"; do
            if [[ $i -eq $selected ]]; then
                echo -e "${GREEN}▶ ${options[i]}${NC}"
            else
                echo -e "  ${options[i]}"
            fi
        done
        
        # Ler entrada do usuário
        local key=""
        read -rsn1 key 2>/dev/null || continue
        
        case "$key" in
            $'\x1b')  # ESC sequence
                local key2=""
                read -rsn1 key2 2>/dev/null
                if [[ "$key2" == "[" ]]; then
                    local key3=""
                    read -rsn1 key3 2>/dev/null
                    case "$key3" in
                        'A') # Seta para cima
                            ((selected--))
                            if [[ $selected -lt 0 ]]; then
                                selected=$((total - 1))
                            fi
                            ;;
                        'B') # Seta para baixo
                            ((selected++))
                            if [[ $selected -ge $total ]]; then
                                selected=0
                            fi
                            ;;
                    esac
                elif [[ -z "$key2" ]]; then
                    # ESC pressionado sozinho - sair
                    selected=9
                    break
                fi
                ;;
            '') # Enter (caractere vazio quando lido com read -rsn1)
                break
                ;;
            $'\n'|$'\r') # Enter alternativo
                break
                ;;
            'q'|'Q') # Quit
                selected=9
                break
                ;;
            'k'|'K') # Vim-style up
                ((selected--))
                if [[ $selected -lt 0 ]]; then
                    selected=$((total - 1))
                fi
                ;;
            'j'|'J') # Vim-style down
                ((selected++))
                if [[ $selected -ge $total ]]; then
                    selected=0
                fi
                ;;
        esac
    done
    
    # Restaurar configurações do terminal
    stty $old_tty_settings
    # Mostrar cursor novamente
    tput cnorm
    
    echo -e "\n${GREEN}Selecionado: ${options[selected]}${NC}\n"
    
    return $selected
}

# Função para obter o índice da opção selecionada
get_option_index() {
    local choice="$1"
    case "$choice" in
        *"Iniciar emuladores"*) return 0 ;;
        *"Seed"*) return 1 ;;
        *"Test"*) return 2 ;;
        *"Reset"*) return 3 ;;
        *"Status"*) return 4 ;;
        *"Abrir Emulator"*) return 5 ;;
        *"Build"*) return 6 ;;
        *"Logs"*) return 7 ;;
        *"Liberar portas"*) return 8 ;;
        *"Sair"*) return 9 ;;
        *) return 9 ;;
    esac
}

# Função para verificar se os emuladores estão rodando
check_emulators() {
    if curl -s http://localhost:4000 > /dev/null 2>&1; then
        return 0  # Emulators running
    else
        return 1  # Emulators not running
    fi
}

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

# Função para liberar todas as portas dos emuladores
free_emulator_ports() {
    echo -e "${BLUE}🧹 Liberando portas dos emuladores...${NC}"
    echo ""
    
    # Portas dos emuladores conforme firebase.json
    kill_port 9099 "Auth Emulator"
    kill_port 5001 "Functions Emulator" 
    kill_port 8080 "Firestore Emulator"
    kill_port 9199 "Storage Emulator"
    kill_port 8085 "Pub/Sub Emulator"
    kill_port 4000 "Emulator UI"
    
    echo ""
    echo -e "${GREEN}✅ Verificação de portas concluída!${NC}"
}

# Função para iniciar emuladores
start_emulators() {
    echo -e "${BLUE}🚀 Iniciando emuladores...${NC}"
    
    # Verificar se já estão rodando
    if check_emulators; then
        echo -e "${YELLOW}⚠️  Emuladores já estão rodando!${NC}"
        echo -e "${BLUE}🌐 Emulator UI: ${EMULATOR_UI}${NC}"
        return
    fi
    
    # Liberar portas que possam estar ocupadas
    free_emulator_ports
    
    # Compilar TypeScript primeiro
    echo -e "${BLUE}📦 Compilando TypeScript...${NC}"
    bun run tsc
    
    # Definir projeto demo
    export GCLOUD_PROJECT=$PROJECT_ID
    
    echo -e "${BLUE}🚀 Iniciando Firebase Emulators...${NC}"
    echo -e "${YELLOW}💡 Para parar os emuladores, use Ctrl+C${NC}"
    echo ""
    
    # Iniciar em background para permitir outras operações
    firebase emulators:start --project=$PROJECT_ID
}

# Função para popular dados iniciais
seed_data() {
    echo -e "${BLUE}🌱 Populando dados iniciais...${NC}"
    
    # Verificar se emuladores estão rodando
    if ! check_emulators; then
        echo -e "${RED}❌ Emuladores não estão rodando!${NC}"
        echo -e "${YELLOW}💡 Execute a opção 'Iniciar emuladores' primeiro${NC}"
        return
    fi
    
    # Executar seed
    echo -e "${BLUE}📊 Criando usuários e dados de teste...${NC}"
    node scripts/emulator-seed-data.js
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dados iniciais criados com sucesso!${NC}"
        echo -e "${BLUE}🌐 Verifique no Emulator UI: ${EMULATOR_UI}${NC}"
    else
        echo -e "${RED}❌ Erro ao criar dados iniciais${NC}"
    fi
}

# Função para testar fluxo
test_flow() {
    echo -e "${BLUE}🧪 Testando fluxo completo...${NC}"
    
    # Verificar se emuladores estão rodando
    if ! check_emulators; then
        echo -e "${RED}❌ Emuladores não estão rodando!${NC}"
        echo -e "${YELLOW}💡 Execute a opção 'Iniciar emuladores' primeiro${NC}"
        return
    fi
    
    # Executar testes
    echo -e "${BLUE}🔄 Executando testes de usuário...${NC}"
    node scripts/test-user-complete.js
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Testes executados com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro nos testes${NC}"
    fi
}

# Função para limpar banco
reset_database() {
    echo -e "${BLUE}🧹 Limpando banco de dados...${NC}"
    
    # Verificar se emuladores estão rodando
    if ! check_emulators; then
        echo -e "${RED}❌ Emuladores não estão rodando!${NC}"
        echo -e "${YELLOW}💡 Execute a opção 'Iniciar emuladores' primeiro${NC}"
        return
    fi
    
    echo -e "${YELLOW}⚠️  Isso irá apagar todos os dados do emulador!${NC}"
    read -p "Tem certeza? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        # Usar curl para fazer reset via API do emulador
        echo -e "${BLUE}🔄 Resetando Firestore...${NC}"
        curl -X DELETE "http://localhost:8080/emulator/v1/projects/$PROJECT_ID/databases/(default)/documents"
        
        echo -e "${BLUE}🔄 Resetando Auth...${NC}"
        curl -X DELETE "http://localhost:9099/emulator/v1/projects/$PROJECT_ID/accounts"
        
        echo -e "${GREEN}✅ Banco de dados limpo!${NC}"
        echo -e "${YELLOW}💡 Use a opção 'Seed' para popular dados novamente${NC}"
    else
        echo -e "${YELLOW}❌ Operação cancelada${NC}"
    fi
}

# Função para verificar status
check_status() {
    echo -e "${BLUE}📊 Verificando status dos emuladores...${NC}"
    echo ""
    
    if check_emulators; then
        echo -e "${GREEN}✅ Emuladores estão rodando!${NC}"
        echo ""
        echo -e "${BLUE}🌐 URLs disponíveis:${NC}"
        echo -e "   • Emulator UI: ${EMULATOR_UI}"
        echo -e "   • Functions: http://localhost:5001"
        echo -e "   • Firestore: http://localhost:8080"
        echo -e "   • Auth: http://localhost:9099"
        echo -e "   • Storage: http://localhost:9199"
    else
        echo -e "${RED}❌ Emuladores não estão rodando${NC}"
        echo -e "${YELLOW}💡 Use a opção 'Iniciar emuladores' para iniciá-los${NC}"
    fi
}

# Função para abrir Emulator UI
open_ui() {
    echo -e "${BLUE}🌐 Abrindo Emulator UI...${NC}"
    
    if check_emulators; then
        open $EMULATOR_UI 2>/dev/null || echo -e "${BLUE}🌐 Acesse: ${EMULATOR_UI}${NC}"
    else
        echo -e "${RED}❌ Emuladores não estão rodando!${NC}"
        echo -e "${YELLOW}💡 Execute a opção 'Iniciar emuladores' primeiro${NC}"
    fi
}

# Função para compilar TypeScript
build_project() {
    echo -e "${BLUE}📦 Compilando TypeScript...${NC}"
    bun run tsc
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro no build${NC}"
    fi
}

# Função para mostrar logs
show_logs() {
    echo -e "${BLUE}📋 Mostrando logs dos emuladores...${NC}"
    echo -e "${YELLOW}💡 Pressione Ctrl+C para sair dos logs${NC}"
    echo ""
    
    # Mostrar logs do Firebase (se estiver rodando)
    tail -f firebase-debug.log 2>/dev/null || echo -e "${YELLOW}⚠️  Logs não encontrados. Certifique-se que os emuladores estão rodando.${NC}"
}

# Função principal
main() {
    while true; do
        # Verificar se fzf está disponível e prefere usar
        if check_fzf; then
            show_interactive_menu_fzf
            local choice=$?
        else
            echo -e "${YELLOW}💡 Para uma experiência melhor, instale fzf: brew install fzf${NC}"
            echo ""
            show_interactive_menu_native
            local choice=$?
        fi
        
        case $choice in
            0) start_emulators ;;
            1) seed_data ;;
            2) test_flow ;;
            3) reset_database ;;
            4) check_status ;;
            5) open_ui ;;
            6) build_project ;;
            7) show_logs ;;
            8) free_emulator_ports ;;
            9) 
                echo -e "${GREEN}👋 Até mais!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Opção inválida!${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${CYAN}Pressione Enter para continuar...${NC}"
        read -n 1
    done
}

# Verificar se está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
