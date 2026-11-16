import React, { useEffect, useState } from 'react';
import {
  Bot,
  Clock,
  Eye,
  History,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { db, initializeLocalDatabase } from '../db/dexieDb';
import { getItemCode } from '../data/foodData';
import { translateGroup, translateItemName } from '../data/translations';
import type {
  AiHistoryEntry,
  FoodItem,
  Lang,
  SearchHistoryEntry,
  ViewStatEntry,
} from '../types';

interface MyHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  items: FoodItem[];
  lang: Lang;
  onApplySearch: (keyword: string) => void;
  onSelectItem: (item: FoodItem) => void;
}

type HistoryTab = 'views' | 'searches' | 'ai';

const HISTORY_TEXT: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    close: string;
    tabViews: string;
    tabSearches: string;
    tabAi: string;
    clearTab: string;
    emptyViews: string;
    emptySearches: string;
    emptyAi: string;
    lastViewed: string;
    viewsUnit: string;
    resultsWord: string;
    searchAgain: string;
    askedPrefix: string;
  }
> = {
  VI: {
    title: 'Lịch sử tra cứu của tôi',
    subtitle: 'Lưu cục bộ trên thiết bị (IndexedDB) — Xem lại ngay cả khi Offline',
    close: 'Đóng',
    tabViews: 'Xem nhiều',
    tabSearches: 'Từ khóa',
    tabAi: 'Hỏi đáp AI',
    clearTab: 'Xóa mục này',
    emptyViews: 'Chưa có sản phẩm nào được mở xem chi tiết trên thiết bị này.',
    emptySearches: 'Chưa có từ khóa tìm kiếm nào được ghi nhận.',
    emptyAi: 'Chưa có lịch sử hỏi đáp Trợ lý AI.',
    lastViewed: 'Lần cuối:',
    viewsUnit: 'lượt xem',
    resultsWord: 'kết quả',
    searchAgain: 'Tìm lại →',
    askedPrefix: 'Hỏi:',
  },
  EN: {
    title: 'My Lookup History',
    subtitle: 'Stored locally on device (IndexedDB) — Available even Offline',
    close: 'Close',
    tabViews: 'Most Viewed',
    tabSearches: 'Keywords',
    tabAi: 'AI Q&A',
    clearTab: 'Clear this tab',
    emptyViews: 'No products have been viewed in detail on this device yet.',
    emptySearches: 'No search keywords have been recorded yet.',
    emptyAi: 'No AI Assistant Q&A history yet.',
    lastViewed: 'Last viewed:',
    viewsUnit: 'views',
    resultsWord: 'results',
    searchAgain: 'Search again →',
    askedPrefix: 'Q:',
  },
  KO: {
    title: '내 조회 기록',
    subtitle: '기기에 로컬 저장됨(IndexedDB) — 오프라인에서도 확인 가능',
    close: '닫기',
    tabViews: '자주 본 품목',
    tabSearches: '검색어',
    tabAi: 'AI 질의응답',
    clearTab: '이 항목 지우기',
    emptyViews: '이 기기에서 상세 조회한 품목이 아직 없습니다.',
    emptySearches: '기록된 검색어가 아직 없습니다.',
    emptyAi: 'AI 도우미 대화 기록이 아직 없습니다.',
    lastViewed: '최근 조회:',
    viewsUnit: '조회수',
    resultsWord: '건',
    searchAgain: '다시 검색 →',
    askedPrefix: '질문:',
  },
  HI: {
    title: 'मेरा खोज इतिहास',
    subtitle: 'डिवाइस पर स्थानीय रूप से सहेजा गया (IndexedDB) — ऑफ़लाइन भी उपलब्ध',
    close: 'बंद करें',
    tabViews: 'सर्वाधिक देखे गए',
    tabSearches: 'खोज शब्द',
    tabAi: 'AI प्रश्नोत्तर',
    clearTab: 'यह टैब साफ़ करें',
    emptyViews: 'इस डिवाइस पर अभी तक कोई उत्पाद विस्तार से नहीं देखा गया है।',
    emptySearches: 'अभी तक कोई खोज शब्द दर्ज नहीं किया गया है।',
    emptyAi: 'अभी तक कोई AI सहायक इतिहास नहीं है।',
    lastViewed: 'अंतिम बार देखा गया:',
    viewsUnit: 'बार देखा गया',
    resultsWord: 'परिणाम',
    searchAgain: 'फिर खोजें →',
    askedPrefix: 'प्रश्न:',
  },
};

