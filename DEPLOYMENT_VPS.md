# Déploiement VPS (Docker)

Ce guide prépare l’application (frontend React/Vite + backend NestJS + MySQL) sur un VPS Ubuntu.

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

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `JWT_SECRET`

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

## 7) Recommandations production

- Mettre un reverse proxy TLS devant le service (Nginx/Caddy/Traefik).
- Ajouter des sauvegardes MySQL (cron + dump externe).
- Ajouter monitoring et alerting (logs, uptime, CPU/RAM).
- Remplacer `db push` par des migrations versionnées Prisma (`prisma migrate`).
