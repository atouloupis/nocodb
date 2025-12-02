# 🚀 Guide de Déploiement - NocoDB Version Modifiée

Ce guide explique comment déployer votre version modifiée de NocoDB avec toutes les fonctionnalités Enterprise débloquées en utilisant Docker.

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Migration depuis votre installation actuelle](#migration-depuis-votre-installation-actuelle)
4. [Méthode 1: Déploiement Automatique (Recommandé)](#méthode-1-déploiement-automatique-recommandé)
5. [Méthode 2: Déploiement Manuel](#méthode-2-déploiement-manuel)
6. [Configuration](#configuration)
7. [Vérification et Tests](#vérification-et-tests)
8. [Maintenance](#maintenance)
9. [Dépannage](#dépannage)
10. [Mise à jour](#mise-à-jour)

---

## Vue d'ensemble

Votre version actuelle de NocoDB tourne avec cette commande:
```bash
docker run -d --name nocodb-postgres \
  -v "$(pwd)"/nocodb:/home/app/data/ \
  -p 8090:8080 \
  -e NC_DB="pg://10.70.11.101:5432?u=test&p=test&d=test" \
  -e NC_AUTH_JWT_SECRET="569a1821-0a93-45e8-87ab-eb857f20a010" \
  nocodb/nocodb:latest
```

Nous allons remplacer cette installation par votre version modifiée buildée depuis votre dépôt GitHub.

### Fichiers de Déploiement

- **`Dockerfile.custom`** - Dockerfile multi-stage pour builder NocoDB
- **`docker-compose.custom.yml`** - Configuration Docker Compose
- **`build-and-deploy.sh`** - Script automatisé de build et déploiement
- **`.env.example`** - Template pour les variables d'environnement

---

## Prérequis

### Logiciels Requis

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Git** (pour cloner le dépôt)
- **4 GB RAM minimum** (8 GB recommandé pour le build)
- **10 GB d'espace disque libre** minimum

### Vérification

```bash
# Vérifier Docker
docker --version
# Output attendu: Docker version 20.10.x ou supérieur

# Vérifier Docker Compose
docker-compose --version
# ou
docker compose version
# Output attendu: Docker Compose version 2.x.x ou supérieur

# Vérifier l'espace disque
df -h .
```

---

## Migration depuis votre installation actuelle

### Option A: Migration Sans Interruption (Recommandé)

Cette option déploie la nouvelle version sur un port différent, vous permettant de tester avant de basculer.

```bash
# 1. Cloner votre dépôt modifié (si pas déjà fait)
cd /path/to/projects
git clone https://github.com/atouloupis/nocodb.git nocodb-unlocked
cd nocodb-unlocked

# 2. Checkout la branche avec les modifications
git checkout claude/claude-md-minnqgm0vj0fo7if-01J92jhpJ6PcBQG4pioVZExJ

# 3. Modifier temporairement le port dans docker-compose.custom.yml
# Changez "8090:8080" en "8091:8080" pour tester en parallèle

# 4. Builder et déployer
./build-and-deploy.sh

# 5. Tester la nouvelle version sur http://localhost:8091
# 6. Si tout fonctionne, arrêter l'ancienne version et basculer
```

### Option B: Migration Directe (Plus rapide mais avec interruption)

```bash
# 1. Sauvegarder vos données (IMPORTANT!)
cd /path/to/current/nocodb
tar -czf nocodb-backup-$(date +%Y%m%d).tar.gz nocodb/

# 2. Arrêter l'ancien container
docker stop nocodb-postgres
docker rm nocodb-postgres

# 3. Cloner et déployer la nouvelle version
cd /path/to/projects
git clone https://github.com/atouloupis/nocodb.git nocodb-unlocked
cd nocodb-unlocked
git checkout claude/claude-md-minnqgm0vj0fo7if-01J92jhpJ6PcBQG4pioVZExJ

# 4. Copier vos données (ajuster le chemin)
cp -r /path/to/current/nocodb ./nocodb

# 5. Configurer les credentials
cp .env.example .env
# Éditer .env avec vos vraies valeurs

# 6. Builder et déployer
./build-and-deploy.sh
```

---

## Méthode 1: Déploiement Automatique (Recommandé)

### Étape 1: Préparation

```bash
# Cloner le dépôt (si pas déjà fait)
git clone https://github.com/atouloupis/nocodb.git nocodb-unlocked
cd nocodb-unlocked

# Checkout la bonne branche
git checkout claude/claude-md-minnqgm0vj0fo7if-01J92jhpJ6PcBQG4pioVZExJ
```

### Étape 2: Configuration

```bash
# Copier le template de configuration
cp .env.example .env

# Éditer le fichier .env avec vos vraies valeurs
nano .env  # ou vim, code, etc.
```

Contenu du fichier `.env`:
```env
# Base de données PostgreSQL
NC_DB=pg://10.70.11.101:5432?u=test&p=test&d=test

# Secret JWT (utilisez le même pour préserver les sessions)
NC_AUTH_JWT_SECRET=569a1821-0a93-45e8-87ab-eb857f20a010

# Désactiver la télémétrie
NC_DISABLE_TELE=true

# Limites augmentées
NC_MAX_ATTACHMENTS_ALLOWED=100
NC_ATTACHMENT_FIELD_SIZE=104857600

# Timezone
TZ=Europe/Paris
```

### Étape 3: Build et Déploiement

```bash
# Option 1: Build + Deploy en une commande
./build-and-deploy.sh

# Option 2: Build seulement (pour tester)
./build-and-deploy.sh --build-only

# Option 3: Build sans cache (si problèmes)
./build-and-deploy.sh --no-cache

# Option 4: Arrêter l'ancien container avant déploiement
./build-and-deploy.sh --stop-existing
```

Le script va:
1. ✅ Vérifier les prérequis (Docker, fichiers)
2. ✅ Builder l'image Docker (~10-15 minutes)
3. ✅ Déployer le container
4. ✅ Vérifier que tout fonctionne
5. ✅ Afficher un résumé avec les commandes utiles

### Étape 4: Vérification

```bash
# Vérifier que le container tourne
docker ps | grep nocodb-unlocked

# Voir les logs
docker logs -f nocodb-unlocked

# Tester l'accès
curl http://localhost:8090/api/v1/health
# Output attendu: {"message":"OK"}
```

Accédez à http://localhost:8090 dans votre navigateur.

---

## Méthode 2: Déploiement Manuel

### Étape 1: Build de l'Image

```bash
# Depuis la racine du projet
docker build -f Dockerfile.custom -t nocodb-unlocked:latest .
```

Cette commande:
- Installe toutes les dépendances
- Build le SDK, le backend et le frontend
- Crée une image Docker optimisée (~500-800 MB)

**Temps estimé**: 10-15 minutes (première fois)

### Étape 2: Déploiement via Docker Run

```bash
# Arrêter l'ancien container
docker stop nocodb-postgres
docker rm nocodb-postgres

# Lancer le nouveau container
docker run -d \
  --name nocodb-unlocked \
  -v "$(pwd)"/nocodb:/home/app/data/ \
  -p 8090:8080 \
  -e NC_DB="pg://10.70.11.101:5432?u=test&p=test&d=test" \
  -e NC_AUTH_JWT_SECRET="569a1821-0a93-45e8-87ab-eb857f20a010" \
  -e NC_DISABLE_TELE=true \
  -e NC_MAX_ATTACHMENTS_ALLOWED=100 \
  nocodb-unlocked:latest
```

### Étape 3: Déploiement via Docker Compose

```bash
# Lancer avec Docker Compose
docker-compose -f docker-compose.custom.yml up -d

# Voir les logs
docker-compose -f docker-compose.custom.yml logs -f

# Arrêter
docker-compose -f docker-compose.custom.yml stop

# Supprimer
docker-compose -f docker-compose.custom.yml down
```

---

## Configuration

### Variables d'Environnement Importantes

#### Base de Données

```bash
# PostgreSQL (format actuel)
NC_DB=pg://host:port?u=user&p=password&d=database

# Exemples pour d'autres bases:
# MySQL
NC_DB=mysql2://host:port?u=user&p=password&d=database

# SQLite (fichier local)
NC_DB=sqlite:///home/app/data/noco.db
```

#### Sécurité

```bash
# JWT Secret (NE PAS CHANGER si vous voulez préserver les sessions)
NC_AUTH_JWT_SECRET=569a1821-0a93-45e8-87ab-eb857f20a010

# Pour générer un nouveau secret:
openssl rand -hex 32
```

#### Limites et Quotas (Débloqués)

```bash
# Pièces jointes par cellule (défaut: 10, débloqué: 100)
NC_MAX_ATTACHMENTS_ALLOWED=100

# Taille max fichier (100 MB en octets)
NC_ATTACHMENT_FIELD_SIZE=104857600

# Taille max champs non-attachments (100 MB)
NC_NON_ATTACHMENT_FIELD_SIZE=104857600
```

#### Optionnel: Redis pour Cache

```bash
NC_REDIS_URL=redis://localhost:6379/0
```

#### Optionnel: SMTP pour Emails

```bash
NC_SMTP_FROM=noreply@example.com
NC_SMTP_HOST=smtp.gmail.com
NC_SMTP_PORT=587
NC_SMTP_USERNAME=your-email@gmail.com
NC_SMTP_PASSWORD=your-app-password
```

#### Optionnel: S3 pour Stockage

```bash
NC_S3_BUCKET_NAME=nocodb-files
NC_S3_REGION=eu-west-1
NC_S3_ACCESS_KEY=YOUR_ACCESS_KEY
NC_S3_ACCESS_SECRET=YOUR_SECRET_KEY
```

### Persistance des Données

Le volume Docker monte `./nocodb` vers `/home/app/data` dans le container:

```bash
# Structure des données
nocodb/
├── noco.db              # SQLite metadata (si utilisé)
├── nc_*_attachments/    # Fichiers uploadés
└── logs/                # Logs de l'application
```

**IMPORTANT**: Sauvegardez régulièrement ce répertoire!

---

## Vérification et Tests

### 1. Vérifier que le Container Tourne

```bash
# Lister les containers
docker ps

# Output attendu:
# CONTAINER ID   IMAGE                    STATUS         PORTS                    NAMES
# abc123def456   nocodb-unlocked:latest   Up 2 minutes   0.0.0.0:8090->8080/tcp   nocodb-unlocked
```

### 2. Vérifier les Logs

```bash
# Logs en temps réel
docker logs -f nocodb-unlocked

# Dernières 100 lignes
docker logs --tail 100 nocodb-unlocked

# Logs avec timestamps
docker logs -f --timestamps nocodb-unlocked
```

Logs normaux attendus:
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] INFO Server listening on port 8080
```

### 3. Test de Santé (Health Check)

```bash
# API health check
curl http://localhost:8090/api/v1/health

# Output attendu:
{"message":"OK"}
```

### 4. Test des Fonctionnalités Débloquées

Connectez-vous à http://localhost:8090 et vérifiez:

#### Permissions Tables et Champs
1. Ouvrir une table
2. Cliquer sur ⚙️ Settings → Permissions
3. Vous devriez voir les options de permissions (pas de message "upgrade required")

#### Dark Mode
1. Settings → Feature Flags
2. Activer "Dark Mode"
3. L'interface devrait passer en mode sombre

#### Workspace Image Upload
1. Workspace Settings
2. Upload Logo/Image (devrait être débloqué)

#### Cross Base Link
1. Settings → Feature Flags
2. Activer "Cross Base Link"
3. Créer un nouveau champ → Type "Link to Another Record"
4. Option pour lier vers une autre base devrait être disponible

#### Vérifier isEE (Enterprise Edition)

```bash
# Ouvrir le browser console (F12)
# Taper:
# localStorage
# Chercher 'isEE' ou vérifier que les features EE sont disponibles
```

---

## Maintenance

### Logs

```bash
# Logs en temps réel
docker logs -f nocodb-unlocked

# Avec filtrage
docker logs -f nocodb-unlocked | grep ERROR

# Sauvegarder les logs
docker logs nocodb-unlocked > nocodb-logs-$(date +%Y%m%d).log
```

### Sauvegarde

#### Base de Données PostgreSQL

```bash
# Depuis le serveur PostgreSQL
pg_dump -h 10.70.11.101 -U test -d test > nocodb-backup-$(date +%Y%m%d).sql

# Ou avec Docker
docker exec postgres-container pg_dump -U test test > backup.sql
```

#### Fichiers Uploadés

```bash
# Sauvegarder le répertoire nocodb
tar -czf nocodb-files-$(date +%Y%m%d).tar.gz nocodb/

# Ou synchroniser avec rsync
rsync -av nocodb/ backup-location/nocodb/
```

#### Script de Sauvegarde Automatique

Créez `/home/user/backup-nocodb.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
pg_dump -h 10.70.11.101 -U test -d test > "$BACKUP_DIR/db-$DATE.sql"

# Backup fichiers
tar -czf "$BACKUP_DIR/files-$DATE.tar.gz" nocodb/

# Garder seulement les 7 derniers backups
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
```

Ajoutez au crontab:
```bash
# Backup quotidien à 2h du matin
0 2 * * * /home/user/backup-nocodb.sh
```

### Redémarrage

```bash
# Redémarrage soft
docker restart nocodb-unlocked

# Ou avec Docker Compose
docker-compose -f docker-compose.custom.yml restart

# Redémarrage avec rebuild
docker-compose -f docker-compose.custom.yml up -d --force-recreate
```

### Monitoring

#### Ressources Utilisées

```bash
# CPU, RAM, Réseau
docker stats nocodb-unlocked

# Espace disque
docker exec nocodb-unlocked du -sh /home/app/data
```

#### Healthcheck

```bash
# Via Docker
docker inspect nocodb-unlocked | grep -A 10 Health

# Via curl (loop)
watch -n 10 curl -s http://localhost:8090/api/v1/health
```

---

## Dépannage

### Problème: Container ne démarre pas

**Symptômes**: `docker ps` ne montre pas le container

**Solutions**:
```bash
# 1. Vérifier les logs
docker logs nocodb-unlocked

# 2. Vérifier le status du container
docker ps -a | grep nocodb

# 3. Vérifier la configuration
docker inspect nocodb-unlocked

# 4. Redémarrer avec logs verbeux
docker-compose -f docker-compose.custom.yml up
# (sans -d pour voir les logs en direct)
```

### Problème: Erreur de connexion à PostgreSQL

**Symptômes**: Logs montrent "Connection refused" ou "ECONNREFUSED"

**Solutions**:
```bash
# 1. Vérifier que PostgreSQL est accessible depuis le container
docker exec nocodb-unlocked ping 10.70.11.101

# 2. Tester la connexion directement
docker exec nocodb-unlocked nc -zv 10.70.11.101 5432

# 3. Vérifier les credentials
echo "NC_DB=pg://10.70.11.101:5432?u=test&p=test&d=test"
# Format: pg://host:port?u=username&p=password&d=database

# 4. Vérifier le firewall PostgreSQL
# Sur le serveur PostgreSQL, vérifier pg_hba.conf
# Autoriser la connexion depuis l'IP du serveur Docker
```

### Problème: Port 8090 déjà utilisé

**Symptômes**: Error "address already in use"

**Solutions**:
```bash
# 1. Vérifier ce qui utilise le port
sudo lsof -i :8090
# ou
sudo netstat -tulpn | grep 8090

# 2. Arrêter l'ancien container
docker stop nocodb-postgres

# 3. Ou changer le port dans docker-compose.custom.yml
# Changez "8090:8080" en "8091:8080" ou autre port disponible
```

### Problème: Erreur "Permission denied" sur le volume

**Symptômes**: Logs montrent "EACCES: permission denied"

**Solutions**:
```bash
# 1. Vérifier les permissions du répertoire
ls -la nocodb/

# 2. Changer le propriétaire (l'utilisateur dans le container est uid=1000)
sudo chown -R 1000:1000 nocodb/

# 3. Ou donner les permissions complètes (moins sécurisé)
chmod -R 777 nocodb/
```

### Problème: Build échoue avec "Out of memory"

**Symptômes**: Docker build crash avec erreur mémoire

**Solutions**:
```bash
# 1. Augmenter la mémoire Docker
# Docker Desktop: Settings → Resources → Memory → 8GB

# 2. Build avec less parallelism
docker build --cpus=1 -f Dockerfile.custom -t nocodb-unlocked:latest .

# 3. Nettoyer le cache Docker
docker system prune -a --volumes
```

### Problème: Fonctionnalités toujours bloquées

**Symptômes**: Permissions ou autres features montrent "Upgrade required"

**Solutions**:
```bash
# 1. Vérifier que vous utilisez la bonne image
docker images | grep nocodb-unlocked

# 2. Vérifier les modifications dans le code source
docker exec nocodb-unlocked cat /app/packages/nocodb/src/utils/index.ts | grep isEE
# Output attendu: export const isEE = true;

# 3. Forcer un rebuild sans cache
./build-and-deploy.sh --no-cache

# 4. Vérifier dans le browser console
# F12 → Console → Vérifier que isEE est true
```

### Problème: Migrations de base de données échouent

**Symptômes**: Logs montrent erreur de migration

**Solutions**:
```bash
# 1. Vérifier la version de la base
docker exec nocodb-unlocked psql $NC_DB -c "SELECT * FROM nc_migrations ORDER BY id DESC LIMIT 5"

# 2. Rollback si nécessaire (ATTENTION: BACKUP D'ABORD!)
# Restaurer un backup précédent

# 3. Forcer les migrations
docker exec nocodb-unlocked node dist/bundle.js migration:run
```

---

## Mise à jour

### Mettre à jour vers une nouvelle version modifiée

```bash
# 1. Sauvegarder (IMPORTANT!)
./backup-nocodb.sh

# 2. Pull les dernières modifications
git pull origin claude/claude-md-minnqgm0vj0fo7if-01J92jhpJ6PcBQG4pioVZExJ

# 3. Rebuild et redéployer
./build-and-deploy.sh --no-cache

# 4. Vérifier
docker logs -f nocodb-unlocked
```

### Rollback vers une version précédente

```bash
# 1. Arrêter le container actuel
docker-compose -f docker-compose.custom.yml down

# 2. Restaurer depuis backup
tar -xzf nocodb-backup-YYYYMMDD.tar.gz

# 3. Checkout une version précédente
git checkout <commit-hash>

# 4. Rebuild et redéployer
./build-and-deploy.sh
```

---

## Performance et Optimisation

### Limites de Ressources

Modifiez `docker-compose.custom.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 8G
    reservations:
      cpus: '2'
      memory: 4G
```

### Cache Redis

Pour améliorer les performances avec Redis:

1. Démarrer Redis:
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

2. Ajouter dans `.env`:
```bash
NC_REDIS_URL=redis://host.docker.internal:6379/0
```

3. Redéployer:
```bash
./build-and-deploy.sh
```

### Reverse Proxy (Nginx/Traefik)

Pour un déploiement en production avec HTTPS:

**Nginx**:
```nginx
server {
    listen 443 ssl http2;
    server_name nocodb.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ajoutez dans `.env`:
```bash
NC_PUBLIC_URL=https://nocodb.example.com
```

---

## Sécurité

### Bonnes Pratiques

1. **Ne jamais commiter le fichier `.env`**
   ```bash
   # Vérifier qu'il est dans .gitignore
   grep .env .gitignore
   ```

2. **Changer le JWT secret**
   ```bash
   # Générer un nouveau secret
   openssl rand -hex 32
   ```

3. **Utiliser HTTPS en production**
   - Reverse proxy avec certificats SSL
   - Let's Encrypt gratuit

4. **Firewall pour PostgreSQL**
   - Autoriser seulement l'IP du serveur Docker
   - Utiliser un VPN ou SSH tunnel pour les connexions distantes

5. **Sauvegardes régulières**
   - Base de données quotidienne
   - Fichiers hebdomadaire
   - Tester les restaurations

6. **Monitoring**
   - Logs centralisés
   - Alertes sur erreurs
   - Surveillance des ressources

---

## Fichiers de Référence

### Structure des Fichiers Créés

```
nocodb-unlocked/
├── Dockerfile.custom           # Dockerfile pour build
├── docker-compose.custom.yml   # Config Docker Compose
├── build-and-deploy.sh         # Script automatisé (exécutable)
├── .env.example                # Template configuration
├── .env                        # Votre configuration (NE PAS COMMITER)
├── DEPLOYMENT.md               # Ce fichier
├── UNLOCKED_FEATURES.md        # Liste des fonctionnalités débloquées
├── BLOCKED_FEATURES_ANALYSIS.md # Analyse complète
└── nocodb/                     # Données persistantes
    ├── nc_*_attachments/
    └── logs/
```

### Commandes Rapides

```bash
# Build et deploy
./build-and-deploy.sh

# Voir les logs
docker logs -f nocodb-unlocked

# Restart
docker restart nocodb-unlocked

# Stop
docker stop nocodb-unlocked

# Backup
tar -czf backup-$(date +%Y%m%d).tar.gz nocodb/

# Health check
curl http://localhost:8090/api/v1/health
```

---

## Support

### Documentation

- **Fonctionnalités débloquées**: `UNLOCKED_FEATURES.md`
- **Analyse complète**: `BLOCKED_FEATURES_ANALYSIS.md`
- **Guide développement**: `CLAUDE.md`

### Ressources NocoDB

- Documentation officielle: https://docs.nocodb.com/
- GitHub: https://github.com/nocodb/nocodb
- Discord: https://discord.gg/5RgZmkW

### Questions Fréquentes

**Q: Est-ce légal de débloquer ces fonctionnalités?**
R: Oui, NocoDB est sous licence AGPLv3. Le code est open source et vous pouvez le modifier pour usage personnel/interne.

**Q: Puis-je utiliser ceci en production?**
R: Oui, mais assurez-vous de respecter la licence AGPLv3 (partage du code modifié si hébergement pour d'autres).

**Q: Les mises à jour NocoDB écraseront mes modifications?**
R: Oui. Maintenez votre fork et réappliquez les modifications après chaque mise à jour.

**Q: Performance impact?**
R: Les fonctionnalités EE peuvent consommer plus de ressources. Monitorer et ajuster selon vos besoins.

---

**Dernière mise à jour**: 2025-12-02
**Version**: 1.0
**Auteur**: Claude AI

---

🎉 **Bon déploiement avec votre NocoDB débloqué!**
