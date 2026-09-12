import { TestBed } from '@angular/core/testing';
import { AuthSession } from '@features/auth/models/auth.model';
import { STORAGE_KEYS } from '@core/constants/storage-keys';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  const session: AuthSession = {
    token: 'token-test',
    user: {
      id: 1,
      name: 'Usuario Test',
      username: 'usuario.test',
      email: 'test@linamar.test',
      is_active: true,
      roles: [
        {
          id: 1,
          name: 'Gestor de campañas',
          slug: 'campaign_manager',
          is_active: true,
          permissions: [
            {
              id: 1,
              name: 'Ver campañas',
              slug: 'campaigns.view',
              module: 'campaigns',
              action: 'view',
              is_active: true,
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [AuthStore] });
  });

  it('restores a persisted session', () => {
    sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(session.user));
    sessionStorage.setItem(STORAGE_KEYS.token, session.token);

    const store = TestBed.inject(AuthStore);

    expect(store.isAuthenticated()).toBeTrue();
    expect(store.user()?.username).toBe('usuario.test');
  });

  it('checks permissions from the roles returned by the API', () => {
    const store = TestBed.inject(AuthStore);
    store.setSession(session);

    expect(store.hasPermission('campaigns.view')).toBeTrue();
    expect(store.hasPermission('orders.manage')).toBeFalse();
  });

  it('clears the session and storage', () => {
    const store = TestBed.inject(AuthStore);
    store.setSession(session);

    store.clearSession();

    expect(store.isAuthenticated()).toBeFalse();
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.user)).toBeNull();
  });
});
