# DayGrid

## 개요
날짜별 일정(공부/업무/운동/음악/약속/기타)을 추가·완료·조회하는 개인 캘린더 앱.
프론트엔드는 React, 백엔드는 Cloudflare Workers + D1(SQLite)이다.

## 명령 (프로젝트 루트에서 실행)
- 목록(오늘): node backend/cli.js list
- 목록(특정 날짜): node backend/cli.js list --date 2026-09-10
- 전체 목록: node backend/cli.js list --all
- 추가: node backend/cli.js add "<제목>" --date 2026-09-10 --time 09:00-10:00 --category study
- 완료 토글: node backend/cli.js done <id 앞 8자리> (node cli.js list로 id 확인)
- 오늘 요약: node backend/cli.js summary

카테고리는 study/work/exercise/music/appointment/etc 중 하나. 사용자가 여러 명이면
위 명령 뒤에 --email <이메일>을 붙인다.

## 사전 준비 (한 번만)
CLI는 `wrangler dev --local`이 쓰는 로컬 D1 데이터를 그대로 읽고 쓴다. 아래가 먼저 되어 있어야 한다.
1. cd backend && npm install
2. npm run db:migrate:local
3. 웹 화면(npm run dev, http://127.0.0.1:8787)에서 회원가입 1회 (사용자가 하나도 없으면 CLI가 동작하지 않는다)

## 규칙
- 일정 데이터는 로컬 D1(backend/.wrangler/state)에 저장한다. UI/CLI 출력 문구는 존댓말로.
- CLI는 로컬 D1만 다룬다(--remote 없음). 실제 배포된 원격 D1 데이터는 건드리지 않는다.

## 하지 말 것
- backend/.wrangler 폴더나 로컬 D1 데이터를 직접 지우거나 덮어쓰지 말 것 (npm run db:migrate:local 외의 방식으로 스키마를 바꾸지 말 것).
- 원격(실제 배포) D1 데이터베이스에 --remote로 쓰기 작업을 하지 말 것.
