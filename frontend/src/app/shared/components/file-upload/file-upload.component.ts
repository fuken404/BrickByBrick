import { ChangeDetectionStrategy, Component, OnDestroy, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

interface ArchivoLocal { file: File; preview: string | null; id: string }

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent implements OnDestroy {
  readonly accept = input('image/jpeg,image/png,image/webp');
  readonly maxSizeMb = input(10);
  readonly multiple = input(true);
  readonly maxFiles = input(5);
  readonly etiqueta = input('Arrastra archivos aquí o haz clic para seleccionar');
  readonly archivos = output<File[]>();

  protected readonly files = signal<ArchivoLocal[]>([]);
  protected readonly dragging = signal(false);
  protected readonly error = signal('');

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(true);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    if (e.dataTransfer?.files) this.agregar(Array.from(e.dataTransfer.files));
  }

  onChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.agregar(Array.from(input.files));
    input.value = '';
  }

  quitar(id: string): void {
    const f = this.files().find((x) => x.id === id);
    if (f?.preview) URL.revokeObjectURL(f.preview);
    this.files.update((l) => l.filter((x) => x.id !== id));
    this.emitir();
  }

  /** Limpia la selección (p. ej. tras subir). */
  reset(): void {
    this.files().forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    this.files.set([]);
    this.error.set('');
  }

  ngOnDestroy(): void {
    this.reset();
  }

  private agregar(nuevos: File[]): void {
    this.error.set('');
    const tipos = this.accept().split(',').map((t) => t.trim());
    const max = this.maxSizeMb() * 1024 * 1024;
    const validos: ArchivoLocal[] = [];
    for (const f of nuevos) {
      const tipoOk = tipos.some((t) => (t.endsWith('/*') ? f.type.startsWith(t.slice(0, -1)) : f.type === t || f.name.toLowerCase().endsWith(t)));
      if (!tipoOk) { this.error.set(`"${f.name}" no es un tipo de archivo permitido`); continue; }
      if (f.size > max) { this.error.set(`"${f.name}" supera ${this.maxSizeMb()} MB`); continue; }
      validos.push({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null, id: crypto.randomUUID() });
    }
    if (this.multiple()) {
      const disponibles = this.maxFiles() - this.files().length;
      if (validos.length > disponibles) this.error.set(`Máximo ${this.maxFiles()} archivos`);
      this.files.update((l) => [...l, ...validos.slice(0, Math.max(0, disponibles))]);
    } else if (validos.length) {
      this.reset();
      this.files.set([validos[0]]);
    }
    this.emitir();
  }

  private emitir(): void {
    this.archivos.emit(this.files().map((f) => f.file));
  }

  protected formato(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
