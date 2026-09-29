import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UploadUrlPipe } from '../../pipes/upload-url.pipe';

const PALETA = ['#C0392B', '#2E86AB', '#27AE60', '#E67E22', '#8E44AD', '#16A085'];

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avatar" [style.width.px]="size()" [style.height.px]="size()"
         [style.fontSize.px]="size() * 0.38" [style.background]="src() ? '#fff' : color()"
         [attr.aria-label]="name()" role="img">
      @if (src()) {
        <img [src]="src() | uploadUrl" [alt]="name()" loading="lazy" />
      } @else {
        {{ iniciales() }}
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; flex-shrink: 0; }
    .avatar {
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-family: var(--font-body); overflow: hidden; user-select: none;
      border: 1px solid rgba(0,0,0,.04);
      img { width: 100%; height: 100%; object-fit: cover; }
    }
  `],
})
export class AvatarComponent {
  readonly name = input('U');
  readonly size = input(36);
  readonly src = input<string | null | undefined>(null);

  protected readonly iniciales = computed(() =>
    this.name().trim().split(/\s+/).map((n) => n[0] ?? '').slice(0, 2).join('').toUpperCase() || 'U');

  protected readonly color = computed(() => {
    const n = this.name();
    let h = 0;
    for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    return PALETA[h % PALETA.length];
  });
}
