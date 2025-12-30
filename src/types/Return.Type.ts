export interface RentedListType {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  rentedAt: Date;
  dueAt: Date;
}

// 대여 상태 타입
export type RentalStatus = 'OVERDUE' | 'DUE_SOON' | 'NORMAL';

// 프론트엔드 응답용 타입 (남은 일수 포함)
export interface RentedItemResponse extends RentedListType {
  daysRemaining: number;
  status: RentalStatus;
}

// 상태별 응답 타입
export interface GroupedRentedListResponse {
  overdue: RentedItemResponse[];
  dueSoon: RentedItemResponse[];
  normal: RentedItemResponse[];
}
