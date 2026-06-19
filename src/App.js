import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, getDocs, doc, deleteDoc, onSnapshot, query, serverTimestamp,
} from 'firebase/firestore';
import {
  Star, Volume2, History, Trash2, Search, BookOpen, Sparkles, Info, X, Shuffle,
  BrainCircuit, BookHeart, Settings, Languages, Sun, Moon,
} from 'lucide-react';
import { auth, db, appId, track } from './config/firebase';
import { analyzeWord, translateTexts } from './services/gemini';
import dailyWords from './data/dailyWords';
import randomEnWords from './data/randomEnWords';
import randomKuWords from './data/randomKuWords';
import advancedWords from './data/advancedWords';

// Bilingual brand mark (Sorani + Latin).
const BRAND = 'فەرهەنگی ژیر | Ferhengî Jîr';

// --- i18n (Internationalization) for UI Text ---
const uiText = {
    ku: {
        title: BRAND,
        searchPlaceholder: "بۆ وشەیەک بگەڕێ...",
        searchButton: "گەڕان",
        searchingText: "گەڕان...",
        clearInput: "سڕینەوە",
        navHome: "سەرەکی",
        navFavorites: "دڵخوازەکان",
        navHistory: "مێژوو",
        wordOfTheDay: "وشەی ڕۆژ",
        randomEnglish: "وشەی ئینگلیزیی هەڕەمەکی",
        randomKurdish: "وشەی کوردیی هەڕەمەکی",
        advancedWord: "وشەی پێشکەوتوو",
        favoritesTitle: "وشە دڵخوازەکان",
        historyTitle: "مێژووی گەڕان",
        noFavorites: "هیچ وشەیەکی دڵخوازت نییە.",
        noHistory: "مێژووی گەڕان بەتاڵە.",
        clearHistory: "سڕینەوەی مێژوو",
        partOfSpeech: "جۆری وشە",
        meanings: "واتاکان",
        synonyms: "هاوواتاکان",
        antonyms: "دژەواتاکان",
        informalMeanings: "شێوازی نافەرمی و ناوچەیی",
        otherLanguages: "وەرگێڕان بە زمانەکانی تر",
        error: "هەڵەیەک ڕوویدا، تکایە دووبارە هەوڵبدەرەوە.",
        rateLimited: "داواکارییەکانت زۆرن، تکایە چەند چرکەیەک چاوەڕێ بکە.",
        developedBy: "پەرەپێدراوە لەلایەن سەرچیا و چۆخۆس",
        infoTitle: "دەربارەی فەرهەنگی ژیر",
        infoP1: "فەرهەنگی ژیر ئامرازێکی زیرەک و پێشکەوتووە بۆ فێرخوازانی زمان. بە بەکارهێنانی هێزی AI، وەرگێڕان و شیکردنەوەی ورد بۆ وشەکان دابین دەکات.",
        infoP2: "تایبەتمەندییەکان:",
        infoL1: "وەرگێڕانی ورد و ڕوونکردنەوەی فرەواتایی.",
        infoL2: "نموونەی ڕستەیی بۆ تێگەیشتنی باشتر.",
        infoL3: "وەرگێڕانی ڕوونکردنەوەکان بۆ ئینگلیزی.",
        infoL4: "هاوواتا، دژەواتا، و بەکارهێنانی نافەرمی.",
        infoL5: "وەرگێڕان بۆ چەندین زمانی جیاواز.",
        infoP3: "لە ڕێکخستنەکاندا دەتوانیت ڕووکاری فەرهەنگەکە بەپێی خواستی خۆت بگۆڕیت، وەک گۆڕینی ڕەنگی سەرەکی و فۆنت. هیوادارین ئەم ئامرازە سوودبەخش بێت لە گەشتی فێربوونی زمانەکەتدا!",
        settingsTitle: "ڕێکخستنەکان",
        settingsDisplay: "ڕێکخستنەکانی پیشاندان",
        settingsShowExamples: "پیشاندانی نموونەکان",
        settingsShowSynonyms: "پیشاندانی هاوواتا و دژەواتاکان",
        settingsShowInformal: "پیشاندانی بەکارهێنانی نافەرمی",
        settingsShowMultiLang: "پیشاندانی وەرگێڕانەکان",
        settingsAppearance: "ڕووکار",
        settingsFont: "فۆنت",
        settingsLanguage: "زمانی ڕووکار",
        settingsTheme: "ڕەنگی سەرەکی",
        settingsColorMode: "دۆخی ڕووناکی",
        modeLight: "ڕووناک",
        modeDark: "تاریک",
        modeSystem: "سیستەم",
        langKurdish: "کوردی",
        langEnglish: "English",
        ariaSettings: "ڕێکخستنەکان",
        ariaInfo: "زانیاری",
        ariaToggleMode: "گۆڕینی دۆخی ڕووناکی",
        ariaFavorite: "زیادکردن بۆ دڵخوازەکان",
        ariaSpeak: "خوێندنەوەی دەنگی",
        ariaTranslate: "وەرگێڕان بۆ ئینگلیزی",
        ariaDelete: "سڕینەوە",
        ariaClose: "داخستن",
    },
    en: {
        title: BRAND,
        searchPlaceholder: "Search for a word...",
        searchButton: "Search",
        searchingText: "Searching...",
        clearInput: "Clear",
        navHome: "Home",
        navFavorites: "Favorites",
        navHistory: "History",
        wordOfTheDay: "Word of the Day",
        randomEnglish: "Random English Word",
        randomKurdish: "Random Kurdish Word",
        advancedWord: "Advanced Word",
        favoritesTitle: "Favorite Words",
        historyTitle: "Search History",
        noFavorites: "You have no favorite words yet.",
        noHistory: "Your search history is empty.",
        clearHistory: "Clear History",
        partOfSpeech: "Part of Speech",
        meanings: "Meanings",
        synonyms: "Synonyms",
        antonyms: "Antonyms",
        informalMeanings: "Informal & Dialectal Usage",
        otherLanguages: "Translations in Other Languages",
        error: "Failed to get translation. Please try again.",
        rateLimited: "Too many requests. Please wait a few seconds.",
        developedBy: "Developed by Sarchia & Choxos",
        infoTitle: "About Ferhengî Jîr",
        infoP1: "Ferhengî Jîr is a smart and advanced tool for language learners. Using the power of AI, it provides accurate translations and detailed analysis for words.",
        infoP2: "Features include:",
        infoL1: "Accurate translations and multiple meanings.",
        infoL2: "Example sentences for better context.",
        infoL3: "On-demand translation of explanations into English.",
        infoL4: "Synonyms, antonyms, and informal usage.",
        infoL5: "Translations into several other languages.",
        infoP3: "In the settings, you can customize the dictionary's appearance, including the theme color and font. We hope you find this tool helpful on your language learning journey!",
        settingsTitle: "Settings",
        settingsDisplay: "Display Settings",
        settingsShowExamples: "Show Examples",
        settingsShowSynonyms: "Show Synonyms & Antonyms",
        settingsShowInformal: "Show Informal Usage",
        settingsShowMultiLang: "Show Multi-Language Translations",
        settingsAppearance: "Appearance",
        settingsFont: "Font",
        settingsLanguage: "Interface Language",
        settingsTheme: "Theme Color",
        settingsColorMode: "Appearance Mode",
        modeLight: "Light",
        modeDark: "Dark",
        modeSystem: "System",
        langKurdish: "کوردی",
        langEnglish: "English",
        ariaSettings: "Settings",
        ariaInfo: "Information",
        ariaToggleMode: "Toggle light/dark mode",
        ariaFavorite: "Toggle favorite",
        ariaSpeak: "Pronounce",
        ariaTranslate: "Translate to English",
        ariaDelete: "Delete",
        ariaClose: "Close",
    },
    kmr: {
        title: BRAND,
        searchPlaceholder: "Li peyvekê bigere...",
        searchButton: "Lêgerîn",
        searchingText: "Tê gerîn...",
        clearInput: "Paqij bike",
        navHome: "Destpêk",
        navFavorites: "Bijarte",
        navHistory: "Dîrok",
        wordOfTheDay: "Peyva Rojê",
        randomEnglish: "Peyva Îngilîzî ya Tesadufî",
        randomKurdish: "Peyva Kurdî ya Tesadufî",
        advancedWord: "Peyva Pêşketî",
        favoritesTitle: "Peyvên Bijarte",
        historyTitle: "Dîroka Lêgerînê",
        noFavorites: "Hêj peyvên te yên bijarte tune ne.",
        noHistory: "Dîroka te ya lêgerînê vala ye.",
        clearHistory: "Dîrokê Paqij Bike",
        partOfSpeech: "Cureyê peyvê",
        meanings: "Wate",
        synonyms: "Hevwate",
        antonyms: "Dijwate",
        informalMeanings: "Bikaranîna ne-fermî û herêmî",
        otherLanguages: "Werger bi zimanên din",
        error: "Werger nehat standin. Ji kerema xwe dîsa biceribîne.",
        rateLimited: "Daxwaz pir zêde ne. Ji kerema xwe çend saniyan bisekine.",
        developedBy: "Ji aliyê Sarchia û Choxos ve hatiye pêşxistin",
        infoTitle: "Derbarê Ferhengî Jîr",
        infoP1: "Ferhengî Jîr amûreke jîr û pêşketî ye ji bo fêrbûyên ziman. Bi hêza AIyê, ji bo peyvan wergerên rast û şîroveyeke berfireh peyda dike.",
        infoP2: "Taybetmendî:",
        infoL1: "Wergerên rast û gelek wate.",
        infoL2: "Hevokên nimûne ji bo têgihiştineke baştir.",
        infoL3: "Wergera ravekirinan bo Îngilîzî li ser daxwazê.",
        infoL4: "Hevwate, dijwate û bikaranîna ne-fermî.",
        infoL5: "Werger bo gelek zimanên din.",
        infoP3: "Di mîhengan de, dikarî xuyakirina ferhengê li gorî dilê xwe biguherî, wek rengê temayê û font. Hêvî dikin ev amûr di rêwîtiya fêrbûna zimanê te de bibe alîkar!",
        settingsTitle: "Mîheng",
        settingsDisplay: "Mîhengên Xuyakirinê",
        settingsShowExamples: "Nimûneyan Nîşan Bide",
        settingsShowSynonyms: "Hevwate û Dijwateyan Nîşan Bide",
        settingsShowInformal: "Bikaranîna Ne-fermî Nîşan Bide",
        settingsShowMultiLang: "Wergerên Pirzimanî Nîşan Bide",
        settingsAppearance: "Xuyakirin",
        settingsFont: "Font",
        settingsLanguage: "Zimanê Navrûyê",
        settingsTheme: "Rengê Temayê",
        settingsColorMode: "Moda Xuyakirinê",
        modeLight: "Ronî",
        modeDark: "Tarî",
        modeSystem: "Pergal",
        langKurdish: "کوردی",
        langEnglish: "English",
        ariaSettings: "Mîheng",
        ariaInfo: "Agahî",
        ariaToggleMode: "Guherandina moda ronî/tarî",
        ariaFavorite: "Bijarte",
        ariaSpeak: "Bilêvkirin",
        ariaTranslate: "Wergerîne Îngilîzî",
        ariaDelete: "Jê bibe",
        ariaClose: "Bigire",
    }
};

