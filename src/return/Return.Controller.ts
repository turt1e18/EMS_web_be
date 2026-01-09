import type { Response, Request } from 'express';
import { z } from 'zod';
import { getRentedItemListService, returnItemService } from './Return.Service.js';

// 반납 요청 zod 스키마
const ReturnRequestSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * 유저의 대여 목록 조회 컨트롤러
 * @returns GroupedRentedListResponse | 500
 */
export async function getRentedListController(req: Request, res: Response) {
  try {
    const userId = req.userId!; // authCheck에서 받은 값
    const getRentedListResult = await getRentedItemListService(userId);
    return res.status(200).json(getRentedListResult);
  } catch (error) {
    console.error('[CONTROLLER] getRentedListController error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 물품 반납 컨트롤러
 * @returns void | 500
 */
export async function returnItemController(req: Request, res: Response) {
  try {
    const userId = req.userId!; // authCheck에서 받은 값
    const { id: transactionId } = ReturnRequestSchema.parse(req.body);
    await returnItemService(transactionId, userId);
    return res.status(200).json({ message: 'return success' });
  } catch (error) {
    console.error('[CONTROLLER] returnItemController error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
