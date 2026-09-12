import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { District, DistrictList, LocationOption } from '../../models/district.model';

export interface DistrictListFormValue {
  code: string;
  name: string;
  description: string;
  districtIds: number[];
}

@Component({
  selector: 'app-district-list-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, ButtonComponent, LoadingComponent],
  templateUrl: './district-list-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistrictListFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() districtList: DistrictList | null = null;
  @Input() districts: District[] = [];
  @Input() departments: LocationOption[] = [];
  @Input() provinces: LocationOption[] = [];
  @Input() defaultDepartmentCode = '';
  @Input() isSaving = false;
  @Input() isLoadingDistricts = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<DistrictListFormValue>();
  @Output() departmentChanged = new EventEmitter<string>();
  @Output() provinceChanged = new EventEmitter<string>();

  readonly departmentFilter = signal('');
  readonly provinceFilter = signal('');

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    districtIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    const isOpening = changes['isOpen']?.currentValue === true;
    const listChanged = changes['districtList'] !== undefined;
    const defaultDepartmentChanged = changes['defaultDepartmentCode'] !== undefined;
    if (!isOpening && !listChanged && !defaultDepartmentChanged) {
      return;
    }

    if (isOpening || listChanged) {
      const list = this.districtList;
      this.form.reset({
        code: list?.code ?? '',
        name: list?.name ?? '',
        description: list?.description ?? '',
        districtIds: list?.districts.map((district) => district.id) ?? [],
      });
      this.form.markAsUntouched();
    }
    if (isOpening || defaultDepartmentChanged || listChanged) {
      this.departmentFilter.set(this.defaultDepartmentCode);
      this.provinceFilter.set('');
    }
  }

  close(): void {
    if (this.isSaving || this.isLoadingDistricts) {
      return;
    }
    this.closed.emit();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) {
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({ ...value, districtIds: [...new Set(value.districtIds)] });
  }

  filteredDistricts(): District[] {
    return this.districts.filter(
      (district) =>
        (!this.departmentFilter() || district.departmentCode === this.departmentFilter()) &&
        (!this.provinceFilter() || district.provinceCode === this.provinceFilter()),
    );
  }

  setDepartment(value: string): void {
    this.departmentFilter.set(value);
    this.provinceFilter.set('');
    this.departmentChanged.emit(value);
  }

  setProvince(value: string): void {
    this.provinceFilter.set(value);
    this.provinceChanged.emit(value);
  }

  clearFilters(): void {
    this.departmentFilter.set(this.defaultDepartmentCode);
    this.provinceFilter.set('');
    this.departmentChanged.emit(this.defaultDepartmentCode);
  }

  selectedDistricts(): District[] {
    return this.form.controls.districtIds.value
      .map((id) => this.districts.find((district) => district.id === id))
      .filter((district): district is District => !!district);
  }

  isSelected(id: number): boolean {
    return this.form.controls.districtIds.value.includes(id);
  }

  toggleDistrict(id: number): void {
    const selectedIds = this.form.controls.districtIds.value;
    const nextIds = this.isSelected(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];
    this.form.controls.districtIds.setValue(nextIds);
    this.form.controls.districtIds.markAsDirty();
  }

  selectVisible(): void {
    const selectedIds = new Set(this.form.controls.districtIds.value);
    this.filteredDistricts().forEach((district) => selectedIds.add(district.id));
    this.form.controls.districtIds.setValue([...selectedIds]);
  }

  clearSelection(): void {
    this.form.controls.districtIds.setValue([]);
  }

  moveSelected(index: number, direction: -1 | 1): void {
    const selectedIds = [...this.form.controls.districtIds.value];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedIds.length) {
      return;
    }
    [selectedIds[index], selectedIds[targetIndex]] = [selectedIds[targetIndex], selectedIds[index]];
    this.form.controls.districtIds.setValue(selectedIds);
  }
}
