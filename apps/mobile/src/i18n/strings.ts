import { dictionaries } from './dictionaries';
import { resolveDeviceLocale } from './locale';

export const activeLocale = resolveDeviceLocale();

export const strings = dictionaries[activeLocale];
