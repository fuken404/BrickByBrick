import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"skel-" + type()', 'aria-busy': 'true', 'aria-label': 'Cargando' },
  template: `
    @for (i of items(); track i) {
      @switch (type()) {
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
        @case ('kpi') {
          <div class="skeleton-card card"><div class="skel skel-text short"></div><div class="skel skel-kpi"></div></div>
        }
        @default { <div class="skel skel-text"></div> }
      }
    }
  `,
  styles: [`
    :host.skel-card { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
    :host.skel-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; }
    :host.skel-list { display: block; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 0 16px; }
    .skel {
      background: linear-gradient(90deg, var(--bg-base) 25%, #ece6e0 50%, var(--bg-base) 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .skeleton-card { padding: 16px; overflow: hidden; }
    .skel-img { height: 150px; border-radius: 6px; margin-bottom: 12px; }
    .skel-title { height: 16px; margin-bottom: 10px; width: 70%; }
    .skel-text { height: 12px; margin-bottom: 8px; }
    .skel-text.short { width: 50%; }
    .skel-kpi { height: 30px; width: 60%; margin-top: 12px; }
    .skeleton-row { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); align-items: center; }
    .skeleton-row:last-child { border-bottom: none; }
    .skel-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
    .skel-lines { flex: 1; }
  `],
})
export class SkeletonLoaderComponent {
  readonly type = input<'card' | 'list' | 'kpi' | 'text'>('card');
  readonly count = input(3);
  protected readonly items = computed(() => Array.from({ length: this.count() }, (_, i) => i));
}
