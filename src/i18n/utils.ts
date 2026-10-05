// src/i18n/utils.ts
import { TRANSLATIONS, type Lang } from "./translations";

export const DEFAULT_LANG: Lang = "ru";
export const SUPPORTED_LANGS: Lang[] = ["ru", "uz", "en"];

export function isValidLang(lang: string): lang is Lang {
  return SUPPORTED_LANGS.includes(lang as Lang);
}

export function useTranslations(lang: Lang = DEFAULT_LANG) {
  const currentDict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];

  return function t(key: string, fallback: string = ""): string {
    return currentDict[key] ?? TRANSLATIONS[DEFAULT_LANG][key] ?? fallback;
  };
}
