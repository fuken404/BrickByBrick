import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
      @if (actionLabel) {
        <button class="btn btn-primary" (click)="onAction()">{{ actionLabel }}</button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);
    }
    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      mat-icon { color: var(--border); font-size: 28px; }
    }
    h3 { color: var(--text-secondary); margin-bottom: 8px; font-size: 18px; }
    p { font-size: 14px; max-width: 320px; margin: 0 auto 20px; line-height: 1.6; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Sin resultados';
  @Input() description = 'No hay datos para mostrar.';
  @Input() actionLabel: string | null = null;
  @Input() actionFn: (() => void) | null = null;

  onAction(): void {
    this.actionFn?.();
  }
}
