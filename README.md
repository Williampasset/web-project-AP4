# web-project-AP4

Monorepo application logistique:

- Backend: NestJS + Prisma + MySQL
- Frontend: React + Vite

## Déploiement VPS

La procédure complète est dans:

- [DEPLOYMENT_VPS.md](DEPLOYMENT_VPS.md)

## Scripts utiles

- Déploiement stack Docker: [scripts/deploy-vps.sh](scripts/deploy-vps.sh)
- Bootstrap serveur Ubuntu: [scripts/bootstrap-vps.sh](scripts/bootstrap-vps.sh)
- Pull + déploiement: [scripts/update-and-deploy-vps.sh](scripts/update-and-deploy-vps.sh)

## Variables d'environnement

- Exemple VPS: [.env.vps.example](.env.vps.example)
- Exemple backend local: [backend/.env.example](backend/.env.example)
