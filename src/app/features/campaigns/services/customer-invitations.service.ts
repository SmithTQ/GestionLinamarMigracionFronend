import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { environment } from '../../../../environments/environment';

export interface CustomerInvitationPayload {
  form_id: number;
  full_name?: string;
  whatsapp_number: string;
  email?: string;
  expires_at?: string;
}

export interface CustomerInvitation {
  invitation_token: string;
  form_url: string;
  whatsapp_url: string;
  status: string;
  expires_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerInvitationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  create(payload: CustomerInvitationPayload): Observable<CustomerInvitation> {
    return this.http
      .post<ApiResponse<CustomerInvitation>>(`${this.baseUrl}/customer-invitations`, payload)
      .pipe(map((response) => response.datos));
  }

  list(formId: number): Observable<unknown[]> {
    const params = new HttpParams().set('form_id', formId).set('per_page', 100);
    return this.http
      .get<ApiResponse<{ data: unknown[] } | unknown[]>>(`${this.baseUrl}/customer-invitations`, {
        params,
      })
      .pipe(
        map((response) => (Array.isArray(response.datos) ? response.datos : response.datos.data)),
      );
  }
}
