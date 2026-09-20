import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationPickerComponent } from './location-picker.component';

describe('LocationPickerComponent', () => {
  let fixture: ComponentFixture<LocationPickerComponent>;
  let component: LocationPickerComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [LocationPickerComponent] });
    fixture = TestBed.createComponent(LocationPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the location picker with map interaction enabled by default', () => {
    expect(component.disabled).toBeFalse();
  });
});
