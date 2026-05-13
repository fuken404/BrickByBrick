import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal" [class.dangerous]="dangerous">
        <!-- Header -->
        <div class="modal-header">
          @if (icon) {
            <div class="modal-icon" [class.dangerous]="dangerous">
              <mat-icon>{{ icon }}</mat-icon>
            </div>
          }
          <h3>{{ title }}</h3>
          <button class="close-btn" (click)="cancel.emit()" aria-label="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          @if (message) {
            <p>{{ message }}</p>
          }
          <ng-content />
        </div>

        <!-- Detail info box -->
        @if (detail) {
          <div class="modal-detail">
            <mat-icon>info</mat-icon>
            <p>{{ detail }}</p>
          </div>
        }

        <!-- Warning -->
        @if (dangerous) {
          <div class="modal-warning">
            <mat-icon>warning</mat-icon>
            <p>Esta acción no se puede deshacer.</p>
          </div>
        }

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="cancel.emit()">{{ cancelLabel }}</button>
          <button class="btn" [class.btn-primary]="!dangerous" [class.btn-danger]="dangerous"
                  (click)="confirm.emit()">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './confirmation-modal.component.scss',
})
export class ConfirmationModalComponent {
  @Input() title = '¿Confirmar acción?';
  @Input() message = '';
  @Input() detail = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() icon = '';
  @Input() dangerous = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancel.emit();
    }
  }
}
