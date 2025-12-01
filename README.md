# Knobs

Rotatable knob controls for audio/music web applications — like guitar amps and vintage stereos.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Multiple Modes**: Bounded (min/max), infinite rotation, or minimum-only
- **Spinal Tap Mode**: Goes to 11!
- **Toggleable Power**: Click to turn on/off with glow effects
- **Fully Customizable**: Colors, sizes, tick marks, labels, and more
- **Touch Support**: Works on mobile devices
- **Modifier Keys**: Hold Shift for fast movement, Ctrl for fine adjustment
- **TypeScript**: Full type definitions included
- **Zero Dependencies**: Pure SVG rendering, no external libraries

## Installation

```bash
npm install knobs
```

## Quick Start

```html
<div id="volume-knob"></div>

<script type="module">
  import { Knob } from 'knobs';

  const knob = new Knob('#volume-knob', {
    mode: 'bounded',
    min: 0,
    max: 10,
    value: 5,
    label: 'Volume'
  });

  knob.onChange((e) => {
    console.log('Volume:', e.value);
  });
</script>
```

## Usage

### ES Modules

```javascript
import { Knob, createVolumeKnob, createSpinalTapKnob } from 'knobs';
```

### Browser (IIFE)

```html
<script src="dist/knobs.js"></script>
<script>
  const { Knob } = Knobs;
</script>
```

---

## Examples

### Basic: Simple Volume Knob

A standard 0-10 volume control like you'd find on any audio device.

```javascript
import { Knob } from 'knobs';

const volume = new Knob('#volume', {
  mode: 'bounded',
  min: 0,
  max: 10,
  value: 5,
  step: 0.1,
  label: 'Volume'
});

volume.onChange((e) => {
  audioContext.gainNode.gain.value = e.value / 10;
});
```

### Basic: Using Factory Functions

Factory functions provide pre-configured knobs for common use cases.

```javascript
import { createVolumeKnob, createPanKnob, createFrequencyKnob } from 'knobs';

// Standard 0-10 volume knob
const volume = createVolumeKnob('#volume', { label: 'Master' });

// Pan knob: -100 (L) to +100 (R), centered at 0
const pan = createPanKnob('#pan');

// Frequency knob: labeled 20Hz to 20kHz
const freq = createFrequencyKnob('#eq', { label: 'EQ' });
```

---

### Intermediate: Guitar Amp with Custom Styling

Build a vintage-looking guitar amp control panel.

```javascript
import { createSpinalTapKnob } from 'knobs';

const ampStyle = {
  size: 70,
  backgroundColor: '#1a1a1a',
  dialColor: '#0a0a0a',
  indicatorColor: '#f0f0f0',
  tickColor: '#666',
  labelColor: '#999'
};

const gain = createSpinalTapKnob('#gain', { ...ampStyle, label: 'Gain', value: 5 });
const bass = createSpinalTapKnob('#bass', { ...ampStyle, label: 'Bass', value: 5 });
const mid = createSpinalTapKnob('#mid', { ...ampStyle, label: 'Mid', value: 5 });
const treble = createSpinalTapKnob('#treble', { ...ampStyle, label: 'Treble', value: 5 });
const master = createSpinalTapKnob('#master', { ...ampStyle, label: 'Volume', value: 5 });

// These go to 11!
console.log(master.getValue()); // 5
```

---

### Intermediate: Power Knobs with Glow

Create toggleable effect pedals with visual feedback.

```javascript
import { createPowerKnob } from 'knobs';

const drive = createPowerKnob('#drive', {
  label: 'Drive',
  powered: false,        // Start in off state
  value: 7,
  glowColor: '#ff3300'   // Red glow when active
});

const chorus = createPowerKnob('#chorus', {
  label: 'Chorus',
  powered: true,
  value: 4,
  glowColor: '#00ff66'   // Green glow when active
});

// Handle value changes
drive.onChange((e) => {
  if (e.powered) {
    setDriveAmount(e.value);
  }
});

// Handle toggle events
drive.onToggle((e) => {
  console.log('Drive is now:', e.powered ? 'ON' : 'OFF');
  toggleDriveEffect(e.powered);
});

// Programmatic control
drive.toggle();              // Toggle power state
drive.setPowered(true);      // Turn on
console.log(drive.isPowered()); // true
```

