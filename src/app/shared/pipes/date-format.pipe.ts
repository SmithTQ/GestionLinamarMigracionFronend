import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  transform(value: Date | string, locale = 'es-PE'): string {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
    }).format(new Date(value));
  }
}
