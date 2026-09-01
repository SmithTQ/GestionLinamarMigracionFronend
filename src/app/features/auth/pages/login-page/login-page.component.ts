import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { AuthService } from '@features/auth/services/auth.service';
import { LoginCredentials } from '@features/auth/models/auth.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [NgIf, ButtonComponent, InputComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  readonly baseInputClass =
    'bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-slate-400';
  readonly passwordInputClass = `${this.baseInputClass} pr-24`;
  readonly email = signal('');
  readonly password = signal('');
  readonly rememberMe = signal(true);
  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    const email = this.email().trim();
    const password = this.password();

    if (!email || !password) {
      this.errorMessage.set('Completa tu correo y contrasena para continuar.');
      return;
    }

    const payload: LoginCredentials = {
      email,
      password,
      rememberMe: this.rememberMe(),
    };

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.authenticate(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        const serverMessage =
          error instanceof HttpErrorResponse && typeof error.error?.error === 'string'
            ? error.error.error
            : null;
        this.errorMessage.set(serverMessage ?? 'No se pudo iniciar sesion.');
        this.isSubmitting.set(false);
      },
    });
  }
}
