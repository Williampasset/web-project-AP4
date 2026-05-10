# Déploiement VPS (Docker)

Ce guide prépare l’application (frontend React/Vite + backend NestJS) sur un VPS Ubuntu, avec une base distante existante via `DATABASE_URL`.

## 1) Pré-requis

- VPS Ubuntu 22.04+ (ou Debian compatible Docker)
- DNS pointant vers le VPS (optionnel)
- Ports ouverts: `80` (et `443` si TLS reverse-proxy)

## 2) Installation initiale du VPS

Depuis la racine du projet sur le serveur:

```bash
sudo bash scripts/bootstrap-vps.sh
```

## 3) Variables d’environnement

```bash
cp .env.vps.example .env.vps
nano .env.vps
```

Renseigner au minimum:

- `JWT_SECRET`
- `DATABASE_URL`

## 4) Déployer

```bash
bash scripts/deploy-vps.sh
```

L’application sera disponible sur:

- Frontend: `http://<IP_VPS>`
- API (via proxy): `http://<IP_VPS>/api/...`

## 5) Commandes utiles

```bash
# Statut

docker compose --env-file .env.vps -f docker-compose.vps.yml ps

# Logs backend

docker compose --env-file .env.vps -f docker-compose.vps.yml logs -f backend

# Redéploiement

docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build

# Arrêt

docker compose --env-file .env.vps -f docker-compose.vps.yml down
```

## 6) Notes importantes

- Le backend exécute automatiquement `prisma db push` au démarrage du conteneur.
- Le frontend est servi par Nginx avec fallback SPA.
- Le chemin `/api/*` est reverse-proxy vers le backend.
- La base n'est pas déployée par Docker Compose : elle doit déjà exister et être accessible depuis le VPS via `DATABASE_URL`.

## 7) Recommandations production

- Mettre un reverse proxy TLS devant le service (Nginx/Caddy/Traefik).
- Ajouter une stratégie de sauvegarde sur la base distante.
- Ajouter monitoring et alerting (logs, uptime, CPU/RAM).
- Remplacer `db push` par des migrations versionnées Prisma (`prisma migrate`).
