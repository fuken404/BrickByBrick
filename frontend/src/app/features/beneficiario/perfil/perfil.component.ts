import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { UserApiService } from '../../../core/services/user-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { ToastService } from '../../../core/services/toast.service';
import { Genero, Me } from '../../../core/models';
import { erroresPorCampo, mensajeError } from '../../../core/utils/http';
import { fechaSoloDia } from '../../../core/utils/fechas';
import { mayorDeEdad } from '../../../shared/validators/validadores';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';
import { SeguridadCuentaComponent } from '../../comun/cuenta/seguridad-cuenta.component';

type Pestana = 'datos' | 'portafolio' | 'seguridad';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatIconModule, AvatarComponent, CampoErrorComponent, SeguridadCuentaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil.component.html',
})
export class PerfilComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly users = inject(UserApiService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly me = signal<Me | null>(null);
  protected readonly pestana = signal<Pestana>('datos');
  protected readonly guardando = signal(false);
  protected readonly subiendoAvatar = signal(false);
  protected readonly errores = signal<Record<string, string>>({});

  protected readonly datos = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    fechaNacimiento: ['', [Validators.required, mayorDeEdad]],
    genero: ['' as Genero | ''],
    estrato: [null as number | null],
    localidadId: [null as number | null, Validators.required],
  });

  protected readonly portafolio = this.fb.group({
    nombreEmprendimiento: ['', [Validators.minLength(2), Validators.maxLength(150)]],
    bioPublica: ['', Validators.maxLength(1000)],
    portafolioPublico: [false],
  });

  ngOnInit(): void {
    this.catalogo.cargarLocalidades().subscribe({ error: () => undefined });
    this.users.me().subscribe({ next: (r) => this.establecer(r.data) });
  }

  private establecer(me: Me): void {
    this.me.set(me);
    const b = me.beneficiario;
    if (!b) return;
    this.datos.reset({
      nombreCompleto: b.nombreCompleto, fechaNacimiento: fechaSoloDia(b.fechaNacimiento), genero: b.genero ?? '',
      estrato: b.estrato, localidadId: b.localidad?.id ?? null,
    });
    this.portafolio.reset({
      nombreEmprendimiento: b.nombreEmprendimiento ?? '', bioPublica: b.bioPublica ?? '', portafolioPublico: b.portafolioPublico,
    });
  }

  guardarDatos(): void {
    this.datos.markAllAsTouched();
    const b = this.me()?.beneficiario;
    if (this.datos.invalid || !b) return;
    const v = this.datos.getRawValue();
    this.guardando.set(true);
    this.errores.set({});
    this.users.actualizarBeneficiario(b.id, {
      nombreCompleto: v.nombreCompleto.trim(), fechaNacimiento: v.fechaNacimiento, genero: v.genero || null,
      estrato: v.estrato ? Number(v.estrato) : null, localidadId: v.localidadId ? Number(v.localidadId) : null,
    }).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.me.update((m) => (m ? { ...m, beneficiario: { ...m.beneficiario!, ...r.data } } : m));
        this.auth.actualizarPerfil({ nombreCompleto: r.data.nombreCompleto, localidadId: r.data.localidad?.id ?? null });
        this.datos.markAsPristine();
        this.toast.exito('Datos actualizados');
      },
      error: (e) => { this.guardando.set(false); this.errores.set(erroresPorCampo(e)); this.toast.error(mensajeError(e)); },
    });
  }

  guardarPortafolio(): void {
    this.portafolio.markAllAsTouched();
    const b = this.me()?.beneficiario;
    if (this.portafolio.invalid || !b) return;
    const v = this.portafolio.getRawValue();
    this.guardando.set(true);
    this.users.actualizarPortafolio(b.id, {
      nombreEmprendimiento: v.nombreEmprendimiento.trim() || null, bioPublica: v.bioPublica.trim() || null, portafolioPublico: v.portafolioPublico,
    }).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.me.update((m) => (m ? { ...m, beneficiario: { ...m.beneficiario!, ...r.data } } : m));
        this.auth.actualizarPerfil({ nombreEmprendimiento: r.data.nombreEmprendimiento });
        this.portafolio.markAsPristine();
        this.toast.exito('Portafolio actualizado');
      },
      error: (e) => { this.guardando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  subirAvatar(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toast.error('La imagen supera 5 MB'); return; }
    this.subiendoAvatar.set(true);
    this.users.subirAvatar(file).subscribe({
      next: (r) => {
        this.subiendoAvatar.set(false);
        this.me.update((m) => (m ? { ...m, avatarUrl: r.data.avatarUrl } : m));
        this.auth.actualizarUsuario({ avatarUrl: r.data.avatarUrl });
        this.toast.exito('Foto actualizada');
      },
      error: (err) => { this.subiendoAvatar.set(false); this.toast.error(mensajeError(err)); },
    });
  }

  /** Conserva el perfil (beneficiario/constructora) al actualizar los datos de la cuenta. */
  cuentaCambiada(cambios: Me): void {
    this.me.update((m) => (m ? { ...m, ...cambios, beneficiario: m.beneficiario, constructora: m.constructora } : cambios));
  }
}
