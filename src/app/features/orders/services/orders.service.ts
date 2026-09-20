import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import {
  Order,
  OrderDeliveryEvidence,
  OrderFieldValue,
  OrderPage,
  OrderStatus,
} from '../models/order.model';
import { CampaignContextStore } from '@features/campaigns/store/campaign-context.store';

export interface OrderListQuery {
  page?: number;
  pageSize?: number;
  sort?: { key: string; direction: 'asc' | 'desc' };
  filters?: Record<string, string>;
}

interface OrderDto {
  id: number;
  campaign_id: number;
  branch_id: number;
  customer_id?: number | null;
  product_id?: number | null;
  district_id?: number | null;
  order_number?: number | null;
  product_name?: string | null;
  product_price?: number | null;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  district: string;
  address: string;
  delivery_reference?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  dedication?: string | null;
  delivery_date?: string | null;
  delivery_time?: string | null;
  delivery_evidence?: DeliveryEvidenceDto | null;
  optional_fields?: Record<string, OrderFieldValue> | null;
  custom_fields?: OrderFieldValue[] | null;
  field_indicators?: { key: string; label: string; filled: boolean }[] | null;
  status: OrderStatus;
  campaign?: { id: number; code?: string; name?: string };
  branch?: { id: number; code?: string; name?: string };
  created_at: string;
  updated_at?: string;
}

interface DeliveryEvidenceDto {
  id: number;
  delivered_at?: string | null;
  delivered_at_iso?: string | null;
  delivered_by_courier_id?: number | null;
  delivered_by_courier_name?: string | null;
}

interface OrderListResponse extends ApiResponse<OrderDto[] | { data: OrderDto[] }> {
  paginacion: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

type OrderResponse = ApiResponse<OrderDto>;

export type OrderUpdatePayload = Partial<{
  recipient_name: string;
  recipient_phone: string;
  district: string;
  district_id: number | null;
  address: string;
  delivery_reference: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  dedication: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
}>;

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly campaignContext = inject(CampaignContextStore);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  list(query: OrderListQuery = {}): Observable<OrderPage> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('per_page', query.pageSize ?? 10);
    const campaignId = this.campaignContext.activeCampaignId();
    if (campaignId) params = params.set('campaign_id', campaignId);
    const sortBy = mapSortKey(query.sort?.key);
    if (sortBy) {
      params = params.set('sort_by', sortBy).set('sort_dir', query.sort?.direction ?? 'asc');
    }

    const filters = query.filters ?? {};
    if (filters['district']?.trim()) {
      params = params.set('district', filters['district'].trim());
    }
    if (filters['status']?.trim()) {
      params = params.set('status', mapStatusFilter(filters['status']));
    }
    if (filters['deliveryDate']?.trim()) {
      params = params.set('delivery_date', filters['deliveryDate'].trim());
    }

    return this.http.get<OrderListResponse>(this.baseUrl, { params }).pipe(
      map((response) => ({
        items: getListData(response.datos).map(mapOrder),
        page: response.paginacion.current_page,
        pageSize: query.pageSize ?? response.paginacion.per_page,
        total: response.paginacion.total,
        totalPages: response.paginacion.last_page,
      })),
    );
  }

  get(id: number): Observable<Order> {
    return this.http
      .get<OrderResponse>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => mapOrder(response.datos)));
  }

  update(id: number, payload: OrderUpdatePayload): Observable<Order> {
    return this.http
      .patch<OrderResponse>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((response) => mapOrder(response.datos)));
  }

  changeStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http
      .patch<OrderResponse>(`${this.baseUrl}/${id}/status`, { status })
      .pipe(map((response) => mapOrder(response.datos)));
  }

  archive(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  downloadSubmissionFile(fileId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/form-submission-files/${fileId}`, {
      responseType: 'blob',
    });
  }

  downloadDeliveryEvidence(orderId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${orderId}/delivery-evidence`, {
      responseType: 'blob',
    });
  }
}

function mapSortKey(key?: string): string | undefined {
  return {
    id: 'id',
    orderNumber: 'order_number',
    productName: 'product_name',
    recipientName: 'recipient_name',
    district: 'district',
    deliveryDate: 'delivery_date',
    status: 'status',
    createdAt: 'created_at',
  }[key ?? ''];
}

function mapStatusFilter(value: string): string {
  return (
    {
      Pendiente: 'pending',
      Validado: 'validated',
      Planificado: 'planned',
      Asignado: 'assigned',
      'En tránsito': 'in_transit',
      Entregado: 'delivered',
      Fallido: 'failed',
      Cancelado: 'cancelled',
    }[value.trim()] ?? value.trim()
  );
}

function mapOrder(dto: OrderDto): Order {
  return {
    id: dto.id,
    campaignId: dto.campaign_id,
    branchId: dto.branch_id,
    customerId: dto.customer_id ?? undefined,
    productId: dto.product_id ?? undefined,
    districtId: dto.district_id ?? undefined,
    orderNumber: dto.order_number ?? undefined,
    productName: dto.product_name ?? undefined,
    productPrice: dto.product_price ?? undefined,
    senderName: dto.sender_name,
    senderPhone: dto.sender_phone,
    recipientName: dto.recipient_name,
    recipientPhone: dto.recipient_phone,
    district: dto.district,
    address: dto.address,
    deliveryReference: dto.delivery_reference ?? undefined,
    latitude: dto.latitude ?? undefined,
    longitude: dto.longitude ?? undefined,
    locationAccuracy: dto.location_accuracy ?? undefined,
    dedication: dto.dedication ?? undefined,
    deliveryDate: dto.delivery_date ?? undefined,
    deliveryTime: dto.delivery_time ?? undefined,
    deliveryEvidence: mapDeliveryEvidence(dto.delivery_evidence),
    optionalFields: mapOptionalFields(dto.optional_fields),
    customFields: dto.custom_fields?.map(mapField) ?? undefined,
    status: dto.status,
    campaign: dto.campaign,
    branch: dto.branch,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapDeliveryEvidence(value?: DeliveryEvidenceDto | null): OrderDeliveryEvidence | null {
  if (!value) return null;
  return {
    id: value.id,
    deliveredAt: value.delivered_at,
    deliveredAtIso: value.delivered_at_iso,
    deliveredByCourierId: value.delivered_by_courier_id,
    deliveredByCourierName: value.delivered_by_courier_name,
  };
}

function mapOptionalFields(
  fields?: Record<string, OrderFieldValue> | null,
): Record<string, OrderFieldValue> | undefined {
  if (!fields) return undefined;
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, mapField({ ...field, key })]),
  );
}

function mapField(field: OrderFieldValue): OrderFieldValue {
  return { ...field, value: mapFieldValue(field.value) };
}

function mapFieldValue(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate['id'] !== 'number' || typeof candidate['name'] !== 'string') return value;
  return {
    id: candidate['id'],
    name: candidate['name'],
    mimeType: candidate['mime_type'],
    size: candidate['size'],
    url: candidate['url'],
  };
}

function getListData(value: OrderDto[] | { data: OrderDto[] }): OrderDto[] {
  return Array.isArray(value) ? value : value.data;
}
