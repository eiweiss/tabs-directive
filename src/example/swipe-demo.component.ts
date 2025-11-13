import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { SwipeNavigationDirective } from '../directives/swipe-navigation.directive';

/**
 * Demo component for the SwipeNavigationDirective
 *
 * Demonstrates swipe navigation for Angular Material Tabs
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
        💡 Tip: Swipe with your finger or drag with the mouse left/right
      </p>

      <!-- Tabs Example -->
      <section class="demo-section">
        <mat-tab-group
          appSwipeNavigation
          class="swipe-enabled"
          [selectedIndex]="selectedTabIndex"
          (selectedIndexChange)="selectedTabIndex = $event">
          <mat-tab label="First Tab">
            <div class="tab-content">
              <h3>Welcome to the first tab</h3>
              <p>Swipe left or drag with the mouse to the left to go to the next tab.</p>
            </div>
          </mat-tab>
          <mat-tab label="Second Tab">
            <div class="tab-content">
              <h3>This is the second tab</h3>
              <p>You can swipe/drag left or right to navigate between tabs.</p>
            </div>
          </mat-tab>
          <mat-tab label="Third Tab">
            <div class="tab-content">
              <h3>The third tab</h3>
              <p>Swipe right or drag to the right to go back.</p>
            </div>
          </mat-tab>
          <mat-tab label="Fourth Tab">
            <div class="tab-content">
              <h3>Last tab</h3>
              <p>This is the last tab. Swipe only works within the available tabs.</p>
            </div>
          </mat-tab>
        </mat-tab-group>
        <p class="current-info">Current tab: {{ selectedTabIndex + 1 }} of 4</p>
      </section>

      <!-- Information -->
      <section class="demo-section info-section">
        <h3>How does it work?</h3>
        <ul>
          <li><strong>Touch devices:</strong> Swipe with your finger left/right</li>
          <li><strong>Desktop:</strong> Click and drag with the mouse left/right</li>
          <li><strong>Threshold:</strong> At least 50px movement or fast gesture</li>
          <li><strong>Angular Material API:</strong> Uses only the public selectedIndex API</li>
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
}
