import {
  KnobOptions,
  KnobChangeEvent,
  KnobToggleEvent,
  IKnob,
  DEFAULT_OPTIONS,
  globalConfig,
} from './types';
import { SVGRenderer } from './svg-renderer';

/**
 * Main Knob class - creates an interactive rotatable knob control
 */
export class Knob implements IKnob {
  private options: typeof DEFAULT_OPTIONS &
    Pick<KnobOptions, 'min' | 'max' | 'valueLabels' | 'className'>;

  // Resolved config values (from options or globalConfig)
  private pixelsPerFullRotation: number;
  private shiftMultiplier: number;
  private ctrlMultiplier: number;

  private container: HTMLElement;
  private svg: SVGSVGElement;
  private dialGroup: SVGGElement | null = null;
  private glowGroup: SVGGElement | null = null;
  private powerIndicator: SVGGElement | null = null;

  private value: number;          // The stepped/rounded value for external use
  private rawValue: number = 0;   // Internal unrounded value for smooth tracking
  private angle: number = 0;
  private powered: boolean;

  // Interaction state
  private isDragging: boolean = false;
  private lastY: number = 0;

  // Event callbacks
  private changeCallbacks: Set<(event: KnobChangeEvent) => void> = new Set();
  private toggleCallbacks: Set<(event: KnobToggleEvent) => void> = new Set();