// --- Theme Configuration ---
const themes = {
    indigo: { name: 'Indigo', text: 'text-indigo-500', bg: 'bg-indigo-500', ring: 'ring-indigo-500', border: 'border-indigo-500', hoverBg: 'hover:bg-indigo-600', darkHoverBg: 'dark:hover:bg-indigo-700', highlight: 'text-indigo-500 dark:text-indigo-400' },
    slate: { name: 'Slate', text: 'text-slate-500', bg: 'bg-slate-500', ring: 'ring-slate-500', border: 'border-slate-500', hoverBg: 'hover:bg-slate-600', darkHoverBg: 'dark:hover:bg-slate-700', highlight: 'text-slate-500 dark:text-slate-400' },
    blue: { name: 'Blue', text: 'text-blue-600', bg: 'bg-blue-600', ring: 'ring-blue-600', border: 'border-blue-600', hoverBg: 'hover:bg-blue-700', darkHoverBg: 'dark:hover:bg-blue-800', highlight: 'text-blue-600 dark:text-blue-500' },
    green: { name: 'Green', text: 'text-green-600', bg: 'bg-green-600', ring: 'ring-green-600', border: 'border-green-600', hoverBg: 'hover:bg-green-700', darkHoverBg: 'dark:hover:bg-green-800', highlight: 'text-green-600 dark:text-green-500' },
    red: { name: 'Red', text: 'text-red-600', bg: 'bg-red-600', ring: 'ring-red-600', border: 'border-red-600', hoverBg: 'hover:bg-red-700', darkHoverBg: 'dark:hover:bg-red-800', highlight: 'text-red-600 dark:text-red-500' },
};

