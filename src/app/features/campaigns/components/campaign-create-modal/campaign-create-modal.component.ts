import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Campaign } from '@features/campaigns/models/campaign.model';
import { DistrictList } from '@features/districts/models/district.model';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

export interface CampaignFormValue {
  name: string;
  status: Campaign['status'];
  startsOn: string;
  endsOn?: string;
  branchIds: number[];
  districtListId: number | null;
}

@Component({
  selector: 'app-campaign-create-modal',
  standalone: true,
  imports: [ButtonComponent, InputComponent, LoadingComponent, ModalComponent, ReactiveFormsModule],
  templateUrl: './campaign-create-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignCreateModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() isSaving = false;
  @Input() isLoadingData = false;
  @Input() campaign: Campaign | null = null;
  @Input() nameError?: string;
  @Input() detailError?: string;
  @Input() districtLists: DistrictList[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<CampaignFormValue>();

  private readonly formBuilder = inject(NonNullableFormBuilder);
  readonly form = this.formBuilder.group(
    {
      name: ['', Validators.required],
      startsOn: ['', Validators.required],
      endsOn: [''],
      status: ['draft' as Campaign['status']],
      branchIds: [[] as number[]],
      districtListId: [null as number | null],
    },
    { validators: dateRangeValidator },
  );

  ngOnChanges(changes: SimpleChanges): void {
    const isOpening = changes['isOpen']?.currentValue === true;
    if (changes['campaign'] || changes['districtLists'] || isOpening) {
      this.loadCampaign(this.campaign);
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const values = this.form.getRawValue();
    this.submitted.emit({
      name: values.name.trim(),
      status: values.status,
      startsOn: values.startsOn,
      endsOn: values.endsOn || undefined,
      branchIds: values.branchIds,
      districtListId: values.districtListId,
    });
  }

  close(): void {
    if (this.isSaving || this.isLoadingData) {
      return;
    }
    this.closed.emit();
  }

  updateDistrictList(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.form.controls.districtListId.setValue(value ? Number(value) : null);
  }

  reset(): void {
    this.form.reset({
      name: '',
      startsOn: '',
      endsOn: '',
      status: 'draft',
      branchIds: [],
      districtListId: null,
    });
    this.form.markAsUntouched();
  }

  private loadCampaign(campaign: Campaign | null): void {
    if (!campaign) {
      this.reset();
      return;
    }
    this.form.reset({
      name: campaign.name,
      startsOn: campaign.startsOn,
      endsOn: campaign.endsOn ?? '',
      status: campaign.status,
      branchIds: campaign.branches?.map((branch) => branch.id) ?? [],
      districtListId: campaign.districtLists?.[0]?.id ?? null,
    });
    this.form.markAsUntouched();
  }
}

const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const startsOn = control.get('startsOn')?.value as string | undefined;
  const endsOn = control.get('endsOn')?.value as string | undefined;
  return startsOn && endsOn && endsOn < startsOn ? { dateRange: true } : null;
};
