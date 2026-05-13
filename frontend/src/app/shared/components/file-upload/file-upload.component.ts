import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface UploadedFile {
  file: File;
  preview: string | null;
  id: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="upload-wrapper">
      <!-- Drop zone -->
      <div class="drop-zone" [class.dragging]="dragging()" [class.has-files]="files().length > 0"
           (dragover)="onDragOver($event)" (dragleave)="dragging.set(false)"
           (drop)="onDrop($event)" (click)="fileInput.click()">
        <mat-icon class="drop-icon">cloud_upload</mat-icon>
        <p class="drop-label">Arrastra archivos aquí o <span>haz clic para seleccionar</span></p>
        <p class="drop-hint">
          {{ accept || 'Cualquier archivo' }} · Máx. {{ maxSizeMb }} MB {{ multiple ? ' · Múltiples archivos' : '' }}
        </p>
        <input #fileInput type="file" [accept]="accept" [multiple]="multiple"
               (change)="onInputChange($event)" hidden />
      </div>

      <!-- Preview list -->
      @if (files().length > 0) {
        <div class="file-list">
          @for (f of files(); track f.id) {
            <div class="file-item">
              @if (f.preview) {
                <img [src]="f.preview" alt="preview" class="file-preview" />
              } @else {
                <div class="file-icon">
                  <mat-icon>insert_drive_file</mat-icon>
                </div>
              }
              <div class="file-info">
                <span class="file-name">{{ f.file.name }}</span>
                <span class="file-size">{{ formatSize(f.file.size) }}</span>
              </div>
              <button class="remove-btn" (click)="remove(f.id)" aria-label="Eliminar">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  @Input() accept = 'image/*';
  @Input() maxSizeMb = 5;
  @Input() multiple = true;
  @Output() filesChanged = new EventEmitter<File[]>();

  protected readonly files = signal<UploadedFile[]>([]);
  protected readonly dragging = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const items = event.dataTransfer?.files;
    if (items) this.addFiles(Array.from(items));
  }

  onInputChange(event: Event): void {
    const items = (event.target as HTMLInputElement).files;
    if (items) this.addFiles(Array.from(items));
    (event.target as HTMLInputElement).value = '';
  }

  private addFiles(newFiles: File[]): void {
    const maxBytes = this.maxSizeMb * 1024 * 1024;
    const valid = newFiles.filter(f => f.size <= maxBytes);
    const toAdd: UploadedFile[] = valid.map(f => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      id: crypto.randomUUID(),
    }));
    this.files.update(list => this.multiple ? [...list, ...toAdd] : toAdd);
    this.filesChanged.emit(this.files().map(f => f.file));
  }

  remove(id: string): void {
    const target = this.files().find(f => f.id === id);
    if (target?.preview) URL.revokeObjectURL(target.preview);
    this.files.update(list => list.filter(f => f.id !== id));
    this.filesChanged.emit(this.files().map(f => f.file));
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
