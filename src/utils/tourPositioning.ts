import { TourPlacement } from '../types/tour';

export interface TooltipCoords {
  top: number;
  left: number;
  actualPlacement: 'top' | 'bottom' | 'left' | 'right';
  arrowOffsetPercent: number; // 0 to 100% along the corresponding edge
}

export interface ViewportDimensions {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

/**
 * Calculates the bounding rectangle of a target element with optional fallback selector.
 */
export function findTourTargetElement(
  selector: string,
  fallbackSelector?: string
): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  try {
    const primary = document.querySelector<HTMLElement>(selector);
    if (primary && isElementVisible(primary)) {
      return primary;
    }

    if (fallbackSelector) {
      const fallback = document.querySelector<HTMLElement>(fallbackSelector);
      if (fallback && isElementVisible(fallback)) {
        return fallback;
      }
    }
  } catch (err) {
    console.warn(`[BlockFlow Tour] Invalid selector query: "${selector}"`, err);
  }

  return null;
}

function isElementVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
}

/**
 * Computes deterministic tooltip coordinates relative to viewport bounds.
 */
export function calculateTooltipCoords(
  targetRect: DOMRect,
  tooltipDimensions: { width: number; height: number },
  preferredPlacement: TourPlacement,
  viewport: ViewportDimensions,
  margin: number = 14
): TooltipCoords {
  const { width: vw, height: vh } = viewport;
  const { width: tw, height: th } = tooltipDimensions;

  // Mobile layout adjustment: if screen width is narrow, center horizontally or dock
  const isMobile = vw < 640;

  if (isMobile) {
    const spaceBelow = vh - targetRect.bottom;
    const spaceAbove = targetRect.top;

    const actualPlacement: 'top' | 'bottom' = spaceBelow >= th + margin || spaceBelow >= spaceAbove ? 'bottom' : 'top';
    const top = actualPlacement === 'bottom'
      ? Math.min(vh - th - margin, targetRect.bottom + margin)
      : Math.max(margin, targetRect.top - th - margin);
    const left = Math.max(margin, Math.min(vw - tw - margin, (vw - tw) / 2));

    return {
      top,
      left,
      actualPlacement,
      arrowOffsetPercent: 50,
    };
  }

  // Desktop Placement Resolution
  const placementsOrder: ('right' | 'bottom' | 'left' | 'top')[] =
    preferredPlacement === 'auto'
      ? ['right', 'bottom', 'left', 'top']
      : preferredPlacement === 'right'
      ? ['right', 'bottom', 'left', 'top']
      : preferredPlacement === 'left'
      ? ['left', 'bottom', 'right', 'top']
      : preferredPlacement === 'top'
      ? ['top', 'bottom', 'right', 'left']
      : ['bottom', 'top', 'right', 'left'];

  for (const placement of placementsOrder) {
    if (placement === 'right' && targetRect.right + margin + tw <= vw - margin) {
      const top = clamp(targetRect.top + targetRect.height / 2 - th / 2, margin, vh - th - margin);
      return { top, left: targetRect.right + margin, actualPlacement: 'right', arrowOffsetPercent: 50 };
    }
    if (placement === 'left' && targetRect.left - margin - tw >= margin) {
      const top = clamp(targetRect.top + targetRect.height / 2 - th / 2, margin, vh - th - margin);
      return { top, left: targetRect.left - margin - tw, actualPlacement: 'left', arrowOffsetPercent: 50 };
    }
    if (placement === 'bottom' && targetRect.bottom + margin + th <= vh - margin) {
      const left = clamp(targetRect.left + targetRect.width / 2 - tw / 2, margin, vw - tw - margin);
      return { top: targetRect.bottom + margin, left, actualPlacement: 'bottom', arrowOffsetPercent: 50 };
    }
    if (placement === 'top' && targetRect.top - margin - th >= margin) {
      const left = clamp(targetRect.left + targetRect.width / 2 - tw / 2, margin, vw - tw - margin);
      return { top: targetRect.top - margin - th, left, actualPlacement: 'top', arrowOffsetPercent: 50 };
    }
  }

  // Fallback: clamp within viewport
  const fallbackTop = clamp(targetRect.bottom + margin, margin, vh - th - margin);
  const fallbackLeft = clamp(targetRect.left, margin, vw - tw - margin);
  return {
    top: fallbackTop,
    left: fallbackLeft,
    actualPlacement: 'bottom',
    arrowOffsetPercent: 50,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
