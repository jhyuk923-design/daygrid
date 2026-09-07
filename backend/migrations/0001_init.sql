-- DayGrid 초기 스키마
-- users: 회원 정보
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  salt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

-- email 로그인 조회가 매우 잦으므로 인덱스 생성 (UNIQUE 제약이 이미 인덱스를 만들지만 명시적으로 남김)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- sessions: 로그인 세션 (쿠키에 저장되는 id 값)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);

-- events: 사용자별 일정
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,          -- YYYY-MM-DD
  startTime TEXT,               -- HH:MM
  endTime TEXT,                 -- HH:MM
  category TEXT NOT NULL DEFAULT 'etc',
  memo TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- 월별 조회(userId + date 범위)가 가장 잦은 쿼리이므로 복합 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_events_userId_date ON events(userId, date);
