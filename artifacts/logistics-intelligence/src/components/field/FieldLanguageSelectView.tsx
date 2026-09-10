import { useState, useMemo } from 'react';
import { Globe, Search, Check, Shield } from 'lucide-react';
import { VectorLogo } from '@/components/brand/VectorBrand';
import {
  type AppLanguage,
  SUPPORTED_LANGUAGES,
  getTranslations,
  setAppLanguage,
  setLanguageOnboarded,
} from '@/services/i18n';

interface FieldLanguageSelectViewProps {
  initialLanguage: AppLanguage;
  onContinue: (selectedLang: AppLanguage) => void;
  mode?: 'first-launch' | 'settings';
  onClose?: () => void;
}

export function FieldLanguageSelectView({
  initialLanguage,
  onContinue,
  mode = 'first-launch',
  onClose,
}: FieldLanguageSelectViewProps) {
  const [selected, setSelected] = useState<AppLanguage>(initialLanguage);
  const [searchQuery, setSearchQuery] = useState('');

  // Translations corresponding to currently highlighted or selected language
  const t = useMemo(() => getTranslations(selected), [selected]);

  // Unified searchable language list (No split into Recommended vs All)
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.englishName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  function handleConfirm() {
    setAppLanguage(selected);
    if (mode === 'first-launch') {
      setLanguageOnboarded(true);
    }
    onContinue(selected);
  }

  const isModal = mode === 'settings';

  const content = (
    <div className={`w-full ${isModal ? 'p-0' : 'mx-auto max-w-md px-4 py-8 sm:px-6'}`}>
      {/* Branding - only on first launch */}
      {!isModal && (
        <div className="mb-6 text-center">
          <VectorLogo size="md" layout="vertical" />
        </div>
      )}

      {/* Header */}
      <div className={`${isModal ? 'mb-5' : 'mb-6 text-center'}`}>
        <div className={`flex items-center gap-2 ${isModal ? '' : 'justify-center'} mb-1.5`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
            <Globe className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
            {t.chooseLanguageTitle}
          </h1>
        </div>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
          {t.chooseLanguageSubtitle}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          id="language-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchLanguagePlaceholder}
          className="block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      {/* ONE Unified Language List (Radio / Card selection) */}
      <div
        id="unified-language-list"
        role="radiogroup"
        aria-label={t.chooseLanguageTitle}
        className="space-y-2.5 max-h-[340px] overflow-y-auto overscroll-contain pr-0.5"
      >
        {filteredLanguages.map((lang) => {
          const isChosen = selected === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              id={`lang-option-${lang.code}`}
              role="radio"
              aria-checked={isChosen}
              onClick={() => setSelected(lang.code)}
              className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all active:scale-[0.99] min-h-[58px] ${
                isChosen
                  ? 'border-neutral-900 bg-neutral-950 text-white shadow-sm ring-1 ring-neutral-950'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs uppercase ${
                    isChosen
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                  }`}
                >
                  {lang.code}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm truncate">
                      {lang.nativeName}
                    </span>
                    {lang.nativeName !== lang.englishName && (
                      <span
                        className={`text-xs ${
                          isChosen ? 'text-neutral-300' : 'text-neutral-500'
                        }`}
                      >
                        — {lang.englishName}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] block ${
                      isChosen ? 'text-neutral-400' : 'text-neutral-400'
                    }`}
                  >
                    {lang.script} script
                  </span>
                </div>
              </div>

              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isChosen
                    ? 'border-emerald-400 bg-emerald-500 text-white'
                    : 'border-neutral-300 bg-transparent'
                }`}
              >
                {isChosen && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
              </div>
            </button>
          );
        })}

        {filteredLanguages.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-xs text-neutral-500">
            No languages match your search.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          id="btn-language-continue"
          onClick={handleConfirm}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white shadow-xs transition-transform active:scale-[0.99] hover:bg-black"
        >
          {isModal ? t.saveLanguageBtn : t.continueBtn}
        </button>

        {isModal && onClose && (
          <button
            type="button"
            id="btn-language-cancel"
            onClick={onClose}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            {t.cancel}
          </button>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
        <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-h-dvh flex-col justify-center bg-neutral-100/70 p-4">
      {content}
    </div>
  );
}
