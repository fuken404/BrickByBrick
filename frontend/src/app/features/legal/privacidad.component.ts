import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './legal.scss',
  template: `
    <div class="legal-page">
      <article class="legal-card card">
        <div class="legal-top">
          <a routerLink="/" class="legal-brand"><mat-icon>layers</mat-icon>BrickByBrick</a>
          <span class="xsmall muted">Ley 1581 de 2012 · Decreto 1377 de 2013</span>
        </div>
        <h1>Política de tratamiento de datos personales</h1>

        <h2>Responsable</h2>
        <p>BrickByBrick, proyecto de grado del programa de Ingeniería de Software de la Universidad Manuela Beltrán (Bogotá, Colombia).</p>

        <h2>Datos que recolectamos</h2>
        <ul>
          <li><strong>Beneficiarios:</strong> nombre, cédula, fecha de nacimiento, género (opcional), estrato (opcional), localidad, correo y celular.</li>
          <li><strong>Constructoras:</strong> razón social, NIT, representante legal, dirección, contacto, RUT y Cámara de Comercio.</li>
          <li><strong>Uso de la plataforma:</strong> solicitudes, inscripciones, publicaciones, mensajes e intentos de inicio de sesión (seguridad).</li>
        </ul>

        <h2>Finalidades</h2>
        <ul>
          <li>Gestionar las donaciones y coordinar la entrega entre constructora y beneficiario.</li>
          <li>Verificar la identidad de las empresas y prevenir fraudes.</li>
          <li>Enviar notificaciones de la plataforma por la app y por correo, según tus preferencias.</li>
          <li>Generar estadísticas agregadas y anónimas de impacto (sin datos que te identifiquen).</li>
        </ul>

        <h2>¿Quién ve tus datos?</h2>
        <p>Tu perfil público solo muestra tu nombre (o el de tu emprendimiento), tu foto y lo que decidas publicar. Tu cédula, correo y
          teléfono nunca son públicos: la constructora solo accede a tu contacto cuando aprueba una solicitud tuya, para coordinar la entrega.</p>

        <h2>Seguridad</h2>
        <p>Las contraseñas se almacenan cifradas (bcrypt), las sesiones usan tokens de corta duración con rotación, las cuentas de
          administración exigen verificación en dos pasos y los accesos quedan registrados (Ley 1273 de 2009).</p>

        <h2>Tus derechos</h2>
        <ul>
          <li>Conocer, actualizar y rectificar tus datos desde <em>Mi perfil</em>.</li>
          <li>Elegir cómo recibir notificaciones.</li>
          <li>Eliminar tu cuenta: tus datos personales se anonimizan y solo se conserva el registro estadístico de las donaciones.</li>
          <li>Presentar consultas o reclamos al correo de soporte y, si no son atendidos, ante la Superintendencia de Industria y Comercio.</li>
        </ul>

        <div class="mt-32"><a routerLink="/" class="btn btn-ghost"><mat-icon>chevron_left</mat-icon>Volver</a></div>
      </article>
    </div>
  `,
})
export class PrivacidadComponent {}
