import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpi-card card">
      <div class="kpi-header">
        <span class="kpi-label">{{ label() }}</span>
        <div class="kpi-icon">
          <mat-icon [style.color]="color()">{{ icon() }}</mat-icon>
        </div>
      </div>
      <div class="kpi-value">{{ texto() }}</div>
      @if (sub()) { <div class="kpi-sub">{{ sub() }}</div> }
    </div>
  `,
  styles: [`
    .kpi-card { padding: 24px; height: 100%; min-height: 150px; border-radius: 12px; box-shadow: none; }
    .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px; }
    .kpi-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
    .kpi-icon { width: 40px; height: 40px; border-radius: 8px; background: #f1f3eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 20px; width: 20px; height: 20px; } }
    .kpi-value { font-family: var(--font-display); font-size: clamp(24px, 2.4vw, 34px); font-weight: 500; letter-spacing: -1.2px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; color: var(--text-primary); line-height: 1.1; }
    .kpi-sub { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }
  `],
})
export class KpiCardComponent {
  readonly label = input('');
  readonly value = input<number | string | null>(0);
  readonly formato = input<'numero' | 'cop' | 'pct' | 'texto'>('numero');
  readonly icon = input('analytics');
  readonly color = input('#AD5138');
  readonly sub = input('');

  protected readonly texto = computed(() => {
    const v = this.value();
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string') return v;
    switch (this.formato()) {
      case 'cop': return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
      case 'pct': return `${v.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
      default: return v.toLocaleString('es-CO');
    }
  });
}
