import { Directive, HostListener, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appRutFormateo]',
  standalone: true
})
export class RutFormateoDirective {
  private updatingValue = false;
  private rawValue: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @HostListener('input', ['$event'])
  onInput(event: any) {
    if (this.updatingValue) return; // Ignore programmatic updates

    const inputElement = this.el.nativeElement;
    let value = inputElement.value;

    // Mantén el valor crudo sin formato
    this.rawValue = value.replace(/[^0-9kK]/g, '');

    // Aplicar formato solo para mostrar
    const formattedValue = this.formatRut(this.rawValue);

    // Actualizar el valor del input solo si es diferente al valor actual
    if (formattedValue !== inputElement.value) {
      this.updatingValue = true;
      this.renderer.setProperty(inputElement, 'value', formattedValue);
      this.updatingValue = false;
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: any) {
    const inputElement = this.el.nativeElement;
    this.rawValue = inputElement.value.replace(/[^0-9kK]/g, '');
    const formattedValue = this.formatRut(this.rawValue);
    this.updatingValue = true;
    this.renderer.setProperty(inputElement, 'value', formattedValue);
    this.updatingValue = false;
  }

  private formatRut(value: string): string {
    value = value.replace(/[^0-9kK]/g, ''); // Remove non-numeric characters except K/k

    const rutPart = value.slice(0, -1); // Los primeros 8 dígitos
    const dvPart = value.slice(-1); // El último dígito verificador

    let formattedValue = '';
    let counter = 0;

    for (let i = rutPart.length - 1; i >= 0; i--) {
      if (counter === 3) {
        formattedValue = '.' + formattedValue;
        counter = 0;
      }
      formattedValue = rutPart[i] + formattedValue;
      counter++;
    }

    if (dvPart) {
      formattedValue += '-' + dvPart;
    }

    return formattedValue;
  }

  // Método público para obtener el valor crudo del RUT
  public getRawValue(): string {
    return this.rawValue;
  }
}