  // Bound event handlers for cleanup
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  constructor(container: HTMLElement | string, options: Partial<KnobOptions> = {}) {
    // Get container element
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el) throw new Error(`Container not found: ${container}`);
      this.container = el as HTMLElement;
    } else {
      this.container = container;
    }

    // Merge options with defaults
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Resolve global config values (per-knob overrides take precedence)
    this.pixelsPerFullRotation = options.pixelsPerFullRotation ?? globalConfig.pixelsPerFullRotation;
    this.shiftMultiplier = options.shiftMultiplier ?? globalConfig.shiftMultiplier;
    this.ctrlMultiplier = options.ctrlMultiplier ?? globalConfig.ctrlMultiplier;

    // Set default min/max based on mode (use merged options, not user options)
    if (this.options.mode === 'bounded') {
      this.options.min = this.options.min ?? 0;
      this.options.max = this.options.max ?? 10;
    } else if (this.options.mode === 'min-only') {
      this.options.min = this.options.min ?? 0;
    }

    // Initialize value
    this.value = this.options.value;
    this.rawValue = this.options.value;
    this.powered = this.options.powered;

    // Calculate initial angle
    this.angle = this.valueToAngle(this.value);

    // Bind event handlers
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);

    // Render the knob
    this.svg = this.render();
    this.attachEventListeners();

    // Apply initial state
    this.updateVisuals();
  }

  /**
   * Render the SVG knob
   */
  private render(): SVGSVGElement {
    const renderer = new SVGRenderer(this.options);
    const svg = renderer.createSVG();

    // Add custom class if provided
    if (this.options.className) {
      this.container.classList.add(this.options.className);
    }

    // Style the container
    this.container.style.display = 'inline-block';
    this.container.style.cursor = 'pointer';
    this.container.style.touchAction = 'none'; // Prevent scrolling on touch

    // Add label below if provided
    if (this.options.label) {
      const wrapper = document.createElement('div');
      wrapper.style.textAlign = 'center';
      wrapper.appendChild(svg);

      const label = document.createElement('div');
      label.textContent = this.options.label;
      label.style.fontFamily = this.options.fontFamily;
      label.style.fontSize = `${this.options.size * 0.14}px`;
      label.style.color = this.options.labelColor;
      label.style.marginTop = '-5px';
      wrapper.appendChild(label);

      this.container.appendChild(wrapper);
    } else {
      this.container.appendChild(svg);
    }

    // Get references to animated elements
    this.dialGroup = svg.querySelector('.knob-dial') as SVGGElement;
    this.glowGroup = svg.querySelector('.knob-glow') as SVGGElement;
    this.powerIndicator = svg.querySelector('.knob-power') as SVGGElement;

    return svg;
  }

  /**
   * Attach mouse and touch event listeners
   */
  private attachEventListeners(): void {
    // Mouse events
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));

    // Touch events
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });

    // Click for toggle
    if (this.options.toggleable) {
      this.container.addEventListener('click', this.handleClick.bind(this));
    }

    // Prevent context menu on long press
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();

    this.startDrag(e.clientY);

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaY = this.lastY - e.clientY;
    this.processDrag(deltaY, e.shiftKey, e.ctrlKey);
    this.lastY = e.clientY;
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(_e: MouseEvent): void {
    this.endDrag();

    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    e.preventDefault();

    this.startDrag(e.touches[0].clientY);

    document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    document.addEventListener('touchend', this.boundTouchEnd);
    document.addEventListener('touchcancel', this.boundTouchEnd);
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;
    e.preventDefault();

    const deltaY = this.lastY - e.touches[0].clientY;
    // Touch doesn't have modifier keys, use normal speed
    this.processDrag(deltaY, false, false);
    this.lastY = e.touches[0].clientY;
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(_e: TouchEvent): void {
    this.endDrag();

    document.removeEventListener('touchmove', this.boundTouchMove);
    document.removeEventListener('touchend', this.boundTouchEnd);
    document.removeEventListener('touchcancel', this.boundTouchEnd);
  }

  /**
   * Start dragging
   */
  private startDrag(y: number): void {
    this.isDragging = true;
    this.lastY = y;
    this.container.style.cursor = 'grabbing';
  }

  /**
   * Get the effective value range for this knob
   */
  private getValueRange(): number {
    switch (this.options.mode) {
      case 'bounded':
        return this.options.max! - this.options.min!;
      case 'min-only':
        // Use a reference range for unbounded knobs
        return 10;
      case 'infinite':
        // Use a reference range for infinite knobs
        return 10;
    }
  }

  /**
   * Process drag movement
   */
  private processDrag(deltaY: number, shiftKey: boolean, ctrlKey: boolean): void {
    if (!this.powered && this.options.toggleable) return;

    // Calculate movement as a fraction of the full rotation (0 to 1)
    // pixelsPerFullRotation defines how many pixels = 100% of the dial travel
    let movementFraction = deltaY / this.pixelsPerFullRotation;

    // Apply modifier keys
    if (shiftKey) {
      movementFraction *= this.shiftMultiplier;
    }
    if (ctrlKey) {
      movementFraction *= this.ctrlMultiplier;
    }

    // Convert fraction to value delta based on this knob's range
    const valueRange = this.getValueRange();
    const valueDelta = movementFraction * valueRange;

    // Update raw value (accumulates fractional movements for smooth rotation)
    const previousValue = this.value;
    this.updateValue(this.rawValue + valueDelta);

    // Emit change event if stepped value changed
    if (this.value !== previousValue) {
      this.emitChange(previousValue);
    }
  }

  /**
   * End dragging
   */
  private endDrag(): void {
    this.isDragging = false;
    this.container.style.cursor = 'pointer';
  }

  /**
   * Handle click for toggle
   */
  private handleClick(e: MouseEvent): void {
    // Only toggle on quick clicks, not after dragging
    if (this.isDragging) return;

    // Check if it was a quick tap (no significant movement)
    this.toggle();
  }

  /**
   * Update the value with bounds checking
   */
  private updateValue(newValue: number): void {
    // Store raw value for smooth accumulation
    switch (this.options.mode) {
      case 'infinite':
        // No bounds, just update
        this.rawValue = newValue;
        break;

      case 'min-only':
        // Only check minimum
        this.rawValue = Math.max(this.options.min!, newValue);
        break;

      case 'bounded':
        // Check both min and max
        this.rawValue = Math.max(
          this.options.min!,
          Math.min(this.options.max!, newValue)
        );
        break;
    }

    // Round to step for the external value
    this.value = Math.round(this.rawValue / this.options.step) * this.options.step;

    // Update angle and visuals (use raw value for smooth rotation)
    this.angle = this.valueToAngle(this.rawValue);
    this.updateVisuals();
  }

  /**
   * Convert value to angle
   */
  private valueToAngle(value: number): number {
    switch (this.options.mode) {
      case 'infinite':
        // For infinite mode, use a simple multiplier
        return value * (270 / 10); // 27 degrees per unit

      case 'min-only':
        // Map from min to arbitrary range
        const minOnlyRange = 270; // Total rotation range
        return ((value - this.options.min!) * minOnlyRange) / 10;

      case 'bounded':
        // Map value to angle range
        const valueRange = this.options.max! - this.options.min!;
        const angleRange = this.options.endAngle - this.options.startAngle;
        const normalizedValue = (value - this.options.min!) / valueRange;
        return this.options.startAngle + normalizedValue * angleRange;
    }
  }

  /**
   * Update visual elements
   */
  private updateVisuals(): void {
    // Update dial rotation
    if (this.dialGroup) {
      this.dialGroup.style.transform = `rotate(${this.angle}deg)`;
    }

    // Update glow brightness based on value
    if (this.glowGroup && this.options.glow) {
      let brightness: number;

      if (this.options.mode === 'bounded') {
        brightness = (this.value - this.options.min!) / (this.options.max! - this.options.min!);
      } else if (this.options.mode === 'min-only') {
        // Normalize to a reasonable range
        brightness = Math.min(1, (this.value - this.options.min!) / 10);
      } else {
        // For infinite, use absolute value with wrapping
        brightness = Math.abs(Math.sin(this.value * 0.1));
      }

      // Apply brightness to glow
      const opacity = this.powered ? 0.3 + brightness * 0.7 : 0;
      this.glowGroup.style.opacity = String(opacity);
    }

    // Update power indicator
    if (this.powerIndicator) {
      const led = this.powerIndicator.querySelector('.power-led');
      if (led) {
        (led as SVGElement).style.fill = this.powered ? '#00ff00' : '#333333';
        (led as SVGElement).style.filter = this.powered ? 'url(#glow-filter)' : 'none';
      }
    }
  }

  /**
   * Emit change event
   */
  private emitChange(previousValue: number): void {
    const event: KnobChangeEvent = {
      value: this.value,
      previousValue,
      angle: this.angle,
      powered: this.powered,
      knob: this,
    };

    this.changeCallbacks.forEach((callback) => callback(event));
  }

  /**
   * Emit toggle event
   */
  private emitToggle(): void {
    const event: KnobToggleEvent = {
      powered: this.powered,
      value: this.value,
      knob: this,
    };

    this.toggleCallbacks.forEach((callback) => callback(event));
  }

  // Public API

  getValue(): number {
    return this.value;
  }

  setValue(value: number): void {
    const previousValue = this.value;
    this.updateValue(value);
    if (this.value !== previousValue) {
      this.emitChange(previousValue);
    }
  }

  isPowered(): boolean {
    return this.powered;
  }

  setPowered(powered: boolean): void {
    if (this.powered !== powered) {
      this.powered = powered;
      this.updateVisuals();
      this.emitToggle();
    }
  }

  toggle(): void {
    this.setPowered(!this.powered);
  }

  destroy(): void {
    // Remove all event listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('touchmove', this.boundTouchMove);
    document.removeEventListener('touchend', this.boundTouchEnd);
    document.removeEventListener('touchcancel', this.boundTouchEnd);

    // Clear callbacks
    this.changeCallbacks.clear();
    this.toggleCallbacks.clear();

    // Remove from DOM
    this.container.innerHTML = '';
  }

  getElement(): HTMLElement {
    return this.container;
  }

  onChange(callback: (event: KnobChangeEvent) => void): void {
    this.changeCallbacks.add(callback);
  }

  onToggle(callback: (event: KnobToggleEvent) => void): void {
    this.toggleCallbacks.add(callback);
  }

  off(event: 'change' | 'toggle', callback: Function): void {
    if (event === 'change') {
      this.changeCallbacks.delete(callback as (event: KnobChangeEvent) => void);
    } else if (event === 'toggle') {
      this.toggleCallbacks.delete(callback as (event: KnobToggleEvent) => void);
    }
  }
}
