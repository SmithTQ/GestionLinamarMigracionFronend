import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AssetUrlService {
  private readonly document = inject(DOCUMENT);
  private readonly injectedBaseHref = inject(APP_BASE_HREF, { optional: true });
  private readonly baseHref = this.normalizeBaseHref(
    this.injectedBaseHref || this.getDocumentBaseHref() || '/',
  );

  build(path: string): string {
    if (!path) {
      return this.baseHref;
    }

    if (this.isAbsoluteUrl(path)) {
      return path;
    }

    const normalizedPath = path.replace(/^\/+/, '');
    return `${this.baseHref}${normalizedPath}`;
  }

  private normalizeBaseHref(href: string): string {
    let normalized = href.trim();
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    if (!normalized.endsWith('/')) {
      normalized = `${normalized}/`;
    }
    return normalized;
  }

  private isAbsoluteUrl(path: string): boolean {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path);
  }

  private getDocumentBaseHref(): string | null {
    const base = this.document.querySelector('base');
    if (base?.getAttribute('href')) {
      return base.getAttribute('href');
    }
    const uri = this.document.baseURI;
    if (!uri) {
      return null;
    }
    try {
      const url = new URL(uri);
      return url.pathname || '/';
    } catch {
      return null;
    }
  }
}
