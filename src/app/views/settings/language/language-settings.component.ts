import { Location, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { IconDirective } from '@coreui/icons-angular';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AppLanguage, TranslationService } from '../../../core/i18n/translation.service';

interface LanguageOption {
  code: AppLanguage;
  nameKey: string;
  nativeName: string;
}

@Component({
  selector: 'app-language-settings',
  standalone: true,
  imports: [NgClass, IconDirective, TranslatePipe],
  templateUrl: './language-settings.component.html',
  styleUrl: './language-settings.component.scss'
})
export class LanguageSettingsComponent {
  private readonly location = inject(Location);
  private readonly translationService = inject(TranslationService);

  readonly currentLanguage = this.translationService.currentLanguage;
  readonly successLanguage = signal<AppLanguage | null>(null);
  readonly languageOptions: LanguageOption[] = [
    { code: 'en', nameKey: 'common.english', nativeName: 'English' },
    { code: 'ar', nameKey: 'common.arabic', nativeName: 'العربية' }
  ];

  readonly selectedLanguageLabel = computed(() => {
    const activeOption = this.languageOptions.find(({ code }) => code === this.currentLanguage());
    return activeOption ? this.translationService.translate(activeOption.nameKey) : '';
  });

  goBack(): void {
    this.location.back();
  }

  async selectLanguage(language: AppLanguage): Promise<void> {
    if (language !== this.currentLanguage()) {
      await this.translationService.setLanguage(language);
    }

    this.successLanguage.set(language);
  }
}
