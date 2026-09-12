import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { environment } from '../../../../environments/environment';

export interface FormFieldConfig {
  id: number;
  key: string;
  label: string;
  type: string;
  isSystem: boolean;
  sortOrder: number;
  formConfig?: {
    isEnabled: boolean;
    isRequired: boolean;
    label?: string | null;
    config?: Record<string, unknown> | null;
    sortOrder: number;
  };
}

export interface FormTemplate {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  fields: FormFieldConfig[];
}

export interface CampaignForm {
  id: number;
  campaignId: number;
  branchId: number;
  templateId: number;
  publicKey?: string;
  title: string;
  description?: string | null;
  status: 'draft' | 'published' | 'closed';
  publishedAt?: string | null;
  closedAt?: string | null;
  fields: FormFieldConfig[];
}

export interface CampaignFormFieldPayload {
  field_id: number;
  is_enabled: boolean;
  is_required: boolean;
  label?: string | null;
  config?: Record<string, unknown>;
  sort_order: number;
}

export interface CampaignFormPayload {
  campaign_id: number;
  branch_id: number;
  template_id: number;
  title: string;
  description?: string;
  fields: CampaignFormFieldPayload[];
}

interface FormFieldDto {
  id: number;
  key: string;
  label: string;
  type: string;
  is_system: boolean;
  sort_order: number;
  form_config?: {
    is_enabled: boolean;
    is_required: boolean;
    label?: string | null;
    config?: Record<string, unknown> | null;
    sort_order: number;
  };
}

interface FormTemplateDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  fields?: FormFieldDto[];
}

interface CampaignFormDto {
  id: number;
  campaign_id: number;
  branch_id: number;
  template_id: number;
  public_key?: string;
  title: string;
  description?: string | null;
  status: CampaignForm['status'];
  published_at?: string | null;
  closed_at?: string | null;
  fields?: FormFieldDto[];
}

interface CampaignFormListResponse extends ApiResponse<
  CampaignFormDto[] | { data: CampaignFormDto[] }
> {
  paginacion: { current_page: number; last_page: number; total: number };
}

@Injectable({ providedIn: 'root' })
export class CampaignFormsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  templates(): Observable<FormTemplate[]> {
    return this.http
      .get<ApiResponse<FormTemplateDto[]>>(`${this.baseUrl}/form-templates`)
      .pipe(map((response) => response.datos.map(mapTemplate)));
  }

  list(campaignId: number): Observable<CampaignForm[]> {
    const params = new HttpParams().set('campaign_id', campaignId).set('per_page', 100);
    return this.http
      .get<CampaignFormListResponse>(`${this.baseUrl}/campaign-forms`, { params })
      .pipe(map((response) => listData(response.datos).map(mapForm)));
  }

  get(id: number): Observable<CampaignForm> {
    return this.http
      .get<ApiResponse<CampaignFormDto>>(`${this.baseUrl}/campaign-forms/${id}`)
      .pipe(map((response) => mapForm(response.datos)));
  }

  create(payload: CampaignFormPayload): Observable<CampaignForm> {
    return this.http
      .post<ApiResponse<CampaignFormDto>>(`${this.baseUrl}/campaign-forms`, payload)
      .pipe(map((response) => mapForm(response.datos)));
  }

  update(
    id: number,
    payload: Partial<Omit<CampaignFormPayload, 'campaign_id' | 'branch_id' | 'template_id'>>,
  ): Observable<CampaignForm> {
    return this.http
      .patch<ApiResponse<CampaignFormDto>>(`${this.baseUrl}/campaign-forms/${id}`, payload)
      .pipe(map((response) => mapForm(response.datos)));
  }

  publish(id: number): Observable<CampaignForm> {
    return this.action(id, 'publish');
  }

  close(id: number): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${this.baseUrl}/campaign-forms/${id}/close`, {})
      .pipe(map(() => undefined));
  }

  private action(id: number, action: 'publish'): Observable<CampaignForm> {
    return this.http
      .post<ApiResponse<CampaignFormDto>>(`${this.baseUrl}/campaign-forms/${id}/${action}`, {})
      .pipe(map((response) => mapForm(response.datos)));
  }
}

function mapTemplate(dto: FormTemplateDto): FormTemplate {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    fields: (dto.fields ?? []).map(mapField),
  };
}

function mapForm(dto: CampaignFormDto): CampaignForm {
  return {
    id: dto.id,
    campaignId: dto.campaign_id,
    branchId: dto.branch_id,
    templateId: dto.template_id,
    publicKey: dto.public_key,
    title: dto.title,
    description: dto.description,
    status: dto.status,
    publishedAt: dto.published_at,
    closedAt: dto.closed_at,
    fields: (dto.fields ?? []).map(mapField),
  };
}

function mapField(dto: FormFieldDto): FormFieldConfig {
  return {
    id: dto.id,
    key: dto.key,
    label: dto.label,
    type: dto.type,
    isSystem: dto.is_system,
    sortOrder: dto.sort_order,
    formConfig: dto.form_config
      ? {
          isEnabled: dto.form_config.is_enabled,
          isRequired: dto.form_config.is_required,
          label: dto.form_config.label,
          config: dto.form_config.config,
          sortOrder: dto.form_config.sort_order,
        }
      : undefined,
  };
}

function listData<T>(value: T[] | { data: T[] }): T[] {
  return Array.isArray(value) ? value : value.data;
}
