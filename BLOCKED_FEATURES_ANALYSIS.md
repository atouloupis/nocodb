# Analyse Complète des Fonctionnalités Bloquées dans NocoDB

**Date**: 2025-12-01
**Version analysée**: NocoDB v0.265.1

Ce document identifie toutes les fonctionnalités artificiellement désactivées dans la version Open Source de NocoDB pour pousser vers une version Enterprise payante.

---

## 🔒 STATUT ACTUEL

### ✅ Déjà Débloquées (Commit cb8b5fa)
- Table and Field Permissions
- Row Coloring
- Private Bases
- Dashboards supplémentaires
- Calendar Range
- Scripts personnalisés
- AI Prompt Fields
- AI Button Fields

---

## 📊 FRONTEND - useEeConfig.ts

### Fonctionnalités Encore Bloquées

#### 1. **Upload d'Images pour les Workspaces** 🔒
```typescript
const blockWsImageLogoUpload = computed(() => true)  // ❌ BLOQUÉ
```
- **Impact**: Impossible de personnaliser le logo/image d'un workspace
- **Solution**: Changer à `false`

#### 2. **Workspace Audit** 🔒
```typescript
const isWsAuditEnabled = computed(() => false)  // ❌ DÉSACTIVÉ
```
- **Impact**: Pas d'audit trail au niveau workspace
- **Solution**: Changer à `true`

### Limites de Quotas

```typescript
const maxAttachmentsAllowedInCell = computed(() => {
  return Math.max(1, +appInfo.value.ncMaxAttachmentsAllowed || 50)
})
```
- **Limite par défaut**: 10 pièces jointes
- **Peut être augmenté via**: `NC_MAX_ATTACHMENTS_ALLOWED` env var

---

## 🧪 FEATURES BETA - useBetaFeatureToggle.ts

### Fonctionnalités Désactivées par Défaut

#### 1. **Dark Mode** 🌙
```typescript
{
  id: 'dark_mode',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEngineering: true
}
```
- **Status**: Mode Engineering uniquement
- **Solution**: Activer dans localStorage ou code

#### 2. **Link To Another Record (Display Value)** 🔗
```typescript
{
  id: 'link_to_another_record',
  enabled: false,  // ❌ DÉSACTIVÉ
}
```
- **Impact**: N'affiche pas la valeur display des enregistrements liés
- **Solution**: Activer le feature flag

#### 3. **AI Beta Features** 🤖
```typescript
{
  id: 'ai_beta_features',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEngineering: true,
  isEE: true
}
```
- **Status**: Mode Engineering + EE uniquement
- **Solution**: Activer + débloquer isEE

#### 4. **Integrations** 🔌
```typescript
{
  id: 'integrations',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEngineering: true
}
```
- **Impact**: Intégrations dynamiques désactivées
- **Solution**: Activer le feature flag

#### 5. **Data Reflection** 📊
```typescript
{
  id: 'data_reflection',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEngineering: true,
  isEE: true
}
```
- **Impact**: Réflexion des données désactivée
- **Solution**: Activer + débloquer isEE

#### 6. **Sync Feature** 🔄
```typescript
{
  id: 'sync',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEngineering: true,
  isEE: true
}
```
- **Impact**: Synchronisation désactivée
- **Solution**: Activer + débloquer isEE

#### 7. **Geodata Column** 🗺️
```typescript
{
  id: 'geodata_column',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEngineering: true
}
```
- **Impact**: Pas de colonnes de données géographiques
- **Solution**: Activer le feature flag

#### 8. **Form Scanner** 📷
```typescript
{
  id: 'form_support_column_scanning',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEngineering: true
}
```
- **Impact**: Pas de scanner pour remplir les formulaires
- **Solution**: Activer le feature flag

#### 9. **Attachment Carousel Comments** 💬
```typescript
{
  id: 'attachment_carousel_comments',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEngineering: true
}
```
- **Impact**: Pas de commentaires dans le carousel de pièces jointes
- **Solution**: Activer le feature flag

