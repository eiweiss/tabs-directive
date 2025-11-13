import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  inject
} from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';

/**
 * Directive for swipe and drag navigation on Angular Material Tabs
 *
 * Usage:
 * <mat-tab-group appSwipeNavigation>...</mat-tab-group>
 *
 * The directive uses only the public Angular Material API and
 * does not interfere with internal calculations.
 *
 * Swipe functionality is restricted to the tab header area only.
 */
@Directive({
  selector: '[appSwipeNavigation]',
  standalone: true,
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchmove)': 'onTouchMove($event)',
    '(touchend)': 'onTouchEnd($event)',
    '(touchcancel)': 'onTouchCancel($event)',
    '(mousedown)': 'onMouseDown($event)',
    '(document:mousemove)': 'onMouseMove($event)',
    '(document:mouseup)': 'onMouseUp($event)'
  }
})
export class SwipeNavigationDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private tabGroup = inject(MatTabGroup, { optional: true });

  // Configurable thresholds
  @Input() swipeThreshold = 50; // Minimum distance in pixels for swipe
  @Input() swipeVelocityThreshold = 0.3; // Minimum velocity for swipe

  // Tracking for Touch/Mouse events
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isDragging = false;
  private isTouchDevice = false;
  private tabHeaderElement: HTMLElement | null = null;

  ngOnInit(): void {
    // Check if touch events are supported
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Validate that MatTabGroup is present
    if (!this.tabGroup) {
      console.warn(
        'SwipeNavigationDirective: No MatTabGroup found. ' +
        'Please apply to mat-tab-group.'
      );
      return;
    }

    // Find the tab header element
    this.tabHeaderElement = this.elementRef.nativeElement.querySelector('.mat-mdc-tab-header');

    if (!this.tabHeaderElement) {
      console.warn(
        'SwipeNavigationDirective: Tab header element not found. ' +
        'Swipe functionality may not work correctly.'
      );
    }
  }

  ngOnDestroy(): void {
    // Cleanup if necessary
    this.isDragging = false;
  }

  // Touch Events
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) {
      return; // Only support single-touch
    }

    // Check if touch started in tab header area
    if (!this.isEventInTabHeader(event.target as HTMLElement)) {
      return;
    }

    this.startGesture(event.touches[0].clientX, event.touches[0].clientY);
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) {
      return;
    }

    const deltaX = event.touches[0].clientX - this.startX;
    const deltaY = Math.abs(event.touches[0].clientY - this.startY);
    const absDeltaX = Math.abs(deltaX);

    // Only handle horizontal swipes
    if (absDeltaX > deltaY && absDeltaX > 10) {
      event.preventDefault();

      // Visual feedback: adjust opacity based on swipe distance
      this.updateVisualFeedback(deltaX);
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) {
      return;
    }

    if (event.changedTouches.length > 0) {
      this.endGesture(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }
  }

  onTouchCancel(event: TouchEvent): void {
    this.resetVisualFeedback();
    this.isDragging = false;
  }

  // Mouse Events (for desktop)
  onMouseDown(event: MouseEvent): void {
    // Only left mouse button
    if (event.button !== 0) {
      return;
    }

    // Check if mouse down in tab header area
    if (!this.isEventInTabHeader(event.target as HTMLElement)) {
      return;
    }

    this.startGesture(event.clientX, event.clientY);
    event.preventDefault(); // Prevent text selection
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    const deltaX = event.clientX - this.startX;
    const deltaY = Math.abs(event.clientY - this.startY);
    const absDeltaX = Math.abs(deltaX);

    // Show visual feedback through cursor and opacity
    if (absDeltaX > deltaY && absDeltaX > 10) {
      if (this.tabHeaderElement) {
        this.renderer.setStyle(this.tabHeaderElement, 'cursor', 'grabbing');
      }

      // Visual feedback: adjust opacity based on drag distance
      this.updateVisualFeedback(deltaX);
    }
  }

  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    this.endGesture(event.clientX, event.clientY);

    // Reset cursor
    if (this.tabHeaderElement) {
      this.renderer.removeStyle(this.tabHeaderElement, 'cursor');
    }
  }

  // Common logic for touch and mouse
  private startGesture(x: number, y: number): void {
    this.startX = x;
    this.startY = y;
    this.startTime = Date.now();
    this.isDragging = true;
  }

  private endGesture(endX: number, endY: number): void {
    if (!this.isDragging) {
      return;
    }

    // Reset visual feedback
    this.resetVisualFeedback();

    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const deltaTime = Date.now() - this.startTime;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check if movement was primarily horizontal
    if (absDeltaX < absDeltaY) {
      this.isDragging = false;
      return; // Vertical movement, ignore
    }

    // Calculate velocity (pixels per millisecond)
    const velocity = absDeltaX / (deltaTime || 1);

    // Check if thresholds were met
    const isSwipe = absDeltaX > this.swipeThreshold || velocity > this.swipeVelocityThreshold;

    if (isSwipe) {
      if (deltaX > 0) {
        // Swipe right -> Previous
        this.navigatePrevious();
      } else {
        // Swipe left -> Next
        this.navigateNext();
      }
    }

    this.isDragging = false;
  }

  /**
   * Check if event occurred within the tab header area
   */
  private isEventInTabHeader(target: HTMLElement): boolean {
    if (!this.tabHeaderElement) {
      return false;
    }

    // Check if target is the header itself or a child of the header
    return this.tabHeaderElement === target || this.tabHeaderElement.contains(target);
  }

  /**
   * Update visual feedback during swipe/drag
   */
  private updateVisualFeedback(deltaX: number): void {
    if (!this.tabHeaderElement || !this.tabGroup) {
      return;
    }

    const currentIndex = this.tabGroup.selectedIndex || 0;
    const maxIndex = (this.tabGroup._tabs?.length || 1) - 1;

    // Calculate opacity based on swipe distance (more subtle feedback)
    const maxDistance = 100;
    const normalizedDistance = Math.min(Math.abs(deltaX) / maxDistance, 1);

    // Determine direction and check boundaries
    const canSwipeLeft = deltaX < 0 && currentIndex < maxIndex;
    const canSwipeRight = deltaX > 0 && currentIndex > 0;

    if (canSwipeLeft || canSwipeRight) {
      // Subtle opacity change: 1.0 to 0.85
      const opacity = 1 - (normalizedDistance * 0.15);
      this.renderer.setStyle(this.tabHeaderElement, 'opacity', opacity.toString());
      this.renderer.setStyle(this.tabHeaderElement, 'transition', 'none');
    }
  }

  /**
   * Reset visual feedback
   */
  private resetVisualFeedback(): void {
    if (!this.tabHeaderElement) {
      return;
    }

    this.renderer.setStyle(this.tabHeaderElement, 'transition', 'opacity 0.2s ease');
    this.renderer.setStyle(this.tabHeaderElement, 'opacity', '1');

    // Remove transition after animation completes
    setTimeout(() => {
      if (this.tabHeaderElement) {
        this.renderer.removeStyle(this.tabHeaderElement, 'transition');
      }
    }, 200);
  }

  private navigateNext(): void {
    if (!this.tabGroup) {
      return;
    }

    // Use the public API of MatTabGroup
    const currentIndex = this.tabGroup.selectedIndex || 0;
    const maxIndex = (this.tabGroup._tabs?.length || 1) - 1;

    if (currentIndex < maxIndex) {
      this.tabGroup.selectedIndex = currentIndex + 1;
    }
  }

  private navigatePrevious(): void {
    if (!this.tabGroup) {
      return;
    }

    // Use the public API of MatTabGroup
    const currentIndex = this.tabGroup.selectedIndex || 0;

    if (currentIndex > 0) {
      this.tabGroup.selectedIndex = currentIndex - 1;
    }
  }
}
