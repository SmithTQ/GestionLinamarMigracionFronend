import { ChangeDetectionStrategy, Component, EventEmitter, Output, DOCUMENT } from '@angular/core';

import { computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ButtonComponent } from '@shared/components/button/button.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { AuthStore } from '@features/auth/store/auth.store';
import { AuthService } from '@features/auth/services/auth.service';
import { Router } from '@angular/router';
import { CampaignContextStore } from '@features/campaigns/store/campaign-context.store';
import { BranchContextStore } from '@features/branches/store/branch-context.store';

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
  @Output() inviteRequested = new EventEmitter<void>();

  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'linamar-theme';
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly campaignContext = inject(CampaignContextStore);
  private readonly branchContext = inject(BranchContextStore);

  readonly isDark = signal(false);
  readonly isLoggingOut = signal(false);
  readonly user = this.authStore.user;
  readonly userName = computed(() => this.user()?.name ?? 'Invitado');
  readonly userRole = computed(() => {
    return this.user()?.roles[0]?.name ?? 'Usuario';
  });
  readonly availableCampaigns = this.campaignContext.availableCampaigns;
  readonly activeCampaign = this.campaignContext.activeCampaign;
  readonly activeCampaignId = this.campaignContext.activeCampaignId;
  readonly canGenerateInvitation = computed(
    () =>
      this.activeCampaign() !== null &&
      this.authStore.hasPermission('forms.view') &&
      this.authStore.hasPermission('orders.manage'),
  );
  readonly campaignSwitcherOpen = signal(false);
  readonly branches = this.branchContext.branches;
  readonly activeBranch = this.branchContext.activeBranch;
  readonly requiresBranchSelection = this.branchContext.requiresBranchSelection;

  selectCampaign(value: string): void {
    const campaignId = Number(value);
    if (Number.isInteger(campaignId)) {
      this.campaignContext.selectCampaign(campaignId);
      this.campaignSwitcherOpen.set(false);
    }
  }

  toggleCampaignSwitcher(): void {
    this.campaignSwitcherOpen.update((isOpen) => !isOpen);
  }

  closeCampaignSwitcher(): void {
    this.campaignSwitcherOpen.set(false);
  }

  selectBranch(branchId: number): void {
    if (!this.branchContext.selectBranch(branchId)) return;

    this.campaignContext.reset();
    void this.router.navigate(['/campaign-selection']);
  }

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
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.authService
      .logout()
      .pipe(finalize(() => this.isLoggingOut.set(false)))
      .subscribe(() => void this.router.navigate(['/auth/login']));
  }

  private applyTheme(theme: 'linamar' | 'linamar-dark'): void {
    this.document.documentElement.setAttribute('data-theme', theme);
    this.document.defaultView?.localStorage.setItem(this.storageKey, theme);
    this.isDark.set(theme === 'linamar-dark');
  }
}
