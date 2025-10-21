import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es-MX'] as const,
  defaultLocale: 'es-MX',
  localePrefix: 'never'
});

export type AppLocale = (typeof routing.locales)[number];
