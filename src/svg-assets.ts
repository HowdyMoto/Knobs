/**
 * SVG Assets for Knobs and Sliders
 *
 * This module contains embedded SVG strings for the rotating/sliding components.
 * Users can add their own SVG files to src/assets/ and register them here.
 */

/**
 * Default knob dial SVG
 * - viewBox: 0 0 1024 1024 (square, centered at 512,512)
 * - Indicator points UP at 0 degrees
 */
const DEFAULT_KNOB_SVG = `<svg id="Bounded" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <style>
      .cls-1 {
        fill: #231f20;
      }

      .cls-2 {
        fill: #fff;
      }

      .cls-3 {
        fill: #939598;
      }
    </style>
  </defs>
  <g id="Circle">
    <path class="cls-1" d="M512,852c-90.82,0-176.2-35.37-240.42-99.58-64.22-64.22-99.58-149.6-99.58-240.42s35.37-176.2,99.58-240.42c64.22-64.22,149.6-99.58,240.42-99.58s176.2,35.37,240.42,99.58c64.22,64.22,99.58,149.6,99.58,240.42s-35.37,176.2-99.58,240.42c-64.22,64.22-149.6,99.58-240.42,99.58Z"/>
    <path class="cls-3" d="M512,212c40.53,0,79.82,7.92,116.75,23.54,35.71,15.11,67.81,36.75,95.38,64.33,27.58,27.58,49.22,59.67,64.33,95.38,15.62,36.93,23.54,76.21,23.54,116.75s-7.92,79.82-23.54,116.75c-15.11,35.71-36.75,67.81-64.33,95.38-27.58,27.58-59.67,49.22-95.38,64.33-36.93,15.62-76.21,23.54-116.75,23.54s-79.82-7.92-116.75-23.54c-35.71-15.11-67.81-36.75-95.38-64.33-27.58-27.58-49.22-59.67-64.33-95.38-15.62-36.93-23.54-76.21-23.54-116.75s7.92-79.82,23.54-116.75c15.11-35.71,36.75-67.81,64.33-95.38,27.58-27.58,59.67-49.22,95.38-64.33,36.93-15.62,76.21-23.54,116.75-23.54M512,132c-209.87,0-380,170.13-380,380s170.13,380,380,380,380-170.13,380-380-170.13-380-380-380h0Z"/>
  </g>
  <path id="Indicator" class="cls-2" d="M560,266.31h-96V94.31l48-48.62,48,48.62v172Z"/>
</svg>`;

/**
 * Default slider thumb SVG
 * - viewBox: 0 0 30 40 (vertical fader cap)
 * - Center indicator at y=20
 * - Uses CSS variables for colors
 */
const DEFAULT_SLIDER_THUMB_SVG = `<svg viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="thumbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="var(--slider-thumb-highlight, #666)"/>
      <stop offset="100%" stop-color="var(--slider-thumb-color, #444)"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="30" height="40" rx="3" ry="3" fill="url(#thumbGradient)"/>
  <line x1="4" y1="8" x2="26" y2="8" stroke="var(--slider-thumb-shadow, #333)" stroke-width="1"/>
  <line x1="4" y1="9.5" x2="26" y2="9.5" stroke="var(--slider-thumb-highlight, #666)" stroke-width="0.5"/>
  <line x1="4" y1="14" x2="26" y2="14" stroke="var(--slider-thumb-shadow, #333)" stroke-width="1"/>
  <line x1="4" y1="15.5" x2="26" y2="15.5" stroke="var(--slider-thumb-highlight, #666)" stroke-width="0.5"/>
  <line x1="4" y1="26" x2="26" y2="26" stroke="var(--slider-thumb-shadow, #333)" stroke-width="1"/>
  <line x1="4" y1="27.5" x2="26" y2="27.5" stroke="var(--slider-thumb-highlight, #666)" stroke-width="0.5"/>
  <line x1="4" y1="32" x2="26" y2="32" stroke="var(--slider-thumb-shadow, #333)" stroke-width="1"/>
  <line x1="4" y1="33.5" x2="26" y2="33.5" stroke="var(--slider-thumb-highlight, #666)" stroke-width="0.5"/>
  <rect x="0" y="19" width="30" height="2" fill="var(--slider-indicator-color, #fff)" opacity="0.8"/>
</svg>`;

