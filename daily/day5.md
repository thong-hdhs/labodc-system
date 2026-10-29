# Ngày D5 — Khởi tạo Nền tảng Monorepo, Docker, CI/CD & Lát cắt dọc Xác thực/Phân quyền REQ-AUTH-01 (Sinh viên A)

> **Người phụ trách:** Sinh viên A (Owner miền Shared Auth/RBAC, Enterprise, Lab Admin, System Admin, Project Lifecycle, Finance/PayOS & Hạ tầng)  
> **Giai đoạn:** Giai đoạn 1 — Nền tảng và lát cắt MVP đầu tiên (Ngày D5 / Sprint 1: D5–D10)  
> **Đầu vào:** Hồ sơ Baseline Gate D4 (`day1.md`..`day4.md`), Quyết định kiến trúc `ADR-01` (Monorepo), `ADR-02` (JWT & Server-side RBAC), `ADR-05` (Docker Compose) và Shared User/Auth Contract.  
> **Đầu ra:** Khung Monorepo (`apps/api`, `apps/web`, `packages/shared-types`), cấu hình Docker Compose & GitHub Actions CI (`REQ-INFRA-03`), Migration & Seed 6 vai trò, Vertical Slice `REQ-AUTH-01` (API + React Auth UI) và bằng chứng vượt qua bộ kiểm thử `TC-AUTH-01`, `TC-AUTH-02`.

---

## 1. Bảng Tổng hợp Hạng mục Công việc đã Hoàn thành trong Ngày D5 (Của Sinh viên A)

| Mã Req / ADR | Hạng mục công việc trong D5 | Module / Đường dẫn thuộc quyền sở hữu của A | Trạng thái hoàn thành | Mã Kiểm thử / Bằng chứng |
| :--- | :--- | :--- | :---: | :--- |
| **ADR-01**<br>**REQ-INFRA-03** | Khởi tạo cấu trúc Monorepo bằng npm workspaces tách biệt rõ miền của A và B | `package.json`, `tsconfig.base.json`, `packages/shared-types`, `apps/api`, `apps/web` | **Hoàn thành (100%)** | `npm install` & `npm run typecheck` Pass (0 errors) |
| **ADR-05**<br>**REQ-INFRA-03** | Thiết lập hạ tầng container hóa Local (PostgreSQL 16, Redis 7, Elasticsearch 8.12) & GitHub Actions CI | `docker-compose.yml`, `.github/workflows/ci.yml` | **Hoàn thành (100%)** | CI workflow lint/typecheck/test sẵn sàng |
| **REQ-AUTH-01** *(Contract & DB)* | Định nghĩa Shared Auth Contract (6 vai trò `UserRole`, `UserStatus`, `JwtPayload`) & Migration số 001 + Seed tài khoản | `packages/shared-types/src/index.ts`<br>`apps/api/src/database/migrations/001_init_auth.sql` | **Hoàn thành (100%)** | Seed tự động 6 vai trò chuẩn + 1 tài khoản `LOCKED` để test |
| **REQ-AUTH-01** *(Backend API)* | Xây dựng API Đăng nhập/Đăng xuất/Lấy hồ sơ (`/api/v1/auth/*`), `JwtAuthGuard`, `RolesGuard` và lưu vết `audit_logs` | `apps/api/src/auth/*`<br>`apps/api/src/common/guards/*` | **Hoàn thành (100%)** | Pass E2E `TC-AUTH-01` & `TC-AUTH-02` |
| **REQ-AUTH-01** *(Frontend Web)* | Xây dựng `AuthProvider`, `ProtectedRoute` chặn theo role, `LoginPage` điều hướng tự động và khung `SystemAdmin` | `apps/web/src/core/auth/*`<br>`apps/web/src/features/system-admin/*` | **Hoàn thành (100%)** | `npm run typecheck --workspace=apps/web` Pass |

---

## 2. Cấu trúc Monorepo & Ranh giới Phối hợp Đã Thiết lập (Tuân thủ `ADR-01`)

Cấu trúc thư mục thực tế sau khi hoàn thành Ngày D5 đảm bảo tách biệt hoàn toàn giữa **Sinh viên A** và **Sinh viên B**:

```text
labodc-system/
├── .github/workflows/ci.yml                 # Pipeline CI tự động kiểm tra typecheck & test (Owner: A)
├── docker-compose.yml                       # PostgreSQL 16, Redis 7, Elasticsearch 8.12 (Owner: A)
├── package.json                             # Cấu hình npm workspaces gốc (Owner: A)
├── tsconfig.base.json                       # Cấu hình TypeScript dùng chung (Owner: A)
├── packages/
│   └── shared-types/                        # Hợp đồng kiểu dữ liệu dùng chung A & B (Owner: A)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts                     # UserRole, UserStatus, JwtPayload, AuthTokensResponse
├── apps/
│   ├── api/                                 # Backend NestJS RESTful API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.js
│   │   ├── src/
│   │   │   ├── main.ts                      # Điểm khởi chạy API Server (Owner: A)
│   │   │   ├── app.module.ts                # Root Module (Owner: A)
│   │   │   ├── common/guards/
│   │   │   │   ├── jwt-auth.guard.ts        # Xác thực chữ ký & hạn dùng JWT (Owner: A)
│   │   │   │   └── roles.guard.ts           # Kiểm tra RBAC & chặn tài khoản LOCKED (Owner: A)
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts           # Module xác thực nền tảng (Owner: A)
│   │   │   │   ├── auth.service.ts          # Xử lý login, bcrypt, JWT, seed & audit log (Owner: A)
│   │   │   │   └── auth.controller.ts       # Endpoints /api/v1/auth/* (Owner: A)
│   │   │   └── talent/                      # Khu vực dành riêng cho Sinh viên B tích hợp REQ-TAL-01
│   │   └── test/
│   │       └── auth-rbac.e2e-spec.ts        # Kiểm thử tự động TC-AUTH-01 & TC-AUTH-02 (Owner: A)
│   └── web/                                 # Frontend React + Vite + TypeScript
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── App.tsx                      # Định tuyến gốc & bảo vệ route theo vai trò (Owner: A)
│           ├── core/auth/
│           │   ├── AuthContext.tsx          # Quản lý phiên đăng nhập phía Client (Owner: A)
│           │   ├── ProtectedRoute.tsx       # Chặn điều hướng trái quyền -> /403-forbidden (Owner: A)
│           │   └── LoginPage.tsx            # Giao diện đăng nhập & phân luồng 6 vai trò (Owner: A)
│           ├── features/system-admin/       # Khung màn hình System Admin (Owner: A)
│           └── features/talent/             # Khu vực dành riêng cho Sinh viên B