import React, { useState, useEffect } from 'react';
import { Layers, RotateCcw, Shuffle, PartyPopper, Sparkles, Database, AlertCircle, Loader2, BookOpen, RefreshCw, WifiOff } from 'lucide-react';
import { CardData, AppState, ThemeCollection } from './types';
import { PASTEL_COLORS, PATTERNS, API_URL, FALLBACK_THEMES } from './constants';
import { Card } from './components/Card';

const App: React.FC = () => {
  // State
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [drawnCards, setDrawnCards] = useState<CardData[]>([]);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  
  // Data State
  const [themes, setThemes] = useState<ThemeCollection>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [selectedThemeName, setSelectedThemeName] = useState<string>('');
  const [debugMsg, setDebugMsg] = useState<string>('');
  
  // Animation state
  const [isShuffling, setIsShuffling] = useState(false);

  // Fetch Data on Mount
  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    setIsLoading(true);
    setError(null);
    setIsOfflineMode(false);
    setDebugMsg('');

    try {
      const separator = API_URL.includes('?') ? '&' : '?';
      const targetUrl = `${API_URL}${separator}sheet=cards&sheetName=cards&_nocache=${Date.now()}`;
      
      console.log('Fetching:', targetUrl);

      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow', 
        credentials: 'omit',
      });

      if (!response.ok) {
         throw new Error(`Lỗi kết nối: ${response.status} ${response.statusText}`);
      }
      
      const textData = await response.text();
      
      let data;
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.error("JSON Parse Error:", textData);
        throw new Error('Dữ liệu trả về không đúng định dạng JSON.');
      }
      
      // --- SPECIFIC ERROR TRAP FOR "TOPICS ONLY" RESPONSE ---
      if (typeof data === 'object' && data !== null && Array.isArray(data.topics) && !data.data && !data.cards && !Array.isArray(data)) {
          throw new Error(`LỖI SCRIPT (Backend): Google Script hiện tại chỉ trả về danh sách chủ đề ["${data.topics.slice(0,3).join(', ')}"...] mà thiếu nội dung thẻ. Vui lòng thay thế code trong Google Apps Script bằng đoạn code chuẩn.`);
      }

      // INTELLIGENT DATA EXTRACTION
      let items: any[] = [];
      const isComplexArray = (arr: any[]) => {
         if (!Array.isArray(arr) || arr.length === 0) return false;
         const first = arr[0];
         return (typeof first === 'object' && first !== null) || Array.isArray(first);
      };

      if (Array.isArray(data) && isComplexArray(data)) {
        items = data;
      } else if (typeof data === 'object' && data !== null) {
        const knownKeys = ['cards', 'data', 'items', 'records', 'result', 'values'];
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

      if (!Array.isArray(items) || items.length === 0) {
         const receivedKeys = typeof data === 'object' && data !== null ? Object.keys(data).join(', ') : typeof data;
         const sample = typeof data === 'object' ? JSON.stringify(data).substring(0, 50) + '...' : String(data);
         throw new Error(`Không tìm thấy dữ liệu thẻ bài. Script trả về các trường: [${receivedKeys}]. Mẫu: ${sample}`);
      }

      const processedThemes = processSheetData(items);
      
      if (Object.keys(processedThemes).length === 0) {
         const firstItemStr = JSON.stringify(items[0]);
         throw new Error(`Không đọc được dữ liệu thẻ. Dòng đầu tiên: ${firstItemStr}. Hãy kiểm tra tên cột 'topic' và 'question'.`);
      }

      setThemes(processedThemes);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setDebugMsg(err.message || String(err));
      console.warn("Switching to Offline Mode");
      setThemes(FALLBACK_THEMES);
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const processSheetData = (data: any[]): ThemeCollection => {
    const themeMap: ThemeCollection = {};
    if (!Array.isArray(data) || data.length === 0) return {};

    const sample = data[0];
    if (!sample) return {};

    // --- CASE 1: Array of Arrays (2D Table from Sheet) ---
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
          if (topicIdx !== -1 && row[topicIdx]) {
             topic = String(row[topicIdx]).trim();
          }

          if (!themeMap[topic]) themeMap[topic] = [];
          themeMap[topic].push(String(content));
       }
       return themeMap;
    }

    // --- CASE 2: Array of Objects (JSON) ---
    if (typeof sample === 'object') {
        const keys = Object.keys(sample);
        const findKey = (patterns: RegExp[]) => keys.find(k => patterns.some(p => p.test(k)));

        let contentKey = keys.find(k => k.toLowerCase() === 'question');
        if (!contentKey) contentKey = findKey([/content/i, /nội dung/i, /text/i, /câu hỏi/i, /yêu cầu/i]);
        
        let topicKey = keys.find(k => k.toLowerCase() === 'topic');
        if (!topicKey) topicKey = findKey([/chủ đề/i, /category/i, /theme/i]);

        const finalContentKey = contentKey || keys[0];
        let finalTopicKey = topicKey;
        if (!finalTopicKey && keys.length > 1) {
          finalTopicKey = keys.find(k => k !== finalContentKey);
        }

        data.forEach(row => {
          const content = row[finalContentKey];
          let topic = 'Bộ Bài Chính';
          if (finalTopicKey && row[finalTopicKey]) {
              topic = String(row[finalTopicKey]).trim();
          }
          if (!content || !String(content).trim()) return;
          
          if (!themeMap[topic]) themeMap[topic] = [];
          themeMap[topic].push(String(content));
        });
        
        return themeMap;
    }
    return {};
  };

  const createDeckFromContent = (contents: string[]) => {
    const newDeck: CardData[] = contents.map(line => ({
      id: crypto.randomUUID(),
      content: line.trim(),
      color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
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

  const handleReset = () => {
    setAppState(AppState.SETUP);
    setDeck([]);
    setDrawnCards([]);
    setCurrentCard(null);
    setSelectedThemeName('');
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-white relative overflow-hidden">
      
      {/* Background Magic Particles */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600 rounded-full blur-[80px] animate-pulse"></div>
         <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header */}
      <header className="mb-8 text-center animate-pop-in relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Sparkles className="text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" size={32} />
          <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            Bộ Bài Ma Thuật
          </h1>
          <Sparkles className="text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" size={32} />
        </div>
        <div className="inline-block px-4 py-1 bg-black/30 backdrop-blur-sm rounded-full border border-white/10">
          <p className="text-blue-100 font-bold text-lg tracking-wide">
            {appState === AppState.SETUP ? "✨ Chọn chủ đề để triệu hồi ✨" : `🔮 Đang chơi: ${selectedThemeName}`}
          </p>
        </div>
      </header>

      {/* SETUP SCREEN: THEME SELECTION */}
      {appState === AppState.SETUP && (
        <div className="w-full max-w-4xl animate-pop-in relative z-10">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-white">
              <div className="bg-black/20 p-6 rounded-full backdrop-blur-md">
                <Loader2 size={48} className="animate-spin mb-4 text-purple-300" />
              </div>
              <p className="text-xl font-bold mt-4 drop-shadow-md">Đang kết nối thư viện ma thuật...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              
              {isOfflineMode && (
                <div className="flex flex-col items-center gap-2 mb-6 animate-pop-in w-full max-w-2xl">
                  <div className="bg-red-900/40 backdrop-blur-md px-6 py-4 rounded-xl border border-red-500/50 flex flex-col items-center text-center gap-2 text-white text-sm w-full shadow-lg">
                    <div className="flex items-center gap-2 font-bold text-red-200 text-lg">
                      <WifiOff size={20} />
                      <span>Kết nối gặp vấn đề</span>
                    </div>
                    {debugMsg && (
                      <div className="bg-black/40 p-3 rounded-lg w-full text-xs font-mono text-red-100/90 break-words whitespace-pre-wrap border border-red-500/20">
                        {debugMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4">
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
              
              <div className="mt-12 text-center text-sm text-blue-200/70 flex flex-col items-center gap-2 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                <Database size={16} />
                <span className="font-medium">
                   {isOfflineMode ? 'Đang dùng dữ liệu mẫu (Offline)' : 'Dữ liệu từ Google Sheet'}
                </span>
                <button 
                  onClick={fetchThemes} 
                  className="flex items-center gap-2 hover:text-white transition-all mt-1 px-4 py-2 rounded-full hover:bg-white/10 font-bold border border-transparent hover:border-white/20"
                >
                   <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> 
                   {isLoading ? 'Đang tải...' : 'Thử kết nối lại'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PLAYING SCREEN */}
      {appState === AppState.PLAYING && (
        <div className="w-full max-w-4xl flex flex-col items-center animate-pop-in relative z-10">
          
          {/* Top Info Bar */}
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
            
            {/* The Deck (Clickable) */}
            <div className="relative group perspective-1000">
              {deck.length > 0 ? (
                <div 
                  onClick={!isShuffling ? handleDrawCard : undefined}
                  className={`relative transition-all duration-300 ${!isShuffling ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-wait'}`}
                >
                  {/* Stack effect layers */}
                  {deck.length > 2 && <div className="absolute top-0 left-0 w-64 h-96 bg-indigo-900 rounded-2xl transform -rotate-6 translate-x-4 translate-y-4 opacity-60 border border-white/20 shadow-xl"></div>}
                  {deck.length > 1 && <div className="absolute top-0 left-0 w-64 h-96 bg-purple-900 rounded-2xl transform -rotate-3 translate-x-2 translate-y-2 opacity-80 border border-white/30 shadow-xl"></div>}
                  
                  {/* Top Card Back */}
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

            {/* The Drawn Card (Display) */}
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

          {/* Action Buttons */}
          <div className="mt-12 flex gap-4">
             <button
              onClick={handleReplaySameDeck}
              className="px-8 py-4 bg-indigo-600/80 backdrop-blur-md border border-indigo-400/50 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-500 transition-all hover:scale-105 hover:shadow-indigo-500/30 flex items-center gap-3"
            >
              <Shuffle size={20} />
              Trộn lại
            </button>
            <button
              onClick={handleReset}
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
              <button
                onClick={handleReplaySameDeck}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-200 hover:scale-[1.02] transition-transform"
              >
                Chơi lại bộ bài này
              </button>
              <button
                onClick={handleReset}
                className="w-full py-4 bg-slate-100 border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors"
              >
                Chọn chủ đề khác
              </button>
            </div>
         </div>
      )}

    </div>
  );
};

export default App;