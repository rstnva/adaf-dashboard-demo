import {getRequestConfig} from 'next-intl/server';

const DEFAULT_LOCALE = 'es-MX' as const;

export default getRequestConfig(async ({locale}) => {
  const resolvedLocale = typeof locale === 'string' ? locale : DEFAULT_LOCALE;

  const messages = (await import(`../messages/${resolvedLocale}.json`)).default;

  return {
    locale: resolvedLocale,
    messages
  };
});
