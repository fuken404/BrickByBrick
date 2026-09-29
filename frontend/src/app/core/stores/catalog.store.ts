import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, of, shareReplay, tap } from 'rxjs';
import { CategoriaMaterial, Localidad } from '../models';
import { UserApiService } from '../services/user-api.service';
import { MaterialApiService } from '../services/material-api.service';

/** Catálogos (localidades y categorías) cacheados en memoria. */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly users = inject(UserApiService);
  private readonly materials = inject(MaterialApiService);

  readonly localidades = signal<Localidad[]>([]);
  readonly categorias = signal<CategoriaMaterial[]>([]);

  private localidades$?: Observable<Localidad[]>;
  private categorias$?: Observable<CategoriaMaterial[]>;

  cargarLocalidades(): Observable<Localidad[]> {
    if (this.localidades().length) return of(this.localidades());
    this.localidades$ ??= this.users.localidades().pipe(
      map((r) => r.data),
      tap((l) => this.localidades.set(l)),
      shareReplay(1),
    );
    return this.localidades$;
  }

  cargarCategorias(forzar = false): Observable<CategoriaMaterial[]> {
    if (!forzar && this.categorias().length) return of(this.categorias());
    if (forzar) this.categorias$ = undefined;
    this.categorias$ ??= this.materials.categorias().pipe(
      map((r) => r.data),
      tap((c) => this.categorias.set(c)),
      shareReplay(1),
    );
    return this.categorias$;
  }

  cargarTodo(): void {
    this.cargarLocalidades().subscribe({ error: () => undefined });
    this.cargarCategorias().subscribe({ error: () => undefined });
  }
}
