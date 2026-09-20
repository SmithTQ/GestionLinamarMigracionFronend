import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-publish-campaign-confirmation-modal',
  standalone: true,
  imports: [ButtonComponent, ModalComponent],
  templateUrl: './publish-campaign-confirmation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishCampaignConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() isSaving = false;
  @Input() error: string | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
}
