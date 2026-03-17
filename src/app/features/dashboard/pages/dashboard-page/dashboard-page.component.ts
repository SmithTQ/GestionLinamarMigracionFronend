import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [PageContainerComponent, ButtonComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {}
