-- 완료 "시각"을 기록해 "오늘 완료한 일정"을 정확히 셀 수 있게 한다.
-- (CLI의 summary 명령이 이 컬럼 기준으로 오늘 완료 건수를 계산한다.)
ALTER TABLE events ADD COLUMN completedAt TEXT;
