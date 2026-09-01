import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { computed, inject, signal } from '@angular/core';
import { ButtonComponent } from '@shared/components/button/button.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { AuthStore } from '@features/auth/store/auth.store';
import { AuthService } from '@features/auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonComponent, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'linamar-theme';
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isDark = signal(false);
  readonly user = this.authStore.user;
  readonly userName = computed(() => this.user()?.name ?? 'Invitado');
  readonly userRole = computed(() => {
    const role = this.user()?.role ?? 'user';
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Operaciones';
      default:
        return 'Usuario';
    }
  });

  constructor() {
    const saved = this.document.defaultView?.localStorage.getItem(this.storageKey);
    const initial = saved === 'linamar-dark' ? 'linamar-dark' : 'linamar';
    this.applyTheme(initial);
  }

  toggleTheme(): void {
    const next = this.isDark() ? 'linamar' : 'linamar-dark';
    this.applyTheme(next);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/auth/login']);
  }

  private applyTheme(theme: 'linamar' | 'linamar-dark'): void {
    this.document.documentElement.setAttribute('data-theme', theme);
    this.document.defaultView?.localStorage.setItem(this.storageKey, theme);
    this.isDark.set(theme === 'linamar-dark');
  }
}