// --- Persisted state helper (localStorage-backed) ---
function usePersistentState(key, initial) {
    const [value, setValue] = useState(() => {
        try {
            const stored = window.localStorage.getItem(key);
            return stored !== null ? JSON.parse(stored) : initial;
        } catch {
            return initial;
        }
    });
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            /* storage unavailable (private mode); ignore */
        }
    }, [key, value]);
    return [value, setValue];
}

// --- Main App Component ---
export default function App() {
    const [page, setPage] = useState('home');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    // Bumping this remounts DictionaryApp, clearing any open search result so the
    // landing tiles reappear (used when the brand/Home is clicked).
    const [homeNonce, setHomeNonce] = useState(0);

    const [uiLang, setUiLang] = usePersistentState('fj_uiLang', 'ku');
    const [font, setFont] = usePersistentState('fj_font', 'font-vazirmatn');
    const [themeName, setThemeName] = usePersistentState('fj_theme', 'indigo');
    const [colorMode, setColorMode] = usePersistentState('fj_colorMode', 'system');
    const [settings, setSettings] = usePersistentState('fj_settings', {
        showExamples: true,
        showSynonyms: true,
        showInformal: true,
        showMultiLang: true,
    });

    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    const theme = themes[themeName] || themes.indigo;

    useEffect(() => {
        document.documentElement.lang = uiLang;
        document.documentElement.dir = uiLang === 'ku' ? 'rtl' : 'ltr';
    }, [uiLang]);

    useEffect(() => {
        document.body.className = font;
    }, [font]);

    // Apply light/dark mode to <html> (Tailwind class strategy) and keep it in
    // sync with the OS preference when in "system" mode.
    useEffect(() => {
        const root = document.documentElement;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            const dark = colorMode === 'dark' || (colorMode === 'system' && mq.matches);
            root.classList.toggle('dark', dark);
            setIsDark(dark);
        };
        apply();
        if (colorMode === 'system') {
            mq.addEventListener('change', apply);
            return () => mq.removeEventListener('change', apply);
        }
        return undefined;
    }, [colorMode]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Authentication Error:", error);
                }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const t = useMemo(() => uiText[uiLang], [uiLang]);

    const goHome = useCallback(() => {
        setHomeNonce((n) => n + 1);
        setPage('home');
    }, []);

    const navItems = useMemo(() => [
        { id: 'home', label: t.navHome, icon: <Search className="h-5 w-5" /> },
        { id: 'favorites', label: t.navFavorites, icon: <Star className="h-5 w-5" /> },
        { id: 'history', label: t.navHistory, icon: <History className="h-5 w-5" /> },
    ], [t]);

    const renderPage = () => {
        if (!isAuthReady) {
            return <div className="flex justify-center items-center h-[60vh]"><LoadingIndicator t={t} theme={theme} /></div>;
        }
        switch (page) {
            case 'favorites':
                return <FavoritesPage userId={userId} t={t} theme={theme} />;
            case 'history':
                return <HistoryPage userId={userId} t={t} theme={theme} />;
            case 'home':
            default:
                return <DictionaryApp key={homeNonce} userId={userId} t={t} settings={settings} theme={theme} uiLang={uiLang} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors">
            <Navbar
                navItems={navItems}
                setPage={setPage}
                onHome={goHome}
                currentPage={page}
                t={t}
                theme={theme}
                isDark={isDark}
                onToggleMode={() => setColorMode(isDark ? 'light' : 'dark')}
                onInfoClick={() => setIsInfoModalOpen(true)}
                onSettingsClick={() => setIsSettingsModalOpen(true)}
            />
            <main className="p-4 md:p-8 pb-24 md:pb-8">
                {renderPage()}
            </main>
            <Footer t={t} />
            <BottomNav navItems={navItems} currentPage={page} setPage={setPage} onHome={goHome} theme={theme} />
            {isInfoModalOpen && <InfoModal t={t} theme={theme} onClose={() => setIsInfoModalOpen(false)} />}
            {isSettingsModalOpen && (
                <SettingsModal
                    t={t} settings={settings} setSettings={setSettings}
                    font={font} setFont={setFont}
                    uiLang={uiLang} setUiLang={setUiLang}
                    theme={theme} themeName={themeName} setThemeName={setThemeName}
                    colorMode={colorMode} setColorMode={setColorMode}
                    onClose={() => setIsSettingsModalOpen(false)}
                />
            )}
        </div>
    );
}

