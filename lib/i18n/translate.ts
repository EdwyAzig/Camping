import type { Messages } from "./types";

export type TranslateParams = Record<string, string | number>;

export function getNestedValue(obj: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function createTranslator(messages: Messages) {
  return function t(key: string, params?: TranslateParams): string {
    const template = getNestedValue(messages, key) ?? key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, token: string) =>
      params[token] !== undefined ? String(params[token]) : `{${token}}`
    );
  };
}

export type TFunction = ReturnType<typeof createTranslator>;
