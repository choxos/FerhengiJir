import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { Star, Volume2, History, Trash2, Search, BookOpen, Sparkles, Info, X, Shuffle, BrainCircuit, BookHeart, Settings, Languages } from 'lucide-react';
import { firebaseConfig, appId, geminiApiKey } from './config/firebase';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- i18n (Internationalization) for UI Text ---
const uiText = {
    ku: {
        title: "فەرهەنگی ژیر",
        searchPlaceholder: "بۆ وشەیەک بگەڕێ...",
        searchButton: "گەڕان",
        searchingText: "گەڕان...",
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
        developedBy: "پەرەپێدراوە لەلایەن سەرچیا",
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
        langKurdish: "کوردی",
        langEnglish: "English",
    },
    en: {
        title: "Zhir Dictionary",
        searchPlaceholder: "Search for a word...",
        searchButton: "Search",
        searchingText: "Searching...",
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
        developedBy: "Developed by Sarchia",
        infoTitle: "About Zhir Dictionary",
        infoP1: "Zhir Dictionary is a smart and advanced tool for language learners. Using the power of AI, it provides accurate translations and detailed analysis for words.",
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
        langKurdish: "کوردی",
        langEnglish: "English",
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

// --- Main App Component ---
export default function App() {
    const [page, setPage] = useState('home');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [uiLang, setUiLang] = useState('ku');
    const [font, setFont] = useState('font-vazirmatn');
    const [theme, setTheme] = useState(themes.indigo);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [settings, setSettings] = useState({
        showExamples: true,
        showSynonyms: true,
        showInformal: true,
        showMultiLang: true,
    });

    useEffect(() => {
        document.documentElement.lang = uiLang;
        document.documentElement.dir = uiLang === 'ku' ? 'rtl' : 'ltr';
    }, [uiLang]);
    
    useEffect(() => {
        document.body.className = font;
    }, [font]);

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

    const renderPage = () => {
        if (!isAuthReady) {
            return <div className="flex justify-center items-center h-screen bg-slate-100 dark:bg-slate-900"><LoadingIndicator t={t} theme={theme} /></div>;
        }
        switch (page) {
            case 'home':
                return <DictionaryApp userId={userId} t={t} settings={settings} theme={theme} />;
            case 'favorites':
                return <FavoritesPage userId={userId} t={t} theme={theme} />;
            case 'history':
                return <HistoryPage userId={userId} t={t} theme={theme} />;
            default:
                return <DictionaryApp userId={userId} t={t} settings={settings} theme={theme} />;
        }
    };

    return (
        <div className={`min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200`}>
            <Navbar setPage={setPage} currentPage={page} t={t} theme={theme} onInfoClick={() => setIsInfoModalOpen(true)} onSettingsClick={() => setIsSettingsModalOpen(true)} />
            <main className="p-4 md:p-8">
                {renderPage()}
            </main>
            <Footer t={t} />
            {isInfoModalOpen && <InfoModal t={t} theme={theme} uiLang={uiLang} onClose={() => setIsInfoModalOpen(false)} />}
            {isSettingsModalOpen && <SettingsModal t={t} settings={settings} setSettings={setSettings} font={font} setFont={setFont} uiLang={uiLang} setUiLang={setUiLang} theme={theme} setTheme={setTheme} onClose={() => setIsSettingsModalOpen(false)} />}
        </div>
    );
}

// --- Navigation Bar ---
function Navbar({ setPage, currentPage, t, theme, onInfoClick, onSettingsClick }) {
    const navItems = [
        { id: 'home', label: t.navHome, icon: <Search className="h-5 w-5" /> },
        { id: 'favorites', label: t.navFavorites, icon: <Star className="h-5 w-5" /> },
        { id: 'history', label: t.navHistory, icon: <History className="h-5 w-5" /> },
    ];

    return (
        <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <button onClick={() => setPage('home')} className="flex items-center cursor-pointer bg-transparent border-none p-0">
                        <BookOpen className={`h-8 w-8 ${theme.text}`} />
                        <span className={`font-bold text-2xl mx-2 ${theme.text}`}>{t.title}</span>
                    </button>
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <button key={item.id} onClick={() => setPage(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ currentPage === item.id ? `${theme.text} font-bold bg-transparent border-2 ${theme.border}` : `text-slate-600 dark:text-slate-300 bg-transparent border-2 border-transparent hover:bg-slate-200 dark:hover:bg-slate-800` }`}>
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={onSettingsClick} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><Settings className="text-slate-600 dark:text-slate-300"/></button>
                         <button onClick={onInfoClick} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><Info className="text-slate-600 dark:text-slate-300"/></button>
                        <div className="md:hidden">
                             <select onChange={(e) => setPage(e.target.value)} value={currentPage} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-md">
                                {navItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                             </select>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

// --- Main Dictionary Component ---
function DictionaryApp({ userId, t, settings, theme }) {
    const [word, setWord] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [searchTrigger, setSearchTrigger] = useState({ word: null, lang: null });

    const favoritesCollectionRef = collection(db, `/artifacts/${appId}/users/${userId}/favorites`);
    const historyCollectionRef = collection(db, `/artifacts/${appId}/users/${userId}/history`);

    useEffect(() => {
        if (searchTrigger.word) {
            setWord(searchTrigger.word);
            handleSearch(searchTrigger.word, searchTrigger.lang);
            setSearchTrigger({ word: null, lang: null });
        }
    }, [searchTrigger]);
    
    useEffect(() => {
        if (!userId) return;
        const unsubscribe = onSnapshot(favoritesCollectionRef, (snapshot) => {
            setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [userId]);

    const isFavorited = (originalWord) => favorites.some(fav => fav.word === originalWord);

    const handleFavorite = async (item) => {
        if (!userId) return;
        if (isFavorited(item.word)) {
            const favDoc = favorites.find(fav => fav.word === item.word);
            if (favDoc) await deleteDoc(doc(db, `/artifacts/${appId}/users/${userId}/favorites`, favDoc.id));
        } else {
            await addDoc(favoritesCollectionRef, { ...item, timestamp: new Date() });
        }
    };

    const handleSearch = useCallback(async (searchTerm, searchLang) => {
        const term = (searchTerm || word).trim();
        if (!term) return;

        const isKurdish = /[\u0600-\u06FF]/.test(term);
        const finalSearchLang = searchLang || (isKurdish ? 'ku-to-en' : 'en-to-ku');

        setIsLoading(true);
        setError(null);
        setSearchResult(null);

        const [sourceLang, targetLang] = finalSearchLang === 'en-to-ku' ? ['English', 'Kurdish (Sorani)'] : ['Kurdish (Sorani)', 'English'];

        const prompt = `Analyze the ${sourceLang} word "${term}". Provide a comprehensive translation and analysis in ${targetLang} optimized for a Kurdish speaker learning English. The response must be a JSON object.`;

        const schema = {
            type: "OBJECT",
            properties: {
                "translation": { "type": "STRING" },
                "meanings": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "kurdish_word": { "type": "STRING" }, "partOfSpeech": { "type": "STRING" },
                            "kurdish_explanation": { "type": "STRING" },
                            "example": { "type": "OBJECT", "properties": { "sourceSentence": { "type": "STRING" }, "translatedSentence": { "type": "STRING" } } }
                        }, "required": ["kurdish_word", "partOfSpeech", "kurdish_explanation"]
                    }
                },
                "informal_meanings": {
                    "type": "ARRAY", "items": {
                        "type": "OBJECT", "properties": {
                            "term": { "type": "STRING", "description": "The informal or dialectal term, e.g. 'سەیارە' for 'car'." },
                            "context_ku": { "type": "STRING", "description": "The context in Kurdish, e.g., 'نافەرمی (گشتی)' or 'زاراوەیی (هەولێر)'" }
                        }, "required": ["term", "context_ku"]
                    }
                },
                "other_languages": {
                    "type": "OBJECT", "properties": {
                        "kurmanji_latin": { "type": "STRING" }, "arabic": { "type": "STRING" }, "persian": { "type": "STRING" },
                        "turkish": { "type": "STRING" }, "french": { "type": "STRING" }, "german": { "type": "STRING" }
                    }
                },
                "synonyms": { "type": "ARRAY", "items": { "type": "STRING" }, "description": `Synonyms in ${sourceLang}.` },
                "antonyms": { "type": "ARRAY", "items": { "type": "STRING" }, "description": `Antonyms in ${sourceLang}.` }
            },
            required: ["translation", "meanings"]
        };

        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema } };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0) {
                const data = JSON.parse(result.candidates[0].content.parts[0].text);
                const resultData = { word: term, ...data, lang: finalSearchLang };
                setSearchResult(resultData);
                if (userId) { await addDoc(historyCollectionRef, { ...resultData, timestamp: new Date() }); }
            } else { throw new Error("Invalid response structure from API."); }
        } catch (e) {
            console.error("API Error:", e);
            setError(t.error);
        } finally { setIsLoading(false); }
    }, [word, userId, t.error]);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full">
                        <Search className="absolute top-1/2 -translate-y-1/2 text-slate-400" style={t.title === 'Zhir Dictionary' ? {left: '1rem'} : {right: '1rem'}}/>
                        <input type="text" value={word} onChange={(e) => setWord(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder={t.searchPlaceholder}
                            className={`w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 px-12 py-4 rounded-lg focus:outline-none focus:ring-2 ${theme.ring} transition duration-300`} />
                    </div>
                    <button onClick={() => handleSearch()} disabled={isLoading}
                        className={`w-full sm:w-auto px-8 py-4 ${theme.bg} text-white font-bold rounded-lg ${theme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2`}>
                        {t.searchButton}
                    </button>
                </div>
            </div>
            
            {isLoading && <div className="mt-8"><LoadingIndicator t={t} theme={theme}/></div>}
            {!searchResult && !isLoading && <HomePageFeatures t={t} onWordClick={setSearchTrigger} />}
            {error && <div className="mt-6 text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">{error}</div>}
            {searchResult && <SearchResultDisplay result={searchResult} t={t} speak={speak} handleFavorite={handleFavorite} isFavorited={isFavorited(searchResult.word)} onWordClick={setSearchTrigger} settings={settings} theme={theme}/>}
        </div>
    );
}

// --- Home Page Features ---
const wordLists = {
    daily: [{ en: 'Resilience', ku: 'خۆڕاگری' }, { en: 'Compassion', ku: 'بەزەیی' }, { en: 'Integrity', ku: 'دەستپاکی' }],
    random_en: [ { en: 'Ephemeral', ku: 'کاتی' }, { en: 'Luminous', ku: 'درەوشاوە' }, { en: 'Serendipity', ku: 'ڕێکەوتی خۆش' }, { en: 'Petrichor', ku: 'بۆنی دوای باران' }, { en: 'Mellifluous', ku: 'شیرین' } ],
    random_ku: [ { en: 'Freedom', ku: 'ئازادی' }, { en: 'Homeland', ku: 'نیشتیمان' }, { en: 'Peace', ku: 'ئاشتی' }, { en: 'Love', ku: 'خۆشەویستی' }, { en: 'Future', ku: 'داهاتوو' } ],
    advanced: [ { en: 'Ubiquitous', ku: 'هەمەگیر' }, { en: 'Pulchritudinous', ku: 'جوان' }, { en: 'Obfuscate', ku: 'تەڵخ کردن' }, { en: 'Proclivity', ku: 'مەیل' }, { en: 'Vicissitude', ku: 'هەوراز و نشێو' } ]
};

function HomePageFeatures({ t, onWordClick }) {
    const featureCards = useMemo(() => {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        return [
            { type: 'daily', word: wordLists.daily[dayOfYear % wordLists.daily.length], title: t.wordOfTheDay, icon: <Sparkles />, color: 'from-indigo-500 to-violet-600', lang: 'en-to-ku' },
            { type: 'random_en', word: wordLists.random_en[Math.floor(Math.random() * wordLists.random_en.length)], title: t.randomEnglish, icon: <Shuffle />, color: 'from-emerald-500 to-green-600', lang: 'en-to-ku' },
            { type: 'random_ku', word: wordLists.random_ku[Math.floor(Math.random() * wordLists.random_ku.length)], title: t.randomKurdish, icon: <Shuffle />, color: 'from-amber-500 to-orange-600', lang: 'ku-to-en' },
            { type: 'advanced', word: wordLists.advanced[Math.floor(Math.random() * wordLists.advanced.length)], title: t.advancedWord, icon: <BrainCircuit />, color: 'from-rose-500 to-red-600', lang: 'en-to-ku' },
        ];
    }, [t]);

    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {featureCards.map(card => (
                <div key={card.type} onClick={() => onWordClick({word: card.lang === 'en-to-ku' ? card.word.en : card.word.ku, lang: card.lang})}
                    className={`p-6 rounded-2xl shadow-lg text-white cursor-pointer group transition-transform transform hover:scale-105 bg-gradient-to-tr ${card.color}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-md font-bold mb-2 opacity-80 flex items-center gap-2">{card.icon} {card.title}</h2>
                            <p className="text-3xl font-bold">{card.word.en}</p>
                            <p className="text-2xl font-bold mt-1" dir="rtl">{card.word.ku}</p>
                        </div>
                        <BookHeart className="h-8 w-8 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Search Result Display Component ---
function SearchResultDisplay({ result, t, speak, handleFavorite, isFavorited, onWordClick, settings, theme }) {
    const { word, translation, meanings, synonyms, antonyms, lang, informal_meanings, other_languages } = result;
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedExplanations, setTranslatedExplanations] = useState({});
    const [showEnglishExplanations, setShowEnglishExplanations] = useState(false);

    const highlightWord = (sentence, wordToHighlight) => {
        if (!sentence || !wordToHighlight) return sentence;
        const regex = new RegExp(`\\b(${wordToHighlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})\\b`, 'gi');
        return sentence.split(regex).map((part, index) => 
            regex.test(part) ? <span key={index} className={`font-bold ${theme.highlight}`}>{part}</span> : part
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
        const newTranslations = {};
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

        for (let i = 0; i < meanings.length; i++) {
            const explanation = meanings[i].kurdish_explanation;
            const payload = { contents: [{ role: "user", parts: [{ text: `Provide only the direct English translation for the following Kurdish text: "${explanation}"` }] }] };
            try {
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const result = await response.json();
                if (result.candidates && result.candidates.length > 0) {
                    newTranslations[i] = result.candidates[0].content.parts[0].text.trim();
                }
            } catch (e) {
                console.error("Translation error", e);
                newTranslations[i] = "Translation failed.";
            }
        }
        setTranslatedExplanations(newTranslations);
        setShowEnglishExplanations(true);
        setIsTranslating(false);
    };

    const renderSynonyms = (title, items) => {
        if (!settings.showSynonyms || !items || items.length === 0) return null;
        return (
            <div className="mt-8">
                <h3 className={`text-lg font-semibold ${theme.text} mb-3`}>{title}</h3>
                <div className="flex flex-wrap gap-2" dir={lang === 'ku-to-en' ? 'ltr' : 'rtl'}>
                    {items.map((item, index) => (
                        <button key={index} onClick={() => onWordClick({ word: item, lang: lang })}
                            className={`bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-sm hover:bg-opacity-80 dark:hover:bg-opacity-80 transition-colors ${theme.darkHoverBg}`}>
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        );
    };
    
    const languageOrder = [
        { key: 'kurmanji_latin', name: 'Kurmancî' },
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
                            <button onClick={() => speak(word)} className={`text-slate-400 hover:${theme.text} transition`}> <Volume2 /> </button>
                        )}
                    </div>
                    <p className={`text-3xl font-bold ${theme.text} mt-1`} dir={lang === 'en-to-ku' ? 'rtl' : 'ltr'}>{translation}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleTranslateToggle} disabled={isTranslating} className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50`}>
                        {isTranslating ? <div className={`w-6 h-6 border-2 ${theme.text} border-b-transparent rounded-full animate-spin`}></div> : <Languages className="h-6 w-6 text-slate-500" />}
                    </button>
                    <button onClick={() => handleFavorite(result)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <Star className={`h-7 w-7 transition-all ${isFavorited ? 'text-yellow-400 fill-current' : 'text-slate-400'}`} />
                    </button>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className={`text-xl font-semibold ${theme.text} mb-4`}>{t.meanings}</h3>
                <div className="space-y-6">
                    {meanings.map((meaning, index) => (
                        <div key={index} className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex items-baseline gap-4" dir="rtl">
                               <p className={`text-xl font-semibold ${theme.highlight}`}>{meaning.kurdish_word}</p>
                               <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">({meaning.partOfSpeech})</p>
                            </div>
                            <p className="mt-2 text-lg text-slate-800 dark:text-slate-200" dir="rtl">{meaning.kurdish_explanation}</p>
                            {showEnglishExplanations && (
                                <div className="mt-2 p-3 text-left bg-slate-200 dark:bg-slate-800 rounded-md" dir="ltr">
                                    <p className="text-slate-700 dark:text-slate-300">{translatedExplanations[index] || 'Translating...'}</p>
                                </div>
                            )}
                            {settings.showExamples && meaning.example && (
                                <div className="mt-4 border-t border-slate-200 dark:border-slate-600 pt-4">
                                    <div className="text-sm" dir="ltr">
                                        <p className="text-slate-600 dark:text-slate-300">{highlightWord(meaning.example.sourceSentence, lang === 'en-to-ku' ? word : translation)}</p>
                                        <p className={`mt-1 ${theme.highlight}`} dir="rtl">{highlightWord(meaning.example.translatedSentence, lang === 'en-to-ku' ? translation : word)}</p>
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
                    <div className="flex flex-wrap gap-2" dir="rtl">
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
                        {languageOrder.map(langInfo => {
                            const translation = other_languages[langInfo.key];
                            return translation ? (
                                <div key={langInfo.key} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-semibold text-slate-500 dark:text-slate-400 capitalize">{langInfo.name}</p>
                                    <p className="mt-1 text-slate-700 dark:text-slate-300">{translation}</p>
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

// --- Modals (Info & Settings) ---
function InfoModal({ t, theme, uiLang, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-8 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className={`absolute top-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 ${uiLang === 'ku' ? 'left-4' : 'right-4'}`}><X className="h-6 w-6 text-slate-500" /></button>
                <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>{t.infoTitle}</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-300">
                    <p>{t.infoP1}</p>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{t.infoP2}</h3>
                    <ul className="list-disc list-inside space-y-2">
                        <li>{t.infoL1}</li><li>{t.infoL2}</li><li>{t.infoL3}</li><li>{t.infoL4}</li><li>{t.infoL5}</li>
                    </ul>
                    <p>{t.infoP3}</p>
                </div>
            </div>
        </div>
    );
}

function SettingsModal({ t, settings, setSettings, font, setFont, uiLang, setUiLang, theme, setTheme, onClose }) {
    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };
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

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className={`absolute top-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 ${uiLang === 'ku' ? 'left-4' : 'right-4'}`}><X className="h-6 w-6 text-slate-500" /></button>
                <h2 className={`text-2xl font-bold ${theme.text} mb-6`}>{t.settingsTitle}</h2>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.settingsDisplay}</h3>
                        <div className="space-y-4">
                            {displayOptions.map(opt => (
                                <label key={opt.key} className="flex items-center justify-between cursor-pointer">
                                    <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only peer" checked={settings[opt.key]} onChange={() => handleToggle(opt.key)} />
                                        <div className={`w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:${theme.bg}`}></div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                         <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.settingsAppearance}</h3>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.settingsTheme}</label>
                                <div className="flex gap-2">
                                    {Object.values(themes).map(th => (
                                        <button key={th.name} onClick={() => setTheme(th)} className={`w-8 h-8 rounded-full ${th.bg} transition-transform transform hover:scale-110 ${theme.name === th.name ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800' : ''} ${theme.ring}`}></button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="font-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.settingsFont}</label>
                                <select id="font-select" value={font} onChange={(e) => setFont(e.target.value)}
                                    className={`w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${theme.ring}`}>
                                    {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.settingsLanguage}</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setUiLang('ku')} className={`w-full py-2 rounded-lg transition-colors ${uiLang === 'ku' ? `${theme.bg} text-white` : 'bg-slate-200 dark:bg-slate-700'}`}>{t.langKurdish}</button>
                                    <button onClick={() => setUiLang('en')} className={`w-full py-2 rounded-lg transition-colors ${uiLang === 'en' ? `${theme.bg} text-white` : 'bg-slate-200 dark:bg-slate-700'}`}>{t.langEnglish}</button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
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
    const collectionRef = collection(db, `/artifacts/${appId}/users/${userId}/${collectionName}`);

    useEffect(() => {
        if (!userId) return;
        setIsLoading(true);
        const q = query(collectionRef);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (pageType === 'history' && data.length > 0) {
                 data.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
            }
            setItems(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [userId, pageType]);

    const handleDelete = async (id) => {
        if (!userId) return;
        await deleteDoc(doc(db, `/artifacts/${appId}/users/${userId}/${collectionName}`, id));
    };
    
    const handleClearAll = async () => {
        if (!userId) return;
        const snapshot = await getDocs(collectionRef);
        snapshot.forEach(doc => deleteDoc(doc.ref));
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><LoadingIndicator t={t} theme={theme}/></div>;
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
                    {items.map(item => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-lg flex justify-between items-center animate-fade-in border border-slate-200 dark:border-slate-700">
                            <div>
                                <p className="text-xl font-semibold text-slate-800 dark:text-white">{item.word}</p>
                                <p className={`text-xl ${theme.text}`}>{item.translation}</p>
                                {pageType === 'history' && item.timestamp && <p className="text-xs text-slate-400 mt-1">{item.timestamp.toDate().toLocaleString()}</p> }
                            </div>
                            <div className="flex items-center gap-2">
                                {item.lang === 'en-to-ku' &&
                                    <button onClick={() => new SpeechSynthesisUtterance(item.word) && window.speechSynthesis.speak(new SpeechSynthesisUtterance(item.word))} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Volume2 className="text-slate-500"/></button>
                                }
                                <button onClick={() => handleDelete(item.id)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Trash2 className="text-slate-500 hover:text-red-500"/></button>
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