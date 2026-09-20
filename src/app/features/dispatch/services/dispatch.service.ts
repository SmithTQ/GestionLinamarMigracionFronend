import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { CampaignContextStore } from '@features/campaigns/store/campaign-context.store';
import { environment } from '../../../../environments/environment';
import {
  Courier,
  CourierInvitation,
  CourierInvitationPayload,
  DeliveryRoute,
  DeliveryRoutePage,
  DeliveryRouteStatus,
  GenerateRoutePayload,
  RouteMapOrder,
  RouteMapOrdersPage,
  RouteMapSummary,
} from '../models/delivery-route.model';

interface DeliveryRouteDto {
  id: number;
  campaign_id: number;
  branch_id: number;
  courier_id?: number | null;
  code: string;
  name: string;
  description?: string | null;
  status: DeliveryRouteStatus;
  courier?: CourierDto | null;
  branch?: { id: number; code: string; name: string };
  active_orders_count?: number;
  total_distance_km?: number | null;
  estimated_minutes?: number | null;
  navigation_url?: string | null;
  cancelled_at?: string | null;
  cancelled_at_iso?: string | null;
}
interface RouteMapOrderDto {
  id: number;
  code: string;
  product_name?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  district?: { name?: string | null } | null;
  address?: string | null;
  latitude: number | string;
  longitude: number | string;
  delivery_date_iso?: string | null;
  delivery_time?: string | null;
  status: string;
  active_route?: {
    id: number;
    code: string;
    name: string;
    status: DeliveryRouteStatus;
  } | null;
}
interface CourierDto {
  id: number;
  name: string;
  phone: string;
  is_available: boolean;
}
interface CourierInvitationDto {
  courier: { id: number; name: string; phone: string };
  route: { id: number; code: string; name: string; status: DeliveryRouteStatus };
  public_url: string;
  whatsapp_url: string;
  expires_at?: string | null;
  expires_at_iso?: string | null;
}
interface PaginatedResponse<T> extends ApiResponse<T[] | { data: T[] }> {
  paginacion: { current_page: number; last_page: number; total: number; per_page: number };
}
interface RouteMapOrdersResponse extends PaginatedResponse<RouteMapOrderDto> {
  resumen: RouteMapSummary;
}

@Injectable({ providedIn: 'root' })
export class DispatchService {
  private readonly http = inject(HttpClient);
  private readonly campaignContext = inject(CampaignContextStore);
  private readonly baseUrl = environment.apiUrl;

  list(page = 1, pageSize = 10): Observable<DeliveryRoutePage> {
    let params = new HttpParams().set('page', page).set('per_page', pageSize);
    const campaignId = this.campaignContext.activeCampaignId();
    if (campaignId) params = params.set('campaign_id', campaignId);
    return this.http
      .get<PaginatedResponse<DeliveryRouteDto>>(`${this.baseUrl}/routes`, { params })
      .pipe(map(mapPage));
  }

  listAllMapOrders(campaignId: number): Observable<RouteMapOrdersPage> {
    return this.getMapOrdersPage(campaignId, 1).pipe(
      switchMap((firstPage) => {
        if (firstPage.totalPages <= 1) return of(firstPage);

        const remainingPages = Array.from(
          { length: firstPage.totalPages - 1 },
          (_, index) => this.getMapOrdersPage(campaignId, index + 2),
        );
        return forkJoin(remainingPages).pipe(
          map((pages) => ({
            ...firstPage,
            items: [firstPage, ...pages].flatMap((page) => page.items),
          })),
        );
      }),
    );
  }

  private getMapOrdersPage(campaignId: number, page: number): Observable<RouteMapOrdersPage> {
    const params = new HttpParams()
      .set('campaign_id', campaignId)
      .set('page', page)
      .set('per_page', 100);
    return this.http
      .get<RouteMapOrdersResponse>(`${this.baseUrl}/routes/map-orders`, { params })
      .pipe(map(mapRouteMapOrdersPage));
  }

