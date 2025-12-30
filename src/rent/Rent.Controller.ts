import type { Request, Response } from 'express';
import type { RentRequest } from '../types/Rent.Type.js';
import { rentItemService } from './Rent.Service.js';
import { sessionConfig } from '../config/session.js';
import { userService } from '../user/User.Service.js';
import { getItemListService } from './Rent.Service.js';
import { z } from 'zod';

/**
 * 대여 실행하는 컨트롤러 함수
 * 성공시에는 반환값 없음
 * 실패시에는 500
 * @return void | 500
 */
export async function rentItemController(req: Request, res: Response) {
  const sid = req.cookies[sessionConfig.cookieName];
  if (!sid) {
    return res.status(401).json({ message: 'NO_SESSION' });
  }
  try {
    const sessionStatus = await userService.checkSessionBySid(sid);
    if (sessionStatus.state === 'invalid') {
      return res.status(401).json({ message: 'SESSION_INVALID' });
    }
    if (sessionStatus.state === 'expired') {
      return res.status(401).json({ message: 'SESSION_EXPIRED' });
    }
    const userId = sessionStatus.user.id;

    const rentRequest: RentRequest = {
      userId,
      itemId: req.body.itemId,
      quantity: req.body.quantity,
    };
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
