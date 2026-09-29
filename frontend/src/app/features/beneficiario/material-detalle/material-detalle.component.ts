import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { SocialApiService } from '../../../core/services/social-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { Material } from '../../../core/models';
import { erroresPorCampo, mensajeError } from '../../../core/utils/http';
import { formatearDia } from '../../../core/utils/fechas';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';

@Component({
  selector: 'app-material-detalle',
  standalone: true,
  imports: [RouterLink, DecimalPipe, ReactiveFormsModule, MatIconModule, EmptyStateComponent, CampoErrorComponent, EstadoBadgePipe, UploadUrlPipe, FechaRelativaPipe, CopCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './material-detalle.component.html',
  styles: [`
    .galeria { aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .galeria img { width: 100%; height: 100%; object-fit: cover; }
    .galeria mat-icon { font-size: 72px; width: 72px; height: 72px; opacity: .6; }
    .miniaturas { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .miniaturas button { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 2px solid transparent; padding: 0; cursor: pointer; background: none; }
    .miniaturas button.activa { border-color: var(--primary); }
    .miniaturas img { width: 100%; height: 100%; object-fit: cover; }
  `],
})
export class MaterialDetalleComponent {
  readonly id = input.required<string>();
  protected readonly auth = inject(AuthStore);
  private readonly api = inject(MaterialApiService);
  private readonly social = inject(SocialApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  protected readonly router = inject(Router);

  protected readonly material = signal<Material | null>(null);
  protected readonly cargando = signal(true);
  protected readonly foto = signal(0);
  protected readonly enviando = signal(false);
  protected readonly erroresServidor = signal<Record<string, string>>({});

  protected readonly form = inject(FormBuilder).nonNullable.group({
    cantidadSolicitada: [1, [Validators.required, Validators.min(0.01)]],
    propositoUso: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    descripcionProyecto: ['', Validators.maxLength(2000)],
  });

  protected readonly vence = computed(() => formatearDia(this.material()?.fechaLimite));
  protected readonly disponible = computed(() => this.material()?.estadoPublicacion === 'activo');
  protected readonly color = computed(() => this.material()?.categoria.colorHex ?? '#687069');

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargar(id));
    });
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.api.obtener(id).subscribe({
      next: (r) => {
        this.material.set(r.data);
        this.foto.set(0);
        const c = this.form.controls.cantidadSolicitada;
        c.setValidators([Validators.required, Validators.min(0.01), Validators.max(r.data.cantidad)]);
        c.setValue(Math.min(1, r.data.cantidad));
        this.cargando.set(false);
      },
      error: () => { this.material.set(null); this.cargando.set(false); },
    });
  }

  solicitar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.erroresServidor.set({});
    this.api.solicitar(this.id(), {
      cantidadSolicitada: Number(v.cantidadSolicitada),
      propositoUso: v.propositoUso.trim(),
      descripcionProyecto: v.descripcionProyecto.trim() || undefined,
    }).subscribe({
      next: (r) => {
        this.enviando.set(false);
        this.material.update((m) => (m ? { ...m, miSolicitudActiva: r.data } : m));
        this.toast.info('Solicitud enviada. Te avisaremos cuando la constructora responda.', 'Ver', () =>
          this.router.navigate(['/beneficiario/mis-solicitudes'], { queryParams: { id: r.data.id } }));
      },
      error: (e) => {
        this.enviando.set(false);
        this.erroresServidor.set(erroresPorCampo(e));
        this.toast.error(mensajeError(e));
      },
    });
  }

  reportar(): void {
    const m = this.material();
    if (!m) return;
    this.dialogo.pedirTexto({
      titulo: 'Reportar material', mensaje: '¿Qué problema encontraste con esta publicación?',
      confirmar: 'Enviar reporte', campo: { etiqueta: 'Motivo', minimo: 10 },
    }).subscribe((motivo) => this.social.reportar('material', m.id, motivo).subscribe({
      next: (r) => this.toast.exito(r.message),
      error: (e) => this.toast.error(mensajeError(e)),
    }));
  }
}
