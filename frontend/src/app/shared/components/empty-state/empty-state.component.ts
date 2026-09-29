import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state" [class.compacto]="compacto()">
      <div class="empty-icon"><mat-icon>{{ icon() }}</mat-icon></div>
      <h3>{{ title() }}</h3>
      @if (description()) { <p>{{ description() }}</p> }
      @if (actionLabel()) {
        <button type="button" class="btn btn-primary" (click)="accion.emit()">{{ actionLabel() }}</button>
      }
    </div>
  `,
  styles: [`
    .empty-state { text-align: center; padding: 56px 20px; color: var(--text-secondary); }
    .empty-state.compacto { padding: 28px 16px; }
    .empty-icon {
      width: 64px; height: 64px; border-radius: 50%; background: var(--bg-base);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
      mat-icon { color: #b9aea3; font-size: 28px; width: 28px; height: 28px; }
    }
    h3 { color: var(--text-primary); margin-bottom: 8px; font-size: 18px; }
    p { font-size: 14px; max-width: 360px; margin: 0 auto 20px; line-height: 1.6; }
  `],
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input('Sin resultados');
  readonly description = input('');
  readonly actionLabel = input<string | null>(null);
  readonly compacto = input(false);
  readonly accion = output<void>();
}
