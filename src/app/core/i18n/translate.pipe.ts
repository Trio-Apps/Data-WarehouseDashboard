import { ChangeDetectorRef, effect, inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from './translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private readonly refreshEffect = effect(() => {
    this.translationService.translationRevision();
    this.changeDetectorRef.markForCheck();
  });

  transform(key: string, params?: Record<string, string | number>): string {
    return this.translationService.translate(key, params);
  }
}
