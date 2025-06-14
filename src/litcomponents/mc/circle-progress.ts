import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Clase base abstracta con toda la funcionalidad común
export abstract class BaseProgress extends LitElement {
  // Define reactive properties with types
  @property({ type: Number }) value: number = 0;
  @property({ type: String, attribute: 'center-color' }) centerColor: string = 'transparent';
  @property({ type: String, attribute: 'bg-color' }) bgColor: string = '#e0e0e0';
  @property({ type: String, attribute: 'active-color' }) activeColor: string = '#007bff';
  @property({ type: Number }) radius: number = 100;
  @property({ type: Number }) strokeWidth: number = 10;
  @property({ type: String }) text: string = '';

  // Estilos base comunes
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }
    .container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .text {
      position: absolute;
      top: 50%;
      left: 50%;
      font-family: sans-serif;
      font-size: 1.2rem;
      font-weight: bold;
      pointer-events: none;
      text-shadow: 1px 1px 2px rgba(255,255,255,0.5);
    }
  `;

  // Called after the component's first update
  firstUpdated() {
    this.setAttribute('role', 'progressbar');
    this.updateDimensions();
  }

  // Respond to property changes
  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('radius') || changedProperties.has('strokeWidth')) {
      this.updateDimensions();
    }
  }

  // Método abstracto que cada subclase debe implementar
  protected abstract updateDimensions(): void;

  // Public API methods (comunes a todos los tipos)
  public getValue(): number {
    return this.value;
  }

  public setValue(value: number, updateText: boolean = true): void {
    this.value = Math.max(0, Math.min(100, value)); // Clamp between 0-100
    if (updateText) {
      this.text = value + '%';
    }
  }

  public setText(text: string): void {
    this.text = text;
  }

  public getText(): string {
    return this.text;
  }

  public setActiveColor(color: string): void {
    this.activeColor = color;
  }

  public setCenterColor(color: string): void {
    this.centerColor = color;
  }

  public setBgColor(color: string): void {
    this.bgColor = color;
  }

  public setStrokeWidth(width: number): void {
    this.strokeWidth = width;
    this.updateDimensions();
  }

  public setRadius(radius: number): void {
    this.radius = radius;
    this.updateDimensions();
  }

  // Método helper para calcular el porcentaje
  protected getProgressPercentage(): number {
    return Math.max(0, Math.min(100, this.value));
  }
}

// Componente circular (refactorizado para heredar de BaseProgress)
@customElement('circle-progress')
export class CircleProgress extends BaseProgress {
  static styles = css`
    ${BaseProgress.styles}
    .text {
      transform: translate(-50%, -50%);
    }
  `;

  protected updateDimensions(): void {
    this.style.width = `${this.radius}px`;
    this.style.height = `${this.radius}px`;
  }

  // Calculate the circumference of the circle
  private getCircumference(): number {
    const normalizedRadius = this.radius / 2 - this.strokeWidth / 2;
    return normalizedRadius * 2 * Math.PI;
  }

  // Calculate the stroke-dasharray for the progress arc
  private calculateStrokeDashArray(value: number): string {
    const circumference = this.getCircumference();
    const progressLength = circumference * value / 100;
    return `${progressLength} ${circumference - progressLength}`;
  }

  render() {
    const normalizedRadius = this.radius / 2 - this.strokeWidth / 2;
    const dashArray = this.calculateStrokeDashArray(this.value);
    const center = this.radius / 2;

    return html`
      <div class="container">
        <svg width="100%" height="100%" viewBox="0 0 ${this.radius} ${this.radius}">
          <!-- Center circle (can be transparent) -->
          <circle 
            cx="${center}" 
            cy="${center}" 
            r="${normalizedRadius - this.strokeWidth / 2}" 
            fill="${this.centerColor}" 
          />
          
          <!-- Background circle -->
          <circle 
            cx="${center}" 
            cy="${center}" 
            r="${normalizedRadius}" 
            fill="none"
            stroke="${this.bgColor}" 
            stroke-width="${this.strokeWidth}" 
          />
          
          <!-- Progress circle -->
          <circle 
            cx="${center}" 
            cy="${center}" 
            r="${normalizedRadius}" 
            fill="none" 
            stroke="${this.activeColor}" 
            stroke-width="${this.strokeWidth}" 
            stroke-dasharray="${dashArray}"
            stroke-dashoffset="0"
            transform="rotate(-90 ${center} ${center})"
          />
        </svg>
        <span class="text">${this.text || this.value + '%'}</span>
      </div>
    `;
  }
}

// Componente de barra horizontal
@customElement('horizontal-progress')
export class HorizontalProgress extends BaseProgress {
  static styles = css`
    ${BaseProgress.styles}
    .container {
      border-radius: 10px;
      overflow: hidden;
    }
    .background {
      width: 100%;
      height: 100%;
      border-radius: 10px;
    }
    .progress {
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
      position: absolute;
      top: 0;
      left: 0;
    }
    .text {
      transform: translate(-50%, -50%);
      font-size: small;
      color: black; 
    }
  `;

  protected updateDimensions(): void {
    this.style.height = `${this.strokeWidth}pt`;
  }

  // Método específico para barras horizontales
  public setWidth(width: number): void {
    this.setRadius(width);
  }

  public setHeight(height: number): void {
    this.setStrokeWidth(height);
  }

  render() {
    return html`
      <div class="container">
        <div 
          class="background" 
          style="background-color: ${this.bgColor}"
        ></div>
        <div 
          class="progress" 
          style="
            width: ${this.getProgressPercentage()}%; 
            background-color: ${this.activeColor};
          "
        ></div>
        <span class="text">${this.text || this.value + '%'}</span>
      </div>
    `;
  }
}

// Componente de barra vertical
@customElement('vertical-progress')
export class VerticalProgress extends BaseProgress {
  static styles = css`
    ${BaseProgress.styles}
    .container {
      border-radius: 10px;
      overflow: hidden;
    }
    .background {
      width: 100%;
      height: 100%;
      border-radius: 10px;
    }
    .progress {
      width: 100%;
      border-radius: 10px;
      transition: height 0.3s ease;
      position: absolute;
      bottom: 0;
      left: 0;
    }
    .text {
      transform: translate(-50%, -50%) rotate(-90deg);
      white-space: nowrap;
    }
  `;

  protected updateDimensions(): void {
    this.style.width = `${this.strokeWidth}px`;
    this.style.height = `${this.radius}px`;
  }

  // Métodos específicos para barras verticales
  public setWidth(width: number): void {
    this.setStrokeWidth(width);
  }

  public setHeight(height: number): void {
    this.setRadius(height);
  }

  render() {
    return html`
      <div class="container">
        <div 
          class="background" 
          style="background-color: ${this.bgColor}"
        ></div>
        <div 
          class="progress" 
          style="
            height: ${this.getProgressPercentage()}%; 
            background-color: ${this.activeColor};
          "
        ></div>
        <span class="text">${this.text || this.value + '%'}</span>
      </div>
    `;
  }
}