import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import {
  CampaignCatalogService,
  CatalogProduct,
} from '@features/campaigns/services/campaign-catalog.service';
import {
  CampaignConfigurationPayload,
  CampaignConfigurationResult,
  CampaignForm,
  CampaignFormsService,
  FormFieldConfig,
  FormTemplateFieldPayload,
  FormTemplate,
} from '@features/campaigns/services/campaign-forms.service';
import { Product, ProductCategory } from '@features/products/models/product.model';
import { ProductsService } from '@features/products/services/products.service';
import { ProductPayload } from '@features/products/services/product.dto';

export interface CampaignFormBuilderLoadResult {
  availableProducts: CatalogProduct[];
  assignedAvailableProducts: CatalogProduct[];
  assignedUnavailableProducts: CatalogProduct[];
  templates: FormTemplate[];
  forms: CampaignForm[];
  errors: string[];
  formsLoadFailed: boolean;
  templatesLoadFailed: boolean;
}

interface RequestResult<T> {
  value: T;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class CampaignFormBuilderFacade {
  private readonly catalogService = inject(CampaignCatalogService);
  private readonly formsService = inject(CampaignFormsService);
  private readonly productsService = inject(ProductsService);

  load(campaignId: number, branchId: number): Observable<CampaignFormBuilderLoadResult> {
    return forkJoin({
      availableProducts: this.request(
        this.catalogService.listProducts(branchId),
        [],
        'No se pudo cargar el catálogo de productos.',
      ),
      assignedAvailableProducts: this.request(
        this.catalogService.listCampaignProducts(campaignId, true),
        [],
        'No se pudieron cargar los productos disponibles de la campaña.',
      ),
      assignedUnavailableProducts: this.request(
        this.catalogService.listCampaignProducts(campaignId, false),
        [],
        'No se pudieron cargar los productos no disponibles de la campaña.',
      ),
      templates: this.request(
        this.formsService.templates(),
        [],
        'No se pudieron cargar las plantillas de formularios.',
      ),
      forms: this.request(
        this.formsService.list(campaignId, branchId),
        [],
        'No se pudieron consultar los formularios guardados.',
      ),
    }).pipe(
      map((result) => {
        const requests = Object.values(result);
        const errors = requests
          .map((request) => request.error)
          .filter((error): error is string => !!error);

        return {
          availableProducts: result.availableProducts.value,
          assignedAvailableProducts: result.assignedAvailableProducts.value,
          assignedUnavailableProducts: result.assignedUnavailableProducts.value,
          templates: result.templates.value,
          forms: result.forms.value,
          errors,
          formsLoadFailed: !!result.forms.error,
          templatesLoadFailed: !!result.templates.error,
        };
      }),
    );
  }

  configure(
    campaignId: number,
    payload: CampaignConfigurationPayload,
  ): Observable<CampaignConfigurationResult> {
    return this.formsService.configure(campaignId, payload);
  }

  publish(formId: number): Observable<CampaignForm> {
    return this.formsService.publish(formId);
  }

  loadProductCategories(): Observable<ProductCategory[]> {
    return this.productsService.categories();
  }

  createProduct(value: ProductPayload): Observable<Product> {
    return this.productsService.create(value);
  }

  createTemplateField(
    templateId: number,
    payload: FormTemplateFieldPayload,
  ): Observable<FormFieldConfig> {
    return this.formsService.createTemplateField(templateId, payload);
  }

  private request<T>(
    request: Observable<T>,
    fallback: T,
    errorMessage: string,
  ): Observable<RequestResult<T>> {
    return request.pipe(
      map((value) => ({ value })),
      catchError(() => of({ value: fallback, error: errorMessage })),
    );
  }
}
