import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avatar" [style.width.px]="size" [style.height.px]="size"
         [style.fontSize.px]="size * 0.38" [style.background]="bgColor">
      @if (src) {
        <img [src]="src" [alt]="name" />
      } @else {
        {{ initials }}
      }
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-family: var(--font-body);
      flex-shrink: 0;
      overflow: hidden;
      user-select: none;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
  `],
})
export class AvatarComponent {
  @Input() name = 'U';
  @Input() size = 36;
  @Input() src: string | null = null;

  private readonly palette = ['#C0392B', '#2E86AB', '#27AE60', '#E67E22', '#8E44AD', '#16A085'];

  get initials(): string {
    return this.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  get bgColor(): string {
    return this.palette[this.name.charCodeAt(0) % this.palette.length];
  }
}
