import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  @Input({ required: true }) name!: string;
  @Input() size = 18;
  @Input() strokeWidth = 2;
  @Input() className = '';
  @Input() ariaHidden = true;
}
