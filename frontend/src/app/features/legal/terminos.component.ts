import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './legal.scss',
  template: `
    <div class="legal-page">
      <article class="legal-card card">
        <div class="legal-top">
          <a routerLink="/" class="legal-brand"><mat-icon>layers</mat-icon>BrickByBrick</a>
          <span class="xsmall muted">Última actualización: septiembre de 2026</span>
        </div>
        <h1>Términos de uso</h1>
        <p class="muted">Condiciones para usar la plataforma BrickByBrick (proyecto académico de la Universidad Manuela Beltrán).</p>

        <h2>1. Objeto</h2>
        <p>BrickByBrick conecta a empresas constructoras de Bogotá que tienen materiales de construcción excedentes con personas y
          emprendimientos que pueden reutilizarlos. La plataforma facilita la publicación, solicitud, entrega y trazabilidad de las
          donaciones; no compra, vende ni transporta materiales.</p>

        <h2>2. Cuentas y roles</h2>
        <ul>
          <li><strong>Beneficiarios:</strong> personas mayores de 18 años residentes en Bogotá que solicitan materiales y participan en la comunidad.</li>
          <li><strong>Constructoras:</strong> empresas que publican materiales y eventos. Deben aportar RUT y Cámara de Comercio y ser verificadas para publicar.</li>
          <li><strong>Administradores:</strong> equipo que verifica empresas, modera contenido y supervisa la operación.</li>
        </ul>
        <p>Cada usuario es responsable de la veracidad de la información que registra y de la confidencialidad de su contraseña.</p>

        <h2>3. Donaciones</h2>
        <ul>
          <li>Los materiales se donan de forma gratuita. Está prohibido revender materiales recibidos a través de la plataforma.</li>
          <li>La constructora define la cantidad disponible, las condiciones y el plazo de retiro, y decide qué solicitudes aprueba.</li>
          <li>El beneficiario debe retirar el material en las condiciones acordadas y confirmar la recepción en la plataforma.</li>
          <li>La constructora es responsable de que los materiales donados cumplan condiciones mínimas de seguridad (Ley 99 de 1993).</li>
        </ul>

        <h2>4. Información tributaria</h2>
        <p>Los resúmenes y constancias de donación que genera la plataforma son soportes informativos calculados con los valores de
          referencia que declara la constructora. No reemplazan el certificado exigido por la normativa tributaria. El descuento del
          artículo 257 del Estatuto Tributario (en concordancia con el artículo 255, modificado por la Ley 1819 de 2016) aplica en las
          condiciones que fija la ley, y cada empresa debe validarlo con su contador o revisor fiscal.</p>

        <h2>5. Comunidad</h2>
        <p>Las publicaciones, comentarios y mensajes deben ser respetuosos y relacionados con la construcción, la reutilización y la
          economía circular. No se permite contenido ofensivo, engañoso, publicitario ajeno al propósito de la plataforma ni que
          vulnere derechos de autor (Ley 23 de 1982). El contenido reportado puede ocultarse mientras se revisa y las cuentas que
          incumplan estas normas pueden suspenderse.</p>

        <h2>6. Responsabilidad</h2>
        <p>BrickByBrick actúa como intermediario tecnológico. No garantiza la disponibilidad de materiales ni responde por acuerdos
          entre usuarios, sin perjuicio de los derechos del consumidor previstos en la Ley 1480 de 2011.</p>

        <h2>7. Datos personales</h2>
        <p>El tratamiento de datos se rige por la <a routerLink="/privacidad">política de tratamiento de datos personales</a>.</p>

        <div class="mt-32"><a routerLink="/" class="btn btn-ghost"><mat-icon>chevron_left</mat-icon>Volver</a></div>
      </article>
    </div>
  `,
})
export class TerminosComponent {}
