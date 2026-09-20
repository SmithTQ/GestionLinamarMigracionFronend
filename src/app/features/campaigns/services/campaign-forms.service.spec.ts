import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { CampaignFormsService } from './campaign-forms.service';

describe('CampaignFormsService', () => {
  let service: CampaignFormsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CampaignFormsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CampaignFormsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('maps paginated templates and their active fields', () => {
    let result: unknown;
    service.templates().subscribe((templates) => (result = templates));

    const request = httpTesting.expectOne(
      (pendingRequest) => pendingRequest.url === `${environment.apiUrl}/form-templates`,
    );
    expect(request.request.params.get('is_active')).toBe('true');
    expect(request.request.params.get('per_page')).toBe('100');
    request.flush({
      codigo: 200,
      mensaje: 'OK',
      datos: {
        data: [
          {
            id: 4,
            code: 'campaign-order-v2',
            name: 'Pedidos v2',
            description: null,
            is_active: true,
            fields: [
              {
                id: 12,
                key: 'invoice_number',
                label: 'Número de factura',
                type: 'text',
                is_system: false,
                is_active: true,
                sort_order: 4,
              },
            ],
          },
        ],
      },
    });

    expect(result).toEqual([
      jasmine.objectContaining({
        id: 4,
        isActive: true,
        fields: [jasmine.objectContaining({ key: 'invoice_number', isActive: true })],
      }),
    ]);
  });

  it('creates a field in the selected template using the backend contract', () => {
    service
      .createTemplateField(4, {
        key: 'invoice_number',
        label: 'Número de factura',
        type: 'text',
        sort_order: 4,
      })
      .subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/form-templates/4/fields`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      key: 'invoice_number',
      label: 'Número de factura',
      type: 'text',
      sort_order: 4,
    });
    request.flush({
      codigo: 201,
      mensaje: 'Creado',
      datos: {
        id: 12,
        key: 'invoice_number',
        label: 'Número de factura',
        type: 'text',
        is_system: false,
        is_active: true,
        sort_order: 4,
      },
    });
  });

  it('parses persisted JSON options for select fields', () => {
    let result: unknown;
    service.get(20).subscribe((form) => (result = form));

    const request = httpTesting.expectOne(`${environment.apiUrl}/campaign-forms/20`);
    request.flush({
      codigo: 200,
      mensaje: 'OK',
      datos: {
        id: 20,
        campaign_id: 12,
        branch_id: 1,
        template_id: 4,
        title: 'Pedidos',
        description: null,
        status: 'draft',
        fields: [
          {
            id: 12,
            key: 'delivery_type',
            label: 'Tipo de entrega',
            type: 'select',
            is_system: false,
            is_active: true,
            sort_order: 0,
            form_config: {
              is_enabled: true,
              is_required: false,
              label: 'Tipo de entrega',
              config: '{"options":["Recojo","Delivery"]}',
              sort_order: 0,
            },
          },
        ],
      },
    });

    expect(result).toEqual(
      jasmine.objectContaining({
        fields: [
          jasmine.objectContaining({
            formConfig: jasmine.objectContaining({
              config: { options: ['Recojo', 'Delivery'] },
            }),
          }),
        ],
      }),
    );
  });

  it('saves form and campaign products through the atomic configuration endpoint', () => {
    service
      .configure(12, {
        form: {
          template_id: 4,
          title: 'Pedidos de campaña',
          description: 'Formulario',
          fields: [],
        },
        products: [
          {
            product_id: 9,
            price: 12.5,
            is_available: true,
            sort_order: 0,
            max_quantity: 2,
          },
        ],
      })
      .subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/campaigns/12/configuration`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.products[0].product_id).toBe(9);
    expect(request.request.body.form.template_id).toBe(4);
    request.flush({
      codigo: 200,
      mensaje: 'Configurado',
      datos: {
        form: {
          id: 20,
          campaign_id: 12,
          branch_id: 1,
          template_id: 4,
          title: 'Pedidos de campaña',
          description: 'Formulario',
          status: 'draft',
          fields: [],
        },
        products: [],
      },
    });
  });
});
