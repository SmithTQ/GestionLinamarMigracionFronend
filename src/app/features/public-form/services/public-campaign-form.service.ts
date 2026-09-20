import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { environment } from '../../../../environments/environment';

export interface PublicFormField {
  key: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'date'
    | 'phone'
    | 'select'
    | 'product'
    | 'district'
    | 'map'
    | 'time'
    | 'file';
  description?: string | null;
  field_group?: 'required_base' | 'optional_base' | 'custom' | null;
  required: boolean;
  config?: Record<string, unknown> | null;
}

export interface PublicFormProduct {
  sku: string;
  name: string;
  unit?: string | null;
  price: number | string;
  max_quantity?: number | null;
  image_url?: string | null;
  image_thumbnail_url?: string | null;
}

export interface PublicFormDistrict {
  code: string;
  name: string;
  province?: string | null;
  department?: string | null;
}

export type PublicFormPrefill = Record<string, string | null | undefined>;

export interface PublicCampaignForm {
  title: string;
  description?: string | null;
  fields: PublicFormField[];
  products: PublicFormProduct[];
  districts: PublicFormDistrict[];
  prefill?: PublicFormPrefill;
}

export interface PublicFormSubmissionResult {
  submission_key: string;
  order_id: number;
}

export type PublicFormSubmissionPayload = Record<string, unknown> | FormData;

@Injectable({ providedIn: 'root' })
export class PublicCampaignFormService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get(publicKey: string): Observable<PublicCampaignForm> {
    return this.http
      .get<ApiResponse<PublicCampaignForm>>(`${this.baseUrl}/public/forms/${publicKey}`)
      .pipe(map((response) => response.datos));
  }

  getInvitation(token: string): Observable<PublicCampaignForm> {
    return this.http
      .get<ApiResponse<PublicCampaignForm>>(`${this.baseUrl}/public/invitations/${token}`)
      .pipe(map((response) => response.datos));
  }

  getInternal(publicKey: string): Observable<PublicCampaignForm> {
    return this.http
      .get<ApiResponse<PublicCampaignForm>>(`${this.baseUrl}/internal/forms/${publicKey}`)
      .pipe(map((response) => response.datos));
  }

  submit(
    publicKey: string,
    payload: PublicFormSubmissionPayload,
  ): Observable<PublicFormSubmissionResult> {
    return this.http
      .post<
        ApiResponse<PublicFormSubmissionResult>
      >(`${this.baseUrl}/public/forms/${publicKey}/submissions`, payload)
      .pipe(map((response) => response.datos));
  }

  submitInvitation(
    token: string,
    payload: PublicFormSubmissionPayload,
  ): Observable<PublicFormSubmissionResult> {
    return this.http
      .post<
        ApiResponse<PublicFormSubmissionResult>
      >(`${this.baseUrl}/public/invitations/${token}/submissions`, payload)
      .pipe(map((response) => response.datos));
  }

  submitInternal(
    publicKey: string,
    payload: PublicFormSubmissionPayload,
  ): Observable<PublicFormSubmissionResult> {
    return this.http
      .post<ApiResponse<PublicFormSubmissionResult>>(
        `${this.baseUrl}/internal/forms/${publicKey}/submissions`,
        payload,
      )
      .pipe(map((response) => response.datos));
  }
}
