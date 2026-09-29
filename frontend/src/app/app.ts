import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from './core/auth/auth.store';
import { NotificationStore } from './core/stores/notification.store';
import { CatalogStore } from './core/stores/catalog.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  private readonly auth = inject(AuthStore);
  private readonly notificaciones = inject(NotificationStore);

  constructor() {
    inject(CatalogStore).cargarTodo();
    // Conecta el socket y los contadores cuando hay sesión; se desconecta al salir
    effect(() => {
      if (this.auth.isAuthenticated()) this.notificaciones.iniciar();
      else this.notificaciones.detener();
    });
  }
}