#### 10. **Cross Base Link** 🔗
```typescript
{
  id: 'cross_base_link',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEE: true
}
```
- **Impact**: Impossible de lier des tables entre bases différentes
- **Solution**: Activer + débloquer isEE

#### 11. **Custom Link** ⚙️
```typescript
{
  id: 'custom_link',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEE: true
}
```
- **Impact**: Impossible de créer des liens personnalisés
- **Solution**: Activer + débloquer isEE

#### 12. **View Actions** ⚡
```typescript
{
  id: 'view_actions',
  enabled: false,  // ❌ DÉSACTIVÉ
  isEngineering: true,
  isEE: true
}
```
- **Impact**: Pas d'exécution de scripts/webhooks sur tous les records d'une vue
- **Solution**: Activer + débloquer isEE

---

## 🔧 BACKEND - Limitations

### 1. **Flag Enterprise Edition** 🏢

**Fichier**: `packages/nocodb/src/utils/index.ts`
```typescript
export const isEE = false;  // ❌ HARDCODÉ À FALSE
```

**Impact**:
- Toutes les fonctionnalités marquées `isEE: true` sont désactivées
- Le système vérifie ce flag dans `Noco.isEE()`

**Solution**:
```typescript
export const isEE = true;  // ✅ ACTIVER
```

### 2. **Système de Licence** 🔑

**Fichier**: `packages/nocodb/src/services/org-lcense.service.ts`

Le système vérifie une clé de licence stockée:
```typescript
async licenseGet() {
  const license = await Store.get(NC_LICENSE_KEY);
  return { key: license?.value };
}
```

**Condition**:
```typescript
// Dans Noco.ts
public static isEE(): boolean {
  return this.ee || process.env.NC_CLOUD === 'true';
}
```

**Solution**: Définir `NC_CLOUD=true` ou modifier `isEE` dans utils

### 3. **Limites de Configuration**

**Fichier**: `packages/nocodb/src/constants/index.ts`

```typescript
// Taille maximale des champs non-attachments
export const NC_NON_ATTACHMENT_FIELD_SIZE = 10 * 1024 * 1024; // 10 MB

// Taille maximale des fichiers
export const NC_ATTACHMENT_FIELD_SIZE = 20 * 1024 * 1024; // 20 MB

// Nombre maximum de pièces jointes par cellule
export const NC_MAX_ATTACHMENTS_ALLOWED = 10;  // Par défaut

// Autres limites
export const V3_INSERT_LIMIT = 10;
export const V3_META_REQUEST_LIMIT = 10;
export const MAX_NESTING_DEPTH = 3;
export const MAX_CONCURRENT_TRANSFORMS = 50;
```

**Solution**: Augmenter via variables d'environnement:
- `NC_NON_ATTACHMENT_FIELD_SIZE`
- `NC_ATTACHMENT_FIELD_SIZE`
- `NC_MAX_ATTACHMENTS_ALLOWED`

---

## 🎯 PLAN DE DÉBLOCAGE COMPLET

### Phase 1: Fonctionnalités Frontend Simples ✅ (FAIT)
- [x] blockRowColoring
- [x] blockTableAndFieldPermissions
- [x] blockPrivateBases
- [x] blockAddNewDashboard
- [x] blockCalendarRange
- [x] blockAddNewScript
- [x] blockAiPromptField
- [x] blockAiButtonField

### Phase 2: Fonctionnalités Frontend Additionnelles
- [ ] blockWsImageLogoUpload → `false`
- [ ] isWsAuditEnabled → `true`

### Phase 3: Feature Flags Beta
- [ ] dark_mode → `enabled: true`
- [ ] link_to_another_record → `enabled: true`
- [ ] integrations → `enabled: true`
- [ ] geodata_column → `enabled: true`
- [ ] form_support_column_scanning → `enabled: true`
- [ ] attachment_carousel_comments → `enabled: true`

### Phase 4: Feature Flags EE (Nécessitent isEE)
- [ ] ai_beta_features → `enabled: true` (+ isEE)
- [ ] data_reflection → `enabled: true` (+ isEE)
- [ ] sync → `enabled: true` (+ isEE)
- [ ] cross_base_link → `enabled: true` (+ isEE)
- [ ] custom_link → `enabled: true` (+ isEE)
- [ ] view_actions → `enabled: true` (+ isEE)

