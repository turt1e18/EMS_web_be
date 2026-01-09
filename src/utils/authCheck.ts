import type { Request, Response, NextFunction } from 'express';
import { sessionConfig } from '../config/session.js';
import { checkSessionBySid } from '../user/User.Service.js';

// Request에 userId를 추가하기 위한 타입 확장
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * 세션 인증 유틸함수
 * 쿠키에서 세션 ID를 확인하고, 유효한 세션이면 req.userId에 사용자 ID를 저장
 */
export async function authCheck(req: Request, res: Response, next: NextFunction) {
  const sid = req.cookies[sessionConfig.cookieName];
  // 세션 ID가 없으면 401
  if (!sid) {
    return res.status(401).json({ ok: false, message: 'NO_SESSION' });
  }

  // 세션 상태 확인
  const sessionStatus = await checkSessionBySid(sid);
  if (sessionStatus.state === 'invalid') {
    return res.status(401).json({ ok: false, message: 'SESSION_INVALID' });
  }
  if (sessionStatus.state === 'expired') {
    return res.status(401).json({ ok: false, message: 'SESSION_EXPIRED' });
  }

  // 유효한 세션이면 userId를 req에 저장하고 다음으로
  req.userId = sessionStatus.user.id;
  next();
}
