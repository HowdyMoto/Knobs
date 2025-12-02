import { SliderOptions, DEFAULT_SLIDER_OPTIONS } from './types';

/**
 * Creates SVG elements for the slider
 */
export class SliderSVGRenderer {
  private options: typeof DEFAULT_SLIDER_OPTIONS &
    Pick<SliderOptions, 'valueLabels' | 'className'>;
  private instanceId: number;

  // Unique filter IDs for this instance
  private trackGradientId: string;
  private thumbGradientId: string;
  private shadowFilterId: string;

  constructor(options: SliderOptions, instanceId: number = 0) {
    this.options = { ...DEFAULT_SLIDER_OPTIONS, ...options };
    this.instanceId = instanceId;

    // Generate unique IDs for SVG filters
    this.trackGradientId = `slider-track-gradient-${this.instanceId}`;
    this.thumbGradientId = `slider-thumb-gradient-${this.instanceId}`;
    this.shadowFilterId = `slider-shadow-${this.instanceId}`;
  }

  /**
   * Create the complete SVG element for the slider
   */
  createSVG(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // Calculate dimensions with padding for labels
    const labelPadding = this.options.showValueLabels ? 35 : 10;
    const totalWidth = this.options.width + labelPadding * 2;
    const totalHeight = this.options.length + 20; // Extra space for thumb overflow

    svg.setAttribute('width', String(totalWidth));
    svg.setAttribute('height', String(totalHeight));
    svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    svg.style.display = 'block';
    svg.style.userSelect = 'none';

    // Add defs for gradients and filters
    const defs = this.createDefs();
    svg.appendChild(defs);

    // Create track
    const track = this.createTrack(labelPadding);
    svg.appendChild(track);

    // Create tick marks if enabled
    if (this.options.showTicks) {
      const ticks = this.createTicks(labelPadding);
      svg.appendChild(ticks);
    }

    // Create value labels if enabled
    if (this.options.showValueLabels) {
      const labels = this.createValueLabels(labelPadding);
      svg.appendChild(labels);
    }

    // Create thumb (this moves)
    const thumb = this.createThumb(labelPadding);
    thumb.setAttribute('class', 'slider-thumb');
    svg.appendChild(thumb);

    return svg;
  }

  /**
   * Create SVG defs (gradients, filters)
   */
  private createDefs(): SVGDefsElement {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Track gradient (inset effect)
    const trackGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    trackGradient.setAttribute('id', this.trackGradientId);
    trackGradient.setAttribute('x1', '0%');
    trackGradient.setAttribute('y1', '0%');
    trackGradient.setAttribute('x2', '100%');
    trackGradient.setAttribute('y2', '0%');

    const trackStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    trackStop1.setAttribute('offset', '0%');
    trackStop1.setAttribute('stop-color', this.darkenColor(this.options.trackColor, 20));

    const trackStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    trackStop2.setAttribute('offset', '50%');
    trackStop2.setAttribute('stop-color', this.options.trackColor);

    const trackStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    trackStop3.setAttribute('offset', '100%');
    trackStop3.setAttribute('stop-color', this.lightenColor(this.options.trackColor, 10));

    trackGradient.appendChild(trackStop1);
    trackGradient.appendChild(trackStop2);
    trackGradient.appendChild(trackStop3);
    defs.appendChild(trackGradient);

    // Thumb gradient (3D effect)
    const thumbGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    thumbGradient.setAttribute('id', this.thumbGradientId);
    thumbGradient.setAttribute('x1', '0%');
    thumbGradient.setAttribute('y1', '0%');
    thumbGradient.setAttribute('x2', '100%');
    thumbGradient.setAttribute('y2', '100%');

    const thumbStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    thumbStop1.setAttribute('offset', '0%');
    thumbStop1.setAttribute('stop-color', this.lightenColor(this.options.thumbColor, 30));

    const thumbStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    thumbStop2.setAttribute('offset', '100%');
    thumbStop2.setAttribute('stop-color', this.darkenColor(this.options.thumbColor, 20));

    thumbGradient.appendChild(thumbStop1);
    thumbGradient.appendChild(thumbStop2);
    defs.appendChild(thumbGradient);

    // Drop shadow for thumb
    const shadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    shadowFilter.setAttribute('id', this.shadowFilterId);
    shadowFilter.setAttribute('x', '-50%');
    shadowFilter.setAttribute('y', '-50%');
    shadowFilter.setAttribute('width', '200%');
    shadowFilter.setAttribute('height', '200%');

    const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    feDropShadow.setAttribute('dx', '0');
    feDropShadow.setAttribute('dy', '2');
    feDropShadow.setAttribute('stdDeviation', '2');
    feDropShadow.setAttribute('flood-opacity', '0.4');

    shadowFilter.appendChild(feDropShadow);
    defs.appendChild(shadowFilter);

    return defs;
  }

