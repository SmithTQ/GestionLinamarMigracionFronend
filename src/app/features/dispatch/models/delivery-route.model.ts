export type DeliveryRouteStatus =
  | 'draft'
  | 'planned'
  | 'assigned'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export interface Courier {
  id: number;
  name: string;
  phone: string;
  isAvailable: boolean;
}

export interface CourierInvitationPayload {
  name: string;
  whatsapp_number: string;
}

export interface CourierInvitation {
  courier: Pick<Courier, 'id' | 'name' | 'phone'>;
  route: Pick<DeliveryRoute, 'id' | 'code' | 'name' | 'status'>;
  publicUrl: string;
  whatsappUrl: string;
  expiresAt: string | null;
  expiresAtIso: string | null;
}

export interface DeliveryRoute {
  id: number;
  campaignId: number;
  branchId: number;
  courierId?: number | null;
  code: string;
  name: string;
  description?: string | null;
  status: DeliveryRouteStatus;
  activeOrdersCount: number;
  totalDistanceKm?: number | null;
  estimatedMinutes?: number | null;
  navigationUrl?: string | null;
  cancelledAt?: string | null;
  cancelledAtIso?: string | null;
  courier?: Courier | null;
  branch?: { id: number; code: string; name: string };
}

export interface DeliveryRoutePage {
  items: DeliveryRoute[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface GenerateRoutePayload {
  campaign_id: number;
  name: string;
  description?: string;
  stops: RouteStopPayload[];
  estimated_distance_km: number;
  estimated_minutes: number;
  request_key: string;
}

export interface RouteStopPayload {
  order_id: number;
  sort_order: number;
}

export interface RouteAssignment {
  id: number;
  code: string;
  name: string;
  status: DeliveryRouteStatus;
}

export interface RouteMapOrder {
  id: number;
  code: string;
  productName: string;
  senderName?: string | null;
  senderPhone?: string | null;
  recipientName: string;
  recipientPhone?: string | null;
  districtName?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  status: string;
  activeRoute: RouteAssignment | null;
}

export interface RouteOrigin {
  id: number;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
}

export interface RoutePreview {
  distanceKm: number;
  estimatedMinutes: number;
  path: { lat: number; lng: number }[];
}

export interface RouteMapSummary {
  total: number;
  pending: number;
  assigned: number;
}

export interface RouteMapOrdersPage {
  items: RouteMapOrder[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  summary: RouteMapSummary;
}

/** A pending or validated order without an active route can be planned. */
export function isRouteOrderSelectable(order: RouteMapOrder): boolean {
  return !order.activeRoute && ['pending', 'validated'].includes(order.status);
}
