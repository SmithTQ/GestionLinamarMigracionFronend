import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '@core/models/api-response.model';
import { CampaignBranch, CampaignDistrict } from '../models/campaign.model';

export interface CatalogProduct {
  id: number;
  sku: string;
  name: string;
  base_price?: number | null;
  image_url?: string | null;
  image_thumbnail_url?: string | null;
  campaign_pivot?: CampaignProductPivot;
}

export interface CampaignProductPivot {
  price?: number | null;
  is_available: boolean;
  sort_order: number;
  max_quantity?: number | null;
}

export interface CampaignProductAssignment {
  product_id: number;
  price?: number | null;
  is_available: boolean;
  sort_order: number;
  max_quantity?: number | null;
}

interface CatalogPage<T> extends ApiResponse<T[] | { data: T[] }> {
  paginacion: { last_page: number };
}

@Injectable({ providedIn: 'root' })
export class CampaignCatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listBranches(): Observable<CampaignBranch[]> {
    const params = new HttpParams()
      .set('per_page', 100)
      .set('sort', 'name')
      .set('direction', 'asc');
    return this.http
      .get<CatalogPage<CampaignBranch>>(`${this.baseUrl}/branches`, { params })
      .pipe(map((response) => getListData(response.datos)));
  }

  listDistricts(): Observable<CampaignDistrict[]> {
    const params = new HttpParams()
      .set('per_page', 100)
      .set('sort', 'name')
      .set('direction', 'asc');
    return this.http
      .get<CatalogPage<CampaignDistrict>>(`${this.baseUrl}/districts`, { params })
      .pipe(map((response) => getListData(response.datos)));
  }

  listProducts(branchId: number): Observable<CatalogProduct[]> {
    const params = new HttpParams()
      .set('per_page', 100)
      .set('sort_by', 'name')
      .set('branch_id', branchId);
    return this.http
      .get<CatalogPage<CatalogProduct>>(`${this.baseUrl}/products`, { params })
      .pipe(map((response) => getListData(response.datos)));
  }

  listCampaignProducts(campaignId: number, isAvailable?: boolean): Observable<CatalogProduct[]> {
    // Ordenar por una columna del producto evita el fallback backend que intenta
    // usar orderByPivot sobre un builder Eloquent y provoca un error 500.
    let params = new HttpParams().set('sort_by', 'name').set('sort_dir', 'asc');
    if (isAvailable !== undefined) {
      params = params.set('is_available', isAvailable ? '1' : '0');
    }
    return this.http
      .get<ApiResponse<CatalogProduct[]>>(`${this.baseUrl}/campaigns/${campaignId}/products`, {
        params,
      })
      .pipe(map((response) => response.datos));
  }

  assignCampaignProducts(
    campaignId: number,
    products: CampaignProductAssignment[],
  ): Observable<CatalogProduct[]> {
    return this.http
      .put<ApiResponse<CatalogProduct[]>>(`${this.baseUrl}/campaigns/${campaignId}/products`, {
        products,
      })
      .pipe(map((response) => response.datos));
  }
}

function getListData<T>(value: T[] | { data: T[] }): T[] {
  return Array.isArray(value) ? value : value.data;
}
