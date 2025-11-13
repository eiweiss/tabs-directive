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
 * Directive for swipe and drag navigation on Angular Material Tabs
 *
 * Usage:
 * <mat-tab-group appSwipeNavigation>...</mat-tab-group>
 *
 * This directive uses reactive programming with RxJS for event handling.
 * It uses only the public Angular Material API and does not interfere
 * with internal calculations.
 *
 * Swipe functionality is restricted to the tab header area only.
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
          // Update visual feedback
          this.updateVisualFeedback(move.deltaX);
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
              this.resetVisualFeedback();
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
          // Update visual feedback
          this.updateVisualFeedback(move.deltaX);
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
              this.resetVisualFeedback();
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
    const absDeltaX = Math.abs(end.deltaX);
    const absDeltaY = Math.abs(end.deltaY);

    // Check if movement was primarily horizontal
    if (absDeltaX < absDeltaY) {
      return; // Vertical movement, ignore
    }

    // Check if thresholds were met
    const isSwipe = absDeltaX > this.swipeThreshold || end.velocity > this.swipeVelocityThreshold;

    if (isSwipe) {
      if (end.deltaX > 0) {
        // Swipe right -> Previous
        this.navigatePrevious();
      } else {
        // Swipe left -> Next
        this.navigateNext();
      }
    }
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
