// 세션 정보
export const sessionConfig = {
  cookieName: 'sid',
  expireMs: 10 * 60 * 1000, // 10분 : 세션유효기간
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 10 * 60 * 1000, // 10분 : 쿠키 유효기간
  } as const,
};