// --- Navigation Bar ---
function Navbar({ navItems, setPage, onHome, currentPage, t, theme, isDark, onToggleMode, onInfoClick, onSettingsClick }) {
    const iconBtn = "p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors";
    return (
        <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 gap-2">
                    <button onClick={onHome} className="flex items-center cursor-pointer bg-transparent border-none p-0 min-w-0">
                        <BookOpen className={`h-8 w-8 shrink-0 ${theme.text}`} />
                        <span className={`font-bold text-lg sm:text-2xl mx-2 truncate ${theme.text}`}>{t.title}</span>
                    </button>
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <button key={item.id} onClick={() => (item.id === 'home' ? onHome() : setPage(item.id))}
                                aria-current={currentPage === item.id ? 'page' : undefined}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ currentPage === item.id ? `${theme.text} font-bold bg-transparent border-2 ${theme.border}` : `text-slate-600 dark:text-slate-300 bg-transparent border-2 border-transparent hover:bg-slate-200 dark:hover:bg-slate-800` }`}>
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={onToggleMode} aria-label={t.ariaToggleMode} className={iconBtn}>
                            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <button onClick={onSettingsClick} aria-label={t.ariaSettings} className={iconBtn}><Settings className="h-5 w-5" /></button>
                        <button onClick={onInfoClick} aria-label={t.ariaInfo} className={iconBtn}><Info className="h-5 w-5" /></button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

// --- Mobile bottom navigation ---
function BottomNav({ navItems, currentPage, setPage, onHome, theme }) {
    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-around">
                {navItems.map((item) => (
                    <button key={item.id} onClick={() => (item.id === 'home' ? onHome() : setPage(item.id))}
                        aria-current={currentPage === item.id ? 'page' : undefined}
                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${currentPage === item.id ? theme.text : 'text-slate-500 dark:text-slate-400'}`}>
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

