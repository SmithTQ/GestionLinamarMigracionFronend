import { Injectable } from '@angular/core';

/**
 * Coordinates in-memory data that is valid only for the current operational session.
 * Stores register their reset operation once; authentication and scope changes can then
 * invalidate all previously loaded business data without depending on feature internals.
 */
@Injectable({ providedIn: 'root' })
export class SessionDataStateService {
  private readonly resetters = new Set<() => void>();

  register(reset: () => void): void {
    this.resetters.add(reset);
  }

  reset(): void {
    this.resetters.forEach((reset) => reset());
  }
}
