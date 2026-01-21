import React, { useState, useEffect, useMemo } from 'react';
import { Layers, RotateCcw, Shuffle, PartyPopper, Sparkles, Database, Loader2, BookOpen, RefreshCw, WifiOff, Gamepad2, Flame, HelpCircle, ArrowLeft } from 'lucide-react';
import { CardData, AppState, ThemeCollection, GameMode, ToDCollection } from './types';
import { PASTEL_COLORS, PATTERNS, API_URL, FALLBACK_THEMES } from './constants';
import { Card } from './components/Card';

const App: React.FC = () => {
  // Navigation State
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MENU);

  // App State (Shared)
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [drawnCards, setDrawnCards] = useState<CardData[]>([]);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  
  // Data State
  const [themes, setThemes] = useState<ThemeCollection>({});
  const [todData, setTodData] = useState<ToDCollection>({ truth: [], dare: [] });

  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [selectedThemeName, setSelectedThemeName] = useState<string>('');
  const [debugMsg, setDebugMsg] = useState<string>('');
  
  // Animation state
  const [isShuffling, setIsShuffling] = useState(false);

  // Fetch Data on Mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // --- DATA FETCHING & PROCESSING ---

  const extractItems = (data: any): any[] => {
      // Helper to find the actual array of data within various JSON wrappers
      let items: any[] = [];
      const isComplexArray = (arr: any[]) => {
         if (!Array.isArray(arr) || arr.length === 0) return false;
         const first = arr[0];
         return (typeof first === 'object' && first !== null) || Array.isArray(first);
      };

      if (Array.isArray(data) && isComplexArray(data)) {
        items = data;
      } else if (typeof data === 'object' && data !== null) {
        const knownKeys = ['cards', 'data', 'items', 'records', 'result', 'values', 'elements'];
        for (const key of knownKeys) {
           if (isComplexArray(data[key])) {
             items = data[key];
             break;
           }
        }
        
        if (items.length === 0) {
           const complexArrayValue = Object.values(data).find(val => isComplexArray(val as any[]));
           if (complexArrayValue) {
             items = complexArrayValue as any[];
           }
        }
      }
      return items;
  };

  const fetchSheetData = async (sheetName: string) => {
      const separator = API_URL.includes('?') ? '&' : '?';
      const targetUrl = `${API_URL}${separator}sheet=${encodeURIComponent(sheetName)}&sheetName=${encodeURIComponent(sheetName)}&_nocache=${Date.now()}`;
      console.log(`Fetching sheet: ${sheetName}`, targetUrl);

      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow', 
          credentials: 'omit',
        });
        if (!response.ok) return null;
        const json = await response.json();
        return extractItems(json);
      } catch (e) {
        console.warn(`Failed to fetch ${sheetName}:`, e);
        return null;
      }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setIsOfflineMode(false);
    setDebugMsg('');

    try {
      // Parallel fetch: Classic Cards & Truth or Dare
      // Chú ý: Sheet name cho Truth or Dare là "Truth or Dare" như yêu cầu
      const [cardsData, todRawData] = await Promise.all([
          fetchSheetData('cards'),
          fetchSheetData('Truth or Dare')
      ]);

      // 1. Process Classic Themes
      if (cardsData && cardsData.length > 0) {
          const processedThemes = processClassicThemes(cardsData);
          setThemes(processedThemes);
      } else {
          throw new Error("Không tải được dữ liệu thẻ bài chính (sheet 'cards').");
      }

      // 2. Process Truth or Dare
      if (todRawData && todRawData.length > 0) {
          const processedToD = processToDData(todRawData);
          setTodData(processedToD);
      } else {
          console.warn("Không tìm thấy sheet 'Truth or Dare' hoặc sheet rỗng. Sử dụng dữ liệu offline.");
          setTodData({
              truth: FALLBACK_THEMES["Sự thật (Offline)"],
              dare: FALLBACK_THEMES["Thử thách (Offline)"]
          });
      }

    } catch (err: any) {
      console.error("Fetch Error:", err);
      setDebugMsg(err.message || String(err));
      console.warn("Switching to Offline Mode");
      
      // Fallback everything
      setThemes(FALLBACK_THEMES);
      setTodData({
         truth: FALLBACK_THEMES["Sự thật (Offline)"],
         dare: FALLBACK_THEMES["Thử thách (Offline)"]
      });
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const processClassicThemes = (data: any[]): ThemeCollection => {
    const themeMap: ThemeCollection = {};
    if (!Array.isArray(data) || data.length === 0) return {};

    const sample = data[0];
    if (!sample) return {};

    // --- CASE 1: Array of Arrays ---
    if (Array.isArray(sample)) {
       const headers = sample.map(h => String(h).toLowerCase().trim());
       
       let contentIdx = headers.findIndex(h => 
         h === 'question' || h === 'content' || h === 'nội dung' || h === 'text' || h === 'câu hỏi'
       );
       let topicIdx = headers.findIndex(h => 
         h === 'topic' || h === 'chủ đề' || h === 'category' || h === 'theme'
       );
       
       if (contentIdx === -1) contentIdx = 0; 
       if (topicIdx === -1) topicIdx = (contentIdx === 0 && headers.length > 1) ? 1 : -1;

       for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!Array.isArray(row)) continue;
          const content = row[contentIdx];
          if (!content || !String(content).trim()) continue;
          let topic = 'Bộ Bài Chính';
          if (topicIdx !== -1 && row[topicIdx]) topic = String(row[topicIdx]).trim();
          if (!themeMap[topic]) themeMap[topic] = [];
          themeMap[topic].push(String(content));
       }
       return themeMap;
    }

    // --- CASE 2: Array of Objects ---
    if (typeof sample === 'object') {
        const keys = Object.keys(sample);
        const findKey = (patterns: RegExp[]) => keys.find(k => patterns.some(p => p.test(k)));

        let contentKey = keys.find(k => k.toLowerCase() === 'question');
        if (!contentKey) contentKey = findKey([/content/i, /nội dung/i, /text/i, /câu hỏi/i, /yêu cầu/i]);
        
        let topicKey = keys.find(k => k.toLowerCase() === 'topic');
        if (!topicKey) topicKey = findKey([/chủ đề/i, /category/i, /theme/i]);

        const finalContentKey = contentKey || keys[0];
        let finalTopicKey = topicKey;
        if (!finalTopicKey && keys.length > 1) finalTopicKey = keys.find(k => k !== finalContentKey);

        data.forEach(row => {
          const content = row[finalContentKey];
          let topic = 'Bộ Bài Chính';
          if (finalTopicKey && row[finalTopicKey]) topic = String(row[finalTopicKey]).trim();
          if (!content || !String(content).trim()) return;
          if (!themeMap[topic]) themeMap[topic] = [];
          themeMap[topic].push(String(content));
        });
        return themeMap;
    }
    return {};
  };

  const processToDData = (data: any[]): ToDCollection => {
    const result: ToDCollection = { truth: [], dare: [] };
    if (!Array.isArray(data) || data.length === 0) return result;
    const sample = data[0];

    // --- CASE 1: Array of Arrays ---
    if (Array.isArray(sample)) {
        const headers = sample.map(h => String(h).toLowerCase().trim());
        const truthIdx = headers.findIndex(h => h === 'truth' || h === 'sự thật' || h === 'thật');
        const dareIdx = headers.findIndex(h => h === 'dare' || h === 'thử thách' || h === 'thách');

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (truthIdx !== -1 && row[truthIdx]) result.truth.push(String(row[truthIdx]));
            if (dareIdx !== -1 && row[dareIdx]) result.dare.push(String(row[dareIdx]));
        }
    } 
    // --- CASE 2: Array of Objects ---
    else if (typeof sample === 'object') {
        const keys = Object.keys(sample);
        // Find keys containing "truth" or "dare"
        const truthKey = keys.find(k => /truth|sự thật|thật/i.test(k));
        const dareKey = keys.find(k => /dare|thử thách|thách/i.test(k));

        data.forEach(row => {
            if (truthKey && row[truthKey]) result.truth.push(String(row[truthKey]));
            if (dareKey && row[dareKey]) result.dare.push(String(row[dareKey]));
        });
    }

    return result;
  };

  // --- HELPERS ---
  const createDeckFromContent = (contents: string[], colorOverride?: string) => {
    const newDeck: CardData[] = contents.map(line => ({
      id: crypto.randomUUID(),
      content: line.trim(),
      color: colorOverride || PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
      pattern: PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
    }));
    return shuffleArray(newDeck);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const getRandomItem = <T,>(array: T[]): T | null => {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  };

  // --- ACTIONS ---

  const handleReturnToMenu = () => {
    setGameMode(GameMode.MENU);
    setAppState(AppState.SETUP);
    setDeck([]);
    setDrawnCards([]);
    setCurrentCard(null);
  };

  // Classic Mode Actions
  const handleSelectTheme = (themeName: string) => {
    const contentList = themes[themeName];
    if (!contentList || contentList.length === 0) return;

    const newDeck = createDeckFromContent(contentList);
    setDeck(newDeck);
    setDrawnCards([]);
    setCurrentCard(null);
    setSelectedThemeName(themeName);
    setAppState(AppState.PLAYING);
  };

  const handleDrawCard = () => {
    if (deck.length === 0) {
      setAppState(AppState.FINISHED);
      return;
    }
    setIsShuffling(true);
    setTimeout(() => {
      const currentDeck = [...deck];
      const drawn = currentDeck.pop();
      if (drawn) {
        setDeck(currentDeck);
        setCurrentCard(drawn);
        setDrawnCards(prev => [...prev, drawn]);
      }
      setIsShuffling(false);
    }, 600);
  };

  const handleReplaySameDeck = () => {
    const allCards = [...deck, ...drawnCards, ...(currentCard ? [currentCard] : [])].filter((c, i, self) => 
       i === self.findIndex((t) => t.id === c.id)
    );
    const reshuffled = shuffleArray(allCards);
    setDeck(reshuffled);
    setDrawnCards([]);
    setCurrentCard(null);
    setAppState(AppState.PLAYING);
  };

  const handleResetClassic = () => {
    setAppState(AppState.SETUP);
    setDeck([]);
    setDrawnCards([]);
    setCurrentCard(null);
    setSelectedThemeName('');
  };

  // Truth or Dare Actions
  const handlePickToD = (type: 'TRUTH' | 'DARE') => {
    let pool: string[] = [];

    // Use fetched data first
    if (type === 'TRUTH') {
        pool = todData.truth;
    } else {
        pool = todData.dare;
    }

    // Checking if pool is empty
    if (!pool || pool.length === 0) {
       // Try fallback if main state is empty (should ideally be handled in fetchAllData but safe double check)
       const fallbackKey = type === 'TRUTH' ? "Sự thật (Offline)" : "Thử thách (Offline)";
       pool = FALLBACK_THEMES[fallbackKey as keyof typeof FALLBACK_THEMES] || [];
       
       if (pool.length === 0) {
         alert(`Chưa có dữ liệu "${type}"! Vui lòng kiểm tra file Google Sheet (Sheet: Truth or Dare, Cột: ${type})`);
         return;
       }
    }

    setIsShuffling(true);
    
    // Pick one random card
    const randomContent = getRandomItem(pool);
    
    if (randomContent) {
        setTimeout(() => {
            const card: CardData = {
                id: crypto.randomUUID(),
                content: randomContent,
                // Truth = Blueish, Dare = Reddish/Orange
                color: type === 'TRUTH' 
                    ? 'bg-sky-100 text-slate-900 border-sky-200' 
                    : 'bg-rose-100 text-slate-900 border-rose-200',
                pattern: PATTERNS[0]
            };
            setCurrentCard(card);
            setIsShuffling(false);
        }, 600);
    }
  };


  // --- RENDERS ---

  const renderHeader = (title: string, subtitle: string) => (
    <header className="mb-6 text-center animate-pop-in relative z-10 w-full">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Sparkles className="text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" size={28} />
        <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
          {title}
        </h1>
        <Sparkles className="text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" size={28} />
      </div>
      <div className="inline-block px-4 py-1 bg-black/30 backdrop-blur-sm rounded-full border border-white/10">
        <p className="text-blue-100 font-bold text-sm md:text-lg tracking-wide">
          {subtitle}
        </p>
      </div>
    </header>
  );

  const renderMainMenu = () => (
    <div className="w-full max-w-4xl flex flex-col items-center animate-pop-in z-10 px-4">
      {renderHeader("Bộ Bài Ma Thuật", "Chọn chế độ chơi")}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-8">
        
        {/* Button: Classic Mode */}
        <button 
          onClick={() => setGameMode(GameMode.CLASSIC)}
          className="group relative h-64 bg-slate-900/50 hover:bg-slate-800/70 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md border border-white/20 hover:border-indigo-400/50 rounded-3xl p-6 transition-all hover:scale-105 shadow-2xl flex flex-col items-center justify-center text-center gap-4"
        >
           <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/40 transition-colors shadow-inner border border-white/10">
             <Layers size={40} className="text-indigo-200" />
           </div>
           <div>
             <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">Rút Thẻ Bài</h2>
             <p className="text-indigo-100 font-medium text-sm drop-shadow-sm">Chọn chủ đề và rút lần lượt từng thẻ trong bộ bài.</p>
           </div>
        </button>

        {/* Button: Truth or Dare */}
        <button 
          onClick={() => setGameMode(GameMode.TOD)}
          className="group relative h-64 bg-slate-900/50 hover:bg-slate-800/70 bg-gradient-to-br from-pink-900/50 to-rose-900/50 backdrop-blur-md border border-white/20 hover:border-rose-400/50 rounded-3xl p-6 transition-all hover:scale-105 shadow-2xl flex flex-col items-center justify-center text-center gap-4"
        >
           <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/40 transition-colors shadow-inner border border-white/10">
             <Flame size={40} className="text-rose-200" />
           </div>
           <div>
             <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">Truth or Dare</h2>
             <p className="text-rose-100 font-medium text-sm drop-shadow-sm">Thật hay Thách? Đối mặt với sự thật hoặc nhận thử thách.</p>
           </div>
        </button>
      </div>

      {/* Loading Status */}
      <div className="mt-12 text-center text-sm text-blue-100/80 flex flex-col items-center gap-2 font-medium drop-shadow-sm">
         {isLoading ? (
            <div className="flex items-center gap-2">
               <Loader2 size={16} className="animate-spin" />
               <span>Đang tải dữ liệu...</span>
            </div>
         ) : (
            <div className="flex items-center gap-2">
               <Database size={14} />
               <span>{isOfflineMode ? 'Dữ liệu Offline' : 'Dữ liệu Online'}</span>
               <button onClick={fetchAllData} className="hover:text-white ml-2"><RefreshCw size={14}/></button>
            </div>
         )}
         {debugMsg && <p className="text-xs text-red-300 max-w-md truncate">{debugMsg}</p>}
      </div>
    </div>
  );

  const renderClassicMode = () => (
    <>
      <div className="absolute top-4 left-4 z-20">
         <button onClick={handleReturnToMenu} className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white backdrop-blur-md transition-all">
            <ArrowLeft size={24} />
         </button>
      </div>

      {renderHeader("Rút Thẻ Bài", appState === AppState.SETUP ? "Chọn chủ đề bộ bài" : `Đang chơi: ${selectedThemeName}`)}

      {/* SETUP SCREEN */}
      {appState === AppState.SETUP && (
        <div className="w-full max-w-4xl animate-pop-in relative z-10 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {Object.keys(themes).map((themeName) => (
              <button
                key={themeName}
                onClick={() => handleSelectTheme(themeName)}
                className="group relative bg-slate-900/40 backdrop-blur-md hover:bg-slate-800/60 border border-white/20 hover:border-purple-400/50 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] text-left flex flex-col gap-3 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-purple-500/30 rounded-bl-full transform translate-x-4 -translate-y-4 transition-transform group-hover:scale-110" />
                <div className="p-3 bg-indigo-500/30 rounded-xl w-fit group-hover:bg-indigo-500/60 transition-colors border border-indigo-400/30">
                  <BookOpen size={24} className="text-indigo-100" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white mb-1 group-hover:text-purple-200 transition-colors drop-shadow-sm">
                    {themeName}
                  </h3>
                  <p className="text-sm text-indigo-200 font-medium">
                    {themes[themeName].length} lá bài
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PLAYING SCREEN */}
      {appState === AppState.PLAYING && (
        <div className="w-full max-w-4xl flex flex-col items-center animate-pop-in relative z-10">
          <div className="flex gap-4 mb-8">
            <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-3">
              <Layers size={20} className="text-purple-300" />
              <span className="font-bold text-white text-lg">Bộ bài: {deck.length}</span>
            </div>
            <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-3">
              <RotateCcw size={20} className="text-pink-300" />
              <span className="font-bold text-white text-lg">Đã rút: {drawnCards.length}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 w-full min-h-[450px]">
            {/* The Deck */}
            <div className="relative group perspective-1000">
              {deck.length > 0 ? (
                <div 
                  onClick={!isShuffling ? handleDrawCard : undefined}
                  className={`relative transition-all duration-300 ${!isShuffling ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-wait'}`}
                >
                   {/* Stack layers */}
                  {deck.length > 2 && <div className="absolute top-0 left-0 w-64 h-96 bg-indigo-900 rounded-2xl transform -rotate-6 translate-x-4 translate-y-4 opacity-60 border border-white/20 shadow-xl"></div>}
                  {deck.length > 1 && <div className="absolute top-0 left-0 w-64 h-96 bg-purple-900 rounded-2xl transform -rotate-3 translate-x-2 translate-y-2 opacity-80 border border-white/30 shadow-xl"></div>}
                  <Card 
                    isBack 
                    className={`relative z-10 card-stack-effect ${isShuffling ? 'animate-wiggle' : 'animate-bounce-slow'}`} 
                  />
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <span className="bg-black/60 text-white font-black px-6 py-3 rounded-full shadow-2xl text-lg backdrop-blur-md border border-white/50 animate-pulse tracking-wider">
                      RÚT BÀI
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-64 h-96 border-4 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center text-white/50 bg-black/20 backdrop-blur-sm">
                  <span className="text-5xl mb-4 grayscale opacity-50">✨</span>
                  <span className="font-bold text-xl uppercase tracking-widest">Hết bài</span>
                </div>
              )}
            </div>

            {/* The Drawn Card */}
            <div className="perspective-1000 relative w-64 h-96 flex items-center justify-center">
              {currentCard ? (
                <Card data={currentCard} />
              ) : (
                <div className="text-center opacity-60">
                  <div className="w-64 h-96 border-4 border-white/10 rounded-2xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
                    <p className="text-white font-bold px-8 text-lg drop-shadow-md">
                      Lá bài định mệnh <br/>sẽ xuất hiện ở đây
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 flex gap-4">
             <button
              onClick={handleReplaySameDeck}
              className="px-8 py-4 bg-indigo-600/80 backdrop-blur-md border border-indigo-400/50 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-500 transition-all hover:scale-105 hover:shadow-indigo-500/30 flex items-center gap-3"
            >
              <Shuffle size={20} />
              Trộn lại
            </button>
            <button
              onClick={handleResetClassic}
              className="px-8 py-4 bg-slate-700/80 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-600 transition-all hover:scale-105 flex items-center gap-3"
            >
              <Database size={20} />
              Đổi chủ đề
            </button>
          </div>
        </div>
      )}

      {/* FINISHED SCREEN */}
      {appState === AppState.FINISHED && (
         <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] animate-pop-in text-center border-4 border-purple-200 z-20">
            <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-inner">
              <PartyPopper size={40} />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-2">Đã Rút Hết!</h2>
            <p className="text-slate-600 mb-8 font-medium">Bạn đã hoàn thành bộ bài <br/><strong className="text-purple-600 text-lg">{selectedThemeName}</strong>.</p>
            <div className="space-y-4">
              <button onClick={handleReplaySameDeck} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-200 hover:scale-[1.02] transition-transform">
                Chơi lại bộ bài này
              </button>
              <button onClick={handleResetClassic} className="w-full py-4 bg-slate-100 border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors">
                Chọn chủ đề khác
              </button>
            </div>
         </div>
      )}
    </>
  );

  const renderToDMode = () => (
    <>
       <div className="absolute top-4 left-4 z-20">
         <button onClick={handleReturnToMenu} className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white backdrop-blur-md transition-all">
            <ArrowLeft size={24} />
         </button>
      </div>

      {renderHeader("Truth or Dare", "Sự thật hay Thử thách?")}

      <div className="w-full max-w-5xl flex flex-col items-center animate-pop-in relative z-10 px-4">
         
         <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full mt-4">
            
            {/* Control Panel (Buttons) */}
            <div className="flex flex-col gap-6 w-full md:w-1/3">
                <button
                   onClick={() => handlePickToD('TRUTH')}
                   disabled={isShuffling}
                   className="group w-full py-6 px-4 bg-gradient-to-r from-sky-500/80 to-blue-600/80 backdrop-blur-md border border-sky-300/30 rounded-2xl shadow-lg hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-full">
                            <HelpCircle size={32} className="text-white"/>
                        </div>
                        <div className="text-left">
                            <span className="block text-2xl font-black text-white uppercase tracking-wider">Truth</span>
                            <span className="text-sky-100 text-sm">Nói sự thật</span>
                        </div>
                    </div>
                </button>

                <button
                   onClick={() => handlePickToD('DARE')}
                   disabled={isShuffling}
                   className="group w-full py-6 px-4 bg-gradient-to-r from-rose-500/80 to-red-600/80 backdrop-blur-md border border-rose-300/30 rounded-2xl shadow-lg hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-full">
                            <Flame size={32} className="text-white"/>
                        </div>
                        <div className="text-left">
                            <span className="block text-2xl font-black text-white uppercase tracking-wider">Dare</span>
                            <span className="text-rose-100 text-sm">Nhận thử thách</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Display Card Area */}
            <div className="relative w-72 h-[450px] flex items-center justify-center perspective-1000">
               {isShuffling ? (
                  <div className="absolute inset-0 flex items-center justify-center z-50">
                     <Card isBack className="animate-wiggle" />
                  </div>
               ) : currentCard ? (
                  <Card data={currentCard} className="animate-pop-in" />
               ) : (
                  <div className="w-full h-full border-4 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm p-6 text-center">
                     <Gamepad2 size={64} className="text-white/20 mb-4" />
                     <p className="text-white/40 font-bold text-lg">
                        Hãy chọn 1 trong 2 lựa chọn bên cạnh
                     </p>
                  </div>
               )}
            </div>

         </div>

      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 font-sans text-white relative overflow-hidden overflow-y-auto">
      
      {/* Background Magic Particles */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600 rounded-full blur-[80px] animate-pulse"></div>
         <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {gameMode === GameMode.MENU && renderMainMenu()}
      {gameMode === GameMode.CLASSIC && renderClassicMode()}
      {gameMode === GameMode.TOD && renderToDMode()}

    </div>
  );
};

export default App;