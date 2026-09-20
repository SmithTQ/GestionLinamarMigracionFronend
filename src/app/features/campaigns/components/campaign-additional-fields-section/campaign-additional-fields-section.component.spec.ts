import { CampaignAdditionalFieldsSectionComponent } from './campaign-additional-fields-section.component';

describe('CampaignAdditionalFieldsSectionComponent', () => {
  it('exposes typed field and option actions through outputs', () => {
    const component = new CampaignAdditionalFieldsSectionComponent();
    let fieldUpdate: unknown;
    let optionUpdate: unknown;
    component.fieldUpdated.subscribe((event) => (fieldUpdate = event));
    component.optionUpdated.subscribe((event) => (optionUpdate = event));

    component.fieldUpdated.emit({ fieldId: 'field-1', key: 'required', value: true });
    component.optionUpdated.emit({ fieldId: 'field-1', optionIndex: 1, value: 'Express' });

    expect(fieldUpdate).toEqual({ fieldId: 'field-1', key: 'required', value: true });
    expect(optionUpdate).toEqual({ fieldId: 'field-1', optionIndex: 1, value: 'Express' });
  });
});