  generate(payload: GenerateRoutePayload): Observable<DeliveryRoute> {
    return this.http
      .post<ApiResponse<DeliveryRouteDto>>(`${this.baseUrl}/routes/generate`, payload)
      .pipe(map((response) => mapRoute(response.datos)));
  }

  createCourierInvitation(
    routeId: number,
    payload: CourierInvitationPayload,
  ): Observable<CourierInvitation> {
    return this.http
      .post<ApiResponse<CourierInvitationDto>>(
        `${this.baseUrl}/routes/${routeId}/courier-invitations`,
        payload,
      )
      .pipe(map((response) => mapCourierInvitation(response.datos)));
  }

  changeStatus(routeId: number, status: DeliveryRouteStatus): Observable<DeliveryRoute> {
    return this.http
      .patch<ApiResponse<DeliveryRouteDto>>(`${this.baseUrl}/routes/${routeId}/status`, { status })
      .pipe(map((response) => mapRoute(response.datos)));
  }
}

function mapPage(response: PaginatedResponse<DeliveryRouteDto>): DeliveryRoutePage {
  return {
    items: getItems(response.datos).map(mapRoute),
    page: response.paginacion.current_page,
    pageSize: response.paginacion.per_page,
    total: response.paginacion.total,
    totalPages: response.paginacion.last_page,
  };
}
function getItems<T>(value: T[] | { data: T[] }): T[] {
  return Array.isArray(value) ? value : value.data;
}
function mapCourier(dto: CourierDto): Courier {
  return { id: dto.id, name: dto.name, phone: dto.phone, isAvailable: dto.is_available };
}
function mapCourierInvitation(dto: CourierInvitationDto): CourierInvitation {
  return {
    courier: dto.courier,
    route: dto.route,
    publicUrl: dto.public_url,
    whatsappUrl: dto.whatsapp_url,
    expiresAt: dto.expires_at ?? null,
    expiresAtIso: dto.expires_at_iso ?? null,
  };
}
function mapRoute(dto: DeliveryRouteDto): DeliveryRoute {
  return {
    id: dto.id,
    campaignId: dto.campaign_id,
    branchId: dto.branch_id,
    courierId: dto.courier_id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    status: dto.status,
    activeOrdersCount: dto.active_orders_count ?? 0,
    totalDistanceKm: dto.total_distance_km ?? null,
    estimatedMinutes: dto.estimated_minutes ?? null,
    navigationUrl: dto.navigation_url ?? null,
    cancelledAt: dto.cancelled_at ?? null,
    cancelledAtIso: dto.cancelled_at_iso ?? null,
    courier: dto.courier ? mapCourier(dto.courier) : null,
    branch: dto.branch,
  };
}
function mapRouteMapOrdersPage(response: RouteMapOrdersResponse): RouteMapOrdersPage {
  return {
    items: getItems(response.datos).map(mapRouteMapOrder),
    page: response.paginacion.current_page,
    pageSize: response.paginacion.per_page,
    total: response.paginacion.total,
    totalPages: response.paginacion.last_page,
    summary: response.resumen,
  };
}

function mapRouteMapOrder(order: RouteMapOrderDto): RouteMapOrder {
  return {
    id: order.id,
    code: order.code,
    productName: order.product_name ?? 'Producto sin especificar',
    senderName: order.sender_name,
    senderPhone: order.sender_phone,
    recipientName: order.recipient_name ?? 'Destinatario sin nombre',
    recipientPhone: order.recipient_phone,
    districtName: order.district?.name ?? null,
    address: order.address,
    latitude: Number(order.latitude),
    longitude: Number(order.longitude),
    deliveryDate: order.delivery_date_iso,
    deliveryTime: order.delivery_time,
    status: order.status,
    activeRoute: order.active_route
      ? {
          id: order.active_route.id,
          code: order.active_route.code,
          name: order.active_route.name,
          status: order.active_route.status,
        }
      : null,
  };
}
