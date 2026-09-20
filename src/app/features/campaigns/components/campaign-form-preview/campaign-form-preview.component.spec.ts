import { CampaignFormPreviewComponent } from './campaign-form-preview.component';

describe('CampaignFormPreviewComponent', () => {
  it('combines mandatory and additional fields in display order', () => {
    const component = new CampaignFormPreviewComponent();
    component.mandatoryFields = [
      { id: 'required-1', key: 'recipient_name', label: 'Destinatario', locked: true },
    ];
    component.additionalFields = [
      { id: 'additional-1', key: 'invoice_number', label: 'Factura', locked: false },
    ];

    expect(component.includedFields.map((field) => field.id)).toEqual([
      'required-1',
      'additional-1',
    ]);
  });
});