  /**
   * Create the track groove
   */
  private createTrack(labelPadding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const centerX = labelPadding + this.options.width / 2;
    const trackWidth = 8;
    const trackHeight = this.options.length;
    const topY = 10; // Offset from top

    // Track background (groove)
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    track.setAttribute('x', String(centerX - trackWidth / 2));
    track.setAttribute('y', String(topY));
    track.setAttribute('width', String(trackWidth));
    track.setAttribute('height', String(trackHeight));
    track.setAttribute('rx', '4');
    track.setAttribute('ry', '4');
    track.setAttribute('fill', `url(#${this.trackGradientId})`);
    group.appendChild(track);

    // Inner groove line
    const groove = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    groove.setAttribute('x', String(centerX - 1.5));
    groove.setAttribute('y', String(topY + 2));
    groove.setAttribute('width', '3');
    groove.setAttribute('height', String(trackHeight - 4));
    groove.setAttribute('rx', '1.5');
    groove.setAttribute('ry', '1.5');
    groove.setAttribute('fill', this.darkenColor(this.options.trackColor, 30));
    group.appendChild(groove);

    return group;
  }

  /**
   * Create tick marks
   */
  private createTicks(labelPadding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const centerX = labelPadding + this.options.width / 2;
    const trackHeight = this.options.length;
    const topY = 10;
    const tickCount = this.options.tickCount;

    for (let i = 0; i < tickCount; i++) {
      const y = topY + (trackHeight / (tickCount - 1)) * i;

      // Left tick
      const leftTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      leftTick.setAttribute('x1', String(centerX - 12));
      leftTick.setAttribute('y1', String(y));
      leftTick.setAttribute('x2', String(centerX - 6));
      leftTick.setAttribute('y2', String(y));
      leftTick.setAttribute('stroke', this.options.tickColor);
      leftTick.setAttribute('stroke-width', '1.5');
      leftTick.setAttribute('stroke-linecap', 'round');
      group.appendChild(leftTick);

      // Right tick
      const rightTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      rightTick.setAttribute('x1', String(centerX + 6));
      rightTick.setAttribute('y1', String(y));
      rightTick.setAttribute('x2', String(centerX + 12));
      rightTick.setAttribute('y2', String(y));
      rightTick.setAttribute('stroke', this.options.tickColor);
      rightTick.setAttribute('stroke-width', '1.5');
      rightTick.setAttribute('stroke-linecap', 'round');
      group.appendChild(rightTick);
    }

    return group;
  }

