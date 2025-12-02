#!/bin/bash

# ============================================================================
# Script de Build et Déploiement - NocoDB Version Modifiée
# ============================================================================
# Ce script automatise le build et le déploiement de votre version modifiée
# de NocoDB avec toutes les fonctionnalités Enterprise débloquées
#
# Usage:
#   ./build-and-deploy.sh [options]
#
# Options:
#   --build-only     Seulement builder l'image, sans déployer
#   --deploy-only    Seulement déployer (image doit exister)
#   --no-cache       Build sans cache Docker
#   --stop-existing  Arrêter le container existant avant déploiement
#   --help           Afficher cette aide
# ============================================================================

set -e  # Exit on error

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="nocodb-unlocked"
IMAGE_TAG="latest"
CONTAINER_NAME="nocodb-unlocked"
OLD_CONTAINER_NAME="nocodb-postgres"
DOCKER_FILE="Dockerfile.custom"
COMPOSE_FILE="docker-compose.custom.yml"

# Flags
BUILD_ONLY=false
DEPLOY_ONLY=false
NO_CACHE=false
STOP_EXISTING=false

# ============================================================================
# Fonctions
# ============================================================================

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_help() {
    cat << EOF
Usage: ./build-and-deploy.sh [options]

Options:
  --build-only      Seulement builder l'image Docker, sans déployer
  --deploy-only     Seulement déployer (l'image doit déjà exister)
  --no-cache        Build sans utiliser le cache Docker
  --stop-existing   Arrêter le container nocodb-postgres existant avant déploiement
  --help            Afficher cette aide

Exemples:
  ./build-and-deploy.sh                    # Build et déploie
  ./build-and-deploy.sh --build-only       # Seulement build
  ./build-and-deploy.sh --no-cache         # Build sans cache
  ./build-and-deploy.sh --stop-existing    # Arrête l'ancien container avant déploiement

EOF
    exit 0
}

check_prerequisites() {
    print_header "Vérification des prérequis"

    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    print_success "Docker trouvé: $(docker --version)"

    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose n'est pas installé"
        exit 1
    fi
    print_success "Docker Compose trouvé"

    # Vérifier que les fichiers nécessaires existent
    if [ ! -f "$DOCKER_FILE" ]; then
        print_error "Dockerfile manquant: $DOCKER_FILE"
        exit 1
    fi
    print_success "Dockerfile trouvé: $DOCKER_FILE"

    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker Compose file manquant: $COMPOSE_FILE"
        exit 1
    fi
    print_success "Docker Compose file trouvé: $COMPOSE_FILE"

    # Vérifier le fichier .env
    if [ ! -f ".env" ]; then
        print_warning "Fichier .env manquant"
        print_info "Créez-le à partir de .env.example: cp .env.example .env"
        read -p "Voulez-vous continuer avec les valeurs par défaut du docker-compose.custom.yml? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "Fichier .env trouvé"
    fi

    echo ""
}

build_image() {
    print_header "Build de l'image Docker"

    local CACHE_FLAG=""
    if [ "$NO_CACHE" = true ]; then
        CACHE_FLAG="--no-cache"
        print_info "Build sans cache activé"
    fi

    print_info "Image: $IMAGE_NAME:$IMAGE_TAG"
    print_info "Dockerfile: $DOCKER_FILE"
    echo ""

    # Build avec progress
    if docker build $CACHE_FLAG -f "$DOCKER_FILE" -t "$IMAGE_NAME:$IMAGE_TAG" .; then
        print_success "Image buildée avec succès!"

        # Afficher la taille de l'image
        IMAGE_SIZE=$(docker images "$IMAGE_NAME:$IMAGE_TAG" --format "{{.Size}}")
        print_info "Taille de l'image: $IMAGE_SIZE"
    else
        print_error "Échec du build de l'image"
        exit 1
    fi

    echo ""
}

stop_existing_container() {
    print_header "Arrêt du container existant"

    # Arrêter l'ancien container (nocodb-postgres)
    if docker ps -a --format '{{.Names}}' | grep -q "^${OLD_CONTAINER_NAME}$"; then
        print_info "Arrêt du container: $OLD_CONTAINER_NAME"
        docker stop "$OLD_CONTAINER_NAME" || true
        print_info "Suppression du container: $OLD_CONTAINER_NAME"
        docker rm "$OLD_CONTAINER_NAME" || true
        print_success "Container $OLD_CONTAINER_NAME arrêté et supprimé"
    else
        print_info "Container $OLD_CONTAINER_NAME non trouvé (déjà arrêté)"
    fi

    echo ""
}

deploy_container() {
    print_header "Déploiement du container"

    # Arrêter le nouveau container s'il existe déjà
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_info "Container $CONTAINER_NAME existe déjà, arrêt..."
        docker-compose -f "$COMPOSE_FILE" down
    fi

    # Déployer avec Docker Compose
    print_info "Démarrage du container via Docker Compose..."
    if docker-compose -f "$COMPOSE_FILE" up -d; then
        print_success "Container déployé avec succès!"

        # Attendre quelques secondes
        print_info "Attente du démarrage de l'application..."
        sleep 5

        # Vérifier le status
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            print_success "Container en cours d'exécution!"

            # Afficher les logs (dernières lignes)
            echo ""
            print_info "Derniers logs du container:"
            docker logs --tail 20 "$CONTAINER_NAME"
        else
            print_error "Le container ne s'est pas démarré correctement"
            print_info "Vérifiez les logs: docker logs $CONTAINER_NAME"
            exit 1
        fi
    else
        print_error "Échec du déploiement"
        exit 1
    fi

    echo ""
}

print_summary() {
    print_header "✨ Déploiement Terminé avec Succès!"

    echo ""
    print_success "NocoDB Version Modifiée (Fonctionnalités Débloquées) est en cours d'exécution!"
    echo ""
    print_info "📍 Accès à l'application:"
    echo "   • URL: http://localhost:8090"
    echo "   • Container: $CONTAINER_NAME"
    echo "   • Image: $IMAGE_NAME:$IMAGE_TAG"
    echo ""
    print_info "📊 Commandes utiles:"
    echo "   • Voir les logs:        docker logs -f $CONTAINER_NAME"
    echo "   • Arrêter:              docker-compose -f $COMPOSE_FILE stop"
    echo "   • Redémarrer:           docker-compose -f $COMPOSE_FILE restart"
    echo "   • Supprimer:            docker-compose -f $COMPOSE_FILE down"
    echo "   • Rebuild et redéployer: ./build-and-deploy.sh"
    echo ""
    print_info "🎯 Fonctionnalités débloquées:"
    echo "   ✅ Mode Enterprise (isEE)"
    echo "   ✅ Permissions Tables et Champs"
    echo "   ✅ Cross Base Links"
    echo "   ✅ Custom Links"
    echo "   ✅ Dark Mode"
    echo "   ✅ Workspace Image Upload"
    echo "   ✅ Workspace Audit"
    echo "   ✅ Intégrations dynamiques"
    echo "   ✅ Et bien plus... (voir UNLOCKED_FEATURES.md)"
    echo ""
    print_info "📚 Documentation:"
    echo "   • Fonctionnalités débloquées: UNLOCKED_FEATURES.md"
    echo "   • Analyse complète: BLOCKED_FEATURES_ANALYSIS.md"
    echo "   • Guide développement: CLAUDE.md"
    echo ""
}

# ============================================================================
# Parse des arguments
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --deploy-only)
            DEPLOY_ONLY=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --stop-existing)
            STOP_EXISTING=true
            shift
            ;;
        --help|-h)
            print_help
            ;;
        *)
            print_error "Option inconnue: $1"
            print_help
            ;;
    esac
done

# ============================================================================
# Exécution principale
# ============================================================================

echo ""
print_header "🚀 Build et Déploiement NocoDB Version Modifiée"
echo ""

# Vérifier les prérequis
check_prerequisites

# Build
if [ "$DEPLOY_ONLY" = false ]; then
    build_image
fi

# Deploy
if [ "$BUILD_ONLY" = false ]; then
    # Arrêter l'ancien container si demandé
    if [ "$STOP_EXISTING" = true ]; then
        stop_existing_container
    fi

    deploy_container
    print_summary
fi

# Message final pour build-only
if [ "$BUILD_ONLY" = true ]; then
    echo ""
    print_success "Image buildée! Pour déployer, lancez:"
    echo "   ./build-and-deploy.sh --deploy-only"
    echo ""
fi

exit 0
