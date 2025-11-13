import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { SwipeNavigationDirective } from '../directives/swipe-navigation.directive';

/**
 * Demo-Komponente für die SwipeNavigationDirective
 *
 * Zeigt Swipe-Navigation für Angular Material Tabs
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
        💡 Tipp: Swipe mit dem Finger oder ziehe mit der Maus nach links/rechts
      </p>

      <!-- Tabs Beispiel -->
      <section class="demo-section">
        <mat-tab-group
          appSwipeNavigation
          class="swipe-enabled"
          [selectedIndex]="selectedTabIndex"
          (selectedIndexChange)="selectedTabIndex = $event">
          <mat-tab label="Erste Tab">
            <div class="tab-content">
              <h3>Willkommen auf der ersten Tab</h3>
              <p>Swipe nach links oder ziehe mit der Maus nach links, um zur nächsten Tab zu gelangen.</p>
            </div>
          </mat-tab>
          <mat-tab label="Zweite Tab">
            <div class="tab-content">
              <h3>Das ist die zweite Tab</h3>
              <p>Du kannst nach links oder rechts swipen/ziehen, um zwischen den Tabs zu navigieren.</p>
            </div>
          </mat-tab>
          <mat-tab label="Dritte Tab">
            <div class="tab-content">
              <h3>Die dritte Tab</h3>
              <p>Swipe nach rechts oder ziehe nach rechts, um zurück zu gehen.</p>
            </div>
          </mat-tab>
          <mat-tab label="Vierte Tab">
            <div class="tab-content">
              <h3>Letzte Tab</h3>
              <p>Das ist die letzte Tab. Swipe funktioniert nur innerhalb der verfügbaren Tabs.</p>
            </div>
          </mat-tab>
        </mat-tab-group>
        <p class="current-info">Aktuelle Tab: {{ selectedTabIndex + 1 }} von 4</p>
      </section>

      <!-- Informationen -->
      <section class="demo-section info-section">
        <h3>Wie funktioniert's?</h3>
        <ul>
          <li><strong>Touch-Geräte:</strong> Swipe mit dem Finger nach links/rechts</li>
          <li><strong>Desktop:</strong> Klicke und ziehe mit der Maus nach links/rechts</li>
          <li><strong>Schwellenwert:</strong> Mindestens 50px Bewegung oder schnelle Geste</li>
          <li><strong>Angular Material API:</strong> Verwendet nur die öffentliche selectedIndex API</li>
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
