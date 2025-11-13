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
export class SwipeNavigationDirective implements OnInit, OnDestroy {
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

  ngOnInit(): void {
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
    this.scrollableContainer = this.tabHeaderElement.querySelector('.mat-mdc-tab-list');

    if (!this.scrollableContainer) {
      console.warn(
        'SwipeNavigationDirective: Scrollable tab list not found. ' +
        'Swipe functionality may not work correctly.'
      );
      return;
    }

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
    if (!this.tabHeaderElement) return;

    const touchStart$ = fromEvent<TouchEvent>(this.tabHeaderElement, 'touchstart').pipe(
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
    ).subscribe();
  }

  /**
   * Setup mouse gesture streams with RxJS
   */
  private setupMouseGestures(): void {
    if (!this.tabHeaderElement) return;

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
                this.renderer.removeStyle(this.tabHeaderElement, 'cursor');
              }
              this.resetScroll();
              this.handleGestureEnd(end);
            })
          )
        ),
        finalize(() => {
          // Cleanup on stream completion
          if (this.tabHeaderElement) {
            this.renderer.removeStyle(this.tabHeaderElement, 'cursor');
          }
        })
      )),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  /**
   * Handle gesture end - determine if swipe threshold met
   */
  private handleGestureEnd(end: GestureEnd): void {
    if (!this.scrollableContainer) return;

    const absDeltaX = Math.abs(end.deltaX);
    const absDeltaY = Math.abs(end.deltaY);

    // Check if movement was primarily horizontal
    if (absDeltaX < absDeltaY) {
      return; // Vertical movement, ignore
    }

    // Check if thresholds were met for a flick/fast swipe
    const isSwipe = absDeltaX > this.swipeThreshold || end.velocity > this.swipeVelocityThreshold;

    if (isSwipe) {
      // Smooth scroll animation for fast swipes
      const scrollDistance = end.deltaX * 2; // Amplify the scroll
      const targetScroll = this.scrollableContainer.scrollLeft - scrollDistance;

      this.scrollableContainer.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  }

  /**
   * Scroll tab headers during drag/swipe
   */
  private scrollTabHeaders(deltaX: number): void {
    if (!this.scrollableContainer) return;

    // Calculate incremental movement (only the change since last update)
    const incrementalDelta = deltaX - this.lastDeltaX;
    this.lastDeltaX = deltaX;

    // Scroll in opposite direction of finger/mouse movement
    // (like native scrolling behavior)
    this.scrollableContainer.scrollLeft -= incrementalDelta;
  }

  /**
   * Reset scroll state
   */
  private resetScroll(): void {
    // Reset tracking for next gesture
    this.lastDeltaX = 0;
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
