import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { Inject, Injectable, Optional } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AssetUrlService {
  private readonly baseHref: string;

  constructor(
    @Optional() @Inject(APP_BASE_HREF) baseHref: string | null,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    const href = baseHref || this.getDocumentBaseHref() || '/';
    this.baseHref = this.normalizeBaseHref(href);
  }

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
