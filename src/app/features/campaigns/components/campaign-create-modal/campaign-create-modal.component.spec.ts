import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampaignCreateModalComponent } from './campaign-create-modal.component';

describe('CampaignCreateModalComponent', () => {
  let fixture: ComponentFixture<CampaignCreateModalComponent>;
  let component: CampaignCreateModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignCreateModalComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CampaignCreateModalComponent);
    component = fixture.componentInstance;
  });

  it('resets the form when a new campaign modal is reopened', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    component.form.controls.name.setValue('Campana temporal');

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(component.form.controls.name.value).toBe('');
    expect(component.form.controls.status.value).toBe('draft');
  });
});
