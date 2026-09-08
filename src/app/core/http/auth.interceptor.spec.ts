import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthSession } from '@features/auth/models/auth.model';
import { AuthStore } from '@features/auth/store/auth.store';
import { ApiErrorStore } from '@core/services/api-error.store';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const session: AuthSession = {
    token: 'token-test',
    user: {
      id: 1,
      name: 'Usuario Test',
      username: 'usuario.test',
      email: 'test@linamar.test',
      is_active: true,
      roles: [],
    },
  };

  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(AuthStore).setSession(session);
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('adds JSON and bearer headers to protected requests', () => {
    http.get('/api/orders').subscribe();

    const request = httpTesting.expectOne('/api/orders');

    expect(request.request.headers.get('Accept')).toBe('application/json');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-test');
    request.flush({ codigo: 200, mensaje: 'ok', datos: [] });
  });

  it('does not add a bearer token to login', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });

    const request = httpTesting.expectOne('/api/auth/login');

    expect(request.request.headers.get('Accept')).toBe('application/json');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush(
      { codigo: 401, mensaje: 'invalid', datos: null },
      { status: 401, statusText: 'Unauthorized' },
    );
  });

  it('publishes a backend error message', () => {
    http.get('/api/orders').subscribe({ error: () => undefined });

    const request = httpTesting.expectOne('/api/orders');
    request.flush(
      { codigo: 403, mensaje: 'Permiso insuficiente.', datos: null },
      { status: 403, statusText: 'Forbidden' },
    );

    expect(TestBed.inject(ApiErrorStore).message()).toBe('Permiso insuficiente.');
  });
});
