import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { environment } from '../../../../environments/environment';

export interface PublicRouteStop {
  order_id: number;
  order_number: string | number;
  status: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  product: PublicRouteProduct | null;
  sender: PublicRouteContact;
  recipient: PublicRouteContact;
  district: string | null;
  address: string | null;
  delivery_reference: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_evidence: PublicDeliveryEvidence | null;
  sort_order: number | null;
}

export interface PublicRouteProduct {
  id: number;
  sku: string;
  name: string;
  image_thumbnail_url: string | null;
  image_url: string | null;
}

export interface PublicRouteContact {
  name: string | null;
  phone: string | null;
}

export interface PublicDeliveryEvidence {
  id: number;
  url: string;
  thumbnail_url: string | null;
  delivered_at: string | null;
  delivered_at_iso: string | null;
  delivered_by_courier_id: number | null;
  delivered_by_courier_name: string | null;
}

export interface PublicDeliveryRoute {
  code: string;
  name: string;
  description: string | null;
  status: string;
  navigation_url: string | null;
  courier: PublicRouteContact | null;
  orders: PublicRouteStop[];
}

@Injectable({ providedIn: 'root' })
export class PublicRouteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get(token: string): Observable<PublicDeliveryRoute> {
    return this.http
      .get<ApiResponse<PublicDeliveryRoute>>(`${this.baseUrl}/public/routes/${token}`)
      .pipe(map((response) => response.datos));
  }

  confirmDelivery(token: string, orderId: number, evidence: File): Observable<PublicDeliveryRoute> {
    const formData = new FormData();
    formData.append('evidence', evidence);

    return this.http
      .post<ApiResponse<PublicDeliveryRoute>>(
        `${this.baseUrl}/public/routes/${token}/orders/${orderId}/delivery-confirmation`,
        formData,
      )
      .pipe(map((response) => response.datos));
  }
}
