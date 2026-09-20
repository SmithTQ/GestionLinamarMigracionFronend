import { CustomFormFieldModalComponent } from './custom-form-field-modal.component';

describe('CustomFormFieldModalComponent', () => {
  it('resets its draft when the modal opens', () => {
    const component = new CustomFormFieldModalComponent();
    component.key.set('old_key');
    component.label.set('Campo anterior');
    component.type.set('number');

    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.key()).toBe('');
    expect(component.label()).toBe('');
    expect(component.type()).toBe('text');
  });

  it('emits the current draft when submitted', () => {
    const component = new CustomFormFieldModalComponent();
    let value: unknown;
    component.submitted.subscribe((event) => (value = event));
    component.key.set('invoice_number');
    component.label.set('Número de factura');
    component.type.set('number');

    component.submit();

    expect(value).toEqual({
      key: 'invoice_number',
      label: 'Número de factura',
      type: 'number',
    });
  });
});
