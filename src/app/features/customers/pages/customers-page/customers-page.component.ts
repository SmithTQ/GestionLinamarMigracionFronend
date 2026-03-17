import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [PageContainerComponent],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPageComponent {}
