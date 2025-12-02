import {
  SliderOptions,
  SliderChangeEvent,
  ToggleChangeEvent,
  ISlider,
  DEFAULT_SLIDER_OPTIONS,
  globalConfig,
} from './types';
import { SliderSVGRenderer } from './slider-svg-renderer';

// Counter for generating unique instance IDs
let sliderInstanceCounter = 0;

/**
 * Main Slider class - creates an interactive vertical fader control
 */
export class Slider implements ISlider {
  private instanceId: number;
  private options: typeof DEFAULT_SLIDER_OPTIONS &
    Pick<SliderOptions, 'valueLabels' | 'className'>;

  // Resolved config values
  private shiftMultiplier: number;
  private ctrlMultiplier: number;

  private container: HTMLElement;
  private svg: SVGSVGElement;
  private thumbGroup: SVGGElement | null = null;
  private valueDisplayElement: HTMLDivElement | null = null;
  private toggleElement: HTMLDivElement | null = null;
  private toggleLed: HTMLDivElement | null = null;

  private value: number;
  private rawValue: number = 0;
  private toggleState: boolean = false;

  // Track dimensions from renderer
  private trackLength: number;
  private topY: number;
  private toggleLedColor: string;

  // Interaction state
  private isDragging: boolean = false;
  private lastY: number = 0;

  // Event callbacks
  private changeCallbacks: Set<(event: SliderChangeEvent) => void> = new Set();
  private toggleCallbacks: Set<(event: ToggleChangeEvent) => void> = new Set();

  // Bound event handlers for cleanup
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundContextMenu: (e: MouseEvent) => void;
  private boundToggleClick: (e: Event) => void;

  constructor(container: HTMLElement | string, options: Partial<SliderOptions> = {}) {
    this.instanceId = sliderInstanceCounter++;

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
      ...DEFAULT_SLIDER_OPTIONS,
      ...options,
    };

    // Resolve config values for modifier keys
    this.shiftMultiplier = options.shiftMultiplier ?? globalConfig.shiftMultiplier;
    this.ctrlMultiplier = options.ctrlMultiplier ?? globalConfig.ctrlMultiplier;

    // Initialize value
    this.value = this.options.value;
    this.rawValue = this.options.value;
    this.toggleState = this.options.toggleState;

    // Bind event handlers
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundContextMenu = (e: MouseEvent) => e.preventDefault();
    this.boundToggleClick = this.handleToggleClick.bind(this);

    // Render the slider
    const renderer = new SliderSVGRenderer(this.options, this.instanceId);
    this.trackLength = renderer.getTrackLength();
    this.topY = renderer.getTopY();
    this.toggleLedColor = renderer.getToggleLedColor();

    this.svg = this.render(renderer);
    this.attachEventListeners();

