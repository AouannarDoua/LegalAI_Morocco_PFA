<div align="center">

# ⚖️ LegalAI Morocco — Maliyum

### منصة ذكاء اصطناعي للمجال القانوني المغربي

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.138-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Docker Hub](https://img.shields.io/badge/Docker_Hub-abdelghaniessabri-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/u/abdelghaniessabri)

> **Maliyum** est une plateforme légale intelligente basée sur RAG (Retrieval-Augmented Generation) dédiée au droit marocain — génération de contrats en arabe RTL, Q&A juridique, et conformité SARL selon la Loi n° 5-96.

</div>

---

## 📋 Table des matières

- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Stack Technique](#️-stack-technique)
- [🐳 Docker Deployment](#-docker-deployment)
- [🚀 Installation Locale](#-installation-locale)
- [📁 Structure du Projet](#-structure-du-projet)
- [🔌 API Endpoints](#-api-endpoints)
- [⚙️ Variables d'Environnement](#️-variables-denvironnement)
- [👥 Équipe](#-équipe)

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 📄 **Génération de Contrats** | Génération automatique de contrats SARL/SNC en arabe RTL (PDF via ReportLab + police Amiri) |
| 🔍 **RAG Juridique** | Moteur BM25 + Sentence Transformers + FAISS sur 500+ textes juridiques marocains indexés |
| 🤖 **LLM Integration** | Groq API (llama-3.3-70b-versatile) pour Q&A juridique contextuel |
| 📜 **Conformité SARL** | Champs structurés associés/capital conformes à la Loi n° 5-96 |
| 🔐 **Authentification** | JWT Auth sécurisé avec Flask-JWT-Extended |
| 📤 **OCR** | Extraction de texte arabe/français via Tesseract OCR |
| 📊 **Base de Données** | SQLAlchemy ORM + migrations Alembic |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LegalAI Morocco                       │
├─────────────────────┬───────────────────────────────────┤
│   Frontend          │   Backend                         │
│   React/TypeScript  │   Flask + FastAPI                 │
│   Nginx :80         │   Gunicorn :5000                  │
├─────────────────────┴───────────────────────────────────┤
│                  RAG Pipeline                            │
│   BM25 Retriever → Sentence Transformers → FAISS        │
│   → Groq LLM (llama-3.3-70b-versatile)                 │
├─────────────────────────────────────────────────────────┤
│              Data Layer                                  │
│   SQLAlchemy ORM │ SQLite/PostgreSQL │ FAISS Index      │
└─────────────────────────────────────────────────────────┘
```

### Pipeline RAG

```
Question Juridique
      ↓
BM25 Retriever (rank-bm25)
      ↓
Sentence Transformers (Re-ranking)
      ↓
FAISS Vector Search (faiss-cpu)
      ↓
Groq LLM → Réponse Contextuelle
```

---

## 🛠️ Stack Technique

### Backend
| Composant | Technologie |
|---|---|
| **Framework** | Flask 3.1.0 + FastAPI 0.138 |
| **Server** | Gunicorn 23.0 + Uvicorn |
| **ORM** | SQLAlchemy 2.0 + Flask-Migrate |
| **Auth** | Flask-JWT-Extended 4.7 |
| **RAG** | BM25 + Sentence Transformers 4.1 + FAISS 1.11 |
| **LLM** | Groq API (llama-3.3-70b-versatile) |
| **PDF** | ReportLab 5.0 (Arabic RTL + Amiri font) |
| **OCR** | Tesseract OCR (ara + fra) + PyTesseract |
| **ML** | PyTorch 2.7.1 + Transformers 4.53 |

### Frontend
| Composant | Technologie |
|---|---|
| **Framework** | React + TypeScript |
| **Server** | Nginx |
| **Build** | Multi-stage Docker build |

### DevOps
| Composant | Technologie |
|---|---|
| **Containerisation** | Docker + Docker Compose |
| **Registry** | Docker Hub |
| **VCS** | Git + GitHub |

---

## 🐳 Docker Deployment

### ⚡ Démarrage rapide (sans installation)

```bash
# 1. Cloner le repo
git clone https://github.com/AouannarDoua/LegalAI_Morocco_PFA.git
cd LegalAI_Morocco_PFA

# 2. Pull les images depuis Docker Hub
docker pull abdelghaniessabri/mizan-backend:latest
docker pull abdelghaniessabri/mizan-frontend:latest

# 3. Lancer les containers
docker compose up -d
```

### 🌐 Accès à l'application

| Service | URL |
|---|---|
| 🖥️ **Frontend (Maliyum)** | http://localhost |
| ⚡ **Backend API** | http://localhost:5000 |

### 📦 Images Docker Hub

| Image | Taille | Lien |
|---|---|---|
| `abdelghaniessabri/mizan-backend` | 3.48 GB | [Docker Hub](https://hub.docker.com/r/abdelghaniessabri/mizan-backend) |
| `abdelghaniessabri/mizan-frontend` | 21 MB | [Docker Hub](https://hub.docker.com/r/abdelghaniessabri/mizan-frontend) |

### 🔧 Commandes Docker utiles

```bash
# Voir le statut des containers
docker compose ps

# Voir les logs en temps réel
docker compose logs -f mizan-backend
docker compose logs -f mizan-frontend

# Arrêter les containers
docker compose down

# Rebuild depuis zéro
docker compose build --no-cache
docker compose up -d
```

---

## 🚀 Installation Locale (sans Docker)

### Prérequis
- Python 3.11+
- Node.js 18+
- Tesseract OCR
- Git

### Backend

```bash
# Cloner le projet
git clone https://github.com/AouannarDoua/LegalAI_Morocco_PFA.git
cd LegalAI_Morocco_PFA/backend

# Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# Lancer le backend
flask run --port=5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Structure du Projet

```
LegalAI_Morocco_PFA/
├── 🐳 docker-compose.yml
├── 📖 README.md
│
├── backend/
│   ├── 🐳 Dockerfile
│   ├── 📋 requirements.txt
│   ├── app.py                    # Flask app entry point
│   ├── fastapi_app.py            # FastAPI entry point
│   │
│   ├── routes/                   # API Routes
│   │   ├── auth.py               # JWT Authentication
│   │   ├── contracts.py          # Contract generation
│   │   └── rag.py                # RAG Q&A endpoints
│   │
│   ├── services/
│   │   ├── rag_engine.py         # BM25 + FAISS pipeline
│   │   ├── contract_generator.py # Arabic RTL PDF generation
│   │   └── ocr_service.py        # Tesseract OCR
│   │
│   ├── models/                   # SQLAlchemy models
│   ├── data/
│   │   ├── maliyum_data.json     # Legal texts (500+)
│   │   ├── ompic_companies.json  # OMPIC company data
│   │   └── tax_rates.json        # Moroccan tax rates
│   │
│   └── nginx/
│       └── nginx.conf
│
└── frontend/
    ├── 🐳 Dockerfile
    ├── src/
    │   ├── pages/                # React pages
    │   ├── components/           # UI components
    │   └── services/             # API calls
    └── public/
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register    → Inscription utilisateur
POST /api/auth/login       → Connexion + JWT token
POST /api/auth/refresh     → Refresh token
```

### RAG Juridique
```
POST /api/rag/query        → Q&A juridique (BM25 + Groq)
GET  /api/rag/documents    → Liste des documents indexés
```

### Contrats
```
POST /api/contracts/generate   → Génération contrat SARL/SNC
GET  /api/contracts/history    → Historique des contrats
GET  /api/contracts/download   → Télécharger PDF (Arabic RTL)
```

### OCR
```
POST /api/ocr/extract      → Extraction texte arabe/français
```

---

## ⚙️ Variables d'Environnement

Créer un fichier `.env` à la racine du projet:

```env
# Flask
FLASK_ENV=development
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_here

# Database
DATABASE_URL=sqlite:///maliyum.db


# Email (Flask-Mail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```


## 📄 Licence

Ce projet est développé dans le cadre d'un Projet de Fin d'Année (PFA) à **ENIADB — École Nationale de l'Intelligence Artificielle et du Digital,berkane**, Maroc.

---

<div align="center">

**⚖️ LegalAI Morocco — Maliyum**

*Rendre le droit marocain accessible à tous grâce à l'IA*

[![GitHub](https://img.shields.io/badge/GitHub-AouannarDoua%2FLegalAI_Morocco_PFA-181717?style=for-the-badge&logo=github)](https://github.com/AouannarDoua/LegalAI_Morocco_PFA)
[![Docker Hub](https://img.shields.io/badge/Docker_Hub-abdelghaniessabri-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/u/abdelghaniessabri)

</div>