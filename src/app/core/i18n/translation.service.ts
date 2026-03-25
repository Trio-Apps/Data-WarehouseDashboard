import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type AppLanguage = 'en' | 'ar';

interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

interface LocalizationApiResponse {
  language: string;
  data: TranslationDictionary;
  count: number;
  literalTranslations?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'warehouse.language';
  private readonly fallbackLanguage: AppLanguage = 'en';
  private readonly cache = new Map<AppLanguage, TranslationDictionary>();
  private readonly literalTranslationCache = new Map<AppLanguage, Record<string, string>>();
  private readonly localizationApiBaseUrl = environment.apiUrl.trim().replace(/\/+$/, '');
  private readonly originalTextNodes = new WeakMap<Text, string>();
  private readonly originalElementAttributes = new WeakMap<Element, Map<string, string | null>>();
  private readonly attributeNamesToLocalize = ['placeholder', 'title', 'aria-label', 'value'];
  private observer: MutationObserver | null = null;

  private exactArabicTranslations: Record<string, string> = {};

  readonly supportedLanguages: AppLanguage[] = ['en', 'ar'];
  readonly currentLanguage = signal<AppLanguage>(this.fallbackLanguage);
  readonly direction = computed(() => this.currentLanguage() === 'ar' ? 'rtl' : 'ltr');
  readonly translationRevision = signal(0);

  private readonly translations = signal<TranslationDictionary>({});

  async initialize(): Promise<void> {
    const browserLanguage = this.normalizeLanguage(globalThis.navigator?.language);
    const savedLanguage = this.normalizeLanguage(localStorage.getItem(this.storageKey));
    await this.setLanguage(savedLanguage ?? browserLanguage ?? this.fallbackLanguage);
    this.startDomLocalization();
  }

