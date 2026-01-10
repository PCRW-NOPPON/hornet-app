# 🐝 Hornet AI - System Analysis Report

> **Principal Engineer + DevOps Architect + System Analyst**
> **Analysis Date:** January 2026
> **Version:** 1.0

---

## Table of Contents

1. [Problem Understanding](#1-problem-understanding)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Workflow / State Machine Analysis](#3-workflow--state-machine-analysis)
4. [Data Structure / Schema Review](#4-data-structure--schema-review)
5. [Code Implementation Review](#5-code-implementation-review)
6. [DevOps / Deployment Plan](#6-devops--deployment-plan)
7. [Security & Reliability](#7-security--reliability)
8. [Risk / Trade-off Analysis](#8-risk--trade-off-analysis)
9. [Recommendations & Next Steps](#9-recommendations--next-steps)

---

## 1. Problem Understanding

### 1.1 System Objectives

**Hornet AI** is a Thai legal case management system for police officers that combines:
- Case CRUD operations with people/party management
- OCR document processing (Thai + English)
- AI-powered data extraction using Google Gemini
- PDF report generation for legal documents

### 1.2 Critical Issues Identified

| Category | Issue | Severity | Impact |
|----------|-------|----------|--------|
| **Security** | API keys stored in plaintext localStorage | 🔴 Critical | Data breach risk |
| **Security** | XSS vulnerability in Layout.jsx (dangerouslySetInnerHTML) | 🔴 Critical | Code injection |
| **Security** | No authentication/authorization | 🔴 Critical | Unauthorized access |
| **Data** | localStorage-only storage | 🔴 Critical | Data loss risk |
| **Functional** | Delete button doesn't work | 🟠 High | User frustration |
| **Functional** | Search/filter not implemented | 🟠 High | Unusable at scale |
| **Architecture** | No backend API | 🟠 High | Multi-user impossible |
| **Operations** | No logging/monitoring | 🟠 High | Debugging impossible |
| **Quality** | No tests | 🟡 Medium | Regression risk |

### 1.3 Pain Points for Production

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DATA LOSS: localStorage cleared = all cases lost            │
│ 2. SINGLE USER: No multi-user support                          │
│ 3. NO AUDIT: Cannot track who modified what                    │
│ 4. API KEY EXPOSED: Visible in browser DevTools                │
│ 5. PDF BROKEN: jsPDF doesn't support Thai fonts                │
│ 6. NO BACKUP: No export/import functionality                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture Overview

### 2.1 Current Architecture (Client-Only)

```
┌────────────────────────────────────────────────────────────┐
│                    Browser (SPA)                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  React Components → Context API → localStorage       │  │
│  │                          ↓                           │  │
│  │  External APIs: Gemini (direct), Tesseract (WASM)   │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 2.2 Proposed Architecture (Production)

```
┌───────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                  │
│  React SPA + Zustand + React Query                                │
└─────────────────────────┬─────────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼─────────────────────────────────────────┐
│                     API GATEWAY (Nginx/Kong)                      │
│  Rate Limiting • SSL • Load Balancing • Auth Validation           │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────────────┐
│                      BACKEND (Node.js/Fastify)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Auth Module  │  │ Case Module  │  │ AI Proxy Module      │    │
│  │ JWT + RBAC   │  │ CRUD + Valid │  │ Secure API Key Store │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────────────┐
│                       DATA LAYER                                   │
│  PostgreSQL (Primary) • Redis (Cache) • S3 (Documents)            │
└───────────────────────────────────────────────────────────────────┘
```

### 2.3 Design Anti-patterns Found

| Pattern | Location | Problem |
|---------|----------|---------|
| God Context | `CaseContext.jsx` | Does everything: state, persistence, logic |
| Direct API from UI | `CaseCollect.jsx:78` | AI API called directly from component |
| XSS Vulnerable | `Layout.jsx:19` | `dangerouslySetInnerHTML` |
| Magic Strings | Throughout | Status, types as hardcoded Thai strings |
| Dead Code | `CaseData.jsx:108` | Delete button has no handler |

---

## 3. Workflow / State Machine Analysis

### 3.1 Current State (Implicit)

```
CREATE → DRAFT → ??? (no transitions defined)
```

**Problems:**
- No explicit state machine
- Status stored as arbitrary string
- No validation of state transitions
- No workflow enforcement

### 3.2 Proposed State Machine

```
                    ┌───────────────┐
                    │    DRAFT      │
                    │  (editable)   │
                    └───────┬───────┘
                  submit()  │ (requires: ≥1 person, ≥1 doc)
                            ▼
┌────────────┐      ┌────────────────┐
│  REJECTED  │◀─────│  IN_REVIEW     │
│            │reject│  (locked)      │
└──────┬─────┘      └────────┬───────┘
       │                     │ approve()
revise()│                    ▼
       │           ┌─────────────────┐
       └──────────▶│   APPROVED      │
                   │   (finalized)   │
                   └────────┬────────┘
                            │ archive()
                            ▼
                   ┌─────────────────┐
                   │   ARCHIVED      │
                   │   (read-only)   │
                   └─────────────────┘
```

---

## 4. Data Structure / Schema Review

### 4.1 Current Issues

| Field | Problem | Solution |
|-------|---------|----------|
| `id` | `Date.now()` - collision risk | UUID v4 |
| `createdAt` | Buddhist era string | ISO 8601 timestamp |
| `lastEdit` | Human-readable string | ISO 8601 timestamp |
| `status` | Magic string | Enum constant |
| `people[].type` | Thai string | Enum constant |

### 4.2 Missing Fields

- **Audit Fields**: `createdBy`, `updatedBy`, `deletedAt`
- **Workflow Fields**: `submittedAt`, `approvedAt`, `reviewedBy`
- **Security Fields**: Encrypted `nationalId`

### 4.3 Proposed Schema

See `docs/DATABASE_SCHEMA.md` for complete Prisma schema.

---

## 5. Code Implementation Review

### 5.1 Critical Fixes Made

#### Fix 1: XSS Vulnerability (Layout.jsx)
```jsx
// ❌ BEFORE - Dangerous
dangerouslySetInnerHTML={{ __html: breadcrumb.replace(...) }}

// ✅ AFTER - Safe
{breadcrumbs.map(crumb => (
  <Link to={crumb.path}>{crumb.label}</Link>
))}
```

#### Fix 2: Dead Delete Button (CaseData.jsx)
```jsx
// ❌ BEFORE - No handler
<button className="btn btn-danger-outline">ลบข้อมูล</button>

// ✅ AFTER - With confirmation
<button onClick={() => setShowDeleteConfirm(true)}>
  <Trash2 /> ลบบุคคลนี้
</button>
```

#### Fix 3: ID Collision (Dashboard.jsx)
```jsx
// ❌ BEFORE - Collision risk
const newId = `NEW-${Date.now()}`;

// ✅ AFTER - UUID
import { generateUUID } from '../shared/utils';
const newId = generateUUID();
```

### 5.2 New File Structure

```
src/
├── features/           # Feature modules
│   ├── cases/
│   │   ├── context/    # CaseContext (refactored)
│   │   └── pages/      # CaseData (refactored)
│   ├── ai/
│   │   └── services/   # aiService (refactored)
│   └── documents/
│       └── services/   # ocrService (refactored)
│
├── shared/             # Shared code
│   ├── constants/      # Enums, magic values
│   ├── utils/          # Helpers, formatters
│   ├── hooks/          # useLocalStorage
│   └── components/
│       ├── ErrorBoundary.jsx
│       └── Layout/     # XSS-safe Layout
```

---

## 6. DevOps / Deployment Plan

### 6.1 CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
Pipeline:
  1. Quality Gate → ESLint, Security Audit
  2. Test → Unit tests, Coverage
  3. Build → Vite production build
  4. Docker → Multi-stage build, Push to GHCR
  5. Deploy Staging → develop branch
  6. Deploy Production → release tags
```

### 6.2 Environment Strategy

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Development | feature/* | localhost:3000 | Local development |
| Staging | develop | staging.hornet.com | QA testing |
| Production | main/tags | hornet.com | Live system |

### 6.3 Docker Configuration

- **Multi-stage build**: Node.js builder → Nginx production
- **Non-root user**: Security hardening
- **Health checks**: `/health` endpoint
- **Security headers**: CSP, XSS protection, etc.

### 6.4 Rollback Strategy

```bash
# Quick rollback using Docker tags
docker pull ghcr.io/org/hornet:v1.0.0  # Previous version
docker-compose up -d

# Or using Git tags
git checkout v1.0.0
npm ci && npm run build
```

---

## 7. Security & Reliability

### 7.1 Security Vulnerabilities Fixed

| Vulnerability | Status | Solution |
|---------------|--------|----------|
| XSS in breadcrumbs | ✅ Fixed | Removed dangerouslySetInnerHTML |
| API key in localStorage | ⚠️ Mitigated | Added warnings, needs backend proxy |
| No input validation | ✅ Fixed | Added validation utilities |
| No rate limiting | 📋 Planned | Nginx rate limiting configured |

### 7.2 Security Recommendations

1. **API Key Management**: Move to backend with encrypted storage
2. **Authentication**: Implement JWT + RBAC
3. **Input Validation**: Server-side validation required
4. **Encryption**: Encrypt sensitive data (national IDs)
5. **Audit Logging**: Log all data access and modifications

### 7.3 Monitoring Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                         │
├─────────────────────────────────────────────────────────────┤
│  Logs      → Winston + Loki/ELK                            │
│  Metrics   → Prometheus + Grafana                          │
│  Errors    → Sentry                                        │
│  Uptime    → Health checks + PagerDuty                     │
│  APM       → New Relic / Datadog                           │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Reliability Measures

- **Error Boundaries**: React error boundary added
- **Graceful Degradation**: Service failures handled
- **Retry Logic**: Exponential backoff for API calls
- **Data Backup**: localStorage sync + export option

---

## 8. Risk / Trade-off Analysis

### 8.1 Current Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss (localStorage) | High | Critical | Backend + DB migration |
| API key theft | Medium | High | Backend proxy |
| XSS attack | Low (fixed) | Critical | Input sanitization |
| Service downtime | Medium | High | Health checks + alerts |

### 8.2 Trade-offs of Proposed Changes

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| Add backend | Multi-user, security | Complexity, hosting cost |
| Use TypeScript | Type safety | Learning curve, migration effort |
| Add PostgreSQL | Reliability, queries | Infrastructure, maintenance |
| Docker deployment | Consistency | Docker knowledge required |

### 8.3 What NOT to Do

❌ **Don't** keep API keys in frontend localStorage
❌ **Don't** use `dangerouslySetInnerHTML` with user data
❌ **Don't** store sensitive data unencrypted
❌ **Don't** deploy without health checks
❌ **Don't** skip error boundaries

---

## 9. Recommendations & Next Steps

### 9.1 Quick Wins (Week 1-2)

- [x] Fix XSS vulnerability
- [x] Add error boundary
- [x] Add constants for magic strings
- [x] Fix delete button functionality
- [x] Add input validation utilities
- [x] Create Docker configuration
- [x] Set up CI/CD pipeline

### 9.2 Short-term (Month 1)

- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Implement search and filter functionality
- [ ] Add export/import data feature
- [ ] Fix PDF Thai font support (use pdf-lib with Thai font)
- [ ] Add basic error reporting (Sentry)

### 9.3 Medium-term (Month 2-3)

- [ ] Develop backend API (Node.js/Fastify)
- [ ] Implement PostgreSQL database
- [ ] Add user authentication (JWT)
- [ ] Migrate from localStorage to API
- [ ] Add audit logging

### 9.4 Long-term (Month 4+)

- [ ] Implement RBAC (role-based access)
- [ ] Add real-time collaboration
- [ ] Multi-tenant architecture
- [ ] Advanced AI features
- [ ] Mobile application

### 9.5 Priority Matrix

```
                    IMPACT
                HIGH         LOW
         ┌──────────────┬──────────────┐
    HIGH │ 1. Backend   │ 4. Tests     │
EFFORT   │ 2. Auth      │ 5. Export    │
         ├──────────────┼──────────────┤
    LOW  │ 3. XSS fix ✓ │ 6. UI polish │
         │    Delete ✓  │              │
         └──────────────┴──────────────┘
```

---

## Appendix

### A. Files Created/Modified

| File | Type | Description |
|------|------|-------------|
| `src/shared/constants/index.js` | New | Centralized constants |
| `src/shared/utils/index.js` | New | Utility functions |
| `src/shared/hooks/useLocalStorage.js` | New | Storage hook |
| `src/shared/components/ErrorBoundary.jsx` | New | Error boundary |
| `src/shared/components/Layout/*` | New | XSS-safe layout |
| `src/features/cases/context/CaseContext.jsx` | New | Refactored context |
| `src/features/cases/pages/CaseData.jsx` | New | Fixed delete |
| `src/features/ai/services/aiService.js` | New | AI service |
| `src/features/documents/services/ocrService.js` | New | OCR service |
| `Dockerfile` | New | Production container |
| `docker-compose.yml` | New | Orchestration |
| `docker/nginx.conf` | New | Nginx config |
| `.github/workflows/ci-cd.yml` | New | CI/CD pipeline |
| `.env.example` | New | Environment template |

### B. Technology Recommendations

| Category | Current | Recommended |
|----------|---------|-------------|
| State | Context API | Zustand + React Query |
| Types | JavaScript | TypeScript |
| Testing | None | Vitest + Testing Library |
| CSS | Global CSS | Tailwind CSS |
| Forms | Manual | React Hook Form + Zod |
| Backend | None | Fastify + Prisma |
| Database | localStorage | PostgreSQL |
| Cache | None | Redis |
| Auth | None | Lucia Auth / NextAuth |

---

**Report Generated:** January 2026
**Analyst:** AI Principal Engineer
**Status:** Ready for Review
