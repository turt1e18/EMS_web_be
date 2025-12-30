import type { Response, Request } from 'express';
import { sessionConfig } from '../config/session.js';
import { userService } from '../user/User.Service.js';
import { getRentedItemListService, returnItemService } from './Return.Service.js';

/**
 * 유저의 대여 목록 조회 컨트롤러
 * @returns GroupedRentedListResponse
 */
export async function getRentedListController(req: Request, res: Response) {
  // 쿠키에서 세션 체크
  const sid = req.cookies[sessionConfig.cookieName];
  if (!sid) {
    return res.status(401).json({ message: 'NOT_SID' });
  }

  try {
    // 세션정보로 세션상태 확인
    const sessionStatus = await userService.checkSessionBySid(sid);
    if (sessionStatus.state === 'invalid') {
      return res.status(401).json({ message: 'SESSION_INVALID' });
    }
    if (sessionStatus.state === 'expired') {
      return res.status(401).json({ message: 'SESSION_EXPIRED' });
    }

    // 유저아이디로 해당 유저가 대여한 물품 목록 확인
    const userId = sessionStatus.user.id;
    const getRentedListResult = await getRentedItemListService(userId);

    return res.status(200).json(getRentedListResult);
  } catch (error) {
    console.error('[CONTROLLER] getRentedListController error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function returnItemController(req: Request, res: Response) {
  const sid = req.cookies[sessionConfig.cookieName];
  if (!sid) {
    return res.status(401).json({ message: 'NOT_SID' });
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
    const transactionId = req.body.id;
    await returnItemService(transactionId, userId);
  } catch (error) {
    console.error('[CONTROLLER] returnItemController error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(200).json({ message: 'return success' });
}
