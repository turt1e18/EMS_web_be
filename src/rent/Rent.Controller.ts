import type { Request, Response } from 'express';
import type { RentRequest } from '../types/Rent.Type.js';
import { rentItemService } from './Rent.Service.js';
import { getItemListService } from './Rent.Service.js';
import { z } from 'zod';

// 대여 요청 zod 스키마
const RentRequestSchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().positive().max(10),
});

/**
 * 대여 실행하는 컨트롤러 함수
 * 성공시에는 반환값 없음
 * 실패시에는 500
 * @return void | 500
 */
export async function rentItemController(req: Request, res: Response) {
  try {
    const userId = req.userId!; // authCheck에서 받은 값
    const { itemId, quantity } = RentRequestSchema.parse(req.body);
    const rentRequest: RentRequest = { userId, itemId, quantity };
    await rentItemService(rentRequest);
    res.status(200).json({ message: 'rent success' });
  } catch (error) {
    console.error('대여 실패');
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 물품리스트 반환 컨트롤러 함수
 * @params req keyword, category, offset, limit, cookieHeader
 * @params res itemInfo[]
 */
export async function getItemListController(req: Request, res: Response) {
  const firstString = z.preprocess((val) => {
    if (Array.isArray(val)) return val[0];
    return val;
  }, z.string());

  const stringToNumber = z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10);
    return val;
  }, z.number());

  const getItemListQuerySchema = z.object({
    keyword: firstString.optional().default(''),
    category: firstString.optional().default('ALL'),
    offset: stringToNumber.optional().default(0),
    limit: stringToNumber.optional().default(10),
  });
  try {
    const { keyword, category, offset, limit } = getItemListQuerySchema.parse(req.query);

    const filteredItemList = await getItemListService(keyword, category, offset, limit);
    res.status(200).json(filteredItemList);
  } catch (error) {
    console.log('error in getItemListController : ', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
