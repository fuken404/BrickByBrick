import { Injectable, inject } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';

interface EventoSocket { nombre: string; payload: unknown }

/** Conexión Socket.io única para notificaciones, chat de grupos y mensajes directos. */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthStore);
  private socket: Socket | null = null;
  private readonly eventos$ = new Subject<EventoSocket>();
  private readonly salas = new Set<string>();

  conectar(): void {
    if (this.socket) return;
    this.socket = io(environment.wsUrl || undefined, {
      path: environment.wsPath,
      // Función: en cada reconexión se usa el token vigente
      auth: (cb) => cb({ token: this.auth.accessToken() }),
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
    });
    this.socket.onAny((nombre: string, payload: unknown) => this.eventos$.next({ nombre, payload }));
    this.socket.on('connect', () => {
      for (const grupoId of this.salas) this.socket?.emit('grupo:entrar', { grupoId });
    });
    this.socket.on('connect_error', () => {
      // El token pudo expirar: el siguiente intento usará el renovado
    });
  }

  desconectar(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.salas.clear();
  }

  on<T>(nombre: string): Observable<T> {
    return this.eventos$.pipe(filter((e) => e.nombre === nombre), map((e) => e.payload as T));
  }

  entrarGrupo(grupoId: string): void {
    this.salas.add(grupoId);
    this.socket?.emit('grupo:entrar', { grupoId });
  }

  salirGrupo(grupoId: string): void {
    this.salas.delete(grupoId);
    this.socket?.emit('grupo:salir', { grupoId });
  }
}
