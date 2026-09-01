import { Pipe, PipeTransform } from '@angular/core';
import { AssetUrlService } from '@core/services/asset-url.service';

@Pipe({
  name: 'assetUrl',
  standalone: true,
})
export class AssetUrlPipe implements PipeTransform {
  constructor(private readonly assetUrlService: AssetUrlService) {}

  transform(path: string): string {
    return this.assetUrlService.build(path);
  }
}