---

### Intermediate: Infinite Rotation Encoder

For values that can increase or decrease without limit, like a jog wheel or scrolling encoder.

```javascript
import { createInfiniteKnob } from 'knobs';

const encoder = createInfiniteKnob('#encoder', {
  label: 'Scroll',
  size: 80,
  dialColor: '#2a4a6a',
  indicatorColor: '#4ecdc4'
});

let position = 0;

encoder.onChange((e) => {
  // Value continuously increases or decreases
  position += e.value - e.previousValue;
  scrollToPosition(position);
});
```

---

### Advanced: Mixer Channel Strip

Build a complete mixing console channel with multiple knobs working together.

```javascript
import { Knob, createPanKnob, createFrequencyKnob } from 'knobs';

function createChannelStrip(channelId) {
  const container = `#channel-${channelId}`;
  const mixerStyle = { size: 50 };

  // Pan control: -100 to +100
  const pan = createPanKnob(`${container}-pan`, {
    ...mixerStyle,
    label: 'Pan'
  });

  // EQ frequency
  const eq = createFrequencyKnob(`${container}-eq`, {
    ...mixerStyle,
    label: 'EQ'
  });

  // Gain with positive/negative range
  const gain = new Knob(`${container}-gain`, {
    ...mixerStyle,
    mode: 'bounded',
    min: -20,
    max: 20,
    value: 0,
    step: 0.5,
    label: 'Gain',
    tickCount: 5,
    valueLabels: ['-20', '-10', '0', '+10', '+20']
  });

  // Return channel interface
  return {
    pan,
    eq,
    gain,
    getValues() {
      return {
        pan: pan.getValue(),
        eq: eq.getValue(),
        gain: gain.getValue()
      };
    },
    destroy() {
      pan.destroy();
      eq.destroy();
      gain.destroy();
    }
  };
}

// Create an 8-channel mixer
const channels = Array.from({ length: 8 }, (_, i) => createChannelStrip(i + 1));

// Listen to all channel changes
channels.forEach((channel, i) => {
  channel.pan.onChange(() => updateMix(i, channel.getValues()));
  channel.eq.onChange(() => updateMix(i, channel.getValues()));
  channel.gain.onChange(() => updateMix(i, channel.getValues()));
});
```

---

### Advanced: Global Configuration

Configure sensitivity settings for all knobs at once.

```javascript
import { configureKnobs, Knob } from 'knobs';

// Set global defaults before creating knobs
configureKnobs({
  pixelsPerFullRotation: 300,  // Pixels of drag to go from min to max
  shiftMultiplier: 5,          // 5x faster when holding Shift
  ctrlMultiplier: 0.2          // 5x slower when holding Ctrl
});

// All knobs will use these settings by default
const knob1 = new Knob('#knob1', { ... });
const knob2 = new Knob('#knob2', { ... });

// Override for a specific knob
const preciseKnob = new Knob('#precise', {
  mode: 'bounded',
  min: 0,
  max: 100,
  pixelsPerFullRotation: 600,  // This knob requires more precision
  ctrlMultiplier: 0.1          // Even finer control with Ctrl
});
```

---

### Advanced: Programmatic Control

Control knobs from code, sync with external data, or build automation.

```javascript
import { Knob } from 'knobs';

const knob = new Knob('#synth-cutoff', {
  mode: 'bounded',
  min: 20,
  max: 20000,
  value: 1000,
  label: 'Cutoff'
});

// Get current value
console.log(knob.getValue()); // 1000

// Set value programmatically (triggers onChange)
knob.setValue(5000);

