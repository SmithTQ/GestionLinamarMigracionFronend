import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CampaignCatalogService } from '@features/campaigns/services/campaign-catalog.service';
import { CampaignFormsService } from '@features/campaigns/services/campaign-forms.service';
import { ProductsService } from '@features/products/services/products.service';
import { CampaignFormBuilderFacade } from './campaign-form-builder.facade';

describe('CampaignFormBuilderFacade', () => {
  let facade: CampaignFormBuilderFacade;
  let catalogService: jasmine.SpyObj<CampaignCatalogService>;
  let formsService: jasmine.SpyObj<CampaignFormsService>;
  let productsService: jasmine.SpyObj<ProductsService>;

  beforeEach(() => {
    catalogService = jasmine.createSpyObj('CampaignCatalogService', [
      'listProducts',
      'listCampaignProducts',
    ]);
    formsService = jasmine.createSpyObj('CampaignFormsService', [
      'templates',
      'list',
      'configure',
      'publish',
      'createTemplateField',
    ]);
    productsService = jasmine.createSpyObj('ProductsService', ['categories', 'create']);

    catalogService.listProducts.and.returnValue(of([]));
    catalogService.listCampaignProducts.and.returnValue(of([]));
    formsService.templates.and.returnValue(of([]));
    formsService.list.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        CampaignFormBuilderFacade,
        { provide: CampaignCatalogService, useValue: catalogService },
        { provide: CampaignFormsService, useValue: formsService },
        { provide: ProductsService, useValue: productsService },
      ],
    });

    facade = TestBed.inject(CampaignFormBuilderFacade);
  });

  it('loads all builder data using the selected campaign and branch', () => {
    let result: unknown;

    facade.load(12, 4).subscribe((value) => (result = value));

    expect(catalogService.listProducts).toHaveBeenCalled();
    expect(catalogService.listCampaignProducts).toHaveBeenCalledWith(12, true);
    expect(catalogService.listCampaignProducts).toHaveBeenCalledWith(12, false);
    expect(formsService.templates).toHaveBeenCalled();
    expect(formsService.list).toHaveBeenCalledWith(12, 4);
    expect(result).toEqual({
      availableProducts: [],
      assignedAvailableProducts: [],
      assignedUnavailableProducts: [],
      templates: [],
      forms: [],
      errors: [],
      formsLoadFailed: false,
      templatesLoadFailed: false,
    });
  });

  it('keeps independent requests available when one request fails', () => {
    catalogService.listProducts.and.returnValue(throwError(() => new Error('catalog')));
    formsService.list.and.returnValue(throwError(() => new Error('forms')));
    let result: { errors: string[]; formsLoadFailed: boolean } | undefined;

    facade.load(12).subscribe((value) => (result = value));

    expect(result?.formsLoadFailed).toBeTrue();
    expect(result?.errors).toEqual([
      'No se pudo cargar el catálogo de productos.',
      'No se pudieron consultar los formularios guardados.',
    ]);
  });

  it('marks template loading as critical when template metadata is unavailable', () => {
    formsService.templates.and.returnValue(throwError(() => new Error('templates')));
    let result: { templatesLoadFailed: boolean } | undefined;

    facade.load(12).subscribe((value) => (result = value));

    expect(result?.templatesLoadFailed).toBeTrue();
  });
});