  /**
   * Create value labels
   */
  private createValueLabels(labelPadding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const centerX = labelPadding + this.options.width / 2;
    const trackHeight = this.options.length;
    const topY = 10;

    const labels = this.options.valueLabels ||
      this.generateDefaultLabels(this.options.min, this.options.max);

    const labelCount = labels.length;

    for (let i = 0; i < labelCount; i++) {
      // Invert: top of slider = max, bottom = min
      const y = topY + (trackHeight / (labelCount - 1)) * i;
      const labelValue = labels[labelCount - 1 - i]; // Reverse order

      if (labelValue === '') continue; // Skip empty labels

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(centerX + 22));
      text.setAttribute('y', String(y));
      text.setAttribute('text-anchor', 'start');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', this.options.labelColor);
      text.setAttribute('font-family', this.options.fontFamily);
      text.setAttribute('font-size', '10');
      text.textContent = labelValue;
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
   * Create the thumb/fader cap with ridged style
   */
  private createThumb(labelPadding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const centerX = labelPadding + this.options.width / 2;
    const thumbWidth = 24;
    const thumbHeight = 30;

    // Main thumb body
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    body.setAttribute('x', String(centerX - thumbWidth / 2));
    body.setAttribute('y', String(-thumbHeight / 2));
    body.setAttribute('width', String(thumbWidth));
    body.setAttribute('height', String(thumbHeight));
    body.setAttribute('rx', '3');
    body.setAttribute('ry', '3');
    body.setAttribute('fill', `url(#${this.thumbGradientId})`);
    body.setAttribute('filter', `url(#${this.shadowFilterId})`);
    group.appendChild(body);

    // Ridges on the thumb
    const ridgeCount = 5;
    const ridgeSpacing = (thumbHeight - 10) / (ridgeCount - 1);
    const ridgeStartY = -thumbHeight / 2 + 5;

    for (let i = 0; i < ridgeCount; i++) {
      const ridgeY = ridgeStartY + i * ridgeSpacing;

      const ridge = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ridge.setAttribute('x1', String(centerX - thumbWidth / 2 + 4));
      ridge.setAttribute('y1', String(ridgeY));
      ridge.setAttribute('x2', String(centerX + thumbWidth / 2 - 4));
      ridge.setAttribute('y2', String(ridgeY));
      ridge.setAttribute('stroke', this.darkenColor(this.options.thumbColor, 30));
      ridge.setAttribute('stroke-width', '1');
      ridge.setAttribute('stroke-linecap', 'round');
      group.appendChild(ridge);

      // Highlight below each ridge
      const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      highlight.setAttribute('x1', String(centerX - thumbWidth / 2 + 4));
      highlight.setAttribute('y1', String(ridgeY + 1.5));
      highlight.setAttribute('x2', String(centerX + thumbWidth / 2 - 4));
      highlight.setAttribute('y2', String(ridgeY + 1.5));
      highlight.setAttribute('stroke', this.lightenColor(this.options.thumbColor, 20));
      highlight.setAttribute('stroke-width', '0.5');
      highlight.setAttribute('stroke-linecap', 'round');
      group.appendChild(highlight);
    }

    // Center indicator line
    const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    indicator.setAttribute('x', String(centerX - thumbWidth / 2));
    indicator.setAttribute('y', String(-1));
    indicator.setAttribute('width', String(thumbWidth));
    indicator.setAttribute('height', '2');
    indicator.setAttribute('fill', '#ffffff');
    indicator.setAttribute('opacity', '0.8');
    group.appendChild(indicator);

    return group;
  }

  /**
   * Create toggle switch element
   */
  createToggle(width: number): HTMLDivElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.marginTop = '8px';
    container.style.gap = '4px';

    // Toggle button
    const button = document.createElement('div');
    button.className = 'slider-toggle';
    button.style.width = '20px';
    button.style.height = '20px';
    button.style.borderRadius = '3px';
    button.style.backgroundColor = '#333';
    button.style.border = '1px solid #555';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.3)';

    // LED indicator
    const led = document.createElement('div');
    led.className = 'slider-toggle-led';
    led.style.width = '8px';
    led.style.height = '8px';
    led.style.borderRadius = '50%';
    led.style.backgroundColor = '#333';
    led.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.5)';
    led.style.transition = 'background-color 0.1s, box-shadow 0.1s';
    button.appendChild(led);

    container.appendChild(button);

    // Toggle label
    if (this.options.toggleLabel) {
      const label = document.createElement('div');
      label.textContent = this.options.toggleLabel;
      label.style.fontFamily = this.options.fontFamily;
      label.style.fontSize = '9px';
      label.style.color = this.options.labelColor;
      label.style.textTransform = 'uppercase';
      label.style.letterSpacing = '0.5px';
      container.appendChild(label);
    }

    return container;
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

  /**
   * Darken a hex color
   */
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  /**
   * Get the track length for positioning calculations
   */
  getTrackLength(): number {
    return this.options.length;
  }

  /**
   * Get the top Y offset
   */
  getTopY(): number {
    return 10;
  }

  /**
   * Get toggle LED color
   */
  getToggleLedColor(): string {
    return this.options.toggleLedColor;
  }
}
