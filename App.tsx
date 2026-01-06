import React, { useState, useEffect } from 'react';
import { Layers, RotateCcw, Play, Edit3, Shuffle, PartyPopper, Sparkles, Database, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { CardData, AppState, ThemeConfig } from './types';
import { PASTEL_COLORS, PATTERNS, DEFAULT_INPUT, PRESET_THEMES } from './constants';
import { Card } from './components/Card';

const App: React.FC = () => {
  // State
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [inputText, setInputText] = useState<string>(DEFAULT_INPUT);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [drawnCards, setDrawnCards] = useState<CardData[]>([]);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  
  // Theme State
  const [selectedThemeId, setSelectedThemeId] = useState<string>(PRESET_THEMES[0].id);
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  
  // Animation state
  const [isShuffling, setIsShuffling] = useState(false);

  // Helper: Create Deck from raw text lines
  const createDeckFromLines = (lines: string[]) => {
    const validLines = lines.filter(line => line.trim() !== '');
    const newDeck: CardData[] = validLines.map(line => ({
      id: crypto.randomUUID(),
      content: line.trim(),
      color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
      pattern: PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
    }));
    return shuffleArray(newDeck);
  };

  // Helper: Fisher-Yates Shuffle
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleFetchSheet = async (url: string) => {
    setIsLoadingSheet(true);
    setSheetError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không thể tải dữ liệu. Kiểm tra quyền truy cập.');
      
      const csvText = await response.text();
      // Simple CSV parsing: split by new line, then take first column if comma exists
      // Handle simple quotes removal
      const rows = csvText.split('\n').map(row => {
        // Basic CSV handling: remove wrapping quotes if present
        let content = row.trim();
        if (content.startsWith('"') && content.endsWith('"')) {
            content = content.slice(1, -1);
        }
        // If there are commas inside, usually sheets export puts it in quotes. 
        // If simply split by comma, we might break sentences. 
        // For simplicity, we assume one column or we take the whole line if not complex csv.
        // Let's just use the whole line but remove typical CSV artifacts if it looks like multi-column.
        const parts = content.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma respecting quotes
        return parts[0].replace(/""/g, '"').trim(); // Take first column
      });
      
      const newDeck = createDeckFromLines(rows);
      if (newDeck.length === 0) throw new Error('File không có dữ liệu hợp lệ.');
      
      setDeck(newDeck);
      setDrawnCards([]);
      setCurrentCard(null);
      setAppState(AppState.PLAYING);

    } catch (err) {
      setSheetError(err instanceof Error ? err.message : 'Lỗi kết nối Google Sheet');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleStartGame = () => {
    const theme = PRESET_THEMES.find(t => t.id === selectedThemeId);
    
    if (theme?.type === 'manual') {
      const newDeck = createDeckFromLines(inputText.split('\n'));
      if (newDeck.length === 0) {
        alert("Vui lòng nhập ít nhất một nội dung thẻ bài!");
        return;
      }
      setDeck(newDeck);
      setDrawnCards([]);
      setCurrentCard(null);
      setAppState(AppState.PLAYING);
    } else {
      // Sheet mode
      const urlToFetch = theme?.id === 'custom-sheet' ? sheetUrl : theme?.url;
      if (!urlToFetch) {
        setSheetError("Vui lòng nhập đường dẫn Google Sheet CSV");
        return;
      }
      handleFetchSheet(urlToFetch);
    }
  };

  const handleDrawCard = () => {
    if (deck.length === 0) {
      setAppState(AppState.FINISHED);
      return;
    }

    setIsShuffling(true);

    // Simulate a short shuffle/selection delay for effect
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
    setSheetError(null);
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

  const currentTheme = PRESET_THEMES.find(t => t.id === selectedThemeId);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-white relative overflow-hidden">
      
      {/* Background Magic Particles - Simplified CSS approach */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header */}
      <header className="mb-8 text-center animate-pop-in relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Sparkles className="text-yellow-300 animate-pulse" size={32} />
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-blue-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            Bộ Bài Ma Thuật
          </h1>
          <Sparkles className="text-yellow-300 animate-pulse" size={32} />
        </div>
        <p className="text-blue-100 font-medium text-lg drop-shadow-md">
          {appState === AppState.SETUP ? "Chọn chủ đề và triệu hồi bộ bài!" : "Hãy để số phận quyết định..."}
        </p>
      </header>

      {/* SETUP SCREEN */}
      {appState === AppState.SETUP && (
        <div className="w-full max-w-xl bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl animate-pop-in border border-white/50 text-slate-800">
          
          {/* Theme Selector */}
          <div className="mb-6">
            <label className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-3">
              <Database size={20} className="text-purple-600" />
              Chọn Chủ Đề Bộ Bài
            </label>
            <div className="grid grid-cols-1 gap-3">
              {PRESET_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedThemeId(theme.id);
                    setSheetError(null);
                  }}
                  className={`flex items-start p-3 rounded-xl border-2 transition-all text-left ${
                    selectedThemeId === theme.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`mt-1 p-2 rounded-full mr-3 ${selectedThemeId === theme.id ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {theme.type === 'manual' ? <Edit3 size={16} /> : <FileSpreadsheet size={16} />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{theme.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{theme.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input Area based on Theme Type */}
          <div className="mb-6 transition-all">
            {currentTheme?.type === 'manual' ? (
              <div className="animate-pop-in">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-500">Nhập danh sách (mỗi dòng 1 thẻ):</span>
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {inputText.split('\n').filter(l => l.trim()).length} thẻ
                    </span>
                 </div>
                 <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-48 p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all resize-none text-slate-700 font-medium"
                  placeholder="Ví dụ:&#10;Lá bài phép thuật&#10;Triệu hồi rồng trắng&#10;..."
                />
              </div>
            ) : (
              <div className="animate-pop-in bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileSpreadsheet className="text-green-600" size={20} />
                  <span className="font-bold text-slate-700">Cấu hình Google Sheet</span>
                </div>
                
                {currentTheme?.id === 'custom-sheet' && (
                  <div className="mb-4">
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Link CSV công khai</label>
                     <input 
                        type="text" 
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                        className="w-full p-3 rounded-lg border border-slate-300 focus:border-green-500 outline-none text-sm font-mono text-slate-600"
                     />
                     <p className="text-[10px] text-slate-400 mt-1 italic">
                       * Vào File {'>'} Share {'>'} Publish to Web {'>'} Chọn định dạng CSV
                     </p>
                  </div>
                )}
                
                {sheetError && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm mb-2">
                    <AlertCircle size={16} />
                    {sheetError}
                  </div>
                )}

                <div className="text-sm text-slate-600">
                  Hệ thống sẽ tải dữ liệu từ cột đầu tiên của sheet. Hãy đảm bảo file ở chế độ công khai.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStartGame}
            disabled={isLoadingSheet}
            className={`w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-xl shadow-lg shadow-purple-900/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isLoadingSheet ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isLoadingSheet ? (
              <><Loader2 className="animate-spin" /> Đang triệu hồi...</>
            ) : (
              <><Play fill="currentColor" size={24} /> Bắt đầu Rút Bài</>
            )}
          </button>
        </div>
      )}

      {/* PLAYING SCREEN */}
      {appState === AppState.PLAYING && (
        <div className="w-full max-w-4xl flex flex-col items-center animate-pop-in relative z-10">
          
          {/* Top Info Bar */}
          <div className="flex gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-2">
              <Layers size={18} className="text-purple-300" />
              <span className="font-bold text-white">Bộ bài: {deck.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-2">
              <RotateCcw size={18} className="text-pink-300" />
              <span className="font-bold text-white">Đã rút: {drawnCards.length}</span>
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
                  {deck.length > 2 && <div className="absolute top-0 left-0 w-64 h-96 bg-purple-900 rounded-2xl transform -rotate-6 translate-x-4 translate-y-4 opacity-40 border border-white/10"></div>}
                  {deck.length > 1 && <div className="absolute top-0 left-0 w-64 h-96 bg-indigo-800 rounded-2xl transform -rotate-3 translate-x-2 translate-y-2 opacity-60 border border-white/20"></div>}
                  
                  {/* Top Card Back */}
                  <Card 
                    isBack 
                    className={`relative z-10 card-stack-effect ${isShuffling ? 'animate-wiggle' : 'animate-bounce-slow'}`} 
                  />
                  
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <span className="bg-black/40 text-white font-bold px-4 py-2 rounded-full shadow-lg text-sm backdrop-blur-md border border-white/30 animate-pulse">
                      Rút bài
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-64 h-96 border-4 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center text-white/50 bg-white/5">
                  <span className="text-4xl mb-2">✨</span>
                  <span className="font-bold">Hết bài</span>
                </div>
              )}
            </div>

            {/* The Drawn Card (Display) */}
            <div className="perspective-1000 relative w-64 h-96 flex items-center justify-center">
              {currentCard ? (
                <Card data={currentCard} />
              ) : (
                <div className="text-center opacity-40">
                  <div className="w-64 h-96 border-4 border-white/20 rounded-2xl flex items-center justify-center bg-white/5">
                    <p className="text-white font-medium px-8">
                      Lá bài định mệnh sẽ xuất hiện ở đây
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
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-xl font-bold shadow-lg hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Shuffle size={20} />
              Trộn lại
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-xl font-bold shadow-lg hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Edit3 size={20} />
              Chủ đề mới
            </button>
          </div>
        </div>
      )}

      {/* FINISHED SCREEN */}
      {appState === AppState.FINISHED && (
         <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl animate-pop-in text-center border-4 border-purple-200 z-20">
            <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <PartyPopper size={40} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Phiên Bài Kết Thúc!</h2>
            <p className="text-slate-500 mb-8">Bạn đã khám phá hết bí mật của bộ bài này.</p>
            
            <div className="space-y-3">
              <button
                onClick={handleReplaySameDeck}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:scale-[1.02] transition-transform"
              >
                Chơi lại bộ bài này
              </button>
              <button
                onClick={handleReset}
                className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
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