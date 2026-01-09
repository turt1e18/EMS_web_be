import type { RentedListType } from '../types/Return.Type.js';
import { pool } from '../config/db.js';
import type { RowDataPacket } from 'mysql2';

interface RentedRow extends RowDataPacket {
  id: number;
  item_id: number;
  item_name: string;
  quantity: number;
  rented_at: Date;
  due_at: Date;
}

/**
 * 유저의 대여중인 물품 목록 조회 (물품 이름 포함)
 * @param userId 유저 아이디
 * @returns RentedListType[] 대여 목록
 */
export async function getRentedItemListRepository(userId: number): Promise<RentedListType[]> {
  try {
    const sql = `
      SELECT r.id,
             r.item_id,
             i.name AS item_name,
             r.quantity,
             r.rented_at,
             r.due_at
      FROM rentals r
             JOIN items i ON r.item_id = i.id
      WHERE r.user_id = ?
        AND r.returned_at IS NULL
      ORDER BY r.rented_at DESC
    `;

    const [rows] = await pool.query<RentedRow[]>(sql, [userId]);

    return rows.map((row) => ({
      id: Number(row.id),
      itemId: row.item_id,
      itemName: row.item_name,
      quantity: row.quantity,
      rentedAt: row.rented_at,
      dueAt: row.due_at,
    }));
  } catch (error) {
    console.error('[REPOSITORY] getRentedItemListRepository error:', error);
    return [];
  }
}

export async function returnItemRepository(transactionId: number, userId: number): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. 해당 대여 이력 조회 (item_id, quantity)
    const [rows] = await connection.query<RentedRow[]>(
      `
        SELECT item_id, quantity
        FROM rentals
        WHERE id = ?
          AND user_id = ?
          AND returned_at IS NULL`,
      [transactionId, userId]
    );
    if (!rows[0]) {
      throw new Error('해당 대여 이력을 찾을 수 없습니다.');
    }
    const { item_id, quantity } = rows[0];

    // 2. 반납처리
    await connection.query(
      `
        UPDATE rentals
        SET returned_at = NOW()
        WHERE id = ?
          AND user_id = ?`,
      [transactionId, userId]
    );

    // 3. items 테이블의 rented_quantity 감소
    await connection.query(
      `
        UPDATE items
        SET rented_quantity = rented_quantity - ?
        WHERE id = ?`,
      [quantity, item_id]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('[REPOSITORY] returnItemRepository error:', error);
    throw error;
  } finally {
    connection.release();
  }
}
