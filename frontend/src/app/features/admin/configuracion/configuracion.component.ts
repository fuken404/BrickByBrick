import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { CategoriaMaterial, SaludServicios } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';

interface CategoriaEditable { id: number | null; nombre: string; colorHex: string; icono: string }

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatIconModule, CampoErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './configuracion.component.html',
})
export class AdminConfiguracionComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly materiales = inject(MaterialApiService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);

  protected readonly guardando = signal(false);
  protected readonly salud = signal<SaludServicios | null>(null);
  protected readonly revisandoSalud = signal(false);
  protected readonly editando = signal<CategoriaEditable | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    maxSolicitudesActivasBeneficiario: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
    maxFotosMaterial: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    diasRecordatorioVencimiento: [3, [Validators.required, Validators.min(1), Validators.max(30)]],
    umbralReportesOcultar: [5, [Validators.required, Validators.min(1), Validators.max(100)]],
    porcentajeDescuentoTributario: [25, [Validators.required, Validators.min(0), Validators.max(100)]],
    topeDescuentoSobreImpuesto: [25, [Validators.required, Validators.min(0), Validators.max(100)]],
    emailSoporte: ['', [Validators.required, Validators.email]],
    modoMantenimiento: [false],
  });

  ngOnInit(): void {
    this.api.configuracion().subscribe({ next: (r) => this.form.reset(r.data) });
    this.catalogo.cargarCategorias(true).subscribe({ error: () => undefined });
    this.revisarSalud();
  }

  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.getRawValue();
    this.api.guardarConfiguracion({
      ...v,
      maxSolicitudesActivasBeneficiario: Number(v.maxSolicitudesActivasBeneficiario), maxFotosMaterial: Number(v.maxFotosMaterial),
      diasRecordatorioVencimiento: Number(v.diasRecordatorioVencimiento), umbralReportesOcultar: Number(v.umbralReportesOcultar),
      porcentajeDescuentoTributario: Number(v.porcentajeDescuentoTributario), topeDescuentoSobreImpuesto: Number(v.topeDescuentoSobreImpuesto),
    }).subscribe({
      next: (r) => { this.guardando.set(false); this.form.reset(r.data); this.toast.exito('Configuración guardada'); },
      error: (e) => { this.guardando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  revisarSalud(): void {
    this.revisandoSalud.set(true);
    this.api.salud().subscribe({
      next: (r) => { this.salud.set(r); this.revisandoSalud.set(false); },
      error: (e: { error?: SaludServicios }) => { this.salud.set(e.error?.servicios ? e.error : null); this.revisandoSalud.set(false); },
    });
  }

  nueva(): void { this.editando.set({ id: null, nombre: '', colorHex: '#C0392B', icono: 'category' }); }

  editar(c: CategoriaMaterial): void { this.editando.set({ id: c.id, nombre: c.nombre, colorHex: c.colorHex, icono: c.icono }); }

  campo(campo: 'nombre' | 'colorHex' | 'icono', valor: string): void {
    this.editando.update((c) => (c ? { ...c, [campo]: valor } : c));
  }

  guardarCategoria(): void {
    const c = this.editando();
    if (!c || c.nombre.trim().length < 2) { this.toast.error('El nombre debe tener al menos 2 caracteres'); return; }
    const datos = { nombre: c.nombre.trim(), colorHex: c.colorHex, icono: c.icono.trim() };
    const peticion = c.id ? this.materiales.actualizarCategoria(c.id, datos) : this.materiales.crearCategoria(datos);
    peticion.subscribe({
      next: () => {
        this.editando.set(null);
        this.catalogo.cargarCategorias(true).subscribe();
        this.toast.exito(c.id ? 'Categoría actualizada' : 'Categoría creada');
      },
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  eliminarCategoria(c: CategoriaMaterial): void {
    this.dialogo.confirmar({
      titulo: `Eliminar "${c.nombre}"`, mensaje: 'Solo es posible si ningún material usa esta categoría.', confirmar: 'Eliminar', peligroso: true,
    }).subscribe(() => this.materiales.eliminarCategoria(c.id).subscribe({
      next: () => { this.catalogo.cargarCategorias(true).subscribe(); this.toast.exito('Categoría eliminada'); },
      error: (e) => this.toast.error(mensajeError(e)),
    }));
  }
}
