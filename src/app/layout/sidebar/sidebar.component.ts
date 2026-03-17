import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, RouterLink, RouterLinkActive, ButtonComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  readonly items = [
    { label: 'Inicio', icon: 'IN', route: '/dashboard' },
    { label: 'Campanas', icon: 'CP', route: '/campaigns' },
    { label: 'Rutas', icon: 'RT', route: '/routes' },
    { label: 'Pedidos', icon: 'PD', route: '/orders' },
    { label: 'Administracion', icon: 'AD', route: '/admin' },
    { label: 'Reportes', icon: 'RP', route: '/reports' },
  ];

  toggle(): void {
    this.collapsedChange.emit(!this.collapsed);
  }
}
