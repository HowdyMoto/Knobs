/**
 * Global configuration for all knobs
 * These values are used as defaults and can be overridden per-knob
 */
export interface GlobalConfig {
  /** Pixels of mouse movement to traverse the full value range (min to max) */
  pixelsPerFullRotation: number;

  /** Speed multiplier when holding Shift */
  shiftMultiplier: number;

  /** Speed multiplier when holding Ctrl (should be < 1 for slower) */
  ctrlMultiplier: number;
}

/**
 * Global configuration instance
 */
export const globalConfig: GlobalConfig = {
  pixelsPerFullRotation: 400,
  shiftMultiplier: 4,
  ctrlMultiplier: 0.25,
};

/**
 * Configure global settings for all knobs
 */
export function configureKnobs(config: Partial<GlobalConfig>): void {
  Object.assign(globalConfig, config);
}

/**
 * Knob mode determines how rotation boundaries work
 */
export type KnobMode =
  | 'infinite'    // No min/max, rotates forever in either direction
  | 'min-only'    // Has minimum value (usually 0), no maximum
  | 'bounded';    // Has both min and max with configurable rotation range

/**
 * Configuration options for creating a Knob
 */
export interface KnobOptions {
  /** The mode of the knob - determines rotation behavior */
  mode: KnobMode;

  /** Initial value of the knob */
  value?: number;

  /** Minimum value (required for 'min-only' and 'bounded' modes) */
  min?: number;

  /** Maximum value (required for 'bounded' mode) */
  max?: number;

  /** Step increment for value changes */
  step?: number;

  /** Size of the knob in pixels */
  size?: number;

  /** Starting angle in degrees (0 = top, clockwise) for bounded mode */
  startAngle?: number;

  /** Ending angle in degrees for bounded mode */
  endAngle?: number;

  /** Override global pixelsPerFullRotation for this knob */
  pixelsPerFullRotation?: number;

  /** Override global shiftMultiplier for this knob */
  shiftMultiplier?: number;

  /** Override global ctrlMultiplier for this knob */
  ctrlMultiplier?: number;

  /** Label text displayed on the knob */
  label?: string;

  /** Show value labels around the dial */
  showValueLabels?: boolean;

  /** Custom value labels (e.g., ['0', '1', '2', ..., '10', '11']) */
  valueLabels?: string[];

  /** Show tick marks around the dial (default true) */
  showTicks?: boolean;

  /** Number of tick marks around the dial */
  tickCount?: number;

  /** Color of the dial/indicator */
  dialColor?: string;

  /** Color of the bezel (outer ring around the dial) */
  bezelColor?: string;

  /** Color of the indicator line */
  indicatorColor?: string;

  /** Length of the indicator line as a fraction of knob radius (0-1, default 0.7) */
  indicatorLength?: number;

  /** Width of the indicator line in pixels (default 3) */
  indicatorWidth?: number;

  /** Show grip bumps around edge instead of indicator line (encoder style) */
  gripBumps?: boolean;

  /** Number of grip bumps around the edge (default 20) */
  gripBumpCount?: number;

  /** Color of the tick marks */
  tickColor?: string;

  /** Color of the value labels */
  labelColor?: string;

  /** Font family for labels */
  fontFamily?: string;

  /** Show a value display below the knob */
  showValueDisplay?: boolean;

  /** Color of the value display text (defaults to cyan #4ecdc4) */
  valueDisplayColor?: string;

  /** Custom CSS class for the container */
  className?: string;
}

/**
 * Event data emitted when the knob value changes
 */
export interface KnobChangeEvent {
  /** The new value */
  value: number;

  /** The previous value */
  previousValue: number;

  /** Current rotation angle in degrees */
  angle: number;

  /** Reference to the Knob instance */
  knob: IKnob;
}

/**
 * Public interface for Knob instances
 */
export interface IKnob {
  /** Get current value */
  getValue(): number;

  /** Set value programmatically */
  setValue(value: number): void;

  /** Destroy the knob and clean up event listeners */
  destroy(): void;

  /** Get the container element */
  getElement(): HTMLElement;

  /** Add event listener for value changes */
  onChange(callback: (event: KnobChangeEvent) => void): void;

  /** Remove event listener */
  off(event: 'change', callback: Function): void;
}

/**
 * Default configuration values (excludes global config options which come from globalConfig)
 */
