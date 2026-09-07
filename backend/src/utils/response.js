// 공통 JSON 응답 헬퍼. 어디서든 같은 형태로 응답을 내려주기 위해 사용한다.

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

export function errorResponse(message, status = 400) {
  return json({ error: message }, status);
}

// 서버 내부 오류는 상세 내용을 클라이언트에 노출하지 않는다.
export function serverError(err) {
  console.error('Internal error:', err && err.stack ? err.stack : err);
  return errorResponse('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 500);
}
