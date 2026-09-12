import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, OperatorFunction, catchError, finalize, throwError } from 'rxjs';
import { District, DistrictList, PagedResult } from '../models/district.model';
import { DistrictListQuery, DistrictsService } from '../services/districts.service';
import { DistrictListPayload, DistrictPayload } from '../services/district.dto';

@Injectable({ providedIn: 'root' })
export class DistrictsStore {
  private readonly service = inject(DistrictsService);
  private readonly districtsState = signal<District[]>([]);
  private readonly districtListsState = signal<DistrictList[]>([]);
  private readonly districtPageState = signal<PagedResult<District>>({
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  private readonly districtListPageState = signal<PagedResult<DistrictList>>({
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private loadRequestId = 0;

  readonly districts = this.districtsState.asReadonly();
  readonly districtLists = this.districtListsState.asReadonly();
  readonly districtPage = this.districtPageState.asReadonly();
  readonly districtListPage = this.districtListPageState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly hasDistricts = computed(() => this.districtsState().length > 0);

  loadDistricts(query: DistrictListQuery): void {
    const requestId = ++this.loadRequestId;
    this.loadingState.set(true);
    this.errorState.set(null);
    this.service
      .listDistricts(query)
      .pipe(
        finalize(() => {
          if (requestId === this.loadRequestId) {
            this.loadingState.set(false);
          }
        }),
      )
      .subscribe({
        next: (page) => {
          if (requestId !== this.loadRequestId) {
            return;
          }
          this.districtPageState.set(page);
          this.districtsState.set(page.items);
        },
        error: () => {
          if (requestId === this.loadRequestId) {
            this.errorState.set('No se pudieron cargar los distritos.');
          }
        },
      });
  }

  loadDistrictLists(query: DistrictListQuery): void {
    const requestId = ++this.loadRequestId;
    this.loadingState.set(true);
    this.errorState.set(null);
    this.service
      .listDistrictLists(query)
      .pipe(
        finalize(() => {
          if (requestId === this.loadRequestId) {
            this.loadingState.set(false);
          }
        }),
      )
      .subscribe({
        next: (page) => {
          if (requestId !== this.loadRequestId) {
            return;
          }
          this.districtListPageState.set(page);
          this.districtListsState.set(page.items);
        },
        error: () => {
          if (requestId === this.loadRequestId) {
            this.errorState.set('No se pudieron cargar las plantillas.');
          }
        },
      });
  }

  createDistrict(payload: DistrictPayload): Observable<District> {
    return this.service
      .createDistrict(payload)
      .pipe(this.withMutationError('No se pudo crear el distrito.'));
  }

  updateDistrict(id: number, payload: Partial<DistrictPayload>): Observable<District> {
    return this.service
      .updateDistrict(id, payload)
      .pipe(this.withMutationError('No se pudo actualizar el distrito.'));
  }

  deleteDistrict(id: number): Observable<void> {
    return this.service
      .deleteDistrict(id)
      .pipe(this.withMutationError('No se pudo desactivar el distrito.'));
  }

  createDistrictList(payload: DistrictListPayload): Observable<DistrictList> {
    return this.service
      .createDistrictList(payload)
      .pipe(this.withMutationError('No se pudo crear la lista de cobertura.'));
  }

  updateDistrictList(id: number, payload: Partial<DistrictListPayload>): Observable<DistrictList> {
    return this.service
      .updateDistrictList(id, payload)
      .pipe(this.withMutationError('No se pudo actualizar la lista de cobertura.'));
  }

  deleteDistrictList(id: number): Observable<void> {
    return this.service
      .deleteDistrictList(id)
      .pipe(this.withMutationError('No se pudo desactivar la lista de cobertura.'));
  }

  private withMutationError<T>(message: string): OperatorFunction<T, T> {
    return catchError((error: unknown) => {
      this.errorState.set(message);
      return throwError(() => error);
    });
  }
}
