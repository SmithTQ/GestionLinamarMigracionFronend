import { Injectable } from '@angular/core';
import { Campaign } from '../models/campaign.model';

@Injectable({ providedIn: 'root' })
export class CampaignsService {
  getCampaigns(): Campaign[] {
    return [
      {
        id: 'CMP-2031',
        name: 'Madre 2026',
        status: 'active',
        budget: 54000,
        startDate: '2026-03-01',
        endDate: '2026-04-15',
        ordersCount: 1280,
        deliveredCount: 1192,
        totalObtained: 68250,
      },
      {
        id: 'CMP-2019',
        name: 'Rutas Express',
        status: 'paused',
        budget: 22000,
        startDate: '2026-02-10',
        endDate: '2026-03-05',
        ordersCount: 620,
        deliveredCount: 497,
        totalObtained: 21440,
      },
      {
        id: 'CMP-2011',
        name: 'Clientes Premium',
        status: 'active',
        budget: 31500,
        startDate: '2026-03-08',
        endDate: '2026-04-20',
        ordersCount: 940,
        deliveredCount: 911,
        totalObtained: 45210,
      },
      {
        id: 'CMP-2004',
        name: 'Onboarding Proveedores',
        status: 'draft',
        budget: 18000,
        startDate: '2026-03-20',
        endDate: '2026-04-10',
        ordersCount: 120,
        deliveredCount: 68,
        totalObtained: 6840,
      },
    ];
  }
}
