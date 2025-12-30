import type { ItemInfo, RentRequest } from '../types/Rent.Type.js';
import { pool } from '../config/db.js';
import type { ItemRow } from '../types/Rent.Type.js';

/**
 * 유저가 요청한 물품 아이디로 물품 행 찾아서 그대로 넘겨주기
 * @param itemId
 * @returns ItemInfo | null
 */
export async function findItemById(itemId: number): Promise<ItemInfo | null> {
  try {
    const sql = `
        SELECT id,
               name,
               category,
               total_quantity,
               rented_quantity,
               is_rentable,
               max_quantity_per_rent,
               created_at,
               updated_at
        FROM items
        WHERE id = ? LIMIT 1
    `;
    const [rows] = await pool.query<ItemRow[]>(sql, [itemId]);
    const row = rows[0];
    if (!row) {
      return null;
    }
    console.log('[repository] item data found : \n', row);
    return {
      itemId: row.id,
      itemName: row.name,
      itemCategory: row.category,
      totalQuantity: row.total_quantity,
      rentedQuantity: row.rented_quantity,
      currentQuantity: row.total_quantity - row.rented_quantity,
      isRentable: !!row.is_rentable,
      maxQuantityPerRent: row.max_quantity_per_rent,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } satisfies ItemInfo;
  } catch (error) {
    console.error('[REPOSITORY] UNKNOWN_ERROR');
    return null;
  }
}

/**
 * 대여 실행 함수
 * 물품테이블에서 대여중 개수를 증가,
 * 대여 트랜잭션 테이블에 대여정보를 기록
 * @param rentRequest
 * @returns void | Error
 */
export async function rentItemRepository(rentRequest: RentRequest): Promise<void> {
  const { userId, itemId, quantity } = rentRequest;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    /**
     * 물품 테이블의 대여중 개수를 요청한 만큼 증가
     */
    const updateItemSql = `
      UPDATE items
      SET rented_quantity = rented_quantity + ?
      WHERE id = ?
    `;
    await conn.query(updateItemSql, [quantity, itemId]);

    /**
     * 대여 트랜잭션 테이블에
     * 유저,물품아이디,개수를 저장
     */
    const insertRentalSql = `
      INSERT INTO rentals (
        user_id,
        item_id,
        quantity,
        rented_at,
        due_at,
        returned_at
      ) VALUES (
        ?, 
        ?, 
        ?, 
        NOW(), 
        DATE_ADD(NOW(), INTERVAL 14 DAY), 
        NULL
      )
    `;
    await conn.query(insertRentalSql, [userId, itemId, quantity]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 물품리스트 조회 레포함수
 * @params keyword
 * @params category
 * @params offset
 * @params limit
 * @returns ItemRow[]
 */
export async function findItemList(
  keyword: string,
  category: string,
  offset: number,
  limit: number
): Promise<ItemInfo[]> {
  try {
    let sql = `
        SELECT id,
               name,
               category,
               total_quantity,
               rented_quantity,
               is_rentable,
               max_quantity_per_rent,
               created_at,
               updated_at
        FROM items
        WHERE 1=1
    `;

    const params: any[] = [];

    if (keyword) {
      sql += ` AND name LIKE ?`;
      params.push(`%${keyword}%`);
    }

    if (category && category !== 'ALL') {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query<ItemRow[]>(sql, params);

    return rows.map((row) => ({
      itemId: row.id,
      itemName: row.name,
      itemCategory: row.category,
      totalQuantity: row.total_quantity,
      rentedQuantity: row.rented_quantity,
      currentQuantity: row.total_quantity - row.rented_quantity,
      isRentable: !!row.is_rentable,
      maxQuantityPerRent: row.max_quantity_per_rent,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('[REPOSITORY] findItemList error:', error);
    return [];
  }
}
