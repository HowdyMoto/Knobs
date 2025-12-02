/**
 * Knobs - Rotatable knob controls for audio/music web applications
 *
 * Create beautiful, interactive knobs like those found on guitar amps
 * and vintage stereo equipment.
 *
 * @example
 * ```typescript
 * import { Knob } from 'knobs';
 *
 * // Basic bounded knob (0-10 like a guitar amp)
 * const volumeKnob = new Knob('#volume', {
 *   mode: 'bounded',
 *   min: 0,
 *   max: 10,
 *   value: 5,
 *   label: 'Volume',
 * });
 *
 * volumeKnob.onChange((e) => {
 *   console.log('Volume:', e.value);
 * });
 * ```
 */

export { Knob } from './knob';
export { Slider } from './slider';
export {
  KnobOptions,
  KnobMode,
  KnobChangeEvent,
  IKnob,
  DEFAULT_OPTIONS,
  SliderOptions,
  SliderChangeEvent,
  ToggleChangeEvent,
  ISlider,
  DEFAULT_SLIDER_OPTIONS,
  GlobalConfig,
  globalConfig,
  configureKnobs,
} from './types';

// Factory functions for common knob types

import { Knob } from './knob';
import { Slider } from './slider';
import { KnobOptions, SliderOptions } from './types';

/**
 * Create a standard bounded knob (0-10 range, like a guitar amp)
 */
export function createVolumeKnob(
  container: HTMLElement | string,
  options: Partial<KnobOptions> = {}
): Knob {
  return new Knob(container, {
    mode: 'bounded',
    min: 0,
    max: 10,
    step: 0.1,
    label: 'Volume',
    ...options,
  });
}

/**
 * Create a "goes to 11" knob (Spinal Tap style)
 */
export function createSpinalTapKnob(
  container: HTMLElement | string,
  options: Partial<KnobOptions> = {}
): Knob {
  return new Knob(container, {
    mode: 'bounded',
    min: 0,
    max: 11,
    step: 1,
    tickCount: 12,
    valueLabels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    ...options,
  });
}

/**
 * Create an infinite rotation knob (no bounds)
 */
export function createInfiniteKnob(
  container: HTMLElement | string,
  options: Partial<KnobOptions> = {}
): Knob {
  return new Knob(container, {
    mode: 'infinite',
    showValueLabels: false,
    ...options,
  });
}

/**
 * Create a knob with only a minimum value
 */
export function createMinOnlyKnob(
  container: HTMLElement | string,
  options: Partial<KnobOptions> = {}
): Knob {
  return new Knob(container, {
    mode: 'min-only',
    min: 0,
    showValueLabels: false,
    ...options,
  });
}

/**
 * Create a pan knob (-100 to +100, centered at 0)
 */
export function createPanKnob(
  container: HTMLElement | string,
  options: Partial<KnobOptions> = {}
): Knob {
  return new Knob(container, {
    mode: 'bounded',
    min: -100,
    max: 100,
    value: 0,
    step: 1,
    tickCount: 5,
    valueLabels: ['L', '', 'C', '', 'R'],
    label: 'Pan',
    ...options,
  });
}

// Factory functions for sliders

/**
 * Create a standard fader (0-10 range)
 */
export function createFader(
  container: HTMLElement | string,
  options: Partial<SliderOptions> = {}
): Slider {
  return new Slider(container, {
    min: 0,
    max: 10,
    value: 0,
    step: 0.1,
    ...options,
  });
}

/**
 * Create a volume fader with dB-style markings
 */
export function createVolumeFader(
  container: HTMLElement | string,
  options: Partial<SliderOptions> = {}
): Slider {
  return new Slider(container, {
    min: 0,
    max: 10,
    value: 7,
    step: 0.1,
    label: 'Volume',
    tickCount: 11,
    valueLabels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    ...options,
  });
}

/**
 * Create a fader with mute toggle
 */
export function createMuteFader(
  container: HTMLElement | string,
  options: Partial<SliderOptions> = {}
): Slider {
  return new Slider(container, {
    min: 0,
    max: 10,
    value: 7,
    step: 0.1,
    showToggle: true,
    toggleLabel: 'Mute',
    toggleLedColor: '#ff4444',
    ...options,
  });
}
