# Tabs Swipe Navigation Directive für Angular Material

Eine Angular Directive, die Touch-Swipe und Maus-Drag Navigation für Angular Material Tabs ermöglicht.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/eiweiss/tabs-directive)

## Features

- ✅ **Swipe-Gesten** für Touch-Geräte (Smartphones, Tablets)
- ✅ **Drag mit der Maus** für Desktop-Geräte
- ✅ Unterstützt **MatTabGroup** (Tabs)
- ✅ **Keine internen Berechnungen werden beeinträchtigt** - nutzt nur die öffentliche selectedIndex API
- ✅ Konfigurierbare Schwellenwerte für Swipe-Distanz und -Geschwindigkeit
- ✅ Standalone Directive (Angular 20)

## Installation

Die Directive ist bereits im Projekt enthalten unter `src/directives/swipe-navigation.directive.ts`.

## Verwendung

```typescript
import { MatTabsModule } from '@angular/material/tabs';
import { SwipeNavigationDirective } from './directives/swipe-navigation.directive';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [MatTabsModule, SwipeNavigationDirective],
  template: `
    <mat-tab-group appSwipeNavigation>
      <mat-tab label="Tab 1">Inhalt 1</mat-tab>
      <mat-tab label="Tab 2">Inhalt 2</mat-tab>
      <mat-tab label="Tab 3">Inhalt 3</mat-tab>
    </mat-tab-group>
  `
})
export class MyComponent {}
```

### Konfiguration

Die Directive bietet zwei konfigurierbare Parameter:

```typescript
<mat-tab-group
  appSwipeNavigation
  [swipeThreshold]="100"        // Standard: 50px
  [swipeVelocityThreshold]="0.5" // Standard: 0.3
>
```

- **swipeThreshold**: Minimale Distanz in Pixeln für eine Swipe-Geste (Standard: 50)
- **swipeVelocityThreshold**: Minimale Geschwindigkeit (px/ms) für eine schnelle Swipe-Geste (Standard: 0.3)

## Wie es funktioniert

Die Directive:

1. Lauscht auf Touch-Events (`touchstart`, `touchmove`, `touchend`) und Mouse-Events (`mousedown`, `mousemove`, `mouseup`)
2. Erkennt horizontale Swipe/Drag-Gesten
3. Ignoriert vertikale Bewegungen (ermöglicht normales Scrollen)
4. Nutzt die **öffentliche API** von Angular Material: `MatTabGroup.selectedIndex`
5. Beeinträchtigt **keine internen Berechnungen** von Angular Material

## Demo

Starte die Anwendung, um die Demo zu sehen:

```bash
npm install
npm start
```

Die Demo zeigt:
- Swipe-Navigation für Tabs
- Touch- und Maus-Interaktionen

## Browser-Kompatibilität

- ✅ Alle modernen Browser
- ✅ Touch-Geräte (iOS, Android)
- ✅ Desktop mit Maus
- ✅ Hybrid-Geräte (Touch + Maus)

## Technische Details

- **Angular Version**: 20.2.0
- **Angular Material Version**: 20.2.0
- **TypeScript**: 5.9.2
- **Standalone**: Ja (keine Module nötig)

## Lizenz

MIT