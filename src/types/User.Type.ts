import { z } from 'zod';

// 입력검증 -> 타입값은 LoginDto로 사용
export const UserBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(72),
});
export type LoginDto = z.infer<typeof UserBody>;

// DB users 테이블 스키마
export type UserEntity = Readonly<{
  id: number;
  email: string;
  password_hash: string;
  session_id: string | null;
  session_expires_at: Date | null;
  user_level: number; // 1,2: admin / 3,4: user
}>;

// 세션체크 메서드의 리턴타입 (state : "valid" / "expired" / "invalid") -> valid일 경우에만 세션정보 리턴
export type SessionCheckResult =
  | {
      state: 'valid';
      user: { id: number; email: string; session_id: string; session_expires_at: Date };
    }
  | { state: 'expired' }
  | { state: 'invalid' };

// 응답타입 설정 (성공 -> OK, user.email, level, message, 세션정보 / 실패 -> OK, user.email, message)
export type SessionInfo = { session_id: string; session_expires_at: Date };
export type LoginSuccess = {
  ok: true;
  user: { email: string; level: number };
  session: SessionInfo;
  message: string;
};
export type LoginFail = { ok: false; user: { email: string }; message: string };
export type LoginResult = LoginSuccess | LoginFail;
