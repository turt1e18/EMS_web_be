import type { RentRequest } from '../types/Rent.Type.js';
import { findItemById, findItemList, rentItemRepository } from './Rent.Repository.js';

/**
 * 대여 실행 서비스함수
 * @param rentRequest
 * @returns void | Error
 */
export async function rentItemService(rentRequest: RentRequest): Promise<void> {
  try {
    const targetItemRow = await findItemById(rentRequest.itemId);
    if (targetItemRow == null) {
      throw new Error('Item not found');
    }
    /**
     * 유저의 요청과 물품의 상태를 비교검증
     * 1. 한번에 대여 가능한 개수 이상으로 요청하지는 않았는지
     * 2. 요청한 물품이 대여 가능한 상태인지
     * 3. 현재 그 물품의 재고가 요청한 개수보다 적진 않은지
     */
    if (
      targetItemRow.maxQuantityPerRent < rentRequest.quantity ||
      !targetItemRow.isRentable ||
      targetItemRow.totalQuantity - targetItemRow.rentedQuantity < rentRequest.quantity
    ) {
      throw new Error('Invalid rent request');
    }
    /**
     * 대여 실행하는 레포지토리SQL 호출,
     * 에러 안나면 성공,
     * 나중에 확인용 반환값 필요하면 추가 할 예정
     */
    await rentItemRepository(rentRequest);
  } catch (error) {
    throw new Error('Item not found');
  }
}

/**
 * 물품 리스트 조회 서비스함수
 * @params keyword
 * @params category
 * @params offset
 * @params limit
 * @returns ItemRow[]
 */
export async function getItemListService(
  keyword: string,
  category: string,
  offset: number,
  limit: number
) {
  return await findItemList(keyword, category, offset, limit);
}
