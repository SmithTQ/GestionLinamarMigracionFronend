import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type IconPath = string;

const ICON_PATHS: Record<string, IconPath[]> = {
  archive: ['M3 7h18', 'M5 7v13h14V7', 'M5 4h14v3H5z', 'M9 11h6'],
  'arrow-down': ['M12 5v14', 'm19 12-7 7-7-7'],
  'arrow-up': ['M12 19V5', 'm5 12 7-7 7 7'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  camera: ['M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
  'building-2': [
    'M3 21h18',
    'M6 21V3h12v18',
    'M9 7h.01',
    'M15 7h.01',
    'M9 11h.01',
    'M15 11h.01',
    'M9 15h.01',
    'M15 15h.01',
  ],
  'chart-bar': ['M3 3v18h18', 'M7 16v-5', 'M12 16V8', 'M17 16v-8'],
  check: ['m5 12 4 4L19 6'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'circle-alert': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', 'M12 8v4', 'M12 16h.01'],
  'circle-pause': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', 'M10 8v8', 'M14 8v8'],
  'circle-user': [
    'M18 20a6 6 0 0 0-12 0',
    'M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  ],
  'clipboard-list': [
    'M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4',
    'M9 3h6v4H9z',
    'M8 12h8',
    'M8 16h6',
  ],
  download: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 21h14'],
  'external-link': [
    'M15 3h6v6',
    'M10 14 21 3',
    'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  ],
  eye: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6'],
  'file-pen-line': ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z', 'M15 5l3 3'],
  'file-text': ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h6'],
  'layout-dashboard': ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  'layout-grid': ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  megaphone: ['m3 11 18-5v12L3 14v-3', 'M11.6 16.8a3 3 0 0 1-5.8-1.6'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  'map-pin': ['M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6'],
  moon: ['M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5'],
  navigation: ['m3 11 19-8-8 19-2-8-8-3Z', 'M14 14 22 3'],
  pencil: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z', 'M15 5l3 3'],
  plus: ['M12 5v14', 'M5 12h14'],
  package: [
    'm16.5 9.4-9-5.19',
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
    'M3.27 6.96 12 12.01l8.73-5.05',
    'M12 22.08V12',
  ],
  route: ['M3 6h5l3 6h5l3 6h2', 'M3 18h5l3-6h5l3-6h2'],
  'refresh-cw': ['M21 12a9 9 0 0 0-15.5-6.2L3 8', 'M3 3v5h5', 'M3 12a9 9 0 0 0 15.5 6.2L21 16', 'M21 21v-5h-5'],
  search: ['m21 21-4.3-4.3', 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16'],
  send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
  settings: [
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7',
    'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.4 1.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L9 17.3l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H7v-2h.9a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L9 9.3l1.4-1.4.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V6h2v.8a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.4 1.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.9v2h-.9a1.7 1.7 0 0 0-1.5 1Z',
  ],
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
    'M12 2v2',
    'M12 20v2',
    'm4.93 4.93 1.42 1.42',
    'm17.65 17.65 1.42 1.42',
    'M2 12h2',
    'M20 12h2',
    'm6.35 6.35-1.42 1.42',
    'm19.07 4.93-1.42 1.42',
  ],
  'user-check': [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    'm16 11 2 2 4-4',
  ],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgClass],
  templateUrl: './icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  @Input({ required: true }) name!: string;
  @Input() size = 18;
  @Input() strokeWidth = 2;
  @Input() className = '';

  get iconPaths(): IconPath[] {
    return ICON_PATHS[this.name.toLowerCase()] ?? ICON_PATHS['circle-alert'];
  }
}
