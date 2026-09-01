import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  readonly groups = [
    {
      label: 'Operacion',
      items: [
        { label: 'Inicio', icon: 'layout-dashboard', route: '/dashboard' },
        { label: 'Campanas', icon: 'megaphone', route: '/campaigns' },
        { label: 'Rutas', icon: 'route', route: '/routes' },
        { label: 'Pedidos', icon: 'clipboard-list', route: '/orders' },
        { label: 'Reportes', icon: 'chart-bar', route: '/reports' },
      ],
    },
    {
      label: 'Administracion',
      items: [
        { label: 'Administracion', icon: 'settings', route: '/admin' },
        { label: 'Componentes', icon: 'layout-grid', route: '/ui-kit' },
      ],
    },
  ];

  toggle(): void {
    this.collapsedChange.emit(!this.collapsed);
  }
}
