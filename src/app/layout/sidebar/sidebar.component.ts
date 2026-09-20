import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '@shared/components/icon/icon.component';
import { CampaignContextStore } from '@features/campaigns/store/campaign-context.store';
import { AuthStore } from '@features/auth/store/auth.store';
import { OperationalMode } from '@core/models/user.model';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  permissions?: string[];
  requireAll?: boolean;
  operationalModes?: OperationalMode[];
}
interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly campaignContext = inject(CampaignContextStore);
  private readonly authStore = inject(AuthStore);
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  logoLoadFailed = false;
  readonly activeCampaign = this.campaignContext.activeCampaign;
  readonly groups = computed(() =>
    NAVIGATION_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => this.hasAccess(item)),
    })).filter((group) => group.items.length > 0),
  );
  toggle(): void {
    this.collapsedChange.emit(!this.collapsed);
  }
  onLogoError(): void {
    this.logoLoadFailed = true;
  }
  private hasAccess(item: NavigationItem): boolean {
    const hasRequiredPermissions =
      !item.permissions?.length ||
      (item.requireAll
        ? item.permissions.every((permission) => this.authStore.hasPermission(permission))
        : this.authStore.hasAnyPermission(item.permissions));
    const currentMode = this.authStore.user()?.operational_context?.mode ?? null;
    const hasOperationalAccess =
      !item.operationalModes?.length || item.operationalModes.includes(currentMode);

    return hasRequiredPermissions && hasOperationalAccess;
  }
}

const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    label: 'Operacion',
    items: [
      { label: 'Inicio', icon: 'layout-dashboard', route: '/dashboard' },
      {
        label: 'Campanas',
        icon: 'megaphone',
        route: '/campaigns',
        permissions: ['campaigns.view'],
        operationalModes: ['super_admin', 'branch_admin'],
      },
      { label: 'Rutas', icon: 'route', route: '/routes', permissions: ['routes.manage'] },
      { label: 'Pedidos', icon: 'clipboard-list', route: '/orders', permissions: ['orders.view'] },
    ],
  },
  {
    label: 'Gestion de catalogos',
    items: [
      {
        label: 'Distritos',
        icon: 'map-pin',
        route: '/districts',
        permissions: ['districts.view', 'district_lists.view'],
        requireAll: true,
        operationalModes: ['super_admin', 'branch_admin'],
      },
      {
        label: 'Productos',
        icon: 'package',
        route: '/products',
        permissions: ['products.view'],
        operationalModes: ['super_admin', 'branch_admin'],
      },
    ],
  },
  {
    label: 'Administracion',
    items: [
      {
        label: 'Usuarios',
        icon: 'users',
        route: '/users',
        permissions: ['users.view'],
        operationalModes: ['super_admin', 'branch_admin'],
      },
      {
        label: 'Sucursales',
        icon: 'building-2',
        route: '/branches',
        permissions: ['branches.view'],
        operationalModes: ['super_admin'],
      },
    ],
  },
];
