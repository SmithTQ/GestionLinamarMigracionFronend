import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiKitService {
  getTableRows(): Record<string, string>[] {
    return [
      {
        id: 'CMP-2031',
        name: 'Madre 2026',
        status: 'Activa',
        owner: 'Andrea Soto',
        updated: '2026-03-14',
      },
      {
        id: 'CMP-2019',
        name: 'Rutas Express',
        status: 'Pausada',
        owner: 'Pablo Reyes',
        updated: '2026-03-10',
      },
      {
        id: 'CMP-2004',
        name: 'Onboarding Proveedores',
        status: 'Borrador',
        owner: 'Diego Ponce',
        updated: '2026-03-09',
      },
    ];
  }
}
