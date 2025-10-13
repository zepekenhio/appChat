#  NewsSprint (Sprint Backend & Chat Temps Réel)

Tu vas construire une **application de chat en temps réel** avec Node.js, Express, MongoDB et Socket.IO.  
Le sprint est organisé en étapes progressives que tu dois compléter dans l’ordre.

---

## Démarrage du projet

- Installer les dépendances : `npm install`  
- Démarrer le serveur : `npm start`  
- Accéder à l’application : `http://localhost:3000`  

---

## Étape 1 : Créer les modèles

| # | Objectif | Action à réaliser |
|---|----------|-----------------|
| 1 | Créer le modèle `User` | Le modèle doit contenir `username` et `password`. Le mot de passe doit être hashé avant sauvegarde. |
| 2 | Créer le modèle `Message` | Le modèle doit contenir : `sender`, `receiver`, `content` et `createdAt`. |
| 3 | Définir les relations | `sender` et `receiver` doivent référencer `User`. |

---

## Étape 2 : Implémenter l’authentification JWT

| # | Objectif | Action à réaliser |
|---|----------|-----------------|
| 1 | Créer la route `/register` | Permet à un utilisateur de s’inscrire et de recevoir un token JWT. |
| 2 | Créer la route `/login` | Vérifie les identifiants et retourne un token JWT valide. |
| 3 | Créer un middleware `authMiddleware` | Vérifie le header `Authorization: Bearer <token>` . |
| 4 | Protéger les routes | Toutes les routes chat doivent être accessibles seulement aux utilisateurs authentifiés. |
| 5 | Tester l’authentification | Vérifier que les utilisateurs non connectés ne peuvent pas accéder aux routes protégées. |

---

## Étape 3 : Configurer Socket.IO pour le chat

| # | Objectif | Action à réaliser |
|---|----------|-----------------|
| 1 | Installer et monter Socket.IO | Intégrer Socket.IO au serveur Express. |
| 2 | Gérer la connexion des utilisateurs | Quand un utilisateur se connecte, l’associer à une room identifiée par son userId (JWT). |
| 3 | Envoyer et recevoir des messages | Permettre aux utilisateurs de s’envoyer des messages en temps réel via Socket.IO. |
| 4 | Tester le chat temps réel | Vérifier que les utilisateurs peuvent échanger des messages simultanément. |

---

##  Étape 4 : Persistance des messages

| # | Objectif | Action à réaliser |
|---|----------|-----------------|
| 1 | Stocker les messages | Chaque message reçu via Socket.IO doit être sauvegardé dans MongoDB via le modèle `Message`. |
| 2 | Vérifier la sauvegarde | Tester que les messages sont bien enregistrés `. |
| 3 | Sécuriser l’envoi | S’assurer que seuls les utilisateurs authentifiés peuvent envoyer des messages. |

---

## Étape 5 : Historique des messages + Front-end Chat

| # | Objectif | Action à réaliser |
|---|----------|-----------------|
| 1 | Récupérer l’historique | Lorsqu’un utilisateur se connecte, envoyer tous les messages existants le concernant depuis le backend. |
| 3 | Implémenter côté client (`chat.js`) | Terminer le front-end pour : • Afficher les messages récupérés dans la fenêtre de chat Permettre l’envoi de nouveaux messages via Socket.IO • Mettre à jour la fenêtre de chat en temps réel à la réception de messages |
| 4 | Tester multi-utilisateurs | Vérifier que plusieurs sessions peuvent envoyer et recevoir des messages correctement, avec l’historique affiché pour chaque utilisateur. |

---



---



