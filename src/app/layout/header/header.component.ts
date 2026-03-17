import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
}
