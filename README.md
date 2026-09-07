# DayGrid

DayGrid는 **개인 일정과 공부 기록을 관리하는 캘린더 웹서비스**입니다.
Google Calendar처럼 월간 달력이 메인 화면에 나오고, 날짜를 클릭해서 그날의 일정(공부, 운동, 업무, 음악, 약속, 기타)을 추가·수정·완료·삭제할 수 있습니다.

이 프로젝트는 **서버 비용이 절대 발생하지 않도록** Cloudflare의 무료 플랜만으로 만들어졌습니다.

- **Frontend**: React + Vite (JavaScript, TypeScript 미사용)
- **Backend**: Cloudflare Workers (JavaScript)
- **Database**: Cloudflare D1 (SQLite 기반, Workers Free 플랜에 포함)
- **Deployment**: Cloudflare Workers 무료 플랜 하나로 프론트엔드 + 백엔드를 동시에 배포

---

## 목차

1. [DayGrid 소개](#daygrid-소개)
2. [주요 기능](#주요-기능)
3. [기술 스택](#기술-스택)
4. [폴더 구조](#폴더-구조)
5. [프론트엔드 실행 방법](#프론트엔드-실행-방법)
6. [Worker 백엔드 실행 방법](#worker-백엔드-실행-방법)
7. [D1 데이터베이스 생성 방법](#d1-데이터베이스-생성-방법)
8. [Migration 적용 방법](#migration-적용-방법)
9. [로컬 개발 방법 (전체 흐름)](#로컬-개발-방법-전체-흐름)
10. [무료 Cloudflare 배포 방법](#무료-cloudflare-배포-방법)
11. [API 목록](#api-목록)
12. [CRUD 설명](#crud-설명)
13. [인증 설명](#인증-설명)
14. [인가 설명](#인가-설명)
15. [Cookie와 Session 설명](#cookie와-session-설명)
16. [비밀번호 Hash와 Salt 설명](#비밀번호-hash와-salt-설명)
17. [환경변수 설명](#환경변수-설명)
18. [D1 데이터베이스 구조](#d1-데이터베이스-구조)
19. [보안을 위해 적용한 내용](#보안을-위해-적용한-내용)
20. [무료 운영 구조](#무료-운영-구조)
21. [Cloudflare 무료 사용량을 초과했을 때](#cloudflare-무료-사용량을-초과했을-때)
22. [과제 발표 시 설명하면 좋은 핵심 개념](#과제-발표-시-설명하면-좋은-핵심-개념)

---

## DayGrid 소개

DayGrid는 로그인한 사용자만 자신의 캘린더에 접근할 수 있는 개인용 일정 관리 서비스입니다.
회원가입 → 로그인 → 월간 캘린더에서 날짜 클릭 → 일정 추가/수정/완료/삭제 라는 흐름으로 동작하며,
모든 데이터는 실제 Cloudflare D1 데이터베이스에 저장됩니다 (localStorage나 Mock 데이터를 사용하지 않습니다).

## 주요 기능

- 이메일/비밀번호 회원가입, 로그인, 로그아웃, 로그인 상태 유지
- 월간 캘린더 UI (이전 달 / 다음 달 / 오늘 이동)
- 날짜 클릭 시 해당 날짜 일정 목록을 모달로 표시
- 일정 생성 / 조회 / 수정 / 삭제 (CRUD)
- 일정 완료 체크(토글), 완료된 일정은 취소선 표시
- 삭제 시 확인 다이얼로그
- 카테고리(공부/업무/운동/음악/약속/기타)별 색상 태그
- 카테고리 필터, 완료 상태 필터, 제목/메모 검색 (모두 프론트엔드에서 즉시 처리, 추가 API 호출 없음)
- "오늘의 일정" 카드 (총 개수 / 완료 / 남은 일정 / 총 예정 시간)
- 다른 사용자의 일정에는 절대 접근할 수 없는 서버 측 인가(authorization) 검사
- 반응형 디자인 (Desktop / Tablet / Mobile)

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 18, React Router, Vite |
| Backend | Cloudflare Workers (JavaScript, 프레임워크 없이 순수 fetch 핸들러) |
| Database | Cloudflare D1 (SQLite) |
| 인증 | Web Crypto API(PBKDF2) 해시 + HttpOnly 쿠키 기반 세션 |
| 배포 | Wrangler CLI, Cloudflare Workers 무료 플랜 |

## 폴더 구조

```
daygrid/
  frontend/                 # React + Vite 프론트엔드
    src/
      components/           # Calendar, EventModal, EventForm, TodayCard, FilterBar 등
      pages/                 # Login, Register, Dashboard
      services/api.js        # 백엔드 REST API 호출 모음
      AuthContext.jsx         # 로그인 상태 전역 관리
      ToastContext.jsx        # 성공/실패 알림 토스트
      constants.js             # 카테고리 정의 (백엔드와 값 일치)
      dateUtils.js              # 날짜 계산 유틸
      App.jsx / main.jsx / index.css
    index.html
    package.json
    vite.config.js

  backend/                  # Cloudflare Worker 백엔드
    src/
      index.js               # 진입점, 라우팅, 정적 파일 서빙
      routes/
        auth.js               # 회원가입/로그인/me/로그아웃
        events.js             # 일정 CRUD
      middleware/
        auth.js               # 쿠키 파싱, 세션 검증(인증)
      utils/
        password.js           # PBKDF2 해시/검증
        validate.js           # 서버 측 입력 검증
        response.js           # 공통 JSON 응답 헬퍼
    migrations/
      0001_init.sql           # users / sessions / events 테이블 생성
    wrangler.jsonc
    package.json

  .gitignore
  README.md
```

프론트엔드와 백엔드가 완전히 분리된 폴더 구조지만, **배포 시에는 백엔드 Worker 하나가
프론트엔드 빌드 결과물(`frontend/dist`)까지 함께 서빙**합니다. (자세한 이유는 아래 "무료 운영 구조" 참고)

---

## 프론트엔드 실행 방법

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` 에서 확인할 수 있습니다. `/api`로 시작하는 요청은 자동으로
`http://127.0.0.1:8787` (로컬 Worker)로 프록시되므로, **백엔드도 함께 실행**해야 정상 동작합니다.

프로덕션 빌드:

```bash
npm run build
```

`frontend/dist` 폴더에 정적 파일이 생성되며, 이 폴더를 백엔드 Worker가 그대로 서빙합니다.

## Worker 백엔드 실행 방법

```bash
cd backend
npm install
npm run dev
```

`wrangler dev`가 `http://127.0.0.1:8787` 에서 실행됩니다. `wrangler.jsonc`의 `assets.directory`가
`../frontend/dist`를 가리키므로, 프론트엔드를 먼저 `npm run build` 해두면 `http://127.0.0.1:8787`
하나만 열어도 화면 전체(React 앱 + API)를 확인할 수 있습니다.

## D1 데이터베이스 생성 방법

D1은 Cloudflare 계정에 연결된 실제 SQLite 데이터베이스입니다. 로컬 개발은 계정 없이도 가능하지만,
**실제 배포를 하려면** 아래 과정이 필요합니다.

```bash
cd backend
npx wrangler login          # Cloudflare 계정 로그인 (브라우저가 열립니다)
npx wrangler d1 create daygrid-db
```

명령을 실행하면 아래와 비슷한 출력이 나옵니다.

```
✅ Successfully created DB 'daygrid-db'

[[d1_databases]]
binding = "DB"
database_name = "daygrid-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

여기 나온 `database_id` 값을 `backend/wrangler.jsonc`의
`d1_databases[0].database_id` (현재 `REPLACE_WITH_YOUR_D1_DATABASE_ID`)에 붙여넣으세요.

## Migration 적용 방법

`migrations/0001_init.sql`에 users, sessions, events 테이블 생성 SQL이 들어 있습니다.

```bash
# 로컬 개발용 (내 컴퓨터의 임시 SQLite 파일에 적용)
npm run db:migrate:local

# 실제 배포용 (Cloudflare의 진짜 D1 데이터베이스에 적용)
npm run db:migrate:remote
```

`db:migrate:remote`는 `wrangler d1 create`로 만든 실제 D1 데이터베이스의 테이블을 생성하므로,
**배포 전에 반드시 한 번 실행**해야 합니다.

## 로컬 개발 방법 (전체 흐름)

두 가지 방법이 있습니다.

**방법 A — Vite 개발 서버로 실시간 편집 (추천)**

```bash
# 터미널 1
cd backend
npm run db:migrate:local   # 최초 1회
npm run dev                 # http://127.0.0.1:8787

# 터미널 2
cd frontend
npm run dev                 # http://localhost:5173
```

`http://localhost:5173` 접속. 코드를 고치면 화면이 바로 갱신됩니다(HMR).

**방법 B — 배포와 동일한 방식으로 확인**

```bash
cd frontend && npm run build
cd ../backend
npm run db:migrate:local   # 최초 1회
npm run dev                 # http://127.0.0.1:8787
```

`http://127.0.0.1:8787` 하나로 접속하면, 실제 배포와 동일하게 하나의 Worker가
프론트엔드 화면과 API를 함께 서빙하는 모습을 볼 수 있습니다.

## 무료 Cloudflare 배포 방법

1. Cloudflare 계정 생성 (무료) 후 로그인
   ```bash
   cd backend
   npx wrangler login
   ```
2. D1 데이터베이스 생성 및 `wrangler.jsonc`에 `database_id` 반영 (위 "D1 데이터베이스 생성 방법" 참고)
3. 원격 D1에 마이그레이션 적용
   ```bash
   npm run db:migrate:remote
   ```
4. 프론트엔드 빌드
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```
5. Worker 배포 (프론트엔드 dist가 함께 업로드됩니다)
   ```bash
   cd ../backend
   npm run deploy
   ```
6. 배포가 끝나면 터미널에 아래와 같은 실제 배포 URL이 출력됩니다.
   ```
   https://daygrid.<your-subdomain>.workers.dev
   ```
   이 주소로 접속하면 완성된 서비스를 인터넷 어디서나 사용할 수 있습니다.

> 커스텀 도메인을 연결하고 싶다면 Cloudflare 대시보드 → Workers & Pages → daygrid →
> Settings → Domains & Routes 에서 무료로 추가할 수 있습니다 (도메인 자체 구매 비용은 별도).

## API 목록

| Method | Path | 설명 | 인증 필요 |
|---|---|---|---|
| POST | `/api/auth/register` | 회원가입 | X |
| POST | `/api/auth/login` | 로그인 | X |
| GET  | `/api/auth/me` | 현재 로그인 사용자 조회 | O |
| POST | `/api/auth/logout` | 로그아웃 | O |
| GET  | `/api/events?year=YYYY&month=M` | 해당 월의 일정 목록 조회 | O |
| POST | `/api/events` | 일정 생성 | O |
| GET  | `/api/events/:id` | 일정 단건 조회 | O |
| PUT  | `/api/events/:id` | 일정 수정 | O |
| DELETE | `/api/events/:id` | 일정 삭제 | O |
| PATCH | `/api/events/:id/toggle` | 완료 상태 토글 | O |

응답 상태 코드는 상황에 맞게 `200 / 201 / 400 / 401 / 403(또는 404) / 404 / 409 / 500`을 사용합니다.

## CRUD 설명

- **Create**: `POST /api/events` — 로그인한 사용자의 `userId`와 함께 D1에 `INSERT`
- **Read**: `GET /api/events?year=&month=` — 해당 사용자, 해당 월의 데이터만 `SELECT` (전체 테이블을 읽지 않음)
- **Update**: `PUT /api/events/:id` — 소유자 확인 후 `UPDATE`
- **Delete**: `DELETE /api/events/:id` — 소유자 확인 후 `DELETE` (프론트엔드에서 삭제 전 확인 모달 표시)
- **Toggle**: `PATCH /api/events/:id/toggle` — `completed` 값을 0/1로 반전

모든 쓰기 작업은 D1의 [prepared statement](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
(`.bind()`)를 사용해 SQL Injection을 방지합니다.

## 인증 설명

**인증(Authentication)** = "이 사용자가 누구인가?"를 확인하는 절차입니다.

1. 로그인 시 이메일로 사용자를 찾고, 저장된 salt로 입력한 비밀번호를 다시 해시해 비교합니다.
2. 일치하면 무작위 32바이트 세션 토큰을 생성해 `sessions` 테이블에 저장하고,
   같은 값을 `HttpOnly` 쿠키로 브라우저에 내려줍니다.
3. 이후 요청마다 쿠키의 세션 토큰으로 `sessions` 테이블을 조회해 로그인 여부와 사용자를 판별합니다
   (`backend/src/middleware/auth.js`의 `getCurrentUser`).
4. 세션이 없거나 만료되었으면 `401 Unauthorized`를 반환합니다.

## 인가 설명

**인가(Authorization)** = "이 사용자가 이 데이터에 접근할 권한이 있는가?"를 확인하는 절차입니다.
DayGrid에서 가장 중요하게 다룬 부분입니다.

- 모든 일정 API는 인증된 `user.id`를 알고 있는 상태에서 실행됩니다.
- 일정 조회/수정/삭제 쿼리는 항상 `WHERE id = ? AND userId = ?` 형태로 작성해,
  DB 레벨에서부터 다른 사용자의 데이터가 조회되지 않도록 합니다 (`backend/src/routes/events.js`).
- 예를 들어 A 사용자가 로그인한 상태로 B 사용자의 일정 id를 직접 호출해도
  (`GET/PUT/DELETE /api/events/25`), 쿼리 조건에 `userId = A.id`가 포함되므로
  결과가 없어 **`404 Not Found`**를 반환합니다. (존재 여부 자체를 숨겨서 정보 노출을 최소화하는 설계입니다.)

## Cookie와 Session 설명

- 로그인 성공 시 서버가 `Set-Cookie: daygrid_session=...` 헤더를 내려줍니다.
- 쿠키 옵션:
  - `HttpOnly` — JavaScript(`document.cookie`)로 값을 읽을 수 없어 XSS 공격으로부터 세션을 보호합니다.
  - `SameSite=Lax` — 다른 사이트에서의 요청 위조(CSRF)를 기본적으로 방지합니다.
  - `Secure` — HTTPS 요청일 때만 자동으로 추가됩니다. (로컬 `http://localhost` 개발 환경에서는
    빠지고, 실제 배포 환경(HTTPS)에서는 자동으로 붙습니다. `backend/src/middleware/auth.js`의
    `isHttps()`가 요청 프로토콜을 보고 판단합니다.)
- 세션 데이터 자체(토큰 ↔ userId ↔ 만료 시각)는 `sessions` 테이블에 저장되고,
  쿠키에는 조회용 토큰 값만 담깁니다 (세션 하이재킹 시 피해 범위를 최소화).
- 로그아웃하면 `sessions` 테이블에서 해당 행을 삭제하고, 쿠키도 `Max-Age=0`으로 즉시 만료시킵니다.
- 세션은 7일 뒤 자동 만료되며(`SESSION_TTL_DAYS` 환경변수), 만료된 세션으로 요청이 오면
  서버가 그 자리에서 삭제하고 401을 반환합니다.

## 비밀번호 Hash와 Salt 설명

- 비밀번호는 **절대 평문으로 저장하지 않습니다.**
- Cloudflare Workers에서 기본 제공하는 **Web Crypto API의 PBKDF2**를 사용합니다
  (`backend/src/utils/password.js`).
- 가입 시:
  1. `crypto.getRandomValues()`로 16바이트 무작위 salt 생성 (사용자마다 다름)
  2. `PBKDF2 + SHA-256, 100,000회 반복`으로 비밀번호를 해시
  3. `passwordHash`와 `salt`를 각각 DB에 저장 (원본 비밀번호는 어디에도 저장되지 않음)
- 로그인 시: 입력한 비밀번호 + 저장된 salt로 동일한 방식으로 다시 해시해서, 저장된 해시와 비교합니다.
- salt를 사용자마다 다르게 하는 이유: 같은 비밀번호를 쓰는 두 사용자의 해시값이 달라지도록 해서,
  미리 계산된 해시표(레인보우 테이블) 공격을 무력화하기 위함입니다.
- API 응답에는 `passwordHash`, `salt`가 절대 포함되지 않습니다 (SELECT 컬럼을 명시적으로 제한).

## 환경변수 설명

| 변수 | 위치 | 용도 |
|---|---|---|
| `SESSION_TTL_DAYS` | `wrangler.jsonc`의 `vars` | 로그인 세션 유효 기간(일). 민감정보가 아니므로 평문 변수로 관리 |
| `DB` | `wrangler.jsonc`의 `d1_databases` 바인딩 | D1 데이터베이스 연결 (코드에서 `env.DB`로 접근) |
| `ASSETS` | `wrangler.jsonc`의 `assets` 바인딩 | 빌드된 프론트엔드 정적 파일 서빙용 |

- 이 프로젝트는 외부 유료 API를 쓰지 않으므로 **비밀 API 키가 필요 없습니다.**
- 만약 나중에 진짜 비밀값(예: 이메일 발송 API 키 등)이 필요해진다면
  `npx wrangler secret put KEY_NAME` 명령으로 등록하고, 코드에서는 동일하게 `env.KEY_NAME`으로
  읽으면 됩니다. **Secret은 `wrangler.jsonc`나 Git 저장소에 절대 직접 적지 않습니다.**
- `.gitignore`에 `.env`, `.wrangler/`, `node_modules/`, `dist/`를 포함해 민감정보/빌드 산출물이
  Git에 올라가지 않도록 했습니다.

## D1 데이터베이스 구조

```sql
users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,       -- idx_users_email
  passwordHash TEXT NOT NULL,
  salt TEXT NOT NULL,
  createdAt TEXT NOT NULL
)

sessions (
  id TEXT PRIMARY KEY,              -- 쿠키에 저장되는 값
  userId TEXT NOT NULL,             -- idx_sessions_userId
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
)

events (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,             -- idx_events_userId_date (userId, date)
  title TEXT NOT NULL,
  date TEXT NOT NULL,               -- YYYY-MM-DD
  startTime TEXT,                   -- HH:MM
  endTime TEXT,                     -- HH:MM
  category TEXT NOT NULL,           -- study/work/exercise/music/appointment/etc
  memo TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```

`events(userId, date)` 복합 인덱스 덕분에 "이 사용자의 이 달 일정"을 조회하는
가장 빈번한 쿼리가 전체 테이블을 스캔하지 않고 인덱스만으로 빠르게 처리됩니다.

## 보안을 위해 적용한 내용

- 모든 입력값을 프론트엔드뿐 아니라 **백엔드에서도 다시 검증** (`backend/src/utils/validate.js`)
- 모든 SQL 쿼리에 **parameterized query**(`.bind()`) 사용 → SQL Injection 방지
- 비밀번호는 **PBKDF2 + 사용자별 random salt**로 해시 후 저장
- 세션 토큰은 **32바이트 암호학적 난수** (`crypto.getRandomValues`)
- 세션 쿠키에 **HttpOnly, SameSite=Lax, (배포 시) Secure** 적용
- 모든 일정 API에서 **인가(userId 일치) 검사**, 다른 사용자의 데이터 접근 차단
- API 응답에 `passwordHash`, `salt` 등 **민감정보 절대 미포함**
- 로그인 필요한 요청에 세션이 없거나 만료되면 **401**, 남의 데이터 접근 시 **404**
- 로그아웃 시 서버의 세션 레코드 삭제 + 쿠키 즉시 만료
- 서버 내부 오류(DB 에러 스택 등)는 클라이언트에 그대로 노출하지 않고
  `"서버 오류가 발생했습니다"` 같은 일반 메시지 + `500`만 반환 (`backend/src/utils/response.js`)

## 무료 운영 구조

- **하나의 Cloudflare Worker가 프론트엔드(React 빌드 결과물)와 백엔드(API)를 함께 서빙**합니다.
  `wrangler.jsonc`의 `assets` 기능으로 `frontend/dist`를 Worker에 바인딩했습니다.
  - 장점 1: 배포가 `wrangler deploy` 한 번으로 끝납니다 (Pages를 따로 운영할 필요 없음).
  - 장점 2: 프론트엔드와 API가 **완전히 같은 도메인**이라서 CORS 설정이나 크로스 사이트
    쿠키 문제가 아예 발생하지 않습니다.
- **월간 데이터만 조회**: 캘린더가 한 달을 보여줄 때 `GET /api/events?year=&month=` 요청 **1번**으로
  그 달의 데이터를 모두 가져옵니다. 날짜별로 30번씩 요청하지 않습니다.
- **검색/필터는 프론트엔드에서 처리**: 카테고리 필터, 완료 상태 필터, 검색어는 이미 받아온
  월간 데이터 안에서 자바스크립트로 걸러내며, 추가 API 호출을 하지 않습니다.
- **인덱스**: `events(userId, date)` 복합 인덱스로 월별 조회가 인덱스 스캔만으로 처리됩니다.
- **불필요한 재요청 방지**: React 상태 업데이트로 화면을 갱신하고, 달(month)이 바뀔 때만
  새로 API를 호출합니다. 일정 생성/수정/삭제/토글 후에는 전체를 다시 불러오지 않고
  응답값으로 로컬 상태만 갱신합니다.
- **이미지/파일 업로드, WebSocket, 외부 유료 API를 전혀 사용하지 않습니다.**
- Cloudflare D1과 Workers는 사용량이 무료 한도를 넘으면 **요청이 실패할 뿐, 자동으로
  과금되는 유료 플랜으로 전환되지 않습니다.**

## Cloudflare 무료 사용량을 초과했을 때

Cloudflare Workers Free / D1 Free 플랜은 아래와 같은 일일 한도를 가집니다 (2026년 기준, 실제 수치는
[Cloudflare 공식 문서](https://developers.cloudflare.com/d1/platform/pricing/)에서 최신 값을 확인하세요).

| 항목 | 무료 한도 (대략) |
|---|---|
| Workers 요청 수 | 1일 100,000 요청 |
| D1 읽기(row read) | 1일 500만 행 |
| D1 쓰기(row write) | 1일 10만 행 |
| D1 저장 용량 | 총 5GB |

- 이 한도를 초과하면 **초과분 요청/쿼리가 실패**하고(예: 429/500 계열 오류), **자동으로 유료
  요금이 청구되지 않습니다.** DayGrid는 결제 수단을 등록하지 않은 무료 Cloudflare 계정으로도
  동작하도록 설계되었습니다.
- 개인 과제/포트폴리오 수준의 트래픽(하루 수십~수백 회 접속)에서는 이 한도에 도달할 가능성이
  거의 없습니다. 위 "무료 운영 구조"에서 설명한 최적화(월 단위 조회, 프론트 필터링, 인덱스 사용)
  덕분에 요청당 DB 사용량도 최소화되어 있습니다.

## 과제 발표 시 설명하면 좋은 핵심 개념

1. **아키텍처 흐름**
   ```
   사용자
     ↓
   React Frontend (Vite로 빌드된 정적 파일)
     ↓ fetch (JSON)
   REST API (/api/...)
     ↓
   Cloudflare Worker Backend (src/index.js가 라우팅)
     ↓
   입력값 검증 (utils/validate.js)
     ↓
   인증 확인 (미들웨어: 쿠키 → sessions 테이블 → userId)
     ↓
   인가 확인 (쿼리 조건에 userId 포함)
     ↓
   Cloudflare D1 Database (prepared statement로 SQL 실행)
     ↓
   JSON 응답
     ↓
   React 상태(state) 업데이트
     ↓
   캘린더 UI 갱신
   ```

2. **일정 추가가 실제로 동작하는 과정** (예: 9월 10일에 "AI 공부" 추가)
   - 사용자가 9월 10일 셀을 클릭 → `EventModal`이 열리고 "일정 추가" 클릭
   - `EventForm`에 제목/시간/카테고리 입력 후 저장
   - 프론트엔드가 `POST /api/events`로 JSON을 전송 (`credentials: 'include'`로 쿠키도 함께 전송)
   - Worker가 쿠키의 세션으로 로그인 여부 확인 (인증)
   - `validateEventInput()`으로 서버 측 재검증
   - `INSERT INTO events (...)` 실행 (D1, parameterized query)
   - `201 Created` + 생성된 일정 JSON 반환
   - React가 응답을 받아 로컬 상태(`events`)에 추가 → 캘린더에 즉시 "AI 공부" 카드가 표시됨
     (다시 서버에 목록을 요청하지 않고 화면만 갱신 → 무료 사용량 절약)

3. **인증 vs 인가 차이**를 코드로 설명할 수 있습니다.
   - 인증: `middleware/auth.js`의 `getCurrentUser()` — "쿠키의 세션이 유효한 사용자인가?"
   - 인가: `routes/events.js`의 모든 쿼리에 있는 `AND userId = ?` — "이 사용자가 이 자원의
     소유자인가?" 인증에 성공해도 인가가 실패하면 접근이 차단됩니다.

4. **왜 하나의 Worker로 프론트+백엔드를 같이 서빙했는가** — CORS/쿠키 문제를 원천적으로
   없애고, 배포를 단순화하며, 여전히 Workers Free 플랜 범위 안에서 동작하기 때문입니다.

5. **비밀번호를 안전하게 저장하는 방법** — 평문 저장의 위험성, 단방향 해시, salt를 쓰는 이유,
   PBKDF2의 반복 횟수가 왜 무차별 대입 공격을 어렵게 만드는지 설명할 수 있습니다.
