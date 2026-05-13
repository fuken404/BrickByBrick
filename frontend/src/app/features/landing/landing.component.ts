import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="landing">
      <!-- Topbar -->
      <nav class="landing-nav">
        <div class="nav-brand">
          <div class="brand-icon"><mat-icon>layers</mat-icon></div>
          <span class="brand-name">BrickByBrick</span>
        </div>
        <div class="nav-actions">
          <a routerLink="/login" class="btn btn-ghost">Ingresar</a>
          <a routerLink="/registro" class="btn btn-primary">Registrarse</a>
        </div>
      </nav>

      <!-- Hero -->
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="hero-left">
            <div class="hero-badge">
              <mat-icon>emoji_events</mat-icon>
              <span>Economía circular · Bogotá, Colombia</span>
            </div>
            <h1 class="hero-title">
              Conectamos lo que <span class="text-primary-color">sobra</span><br />
              con quien lo <span class="text-secondary-color">necesita</span>
            </h1>
            <p class="hero-desc">
              Plataforma de donación de materiales de construcción excedentes entre constructoras
              y familias de bajos recursos en Bogotá. Generamos valor social y beneficios tributarios.
            </p>
            <div class="hero-ctas">
              <a routerLink="/registro/beneficiario" class="btn btn-primary btn-lg">
                <mat-icon>person</mat-icon> Soy Beneficiario
              </a>
              <a routerLink="/registro/empresa" class="btn btn-outline-secondary btn-lg">
                <mat-icon>business</mat-icon> Soy Constructora
              </a>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-card card">
              <div class="mat-preview-grid">
                @for (m of previewMaterials; track m.cat) {
                  <div class="mat-preview-item" [style.background]="m.color + '12'">
                    <div class="mat-preview-icon" [style.background]="m.color + '18'">
                      <mat-icon [style.color]="m.color">{{ m.icon }}</mat-icon>
                    </div>
                    <div class="mat-preview-name">{{ m.cat }}</div>
                    <div class="mat-preview-qty">{{ m.qty }}</div>
                    <span class="badge badge-disponible" style="font-size:11px;align-self:flex-start">Disponible</span>
                  </div>
                }
              </div>
              <div class="mat-preview-footer">
                <mat-icon style="color:var(--accent);font-size:18px">check_circle</mat-icon>
                <span>23 materiales nuevos esta semana cerca de ti</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="stats-bar">
        @for (s of stats; track s.label) {
          <div class="stat">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        }
      </section>

      <!-- How it works -->
      <section class="how-section">
        <div class="section-container">
          <div class="section-heading">
            <h2>¿Cómo funciona?</h2>
            <p>Un proceso simple, transparente y con impacto real.</p>
          </div>
          <div class="steps-grid">
            @for (s of howSteps; track s.title; let i = $index) {
              <div class="step-card">
                <div class="step-icon-wrapper" [style.background]="s.bg">
                  <mat-icon [style.color]="s.color">{{ s.icon }}</mat-icon>
                </div>
                <div class="step-num" [style.background]="s.color">{{ i + 1 }}</div>
                <h3>{{ s.title }}</h3>
                <p>{{ s.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Tax benefits -->
      <section class="tax-section">
        <div class="section-container tax-grid">
          <div>
            <div class="tax-badge">
              <mat-icon>percent</mat-icon>
              <span>Beneficio tributario</span>
            </div>
            <h2 class="tax-title">Deduce hasta el 25% en impuesto de renta</h2>
            <p class="tax-desc">El Artículo 255 de la Ley 1819 de 2016 permite a las empresas constructoras deducir el valor de sus donaciones para obtener una reducción significativa en su declaración de renta.</p>
            <a routerLink="/registro/empresa" class="btn btn-lg tax-cta">Conocer más</a>
          </div>
          <div class="tax-benefits">
            @for (b of taxBenefits; track b.title) {
              <div class="tax-item">
                <div class="tax-item-icon"><mat-icon>{{ b.icon }}</mat-icon></div>
                <div>
                  <div class="tax-item-title">{{ b.title }}</div>
                  <div class="tax-item-desc">{{ b.desc }}</div>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="testimonials-section">
        <div class="section-container">
          <h2 style="text-align:center;margin-bottom:48px">Lo que dicen nuestros usuarios</h2>
          <div class="testimonials-grid">
            @for (t of testimonials; track t.name) {
              <div class="testimonial card">
                <span class="quote-mark">"</span>
                <p>{{ t.text }}</p>
                <div class="testimonial-author">
                  <div class="testimonial-avatar">{{ t.initials }}</div>
                  <div>
                    <div class="testimonial-name">{{ t.name }}</div>
                    <div class="testimonial-role">{{ t.role }}</div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="section-container footer-grid">
          <div>
            <div class="footer-brand">
              <div class="footer-icon"><mat-icon>layers</mat-icon></div>
              <span>BrickByBrick</span>
            </div>
            <p class="footer-desc">Conectando materiales excedentes con quienes más los necesitan. Bogotá, Colombia.</p>
          </div>
          @for (col of footerCols; track col.title) {
            <div>
              <div class="footer-col-title">{{ col.title }}</div>
              @for (link of col.links; track link) {
                <div class="footer-link">{{ link }}</div>
              }
            </div>
          }
        </div>
        <div class="section-container footer-bottom">
          <span>© 2026 BrickByBrick. Todos los derechos reservados.</span>
          <span>Hecho con propósito social en Bogotá</span>
        </div>
      </footer>
    </div>
  `,
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  readonly previewMaterials = [
    { cat: 'Ladrillo', qty: '2.400 unidades', color: '#C0392B', icon: 'layers' },
    { cat: 'Concreto',  qty: '15 m³',         color: '#2E86AB', icon: 'view_in_ar' },
    { cat: 'Madera',    qty: '48 m²',          color: '#E67E22', icon: 'grid_view' },
    { cat: 'Cerámica',  qty: '120 m²',         color: '#27AE60', icon: 'tag' },
  ];

  readonly stats = [
    { value: '1.240', label: 'Materiales donados' },
    { value: '87',    label: 'Constructoras activas' },
    { value: '3.400', label: 'Familias beneficiadas' },
  ];

  readonly howSteps = [
    { icon: 'business',    title: 'Constructoras publican excedentes',    desc: 'Las empresas registran sus materiales sobrantes con fotos, cantidades y condiciones de retiro.', color: '#C0392B', bg: 'rgba(192,57,43,.08)' },
    { icon: 'search',      title: 'Beneficiarios solicitan lo que necesitan', desc: 'Personas y emprendedores exploran el catálogo y envían solicitudes según su proyecto.',        color: '#2E86AB', bg: 'rgba(46,134,171,.08)' },
    { icon: 'fact_check',  title: 'Entrega y certificado tributario',     desc: 'Se coordina el retiro del material y se genera el certificado de donación para deducciones fiscales.', color: '#27AE60', bg: 'rgba(39,174,96,.08)' },
  ];

  readonly taxBenefits = [
    { icon: 'attach_money',  title: 'Deducción del 25%',     desc: 'Sobre el valor de los materiales donados' },
    { icon: 'fact_check',    title: 'Certificado digital',   desc: 'Generado automáticamente con cada donación' },
    { icon: 'shield',        title: 'Cumplimiento legal',    desc: 'Proceso verificado y documentado por BrickByBrick' },
  ];

  readonly testimonials = [
    { name: 'Constructora Bolívar S.A.', initials: 'CB', role: 'Empresa constructora', text: 'Gracias a BrickByBrick hemos donado más de 800 sacos de cemento y ladrillos excedentes. El beneficio tributario del Art. 255 fue clave para nuestra decisión.' },
    { name: 'María Elena Rodríguez',     initials: 'MR', role: 'Beneficiaria, Localidad Rafael Uribe', text: 'Con los materiales que conseguí pude terminar de construir el segundo piso de mi casa. Lo que parecía imposible se hizo realidad con el apoyo de esta plataforma.' },
  ];

  readonly footerCols = [
    { title: 'Plataforma', links: ['Materiales disponibles', '¿Cómo funciona?', 'Eventos', 'Comunidad'] },
    { title: 'Empresa',    links: ['Registrar empresa', 'Beneficios tributarios', 'Art. 255 Ley 1819', 'Soporte'] },
    { title: 'Legal',      links: ['Términos de uso', 'Privacidad', 'Ley 1581/2012', 'Cookies'] },
  ];
}