function formatTime(ts: number, lang: Lang): string {
  const localeMap: Record<Lang, string> = {
    VI: 'vi-VN',
    EN: 'en-US',
    KO: 'ko-KR',
    HI: 'hi-IN',
  };
  try {
    return new Intl.DateTimeFormat(localeMap[lang], {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(ts));
  } catch {
    return '';
  }
}

export function MyHistoryPanel({
  open,
  onClose,
  items,
  lang,
  onApplySearch,
  onSelectItem,
}: MyHistoryPanelProps) {
  const [tab, setTab] = useState<HistoryTab>('views');
  const [viewStats, setViewStats] = useState<ViewStatEntry[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchHistoryEntry[]>([]);
  const [aiLogs, setAiLogs] = useState<AiHistoryEntry[]>([]);
  const L = HISTORY_TEXT[lang];

  const loadLogs = async () => {
    await initializeLocalDatabase();
    const [views, searches, ais] = await Promise.all([
      db.viewStats.orderBy('viewCount').reverse().limit(40).toArray(),
      db.searchLogs.orderBy('timestamp').reverse().limit(50).toArray(),
      db.aiLogs.orderBy('timestamp').reverse().limit(40).toArray(),
    ]);
    setViewStats(views);
    setSearchLogs(searches);
    setAiLogs(ais);
  };

  useEffect(() => {
    if (open) {
      void loadLogs();
    }
  }, [open]);

  if (!open) return null;

  const findItemByCode = (code: string) =>
    items.find((it) => getItemCode(it).toUpperCase() === code.toUpperCase());

  const handleClearCurrentTab = async () => {
    if (tab === 'views') await db.viewStats.clear();
    if (tab === 'searches') await db.searchLogs.clear();
    if (tab === 'ai') await db.aiLogs.clear();
    await loadLogs();
  };

  return (
    <div
      className="fade-in fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={L.title}
    >
      <button
        type="button"
        aria-label={L.close}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
      />
      <div className="sheet-up relative w-full max-w-[720px] max-h-[88dvh] flex flex-col bg-white text-[#182230] border border-[#E2DDD0] rounded-t-[24px] sm:rounded-[20px] shadow-2xl overflow-hidden">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#D6D0C0] sm:hidden shrink-0" />

        <div className="border-b border-[#EAE5DA] px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-[#122A47] text-[#E2C665] flex items-center justify-center shrink-0">
              <History size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[16.5px] font-extrabold text-[#122A47] truncate">
                {L.title}
              </h2>
              <p className="text-[11.5px] text-[#5C6573] truncate">{L.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={L.close}
            className="h-10 w-10 rounded-xl bg-[#F6F4EF] hover:bg-[#EAE5DA] flex items-center justify-center shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-5 pt-3 pb-2 border-b border-[#EAE5DA] bg-[#FAF9F6] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setTab('views')}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                tab === 'views'
                  ? 'bg-[#122A47] text-white'
                  : 'bg-white border border-[#DFD9CB] text-[#2B3647]'
              }`}
            >
              <Eye size={13} />
              <span>
                {L.tabViews} ({viewStats.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab('searches')}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                tab === 'searches'
                  ? 'bg-[#122A47] text-white'
                  : 'bg-white border border-[#DFD9CB] text-[#2B3647]'
              }`}
            >
              <Search size={13} />
              <span>
                {L.tabSearches} ({searchLogs.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab('ai')}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                tab === 'ai'
                  ? 'bg-[#122A47] text-white'
                  : 'bg-white border border-[#DFD9CB] text-[#2B3647]'
              }`}
            >
              <Bot size={13} />
              <span>
                {L.tabAi} ({aiLogs.length})
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleClearCurrentTab()}
            className="text-[12px] font-semibold text-[#9A3412] hover:underline flex items-center gap-1"
          >
            <Trash2 size={13} />
            <span>{L.clearTab}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
          {tab === 'views' &&
            (viewStats.length === 0 ? (
              <p className="text-center text-[13.5px] text-[#5C6573] py-10">
                {L.emptyViews}
              </p>
            ) : (
              viewStats.map((entry) => {
                const matched = findItemByCode(entry.itemCode);
                return (
                  <button
                    key={entry.itemCode}
                    type="button"
                    disabled={!matched}
                    onClick={() => {
                      if (matched) {
                        onSelectItem(matched);
                        onClose();
                      }
                    }}
                    className="w-full text-left rounded-xl border border-[#EAE5DA] bg-white hover:border-[#C9A227] p-3.5 flex items-center justify-between gap-3 transition-colors disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11.5px]">
                        <span className="font-mono font-bold text-[#8A6510]">
                          {entry.itemCode}
                        </span>
                        <span className="text-[#5C6573] truncate">
                          {translateGroup(entry.group, lang)}
                        </span>
                      </div>
                      <p className="font-bold text-[14px] text-[#122A47] mt-0.5 truncate">
                        {matched ? translateItemName(matched, lang) : entry.itemName}
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        <span>
                          {L.lastViewed} {formatTime(entry.lastViewedAt, lang)}
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#F2EFE8] px-2.5 py-1.5 text-center">
                      <span className="block font-mono text-[14px] font-extrabold text-[#122A47]">
                        {entry.viewCount}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#5C6573]">
                        {L.viewsUnit}
                      </span>
                    </div>
                  </button>
                );
              })
            ))}

          {tab === 'searches' &&
            (searchLogs.length === 0 ? (
              <p className="text-center text-[13.5px] text-[#5C6573] py-10">
                {L.emptySearches}
              </p>
            ) : (
              searchLogs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => {
                    onApplySearch(log.keyword);
                    onClose();
                  }}
                  className="w-full text-left rounded-xl border border-[#EAE5DA] bg-white hover:border-[#1E4A75] p-3 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] text-[#122A47] truncate">
                      &ldquo;{log.keyword}&rdquo;
                    </p>
                    <p className="text-[11.5px] text-[#5C6573] mt-0.5">
                      {log.resultCount} {L.resultsWord} · {log.lang} ·{' '}
                      {formatTime(log.timestamp, lang)}
                    </p>
                  </div>
                  <span className="text-[12px] font-bold text-[#1E4A75] shrink-0">
                    {L.searchAgain}
                  </span>
                </button>
              ))
            ))}

          {tab === 'ai' &&
            (aiLogs.length === 0 ? (
              <p className="text-center text-[13.5px] text-[#5C6573] py-10">
                {L.emptyAi}
              </p>
            ) : (
              aiLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-[#EAE5DA] bg-[#FAF9F6] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#5C6573]">
                    <span className="font-bold text-[#122A47]">
                      {L.askedPrefix} {log.question}
                    </span>
                    <span className="shrink-0 font-mono">
                      {formatTime(log.timestamp, lang)}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#2B3647] whitespace-pre-line leading-relaxed">
                    {log.answer}
                  </p>
                  {log.matchedCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {log.matchedCodes.map((code) => {
                        const matched = findItemByCode(code);
                        return (
                          <button
                            key={code}
                            type="button"
                            disabled={!matched}
                            onClick={() => {
                              if (matched) {
                                onSelectItem(matched);
                                onClose();
                              }
                            }}
                            className="px-2 py-0.5 rounded-md bg-white border border-[#DFD9CB] hover:border-[#122A47] font-mono text-[11px] font-bold text-[#8A6510]"
                          >
                            {code}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
