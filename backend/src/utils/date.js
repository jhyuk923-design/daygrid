// events.js(Worker)와 cli.js(로컬 CLI)가 같이 쓰는 날짜 관련 유틸.
export function pad(n) {
  return String(n).padStart(2, '0');
}
