import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (i of items; track i) {
      @switch (type) {
        @case ('card') {
          <div class="skeleton-card card">
            <div class="skel skel-img"></div>
            <div class="skel skel-title"></div>
            <div class="skel skel-text"></div>
            <div class="skel skel-text short"></div>
          </div>
        }
        @case ('list') {
          <div class="skeleton-row">
            <div class="skel skel-avatar"></div>
            <div class="skel-lines">
              <div class="skel skel-title"></div>
              <div class="skel skel-text short"></div>
            </div>
          </div>
        }
        @case ('text') {
          <div class="skel skel-text"></div>
        }
        @default {
          <div class="skeleton-card card">
            <div class="skel skel-img"></div>
            <div class="skel skel-title"></div>
            <div class="skel skel-text"></div>
          </div>
        }
      }
    }
  `,
  styles: [`
    .skel {
      background: linear-gradient(90deg, var(--bg-base) 25%, #ece6e0 50%, var(--bg-base) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    .skeleton-card { padding: 16px; overflow: hidden; }
    .skel-img  { height: 160px; border-radius: 6px; margin-bottom: 12px; }
    .skel-title { height: 16px; margin-bottom: 10px; width: 70%; }
    .skel-text  { height: 12px; margin-bottom: 8px; }
    .skel-text.short { width: 50%; }

    .skeleton-row {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
      align-items: center;
    }
    .skel-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
    .skel-lines { flex: 1; }
  `],
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'list' | 'text' = 'card';
  @Input() count = 3;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
