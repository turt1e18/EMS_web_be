import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { UserEntity, UserRepositoryInterface } from '../types/User.Type.js';
import { pool } from '../config/db.js';

type UserRow = RowDataPacket & UserEntity;

export class UserRepository implements UserRepositoryInterface {
  constructor(private readonly pool: Pool) {}

  /* 입력받은 이메일로 유저 찾기 (return : <UserEntity | null>) */
  public async findUserByEmail(email: string): Promise<UserEntity | null> {
    try {
      const sql = `
      SELECT id, email, password_hash, session_id, session_expires_at, user_level
      FROM users
      WHERE email = ?
      LIMIT 1
    `;

      const [rows] = await this.pool.query<UserRow[]>(sql, [email]);
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

  /* 세션ID로 유저 찾기 (return : <UserEntity | null>) */
  public async findUserBySessionId(sid: string): Promise<UserEntity | null> {
    try {
      const sql = `
      SELECT id, email, password_hash, session_id, session_expires_at, user_level
      FROM users
      WHERE session_id = ?
      LIMIT 1
    `;

      const [rows] = await this.pool.query<UserRow[]>(sql, [sid]);
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

  /* 세션 생성 (return : void) */
  public async updateSession(userId: number, sid: string, expiresAt: Date): Promise<void> {
    const sql = `
      UPDATE users
      SET session_id = ?, session_expires_at = ?
      WHERE id = ?
    `;
    await this.pool.execute(sql, [sid, expiresAt, userId]);
    console.log('[repository] session updated : ', sid);
  }

  /* 세션 만료 (return : void) */
  public async clearSession(sid: string): Promise<void> {
    const sql = `
      UPDATE users
      SET session_id = NULL, session_expires_at = NULL
      WHERE session_id = ?
    `;
    await this.pool.execute(sql, [sid]);
    console.log('[repository] session cleared : ', sid);
  }
}
export const userRepository = new UserRepository(pool);
