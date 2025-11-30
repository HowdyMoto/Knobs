import { KnobOptions, DEFAULT_OPTIONS } from './types';

// SVG rendering constants
const GRIP_RIDGE_COUNT = 24;

// Rotation constants (shared with knob.ts via re-export)
/** Total rotation range in degrees for unbounded knobs */
export const TOTAL_ROTATION_DEGREES = 270;
/** Reference range for calculating degrees per unit */
export const REFERENCE_VALUE_RANGE = 10;
/** Degrees of rotation per unit value in infinite/min-only modes */
export const DEGREES_PER_UNIT = TOTAL_ROTATION_DEGREES / REFERENCE_VALUE_RANGE;

/**
 * Creates SVG elements for the knob
 */
export class SVGRenderer {
  private size: number;
  private instanceId: number;
  private options: typeof DEFAULT_OPTIONS &
    Pick<KnobOptions, 'min' | 'max' | 'valueLabels' | 'className'>;

  // Unique filter IDs for this instance
  private bodyGradientId: string;
  private glowFilterId: string;
  private shadowFilterId: string;

  constructor(options: KnobOptions, instanceId: number = 0) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.size = this.options.size;
    this.instanceId = instanceId;

    // Generate unique IDs for SVG filters to avoid conflicts between multiple knobs
    this.bodyGradientId = `knob-body-gradient-${this.instanceId}`;
    this.glowFilterId = `glow-filter-${this.instanceId}`;
    this.shadowFilterId = `knob-shadow-${this.instanceId}`;
  }

  /**
   * Create the complete SVG element for the knob
   */
  createSVG(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const padding = this.size * 0.25; // Extra space for labels
    const totalSize = this.size + padding * 2;

    svg.setAttribute('width', String(totalSize));
    svg.setAttribute('height', String(totalSize));
    svg.setAttribute('viewBox', `0 0 ${totalSize} ${totalSize}`);
    svg.style.display = 'block';
    svg.style.userSelect = 'none';

    // Add defs for gradients and filters
    const defs = this.createDefs();
    svg.appendChild(defs);

    // Create background plate with tick marks
    const plate = this.createPlate(padding);
    svg.appendChild(plate);

    // Create value labels if enabled
    if (this.options.showValueLabels && this.options.mode === 'bounded') {
      const labels = this.createValueLabels(padding);
      svg.appendChild(labels);
    }

    // Create the knob body
    const knobBody = this.createKnobBody(padding);
    svg.appendChild(knobBody);

    // Create the dial/indicator group (this rotates)
    const dial = this.createDial(padding);
    dial.setAttribute('class', 'knob-dial');
    svg.appendChild(dial);

    // Create glow effect if enabled
    if (this.options.glow) {
      const glow = this.createGlow(padding);
      glow.setAttribute('class', 'knob-glow');
      svg.appendChild(glow);
    }

    // Create power indicator if toggleable
    if (this.options.toggleable) {
      const powerIndicator = this.createPowerIndicator(padding);
      powerIndicator.setAttribute('class', 'knob-power');
      svg.appendChild(powerIndicator);
    }

    return svg;
  }

  /**
   * Create SVG defs (gradients, filters)
   */
  private createDefs(): SVGDefsElement {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Knob body gradient (3D effect)
    const bodyGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    bodyGradient.setAttribute('id', this.bodyGradientId);
    bodyGradient.setAttribute('cx', '30%');
    bodyGradient.setAttribute('cy', '30%');
    bodyGradient.setAttribute('r', '70%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', this.lightenColor(this.options.dialColor, 40));

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', this.options.dialColor);

    bodyGradient.appendChild(stop1);
    bodyGradient.appendChild(stop2);
    defs.appendChild(bodyGradient);

    // Glow filter
    const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glowFilter.setAttribute('id', this.glowFilterId);
    glowFilter.setAttribute('x', '-50%');
    glowFilter.setAttribute('y', '-50%');
    glowFilter.setAttribute('width', '200%');
    glowFilter.setAttribute('height', '200%');

    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '3');
    feGaussianBlur.setAttribute('result', 'coloredBlur');

    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1.setAttribute('in', 'coloredBlur');
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);

    glowFilter.appendChild(feGaussianBlur);
    glowFilter.appendChild(feMerge);
    defs.appendChild(glowFilter);

    // Drop shadow for knob
    const shadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    shadowFilter.setAttribute('id', this.shadowFilterId);
    shadowFilter.setAttribute('x', '-20%');
    shadowFilter.setAttribute('y', '-20%');
    shadowFilter.setAttribute('width', '140%');
    shadowFilter.setAttribute('height', '140%');

    const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    feDropShadow.setAttribute('dx', '0');
    feDropShadow.setAttribute('dy', '2');
    feDropShadow.setAttribute('stdDeviation', '3');
    feDropShadow.setAttribute('flood-opacity', '0.5');

    shadowFilter.appendChild(feDropShadow);
    defs.appendChild(shadowFilter);

    return defs;
  }

  /**
   * Create the background plate with tick marks
   */
  private createPlate(padding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const center = this.size / 2 + padding;
    const outerRadius = this.size / 2;
    const innerRadius = outerRadius * 0.75;
    const tickLength = outerRadius * 0.12;

    // Background circle
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', String(center));
    bg.setAttribute('cy', String(center));
    bg.setAttribute('r', String(outerRadius));
    bg.setAttribute('fill', this.options.backgroundColor);
    group.appendChild(bg);

    // Draw tick marks
    if (this.options.mode === 'bounded') {
      const startAngle = this.options.startAngle;
      const endAngle = this.options.endAngle;
      const totalAngle = endAngle - startAngle;
      const tickCount = this.options.tickCount;

      for (let i = 0; i < tickCount; i++) {
        const angle = startAngle + (totalAngle / (tickCount - 1)) * i;
        const radians = (angle - 90) * (Math.PI / 180);

        const x1 = center + Math.cos(radians) * (outerRadius - tickLength);
        const y1 = center + Math.sin(radians) * (outerRadius - tickLength);
        const x2 = center + Math.cos(radians) * (outerRadius - 2);
        const y2 = center + Math.sin(radians) * (outerRadius - 2);

        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', String(x1));
        tick.setAttribute('y1', String(y1));
        tick.setAttribute('x2', String(x2));
        tick.setAttribute('y2', String(y2));
        tick.setAttribute('stroke', this.options.tickColor);
        tick.setAttribute('stroke-width', '2');
        tick.setAttribute('stroke-linecap', 'round');
        group.appendChild(tick);
      }
    }

    return group;
  }

  /**
   * Create value labels around the dial
   */
  private createValueLabels(padding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const center = this.size / 2 + padding;
    const labelRadius = this.size / 2 + padding * 0.6;

    const startAngle = this.options.startAngle;
    const endAngle = this.options.endAngle;
    const totalAngle = endAngle - startAngle;

    const labels = this.options.valueLabels ||
      this.generateDefaultLabels(this.options.min ?? 0, this.options.max ?? 10);

    const labelCount = labels.length;

    for (let i = 0; i < labelCount; i++) {
      const angle = startAngle + (totalAngle / (labelCount - 1)) * i;
      const radians = (angle - 90) * (Math.PI / 180);

      const x = center + Math.cos(radians) * labelRadius;
      const y = center + Math.sin(radians) * labelRadius;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(y));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', this.options.labelColor);
      text.setAttribute('font-family', this.options.fontFamily);
      text.setAttribute('font-size', String(this.size * 0.12));
      text.textContent = labels[i];
      group.appendChild(text);
    }

    return group;
  }

  /**
   * Generate default numeric labels
   */
  private generateDefaultLabels(min: number, max: number): string[] {
    const labels: string[] = [];
    const step = (max - min) / (this.options.tickCount - 1);

    for (let i = 0; i < this.options.tickCount; i++) {
      const value = min + step * i;
      labels.push(String(Math.round(value * 10) / 10));
    }

    return labels;
  }

  /**
   * Create the 3D knob body
   */
  private createKnobBody(padding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const center = this.size / 2 + padding;
    const radius = this.size * 0.35;

    // Outer ring (bezel)
    const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerRing.setAttribute('cx', String(center));
    outerRing.setAttribute('cy', String(center));
    outerRing.setAttribute('r', String(radius + 3));
    outerRing.setAttribute('fill', '#444444');
    outerRing.setAttribute('filter', `url(#${this.shadowFilterId})`);
    group.appendChild(outerRing);

    // Main knob body
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    body.setAttribute('cx', String(center));
    body.setAttribute('cy', String(center));
    body.setAttribute('r', String(radius));
    body.setAttribute('fill', `url(#${this.bodyGradientId})`);
    group.appendChild(body);

    // Grip ridges (subtle texture)
    for (let i = 0; i < GRIP_RIDGE_COUNT; i++) {
      const angle = (360 / GRIP_RIDGE_COUNT) * i;
      const radians = (angle - 90) * (Math.PI / 180);

      const x1 = center + Math.cos(radians) * (radius * 0.85);
      const y1 = center + Math.sin(radians) * (radius * 0.85);
      const x2 = center + Math.cos(radians) * (radius * 0.95);
      const y2 = center + Math.sin(radians) * (radius * 0.95);

      const ridge = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ridge.setAttribute('x1', String(x1));
      ridge.setAttribute('y1', String(y1));
      ridge.setAttribute('x2', String(x2));
      ridge.setAttribute('y2', String(y2));
      ridge.setAttribute('stroke', 'rgba(255,255,255,0.1)');
      ridge.setAttribute('stroke-width', '1');
      group.appendChild(ridge);
    }

    return group;
  }

  /**
   * Create the rotating dial/indicator
   */
  private createDial(padding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const center = this.size / 2 + padding;
    const radius = this.size * 0.35;

    // Indicator line
    const indicatorLength = radius * 0.7;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(center));
    line.setAttribute('y1', String(center - radius * 0.2));
    line.setAttribute('x2', String(center));
    line.setAttribute('y2', String(center - indicatorLength));
    line.setAttribute('stroke', this.options.indicatorColor);
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    group.appendChild(line);

    // Indicator dot at the end
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(center));
    dot.setAttribute('cy', String(center - indicatorLength + 2));
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', this.options.indicatorColor);
    group.appendChild(dot);

    // Set transform origin
    group.style.transformOrigin = `${center}px ${center}px`;

    return group;
  }

  /**
   * Create center glow effect
   */
  private createGlow(padding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const center = this.size / 2 + padding;
    const radius = this.size * 0.15;

    // Glow circle
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('cx', String(center));
    glow.setAttribute('cy', String(center));
    glow.setAttribute('r', String(radius));
    glow.setAttribute('fill', this.options.glowColor);
    glow.setAttribute('filter', `url(#${this.glowFilterId})`);
    glow.setAttribute('opacity', '0.8');
    group.appendChild(glow);

    // Inner bright spot
    const spot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    spot.setAttribute('cx', String(center));
    spot.setAttribute('cy', String(center));
    spot.setAttribute('r', String(radius * 0.5));
    spot.setAttribute('fill', this.lightenColor(this.options.glowColor, 50));
    group.appendChild(spot);

    return group;
  }

  /**
   * Create power indicator for toggleable knobs
   */
  private createPowerIndicator(padding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const center = this.size / 2 + padding;
    const y = center + this.size * 0.5;

    // Power LED
    const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    led.setAttribute('cx', String(center));
    led.setAttribute('cy', String(y));
    led.setAttribute('r', '4');
    led.setAttribute('fill', '#00ff00');
    led.setAttribute('class', 'power-led');
    group.appendChild(led);

    return group;
  }

  /**
   * Lighten a hex color
   */
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
}
