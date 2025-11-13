import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { MatPaginator } from '@angular/material/paginator';

/**
 * Directive für Swipe- und Drag-Navigation auf Angular Material Komponenten
 *
 * Unterstützt:
 * - MatTabGroup (Tabs)
 * - MatPaginator (Pagination)
 *
 * Verwendung:
 * <mat-tab-group appSwipeNavigation>...</mat-tab-group>
 * <mat-paginator appSwipeNavigation>...</mat-paginator>
 *
 * Die Directive nutzt die öffentliche API von Angular Material und
 * beeinträchtigt keine internen Berechnungen.
 */
@Directive({
  selector: '[appSwipeNavigation]',
  standalone: true
})
export class SwipeNavigationDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);

  // Optional: Injiziere die Material-Komponenten, falls vorhanden
  private tabGroup = inject(MatTabGroup, { optional: true });
  private paginator = inject(MatPaginator, { optional: true });

  // Konfigurierbare Schwellenwerte
  @Input() swipeThreshold = 50; // Minimale Distanz in Pixeln für Swipe
  @Input() swipeVelocityThreshold = 0.3; // Minimale Geschwindigkeit für Swipe

  // Tracking für Touch/Mouse Events
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isDragging = false;
  private isTouchDevice = false;

  ngOnInit(): void {
    // Prüfe ob Touch-Events unterstützt werden
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Validiere dass eine unterstützte Komponente vorhanden ist
    if (!this.tabGroup && !this.paginator) {
      console.warn(
        'SwipeNavigationDirective: Keine unterstützte Komponente gefunden. ' +
        'Bitte auf mat-tab-group oder mat-paginator anwenden.'
      );
    }
  }

  ngOnDestroy(): void {
    // Cleanup falls nötig
    this.isDragging = false;
  }

  // Touch Events
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) {
      return; // Nur single-touch unterstützen
    }

    this.startGesture(event.touches[0].clientX, event.touches[0].clientY);
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) {
      return;
    }

    // Verhindere Scroll während des Swipes
    const deltaX = Math.abs(event.touches[0].clientX - this.startX);
    const deltaY = Math.abs(event.touches[0].clientY - this.startY);

    // Nur horizontale Swipes behandeln
    if (deltaX > deltaY && deltaX > 10) {
      event.preventDefault();
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) {
      return;
    }

    if (event.changedTouches.length > 0) {
      this.endGesture(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }
  }

  @HostListener('touchcancel', ['$event'])
  onTouchCancel(event: TouchEvent): void {
    this.isDragging = false;
  }

  // Mouse Events (für Desktop)
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Nur linke Maustaste
    if (event.button !== 0) {
      return;
    }

    this.startGesture(event.clientX, event.clientY);
    event.preventDefault(); // Verhindere Text-Selektion
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    const deltaX = Math.abs(event.clientX - this.startX);
    const deltaY = Math.abs(event.clientY - this.startY);

    // Zeige visuelles Feedback durch Cursor
    if (deltaX > deltaY && deltaX > 10) {
      this.elementRef.nativeElement.style.cursor = 'grabbing';
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    this.endGesture(event.clientX, event.clientY);
    this.elementRef.nativeElement.style.cursor = '';
  }

  // Gemeinsame Logik für Touch und Mouse
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

    // Prüfe ob Bewegung primär horizontal war
    if (absDeltaX < absDeltaY) {
      this.isDragging = false;
      return; // Vertikale Bewegung, ignorieren
    }

    // Berechne Geschwindigkeit (Pixel pro Millisekunde)
    const velocity = absDeltaX / (deltaTime || 1);

    // Prüfe ob Schwellenwerte erreicht wurden
    const isSwipe = absDeltaX > this.swipeThreshold || velocity > this.swipeVelocityThreshold;

    if (isSwipe) {
      if (deltaX > 0) {
        // Swipe nach rechts -> Zurück
        this.navigatePrevious();
      } else {
        // Swipe nach links -> Vor
        this.navigateNext();
      }
    }

    this.isDragging = false;
  }

  private navigateNext(): void {
    if (this.tabGroup) {
      // Nutze die öffentliche API von MatTabGroup
      const currentIndex = this.tabGroup.selectedIndex || 0;
      const maxIndex = (this.tabGroup._tabs?.length || 1) - 1;

      if (currentIndex < maxIndex) {
        this.tabGroup.selectedIndex = currentIndex + 1;
      }
    } else if (this.paginator) {
      // Nutze die öffentliche API von MatPaginator
      if (this.paginator.hasNextPage()) {
        this.paginator.nextPage();
      }
    }
  }

  private navigatePrevious(): void {
    if (this.tabGroup) {
      // Nutze die öffentliche API von MatTabGroup
      const currentIndex = this.tabGroup.selectedIndex || 0;

      if (currentIndex > 0) {
        this.tabGroup.selectedIndex = currentIndex - 1;
      }
    } else if (this.paginator) {
      // Nutze die öffentliche API von MatPaginator
      if (this.paginator.hasPreviousPage()) {
        this.paginator.previousPage();
      }
    }
  }
}
