import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('circle-progress')
export class CircleProgress extends LitElement {
  // Define reactive properties with types
  @property({ type: Number }) value: number = 0;
  @property({ type: String, attribute: 'center-color' }) centerColor: string = 'transparent';
  @property({ type: String, attribute: 'bg-color' }) bgColor: string = '#e0e0e0';
  @property({ type: String, attribute: 'active-color' }) activeColor: string = '#007bff';
  @property({ type: Number }) radius: number = 100;
  @property({ type: Number }) strokeWidth: number = 10;
  @property({ type: String }) text: string = '';

  // Define styles for the component
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
      transform: translate(-50%, -50%);
      font-family: sans-serif;
      font-size: 1.2rem;
      font-weight: bold;
      pointer-events: none;
    }
  `;

  // Called after the component's first update
  firstUpdated() {
    this.setAttribute('role', 'progressbar');
    this.style.width = `${this.radius}px`;
    this.style.height = `${this.radius}px`;
  }

  // Respond to property changes
  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('radius')) {
      this.style.width = `${this.radius}px`;
      this.style.height = `${this.radius}px`;
    }
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

  // Public API methods
  public getValue(): number {
    return this.value;
  }

  public setValue(value: number, updateText: boolean = true): void {
    this.value = value;
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
  }

  // Render the component's template
  render() {
    const normalizedRadius = this.radius / 2 - this.strokeWidth / 2;
    const circumference = this.getCircumference();
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