import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpi-card card">
      <div class="kpi-header">
        <span class="kpi-label">{{ label }}</span>
        <div class="kpi-icon" [style.background]="iconBg">
          <mat-icon [style.color]="iconColor">{{ icon }}</mat-icon>
        </div>
      </div>
      <div class="kpi-value">{{ displayValue }}</div>
      @if (change !== null) {
        <div class="kpi-change" [class.positive]="change > 0" [class.negative]="change < 0">
          <mat-icon>{{ change >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
          <span>{{ change > 0 ? '+' : '' }}{{ change }}% vs mes anterior</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .kpi-card { padding: 20px; }
    .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .kpi-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
    .kpi-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 20px; }
    }
    .kpi-value {
      font-family: var(--font-display);
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: 8px;
    }
    .kpi-change {
      display: flex; align-items: center; gap: 4px; font-size: 12px;
      mat-icon { font-size: 14px; }
      &.positive { color: var(--accent); }
      &.negative { color: var(--danger); }
      &:not(.positive):not(.negative) { color: var(--text-secondary); }
    }
  `],
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() unit = '';
  @Input() icon = 'analytics';
  @Input() iconColor = 'var(--primary)';
  @Input() iconBg = 'rgba(192,57,43,0.08)';
  @Input() change: number | null = null;

  get displayValue(): string {
    if (typeof this.value === 'number') {
      return this.value.toLocaleString('es-CO') + (this.unit ? ` ${this.unit}` : '');
    }
    return String(this.value);
  }
}
