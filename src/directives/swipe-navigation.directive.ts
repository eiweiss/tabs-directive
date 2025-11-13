/**
 * @license
 * Copyright (c) 2025 CWOIDA
 *
 * This file is part of CNGX (Composable Angular Extension).
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  AfterViewInit,
  Renderer2,
  inject
} from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import {
  fromEvent,
  merge,
  Subject,
  Observable
} from 'rxjs';
import {
  switchMap,
  takeUntil,
  filter,
  map,
  tap,
  finalize
} from 'rxjs/operators';

// Gesture data interfaces
interface GestureStart {
  x: number;
  y: number;
  time: number;
}

interface GestureMove {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
}

interface GestureEnd {
  deltaX: number;
  deltaY: number;
  deltaTime: number;
  velocity: number;
}

/**
 * Directive for swipe and drag navigation on Angular Material Tab Headers
 *
 * Usage:
 * <mat-tab-group appSwipeNavigation>...</mat-tab-group>
 *
 * This directive allows scrolling through the tab header list via swipe/drag gestures.
 * When there are many tabs and pagination arrows appear, you can swipe to scroll
 * through the headers instead of clicking the arrows multiple times.
 *
 * This directive uses reactive programming with RxJS for event handling.
 * It scrolls the tab header container, NOT changing the selected tab.
 */
