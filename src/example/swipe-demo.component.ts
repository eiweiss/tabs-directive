import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { SwipeNavigationDirective } from '../directives/swipe-navigation.directive';

/**
 * Demo component for the SwipeNavigationDirective
 *
 * Demonstrates swipe navigation for Angular Material Tabs
 * using Reactive Programming with RxJS
 */
@Component({
  selector: 'app-swipe-demo',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    SwipeNavigationDirective
  ],
  template: `
    <div class="demo-container">
      <h1>Tabs Swipe Navigation</h1>
      <p class="demo-hint">
        💡 Tip: Swipe with your finger or drag with the mouse left/right <strong>on the tab headers</strong> to scroll through all tabs!
      </p>

      <!-- Tabs Example -->
      <section class="demo-section">
        <mat-tab-group
          appSwipeNavigation
          class="swipe-enabled"
          [selectedIndex]="selectedTabIndex"
          (selectedIndexChange)="selectedTabIndex = $event">
          @for (tab of tabs; track tab.id) {
            <mat-tab [label]="tab.label">
              <div class="tab-content">
                <h3>{{ tab.title }}</h3>
                <p>{{ tab.description }}</p>
                <p><strong>Note:</strong> Swipe left/right on the tab headers above to scroll through all {{ tabs.length }} tabs!</p>
              </div>
            </mat-tab>
          }
        </mat-tab-group>
        <p class="current-info">Current tab: {{ selectedTabIndex + 1 }} of {{ tabs.length }} (Swipe the header to scroll through tabs)</p>
      </section>

      <!-- Information -->
      <section class="demo-section info-section">
        <h3>How does it work?</h3>
        <ul>
          <li><strong>Header Scrolling:</strong> Scrolls through the tab header list, NOT changing the selected tab</li>
          <li><strong>Reactive Programming:</strong> Built with RxJS observables and operators (fromEvent, switchMap, takeUntil, etc.)</li>
          <li><strong>Touch devices:</strong> Swipe with your finger left/right on the tab headers</li>
          <li><strong>Desktop:</strong> Click and drag with the mouse left/right on the tab headers</li>
          <li><strong>Replace pagination arrows:</strong> Swipe instead of clicking the left/right arrows multiple times</li>
          <li><strong>Direct scrolling:</strong> Dragging follows your finger/mouse position</li>
          <li><strong>Fast swipe:</strong> Quick swipe continues scrolling with momentum</li>
          <li><strong>Memory safe:</strong> Automatic cleanup with takeUntil pattern prevents memory leaks</li>
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    h1 {
      color: #3f51b5;
      margin-bottom: 10px;
    }

    .demo-hint {
      background: #e3f2fd;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #2196f3;
      margin-bottom: 30px;
    }

    .demo-section {
      margin-bottom: 40px;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
    }

    h2 {
      color: #424242;
      margin-top: 0;
      margin-bottom: 16px;
    }

    .swipe-enabled {
      cursor: grab;
      user-select: none;
    }

    .swipe-enabled:active {
      cursor: grabbing;
    }

    .tab-content {
      padding: 24px;
      min-height: 200px;
    }

    .tab-content h3 {
      color: #3f51b5;
      margin-top: 0;
    }

    .current-info {
      margin-top: 12px;
      color: #666;
      font-size: 14px;
      font-style: italic;
    }

    .info-section {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
    }

    .info-section h3 {
      color: #e65100;
      margin-top: 0;
    }

    .info-section ul {
      margin: 0;
      padding-left: 20px;
    }

    .info-section li {
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .info-section strong {
      color: #e65100;
    }
  `]
})
export class SwipeDemoComponent {
  selectedTabIndex = 0;

  // Generate many tabs to trigger pagination arrows
  tabs = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    label: `Tab ${i + 1}`,
    title: `This is Tab ${i + 1}`,
    description: `Content for tab number ${i + 1}. With ${this.getTotalTabs()} tabs, the pagination arrows appear. Instead of clicking them multiple times, you can swipe/drag the tab headers to scroll through all tabs quickly!`
  }));

  private getTotalTabs(): number {
    return 20;
  }
}