// Animate a sweep
function sweepFilter(from, to, duration) {
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const value = from + (to - from) * progress;
    knob.setValue(value);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

sweepFilter(20, 20000, 2000); // Sweep from 20Hz to 20kHz over 2 seconds

// Clean up when done
knob.destroy();
```

---

## API Reference

### `Knob` Class

```typescript
new Knob(container: HTMLElement | string, options?: KnobOptions)
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'bounded' \| 'infinite' \| 'min-only'` | `'bounded'` | Rotation behavior |
| `value` | `number` | `0` | Initial value |
| `min` | `number` | `0` | Minimum value (bounded/min-only modes) |
| `max` | `number` | `10` | Maximum value (bounded mode) |
| `step` | `number` | `1` | Value increment |
| `size` | `number` | `80` | Knob size in pixels |
| `startAngle` | `number` | `-135` | Start angle in degrees (bounded mode) |
| `endAngle` | `number` | `135` | End angle in degrees (bounded mode) |
| `toggleable` | `boolean` | `false` | Enable click to toggle power |
| `powered` | `boolean` | `true` | Initial power state |
| `glow` | `boolean` | `false` | Enable center glow effect |
| `glowColor` | `string` | `'#ff6600'` | Glow color (CSS color) |
| `label` | `string` | `''` | Label text below knob |
| `showValueLabels` | `boolean` | `true` | Show value labels around dial |
| `valueLabels` | `string[]` | - | Custom value labels |
| `tickCount` | `number` | `11` | Number of tick marks |
| `backgroundColor` | `string` | `'#2a2a2a'` | Knob body color |
| `dialColor` | `string` | `'#1a1a1a'` | Dial color |
| `indicatorColor` | `string` | `'#ffffff'` | Indicator line color |
| `tickColor` | `string` | `'#888888'` | Tick mark color |
| `labelColor` | `string` | `'#cccccc'` | Label text color |
| `fontFamily` | `string` | `'Arial, sans-serif'` | Font for labels |
| `className` | `string` | - | Custom CSS class |

#### Methods

| Method | Description |
|--------|-------------|
| `getValue(): number` | Get current value |
| `setValue(value: number): void` | Set value programmatically |
| `isPowered(): boolean` | Get power state |
| `setPowered(powered: boolean): void` | Set power state |
| `toggle(): void` | Toggle power state |
| `onChange(callback): void` | Subscribe to value changes |
| `onToggle(callback): void` | Subscribe to power toggle |
| `off(event, callback): void` | Unsubscribe from events |
| `getElement(): HTMLElement` | Get container element |
| `destroy(): void` | Clean up and remove |

#### Events

**`onChange(event)`**
```typescript
{
  value: number;          // New value
  previousValue: number;  // Previous value
  angle: number;          // Rotation angle in degrees
  powered: boolean;       // Power state
  knob: Knob;            // Knob instance
}
```

**`onToggle(event)`**
```typescript
{
  powered: boolean;  // New power state
  value: number;     // Current value
  knob: Knob;       // Knob instance
}
```

### Factory Functions

| Function | Description |
|----------|-------------|
| `createVolumeKnob(container, options?)` | Standard 0-10 volume knob |
| `createSpinalTapKnob(container, options?)` | Goes to 11! |
| `createInfiniteKnob(container, options?)` | No bounds, rotates forever |
| `createMinOnlyKnob(container, options?)` | Has minimum, no maximum |
| `createPowerKnob(container, options?)` | Toggleable with glow |
| `createPanKnob(container, options?)` | -100 to +100, centered |
| `createFrequencyKnob(container, options?)` | 20Hz to 20kHz labels |

### Global Configuration

```typescript
import { configureKnobs } from 'knobs';

configureKnobs({
  pixelsPerFullRotation: 400,  // Default: 400
  shiftMultiplier: 4,          // Default: 4
  ctrlMultiplier: 0.25         // Default: 0.25
});
```

---

## Interaction

- **Drag up/down**: Adjust value
- **Shift + drag**: Fast adjustment (4x default)
- **Ctrl + drag**: Fine adjustment (0.25x default)
- **Click**: Toggle power (if toggleable)
- **Touch**: Full touch support for mobile

## License

MIT
