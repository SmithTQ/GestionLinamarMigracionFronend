export interface Order {
  id: string;
  customerName: string;
  status: 'draft' | 'in_progress' | 'completed';
  total: number;
  createdAt: string;
}
