import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ButtonComponent, InputComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  // UI-only component. No integration logic here by design.
}