    // Apply initial state
    this.updateVisuals();
  }

  /**
   * Render the slider
   */
  private render(renderer: SliderSVGRenderer): SVGSVGElement {
    const svg = renderer.createSVG();

    // Add custom class if provided
    if (this.options.className) {
      this.container.classList.add(this.options.className);
    }

    // Style the container
    this.container.style.display = 'inline-flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.touchAction = 'none';

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';

    wrapper.appendChild(svg);

    // Add label if provided
    if (this.options.label) {
      const label = document.createElement('div');
      label.textContent = this.options.label;
      label.style.fontFamily = this.options.fontFamily;
      label.style.fontSize = '11px';
      label.style.color = this.options.labelColor;
      label.style.marginTop = '4px';
      label.style.textAlign = 'center';
      wrapper.appendChild(label);
    }

    // Add value display if enabled
    if (this.options.showValueDisplay) {
      this.valueDisplayElement = document.createElement('div');
      this.valueDisplayElement.className = 'slider-value-display';
      this.valueDisplayElement.style.fontFamily = "'Fira Code', monospace";
      this.valueDisplayElement.style.fontSize = '11px';
      this.valueDisplayElement.style.color = '#4ecdc4';
      this.valueDisplayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
      this.valueDisplayElement.style.padding = '3px 8px';
      this.valueDisplayElement.style.borderRadius = '4px';
      this.valueDisplayElement.style.marginTop = '6px';
      this.valueDisplayElement.style.textAlign = 'center';
      this.valueDisplayElement.style.minWidth = '36px';
      this.valueDisplayElement.textContent = this.formatValue(this.value);
      wrapper.appendChild(this.valueDisplayElement);
    }

    // Add toggle if enabled
    if (this.options.showToggle) {
      this.toggleElement = renderer.createToggle(this.options.width);
      this.toggleLed = this.toggleElement.querySelector('.slider-toggle-led') as HTMLDivElement;
      wrapper.appendChild(this.toggleElement);
      this.updateToggleVisuals();
    }

    this.container.appendChild(wrapper);

    // Get reference to thumb
    this.thumbGroup = svg.querySelector('.slider-thumb') as SVGGElement;

    return svg;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Mouse events on SVG (for thumb dragging)
    this.svg.addEventListener('mousedown', this.boundMouseDown);
    this.svg.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.svg.addEventListener('contextmenu', this.boundContextMenu);

    // Toggle click
    if (this.toggleElement) {
      const toggleButton = this.toggleElement.querySelector('.slider-toggle');
      if (toggleButton) {
        toggleButton.addEventListener('click', this.boundToggleClick);
      }
    }
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
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

    // Inverted: moving up increases value
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
   * Handle toggle click
   */
  private handleToggleClick(_e: Event): void {
    const previousState = this.toggleState;
    this.toggleState = !this.toggleState;
    this.updateToggleVisuals();
    this.emitToggle(previousState);
  }

  /**
   * Start dragging
   */
  private startDrag(y: number): void {
    this.isDragging = true;
    this.lastY = y;
    this.svg.style.cursor = 'grabbing';
  }

  /**
   * Process drag movement
   */
  private processDrag(deltaY: number, shiftKey: boolean, ctrlKey: boolean): void {
    // Direct 1:1 mapping: pixels moved = pixels on track
    // Convert pixel movement to value based on track length
    const valueRange = this.options.max - this.options.min;
    let valueDelta = (deltaY / this.trackLength) * valueRange;

    // Modifier keys adjust speed (Shift = faster, Ctrl = slower/precise)
    if (shiftKey) {
      valueDelta *= this.shiftMultiplier;
    }
    if (ctrlKey) {
      valueDelta *= this.ctrlMultiplier;
    }

    // Update value
    const previousValue = this.value;
    this.updateValue(this.rawValue + valueDelta);

    if (this.value !== previousValue) {
      this.emitChange(previousValue);
    }
  }

  /**
   * End dragging
   */
  private endDrag(): void {
    this.isDragging = false;
    this.svg.style.cursor = 'pointer';
  }

  /**
   * Update the value with bounds checking
   */
  private updateValue(newValue: number): void {
    // Clamp to bounds
    this.rawValue = Math.max(this.options.min, Math.min(this.options.max, newValue));

    // Round to step
    this.value = Math.round(this.rawValue / this.options.step) * this.options.step;

    this.updateVisuals();
  }

  /**
   * Update visual elements
   */
  private updateVisuals(): void {
    if (this.thumbGroup) {
      // Calculate thumb position
      const valueRange = this.options.max - this.options.min;
      const normalizedValue = (this.rawValue - this.options.min) / valueRange;

      // Invert: high value = top of track
      const thumbY = this.topY + this.trackLength * (1 - normalizedValue);

      this.thumbGroup.style.transform = `translateY(${thumbY}px)`;
    }

    // Update value display
    if (this.valueDisplayElement) {
      this.valueDisplayElement.textContent = this.formatValue(this.value);
    }
  }

  /**
   * Format value for display
   */
  private formatValue(value: number): string {
    // Show 1 decimal place if step allows for it
    if (this.options.step < 1) {
      return value.toFixed(1);
    }
    return String(Math.round(value));
  }

  /**
   * Update toggle visuals
   */
  private updateToggleVisuals(): void {
    if (this.toggleLed) {
      if (this.toggleState) {
        this.toggleLed.style.backgroundColor = this.toggleLedColor;
        this.toggleLed.style.boxShadow = `0 0 6px ${this.toggleLedColor}, inset 0 1px 2px rgba(255,255,255,0.3)`;
      } else {
        this.toggleLed.style.backgroundColor = '#333';
        this.toggleLed.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.5)';
      }
    }
  }

  /**
   * Emit change event
   */
  private emitChange(previousValue: number): void {
    const event: SliderChangeEvent = {
      value: this.value,
      previousValue,
      slider: this,
    };

    this.changeCallbacks.forEach((callback) => callback(event));
  }

  /**
   * Emit toggle event
   */
  private emitToggle(previousState: boolean): void {
    const event: ToggleChangeEvent = {
      state: this.toggleState,
      previousState,
      slider: this,
    };

    this.toggleCallbacks.forEach((callback) => callback(event));
  }

  // Public API

  getValue(): number {
    return this.value;
  }

  setValue(value: number): void {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      console.warn('Slider.setValue: Invalid value provided, must be a finite number');
      return;
    }

    const previousValue = this.value;
    this.updateValue(value);
    if (this.value !== previousValue) {
      this.emitChange(previousValue);
    }
  }

  getToggle(): boolean {
    return this.toggleState;
  }

  setToggle(state: boolean): void {
    if (this.toggleState === state) return;

    const previousState = this.toggleState;
    this.toggleState = state;
    this.updateToggleVisuals();
    this.emitToggle(previousState);
  }

  destroy(): void {
    // Remove SVG event listeners
    this.svg.removeEventListener('mousedown', this.boundMouseDown);
    this.svg.removeEventListener('touchstart', this.boundTouchStart);
    this.svg.removeEventListener('contextmenu', this.boundContextMenu);

    // Remove toggle listener
    if (this.toggleElement) {
      const toggleButton = this.toggleElement.querySelector('.slider-toggle');
      if (toggleButton) {
        toggleButton.removeEventListener('click', this.boundToggleClick);
      }
    }

    // Remove document event listeners
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

  onChange(callback: (event: SliderChangeEvent) => void): void {
    this.changeCallbacks.add(callback);
  }

  onToggle(callback: (event: ToggleChangeEvent) => void): void {
    this.toggleCallbacks.add(callback);
  }

  off(event: 'change' | 'toggle', callback: Function): void {
    if (event === 'change') {
      this.changeCallbacks.delete(callback as (event: SliderChangeEvent) => void);
    } else if (event === 'toggle') {
      this.toggleCallbacks.delete(callback as (event: ToggleChangeEvent) => void);
    }
  }
}
