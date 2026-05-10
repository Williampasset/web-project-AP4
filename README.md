# Web Project AP4 - Gestion Logistique

Une application web complète de gestion logistique développée avec NestJS
(backend) et React/Vite (frontend), utilisant Prisma comme ORM pour la gestion
de base de données.

## 🚀 Fonctionnalités

- **Gestion des utilisateurs** : Authentification et autorisation
- **Gestion des clients** : CRUD complet des clients
- **Gestion des commandes** : Création et suivi des commandes
- **Gestion des articles** : Inventaire et suivi des produits
- **Gestion des fournisseurs** : Relations fournisseurs
- **Gestion des camions** : Flotte de véhicules
- **Gestion des emplacements** : Organisation des stocks
- **Historique des stocks** : Traçabilité des mouvements
- **Préparation de commandes** : Workflow de préparation

## 🛠️ Technologies Utilisées

### Backend

- **NestJS** - Framework Node.js pour applications côté serveur
- **Prisma** - ORM moderne pour Node.js & TypeScript
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification
- **TypeScript** - JavaScript typé

### Frontend

- **React** - Bibliothèque JavaScript pour interfaces utilisateur
- **Vite** - Outil de build rapide
- **TypeScript** - JavaScript typé
- **CSS Variables** - Thème personnalisé

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- npm
- MySQL
- Git

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone <url-du-repository>
cd web-project-AP4
```

### 2. Configuration du Backend

```bash
cd backend
npm install
```

### 3. Configuration de la Base de Données

Créer une base de données PostgreSQL et configurer les variables d'environnement
:

```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos informations de base de données :

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-secret-key"
```

### 4. Migration de la Base de Données

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Configuration du Frontend

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Variables d'Environnement Backend

Créer un fichier `.env` dans le dossier `backend/` :

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"
```

### Variables d'Environnement Frontend

Créer un fichier `.env` dans le dossier `frontend/` :

```env
VITE_API_URL="http://localhost:3000"
```

## 🏃‍♂️ Utilisation

### Démarrage du Backend

```bash
cd backend
npm run start:dev
```

Le serveur sera accessible sur `http://localhost:3000`

### Démarrage du Frontend

```bash
cd frontend
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Scripts Disponibles

#### Backend

- `npm run start` - Démarrage en mode production
- `npm run start:dev` - Démarrage en mode développement
- `npm run build` - Build de l'application
- `npm run test` - Exécution des tests

#### Frontend

- `npm run dev` - Démarrage du serveur de développement
- `npm run build` - Build de l'application
- `npm run preview` - Prévisualisation du build
- `npm run lint` - Vérification du code

## 📁 Structure du Projet

```
web-project-AP4/
├── backend/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── prisma.service.ts
│   │   ├── articles/          # Module articles
│   │   ├── auth/              # Module authentification
│   │   ├── clients/           # Module clients
│   │   ├── commands/          # Module commandes
│   │   ├── command-preparation/ # Module préparation commandes
│   │   ├── locations/         # Module emplacements
│   │   ├── stock-history/     # Module historique stocks
│   │   ├── suppliers/         # Module fournisseurs
│   │   ├── trucks/            # Module camions
│   │   └── users/             # Module utilisateurs
│   ├── prisma/
│   │   └── schema.prisma      # Schéma de base de données
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/        # Composants React
│   │   ├── pages/             # Pages de l'application
│   │   ├── services/          # Services API
│   │   ├── types/             # Types TypeScript
│   │   └── utils/             # Utilitaires
│   ├── public/
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentification

- `POST /auth/login` - Connexion utilisateur
- `POST /auth/register` - Inscription utilisateur

### Clients

- `GET /clients` - Liste des clients
- `POST /clients` - Créer un client
- `GET /clients/:id` - Détails d'un client
- `PUT /clients/:id` - Modifier un client
- `DELETE /clients/:id` - Supprimer un client

### Commandes

- `GET /commands` - Liste des commandes
- `POST /commands` - Créer une commande
- `GET /commands/:id` - Détails d'une commande
- `PUT /commands/:id` - Modifier une commande
- `DELETE /commands/:id` - Supprimer une commande

### Articles

- `GET /articles` - Liste des articles
- `POST /articles` - Créer un article
- `GET /articles/:id` - Détails d'un article
- `PUT /articles/:id` - Modifier un article
- `DELETE /articles/:id` - Supprimer un article

### Fournisseurs

- `GET /suppliers` - Liste des fournisseurs
- `POST /suppliers` - Créer un fournisseur
- `GET /suppliers/:id` - Détails d'un fournisseur
- `PUT /suppliers/:id` - Modifier un fournisseur
- `DELETE /suppliers/:id` - Supprimer un fournisseur

### Camions

- `GET /trucks` - Liste des camions
- `POST /trucks` - Créer un camion
- `GET /trucks/:id` - Détails d'un camion
- `PUT /trucks/:id` - Modifier un camion
- `DELETE /trucks/:id` - Supprimer un camion

### Emplacements

- `GET /locations` - Liste des emplacements
- `POST /locations` - Créer un emplacement
- `GET /locations/:id` - Détails d'un emplacement
- `PUT /locations/:id` - Modifier un emplacement
- `DELETE /locations/:id` - Supprimer un emplacement

### Utilisateurs

- `GET /users` - Liste des utilisateurs
- `POST /users` - Créer un utilisateur
- `GET /users/:id` - Détails d'un utilisateur
- `PUT /users/:id` - Modifier un utilisateur
- `DELETE /users/:id` - Supprimer un utilisateur

## 🎨 Thème et Design

Le projet utilise un système de couleurs CSS personnalisé :

```css
:root {
  --primary: #00bcd4; /* Cyan turquoise */
  --danger: #c62828; /* Rouge */
  --accent: #ff7043; /* Orange */
  --bg: #f5f7fa; /* Fond clair */
  --card: #ffffff; /* Blanc pour les cartes */
  --border: #e5e7eb; /* Gris clair pour les bordures */
}
```

## 🧪 Tests

### Backend

```bash
cd backend
npm run test
```

### Frontend

```bash
cd frontend
npm run test
```

## 📦 Déploiement

### Backend

```bash
cd backend
npm run build
npm run start:prod
```

### Frontend

```bash
cd frontend
npm run build
```

Les fichiers de build seront générés dans le dossier `dist/`.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de
détails.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.

---

Développé par l'équipe Clément FLAMENT & William PASSET
