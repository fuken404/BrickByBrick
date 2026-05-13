import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Publicacion, Comentario } from '../../../core/models';
import { FechaRelativaPipe } from '../../pipes/fecha-relativa.pipe';
import { UploadUrlPipe } from '../../pipes/upload-url.pipe';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, FechaRelativaPipe, UploadUrlPipe, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="post-card card">
      <!-- Header -->
      <div class="post-header">
        <div class="post-author">
          <app-avatar [name]="autorName" [size]="40" />
          <div>
            <div class="author-name-row">
              <span class="author-name">{{ autorName }}</span>
            </div>
            <span class="post-time">{{ publicacion.createdAt | fechaRelativa }}</span>
          </div>
        </div>
        <span class="badge" [ngClass]="typeBadgeClass">{{ typeLabel }}</span>
      </div>

      <!-- Content -->
      @if (publicacion.titulo) {
        <h3 class="post-title">{{ publicacion.titulo }}</h3>
      }
      <p class="post-content" [class.expanded]="expanded">{{ publicacion.contenido }}</p>
      @if (!expanded && publicacion.contenido.length > 280) {
        <button class="btn-text" (click)="expanded = true">Ver más</button>
      }

      <!-- Images -->
      @if (publicacion.fotos?.length) {
        <div class="post-images" [class.single]="publicacion.fotos.length === 1">
          @for (foto of publicacion.fotos.slice(0, 3); track foto.id) {
            <img [src]="foto.url | uploadUrl" alt="foto" />
          }
        </div>
      }

      <!-- Actions -->
      <div class="post-actions">
        <button class="action-btn" [class.liked]="liked" (click)="like.emit(publicacion.id)">
          <mat-icon>{{ liked ? 'favorite' : 'favorite_border' }}</mat-icon>
          <span>{{ publicacion._count?.likes ?? 0 }}</span>
        </button>
        <button class="action-btn" [class.active]="comentariosAbiertos" (click)="comment.emit(publicacion.id)">
          <mat-icon>{{ comentariosAbiertos ? 'chat_bubble' : 'chat_bubble_outline' }}</mat-icon>
          <span>{{ publicacion._count?.comentarios ?? 0 }}</span>
        </button>
      </div>

      <!-- Sección de comentarios (inline) -->
      @if (comentariosAbiertos) {
        <div class="comments-section">
          <!-- Nuevo comentario -->
          <div class="comment-input-row">
            <app-avatar [name]="currentUserName" [size]="32" />
            <div class="comment-input-wrap">
              <textarea class="comment-textarea" rows="1" placeholder="Escribe un comentario..."
                        [(ngModel)]="newCommentText"
                        (keydown.enter)="onEnterComment($any($event))"></textarea>
              <button class="comment-send-btn" [disabled]="!newCommentText.trim() || sending()"
                      (click)="submitComment()">
                <mat-icon>send</mat-icon>
              </button>
            </div>
          </div>

          <!-- Lista de comentarios -->
          @if (loadingComentarios) {
            <div class="comments-loading">
              <span class="text-secondary" style="font-size:13px">Cargando comentarios...</span>
            </div>
          } @else if (comentarios.length === 0) {
            <p class="no-comments">Aún no hay comentarios. ¡Sé el primero!</p>
          } @else {
            <div class="comments-list">
              @for (c of comentarios; track c.id) {
                <div class="comment-item">
                  <app-avatar [name]="c.autor.email" [size]="30" />
                  <div class="comment-body">
                    <span class="comment-author">{{ c.autor.email }}</span>
                    <p class="comment-text">{{ c.contenido }}</p>
                    <span class="comment-time">{{ c.createdAt | fechaRelativa }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  @Input({ required: true }) publicacion!: Publicacion;
  @Input() autorName = 'Usuario';
  @Input() currentUserName = 'Tú';
  @Input() liked = false;
  @Input() comentariosAbiertos = false;
  @Input() comentarios: Comentario[] = [];
  @Input() loadingComentarios = false;

  @Output() like    = new EventEmitter<string>();
  @Output() comment = new EventEmitter<string>();
  @Output() addComment = new EventEmitter<{ pubId: string; texto: string }>();

  expanded = false;
  newCommentText = '';
  readonly sending = signal(false);

  onEnterComment(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.submitComment();
    }
  }

  submitComment() {
    const texto = this.newCommentText.trim();
    if (!texto || this.sending()) return;
    this.sending.set(true);
    this.addComment.emit({ pubId: this.publicacion.id, texto });
    this.newCommentText = '';
    this.sending.set(false);
  }

  get typeLabel(): string {
    const map: Record<string, string> = {
      reutilizacion: 'Reutilización', tutorial: 'Tutorial',
      proyecto: 'Proyecto', noticia: 'Noticia', recurso: 'Recurso',
    };
    return map[this.publicacion.tipo] ?? 'Publicación';
  }

  get typeBadgeClass(): string {
    const map: Record<string, string> = {
      proyecto: 'badge-primary', tutorial: 'badge-secundario',
      noticia: 'badge-entregado', recurso: 'badge-verificado',
      reutilizacion: 'badge-aprobado',
    };
    return map[this.publicacion.tipo] ?? 'badge-secundario';
  }
}