/**
 * Registry of knob SVG styles
 * Add your custom SVGs here with a unique name
 */
export const KNOB_SVGS: Record<string, string> = {
  default: DEFAULT_KNOB_SVG,
};

/**
 * Registry of slider thumb SVG styles
 * Add your custom SVGs here with a unique name
 */
export const SLIDER_THUMB_SVGS: Record<string, string> = {
  default: DEFAULT_SLIDER_THUMB_SVG,
};

/**
 * Get the SVG string for a knob style
 * @param style - The style name (e.g., 'default') or undefined
 * @param customSvg - Optional custom SVG string that overrides style
 * @returns The SVG string
 */
export function getKnobSvg(style?: string, customSvg?: string): string {
  if (customSvg) {
    return customSvg;
  }
  const styleName = style || 'default';
  return KNOB_SVGS[styleName] || KNOB_SVGS.default;
}

/**
 * Get the SVG string for a slider thumb style
 * @param style - The style name (e.g., 'default') or undefined
 * @param customSvg - Optional custom SVG string that overrides style
 * @returns The SVG string
 */
export function getSliderThumbSvg(style?: string, customSvg?: string): string {
  if (customSvg) {
    return customSvg;
  }
  const styleName = style || 'default';
  return SLIDER_THUMB_SVGS[styleName] || SLIDER_THUMB_SVGS.default;
}

/**
 * Parse an SVG string and return the inner content as an SVG group element.
 * Handles viewBox extraction and scaling.
 *
 * @param svgString - The SVG markup string
 * @param instanceId - Unique ID to namespace gradient/filter IDs
 * @returns An SVG group element containing the parsed SVG content
 */
export function parseSvgString(svgString: string, instanceId: number): SVGGElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) {
    throw new Error('Invalid SVG string: no <svg> element found');
  }

  // Create a group to hold the content
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  // Make gradient/filter IDs unique to avoid conflicts between instances
  const defs = svgElement.querySelector('defs');
  if (defs) {
    // Clone defs and update IDs
    const defsClone = defs.cloneNode(true) as SVGDefsElement;
    const elementsWithId = defsClone.querySelectorAll('[id]');
    const idMap = new Map<string, string>();

    elementsWithId.forEach((el) => {
      const oldId = el.getAttribute('id')!;
      const newId = `${oldId}-${instanceId}`;
      el.setAttribute('id', newId);
      idMap.set(oldId, newId);
    });

    // Update references in the SVG content
    const svgContent = svgElement.innerHTML;
    let updatedContent = svgContent;
    idMap.forEach((newId, oldId) => {
      // Replace url(#oldId) with url(#newId)
      updatedContent = updatedContent.replace(
        new RegExp(`url\\(#${oldId}\\)`, 'g'),
        `url(#${newId})`
      );
    });

    // Re-parse with updated IDs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${updatedContent}</svg>`;
    const tempSvg = tempDiv.querySelector('svg')!;

    // Add all children to the group
    while (tempSvg.firstChild) {
      group.appendChild(tempSvg.firstChild);
    }
  } else {
    // No defs, just copy children directly
    while (svgElement.firstChild) {
      group.appendChild(svgElement.firstChild);
    }
  }

  // Store viewBox info for scaling
  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    group.setAttribute('data-viewbox', viewBox);
  }

  return group;
}

/**
 * Get the viewBox dimensions from an SVG group that was created by parseSvgString
 */
export function getViewBoxDimensions(group: SVGGElement): { width: number; height: number } {
  const viewBox = group.getAttribute('data-viewbox');
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map(Number);
    if (parts.length === 4) {
      return { width: parts[2], height: parts[3] };
    }
  }
  // Default to 100x100
  return { width: 100, height: 100 };
}

/**
 * Helper to lighten a hex color
 */
export function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Helper to darken a hex color
 */
export function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}
