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

  /** Enable toggle on/off functionality on click */
  toggleable?: boolean;

  /** Initial power state if toggleable */
  powered?: boolean;

  /** Enable glow effect from center */
  glow?: boolean;

  /** Glow color (CSS color string) */
  glowColor?: string;

  /** Label text displayed on the knob */
  label?: string;

  /** Show value labels around the dial */
  showValueLabels?: boolean;

  /** Custom value labels (e.g., ['0', '1', '2', ..., '10', '11']) */
  valueLabels?: string[];

  /** Number of tick marks around the dial */
  tickCount?: number;

  /** Background color of the knob body */
  backgroundColor?: string;

  /** Color of the dial/indicator */
  dialColor?: string;

  /** Color of the indicator line/dot */
  indicatorColor?: string;

  /** Color of the tick marks */
  tickColor?: string;

  /** Color of the value labels */
  labelColor?: string;

  /** Font family for labels */
  fontFamily?: string;

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

  /** Whether the knob is powered on (if toggleable) */
  powered: boolean;

  /** Reference to the Knob instance */
  knob: IKnob;
}

/**
 * Event data emitted when toggle state changes
 */
export interface KnobToggleEvent {
  /** Whether the knob is now powered on */
  powered: boolean;

  /** Current value */
  value: number;

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

  /** Get power state */
  isPowered(): boolean;

  /** Set power state */
  setPowered(powered: boolean): void;

  /** Toggle power state */
  toggle(): void;

  /** Destroy the knob and clean up event listeners */
  destroy(): void;

  /** Get the container element */
  getElement(): HTMLElement;

  /** Add event listener for value changes */
  onChange(callback: (event: KnobChangeEvent) => void): void;

  /** Add event listener for toggle changes */
  onToggle(callback: (event: KnobToggleEvent) => void): void;

  /** Remove event listener */
  off(event: 'change' | 'toggle', callback: Function): void;
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
  toggleable: false,
  powered: true,
  glow: false,
  glowColor: '#ff6600',
  label: '',
  showValueLabels: true,
  tickCount: 11,
  backgroundColor: '#2a2a2a',
  dialColor: '#1a1a1a',
  indicatorColor: '#ffffff',
  tickColor: '#888888',
  labelColor: '#cccccc',
  fontFamily: 'Arial, sans-serif',
};
