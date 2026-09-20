import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import type { CatalogProduct, CampaignProductAssignment } from './campaign-catalog.service';

export interface FormFieldConfig {
  id: number;
  key: string;
  label: string;
  description?: string | null;
  type: FormFieldType;
  fieldGroup?: FormFieldGroup;
  isSystem: boolean;
  isActive: boolean;
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
  isActive: boolean;
  fields: FormFieldConfig[];
}

export type FormFieldType =
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

export type FormFieldGroup = 'required_base' | 'optional_base' | 'custom';

export interface FormTemplatePayload {
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface FormTemplateFieldPayload {
  key: string;
  label: string;
  type: FormFieldType;
  validation_rules?: Record<string, unknown> | null;
  sort_order?: number;
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
  branch_id?: number;
  template_id: number;
  title: string;
  description?: string;
  fields: CampaignFormFieldPayload[];
}

export interface CampaignConfigurationPayload {
  form: Omit<CampaignFormPayload, 'campaign_id'>;
  products: CampaignProductAssignment[];
}

export interface CampaignConfigurationResult {
  form: CampaignForm;
  products: CatalogProduct[];
}

interface FormFieldDto {
  id: number;
  key: string;
  label: string;
  description?: string | null;
  type: FormFieldType;
  field_group?: FormFieldGroup | null;
  is_system: boolean;
  is_active?: boolean;
  sort_order: number;
  form_config?: {
    is_enabled: boolean;
    is_required: boolean;
    label?: string | null;
    config?: Record<string, unknown> | string | null;
    sort_order: number;
  };
}

interface FormTemplateDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
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

interface CampaignConfigurationDto {
  form: CampaignFormDto;
  products: CatalogProduct[];
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
    const params = new HttpParams().set('is_active', true).set('per_page', 100);
    return this.http
      .get<
        ApiResponse<FormTemplateDto[] | { data: FormTemplateDto[] }>
      >(`${this.baseUrl}/form-templates`, { params })
      .pipe(map((response) => listData(response.datos).map(mapTemplate)));
  }

  createTemplate(payload: FormTemplatePayload): Observable<FormTemplate> {
    return this.http
      .post<ApiResponse<FormTemplateDto>>(`${this.baseUrl}/form-templates`, payload)
      .pipe(map((response) => mapTemplate(response.datos)));
  }

  updateTemplate(id: number, payload: Partial<FormTemplatePayload>): Observable<FormTemplate> {
    return this.http
      .patch<ApiResponse<FormTemplateDto>>(`${this.baseUrl}/form-templates/${id}`, payload)
      .pipe(map((response) => mapTemplate(response.datos)));
  }

  deactivateTemplate(id: number): Observable<FormTemplate> {
    return this.http
      .delete<ApiResponse<FormTemplateDto>>(`${this.baseUrl}/form-templates/${id}`)
      .pipe(map((response) => mapTemplate(response.datos)));
  }

  createTemplateField(
    templateId: number,
    payload: FormTemplateFieldPayload,
  ): Observable<FormFieldConfig> {
    return this.http
      .post<
        ApiResponse<FormFieldDto>
      >(`${this.baseUrl}/form-templates/${templateId}/fields`, payload)
      .pipe(map((response) => mapField(response.datos)));
  }

  updateTemplateField(
    templateId: number,
    fieldId: number,
    payload: Partial<FormTemplateFieldPayload> & { is_active?: boolean },
  ): Observable<FormFieldConfig> {
    return this.http
      .patch<
        ApiResponse<FormFieldDto>
      >(`${this.baseUrl}/form-templates/${templateId}/fields/${fieldId}`, payload)
      .pipe(map((response) => mapField(response.datos)));
  }

  deactivateTemplateField(templateId: number, fieldId: number): Observable<FormFieldConfig> {
    return this.http
      .delete<
        ApiResponse<FormFieldDto>
      >(`${this.baseUrl}/form-templates/${templateId}/fields/${fieldId}`)
      .pipe(map((response) => mapField(response.datos)));
  }

  list(campaignId: number, branchId?: number): Observable<CampaignForm[]> {
    let params = new HttpParams().set('campaign_id', campaignId).set('per_page', 100);
    if (branchId) {
      params = params.set('branch_id', branchId);
    }
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

  configure(
    campaignId: number,
    payload: CampaignConfigurationPayload,
  ): Observable<CampaignConfigurationResult> {
    return this.http
      .put<
        ApiResponse<CampaignConfigurationDto>
      >(`${this.baseUrl}/campaigns/${campaignId}/configuration`, payload)
      .pipe(
        map((response) => ({
          form: mapForm(response.datos.form),
          products: response.datos.products,
        })),
      );
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
    isActive: dto.is_active,
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
    description: dto.description,
    type: dto.type,
    fieldGroup: dto.field_group ?? (dto.is_system ? 'required_base' : 'custom'),
    isSystem: dto.is_system,
    isActive: dto.is_active ?? true,
    sortOrder: dto.sort_order,
    formConfig: dto.form_config
      ? {
          isEnabled: dto.form_config.is_enabled,
          isRequired: dto.form_config.is_required,
          label: dto.form_config.label,
          config: parseFieldConfig(dto.form_config.config),
          sortOrder: dto.form_config.sort_order,
        }
      : undefined,
  };
}

function parseFieldConfig(
  config: Record<string, unknown> | string | null | undefined,
): Record<string, unknown> | null | undefined {
  if (config === null || config === undefined) {
    return config;
  }
  if (typeof config !== 'string') {
    return config;
  }
  try {
    const parsed: unknown = JSON.parse(config);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function listData<T>(value: T[] | { data: T[] }): T[] {
  return Array.isArray(value) ? value : value.data;
}