// --- Main Dictionary Component ---
function DictionaryApp({ userId, t, settings, theme, uiLang }) {
    const [word, setWord] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [searchTrigger, setSearchTrigger] = useState({ word: null, lang: null });
    const [recent, setRecent] = usePersistentState('fj_recent', []);

    const cacheRef = useRef(new Map());
    const abortRef = useRef(null);

    // The Kurdish variant the analysis is written in follows the UI language:
    // Kurmancî UI -> Kurmanji analysis; Sorani/English UI -> Sorani analysis.
    const variant = uiLang === 'kmr' ? 'kurmanji' : 'sorani';

    // Local autocomplete suggestions: recent searches first, then favorited words.
    const suggestions = useMemo(() => {
        const seen = new Set();
        const out = [];
        for (const w of [...recent, ...favorites.map((f) => f.word)]) {
            const key = (w || '').toLowerCase();
            if (w && !seen.has(key)) { seen.add(key); out.push(w); }
        }
        return out.slice(0, 12);
    }, [recent, favorites]);

    const favoritesCollectionRef = useMemo(
        () => (userId ? collection(db, `/artifacts/${appId}/users/${userId}/favorites`) : null),
        [userId]
    );
    const historyCollectionRef = useMemo(
        () => (userId ? collection(db, `/artifacts/${appId}/users/${userId}/history`) : null),
        [userId]
    );

    const handleSearch = useCallback(async (searchTerm, searchLang) => {
        const term = (searchTerm ?? word).trim();
        if (!term) return;

        const isKurdish = /[؀-ۿ]/.test(term);
        const direction = searchLang || (isKurdish ? 'ku-to-en' : 'en-to-ku');
        const cacheKey = `${variant}:${direction}:${term.toLowerCase()}`;

        // Cancel any in-flight request so a slow earlier search can't overwrite
        // a newer one (fixes a result race condition).
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setError(null);
        setSearchResult(null);

        try {
            let data;
            if (cacheRef.current.has(cacheKey)) {
                data = cacheRef.current.get(cacheKey);
            } else {
                data = await analyzeWord(term, direction, variant, controller.signal);
                cacheRef.current.set(cacheKey, data);
            }
            if (controller.signal.aborted) return;

            const resultData = { word: term, ...data, lang: direction, variant };
            setSearchResult(resultData);
            setRecent((prev) => [term, ...prev.filter((w) => (w || '').toLowerCase() !== term.toLowerCase())].slice(0, 10));
            track('search', { direction, term });
            if (historyCollectionRef) {
                addDoc(historyCollectionRef, { ...resultData, timestamp: serverTimestamp() }).catch((e) =>
                    console.error('History write failed', e)
                );
            }
        } catch (e) {
            if (e.name === 'AbortError' || controller.signal.aborted) return;
            console.error('API Error:', e);
            setError(e.status === 429 ? t.rateLimited : t.error);
        } finally {
            if (abortRef.current === controller) {
                setIsLoading(false);
                abortRef.current = null;
            }
        }
    }, [word, variant, historyCollectionRef, t.error, t.rateLimited, setRecent]);

    useEffect(() => {
        if (searchTrigger.word) {
            setWord(searchTrigger.word);
            handleSearch(searchTrigger.word, searchTrigger.lang);
            setSearchTrigger({ word: null, lang: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTrigger]);

    useEffect(() => {
        if (!favoritesCollectionRef) return undefined;
        const unsubscribe = onSnapshot(favoritesCollectionRef, (snapshot) => {
            setFavorites(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [favoritesCollectionRef]);

    // Abort any pending request on unmount.
    useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

    const isFavorited = (originalWord) => favorites.some((fav) => fav.word === originalWord);

    const handleFavorite = async (item) => {
        if (!favoritesCollectionRef) return;
        if (isFavorited(item.word)) {
            const favDoc = favorites.find((fav) => fav.word === item.word);
            if (favDoc) await deleteDoc(doc(db, `/artifacts/${appId}/users/${userId}/favorites`, favDoc.id));
        } else {
            await addDoc(favoritesCollectionRef, { ...item, timestamp: serverTimestamp() });
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full">
                        <Search className="absolute top-1/2 -translate-y-1/2 start-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder={t.searchPlaceholder}
                            aria-label={t.searchPlaceholder}
                            list="search-suggestions"
                            autoComplete="off"
                            className={`w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 ps-12 pe-12 py-4 rounded-lg focus:outline-none focus:ring-2 ${theme.ring} transition duration-300`}
                        />
                        {suggestions.length > 0 && (
                            <datalist id="search-suggestions">
                                {suggestions.map((s) => <option key={s} value={s} />)}
                            </datalist>
                        )}
                        {word && (
                            <button onClick={() => setWord('')} aria-label={t.clearInput}
                                className="absolute top-1/2 -translate-y-1/2 end-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <button onClick={() => handleSearch()} disabled={isLoading}
                        className={`w-full sm:w-auto px-8 py-4 ${theme.bg} text-white font-bold rounded-lg ${theme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2`}>
                        {t.searchButton}
                    </button>
                </div>
            </div>

            {isLoading && <div className="mt-8"><LoadingIndicator t={t} theme={theme} /></div>}
            {!searchResult && !isLoading && <HomePageFeatures t={t} onWordClick={setSearchTrigger} uiLang={uiLang} />}
            {error && <div role="alert" className="mt-6 text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">{error}</div>}
            {searchResult && <SearchResultDisplay result={searchResult} t={t} speak={speak} handleFavorite={handleFavorite} isFavorited={isFavorited(searchResult.word)} onWordClick={setSearchTrigger} settings={settings} theme={theme} />}
        </div>
    );
}

// --- Home Page Features ---
function HomePageFeatures({ t, onWordClick, uiLang }) {
    const isKmr = uiLang === 'kmr';
    const featureCards = useMemo(() => {
        // Date-seeded so every tile is stable within a day and rotates daily,
        // drawing from 366-word lists (one per day of the year).
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const ofDay = (arr) => arr[dayOfYear % arr.length];
        return [
            { type: 'daily', word: ofDay(dailyWords), title: t.wordOfTheDay, icon: <Sparkles />, color: 'from-indigo-500 to-violet-600', lang: 'en-to-ku' },
            { type: 'random_en', word: ofDay(randomEnWords), title: t.randomEnglish, icon: <Shuffle />, color: 'from-emerald-500 to-green-600', lang: 'en-to-ku' },
            { type: 'random_ku', word: ofDay(randomKuWords), title: t.randomKurdish, icon: <Shuffle />, color: 'from-amber-500 to-orange-600', lang: 'ku-to-en' },
            { type: 'advanced', word: ofDay(advancedWords), title: t.advancedWord, icon: <BrainCircuit />, color: 'from-rose-500 to-red-600', lang: 'en-to-ku' },
        ];
    }, [t]);

    const kurdishOf = (w) => (isKmr ? w.kmr : w.ku);

    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {featureCards.map((card) => (
                <button key={card.type} type="button"
                    onClick={() => onWordClick({ word: card.lang === 'en-to-ku' ? card.word.en : kurdishOf(card.word), lang: card.lang })}
                    className={`text-start p-6 rounded-2xl shadow-lg text-white cursor-pointer group transition-transform transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-white/70 bg-gradient-to-tr ${card.color}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-md font-bold mb-2 opacity-80 flex items-center gap-2">{card.icon} {card.title}</h2>
                            <p className="text-3xl font-bold">{card.word.en}</p>
                            <p className="text-2xl font-bold mt-1" dir={isKmr ? 'ltr' : 'rtl'}>{kurdishOf(card.word)}</p>
                        </div>
                        <BookHeart className="h-8 w-8 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                </button>
            ))}
        </div>
    );
}

// --- Search Result Display Component ---
function SearchResultDisplay({ result, t, speak, handleFavorite, isFavorited, onWordClick, settings, theme }) {
    const { word, translation, meanings, synonyms, antonyms, lang, informal_meanings, other_languages, variant } = result;
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedExplanations, setTranslatedExplanations] = useState({});
    const [showEnglishExplanations, setShowEnglishExplanations] = useState(false);

    // Kurmanji is Latin (LTR); Sorani is Arabic-script (RTL).
    const kuDir = variant === 'kurmanji' ? 'ltr' : 'rtl';
    // Synonyms/antonyms are in the source language.
    const sourceDir = lang === 'en-to-ku' ? 'ltr' : kuDir;

    const highlightWord = (sentence, wordToHighlight) => {
        if (!sentence || !wordToHighlight) return sentence;
        const escaped = wordToHighlight.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return sentence.split(regex).map((part, index) =>
            part.toLowerCase() === wordToHighlight.toLowerCase()
                ? <span key={index} className={`font-bold ${theme.highlight}`}>{part}</span>
                : part
        );
    };

    const handleTranslateToggle = async () => {
        if (showEnglishExplanations) {
            setShowEnglishExplanations(false);
            return;
        }
        if (Object.keys(translatedExplanations).length === meanings.length) {
            setShowEnglishExplanations(true);
            return;
        }

        setIsTranslating(true);
        try {
            const results = await translateTexts(meanings.map((m) => m.kurdish_explanation));
            const map = {};
            results.forEach((r, i) => { map[i] = r; });
            setTranslatedExplanations(map);
            setShowEnglishExplanations(true);
        } catch (e) {
            console.error('Translation error', e);
        } finally {
            setIsTranslating(false);
        }
    };

    const renderSynonyms = (title, items) => {
        if (!settings.showSynonyms || !items || items.length === 0) return null;
        return (
            <div className="mt-8">
                <h3 className={`text-lg font-semibold ${theme.text} mb-3`}>{title}</h3>
                <div className="flex flex-wrap gap-2" dir={sourceDir}>
                    {items.map((item, index) => (
                        <button key={index} onClick={() => onWordClick({ word: item, lang })}
                            className={`bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-sm hover:bg-opacity-80 dark:hover:bg-opacity-80 transition-colors ${theme.darkHoverBg}`}>
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // When the analysis is in Kurmanji, surface Sorani here (and vice versa).
    const languageOrder = [
        variant === 'kurmanji'
            ? { key: 'sorani', name: 'سۆرانی' }
            : { key: 'kurmanji_latin', name: 'Kurmancî' },
        { key: 'arabic', name: 'العربية' },
        { key: 'persian', name: 'فارسی' },
        { key: 'turkish', name: 'Türkçe' },
        { key: 'french', name: 'Français' },
        { key: 'german', name: 'Deutsch' },
    ];

    return (
        <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <p className="text-4xl font-bold text-slate-800 dark:text-white">{word}</p>
                        {lang === 'en-to-ku' && (
                            <button onClick={() => speak(word)} aria-label={t.ariaSpeak} className={`text-slate-400 hover:${theme.text} transition`}> <Volume2 /> </button>
                        )}
                    </div>
                    <p className={`text-3xl font-bold ${theme.text} mt-1`} dir={lang === 'en-to-ku' ? kuDir : 'ltr'}>{translation}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleTranslateToggle} disabled={isTranslating} aria-label={t.ariaTranslate} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                        {isTranslating ? <div className={`w-6 h-6 border-2 ${theme.text} border-b-transparent rounded-full animate-spin`}></div> : <Languages className="h-6 w-6 text-slate-500" />}
                    </button>
                    <button onClick={() => handleFavorite(result)} aria-label={t.ariaFavorite} aria-pressed={isFavorited} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <Star className={`h-7 w-7 transition-all ${isFavorited ? 'text-yellow-400 fill-current' : 'text-slate-400'}`} />
                    </button>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className={`text-xl font-semibold ${theme.text} mb-4`}>{t.meanings}</h3>
                <div className="space-y-6">
                    {meanings.map((meaning, index) => (
                        <div key={index} className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex items-baseline gap-4" dir={kuDir}>
                               <p className={`text-xl font-semibold ${theme.highlight}`}>{meaning.kurdish_word}</p>
                               <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">({meaning.partOfSpeech})</p>
                            </div>
                            <p className="mt-2 text-lg text-slate-800 dark:text-slate-200" dir={kuDir}>{meaning.kurdish_explanation}</p>
                            {showEnglishExplanations && (
                                <div className="mt-2 p-3 text-left bg-slate-200 dark:bg-slate-800 rounded-md" dir="ltr">
                                    <p className="text-slate-700 dark:text-slate-300">{translatedExplanations[index] || 'Translating...'}</p>
                                </div>
                            )}
                            {settings.showExamples && meaning.example && (
                                <div className="mt-4 border-t border-slate-200 dark:border-slate-600 pt-4">
                                    <div className="text-sm" dir="ltr">
                                        <p className="text-slate-600 dark:text-slate-300">{highlightWord(meaning.example.sourceSentence, lang === 'en-to-ku' ? word : translation)}</p>
                                        <p className={`mt-1 ${theme.highlight}`} dir={lang === 'en-to-ku' ? kuDir : 'ltr'}>{highlightWord(meaning.example.translatedSentence, lang === 'en-to-ku' ? translation : word)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {settings.showInformal && informal_meanings && informal_meanings.length > 0 &&
                <div className="mt-8">
                    <h3 className={`text-lg font-semibold ${theme.text} mb-3`}>{t.informalMeanings}</h3>
                    <div className="flex flex-wrap gap-2" dir={kuDir}>
                        {informal_meanings.map((ctx, i) => (
                             <button key={i} onClick={() => onWordClick({ word: ctx.term, lang: 'ku-to-en' })}
                                className={`bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-sm hover:bg-opacity-80 dark:hover:bg-opacity-80 transition-colors ${theme.darkHoverBg}`}>
                                {ctx.term} <span className="text-xs text-slate-500 dark:text-slate-400">({ctx.context_ku})</span>
                            </button>
                        ))}
                    </div>
                </div>
            }

            {settings.showMultiLang && other_languages && Object.keys(other_languages).length > 0 &&
                 <div className="mt-8">
                    <h3 className={`text-lg font-semibold ${theme.text} mb-3`}>{t.otherLanguages}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {languageOrder.map((langInfo) => {
                            const tr = other_languages[langInfo.key];
                            return tr ? (
                                <div key={langInfo.key} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-semibold text-slate-500 dark:text-slate-400 capitalize">{langInfo.name}</p>
                                    <p className="mt-1 text-slate-700 dark:text-slate-300">{tr}</p>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>
            }

            {renderSynonyms(t.synonyms, synonyms)}
            {renderSynonyms(t.antonyms, antonyms)}
        </div>
    );
}

// --- Accessible modal shell (Escape to close, backdrop click, dialog roles) ---
function Modal({ titleId, onClose, children }) {
    const closeRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        if (closeRef.current) closeRef.current.focus();
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby={titleId}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}>
                {children(closeRef)}
            </div>
        </div>
    );
}

// --- Modals (Info & Settings) ---
function InfoModal({ t, theme, onClose }) {
    return (
        <Modal titleId="info-title" onClose={onClose}>
            {(closeRef) => (
                <>
                    <button ref={closeRef} onClick={onClose} aria-label={t.ariaClose} className="absolute top-4 end-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X className="h-6 w-6 text-slate-500" /></button>
                    <h2 id="info-title" className={`text-2xl font-bold ${theme.text} mb-4`}>{t.infoTitle}</h2>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <p>{t.infoP1}</p>
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">{t.infoP2}</h3>
                        <ul className="list-disc list-inside space-y-2">
                            <li>{t.infoL1}</li><li>{t.infoL2}</li><li>{t.infoL3}</li><li>{t.infoL4}</li><li>{t.infoL5}</li>
                        </ul>
                        <p>{t.infoP3}</p>
                    </div>
                </>
            )}
        </Modal>
    );
}

function SettingsModal({ t, settings, setSettings, font, setFont, uiLang, setUiLang, theme, themeName, setThemeName, colorMode, setColorMode, onClose }) {
    const handleToggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    const displayOptions = [
        { key: 'showExamples', label: t.settingsShowExamples },
        { key: 'showSynonyms', label: t.settingsShowSynonyms },
        { key: 'showInformal', label: t.settingsShowInformal },
        { key: 'showMultiLang', label: t.settingsShowMultiLang },
    ];
    const fontOptions = [
        { value: 'font-vazirmatn', label: 'Vazirmatn (Default)' },
        { value: 'font-noto-naskh', label: 'Noto Naskh Arabic' },
        { value: 'font-amiri', label: 'Amiri' },
        { value: 'font-sans', label: 'System Default' },
    ];
    const modeOptions = [
        { value: 'light', label: t.modeLight },
        { value: 'dark', label: t.modeDark },
        { value: 'system', label: t.modeSystem },
    ];

    return (
        <Modal titleId="settings-title" onClose={onClose}>
            {(closeRef) => (
                <>
                    <button ref={closeRef} onClick={onClose} aria-label={t.ariaClose} className="absolute top-4 end-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X className="h-6 w-6 text-slate-500" /></button>
                    <h2 id="settings-title" className={`text-2xl font-bold ${theme.text} mb-6`}>{t.settingsTitle}</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.settingsDisplay}</h3>
                            <div className="space-y-4">
                                {displayOptions.map((opt) => (
                                    <label key={opt.key} className="flex items-center justify-between cursor-pointer">
                                        <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only peer" checked={settings[opt.key]} onChange={() => handleToggle(opt.key)} />
                                            <div className={`w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:${theme.bg}`}></div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.settingsAppearance}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.settingsColorMode}</label>
                                    <div className="flex gap-2">
                                        {modeOptions.map((opt) => (
                                            <button key={opt.value} onClick={() => setColorMode(opt.value)}
                                                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${colorMode === opt.value ? `${theme.bg} text-white` : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.settingsTheme}</label>
                                    <div className="flex gap-2">
                                        {Object.entries(themes).map(([key, th]) => (
                                            <button key={th.name} onClick={() => setThemeName(key)} aria-label={th.name}
                                                className={`w-8 h-8 rounded-full ${th.bg} transition-transform transform hover:scale-110 ${themeName === key ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800' : ''} ${theme.ring}`}></button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="font-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.settingsFont}</label>
                                    <select id="font-select" value={font} onChange={(e) => setFont(e.target.value)}
                                        className={`w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${theme.ring}`}>
                                        {fontOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.settingsLanguage}</label>
                                    <div className="flex gap-2">
                                        {[{ id: 'ku', label: 'سۆرانی' }, { id: 'kmr', label: 'Kurmancî' }, { id: 'en', label: 'English' }].map((lng) => (
                                            <button key={lng.id} onClick={() => setUiLang(lng.id)}
                                                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${uiLang === lng.id ? `${theme.bg} text-white` : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                {lng.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Modal>
    );
}

// --- Loading Indicator ---
function LoadingIndicator({ t, theme }) {
    return (
        <div className="flex flex-col justify-center items-center space-y-3 py-4">
            <BookOpen className={`w-8 h-8 ${theme.text} animate-wobble`} />
            <p className={`text-sm ${theme.text}`}>{t.searchingText}</p>
        </div>
    );
}

// --- Generic List Page Component ---
function ListPage({ userId, t, theme, pageType }) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const collectionName = pageType === 'favorites' ? 'favorites' : 'history';

    const collectionRef = useMemo(
        () => (userId ? collection(db, `/artifacts/${appId}/users/${userId}/${collectionName}`) : null),
        [userId, collectionName]
    );

    useEffect(() => {
        if (!collectionRef) return undefined;
        setIsLoading(true);
        const unsubscribe = onSnapshot(query(collectionRef), (snapshot) => {
            let data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            if (pageType === 'history') {
                data.sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0));
            }
            setItems(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [collectionRef, pageType]);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleDelete = async (id) => {
        if (!userId) return;
        await deleteDoc(doc(db, `/artifacts/${appId}/users/${userId}/${collectionName}`, id));
    };

    const handleClearAll = async () => {
        if (!collectionRef) return;
        const snapshot = await getDocs(collectionRef);
        await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><LoadingIndicator t={t} theme={theme} /></div>;
    }

    const title = pageType === 'favorites' ? t.favoritesTitle : t.historyTitle;
    const noItemsText = pageType === 'favorites' ? t.noFavorites : t.noHistory;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{title}</h1>
                {pageType === 'history' && items.length > 0 &&
                    <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                        <Trash2 className="h-4 w-4" /> {t.clearHistory}
                    </button>
                }
            </div>
            {items.length === 0 ? (
                <p className="text-slate-500 text-center py-10 bg-white dark:bg-slate-800 rounded-lg">{noItemsText}</p>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-lg flex justify-between items-center animate-fade-in border border-slate-200 dark:border-slate-700">
                            <div>
                                <p className="text-xl font-semibold text-slate-800 dark:text-white">{item.word}</p>
                                <p className={`text-xl ${theme.text}`}>{item.translation}</p>
                                {pageType === 'history' && item.timestamp && <p className="text-xs text-slate-400 mt-1">{item.timestamp.toDate().toLocaleString()}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                {item.lang === 'en-to-ku' &&
                                    <button onClick={() => speak(item.word)} aria-label={t.ariaSpeak} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Volume2 className="text-slate-500" /></button>
                                }
                                <button onClick={() => handleDelete(item.id)} aria-label={t.ariaDelete} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Trash2 className="text-slate-500 hover:text-red-500" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const FavoritesPage = ({ userId, t, theme }) => <ListPage userId={userId} t={t} theme={theme} pageType="favorites" />;
const HistoryPage = ({ userId, t, theme }) => <ListPage userId={userId} t={t} theme={theme} pageType="history" />;

// --- Footer ---
function Footer({ t }) {
    return (
        <footer className="text-center py-8 mt-12 text-slate-500 text-sm">
            <p>{t.developedBy}</p>
        </footer>
    );
}
