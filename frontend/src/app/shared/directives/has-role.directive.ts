import { Directive, inject, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';
import { RolUsuario } from '../../core/models';

/**
 * Directiva estructural que muestra el contenido solo si el usuario
 * tiene uno de los roles especificados.
 *
 * Uso:
 * <div *hasRole="['ADMINISTRADOR', 'CONSTRUCTORA']">Solo admins y empresas</div>
 */
@Directive({
  selector: '[hasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit {
  @Input() set hasRole(roles: RolUsuario[]) {
    this._roles = roles;
  }

  private _roles: RolUsuario[] = [];
  private readonly auth = inject(AuthStore);
  private readonly tpl  = inject(TemplateRef<unknown>);
  private readonly vc   = inject(ViewContainerRef);

  ngOnInit(): void {
    const rol = this.auth.rol();
    if (rol && this._roles.includes(rol)) {
      this.vc.createEmbeddedView(this.tpl);
    } else {
      this.vc.clear();
    }
  }
}
