import { ChangeDetectionStrategy, Component, inject, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SocialApiService } from '../../../../core/services/social-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Publicacion, TipoPublicacion } from '../../../../core/models';
import { mensajeError } from '../../../../core/utils/http';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { CampoErrorComponent } from '../../../../shared/components/campo-error.component';
import { ETIQUETAS_TIPO_PUBLICACION } from '../../../../shared/pipes/etiqueta.pipe';

@Component({
  selector: 'app-composer',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, AvatarComponent, FileUploadComponent, CampoErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="composer card" aria-label="Crear publicación">
      @if (!abierto()) {
        <button type="button" class="trigger" (click)="abierto.set(true)">
          <app-avatar [name]="auth.nombre() || 'Tú'" [src]="auth.user()?.avatarUrl ?? auth.user()?.perfil?.logoUrl" [size]="40" />
          <span>¿Qué proyecto, idea o producto quieres compartir hoy?</span>
          <mat-icon>add_photo_alternate</mat-icon>
        </button>
      } @else {
        <form class="stack" [formGroup]="form" (ngSubmit)="publicar()">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="tipo-pub">Tipo *</label>
              <select id="tipo-pub" class="form-select" formControlName="tipo">
                @for (t of tipos; track t[0]) { <option [value]="t[0]">{{ t[1] }}</option> }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="titulo-pub">Título</label>
              <input id="titulo-pub" class="form-input" formControlName="titulo" placeholder="Opcional" maxlength="300" />
            </div>
            <div class="form-group span-2">
              <label class="form-label" for="contenido-pub">Contenido *</label>
              <textarea id="contenido-pub" class="form-textarea" rows="4" formControlName="contenido" maxlength="5000"
                        placeholder="Cuenta cómo reutilizaste el material, comparte un tutorial o muestra tu producto…"></textarea>
              <app-campo-error [control]="form.controls.contenido" />
            </div>
            <div class="form-group span-2">
              <span class="form-label">Fotos (hasta 5)</span>
              <app-file-upload [maxFiles]="5" etiqueta="Agrega fotos de tu proyecto" (archivos)="fotos.set($event)" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-ghost" (click)="cancelar()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="publicando()">
              @if (publicando()) { <mat-icon class="spin">sync</mat-icon> } Publicar
            </button>
          </div>
        </form>
      }
    </section>
  `,
  styles: [`
    .composer { padding: 16px 18px; }
    .trigger { display: flex; align-items: center; gap: 12px; width: 100%; background: none; border: none; cursor: pointer; text-align: left;
      span { flex: 1; background: var(--bg-base); border-radius: 22px; padding: 11px 16px; color: var(--text-secondary); font: 14px var(--font-body); }
      mat-icon { color: var(--accent); } }
  `],
})
export class ComposerComponent {
  readonly creada = output<Publicacion>();
  protected readonly auth = inject(AuthStore);
  private readonly api = inject(SocialApiService);
  private readonly toast = inject(ToastService);
  private readonly uploader = viewChild(FileUploadComponent);

  protected readonly tipos = Object.entries(ETIQUETAS_TIPO_PUBLICACION);
  protected readonly abierto = signal(false);
  protected readonly publicando = signal(false);
  protected readonly fotos = signal<File[]>([]);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    tipo: ['reutilizacion' as TipoPublicacion, Validators.required],
    titulo: [''],
    contenido: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
  });

  publicar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.publicando.set(true);
    this.api.publicar({ tipo: v.tipo, titulo: v.titulo.trim() || undefined, contenido: v.contenido.trim() }, this.fotos()).subscribe({
      next: (r) => {
        this.creada.emit(r.data);
        this.toast.exito('¡Publicación compartida con la comunidad!');
        this.cancelar();
        this.publicando.set(false);
      },
      error: (e) => { this.publicando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  cancelar(): void {
    this.form.reset({ tipo: 'reutilizacion', titulo: '', contenido: '' });
    this.fotos.set([]);
    this.uploader()?.reset();
    this.abierto.set(false);
  }
}