  async setLanguage(language: string): Promise<void> {
    const normalizedLanguage = this.normalizeLanguage(language) ?? this.fallbackLanguage;

    await Promise.all([
      this.loadLanguage(normalizedLanguage),
      this.loadLanguage(this.fallbackLanguage)
    ]);

    this.translations.set(this.cache.get(normalizedLanguage) ?? {});
    this.exactArabicTranslations = normalizedLanguage === 'ar'
      ? (this.literalTranslationCache.get('ar') ?? {})
      : {};
    this.currentLanguage.set(normalizedLanguage);
    localStorage.setItem(this.storageKey, normalizedLanguage);
    this.applyDocumentLanguage(normalizedLanguage);
    this.localizeStaticContent();
    this.translationRevision.update((revision) => revision + 1);
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const value = this.resolveKey(this.translations(), key);
    const fallback = this.resolveKey(this.cache.get(this.fallbackLanguage) ?? {}, key);
    const translatedText = typeof value === 'string'
      ? value
      : typeof fallback === 'string'
        ? fallback
        : this.currentLanguage() === 'ar'
          ? this.translateLiteral(key)
          : key;

    if (!params) {
      return translatedText;
    }

    return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
      return result.replaceAll(`{{${paramKey}}}`, String(paramValue));
    }, translatedText);
  }

  translateText(text: string): string {
    return this.currentLanguage() === 'ar' ? this.translateLiteral(text) : text;
  }

  localizeStaticContent(): void {
    if (!this.document.body || !this.shouldLocalizeDom()) {
      return;
    }

    this.processNode(this.document.body);
  }

  private async loadLanguage(language: AppLanguage): Promise<void> {
    if (this.cache.has(language)) {
      return;
    }

    const response = await firstValueFrom(
      this.http.get<LocalizationApiResponse>(`${this.localizationApiBaseUrl}/Localization/${language}`)
    );

    this.cache.set(language, response.data);
    this.literalTranslationCache.set(language, response.literalTranslations ?? {});
  }

  private resolveKey(dictionary: TranslationDictionary, key: string): string | TranslationDictionary | undefined {
    return key.split('.').reduce<string | TranslationDictionary | undefined>((current, part) => {
      if (!current || typeof current === 'string') {
        return undefined;
      }

      return current[part];
    }, dictionary);
  }

  private applyDocumentLanguage(language: AppLanguage): void {
    const html = this.document.documentElement;
    const body = this.document.body;
    const direction = language === 'ar' ? 'rtl' : 'ltr';

    html.lang = language;
    html.dir = direction;

    if (!body) {
      return;
    }

    body.dir = direction;
    body.classList.toggle('lang-ar', language === 'ar');
    body.classList.toggle('lang-en', language === 'en');
  }

  private startDomLocalization(): void {
    if (this.observer || !this.document.body || typeof MutationObserver === 'undefined') {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => this.processNode(node));
        }

        if (mutation.type === 'characterData' && mutation.target instanceof Text) {
          this.localizeTextNode(mutation.target);
        }
      }
    });

    this.observer.observe(this.document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });

    this.localizeStaticContent();
  }

  private processNode(node: Node): void {
    if (!this.shouldLocalizeDom()) {
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      this.localizeTextNode(node as Text);
      return;
    }

    if (!(node instanceof Element)) {
      return;
    }

    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) {
      return;
    }

    this.localizeElementAttributes(node);
    node.childNodes.forEach((childNode) => this.processNode(childNode));
  }

  private localizeTextNode(textNode: Text): void {
    if (!this.shouldLocalizeDom()) {
      return;
    }

    const currentText = textNode.textContent ?? '';
    const storedOriginal = this.originalTextNodes.get(textNode);

    if (!this.originalTextNodes.has(textNode)) {
      this.originalTextNodes.set(textNode, currentText);
    } else if (currentText.trim()) {
      const storedOriginalText = storedOriginal ?? '';
      const hasStoredOriginalText = storedOriginalText.trim().length > 0;

      if (!hasStoredOriginalText) {
        this.originalTextNodes.set(textNode, currentText);
      } else {
        const isFreshSourceText = this.currentLanguage() === 'ar'
          ? this.translateLiteral(currentText) !== currentText
          : currentText !== storedOriginal;

        if (isFreshSourceText) {
          this.originalTextNodes.set(textNode, currentText);
        }
      }
    }

    const original = this.originalTextNodes.get(textNode) ?? currentText;

    const updated = this.currentLanguage() === 'ar'
      ? this.translateLiteral(original)
      : original;

    if (textNode.textContent !== updated) {
      textNode.textContent = updated;
    }
  }

  private localizeElementAttributes(element: Element): void {
    if (!this.shouldLocalizeDom()) {
      return;
    }

    let originalAttributes = this.originalElementAttributes.get(element);

    if (!originalAttributes) {
      originalAttributes = new Map<string, string | null>();
      this.originalElementAttributes.set(element, originalAttributes);
    }

    for (const attributeName of this.attributeNamesToLocalize) {
      const currentAttributeValue = element.getAttribute(attributeName);

      if (!originalAttributes.has(attributeName)) {
        originalAttributes.set(attributeName, currentAttributeValue);
      } else if (currentAttributeValue != null) {
        const storedOriginalValue = originalAttributes.get(attributeName);
        const hasStoredOriginalValue = (storedOriginalValue ?? '').trim().length > 0;

        if (!hasStoredOriginalValue) {
          originalAttributes.set(attributeName, currentAttributeValue);
        } else {
          const isFreshSourceValue = this.currentLanguage() === 'ar'
            ? this.translateLiteral(currentAttributeValue) !== currentAttributeValue
            : currentAttributeValue !== storedOriginalValue;

          if (isFreshSourceValue) {
            originalAttributes.set(attributeName, currentAttributeValue);
          }
        }
      }

      const originalValue = originalAttributes.get(attributeName);
      if (originalValue == null) {
        continue;
      }

      const updatedValue = this.currentLanguage() === 'ar'
        ? this.translateLiteral(originalValue)
        : originalValue;

      if (element.getAttribute(attributeName) !== updatedValue) {
        element.setAttribute(attributeName, updatedValue);
      }
    }
  }

  private translateLiteral(text: string): string {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return text;
    }

    const exactMatch = this.exactArabicTranslations[trimmedText];
    if (exactMatch) {
      return text.replace(trimmedText, exactMatch);
    }

    const wrappedMatch = trimmedText.match(/^([.\-–—:()[\]\s]*)(.+?)([.\-–—:()[\]\s]*)$/);
    if (wrappedMatch) {
      const [, prefix, innerText, suffix] = wrappedMatch;
      const innerExactMatch = this.exactArabicTranslations[innerText];
      if (innerExactMatch) {
        return text.replace(trimmedText, `${prefix}${innerExactMatch}${suffix}`);
      }

      const innerPatternMatch = this.translateByPattern(innerText);
      if (innerPatternMatch) {
        return text.replace(trimmedText, `${prefix}${innerPatternMatch}${suffix}`);
      }
    }

    const transformed = this.translateByPattern(trimmedText);
    if (transformed) {
      return text.replace(trimmedText, transformed);
    }

    const fragmentMatch = this.translateFragment(trimmedText);
    return fragmentMatch !== trimmedText ? text.replace(trimmedText, fragmentMatch) : text;
  }

  private translateByPattern(text: string): string | null {
    const wrappedSelectMatch = text.match(/^[\-\u2013\u2014]+\s*(Select\s+.+?)\s*[\-\u2013\u2014]+$/i);
    if (wrappedSelectMatch) {
      return `-- ${this.translateByPattern(wrappedSelectMatch[1]) ?? this.translateFragment(wrappedSelectMatch[1])} --`;
    }

    const wrappedAllMatch = text.match(/^[\-\u2013\u2014]+\s*(All\s+.+?)\s*[\-\u2013\u2014]+$/i);
    if (wrappedAllMatch) {
      return `-- ${this.translateFragment(wrappedAllMatch[1])} --`;
    }

    const notificationMessageMatch = text.match(/^(.+?)\s+#(\d+)\s+has been\s+(.+)\.$/i);
    if (notificationMessageMatch) {
      return this.formatLiteralTemplate('__pattern.notificationMessage', {
        entity: this.translateFragment(notificationMessageMatch[1]),
        value: notificationMessageMatch[2],
        action: this.translateFragment(notificationMessageMatch[3].toLowerCase())
      }) ?? text;
    }

    const notificationTitleMatch = text.match(/^(.+?)\s+(Created|Submitted|Approved|Rejected|Deleted|Completed|Updated|Partially Failed)$/i);
    if (notificationTitleMatch) {
      return this.formatLiteralTemplate('__pattern.notificationTitle', {
        entity: this.translateFragment(notificationTitleMatch[1]),
        action: this.translateFragment(notificationTitleMatch[2].toLowerCase())
      }) ?? text;
    }

    const warehouseIdHeaderMatch = text.match(/^(.+)\s+-\s+Warehouse ID:\s+(.+)$/i);
    if (warehouseIdHeaderMatch) {
      return this.formatLiteralTemplate('__pattern.warehouseIdHeader', {
        label: this.translateFragment(warehouseIdHeaderMatch[1]),
        value: warehouseIdHeaderMatch[2]
      }) ?? text;
    }

    const warehouseNumberHeaderMatch = text.match(/^(.+)\s+-\s+Warehouse\s+#(\d+)$/i);
    if (warehouseNumberHeaderMatch) {
      return this.formatLiteralTemplate('__pattern.warehouseNumberHeader', {
        label: this.translateFragment(warehouseNumberHeaderMatch[1]),
        value: warehouseNumberHeaderMatch[2]
      }) ?? text;
    }

    const warehouseHeaderMatch = text.match(/^(.+)\s+-\s+Warehouse\s+(\d+)$/i);
    if (warehouseHeaderMatch) {
      return this.formatLiteralTemplate('__pattern.warehouseHeader', {
        label: this.translateFragment(warehouseHeaderMatch[1]),
        value: warehouseHeaderMatch[2]
      }) ?? text;
    }

    const itemIdHeaderMatch = text.match(/^(.+)\s+-\s+Item ID:\s+(.+)$/i);
    if (itemIdHeaderMatch) {
      return this.formatLiteralTemplate('__pattern.itemIdHeader', {
        label: this.translateFragment(itemIdHeaderMatch[1]),
        value: itemIdHeaderMatch[2]
      }) ?? text;
    }

    const itemBarcodeIdHeaderMatch = text.match(/^(.+)\s+-\s+Item Barcode ID:\s+(.+)$/i);
    if (itemBarcodeIdHeaderMatch) {
      return this.formatLiteralTemplate('__pattern.itemBarcodeIdHeader', {
        label: this.translateFragment(itemBarcodeIdHeaderMatch[1]),
        value: itemBarcodeIdHeaderMatch[2]
      }) ?? text;
    }

    const itemNumberHeaderMatch = text.match(/^(.+)\s+-\s+Item\s+#(\d+)$/i);
    if (itemNumberHeaderMatch) {
      return this.formatLiteralTemplate('__pattern.itemNumberHeader', {
        label: this.translateFragment(itemNumberHeaderMatch[1]),
        value: itemNumberHeaderMatch[2]
      }) ?? text;
    }

    const receiptNumberHeaderMatch = text.match(/^(.+)\s+-\s+Receipt\s+#(\d+)$/i);
    if (receiptNumberHeaderMatch) {
      return this.formatLiteralTemplate('__pattern.receiptNumberHeader', {
        label: this.translateFragment(receiptNumberHeaderMatch[1]),
        value: receiptNumberHeaderMatch[2]
      }) ?? text;
    }

    const purchaseNumberHeaderMatch = text.match(/^(.+)\s+-\s+Purchase\s+#(\d+)$/i);
    if (purchaseNumberHeaderMatch) {
      return this.formatLiteralTemplate('__pattern.purchaseNumberHeader', {
        label: this.translateFragment(purchaseNumberHeaderMatch[1]),
        value: purchaseNumberHeaderMatch[2]
      }) ?? text;
    }

    const orderHeaderMatch = text.match(/^(.+)\s+-\s+Order\s+#(\d+)$/i);
    if (orderHeaderMatch) {
      return this.formatLiteralTemplate('__pattern.orderHeader', {
        label: this.translateFragment(orderHeaderMatch[1]),
        value: orderHeaderMatch[2]
      }) ?? text;
    }

    const trailingHashMatch = text.match(/^(.+)\s+-\s+#(\d+)$/i);
    if (trailingHashMatch) {
      return this.formatLiteralTemplate('__pattern.trailingHash', {
        label: this.translateFragment(trailingHashMatch[1]),
        value: trailingHashMatch[2]
      }) ?? text;
    }

    const numberedEntityMatch = text.match(/^(.+?)\s+#(\d+)$/i);
    if (numberedEntityMatch) {
      return this.formatLiteralTemplate('__pattern.numberedEntity', {
        label: this.translateFragment(numberedEntityMatch[1]),
        value: numberedEntityMatch[2]
      }) ?? text;
    }

    const lastSyncMatch = text.match(/^Last sync:\s+(.+)$/i);
    if (lastSyncMatch) {
      return this.formatLiteralTemplate('__pattern.lastSync', {
        value: lastSyncMatch[1]
      }) ?? text;
    }

    const orderMatch = text.match(/^Order\s+(\d+)$/i);
    if (orderMatch) {
      return this.formatLiteralTemplate('__pattern.orderNumber', {
        value: orderMatch[1]
      }) ?? text;
    }

    const showingTransactionsMatch = text.match(/^Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+transactions$/i);
    if (showingTransactionsMatch) {
      return this.formatLiteralTemplate('__pattern.showingTransactions', {
        from: showingTransactionsMatch[1],
        to: showingTransactionsMatch[2],
        total: showingTransactionsMatch[3]
      }) ?? text;
    }

    const showingMatch = text.match(/^Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+(.+)$/i);
    if (showingMatch) {
      return this.formatLiteralTemplate('__pattern.showing', {
        from: showingMatch[1],
        to: showingMatch[2],
        total: showingMatch[3],
        entity: this.translateFragment(showingMatch[4])
      }) ?? text;
    }

    const greaterThanMatch = text.match(/^(.+)\s+must be greater than\s+(\d+)$/i);
    if (greaterThanMatch) {
      return this.formatLiteralTemplate('__pattern.greaterThan', {
        field: this.translateFragment(greaterThanMatch[1]),
        value: greaterThanMatch[2]
      }) ?? text;
    }

    const enterMatch = text.match(/^Enter\s+(.+)$/i);
    if (enterMatch) {
      return this.formatLiteralTemplate('__pattern.enter', {
        field: this.translateFragment(enterMatch[1])
      }) ?? text;
    }

    const selectedPermissionsMatch = text.match(/^Selected:\s+(\d+)\s+permissions$/i);
    if (selectedPermissionsMatch) {
      return this.formatLiteralTemplate('__pattern.selectedPermissions', {
        count: selectedPermissionsMatch[1]
      }) ?? text;
    }

    const permissionActionMatch = text.match(/^(Create|Edit|Delete|Get|Change|Validate|Has)\s+(.+)$/i);
    if (permissionActionMatch) {
      const verb = permissionActionMatch[1].toLowerCase();
      const target = this.translateFragment(permissionActionMatch[2]);
      const localizedVerb = this.getLiteralValue(`__verb.${verb}`) ?? permissionActionMatch[1];

      return `${localizedVerb} ${target}`;
    }

    const selectMatch = text.match(/^Select\s+(.+)$/i);
    if (selectMatch) {
      return this.formatLiteralTemplate('__pattern.select', {
        field: this.translateFragment(selectMatch[1])
      }) ?? text;
    }

    const loadingMatch = text.match(/^Loading\s+(.+)\.\.\.$/i);
    if (loadingMatch) {
      return this.formatLiteralTemplate('__pattern.loading', {
        field: this.translateFragment(loadingMatch[1])
      }) ?? text;
    }

    const noItemsFoundMatch = text.match(/^No\s+(.+)\s+found$/i);
    if (noItemsFoundMatch) {
      return this.formatLiteralTemplate('__pattern.noFound', {
        field: this.translateFragment(noItemsFoundMatch[1])
      }) ?? text;
    }

    const noAvailableMatch = text.match(/^No\s+(.+)\s+available$/i);
    if (noAvailableMatch) {
      return this.formatLiteralTemplate('__pattern.noAvailable', {
        field: this.translateFragment(noAvailableMatch[1])
      }) ?? text;
    }

    const noItemsOnlyMatch = text.match(/^No\s+(.+)$/i);
    if (noItemsOnlyMatch) {
      return this.formatLiteralTemplate('__pattern.noOnly', {
        field: this.translateFragment(noItemsOnlyMatch[1])
      }) ?? text;
    }

    const anyCommentsMatch = text.match(/^any comments for this (.+)$/i);
    if (anyCommentsMatch) {
      return this.formatLiteralTemplate('__pattern.anyCommentsForThis', {
        field: this.translateFragment(anyCommentsMatch[1])
      }) ?? text;
    }

    const deleteUserMatch = text.match(/^Are you sure you want to delete user:\s*(.+)\?$/i);
    if (deleteUserMatch) {
      return this.formatLiteralTemplate('__pattern.deleteUser', {
        value: deleteUserMatch[1]
      }) ?? text;
    }

    const deleteRoleMatch = text.match(/^Are you sure you want to delete role:\s*(.+)\?$/i);
    if (deleteRoleMatch) {
      return this.formatLiteralTemplate('__pattern.deleteRole', {
        value: deleteRoleMatch[1]
      }) ?? text;
    }

    const deleteReturnMatch = text.match(/^Are you sure you want to delete return order #(\d+)\?$/i);
    if (deleteReturnMatch) {
      return this.formatLiteralTemplate('__pattern.deleteReturn', {
        value: deleteReturnMatch[1]
      }) ?? text;
    }

    const deleteBatchMatch = text.match(/^Are you sure you want to delete this batch\?$/i);
    if (deleteBatchMatch) {
      return this.getLiteralValue('__pattern.deleteBatch') ?? text;
    }

    const requiredMatch = text.match(/^(.+)\s+is\s+required$/i);
    if (requiredMatch) {
      return this.formatLiteralTemplate('__pattern.required', {
        field: this.translateFragment(requiredMatch[1])
      }) ?? text;
    }

    return null;
  }

  private formatLiteralTemplate(key: string, params: Record<string, string | number>): string | null {
    const template = this.getLiteralValue(key);
    if (!template) {
      return null;
    }

    return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
      return result.replaceAll(`{{${paramKey}}}`, String(paramValue));
    }, template);
  }

  private getLiteralValue(key: string): string | null {
    return this.exactArabicTranslations[key] ?? this.exactArabicTranslations[key.toLowerCase()] ?? null;
  }

  private translateFragment(text: string): string {
    const normalized = text
      .replace(/^-+\s*/g, '')
      .replace(/\s*-+$/g, '')
      .trim();

    const exactMatch = this.getLiteralValue(normalized);
    if (exactMatch) {
      return exactMatch;
    }

    return normalized;
  }

  private normalizeLanguage(language: string | null | undefined): AppLanguage | null {
    if (!language) {
      return null;
    }

    const normalizedLanguage = language.toLowerCase().split('-')[0];

    return this.supportedLanguages.includes(normalizedLanguage as AppLanguage)
      ? (normalizedLanguage as AppLanguage)
      : null;
  }

  private shouldLocalizeDom(): boolean {
    return this.currentLanguage() === 'ar' && !this.isLoginPage();
  }

  private isLoginPage(): boolean {
    const location = this.document.defaultView?.location;
    const href = `${location?.pathname ?? ''}${location?.hash ?? ''}`.toLowerCase();
    return href.includes('/login');
  }
}
