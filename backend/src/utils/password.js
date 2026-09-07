// Cloudflare Workers의 Web Crypto API(PBKDF2)를 이용한 비밀번호 해시 유틸리티.
// 비밀번호를 평문으로 저장하지 않기 위해, 사용자마다 무작위 salt를 생성하고
// PBKDF2로 여러 번 반복 해시한 값(hash)만 DB에 저장한다.

const PBKDF2_ITERATIONS = 100000;
const HASH_BITS = 256; // 32 bytes
const SALT_BYTES = 16;

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function deriveHash(password, saltBytes) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BITS
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

// 회원가입 시 사용: 새 salt를 만들고 해시를 계산한다.
export async function hashPassword(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const salt = bytesToHex(saltBytes);
  const hash = await deriveHash(password, saltBytes);
  return { hash, salt };
}

// 로그인 시 사용: 저장된 salt로 다시 해시를 계산해 비교한다.
export async function verifyPassword(password, salt, expectedHash) {
  const saltBytes = hexToBytes(salt);
  const hash = await deriveHash(password, saltBytes);
  // 타이밍 공격을 줄이기 위해 길이가 같을 때 constant-time에 가깝게 비교
  if (hash.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

// 세션 토큰 생성용 랜덤 문자열 (충분히 예측 불가능한 값)
export function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}
