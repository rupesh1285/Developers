<div align="center">

<h1>
  <img src="https://readme-typing-svg.demolab.com?font=Syne&weight=800&size=48&duration=3000&pause=1000&color=00D4FF&center=true&vCenter=true&width=500&height=70&lines=Finalist" alt="Finalist" />
</h1>

<p><em>Ace every coding round and become the Finalist.</em></p>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-finalist--v1.vercel.app-00D4FF?style=for-the-badge&logo=vercel&logoColor=white)](https://finalist-v1.vercel.app)
[![Interactive README](https://img.shields.io/badge/Interactive%20README-View%20Full%20Page-7C3AED?style=for-the-badge&logo=github&logoColor=white)](https://rupesh1285.github.io/Developers/)
[![GitHub Repo](https://img.shields.io/badge/Source-rupesh1285%2FDevelopers-1e2d3d?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rupesh1285/Developers)

<br/>

[![Lighthouse Performance](https://img.shields.io/badge/Performance-95-10b981?style=flat-square&logo=lighthouse&logoColor=white)](https://finalist-v1.vercel.app)
[![Lighthouse SEO](https://img.shields.io/badge/SEO-100-00D4FF?style=flat-square&logo=lighthouse&logoColor=white)](https://finalist-v1.vercel.app)
[![Lighthouse Best Practices](https://img.shields.io/badge/Best%20Practices-100-7C3AED?style=flat-square&logo=lighthouse&logoColor=white)](https://finalist-v1.vercel.app)
[![Lighthouse Accessibility](https://img.shields.io/badge/Accessibility-100-f59e0b?style=flat-square&logo=lighthouse&logoColor=white)](https://finalist-v1.vercel.app)

</div>

---

## 🧠 What is Finalist?

**Finalist** is a full-stack AI-powered competitive programming prep platform built to help developers ace DSA rounds at top companies. With 220+ curated problems, a Gemini-powered AI tutor that reads your live code, and a GitHub-style analytics dashboard — it's your personal interview weapon.

> 💡 **[View the full interactive README with animations →](https://rupesh1285.github.io/Developers/)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Tutor** | Gemini API receives full problem statement + your live code → context-aware hints |
| 📊 **Bubble Analytics** | Real-time topic mastery visualization, updates on every solve/unsolve |
| 🔥 **Activity Heatmap** | GitHub-style 16-week heatmap with color intensity scaled to daily volume |
| ⚡ **Streak System** | Day-based current + max streak tracking with midnight rollover |
| 💾 **Persistent Workspace** | Code + AI chat saved per user per problem, 1.5s debounced autosave |
| 🔐 **OAuth 2.0 + JWT** | Google & GitHub OAuth via authorization code flow + custom JWT sessions |
| 🚀 **CI/CD Pipeline** | GitHub Actions automated build + deploy on every push to main |

---

## 📊 Stats

<div align="center">

| 📚 Problems | 🔌 API Endpoints | 👥 Users | 📦 Route Modules |
|:-----------:|:----------------:|:--------:|:----------------:|
| **220+** | **25+** | **20+** | **6** |

</div>

---

## 🛠️ Tech Stack

**Frontend**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue)

**Backend**

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-FB015B?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![OAuth](https://img.shields.io/badge/OAuth_2.0-EB5424?style=for-the-badge&logo=auth0&logoColor=white)

**Database & DevOps**

![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

**AI / External**

![Gemini](https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Google](https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub_OAuth-181717?style=for-the-badge&logo=github&logoColor=white)

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   React Client  │ ◄─────► │   Express API    │ ◄─────► │  MongoDB Atlas   │
│    (Vercel)     │         │    (Render)      │         │   (Database)     │
└─────────────────┘         └──────────────────┘         └──────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
    │   Gemini API    │   │  Google OAuth    │   │  GitHub Actions  │
    │   (AI Tutor)    │   │  GitHub OAuth    │   │    (CI / CD)     │
    └─────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 🔌 API Endpoints

<details>
<summary><strong>Auth Module</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET`  | `/api/auth/google` | Initiate Google OAuth flow |
| `GET`  | `/api/auth/github` | Initiate GitHub OAuth flow |

</details>

<details>
<summary><strong>Problems Module</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/problems` | Fetch all problems with filters |
| `GET`  | `/api/problems/:id` | Get single problem |
| `PUT`  | `/api/problems/:id/solve` | Mark solved, update streak + heatmap |

</details>

<details>
<summary><strong>Analytics Module</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/analytics/heatmap` | 16-week activity data |
| `GET`  | `/api/analytics/topics` | Topic mastery bubble data |
| `GET`  | `/api/analytics/streak` | Current + max streak |

</details>

<details>
<summary><strong>AI + Workspace Module</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/hint` | Send problem + code to Gemini |
| `PUT`  | `/api/workspace/:problemId` | Autosave code (1.5s debounce) |
| `GET`  | `/api/workspace/:problemId` | Load saved workspace |

</details>

---

## 🗺️ Roadmap

### ✅ V1 — Complete
- [x] 220+ curated DSA, system design & algorithm problems
- [x] Gemini AI tutor with live code + problem context
- [x] OAuth 2.0 — Google & GitHub
- [x] 16-week GitHub-style activity heatmap
- [x] Real-time bubble chart topic analytics
- [x] Day-based streak system (current + max)
- [x] CI/CD pipeline via GitHub Actions
- [x] Lighthouse 95 · SEO 100 · Accessibility 100 · Sub-1s FCP

### 🚀 V2 — In Progress (Started May 2026)
- [ ] Code runner supporting 5+ languages
- [ ] Achievement system (XP, levels, badges)
- [ ] Streak milestone rewards
- [ ] Problem count achievements
- [ ] Smoother UI + micro-animations
- [ ] Better visibility + discoverability
- [ ] More problems across all difficulty tiers

---

## ⚙️ Local Setup

```bash
# 1. Clone
git clone https://github.com/rupesh1285/Developers.git
cd Developers

# 2. Install — Frontend
cd client && npm install

# 3. Install — Backend
cd ../server && npm install
```

Create `/server/.env`:

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GEMINI_API_KEY=your_gemini_api_key
```

```bash
# 4. Run
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

> Frontend → `http://localhost:5173` · Backend → `http://localhost:5000`

---

## 👤 Author

<div align="center">

**Rupesh Agarwal**
*IIIT Sonepat · Full-Stack Developer · Open to Opportunities*

[![GitHub](https://img.shields.io/badge/GitHub-rupesh1285-181717?style=flat-square&logo=github)](https://github.com/rupesh1285)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-rupesh--agarwal-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/rupesh-agarwal-64164228a)
[![Email](https://img.shields.io/badge/Email-rupeshagarwal728%40gmail.com-EA4335?style=flat-square&logo=gmail)](mailto:rupeshagarwal728@gmail.com)

*© 2026 Finalist · Built with obsession, shipped with pride.*

</div>
