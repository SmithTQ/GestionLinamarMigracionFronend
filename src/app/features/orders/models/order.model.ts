export type OrderStatus =
  | 'pending'
  | 'validated'
  | 'planned'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface OrderReference {
  id: number;
  code?: string;
  name?: string;
}

export interface OrderFieldValue {
  key: string;
  label: string;
  type?: string;
  value?: unknown;
  filled: boolean;
}

export interface OrderFileValue {
  id: number;
  name: string;
  mimeType?: string;
  size?: number;
  url?: string;
}

export interface OrderDeliveryEvidence {
  id: number;
  deliveredAt?: string | null;
  deliveredAtIso?: string | null;
  deliveredByCourierId?: number | null;
  deliveredByCourierName?: string | null;
}

export interface Order {
  id: number;
  campaignId: number;
  branchId: number;
  customerId?: number;
  productId?: number;
  districtId?: number;
  orderNumber?: number;
  productName?: string;
  productPrice?: number;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  district: string;
  address: string;
  deliveryReference?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  dedication?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryEvidence?: OrderDeliveryEvidence | null;
  optionalFields?: Record<string, OrderFieldValue>;
  customFields?: OrderFieldValue[];
  status: OrderStatus;
  campaign?: OrderReference;
  branch?: OrderReference;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderPage {
  items: Order[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
