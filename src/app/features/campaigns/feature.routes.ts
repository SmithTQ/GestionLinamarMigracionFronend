import { Routes } from '@angular/router';
import { CampaignsPageComponent } from '@features/campaigns/pages/campaigns-page/campaigns-page.component';

export const CAMPAIGNS_ROUTES: Routes = [
  {
    path: '',
    component: CampaignsPageComponent,
  },
];
