import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
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

  ngOnInit(): void {
    // Check if touch events are supported
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Validate that MatTabGroup is present
    if (!this.tabGroup) {
      console.warn(
        'SwipeNavigationDirective: No MatTabGroup found. ' +
        'Please apply to mat-tab-group.'
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

    this.startGesture(event.touches[0].clientX, event.touches[0].clientY);
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) {
      return;
    }

    // Prevent scroll during swipe
    const deltaX = Math.abs(event.touches[0].clientX - this.startX);
    const deltaY = Math.abs(event.touches[0].clientY - this.startY);

    // Only handle horizontal swipes
    if (deltaX > deltaY && deltaX > 10) {
      event.preventDefault();
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
    this.isDragging = false;
  }

  // Mouse Events (for desktop)
  onMouseDown(event: MouseEvent): void {
    // Only left mouse button
    if (event.button !== 0) {
      return;
    }

    this.startGesture(event.clientX, event.clientY);
    event.preventDefault(); // Prevent text selection
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    const deltaX = Math.abs(event.clientX - this.startX);
    const deltaY = Math.abs(event.clientY - this.startY);

    // Show visual feedback through cursor
    if (deltaX > deltaY && deltaX > 10) {
      this.elementRef.nativeElement.style.cursor = 'grabbing';
    }
  }

  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    this.endGesture(event.clientX, event.clientY);
    this.elementRef.nativeElement.style.cursor = '';
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
