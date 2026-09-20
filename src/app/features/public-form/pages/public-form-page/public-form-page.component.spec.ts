import { ActivatedRoute } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  PublicCampaignForm,
  PublicCampaignFormService,
} from '@features/public-form/services/public-campaign-form.service';
import { PublicFormPageComponent } from './public-form-page.component';

describe('PublicFormPageComponent', () => {
  let fixture: ComponentFixture<PublicFormPageComponent>;
  let component: PublicFormPageComponent;
  let service: jasmine.SpyObj<PublicCampaignFormService>;

  const form: PublicCampaignForm = {
    title: 'Pedido',
    description: null,
    fields: [
      { key: 'product', label: 'Producto', type: 'product', required: true },
      {
        key: 'delivery_time',
        label: 'Horario',
        type: 'time',
        required: false,
        config: { options: ['09:00'] },
      },
      { key: 'invoice_number', label: 'Factura', type: 'text', required: false },
    ],
    products: [
      {
        sku: 'SKU-1',
        name: 'Producto 1',
        price: 10,
        image_url: 'https://example.test/original.jpg',
        image_thumbnail_url: 'https://example.test/thumb.jpg',
      },
    ],
    districts: [],
  };

  beforeEach(() => {
    service = jasmine.createSpyObj<PublicCampaignFormService>('PublicCampaignFormService', [
      'get',
      'getInvitation',
      'submit',
      'submitInvitation',
    ]);
    service.get.and.returnValue(of(form));
    service.submit.and.returnValue(of({ submission_key: 'web-test', order_id: 1 }));

    TestBed.configureTestingModule({
      imports: [PublicFormPageComponent],
      providers: [
        { provide: PublicCampaignFormService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['publicKey', 'form-key']]), data: {} } },
        },
      ],
    });

    fixture = TestBed.createComponent(PublicFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders delivery time options and the product thumbnail', () => {
    expect(fixture.nativeElement.querySelector('img').src).toBe('https://example.test/thumb.jpg');

    component.values.set({ product_sku: 'SKU-1' });
    component.nextStep();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Horario');
  });

  it('includes custom field values in the submission payload', () => {
    component.values.set({ product_sku: 'SKU-1', invoice_number: 'FAC-10' });

    component.submit();

    const payload = service.submit.calls.mostRecent().args[1] as FormData;
    expect(payload.get('product_sku')).toBe('SKU-1');
    expect(payload.get('invoice_number')).toBe('FAC-10');
  });

  it('omits empty optional values from the submission payload', () => {
    component.values.set({ product_sku: 'SKU-1', delivery_date: '' });

    component.submit();

    const payload = service.submit.calls.mostRecent().args[1] as FormData;
    expect(payload.has('delivery_date')).toBeFalse();
  });

  it('normalizes delivery dates before submitting', () => {
    component.values.set({ product_sku: 'SKU-1', delivery_date: '31/12/2026' });

    component.submit();

    const payload = service.submit.calls.mostRecent().args[1] as FormData;
    expect(payload.get('delivery_date')).toBe('2026-12-31');
  });

  it('rejects files over the configured size limit', () => {
    const fileField = {
      key: 'reference_image',
      label: 'Imagen',
      type: 'file' as const,
      required: false,
    };
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'reference.png', {
      type: 'image/png',
    });

    component.setFile(fileField, file);

    expect(component.fileError()).toBe('El archivo no puede superar los 10 MB.');
    expect(component.files()['reference_image']).toBeUndefined();
  });
});
