import { FormTemplate } from '@features/campaigns/services/campaign-forms.service';
import { appendFieldToTemplate, buildCustomFieldPayload } from './campaign-form-builder.utils';

describe('campaign form builder utilities', () => {
  const template = {
    id: 4,
    code: 'DEFAULT',
    name: 'Formulario base',
    isActive: true,
    fields: [],
  } as FormTemplate;

  it('normalizes a custom field before building its payload', () => {
    const result = buildCustomFieldPayload(
      { key: ' Delivery_Note ', label: ' Nota de entrega ', type: 'text' },
      template,
    );

    expect(result.error).toBeUndefined();
    expect(result.payload).toEqual({
      key: 'delivery_note',
      label: 'Nota de entrega',
      type: 'text',
      sort_order: 0,
    });
  });

  it('rejects custom fields with invalid keys', () => {
    const result = buildCustomFieldPayload(
      { key: 'delivery-note', label: 'Nota', type: 'text' },
      template,
    );

    expect(result.payload).toBeUndefined();
    expect(result.error).toContain('guion bajo');
  });

  it('appends a created field only to its template', () => {
    const field = {
      id: 8,
      key: 'delivery_note',
      label: 'Nota de entrega',
      type: 'text' as const,
      isSystem: false,
      isActive: true,
      sortOrder: 0,
    };
    const otherTemplate = { ...template, id: 5 };

    const result = appendFieldToTemplate([template, otherTemplate], 4, field);

    expect(result[0].fields).toEqual([field]);
    expect(result[1].fields).toEqual([]);
    expect(template.fields).toEqual([]);
  });
});
