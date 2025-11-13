# Tabs Swipe Navigation Directive for Angular Material

An Angular directive that enables touch-swipe and mouse-drag navigation for Angular Material Tabs.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/eiweiss/tabs-directive)

## Features

- ✅ **Reactive Programming** - built with RxJS observables and operators for clean, declarative code
- ✅ **Swipe gestures** for touch devices (smartphones, tablets)
- ✅ **Mouse drag** for desktop devices
- ✅ Supports **MatTabGroup** (Tabs)
- ✅ **Header-only functionality** - swipe only works on the tab header, not in the tab content
- ✅ **Reactive visual feedback** - opacity changes during swipe/drag for better UX
- ✅ **Memory leak safe** - automatic cleanup with takeUntil and destroy$
- ✅ **No internal calculations are affected** - uses only the public selectedIndex API
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

The directive uses **Reactive Programming with RxJS**:

1. **Event Streams** - Creates observable streams from touch and mouse events using `fromEvent`
2. **Reactive Operators** - Uses RxJS operators like `switchMap`, `takeUntil`, `filter`, `map`, `tap`, `merge`
3. **Declarative Composition** - Gesture logic is composed from observable streams
4. **Automatic Cleanup** - All subscriptions are automatically cleaned up with `takeUntil(destroy$)`
5. **Header-only Area** - Only responds to events in the tab header, not in the tab content
6. **Visual Feedback** - The tab header opacity changes during swipe/drag to indicate the gesture
7. **Horizontal Gestures** - Recognizes horizontal swipe/drag gestures, ignores vertical movements
8. **Public API Only** - Uses only `MatTabGroup.selectedIndex`, does not interfere with internal calculations

## Demo

Start the application to see the demo:

```bash
npm install
npm start
```

The demo shows:
- Swipe navigation for tabs (header only)
- Touch and mouse interactions
- Reactive visual feedback during gestures

## Browser Compatibility

- ✅ All modern browsers
- ✅ Touch devices (iOS, Android)
- ✅ Desktop with mouse
- ✅ Hybrid devices (touch + mouse)

## Technical Details

- **Programming Paradigm**: Reactive Programming with RxJS
- **Angular Version**: 20.2.0
- **Angular Material Version**: 20.2.0
- **RxJS**: ~7.8.0
- **TypeScript**: 5.9.2
- **Standalone**: Yes (no modules needed)
- **Memory Management**: Automatic subscription cleanup with `takeUntil` pattern

## License

MIT