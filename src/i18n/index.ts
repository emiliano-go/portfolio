import en from './en.json';
import es from './es.json';
import fr from './fr.json';

type Dict = Record<string, string>;
const dicts: Record<string, Dict> = { en, es, fr };

export function createT(lang: string): (key: string, fallback?: string) => string {
  const dict = dicts[lang] || en;
  return (key: string, fallback?: string): string =>
    (dict as any)[key] ?? fallback ?? key;
}
