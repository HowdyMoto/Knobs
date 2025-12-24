import { KnobOptions, DEFAULT_OPTIONS } from './types';
import { getKnobSvg, parseSvgString, getViewBoxDimensions, lightenColor } from './svg-assets';

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
    Pick<KnobOptions, 'min' | 'max' | 'valueLabels' | 'className' | 'knobStyle' | 'knobSvg'>;

  // Unique filter IDs for this instance
  private shadowFilterId: string;

  constructor(options: KnobOptions, instanceId: number = 0) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.size = this.options.size;
    this.instanceId = instanceId;

    // Generate unique IDs for SVG filters to avoid conflicts between multiple knobs
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

    // Create the dial/indicator group (this rotates)
    const dial = this.createDial(padding);
    dial.setAttribute('class', 'knob-dial');
    svg.appendChild(dial);

    return svg;
  }

  /**
   * Create SVG defs (gradients, filters)
   */
  private createDefs(): SVGDefsElement {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

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
   * Create the background plate with optional tick marks
   */
  private createPlate(padding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const center = this.size / 2 + padding;
    const outerRadius = this.size / 2;
    const tickLength = outerRadius * 0.12;

    // Draw tick marks if enabled
    if (this.options.showTicks && this.options.mode === 'bounded') {
      const startAngle = this.options.startAngle;
      const endAngle = this.options.endAngle;
      const totalAngle = endAngle - startAngle;
      const tickCount = this.options.tickCount;

      for (let i = 0; i < tickCount; i++) {
        const angle = startAngle + (totalAngle / (tickCount - 1)) * i;
        const radians = (angle - 90) * (Math.PI / 180);

        const x1 = center + Math.cos(radians) * (outerRadius - tickLength);
        const y1 = center + Math.sin(radians) * (outerRadius - tickLength);
        const x2 = center + Math.cos(radians) * (outerRadius );
        const y2 = center + Math.sin(radians) * (outerRadius );

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
   * Create the rotating dial/indicator using SVG assets
   */
  private createDial(padding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const center = this.size / 2 + padding;
    const radius = this.size * 0.5;

    // Get SVG string from options or preset
    const svgString = getKnobSvg(this.options.knobStyle, this.options.knobSvg);

    // Parse the SVG and get its content
    const svgContent = parseSvgString(svgString, this.instanceId);
    const viewBox = getViewBoxDimensions(svgContent);

    // Calculate scale to fit the dial within the knob radius
    const dialSize = radius * 2;
    const scale = dialSize / Math.max(viewBox.width, viewBox.height);

    // Create a nested group for scaling and positioning
    const dialGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Set CSS variables for colors on the dial group
    dialGroup.style.setProperty('--knob-dial-color', this.options.dialColor);
    dialGroup.style.setProperty('--knob-dial-highlight', lightenColor(this.options.dialColor, 40));
    dialGroup.style.setProperty('--knob-indicator-color', this.options.indicatorColor);

    // Position and scale the SVG content
    // Center the viewBox at the knob center
    const offsetX = center - (viewBox.width * scale) / 2;
    const offsetY = center - (viewBox.height * scale) / 2;

    dialGroup.setAttribute('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`);
    dialGroup.appendChild(svgContent);

    group.appendChild(dialGroup);

    // Set transform origin for rotation
    group.style.transformOrigin = `${center}px ${center}px`;

    return group;
  }
}
