import { Component, DestroyRef, effect, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { delay, filter, map, tap } from 'rxjs/operators';

import { ColorModeService } from '@coreui/angular';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from './icons/icon-subset';
import { TranslationService } from './core/i18n/translation.service';

@Component({
    selector: 'app-root',
    template: '<router-outlet />',
    imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  title = 'CoreUI Angular Admin Template';
  readonly #chunkReloadStorageKey = 'dw-dashboard-chunk-reload';

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #titleService = inject(Title);
  readonly #translationService = inject(TranslationService);

  readonly #colorModeService = inject(ColorModeService);
  readonly #iconSetService = inject(IconSetService);

  constructor() {
    effect(() => {
      this.#translationService.currentLanguage();
      this.#titleService.setTitle(this.#translationService.translate('app.name'));
    });

    // iconSet singleton
    this.#iconSetService.icons = { ...iconSubset };
    this.#colorModeService.localStorageItemName.set('coreui-free-angular-admin-template-theme-default');
    this.#colorModeService.eventName.set('ColorSchemeChange');
  }

  ngOnInit(): void {

    this.#router.events.pipe(
        takeUntilDestroyed(this.#destroyRef)
      ).subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        this.clearChunkReloadFlag();
        return;
      }

      if (evt instanceof NavigationError) {
        this.handleChunkLoadError(evt.error);
        return;
      }

      setTimeout(() => {
        this.#translationService.localizeStaticContent();
      });
    });

    this.#activatedRoute.queryParams
      .pipe(
        delay(1),
        map(params => <string>params['theme']?.match(/^[A-Za-z0-9\s]+/)?.[0]),
        filter(theme => ['dark', 'light', 'auto'].includes(theme)),
        tap(theme => {
          this.#colorModeService.colorMode.set(theme);
        }),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();
  }

  private handleChunkLoadError(error: unknown): void {
    const message = this.getErrorMessage(error);
    if (!this.isChunkLoadError(message)) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const hasRetried = window.sessionStorage.getItem(this.#chunkReloadStorageKey) === '1';
    if (hasRetried) {
      window.sessionStorage.removeItem(this.#chunkReloadStorageKey);
      return;
    }

    window.sessionStorage.setItem(this.#chunkReloadStorageKey, '1');
    window.location.reload();
  }

  private clearChunkReloadFlag(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.sessionStorage.removeItem(this.#chunkReloadStorageKey);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return '';
  }

  private isChunkLoadError(message: string): boolean {
    if (!message) {
      return false;
    }

    const chunkErrorPatterns = [
      /Failed to fetch dynamically imported module/i,
      /Importing a module script failed/i,
      /Loading chunk [\w-]+ failed/i
    ];

    return chunkErrorPatterns.some((pattern) => pattern.test(message));
  }
}
