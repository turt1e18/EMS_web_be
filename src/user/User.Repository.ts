import type { RowDataPacket } from 'mysql2/promise';
import type { UserEntity } from '../types/User.Type.js';
import { pool } from '../config/db.js';

type UserRow = RowDataPacket & UserEntity;

/**
 * 입력받은 이메일로 유저 찾기
 * @param email 유저 이메일
 * @returns UserEntity | null
 */
export async function findUserByEmail(email: string): Promise<UserEntity | null> {
  try {
    const sql = `
      SELECT id, email, password_hash, session_id, session_expires_at, user_level
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<UserRow[]>(sql, [email]);

    const row = rows[0];
    if (!row) {
      console.error('[REPOSITORY] USER_NOT_FOUND');
      return null;
    }
    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      session_id: row.session_id,
      session_expires_at: row.session_expires_at,
      user_level: row.user_level,
    };
  } catch (error) {
    console.error('[REPOSITORY] UNKNOWN_ERROR');
    return null;
  }
}

/**
 * 세션ID로 유저 찾기
 * @param sid 세션 아이디
 * @returns UserEntity | null
 */
export async function findUserBySessionId(sid: string): Promise<UserEntity | null> {
  try {
    const sql = `
      SELECT id, email, password_hash, session_id, session_expires_at, user_level
      FROM users
      WHERE session_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<UserRow[]>(sql, [sid]);

    const row = rows[0];
    if (!row) {
      console.error('[REPOSITORY] USER_NOT_FOUND');
      return null;
    }
    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      session_id: row.session_id,
      session_expires_at: row.session_expires_at,
      user_level: row.user_level,
    };
  } catch (error) {
    console.error('[REPOSITORY] UNKNOWN_ERROR');
    return null;
  }
}

/**
 * 세션 생성/갱신
 * @param userId 유저 아이디
 * @param sid 세션 아이디
 * @param expiresAt 만료 시간
 */
export async function updateSession(userId: number, sid: string, expiresAt: Date): Promise<void> {
  const sql = `
    UPDATE users
    SET session_id = ?, session_expires_at = ?
    WHERE id = ?
  `;
  await pool.execute(sql, [sid, expiresAt, userId]);
  console.log('[repository] session updated : ', sid);
}

/**
 * 세션 만료/삭제
 * @param sid 세션 아이디
 */
export async function clearSession(sid: string): Promise<void> {
  const sql = `
    UPDATE users
    SET session_id = NULL, session_expires_at = NULL
    WHERE session_id = ?
  `;
  await pool.execute(sql, [sid]);
  console.log('[repository] session cleared : ', sid);
}
