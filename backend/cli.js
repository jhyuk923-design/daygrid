#!/usr/bin/env node
// DayGrid CLI — 웹 화면 대신 터미널에서 내 일정 데이터를 읽고 다루는 얇은 진입점.
//
// 새 로직을 만들지 않는다: 이미 앱이 쓰는 로컬 D1(SQLite) 데이터를 그대로 읽고 쓴다.
// (routes/events.js의 CRUD와 같은 테이블, 같은 컬럼을 그대로 사용)
//
// 사용법:
//   node cli.js list [--date YYYY-MM-DD] [--all]
//   node cli.js add "<제목>" [--date YYYY-MM-DD] [--time HH:MM-HH:MM] [--category study|work|exercise|music|appointment|etc] [--memo "..."]
//   node cli.js done <id 앞부분>
//   node cli.js summary [--date YYYY-MM-DD]
//
// 데이터는 `wrangler dev --local`이 쓰는 로컬 D1 SQLite를 그대로 사용한다.
// (원격/실제 사용자 데이터는 건드리지 않는다 — --remote를 붙이지 않는 한 항상 로컬)

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pad } from './src/utils/date.js';

const BACKEND_DIR = dirname(fileURLToPath(import.meta.url));
// npx/wrangler.cmd 대신, 로컬에 설치된 wrangler의 JS 진입점을 node로 직접 실행한다.
// (Windows에서 .cmd 파일을 shell 없이 실행할 수 없어서 생기는 인자 이스케이프 문제를 피한다.)
const WRANGLER_BIN = join(BACKEND_DIR, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const DB_NAME = 'daygrid-db';
const CATEGORIES = ['study', 'work', 'exercise', 'music', 'appointment', 'etc'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// CLI 입력은 로컬 개발자 본인이 직접 치는 값이라도, SQL 문자열에 그대로 끼워 넣을 때는
// 작은따옴표를 이스케이프해서 SQL 문법이 깨지지 않게 한다.
function sqlStr(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function runSql(sql) {
  const out = execFileSync(
    process.execPath,
    [WRANGLER_BIN, 'd1', 'execute', DB_NAME, '--local', '--json', '--command', sql],
    { cwd: BACKEND_DIR, encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 }
  );
  const parsed = JSON.parse(out);
  // wrangler d1 execute --json은 [{results, success, meta}, ...] 형태로 반환한다.
  return parsed[0]?.results ?? [];
}

function getUser(emailArg) {
  const rows = runSql('SELECT id, name, email FROM users ORDER BY createdAt ASC;');
  if (rows.length === 0) {
    console.error('사용자가 없습니다. 먼저 웹 화면(http://127.0.0.1:8787)에서 회원가입해주세요.');
    process.exit(1);
  }
  if (emailArg) {
    const found = rows.find((u) => u.email === emailArg);
    if (!found) {
      console.error(`이메일 "${emailArg}"인 사용자를 찾을 수 없습니다.`);
      process.exit(1);
    }
    return found;
  }
  if (rows.length > 1) {
    console.error(
      `사용자가 여러 명입니다. --email <이메일>로 지정해주세요.\n` +
        rows.map((u) => `  - ${u.name} <${u.email}>`).join('\n')
    );
    process.exit(1);
  }
  return rows[0];
}

function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : 0;
}

function formatEventLine(ev) {
  const box = ev.completed ? '[x]' : '[ ]';
  const shortId = ev.id.slice(0, 8);
  const time = ev.startTime || ev.endTime ? ` ${ev.startTime || '--:--'}~${ev.endTime || '--:--'}` : '';
  const tag = `#${ev.category}`;
  return `${box} ${shortId}  ${ev.title}${time}  ${tag}`;
}

function cmdList(flags) {
  const user = getUser(flags.email);
  let where = `userId = ${sqlStr(user.id)}`;
  if (!flags.all) {
    const date = flags.date || todayStr();
    where += ` AND date = ${sqlStr(date)}`;
  }
  const rows = runSql(
    `SELECT id, title, date, startTime, endTime, category, completed FROM events WHERE ${where} ORDER BY date ASC, startTime ASC;`
  );
  if (rows.length === 0) {
    console.log(flags.all ? '등록된 일정이 없습니다.' : `${flags.date || todayStr()}에 등록된 일정이 없습니다.`);
    return;
  }
  if (flags.all) {
    let currentDate = '';
    for (const ev of rows) {
      if (ev.date !== currentDate) {
        currentDate = ev.date;
        console.log(`\n${currentDate}`);
      }
      console.log('  ' + formatEventLine(ev));
    }
  } else {
    for (const ev of rows) console.log(formatEventLine(ev));
  }
}

function cmdAdd(flags, positional) {
  const title = positional[0];
  if (!title) {
    console.error('제목이 필요합니다. 예: node cli.js add "AI 공부" --date 2026-09-10 --time 09:00-10:00 --category study');
    process.exit(1);
  }
  const category = flags.category || 'etc';
  if (!CATEGORIES.includes(category)) {
    console.error(`카테고리는 ${CATEGORIES.join('/')} 중 하나여야 합니다.`);
    process.exit(1);
  }
  const date = flags.date || todayStr();
  let startTime = null;
  let endTime = null;
  if (flags.time) {
    const [s, e] = String(flags.time).split('-');
    startTime = s || null;
    endTime = e || null;
  }
  const memo = flags.memo || '';
  const user = getUser(flags.email);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  runSql(
    `INSERT INTO events (id, userId, title, date, startTime, endTime, category, memo, completed, createdAt, updatedAt)
     VALUES (${sqlStr(id)}, ${sqlStr(user.id)}, ${sqlStr(title)}, ${sqlStr(date)}, ${sqlStr(startTime)}, ${sqlStr(endTime)}, ${sqlStr(category)}, ${sqlStr(memo)}, 0, ${sqlStr(now)}, ${sqlStr(now)});`
  );
  console.log(`추가했습니다: [ ] ${id.slice(0, 8)}  ${title}  (${date})`);
}

function cmdDone(flags, positional) {
  const idPrefix = positional[0];
  if (!idPrefix) {
    console.error('완료 처리할 일정의 id(앞 8자리)가 필요합니다. node cli.js list로 먼저 확인하세요.');
    process.exit(1);
  }
  const user = getUser(flags.email);
  const matches = runSql(
    `SELECT id, title, completed FROM events WHERE userId = ${sqlStr(user.id)} AND id LIKE ${sqlStr(idPrefix + '%')};`
  );
  if (matches.length === 0) {
    console.error(`"${idPrefix}"로 시작하는 일정을 찾을 수 없습니다.`);
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error(`id가 여러 개 일치합니다. 좀 더 자세히 입력해주세요:\n` + matches.map((m) => `  - ${m.id.slice(0, 12)}  ${m.title}`).join('\n'));
    process.exit(1);
  }
  const ev = matches[0];
  const newCompleted = ev.completed ? 0 : 1;
  const now = new Date().toISOString();
  const completedAt = newCompleted ? now : null;
  runSql(
    `UPDATE events SET completed = ${newCompleted}, completedAt = ${sqlStr(completedAt)}, updatedAt = ${sqlStr(now)} WHERE id = ${sqlStr(ev.id)};`
  );
  console.log(`${newCompleted ? '완료 처리' : '완료 취소'}했습니다: ${ev.title}`);
}

function cmdSummary(flags) {
  const date = flags.date || todayStr();
  const user = getUser(flags.email);
  const rows = runSql(
    `SELECT title, startTime, endTime, completed, completedAt FROM events WHERE userId = ${sqlStr(user.id)} AND date = ${sqlStr(date)};`
  );
  const total = rows.length;
  const completedRows = rows.filter((e) => e.completed);
  const completed = completedRows.length;
  const minutes = rows.reduce((sum, e) => sum + minutesBetween(e.startTime, e.endTime), 0);

  console.log(`${date} 요약`);
  console.log(`오늘의 일정 ${total}`);
  console.log(`완료 ${completed}`);
  console.log(`남은 일정 ${total - completed}`);
  console.log(`총 예정시간 ${minutes}분`);

  if (completed > 0) {
    console.log('\n완료한 항목:');
    for (const e of completedRows) {
      const at = e.completedAt ? new Date(e.completedAt).toTimeString().slice(0, 5) : '--:--';
      console.log(`- [x] ${e.title} (완료 ${at})`);
    }
  }
}

function main() {
  const [, , command, ...rest] = process.argv;
  const { flags, positional } = parseFlags(rest);

  switch (command) {
    case 'list':
      return cmdList(flags);
    case 'add':
      return cmdAdd(flags, positional);
    case 'done':
      return cmdDone(flags, positional);
    case 'summary':
      return cmdSummary(flags);
    default:
      console.log(
        [
          'DayGrid CLI',
          '',
          '  node cli.js list [--date YYYY-MM-DD] [--all]',
          '  node cli.js add "<제목>" [--date YYYY-MM-DD] [--time HH:MM-HH:MM] [--category study|work|exercise|music|appointment|etc] [--memo "..."]',
          '  node cli.js done <id 앞부분>',
          '  node cli.js summary [--date YYYY-MM-DD]',
          '',
          '사용자가 여러 명이면 어떤 명령에든 --email <이메일>을 붙이세요.',
        ].join('\n')
      );
  }
}

main();
