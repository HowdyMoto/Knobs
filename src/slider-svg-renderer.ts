import { SliderOptions, DEFAULT_SLIDER_OPTIONS } from './types';
import { getSliderThumbSvg, parseSvgString, getViewBoxDimensions, lightenColor, darkenColor } from './svg-assets';

/**
 * Creates SVG elements for the slider
 */
export class SliderSVGRenderer {
  private options: typeof DEFAULT_SLIDER_OPTIONS &
    Pick<SliderOptions, 'valueLabels' | 'className' | 'thumbStyle' | 'thumbSvg'>;
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
    trackStop1.setAttribute('stop-color', darkenColor(this.options.trackColor, 20));

    const trackStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    trackStop2.setAttribute('offset', '50%');
    trackStop2.setAttribute('stop-color', this.options.trackColor);

    const trackStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    trackStop3.setAttribute('offset', '100%');
    trackStop3.setAttribute('stop-color', lightenColor(this.options.trackColor, 10));

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
    thumbStop1.setAttribute('stop-color', lightenColor(this.options.thumbColor, 30));

    const thumbStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    thumbStop2.setAttribute('offset', '100%');
    thumbStop2.setAttribute('stop-color', darkenColor(this.options.thumbColor, 20));

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
    groove.setAttribute('fill', darkenColor(this.options.trackColor, 30));
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
   * Create the thumb/fader cap using SVG assets
   */
  private createThumb(labelPadding: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const centerX = labelPadding + this.options.width / 2;
    const thumbWidth = 24;
    const thumbHeight = 30;

    // Get SVG string from options or preset
    const svgString = getSliderThumbSvg(this.options.thumbStyle, this.options.thumbSvg);

    // Parse the SVG and get its content
    const svgContent = parseSvgString(svgString, this.instanceId);
    const viewBox = getViewBoxDimensions(svgContent);

    // Calculate scale to fit the thumb within expected dimensions
    const scaleX = thumbWidth / viewBox.width;
    const scaleY = thumbHeight / viewBox.height;
    const scale = Math.min(scaleX, scaleY);

    // Create a nested group for scaling and positioning
    const thumbGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Set CSS variables for colors on the thumb group
    thumbGroup.style.setProperty('--slider-thumb-color', this.options.thumbColor);
    thumbGroup.style.setProperty('--slider-thumb-highlight', lightenColor(this.options.thumbColor, 30));
    thumbGroup.style.setProperty('--slider-thumb-shadow', darkenColor(this.options.thumbColor, 20));
    thumbGroup.style.setProperty('--slider-indicator-color', '#ffffff');

    // Position and scale the SVG content
    // Center horizontally at centerX, vertically at 0 (thumb moves along track)
    const scaledWidth = viewBox.width * scale;
    const scaledHeight = viewBox.height * scale;
    const offsetX = centerX - scaledWidth / 2;
    const offsetY = -scaledHeight / 2;

    thumbGroup.setAttribute('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`);
    thumbGroup.appendChild(svgContent);

    // Apply shadow filter to the group
    thumbGroup.setAttribute('filter', `url(#${this.shadowFilterId})`);

    group.appendChild(thumbGroup);

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
