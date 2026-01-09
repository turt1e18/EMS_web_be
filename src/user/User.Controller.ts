import type { Request, Response } from 'express';
import { UserBody } from '../types/User.Type.js';
import { sessionConfig } from '../config/session.js';
import { loginService, logoutService, checkSessionBySid } from './User.Service.js';

/**
 * 로그인 컨트롤러
 */
export async function loginController(req: Request, res: Response) {
  try {
    const userInputData = UserBody.parse(req.body); // zod로 검증한 입력값을 유저인풋데이터로 활용
    const serviceResponse = await loginService(userInputData); //service레이어 로그인 처리 (리턴값 -> serviceResponse에 저장)
    if (!serviceResponse.ok) {
      return res
        .status(400)
        .json({ ok: false, user: serviceResponse.user, message: serviceResponse.message });
    }

    // 로그인처리가 잘 됐을 시 -> serviceResponse에 세션,쿠키 정보가 담겨옴 -> 해당 정보 이용해 쿠키 굽고 클라이언트로 전송
    res.cookie(sessionConfig.cookieName, serviceResponse.session.session_id, sessionConfig.cookie);

    console.log(`login success!`); // 테스트로그
    console.log(
      `session info :  ` + sessionConfig.cookieName + `-` + serviceResponse.session.session_id
    ); // 테스트로그

    return res
      .status(200)
      .json({ ok: true, user: serviceResponse.user, message: serviceResponse.message });
  } catch (error) {
    console.error('UNKNOWN_ERROR: ' + error);
    return res
      .status(400)
      .json({ ok: false, user: req.body?.email ?? null, message: 'LOGIN_FAILED' });
  }
}

/**
 * 로그아웃 컨트롤러
 */
export async function logoutController(req: Request, res: Response) {
  try {
    console.log('logout called');
    // 1) 쿠키에서 세션ID(sid) 꺼내기
    const sid = req.cookies['sid'];
    console.log(`sid to remove : `, sid); // 테스트로그

    // 쿠키에 세션이 없으면 -> 이미 로그아웃 상태로 보고 400 리턴
    if (!sid) {
      console.log('sid not found, already logged out: ' + sid); // 테스트로그
      return res.status(400).json({ ok: false, message: 'ALREADY_LOGOUT' });
    }

    // 서비스 레이어 호출해서 세션 정리
    await logoutService(sid);
    console.log('logout success!');
    // 응답
    return res.status(200).json({ ok: true, message: 'LOGOUT_SUCCESS' });
  } catch (error) {
    console.error('UNKNOWN_ERROR: ' + error);
    return res.status(500).json({ ok: false, message: 'LOGOUT_FAILED' });
  }
}

/**
 * 세션 확인 컨트롤러
 */
export async function checkSessionController(req: Request, res: Response) {
  try {
    console.log('check session called');
    // 쿠키에서 sid 존재 찾기 -> 쿠키가 없으면 NOT_SID 응답
    const sid = (req as any).cookies?.[sessionConfig.cookieName];
    if (!sid) {
      return res.status(400).json({ ok: false, message: 'NOT_SID' });
    }

    // 세션 존재시 -> 쿠키에 담긴 세션ID로 세션상태 확인하기
    const check = await checkSessionBySid(sid);

    // 세션상태 : valid 일시 -> 유저정보 응답
    if (check.state === 'valid') {
      return res.status(200).json({ ok: true, message: 'SESSION_VALID' });
    }

    // 세션상태 : expired 일시 -> SESSION_EXPIRED 응답
    if (check.state === 'expired') {
      return res.status(400).json({ ok: false, message: 'SESSION_EXPIRED' });
    }
    // 세션상태 : 세션없을 시 UNAUTHORIZED 응답
    return res.status(400).json({ ok: false, message: 'UNAUTHORIZED' });
  } catch (error) {
    console.error('UNKNOWN_ERROR: ' + error);
    return res.status(500).json({ ok: false, message: 'CHECK_SESSION_FAILED' });
  }
}
