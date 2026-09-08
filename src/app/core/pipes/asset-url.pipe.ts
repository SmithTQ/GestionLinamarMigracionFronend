import { Pipe, PipeTransform, inject } from '@angular/core';
import { AssetUrlService } from '@core/services/asset-url.service';

@Pipe({
  name: 'assetUrl',
  standalone: true,
})
export class AssetUrlPipe implements PipeTransform {
  private readonly assetUrlService = inject(AssetUrlService);

  transform(path: string): string {
    return this.assetUrlService.build(path);
  }
}
