import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { HeaderComponent } from '@layout/header/header.component';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';
import { FooterComponent } from '@layout/footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NgClass, HeaderComponent, SidebarComponent, FooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  readonly isSidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((value) => !value);
  }

  setSidebarState(value: boolean): void {
    this.isSidebarCollapsed.set(value);
  }
}
