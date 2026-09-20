import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { HeaderComponent } from '@layout/header/header.component';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';
import { FooterComponent } from '@layout/footer/footer.component';
import { BranchContextStore } from '@features/branches/store/branch-context.store';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NgClass, HeaderComponent, SidebarComponent, FooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly branchContext = inject(BranchContextStore);
  readonly isSidebarCollapsed = signal(false);

  constructor() {
    this.branchContext.ensureInitialized();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((value) => !value);
  }

  setSidebarState(value: boolean): void {
    this.isSidebarCollapsed.set(value);
  }
}
