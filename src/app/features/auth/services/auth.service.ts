import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, switchMap, tap, throwError } from 'rxjs';
import { AUTH_REPOSITORY } from './auth.repository';
import { AuthSession, LoginCredentials } from '@features/auth/models/auth.model';
import { AuthStore } from '@features/auth/store/auth.store';
import { CampaignContextStore } from '@features/campaigns/store/campaign-context.store';
import { BranchContextStore } from '@features/branches/store/branch-context.store';
import { SessionDataStateService } from '@core/services/session-data-state.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authRepository = inject(AUTH_REPOSITORY);
  private readonly store = inject(AuthStore);
  private readonly campaignContext = inject(CampaignContextStore);
  private readonly branchContext = inject(BranchContextStore);
  private readonly sessionDataState = inject(SessionDataStateService);

  readonly user = this.store.user;
  readonly isAuthenticated = this.store.isAuthenticated;

  authenticate(credentials: LoginCredentials): Observable<AuthSession> {
    return this.authRepository.login(credentials).pipe(
      tap((session) => {
        this.sessionDataState.reset();
        this.branchContext.reset();
        this.campaignContext.reset();
        this.store.setSession(session);
      }),
      switchMap((session) =>
        this.authRepository.me().pipe(
          map((user) => ({ ...session, user })),
          tap((resolvedSession) => this.store.setSession(resolvedSession)),
          catchError((error: unknown) => {
            this.sessionDataState.reset();
            this.branchContext.reset();
            this.campaignContext.reset();
            this.store.clearSession();
            return throwError(() => error);
          }),
        ),
      ),
    );
  }

  restoreSession(): Observable<AuthSession['user'] | null> {
    if (!this.store.token()) {
      return of(null);
    }

    return this.authRepository.me().pipe(
      tap((user) => this.store.setUser(user)),
      catchError(() => {
        this.sessionDataState.reset();
        this.branchContext.reset();
        this.campaignContext.reset();
        this.store.clearSession();
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    return this.authRepository.logout().pipe(
      catchError(() => of(undefined)),
      finalize(() => {
        this.sessionDataState.reset();
        this.branchContext.reset();
        this.campaignContext.reset();
        this.store.clearSession();
      }),
    );
  }
}