export const DEFAULT_OPTIONS = {
  mode: 'bounded' as KnobMode,
  value: 0,
  step: 1,
  size: 80,
  startAngle: -135,  // 7 o'clock position
  endAngle: 135,     // 5 o'clock position
  label: '',
  showValueLabels: true,
  showTicks: true,
  tickCount: 11,
  dialColor: '#1a1a1a',
  bezelColor: '#444444',
  indicatorColor: '#ffffff',
  indicatorLength: 0.7,
  indicatorWidth: 3,
  gripBumps: false,
  gripBumpCount: 20,
  tickColor: '#aaaaaa',
  labelColor: '#dddddd',
  fontFamily: 'Arial, sans-serif',
  showValueDisplay: false,
  valueDisplayColor: '#4ecdc4',
};

/**
 * Configuration options for creating a Slider
 */
export interface SliderOptions {
  /** Initial value of the slider */
  value?: number;

  /** Minimum value */
  min?: number;

  /** Maximum value */
  max?: number;

  /** Step increment for value changes */
  step?: number;

  /** Length (height) of the slider track in pixels */
  length?: number;

  /** Width of the slider in pixels */
  width?: number;

  /** Override global pixelsPerFullRotation for this slider */
  pixelsPerFullTravel?: number;

  /** Override global shiftMultiplier for this slider */
  shiftMultiplier?: number;

  /** Override global ctrlMultiplier for this slider */
  ctrlMultiplier?: number;

  /** Label text displayed below the slider */
  label?: string;

  /** Show tick marks along the track */
  showTicks?: boolean;

  /** Number of tick marks */
  tickCount?: number;

  /** Show value labels along the track */
  showValueLabels?: boolean;

  /** Custom value labels */
  valueLabels?: string[];

  /** Color of the track groove */
  trackColor?: string;

  /** Color of the thumb/fader cap */
  thumbColor?: string;

  /** Color of the tick marks */
  tickColor?: string;

  /** Color of the labels */
  labelColor?: string;

  /** Font family for labels */
  fontFamily?: string;

  /** Show toggle switch below slider */
  showToggle?: boolean;

  /** Initial toggle state */
  toggleState?: boolean;

  /** Label for the toggle (e.g., "Mute") */
  toggleLabel?: string;

  /** Color of the toggle LED when active */
  toggleLedColor?: string;

  /** Show a value display between label and toggle */
  showValueDisplay?: boolean;

  /** Custom CSS class for the container */
  className?: string;
}

/**
 * Event data emitted when the slider value changes
 */
export interface SliderChangeEvent {
  /** The new value */
  value: number;

  /** The previous value */
  previousValue: number;

  /** Reference to the Slider instance */
  slider: ISlider;
}

/**
 * Event data emitted when the toggle state changes
 */
export interface ToggleChangeEvent {
  /** The new toggle state */
  state: boolean;

  /** The previous toggle state */
  previousState: boolean;

  /** Reference to the Slider instance */
  slider: ISlider;
}

/**
 * Public interface for Slider instances
 */
export interface ISlider {
  /** Get current value */
  getValue(): number;

  /** Set value programmatically */
  setValue(value: number): void;

  /** Get current toggle state */
  getToggle(): boolean;

  /** Set toggle state programmatically */
  setToggle(state: boolean): void;

  /** Destroy the slider and clean up event listeners */
  destroy(): void;

  /** Get the container element */
  getElement(): HTMLElement;

  /** Add event listener for value changes */
  onChange(callback: (event: SliderChangeEvent) => void): void;

  /** Add event listener for toggle changes */
  onToggle(callback: (event: ToggleChangeEvent) => void): void;

  /** Remove event listener */
  off(event: 'change' | 'toggle', callback: Function): void;
}

/**
 * Default slider configuration values
 */
export const DEFAULT_SLIDER_OPTIONS = {
  value: 0,
  min: 0,
  max: 10,
  step: 0.1,
  length: 150,
  width: 40,
  label: '',
  showTicks: true,
  tickCount: 11,
  showValueLabels: true,
  trackColor: '#1a1a1a',
  thumbColor: '#444444',
  tickColor: '#aaaaaa',
  labelColor: '#dddddd',
  fontFamily: 'Arial, sans-serif',
  showToggle: false,
  toggleState: false,
  toggleLabel: '',
  toggleLedColor: '#00ff00',
  showValueDisplay: false,
};
