#!/bin/bash

# ============================================================================
# NocoDB - Script de Déblocage Complet des Fonctionnalités
# ============================================================================
# Ce script débloque toutes les fonctionnalités artificiellement restreintes
# dans NocoDB Open Source
#
# Usage: ./unlock-all-features.sh
# ============================================================================

set -e  # Exit on error

echo "🚀 Déblocage de toutes les fonctionnalités NocoDB..."
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet NocoDB"
    exit 1
fi

# ============================================================================
# PARTIE 1: Backend - Activer le mode Enterprise
# ============================================================================
echo "📦 BACKEND: Activation du mode Enterprise..."

# Activer isEE dans utils/index.ts
sed -i 's/export const isEE = false/export const isEE = true/' \
  packages/nocodb/src/utils/index.ts

if grep -q "export const isEE = true" packages/nocodb/src/utils/index.ts; then
    echo "   ✅ isEE activé"
else
    echo "   ❌ Échec de l'activation de isEE"
fi

# ============================================================================
# PARTIE 2: Frontend - Débloquer useEeConfig.ts
# ============================================================================
echo ""
echo "🎨 FRONTEND: Déblocage des feature flags..."

# Débloquer workspace image upload
sed -i 's/blockWsImageLogoUpload = computed(() => true)/blockWsImageLogoUpload = computed(() => false)/' \
  packages/nc-gui/composables/useEeConfig.ts

# Activer workspace audit
sed -i 's/isWsAuditEnabled = computed(() => false)/isWsAuditEnabled = computed(() => true)/' \
  packages/nc-gui/composables/useEeConfig.ts

echo "   ✅ Workspace image upload débloqué"
echo "   ✅ Workspace audit activé"

# ============================================================================
# PARTIE 3: Beta Features - Activer les fonctionnalités
# ============================================================================
echo ""
echo "🧪 BETA FEATURES: Activation des fonctionnalités bêta..."

BETA_FILE="packages/nc-gui/composables/useBetaFeatureToggle.ts"

# Dark Mode
sed -i '/id: .dark_mode./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Dark Mode activé"

# Link to Another Record
sed -i '/id: .link_to_another_record./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Link to Another Record activé"

# Integrations
sed -i '/id: .integrations./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Integrations activées"

# Geodata Column
sed -i '/id: .geodata_column./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Geodata Column activé"

# Form Scanner
sed -i '/id: .form_support_column_scanning./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Form Scanner activé"

# Attachment Carousel Comments
sed -i '/id: .attachment_carousel_comments./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Attachment Carousel Comments activé"

# AI Beta Features (nécessite isEE)
sed -i '/id: .ai_beta_features./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ AI Beta Features activé"

# Data Reflection (nécessite isEE)
sed -i '/id: .data_reflection./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Data Reflection activé"

# Sync (nécessite isEE)
sed -i '/id: .sync./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Sync activé"

# Cross Base Link (nécessite isEE)
sed -i '/id: .cross_base_link./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Cross Base Link activé"

# Custom Link (nécessite isEE)
sed -i '/id: .custom_link./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ Custom Link activé"

# View Actions (nécessite isEE)
sed -i '/id: .view_actions./,/enabled: false/ s/enabled: false/enabled: true/' "$BETA_FILE"
echo "   ✅ View Actions activé"

# ============================================================================
# PARTIE 4: Constants - Augmenter les limites
# ============================================================================
echo ""
echo "⚙️  CONSTANTS: Augmentation des limites..."

CONSTANTS_FILE="packages/nocodb/src/constants/index.ts"

# Augmenter les limites de pièces jointes (si pas déjà modifié)
if grep -q "NC_MAX_ATTACHMENTS_ALLOWED = 10" "$CONSTANTS_FILE"; then
    sed -i 's/NC_MAX_ATTACHMENTS_ALLOWED = 10/NC_MAX_ATTACHMENTS_ALLOWED = 100/' "$CONSTANTS_FILE"
    echo "   ✅ Limite de pièces jointes augmentée: 10 → 100"
fi

# ============================================================================
# RÉSUMÉ
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ DÉBLOCAGE TERMINÉ AVEC SUCCÈS!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Fonctionnalités débloquées:"
echo "   • Mode Enterprise (isEE)"
echo "   • Upload d'images workspace"
echo "   • Audit workspace"
echo "   • Dark Mode"
echo "   • Link to Another Record"
echo "   • Integrations dynamiques"
echo "   • Colonnes Geodata"
echo "   • Scanner de formulaires"
echo "   • Commentaires sur pièces jointes"
echo "   • AI Beta Features"
echo "   • Data Reflection"
echo "   • Synchronisation"
echo "   • Cross Base Link"
echo "   • Custom Link"
echo "   • View Actions"
echo "   • Limites de pièces jointes augmentées"
echo ""
echo "⚠️  PROCHAINES ÉTAPES:"
echo "   1. Rebuilder le frontend: cd packages/nc-gui && pnpm run build"
echo "   2. Rebuilder le backend: cd packages/nocodb && pnpm run build"
echo "   3. Redémarrer l'application"
echo ""
echo "📚 Pour plus d'informations, consultez: BLOCKED_FEATURES_ANALYSIS.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
