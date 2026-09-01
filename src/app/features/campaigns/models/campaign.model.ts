export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  budget: number;
  startDate: string;
  endDate?: string;
  ordersCount: number;
  deliveredCount: number;
  totalObtained: number;
}
