import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { LoginDto, LoginResult, SessionCheckResult, SessionInfo } from '../types/User.Type.js';
import { sessionConfig } from '../config/session.js';
import {
  findUserByEmail,
  findUserBySessionId,
  updateSession,
  clearSession,
} from './User.Repository.js';

/**
 * 로그인 서비스 함수
 * @param userInputData 유저 입력 데이터 (email, password)
 * @returns LoginResult
 */
export async function loginService(userInputData: LoginDto): Promise<LoginResult> {
  try {
    //입력받은 이메일로 유저 찾고 없으면 false 반환
    const user = await findUserByEmail(userInputData.email);
    console.log('[service] user data received : \n', user); // 테스트로그
    if (user == null) {
      console.log('[service] user not found, input email : ', userInputData.email); // 테스트로그
      return {
        ok: false,
        user: { email: userInputData.email },
        message: 'LOGIN_FAILED_USER_NOT_FOUND',
      };
    }
    // 입력받은 비밀번호를 DB에 저장된 password_hash와 비교해서 다르면 false반환
    const pwCompare = await bcrypt.compare(userInputData.password, user.password_hash); //입력받은 비밀번호와 DB에 해시된 비밀번호를 비교 (return : boolean)
    if (!pwCompare) {
      //비밀번호가 맞지 않으면 콘솔에러 -> false 리턴
      console.log('[SERVICE] PASSWORD_MISMATCH : ' + userInputData.password); // 테스트로그
      return {
        ok: false,
        user: { email: user.email },
        message: 'LOGIN_FAILED_PASSWORD_MISMATCH',
      };
    }

    // 이메일과 비밀번호가 모두 맞을경우 -> 세션ID 생성, 만료시간 설정
    const sid = randomBytes(32).toString('base64url'); // 세션ID
    const expiresAt = new Date(Date.now() + sessionConfig.expireMs); // 만료시간 (@/config/session.ts)
    await updateSession(user.id, sid, expiresAt); // 레포지토리 -> 세션갱신

    console.log('[SERVICE] SESSION_CREATED : ' + sid); // 테스트로그

    return {
      // 세션생성 성공 -> 유저정보, 세션정보 리턴
      ok: true,
      user: { email: user.email, level: user.user_level },
      session: {
        session_id: sid,
        session_expires_at: expiresAt,
      } satisfies SessionInfo,
      message: 'LOGIN_SUCCESS',
    };
  } catch (error) {
    // 세션생성 실패 -> 콘솔에러, 입력정보+false 리턴
    console.error('[SERVICE] UNKNOWN_ERROR');
    return {
      ok: false,
      user: { email: userInputData.email },
      message: 'LOGIN_FAILED',
    };
  }
}

/**
 * 로그아웃 서비스 함수
 * @param sid 세션 아이디
 */
export async function logoutService(sid: string): Promise<void> {
  const user = await findUserBySessionId(sid);
  console.log('[service] user data to logout : \n', user);
  if (!user) {
    // 이미 세션이 없거나 잘못된 sid인 경우 -> 할 일 없음
    await clearSession(sid);
    return;
  }
  await clearSession(sid); //로그아웃시 세션청소
}

/**
 * 쿠키에 담긴 세션ID로 세션정보 확인하기
 * @param sid 세션 아이디
 * @returns SessionCheckResult
 */
export async function checkSessionBySid(sid: string): Promise<SessionCheckResult> {
  const user = await findUserBySessionId(sid);
  // 만약 세션정보가 없으면 -> state : invalid 리턴
  if (!user || !user.session_id || !user.session_expires_at) {
    return { state: 'invalid' };
  }

  const now = Date.now();
  const expireTime = new Date(user.session_expires_at).getTime();
  // 만약 설정된 만료시간을 지났으면 -> 유저ID로 로그아웃 처리 -> state : "expired" + 유저아이디 리턴
  if (expireTime <= now) {
    await logoutService(sid);
    return { state: 'expired' };
  }

  // 검사 모두 통과시 -> state : valid + 유저 아이디,이메일,세션id,세션만료시간 리턴
  return {
    state: 'valid',
    user: {
      id: user.id,
      email: user.email,
      session_id: user.session_id,
      session_expires_at: user.session_expires_at,
    },
  };
}
