import { FALLBACK_LANGUAGE } from "../Enum/EnvironmentVariable";
import { getCookie } from "../Utils/Cookies";

export type Language = {
    language: string;
    country: string;
};

type LanguageObject = {
    [key: string]: string | LanguageObject;
};

type TranslationParams = {
    [key: string]: string | number
};

export class Translator {
    private static instance: Translator;

    /**
     * Fallback language use if the current doesn't have the translation key
     */
    public static readonly fallbackLanguage: Language = Translator.getLanguageByString(FALLBACK_LANGUAGE) || {
        language: "en",
        country: "US",
    };

    /**
     * Contain all translation keys of fallback language.
     */
    private static readonly fallbackLanguageObject: LanguageObject = FALLBACK_LANGUAGE_OBJECT as LanguageObject;

    /**
     * Current language
     */
    private currentLanguage: Language;

    /**
     * Contain all translation keys of current language
     */
    private currentLanguageObject: LanguageObject;

    private constructor() {
        this.currentLanguage = Translator.fallbackLanguage;
        this.currentLanguageObject = Translator.fallbackLanguageObject;

        this.defineCurrentLanguage();
    }

    /**
     * Return the singleton instance
     * @returns {Translator} Singleton instance
     */
    public static getInstance(): Translator {
        return this.instance || (this.instance = new this());
    }

    /**
     * Get language object from string who respect the RFC 5646
     * @param {string} languageString RFC 5646 formatted string
     * @returns {Language|undefined} Language object who represent the languageString
     */
    public static getLanguageByString(languageString: string): Language | undefined {
        const parts = languageString.split("-");
        if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) {
            console.error(`Language string "${languageString}" do not respect RFC 5646 with language and country code`);
            return undefined;
        }

        return {
            language: parts[0].toLowerCase(),
            country: parts[1].toUpperCase(),
        };
    }

    /**
     * Get a string who respect the RFC 5646 by a language object
     * @param {Language} language A language object
     * @returns {string|undefined} String who represent the language object
     */
    public static getStringByLanguage(language: Language): string | undefined {
        return `${language.language}-${language.country}`;
    }

    /**
     * Add the current language file loading into Phaser loader queue
     * @param {Phaser.Loader.LoaderPlugin} pluginLoader Phaser LoaderPLugin
     */
    public loadCurrentLanguageFile(pluginLoader: Phaser.Loader.LoaderPlugin) {
        const languageString = Translator.getStringByLanguage(this.currentLanguage);
        pluginLoader.json({
            key: `language-${languageString}`,
            url: `resources/translations/${languageString}.json`,
        });
    }

    /**
     * Get from the Phase cache the current language object and promise to load it
     * @param {Phaser.Cache.CacheManager} cacheManager Phaser CacheManager
     * @returns {Promise<void>} Load current language promise
     */
    public loadCurrentLanguageObject(cacheManager: Phaser.Cache.CacheManager): Promise<void> {
        return new Promise((resolve, reject) => {
            const languageObject: Object = cacheManager.json.get(
                `language-${Translator.getStringByLanguage(this.currentLanguage)}`
            );

            if (!languageObject) {
                return reject();
            }

            this.currentLanguageObject = languageObject as LanguageObject;
            return resolve();
        });
    }

    /**
     * Get the language for RFC 5646 2 char string from availables languages
     * @param {string} languageString Language RFC 5646 string
     * @returns {Language|undefined} Language object who represent the languageString
     */
    public static getLanguageWithoutCountry(languageString: string): Language | undefined {
        if (languageString.length !== 2) {
            return undefined;
        }

        let languageFound = undefined;

        const languages: { [key: string]: boolean } = LANGUAGES as { [key: string]: boolean };

        for (const language in languages) {
            if (language.startsWith(languageString) && languages[language]) {
                languageFound = Translator.getLanguageByString(language);
                break;
            }
        }

        return languageFound;
    }

    /**
     * Define the current language by the navigator or a cookie
     */
    private defineCurrentLanguage() {
        const navigatorLanguage: string | undefined = navigator.language;
        const cookieLanguage = getCookie("language");
        let currentLanguage = undefined;

        if (cookieLanguage && typeof cookieLanguage === "string") {
            const cookieLanguageObject = Translator.getLanguageByString(cookieLanguage);
            if (cookieLanguageObject) {
                currentLanguage = cookieLanguageObject;
            }
        }

        if (!currentLanguage && navigatorLanguage) {
            const navigatorLanguageObject =
                navigator.language.length === 2
                    ? Translator.getLanguageWithoutCountry(navigatorLanguage)
                    : Translator.getLanguageByString(navigatorLanguage);
            if (navigatorLanguageObject) {
                currentLanguage = navigatorLanguageObject;
            }
        }

        if (!currentLanguage || currentLanguage === Translator.fallbackLanguage) {
            return;
        }

        this.currentLanguage = currentLanguage;
    }

    /**
     * Get value on object by property path
     * @param {string} key Translation key
     * @param {LanguageObject} object Language object
     * @returns {string|undefined} Found translation by path
     */
    private getObjectValueByPath(key: string, object: LanguageObject): string | undefined {
        const paths = key.split(".");
        let currentValue: LanguageObject | string = object;

        for (const path of paths) {
            if (typeof currentValue === "string" || currentValue[path] === undefined) {
                return undefined;
            }

            currentValue = currentValue[path];
        }

        if (typeof currentValue !== "string") {
            return undefined;
        }

        return currentValue;
    }

    /**
     * Replace {{ }} tags on a string by the params values
     * @param {string} string Translation string
     * @param {{ [key: string]: string | number }} params Tags to replace by value
     * @returns {string} Formatted string
     */
    private formatStringWithParams(string: string, params: TranslationParams): string {
        let formattedString = string;

        for (const param in params) {
            const regex = `/{{\\s*\\${param}\\s*}}/g`;
            formattedString = formattedString.replace(new RegExp(regex), params[param].toString());
        }

        return formattedString;
    }

    /**
     * Get translation by a key and formatted with params by {{ }} tag
     * @param {string} key Translation key
     * @param {{ [key: string]: string | number }} params Tags to replace by value
     * @returns {string} Translation formatted
     */
    public trans(key: string, params?: TranslationParams): string {
        const currentLanguageValue = this.getObjectValueByPath(key, this.currentLanguageObject);

        if (currentLanguageValue) {
            return params ? this.formatStringWithParams(currentLanguageValue, params) : currentLanguageValue;
        }

        const fallbackLanguageValue = this.getObjectValueByPath(key, Translator.fallbackLanguageObject);

        if (fallbackLanguageValue) {
            return params ? this.formatStringWithParams(fallbackLanguageValue, params) : fallbackLanguageValue;
        }

        return key;
    }

    /**
     * Get translation by a key and formatted with params by {{ }} tag
     * @param {string} key Translation key
     * @param {{ [key: string]: string | number }} params Tags to replace by value
     * @returns {string} Translation formatted
     */
    public static trans(key: string, params?: { [key: string]: string | number }): string {
        const instance = Translator.getInstance();
        return instance.trans(key, params);
    }
}