### Phase 5: Backend Core
- [ ] Activer `isEE` dans `utils/index.ts`
- [ ] Augmenter les limites dans `constants/index.ts`
- [ ] Débloquer les services EE

---

## 📈 IMPACT PAR FONCTIONNALITÉ

### 🔥 Haute Priorité (Impact Maximum)

1. **isEE Backend** - Débloque toutes les fonctionnalités EE
2. **Cross Base Link** - Liens entre bases
3. **Custom Link** - Liens personnalisés
4. **View Actions** - Automatisation sur vues
5. **Sync** - Synchronisation de données
6. **Integrations** - Intégrations dynamiques

### 🟡 Moyenne Priorité (Améliore UX)

1. **Dark Mode** - Confort visuel
2. **Workspace Image Upload** - Branding
3. **Workspace Audit** - Sécurité et traçabilité
4. **Data Reflection** - Miroir de données
5. **Geodata Column** - Données géographiques

### 🟢 Basse Priorité (Nice to Have)

1. **Form Scanner** - QR code scanning
2. **Attachment Comments** - Commentaires sur fichiers
3. **Link Display Values** - Affichage amélioré des liens
4. **AI Beta Features** - Fonctionnalités AI expérimentales

---

## 🚀 COMMANDES DE DÉBLOCAGE RAPIDE

### Option 1: Via Variables d'Environnement
```bash
# Backend
export NC_CLOUD=true
export NC_MAX_ATTACHMENTS_ALLOWED=100
export NC_ATTACHMENT_FIELD_SIZE=104857600  # 100MB

# Redémarrer le backend
```

### Option 2: Via Modifications Code
```bash
# 1. Activer isEE backend
sed -i 's/export const isEE = false/export const isEE = true/' \
  packages/nocodb/src/utils/index.ts

# 2. Débloquer workspace image
sed -i 's/blockWsImageLogoUpload = computed(() => true)/blockWsImageLogoUpload = computed(() => false)/' \
  packages/nc-gui/composables/useEeConfig.ts

# 3. Activer workspace audit
sed -i 's/isWsAuditEnabled = computed(() => false)/isWsAuditEnabled = computed(() => true)/' \
  packages/nc-gui/composables/useEeConfig.ts
```

### Option 3: Via Feature Flags UI
1. Ouvrir NocoDB
2. Aller dans Settings > Feature Flags
3. Activer manuellement chaque fonctionnalité
4. (Nécessite mode Engineering activé dans localStorage)

---

## ⚠️ NOTES IMPORTANTES

### Compatibilité
- Certaines fonctionnalités EE peuvent nécessiter des migrations DB supplémentaires
- Tester d'abord en développement
- Sauvegarder la base avant d'activer en production

### Performance
- Les fonctionnalités désactivées l'ont parfois été pour des raisons de performance
- Monitorer après activation

### Légalité
- NocoDB est sous licence AGPLv3
- Le code source est open source
- Les restrictions sont artificielles, pas techniques
- Débloquer pour usage personnel/interne est légal
- Pour usage commercial, vérifier les termes de la licence

---

## 📝 RÉSUMÉ

**Total de fonctionnalités bloquées identifiées**: 20+

**Catégories**:
- 🔒 Bloquées par flags frontend: 2
- 🧪 Beta features désactivées: 12
- 🏢 Nécessitant isEE backend: 6
- ⚙️ Limites de configuration: 6+

**Effort de déblocage**:
- Frontend simple: 5 minutes
- Beta features: 10 minutes
- Backend EE: 15 minutes
- Test complet: 1-2 heures

**ROI**: 🔥🔥🔥 EXCELLENT
- Déblocage de fonctionnalités premium
- Économies potentielles de milliers d'euros/an
- Contrôle total sur votre instance

---

**Généré par**: Claude AI
**Dernière mise à jour**: 2025-12-01
**Version du document**: 1.0
