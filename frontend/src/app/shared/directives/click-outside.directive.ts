import { Directive, ElementRef, EventEmitter, HostListener, Output, inject } from '@angular/core';

/**
 * Emite (clickOutside) cuando el usuario hace clic fuera del elemento host.
 *
 * Uso: <div (clickOutside)="cerrarDropdown()"></div>
 */
@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  private readonly el = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null): void {
    if (!target) return;
    if (!this.el.nativeElement.contains(target as Node)) {
      this.clickOutside.emit();
    }
  }
}
