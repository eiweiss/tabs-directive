# Tab Header Scroll Directive for Angular Material

An Angular directive that enables touch-swipe and mouse-drag scrolling through Angular Material Tab headers.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/eiweiss/tabs-directive)

## Features

- ✅ **Header Scrolling** - scrolls through tab headers when there are many tabs, NOT changing the selected tab
- ✅ **Replace Pagination Arrows** - swipe instead of clicking left/right arrows multiple times
- ✅ **Reactive Programming** - built with RxJS observables and operators for clean, declarative code
- ✅ **Swipe gestures** for touch devices (smartphones, tablets)
- ✅ **Mouse drag** for desktop devices
- ✅ **Direct scrolling** - dragging follows your finger/mouse position
- ✅ **Momentum scrolling** - fast swipes continue scrolling smoothly
- ✅ **Memory leak safe** - automatic cleanup with takeUntil and destroy$
- ✅ Configurable thresholds for swipe distance and velocity
- ✅ Standalone Directive (Angular 20)

## Installation

The directive is already included in the project at `src/directives/swipe-navigation.directive.ts`.

## Usage

```typescript
import { MatTabsModule } from '@angular/material/tabs';
import { SwipeNavigationDirective } from './directives/swipe-navigation.directive';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [MatTabsModule, SwipeNavigationDirective],
  template: `
    <mat-tab-group appSwipeNavigation>
      <mat-tab label="Tab 1">Content 1</mat-tab>
      <mat-tab label="Tab 2">Content 2</mat-tab>
      <mat-tab label="Tab 3">Content 3</mat-tab>
    </mat-tab-group>
  `
})
export class MyComponent {}
```

### Configuration

The directive offers two configurable parameters:

```typescript
<mat-tab-group
  appSwipeNavigation
  [swipeThreshold]="100"        // Default: 50px
  [swipeVelocityThreshold]="0.5" // Default: 0.3
>
```

- **swipeThreshold**: Minimum distance in pixels for a swipe gesture (default: 50)
- **swipeVelocityThreshold**: Minimum velocity (px/ms) for a fast swipe gesture (default: 0.3)

## How it works

When you have many tabs in a `mat-tab-group`, Angular Material shows pagination arrows to navigate through the tab headers. This directive allows you to **swipe/drag the tab headers** to scroll through them, instead of clicking the arrows multiple times.

The directive uses **Reactive Programming with RxJS**:

1. **Header Scrolling** - Scrolls the tab header container (`.mat-mdc-tab-list`), NOT changing the selected tab
2. **Event Streams** - Creates observable streams from touch and mouse events using `fromEvent`
3. **Reactive Operators** - Uses RxJS operators like `switchMap`, `takeUntil`, `filter`, `map`, `tap`, `merge`
4. **Direct Follow** - During drag, the headers follow your finger/mouse position
5. **Momentum** - Fast swipes continue scrolling with smooth animation
6. **Automatic Cleanup** - All subscriptions are automatically cleaned up with `takeUntil(destroy$)`
7. **Horizontal Gestures** - Recognizes horizontal swipe/drag gestures, ignores vertical movements