@Directive({
  selector: '[appSwipeNavigation]',
  standalone: true
})
export class SwipeNavigationDirective implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private tabGroup = inject(MatTabGroup, { optional: true });

  // Configurable thresholds
  @Input() swipeThreshold = 50; // Minimum distance in pixels for swipe
  @Input() swipeVelocityThreshold = 0.3; // Minimum velocity for swipe

  // Reactive state management
  private destroy$ = new Subject<void>();
  private tabHeaderElement: HTMLElement | null = null;
  private scrollableContainer: HTMLElement | null = null;
  private lastDeltaX = 0;
  private paginationBefore: HTMLElement | null = null;
  private paginationAfter: HTMLElement | null = null;
  private lastClickThreshold = 0; // Track when we last clicked
  private clickInterval = 100; // Click pagination button every 100px of drag

  ngAfterViewInit(): void {
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
      return;
    }

    // Find the scrollable tab list container
    // Try different possible selectors for Angular Material's scrollable element
    let possibleSelectors = [
      '.mat-mdc-tab-list',
      '.mat-mdc-tab-labels',
      '.mat-mdc-tab-label-container'
    ];

    for (const selector of possibleSelectors) {
      const element = this.tabHeaderElement.querySelector(selector) as HTMLElement;
      if (element) {
        // Use the first found element - don't check if scrollable yet
        // Angular Material may calculate sizes after view init
        this.scrollableContainer = element;
        break;
      }
    }

    if (!this.scrollableContainer) {
      console.warn(
        'SwipeNavigationDirective: Scrollable tab list not found. ' +
        'Swipe functionality may not work correctly.'
      );
      return;
    }

    // Find pagination buttons
    this.paginationBefore = this.tabHeaderElement.querySelector('.mat-mdc-tab-header-pagination-before') as HTMLElement;
    this.paginationAfter = this.tabHeaderElement.querySelector('.mat-mdc-tab-header-pagination-after') as HTMLElement;

    // Set cursor to grab to indicate draggability
    this.renderer.setStyle(this.tabHeaderElement, 'cursor', 'grab');
    this.renderer.setStyle(this.tabHeaderElement, 'user-select', 'none');

    // Setup reactive event streams
    this.setupTouchGestures();
    this.setupMouseGestures();
  }

  ngOnDestroy(): void {
    // Automatically unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup touch gesture streams with RxJS
   */
  private setupTouchGestures(): void {
    if (!this.tabHeaderElement) {
      console.warn('Cannot setup touch gestures: tabHeaderElement is null');
      return;
    }

    const touchStart$ = fromEvent<TouchEvent>(this.tabHeaderElement, 'touchstart', { passive: false }).pipe(
      filter(e => e.touches.length === 1),
      filter(e => this.isEventInTabHeader(e.target as HTMLElement)),
      map(e => ({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      } as GestureStart))
    );

    const touchMove$ = fromEvent<TouchEvent>(document, 'touchmove');
    const touchEnd$ = fromEvent<TouchEvent>(document, 'touchend');
    const touchCancel$ = fromEvent<TouchEvent>(document, 'touchcancel');

    // Create gesture stream
    touchStart$.pipe(
      switchMap(start => touchMove$.pipe(
        tap(moveEvent => {
          // Prevent default scroll behavior for horizontal swipes
          const deltaX = Math.abs(moveEvent.touches[0].clientX - start.x);
          const deltaY = Math.abs(moveEvent.touches[0].clientY - start.y);
          if (deltaX > deltaY && deltaX > 10) {
            moveEvent.preventDefault();
          }
        }),
        map(moveEvent => ({
          x: moveEvent.touches[0].clientX,
          y: moveEvent.touches[0].clientY,
          deltaX: moveEvent.touches[0].clientX - start.x,
          deltaY: moveEvent.touches[0].clientY - start.y
        } as GestureMove)),
        filter(move => {
          const absDeltaX = Math.abs(move.deltaX);
          const absDeltaY = Math.abs(move.deltaY);
          return absDeltaX > absDeltaY && absDeltaX > 10;
        }),
        tap(move => {
          // Scroll the tab header container
          this.scrollTabHeaders(move.deltaX);
        }),
        takeUntil(
          merge(touchEnd$, touchCancel$).pipe(
            map(endEvent => {
              const touch = (endEvent as TouchEvent).changedTouches?.[0];
              if (!touch) return null;

              const deltaTime = Date.now() - start.time;
              const deltaX = touch.clientX - start.x;
              const deltaY = touch.clientY - start.y;
              const absDeltaX = Math.abs(deltaX);
              const velocity = absDeltaX / (deltaTime || 1);

              return {
                deltaX,
                deltaY,
                deltaTime,
                velocity
              } as GestureEnd;
            }),
            tap(end => {
              this.resetScroll();
              if (end) {
                this.handleGestureEnd(end);
              }
            })
          )
        )
      )),
      takeUntil(this.destroy$)
    ).subscribe(() => {}, error => console.error('Touch gesture error:', error));
  }

  /**
   * Setup mouse gesture streams with RxJS
   */
  private setupMouseGestures(): void {
    if (!this.tabHeaderElement) {
      console.warn('Cannot setup mouse gestures: tabHeaderElement is null');
      return;
    }

    const mouseDown$ = fromEvent<MouseEvent>(this.tabHeaderElement, 'mousedown').pipe(
      filter(e => e.button === 0),
      filter(e => this.isEventInTabHeader(e.target as HTMLElement)),
      tap(e => e.preventDefault()),
      map(e => ({
        x: e.clientX,
        y: e.clientY,
        time: Date.now()
      } as GestureStart))
    );

    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');

    // Create gesture stream
    mouseDown$.pipe(
      switchMap(start => mouseMove$.pipe(
        map(moveEvent => ({
          x: moveEvent.clientX,
          y: moveEvent.clientY,
          deltaX: moveEvent.clientX - start.x,
          deltaY: moveEvent.clientY - start.y
        } as GestureMove)),
        filter(move => {
          const absDeltaX = Math.abs(move.deltaX);
          const absDeltaY = Math.abs(move.deltaY);
          return absDeltaX > absDeltaY && absDeltaX > 10;
        }),
        tap(move => {
          // Update cursor
          if (this.tabHeaderElement) {
            this.renderer.setStyle(this.tabHeaderElement, 'cursor', 'grabbing');
          }
          // Scroll the tab header container
          this.scrollTabHeaders(move.deltaX);
        }),
        takeUntil(
          mouseUp$.pipe(
            map(upEvent => {
              const deltaTime = Date.now() - start.time;
              const deltaX = upEvent.clientX - start.x;
              const deltaY = upEvent.clientY - start.y;
              const absDeltaX = Math.abs(deltaX);
              const velocity = absDeltaX / (deltaTime || 1);

              return {
                deltaX,
                deltaY,
                deltaTime,
                velocity
              } as GestureEnd;
            }),
            tap(end => {
              // Reset cursor
              if (this.tabHeaderElement) {
                this.renderer.setStyle(this.tabHeaderElement, 'cursor', 'grab');
              }
              this.resetScroll();
              this.handleGestureEnd(end);
            })
          )
        ),
        finalize(() => {
          // Cleanup on stream completion
          if (this.tabHeaderElement) {
            this.renderer.setStyle(this.tabHeaderElement, 'cursor', 'grab');
          }
        })
      )),
      takeUntil(this.destroy$)
    ).subscribe(() => {}, error => console.error('Mouse gesture error:', error));
  }

  /**
   * Handle gesture end - determine if swipe threshold met
   */
  private handleGestureEnd(end: GestureEnd): void {
    const absDeltaX = Math.abs(end.deltaX);
    const absDeltaY = Math.abs(end.deltaY);

    // Check if movement was primarily horizontal
    if (absDeltaX < absDeltaY) {
      return; // Vertical movement, ignore
    }

    // Check if this was a fast flick (high velocity, short distance)
    // This adds momentum for quick swipes that didn't cover much distance
    const isFastFlick = end.velocity > this.swipeVelocityThreshold && absDeltaX < this.clickInterval;

    if (isFastFlick) {
      const direction = end.deltaX > 0 ? 'before' : 'after';

      // For fast flicks, add 2 extra clicks for momentum
      this.clickPaginationButton(direction);
      setTimeout(() => this.clickPaginationButton(direction), 100);
    }
  }

  /**
   * Simulate a click on pagination button using native MouseEvent
   */
  private clickPaginationButton(direction: 'before' | 'after'): void {
    const button = direction === 'before' ? this.paginationBefore : this.paginationAfter;

    if (!button) {
      return;
    }

    // Check if button is disabled
    if (button.hasAttribute('disabled') || button.classList.contains('mat-mdc-tab-header-pagination-disabled')) {
      return;
    }

    // Dispatch native mouse events that Angular Material listens to
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0
    });
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0
    });
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0
    });

    button.dispatchEvent(mouseDownEvent);
    button.dispatchEvent(mouseUpEvent);
    button.dispatchEvent(clickEvent);
  }

  /**
   * Scroll tab headers during drag/swipe by clicking pagination buttons
   */
  private scrollTabHeaders(deltaX: number): void {
    // Calculate total absolute distance dragged
    const absDeltaX = Math.abs(deltaX);

    // Determine direction (positive deltaX = swipe right = scroll left/before)
    const direction = deltaX > 0 ? 'before' : 'after';

    // Check if we've crossed a new click threshold
    const currentThreshold = Math.floor(absDeltaX / this.clickInterval);

    if (currentThreshold > this.lastClickThreshold) {
      // We've moved another clickInterval pixels, click the button
      const clicksNeeded = currentThreshold - this.lastClickThreshold;

      for (let i = 0; i < clicksNeeded; i++) {
        this.clickPaginationButton(direction);
      }

      this.lastClickThreshold = currentThreshold;
    }
  }

  /**
   * Reset scroll state
   */
  private resetScroll(): void {
    // Reset tracking for next gesture
    this.lastDeltaX = 0;
    this.lastClickThreshold = 0;
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
}
