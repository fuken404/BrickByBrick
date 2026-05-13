import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { CertificadoDonacion } from '../../../core/models';

@Component({
  selector: 'app-tributario',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Beneficios tributarios</h1>
      <p class="page-subtitle">Gestiona tus certificados de donación bajo el Art. 255 — Ley 1819 de 2016.</p>

      <!-- Info card -->
      <div class="info-card">
        <div class="info-header">
          <div class="info-icon"><mat-icon>gavel</mat-icon></div>
          <div>
            <div class="info-title">Artículo 255 — Ley 1819/2016</div>
            <div class="info-desc">Las empresas pueden deducir hasta el <strong>25% del valor</strong> de los materiales donados en la declaración de renta.</div>
          </div>
        </div>
        <div class="benefits-grid">
          @for (b of benefits; track b.title) {
            <div class="benefit-item">
              <div class="benefit-icon"><mat-icon>{{ b.icon }}</mat-icon></div>
              <div>
                <div class="benefit-title">{{ b.title }}</div>
                <div class="benefit-desc">{{ b.desc }}</div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Resumen acumulado -->
      <div class="resumen-grid">
        <div class="resumen-card card">
          <div class="resumen-icon" style="background: rgba(192,57,43,.1)"><mat-icon style="color:#C0392B">inventory_2</mat-icon></div>
          <div class="resumen-value">-</div>
          <div class="resumen-label">Total materiales donados</div>
        </div>
        <div class="resumen-card card">
          <div class="resumen-icon" style="background: rgba(39,174,96,.1)"><mat-icon style="color:#27AE60">attach_money</mat-icon></div>
          <div class="resumen-value">$—</div>
          <div class="resumen-label">Valor estimado COP</div>
        </div>
        <div class="resumen-card card">
          <div class="resumen-icon" style="background: rgba(46,134,171,.1)"><mat-icon style="color:#2E86AB">percent</mat-icon></div>
          <div class="resumen-value">$—</div>
          <div class="resumen-label">Deducción estimada (25%)</div>
        </div>
      </div>

      <!-- Certificados -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Certificados por período</h2>
          <span class="coming-soon-badge">Próximamente</span>
        </div>
        <div class="coming-soon-card card">
          <mat-icon>description</mat-icon>
          <div>
            <div class="cs-title">Generación de certificados automáticos</div>
            <div class="cs-desc">Los certificados de donación en formato PDF estarán disponibles próximamente.
              BrickByBrick los generará automáticamente al finalizar cada período fiscal.</div>
          </div>
        </div>
      </section>

      <!-- Historial de donaciones exitosas -->
      <section class="section">
        <h2 class="section-title">Requisitos para certificación</h2>
        <div class="requisitos-list">
          @for (r of requisitos; track r.label) {
            <div class="requisito-item">
              <div class="req-icon" [class.ok]="r.ok"><mat-icon>{{ r.ok ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon></div>
              <div>
                <div class="req-label">{{ r.label }}</div>
                <div class="req-desc">{{ r.desc }}</div>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styleUrl: './tributario.component.scss',
})
export class TributarioComponent {
  readonly benefits = [
    { icon: 'calculate',     title: 'Deducción del 25%',   desc: 'Sobre el valor comercial de los materiales' },
    { icon: 'fact_check',    title: 'Certificado digital',  desc: 'Generado automáticamente por BrickByBrick' },
    { icon: 'shield',        title: 'Proceso verificado',   desc: 'Documentación completa y legalmente válida' },
    { icon: 'article',       title: 'Art. 125 — E.T.',      desc: 'Complementario al estatuto tributario' },
  ];

  readonly requisitos = [
    { label: 'Empresa verificada',        desc: 'Tu empresa debe estar verificada por un administrador de BrickByBrick.',      ok: false },
    { label: 'Donaciones entregadas',     desc: 'Al menos una solicitud marcada como entregada en el período.',                ok: false },
    { label: 'RUT vigente',               desc: 'Documento RUT actualizado y aprobado en el sistema.',                        ok: false },
    { label: 'Cámara de comercio válida', desc: 'Cámara de comercio con vigencia no mayor a 90 días.',                        ok: false },
  ];
}
