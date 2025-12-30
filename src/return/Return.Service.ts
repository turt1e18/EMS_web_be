import { getRentedItemListRepository, returnItemRepository } from './Return.Repository.js';
import type {
  GroupedRentedListResponse,
  RentalStatus,
  RentedItemResponse,
} from '../types/Return.Type.js';

// 만기 임박 기준 (일)
const DUE_DAYS = 7;

/**
 * 남은 일수 계산 (오늘 기준)
 * @param dueAt 만기일
 * @returns 남은 일수 (음수면 연체)
 */
function calculateDaysRemaining(dueAt: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate());

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 남은 일수에 따라 상태 분류
 * @param daysRemaining 남은 일수
 * @returns RentalStatus
 */
function classifyStatus(daysRemaining: number): RentalStatus {
  if (daysRemaining < 0) {
    return 'OVERDUE';
  } else if (daysRemaining <= DUE_DAYS) {
    return 'DUE_SOON';
  } else {
    return 'NORMAL';
  }
}

/**
 * 유저의 대여 목록을 조회하고 상태별로 그룹화하여 반환
 * @param userId 유저 아이디
 * @returns GroupedRentedListResponse[]
 */
export async function getRentedItemListService(userId: number): Promise<GroupedRentedListResponse> {
  try {
    const rentedList = await getRentedItemListRepository(userId);

    // 각 항목에 남은 일수와 상태 추가
    const itemsWithStatus: RentedItemResponse[] = rentedList.map((item) => {
      const daysRemaining = calculateDaysRemaining(item.dueAt);
      const status = classifyStatus(daysRemaining);

      return {
        ...item,
        daysRemaining,
        status,
      };
    });

    const sortByDaysRemaining = (a: RentedItemResponse, b: RentedItemResponse) => {
      return a.daysRemaining - b.daysRemaining;
    };

    return {
      overdue: itemsWithStatus
        .filter((item) => item.status === 'OVERDUE')
        .sort(sortByDaysRemaining),
      dueSoon: itemsWithStatus
        .filter((item) => item.status === 'DUE_SOON')
        .sort(sortByDaysRemaining),
      normal: itemsWithStatus.filter((item) => item.status === 'NORMAL').sort(sortByDaysRemaining),
    };
  } catch (error) {
    console.error('[SERVICE] getRentedItemListService error:', error);
    throw new Error('Internal server error');
  }
}

export async function returnItemService(transactionId: number, userId: number) {
  try {
    await returnItemRepository(transactionId, userId);
  } catch (error) {
    console.error('[SERVICE] returnItemService error:', error);
    throw new Error('Internal server error');
  }
}
