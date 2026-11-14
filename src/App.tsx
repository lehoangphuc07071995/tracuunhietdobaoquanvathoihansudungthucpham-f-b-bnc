import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Flame,
  Globe,
  House,
  LayoutGrid,
  List,
  Loader2,
  PackageSearch,
  Search,
  Snowflake,
  Sparkles,
  Thermometer,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  ALL_GROUPS,
  FOOD_ITEMS,
  getItemCode,
  hasCellValue,
  hasUseToday,
  isEmptyCell,
} from './data/foodData';
import {
  LANGS,
  UI_TRANSLATIONS,
  translateDuration,
  translateFlag,
  translateGroup,
  translateItemName,
  translateItemNote,
} from './data/translations';
import { runSmartSearch } from './utils/smartSearch';
import type {
  AppendixFilter,
  FoodItem,
  Lang,
  StorageFilter,
  ViewMode,
} from './types';

interface ExtraLabels {
  aiTag: string;
  aiSearching: string;
  aiButtonTitle: string;
  aiBannerTitle: string;
  aiLegalNotice: string;
  aiDismiss: string;
  quickLabel: string;
  quickToday: string;
  quickFrozen: string;
  quickCool: string;
  quickHotDisplay: string;
  allOption: string;
  copyShort: string;
  mobileTitleLine1: string;
  mobileTitleLine2: string;
  mobileSearchPlaceholder: string;
  footerInternal: string;
}

const EXTRA_LABELS: Record<Lang, ExtraLabels> = {
  VI: {
    aiTag: 'Tìm thông minh AI',
    aiSearching: 'AI đang phân tích...',
    aiButtonTitle: 'Nhấn để AI phân tích ngữ cảnh & đồng nghĩa',
    aiBannerTitle: 'Gợi ý ngữ nghĩa AI',
    aiLegalNotice: 'Thông số hiển thị giữ nguyên 100% từ văn bản gốc.',
    aiDismiss: 'Tắt gợi ý AI',
    quickLabel: 'Lọc nhanh vận hành:',
    quickToday: 'Dùng trong ngày',
    quickFrozen: 'Kho đông ≤ -18°C',
    quickCool: 'Kho mát 1-4°C',
    quickHotDisplay: 'Tủ trưng bày nóng',
    allOption: 'Tất cả',
    copyShort: 'Sao chép',
    mobileTitleLine1: 'HỆ THỐNG TRA CỨU',
    mobileTitleLine2: 'NHIỆT ĐỘ BẢO QUẢN & THỜI HẠN SỬ DỤNG THỰC PHẨM',
    mobileSearchPlaceholder: 'Tìm món, mã PL1-01, bảo quản...',
    footerInternal: 'HỆ THỐNG LƯU HÀNH NỘI BỘ',
  },
  EN: {
    aiTag: 'AI Smart Search',
    aiSearching: 'AI analyzing...',
    aiButtonTitle: 'Run AI semantic & ingredient matching',
    aiBannerTitle: 'AI Semantic Match',
    aiLegalNotice: 'All displayed records remain 100% verbatim from source.',
    aiDismiss: 'Clear AI',
    quickLabel: 'Quick hygiene presets:',
    quickToday: 'Use within day',
    quickFrozen: 'Frozen ≤ -18°C',
    quickCool: 'Chilled 1-4°C',
    quickHotDisplay: 'Hot display',
    allOption: 'All',
    copyShort: 'Copy',
    mobileTitleLine1: 'LOOKUP SYSTEM',
    mobileTitleLine2: 'FOOD STORAGE TEMPERATURE & SHELF LIFE',
    mobileSearchPlaceholder: 'Search item, PL1-01, storage...',
    footerInternal: 'INTERNAL CIRCULATION SYSTEM',
  },
  KO: {
    aiTag: 'AI 스마트 검색',
    aiSearching: 'AI 분석 중...',
    aiButtonTitle: 'AI 문맥 및 동의어 검색 실행',
    aiBannerTitle: 'AI 의미 기반 추천',
    aiLegalNotice: '표시된 모든 기준은 원본 문서를 100% 그대로 유지합니다.',
    aiDismiss: 'AI 해제',
    quickLabel: '위생 빠른 필터:',
    quickToday: '당일 사용',
    quickFrozen: '냉동 ≤ -18°C',
    quickCool: '냉장 1-4°C',
    quickHotDisplay: '온장 진열',
    allOption: '전체',
    copyShort: '복사',
    mobileTitleLine1: '식품 보관 조회 시스템',
    mobileTitleLine2: '식품 보관 온도 및 유통기한 기준표',
    mobileSearchPlaceholder: '품목, PL1-01, 보관 기준 검색...',
    footerInternal: '사내 전용 배포 시스템',
  },
  HI: {
    aiTag: 'AI स्मार्ट खोज',
    aiSearching: 'AI विश्लेषण...',
    aiButtonTitle: 'AI संदर्भ और समानार्थी खोज चलाएं',
    aiBannerTitle: 'AI प्रासंगिक मिलान',
    aiLegalNotice: 'सभी प्रदर्शित डेटा मूल दस्तावेज़ से 100% यथावत है।',
    aiDismiss: 'AI हटाएं',
    quickLabel: 'त्वरित स्वच्छता फ़िल्टर:',
    quickToday: 'उसी दिन उपयोग',
    quickFrozen: 'फ्रीज़ ≤ -18°C',
    quickCool: 'चिल्ड 1-4°C',
    quickHotDisplay: 'हॉट डिस्प्ले',
    allOption: 'सभी',
    copyShort: 'कॉपी',
    mobileTitleLine1: 'खाद्य भंडारण खोज प्रणाली',
    mobileTitleLine2: 'खाद्य भंडारण तापमान और शेल्फ लाइफ मानक',
    mobileSearchPlaceholder: 'आइटम, PL1-01, भंडारण खोजें...',
    footerInternal: 'आंतरिक परिचालन प्रणाली',
  },
};

type QuickHygieneMode = 'none' | 'today' | 'hotDisplay';

const LANG_FULL_NAMES: Record<Lang, string> = {
  VI: 'Tiếng Việt',
  EN: 'English',
  KO: '한국어',
  HI: 'हिन्दी',
};

interface StorageCellProps {
  label: string;
  value: string;
  tone: 'amber' | 'teal' | 'indigo';
  icon: React.ReactNode;
  hideHint?: boolean;
  emptyCellHint: string;
}

function StorageCell({
  label,
  value,
  tone,
  icon,
}: StorageCellProps) {
  const empty = isEmptyCell(value);
  const toneClasses = empty
    ? 'bg-[#EAE6DC]/75 text-[#8E96A3] select-none'
    : tone === 'amber'
      ? 'z-[1] bg-gradient-to-b from-[#FFFDF7] to-[#FDF6E2] text-[#7D5B0F] ring-1 ring-inset ring-[#DFBA51] shadow-[0_3px_10px_rgba(138,101,16,0.12)]'
      : tone === 'teal'
        ? 'z-[1] bg-gradient-to-b from-[#FAFEFF] to-[#E6F4F7] text-[#11505E] ring-1 ring-inset ring-[#57A7B8] shadow-[0_3px_10px_rgba(15,94,110,0.12)]'
        : 'z-[1] bg-gradient-to-b from-[#FAFBFD] to-[#E8ECF9] text-[#283862] ring-1 ring-inset ring-[#7A8CC7] shadow-[0_3px_10px_rgba(43,62,107,0.12)]';

  const labelColor = empty
    ? 'text-[#7A818D] opacity-50'
    : tone === 'amber'
      ? 'text-[#8A6510]'
      : tone === 'teal'
        ? 'text-[#0F5E6E]'
        : 'text-[#2B3E6B]';

  return (
    <div className={`relative overflow-hidden px-2 sm:px-3 py-2 sm:py-2.5 ${toneClasses}`}>
      <div
        className={`flex items-start sm:items-center gap-1 text-[10px] sm:text-[10.5px] font-bold tracking-wide leading-tight ${labelColor}`}
      >
        <span className="shrink-0 mt-[1px] sm:mt-0">{icon}</span>
        <span className="break-words">{label}</span>
      </div>
      {empty ? (
        <>
          <div className="mt-1 min-h-[20px]" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-[#E4DFD3]/55 to-[#D9D3C4]/65 backdrop-blur-[1.5px]"
          />
        </>
      ) : (
        <div className="mt-1 tabular-nums text-[13.5px] sm:text-[14.5px] font-extrabold text-[#122A47] leading-snug">
          {value}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>('VI');
  const t = UI_TRANSLATIONS[lang];
  const ex = EXTRA_LABELS[lang];

  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 639px)').matches
      : false
  );
  const [query, setQuery] = useState<string>('');
  const [appendix, setAppendix] = useState<AppendixFilter>('ALL');
  const [group, setGroup] = useState<string>('ALL');
  const [storageFilter, setStorageFilter] = useState<StorageFilter>('all');
  const [quickHygiene, setQuickHygiene] = useState<QuickHygieneMode>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string>('');
  const [groupMenuOpen, setGroupMenuOpen] = useState<boolean>(false);
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // AI Semantic Search state
  const [aiMatchedCodes, setAiMatchedCodes] = useState<string[]>([]);
  const [aiReason, setAiReason] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiLastQuery, setAiLastQuery] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const groupDropdownRef = useRef<HTMLDivElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiLastKeyRef = useRef<string>('');
  const aiEndpointAvailableRef = useRef<boolean>(
    typeof window !== 'undefined' ? window.location.protocol !== 'file:' : true
  );

  const appendixCounts = useMemo(() => {
    let pl1 = 0;
    let pl2 = 0;
    let pl3 = 0;
    for (const item of FOOD_ITEMS) {
      if (item.a === 'PL1') pl1 += 1;
      else if (item.a === 'PL2') pl2 += 1;
      else pl3 += 1;
    }
    return {
      ALL: FOOD_ITEMS.length,
      PL1: pl1,
      PL2: pl2,
      PL3: pl3,
    };
  }, []);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of FOOD_ITEMS) {
      counts[item.g] = (counts[item.g] || 0) + 1;
    }
    return counts;
  }, []);

  const visibleGroupOptions = useMemo(() => {
    if (appendix === 'ALL') return ALL_GROUPS;
    return [
      ...new Set(
        FOOD_ITEMS.filter((item) => item.a === appendix).map((item) => item.g)
      ),
    ];
  }, [appendix]);

  useEffect(() => {
    if (!groupMenuOpen && !langMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        groupMenuOpen &&
        groupDropdownRef.current &&
        !groupDropdownRef.current.contains(event.target as Node)
      ) {
        setGroupMenuOpen(false);
      }
      if (
        langMenuOpen &&
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setLangMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setGroupMenuOpen(false);
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [groupMenuOpen, langMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === '/' &&
        document.activeElement !== searchInputRef.current
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (
        event.key === 'Escape' &&
        document.activeElement === searchInputRef.current
      ) {
        setQuery('');
        setAiMatchedCodes([]);
        setAiReason('');
        setAiLastQuery('');
        aiLastKeyRef.current = '';
        searchInputRef.current?.blur();
      }
      if (event.key === 'Escape') {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      aiAbortRef.current?.abort();
    };
  }, []);

  const triggerAiSearch = useCallback(
    async (targetQuery: string, targetLang: Lang) => {
      const q = targetQuery.trim();
      if (!q) {
        setAiMatchedCodes([]);
        setAiReason('');
        setAiLastQuery('');
        aiLastKeyRef.current = '';
        return;
      }

      if (!aiEndpointAvailableRef.current) {
        setAiMatchedCodes([]);
        setAiReason('');
        return;
      }

      const requestKey = `${targetLang}::${q.toLowerCase()}`;
      aiAbortRef.current?.abort();
      const controller = new AbortController();
      aiAbortRef.current = controller;

      setAiLoading(true);
      try {
        const response = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, lang: targetLang }),
          signal: controller.signal,
        });

        if (response.status === 404 || response.status === 405) {
          aiEndpointAvailableRef.current = false;
        }
        if (!response.ok) {
          setAiMatchedCodes([]);
          setAiReason('');
          return;
        }

        const data = (await response.json()) as {
          matchedCodes?: string[];
          reason?: string;
        };
        if (controller.signal.aborted) return;
        aiLastKeyRef.current = requestKey;
        setAiMatchedCodes(
          Array.isArray(data.matchedCodes) ? data.matchedCodes : []
        );
        setAiReason(typeof data.reason === 'string' ? data.reason : '');
        setAiLastQuery(q);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          setAiMatchedCodes([]);
          setAiReason('');
        }
      } finally {
        if (!controller.signal.aborted) {
          setAiLoading(false);
        }
      }
    },
    []
  );

  // Automatic smart debounced AI boost for natural-language queries or when local search returns 0
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      aiAbortRef.current?.abort();
      aiLastKeyRef.current = '';
      setAiLoading(false);
      setAiMatchedCodes([]);
      setAiReason('');
      setAiLastQuery('');
      return;
    }

    const requestKey = `${lang}::${q.toLowerCase()}`;
    if (aiLastQuery && aiLastQuery.toLowerCase() !== q.toLowerCase()) {
      setAiMatchedCodes([]);
      setAiReason('');
    }
    if (aiLastKeyRef.current === requestKey) return;

    const localInstant = runSmartSearch({
      items: FOOD_ITEMS,
      query: q,
      lang,
      aiMatchedCodes: [],
    });

    const wordCount = q.split(/\s+/).filter(Boolean).length;
    const isCodeQuery = /^pl[123][- ]?\d{1,2}$/i.test(q);
    const shouldAutoTriggerAi =
      !isCodeQuery &&
      (localInstant.length === 0 || wordCount >= 2 || q.length >= 6);

    if (!shouldAutoTriggerAi) return;

    const timer = window.setTimeout(() => {
      void triggerAiSearch(q, lang);
    }, 520);

    return () => window.clearTimeout(timer);
  }, [query, lang, triggerAiSearch, aiLastQuery]);

  const handleSelectGroup = (nextGroup: string) => {
    setGroup(nextGroup);
    if (nextGroup !== 'ALL') {
      const matchedAppendix = FOOD_ITEMS.find((item) => item.g === nextGroup)?.a;
      if (matchedAppendix) setAppendix(matchedAppendix);
    }
    setGroupMenuOpen(false);
  };

  const toggleQuickHygiene = (mode: QuickHygieneMode) => {
    setQuickHygiene((prev) => (prev === mode ? 'none' : mode));
  };

  const resetFilters = () => {
    aiAbortRef.current?.abort();
    setQuery('');
    setAppendix('ALL');
    setGroup('ALL');
    setStorageFilter('all');
    setQuickHygiene('none');
    setAiMatchedCodes([]);
    setAiReason('');
    setAiLastQuery('');
    aiLastKeyRef.current = '';
  };

  const filteredItems = useMemo(() => {
    let items = [...FOOD_ITEMS];
    if (appendix !== 'ALL') items = items.filter((item) => item.a === appendix);
    if (group !== 'ALL') items = items.filter((item) => item.g === group);
    if (storageFilter === 'room') {
      items = items.filter((item) => hasCellValue(item.room));
    }
    if (storageFilter === 'cool') {
      items = items.filter((item) => hasCellValue(item.cool));
    }
    if (storageFilter === 'freeze') {
      items = items.filter((item) => hasCellValue(item.freeze));
    }

    if (quickHygiene === 'today') {
      items = items.filter((item) => hasUseToday(item));
    } else if (quickHygiene === 'hotDisplay') {
      items = items.filter(
        (item) =>
          Boolean(item.displayHot) &&
          item.displayHot !== '—' &&
          item.displayHot !== '-'
      );
    }

    const q = query.trim();
    if (q) {
      return runSmartSearch({
        items,
        query: q,
        lang,
        aiMatchedCodes,
      });
    }

    items.sort((a, b) =>
      a.a === b.a ? a.n - b.n : a.a < b.a ? -1 : 1
    );
    return items;
  }, [
    query,
    appendix,
    group,
    storageFilter,
    quickHygiene,
    lang,
    aiMatchedCodes,
  ]);

  const copyExcerpt = (text: string, label: string) => {
    const showToast = () => {
      setCopiedLabel(label);
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setCopiedLabel('');
      }, 2200);
    };

    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast();
      } catch {
        // ignore clipboard failure
      }
      document.body.removeChild(textarea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showToast).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  };

  const formatExcerpt = (item: FoodItem): string => {
    if (item.a === 'PL3') {
      return `${t.excerptLabel} — ${getItemCode(item)} — ${translateItemName(item, lang)}
${t.groupLabel}: ${translateGroup(item.g, lang)}
${t.colEnglish}: ${item.enName || ''}
${t.colWeight}: ${translateDuration(item.weight || '', lang)}
${t.colCold}: ${translateDuration(item.cool, lang)}
${t.colFrozen}: ${translateDuration(item.freeze, lang)}
${t.colRoom}: ${translateDuration(item.room, lang)}
${t.colDisplayCool}: ${translateDuration(item.displayCool || '', lang)}
${t.colDisplayHot}: ${translateDuration(item.displayHot || '', lang)}
${t.sourcePL3}`;
    }

    return `${t.excerptLabel} — ${getItemCode(item)} — ${translateItemName(item, lang)}
${t.groupLabel}: ${translateGroup(item.g, lang)}
${t.colRoom}: ${translateDuration(item.room, lang)}
${t.colCool}: ${translateDuration(item.cool, lang)}
${t.colFreeze}: ${translateDuration(item.freeze, lang)}
${t.noteLabel}: ${isEmptyCell(item.note) ? t.emptyNote : translateItemNote(item, lang)}`;
  };

  const hasActiveFilters =
    Boolean(query) ||
    appendix !== 'ALL' ||
    group !== 'ALL' ||
    storageFilter !== 'all' ||
    quickHygiene !== 'none';

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F6F4EF] text-[#182230]"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      {/* Top Bar (Mobile: refined 2-line crest + ultra-compact language dropdown; PC: full editorial lockup) */}
      <header className="relative z-50 bg-[#122A47] text-white border-b border-[#C9A227]/60">
        <div className="mx-auto max-w-[1360px] px-3.5 sm:px-6 py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between gap-2 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <img
                src="/bnc-logo.jpg"
                data-fnb-logo="1"
                alt="F&B BNC"
                referrerPolicy="no-referrer"
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg border border-white/25 object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="sm:hidden text-[14.5px] font-extrabold tracking-tight leading-none text-white whitespace-nowrap">
                  {ex.mobileTitleLine1}
                </p>
                <p className="sm:hidden text-[9.5px] font-semibold tracking-wider text-white/75 mt-1 leading-none truncate">
                  {t.subtitle}
                </p>
                <h1 className="hidden sm:block text-[17px] lg:text-[19px] font-extrabold tracking-tight leading-snug text-white text-balance">
                  {t.title}
                </h1>
                <p className="hidden sm:block text-[11px] font-semibold tracking-wider text-[#E2C665] mt-0.5 truncate">
                  {t.subtitle}
                </p>
              </div>
            </div>

            {/* Mobile Ultra-Compact Language Dropdown */}
            <div ref={langDropdownRef} className="relative sm:hidden shrink-0">
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={langMenuOpen}
                aria-label="Language"
                className="h-[28px] px-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 flex items-center gap-1 text-[11px] font-bold text-white transition-colors"
              >
                <Globe size={12} className="text-[#E2C665] shrink-0" />
                <span>{lang}</span>
                <ChevronDown
                  size={11}
                  className={`text-white/80 transition-transform duration-150 ${
                    langMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {langMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Language"
                  className="fade-in absolute right-0 top-full z-50 mt-1.5 w-40 rounded-xl border border-[#DFD9CB] bg-white p-1 text-[#182230] shadow-[0_16px_36px_rgba(15,23,42,0.22)]"
                >
                  {LANGS.map((code) => {
                    const active = lang === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setLang(code);
                          setLangMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                          active
                            ? 'bg-[#F2EFE8] font-bold text-[#122A47]'
                            : 'font-medium text-[#182230] hover:bg-[#F6F4EF]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#8A6510]">
                            {code}
                          </span>
                          <span>{LANG_FULL_NAMES[code]}</span>
                        </span>
                        {active && <Check size={14} className="text-[#1E4A75]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop / Tablet Segmented Language Switcher */}
            <div
              className="hidden sm:flex items-center shrink-0 rounded-lg border border-white/20 bg-white/10 p-0.5"
              role="group"
              aria-label="Language"
            >
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  aria-label={code}
                  className={`h-[36px] min-w-[40px] px-2.5 rounded-md text-[12px] font-bold whitespace-nowrap transition-colors ${
                    lang === code
                      ? 'bg-[#C9A227] text-[#122A47]'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Line 2: Clean single-line full-width primary descriptor */}
          <p
            role="heading"
            aria-level={1}
            className="sm:hidden mt-2 pt-1.5 border-t border-white/12 text-[clamp(8.8px,2.56vw,11.5px)] font-extrabold tracking-[-0.012em] leading-tight text-[#F3DA7B] whitespace-nowrap"
          >
            {ex.mobileTitleLine2}
          </p>
        </div>
      </header>

      {/* Compact Sticky Search Dock */}
      <div className="sticky top-[var(--safe-area-inset-top)] z-40 bg-[#122A47]/95 backdrop-blur-md border-b border-[#C9A227]/70 shadow-[0_8px_24px_rgba(18,42,71,0.16)]">
        <div className="mx-auto max-w-[1360px] px-3.5 sm:px-6 py-2 sm:py-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void triggerAiSearch(query, lang);
            }}
            className="relative flex items-center"
          >
            <Search
              className="pointer-events-none absolute left-3 sm:left-3.5 text-[#1E4A75]"
              size={17}
            />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isMobileViewport
                  ? ex.mobileSearchPlaceholder
                  : lang === 'VI'
                    ? 'Tìm tên món, mã PL1-01, thành phần, hoặc hỏi điều kiện bảo quản...'
                    : `${t.searchPlaceholder} food, code, ingredient, or storage rule...`
              }
              aria-label={t.searchPlaceholder}
              className={`w-full h-[42px] sm:h-[50px] bg-white border border-[#D8D2C2] focus:border-[#C9A227] rounded-xl pl-9 sm:pl-10 ${
                query ? 'pr-[104px] sm:pr-44' : 'pr-[72px] sm:pr-40'
              } text-[13.5px] sm:text-[15px] font-medium text-[#182230] placeholder:text-[#7A8291] shadow-sm transition-colors`}
            />

            <div className="absolute right-1.5 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    aiAbortRef.current?.abort();
                    setQuery('');
                    setAiMatchedCodes([]);
                    setAiReason('');
                    setAiLastQuery('');
                    aiLastKeyRef.current = '';
                    searchInputRef.current?.focus();
                  }}
                  aria-label={t.clearSearch}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-[#6B7280] hover:text-[#182230] hover:bg-[#F2EFE8] flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="submit"
                disabled={!query.trim() || aiLoading}
                title={ex.aiButtonTitle}
                className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-[11.5px] sm:text-[12px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  query.trim()
                    ? 'bg-[#1E4A75] text-white hover:bg-[#122A47]'
                    : 'bg-[#F2EFE8] text-[#8A92A0] cursor-not-allowed'
                }`}
              >
                {aiLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span className="hidden sm:inline">
                  {aiLoading ? ex.aiSearching : ex.aiTag}
                </span>
                <span className="sm:hidden">AI</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1360px] flex-1 px-3.5 sm:px-6 py-3.5 sm:py-6 pb-10">
        {/* Appendix Segmented Tabs + Swipeable Quick Operational Hygiene Presets */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <div className="relative -mx-3.5 sm:mx-0">
            <div
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar snap-x snap-proximity touch-pan-x scroll-px-3.5 px-3.5 pr-8 sm:px-0 sm:pr-0 pb-0.5"
              style={{ WebkitOverflowScrolling: 'touch' }}
              role="tablist"
              aria-label={t.filterGroup}
            >
              {(
                [
                  ['ALL', t.all, appendixCounts.ALL],
                  ['PL1', t.appendix1, appendixCounts.PL1],
                  ['PL2', t.appendix2, appendixCounts.PL2],
                  ['PL3', t.appendix3, appendixCounts.PL3],
                ] as const
              ).map(([value, label, count]) => {
                const active = appendix === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setAppendix(value);
                      setGroup('ALL');
                      setGroupMenuOpen(false);
                    }}
                    className={`snap-start min-h-[38px] sm:min-h-[42px] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[12.5px] sm:text-[13px] font-bold border whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 transition-colors ${
                      active
                        ? 'bg-[#122A47] text-white border-[#122A47]'
                        : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#1E4A75]'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`font-mono tabular-nums text-[11px] font-semibold ${
                        active ? 'text-[#E2C665]' : 'text-[#6B7280]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-7 bg-gradient-to-l from-[#F6F4EF] via-[#F6F4EF]/75 to-transparent sm:hidden"
            />
          </div>

          {/* Operational Hygiene Quick Filters (Full-width swipeable on mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-[11.5px] font-bold sm:font-semibold text-[#5C6573] whitespace-nowrap shrink-0">
              {ex.quickLabel}
            </span>
            <div className="relative -mx-3.5 sm:mx-0 flex-1 min-w-0">
              <div
                className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar snap-x snap-proximity touch-pan-x scroll-px-3.5 px-3.5 pr-8 sm:px-0 sm:pr-0"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <button
                  type="button"
                  onClick={() => toggleQuickHygiene('today')}
                  aria-pressed={quickHygiene === 'today'}
                  className={`snap-start min-h-[34px] px-2.5 py-1.5 rounded-md border text-[12px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                    quickHygiene === 'today'
                      ? 'bg-[#1E4A75] text-white border-[#1E4A75]'
                      : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#1E4A75]'
                  }`}
                >
                  <Clock3 size={13} />
                  <span>{ex.quickToday}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStorageFilter((prev) => (prev === 'freeze' ? 'all' : 'freeze'))
                  }
                  aria-pressed={storageFilter === 'freeze'}
                  className={`snap-start min-h-[34px] px-2.5 py-1.5 rounded-md border text-[12px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                    storageFilter === 'freeze'
                      ? 'bg-[#2B3E6B] text-white border-[#2B3E6B]'
                      : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#2B3E6B]'
                  }`}
                >
                  <Snowflake size={13} />
                  <span>{ex.quickFrozen}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStorageFilter((prev) => (prev === 'cool' ? 'all' : 'cool'))
                  }
                  aria-pressed={storageFilter === 'cool'}
                  className={`snap-start min-h-[34px] px-2.5 py-1.5 rounded-md border text-[12px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                    storageFilter === 'cool'
                      ? 'bg-[#0F5E6E] text-white border-[#0F5E6E]'
                      : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#0F5E6E]'
                  }`}
                >
                  <Thermometer size={13} />
                  <span>{ex.quickCool}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleQuickHygiene('hotDisplay')}
                  aria-pressed={quickHygiene === 'hotDisplay'}
                  className={`snap-start min-h-[34px] px-2.5 py-1.5 rounded-md border text-[12px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                    quickHygiene === 'hotDisplay'
                      ? 'bg-[#8A6510] text-white border-[#8A6510]'
                      : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#8A6510]'
                  }`}
                >
                  <Flame size={13} />
                  <span>{ex.quickHotDisplay}</span>
                </button>
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-7 bg-gradient-to-l from-[#F6F4EF] via-[#F6F4EF]/75 to-transparent sm:hidden"
              />
            </div>
          </div>
        </div>

        {/* Structured Control Toolbar (Group & Display Mode) */}
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2.5 sm:gap-3 mt-3 sm:mt-4 items-end">
          <div ref={groupDropdownRef} className="relative min-w-0">
            <span className="block text-[11px] font-bold tracking-wide text-[#5C6573]">
              {t.filterGroup}
            </span>
            <button
              type="button"
              onClick={() => setGroupMenuOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={groupMenuOpen}
              aria-label={t.filterGroup}
              className={`mt-1 flex h-[44px] w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-[13.5px] font-semibold text-[#182230] transition-colors ${
                groupMenuOpen
                  ? 'border-[#1E4A75] ring-2 ring-[#1E4A75]/15'
                  : 'border-[#DFD9CB] hover:border-[#1E4A75]'
              }`}
            >
              <span className="min-w-0 flex-1 truncate">
                {group === 'ALL' ? t.all : translateGroup(group, lang)}
              </span>
              <ChevronDown
                size={17}
                className={`shrink-0 text-[#1E4A75] transition-transform duration-150 ${
                  groupMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {groupMenuOpen && (
              <div
                className="fade-in absolute left-0 right-0 top-full z-30 mt-1.5 max-h-[320px] overflow-y-auto rounded-xl border border-[#DFD9CB] bg-white p-1.5 shadow-[0_20px_44px_rgba(15,23,42,0.16)]"
                role="listbox"
                aria-label={t.filterGroup}
              >
                {['ALL', ...visibleGroupOptions].map((optionValue) => {
                  const optionLabel =
                    optionValue === 'ALL'
                      ? t.all
                      : translateGroup(optionValue, lang);
                  const count =
                    optionValue === 'ALL'
                      ? appendixCounts[appendix]
                      : groupCounts[optionValue] || 0;
                  const isSelected = group === optionValue;
                  return (
                    <button
                      key={optionValue}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectGroup(optionValue)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] leading-snug transition-colors ${
                        isSelected
                          ? 'bg-[#F2EFE8] font-bold text-[#122A47]'
                          : 'font-medium text-[#182230] hover:bg-[#F6F4EF]'
                      }`}
                    >
                      <span className="min-w-0 flex-1">{optionLabel}</span>
                      <span className="flex items-center gap-1.5 shrink-0 font-mono tabular-nums text-[11px] text-[#6B7280]">
                        {count}
                        {isSelected && <Check size={15} className="text-[#1E4A75]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unified Responsive View Toggle (Mobile & Desktop) */}
          <div className="min-w-0">
            <span className="block text-[11px] font-bold tracking-wide text-[#5C6573]">
              {t.displayLabel}
            </span>
            <div className="mt-1 flex h-[44px] w-full sm:w-auto rounded-xl border border-[#DFD9CB] bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label={t.viewGrid}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#122A47] text-white'
                    : 'text-[#2B3647] hover:text-[#122A47]'
                }`}
              >
                <LayoutGrid size={15} />
                <span>{t.viewGrid}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label={t.viewList}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#122A47] text-white'
                    : 'text-[#2B3647] hover:text-[#122A47]'
                }`}
              >
                <List size={15} />
                <span>{t.viewList}</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Semantic Explanation Banner (only when AI matches a query) */}
        {query.trim() && (aiReason || aiMatchedCodes.length > 0) && (
          <div className="fade-in mt-4 rounded-xl border border-[#D4E2EA] bg-[#F1F7FA] px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Sparkles
                size={16}
                className="text-[#1E4A75] shrink-0 mt-0.5"
              />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#122A47] leading-snug">
                  {ex.aiBannerTitle}
                  {aiMatchedCodes.length > 0 && (
                    <span className="font-mono tabular-nums text-[#1E4A75]">
                      {' '}
                      · {aiMatchedCodes.length}
                    </span>
                  )}
                </p>
                {aiReason && (
                  <p className="text-[13px] text-[#2B3647] mt-0.5 leading-snug">
                    {aiReason}
                  </p>
                )}
                <p className="text-[11px] font-medium text-[#5C6573] mt-1">
                  {ex.aiLegalNotice}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAiMatchedCodes([]);
                setAiReason('');
              }}
              aria-label={ex.aiDismiss}
              className="text-[12px] font-semibold text-[#1E4A75] hover:underline whitespace-nowrap shrink-0 py-1"
            >
              {ex.aiDismiss}
            </button>
          </div>
        )}

        {/* Results Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-5 mb-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px] font-bold text-[#182230]">
            <span>
              <span className="font-mono tabular-nums text-[#1E4A75] font-extrabold">
                {filteredItems.length}
              </span>{' '}
              {t.results}
            </span>
            {group !== 'ALL' && (
              <span className="text-[13px] font-medium text-[#5C6573]">
                · {translateGroup(group, lang)}
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[12.5px] font-bold text-[#1E4A75] hover:underline whitespace-nowrap"
            >
              {t.resetFilter} →
            </button>
          )}
        </div>

        {/* Empty / Results Views */}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D6D0C0] bg-white px-6 py-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#EEF6F8] flex items-center justify-center">
              <PackageSearch size={28} className="text-[#1E4A75]" />
            </div>
            <h2 className="font-extrabold text-[18px] mt-4 text-[#182230]">
              {t.noResultTitle}
            </h2>
            <p className="text-[#5C6573] text-[14px] mt-1 max-w-md mx-auto">
              {t.noResultDesc}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {query.trim() && !aiLoading && (
                <button
                  type="button"
                  onClick={() => void triggerAiSearch(query, lang)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#1E4A75] bg-white text-[#1E4A75] font-bold text-[13px] hover:bg-[#F1F7FA] flex items-center gap-1.5"
                >
                  <Sparkles size={15} />
                  <span>{ex.aiTag}</span>
                </button>
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#122A47] text-white font-bold text-[13px] hover:bg-[#1E4A75]"
              >
                {t.resetFilter}
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const itemCode = getItemCode(item);
              const itemName = translateItemName(item, lang);
              const appendixLabel =
                item.a === 'PL1'
                  ? t.appendix1
                  : item.a === 'PL2'
                    ? t.appendix2
                    : t.appendix3;
              const useToday = hasUseToday(item);
              const qaFlag = translateFlag(item, lang);

              return (
                <article
                  key={itemCode}
                  className="rounded-2xl border border-[#E2DDD0] bg-white flex flex-col overflow-hidden transition-colors hover:border-[#C9A227]"
                >
                  {/* Card Top Metadata & Title */}
                  <div className="p-4 sm:p-5 pb-3.5">
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono tabular-nums font-bold text-[#8A6510]">
                          {itemCode}
                        </span>
                        <span className="text-[#C5BEB0]" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-semibold text-[#5C6573] truncate">
                          {appendixLabel}
                        </span>
                      </div>

                      {useToday && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E4A75] whitespace-nowrap shrink-0">
                          <Clock3 size={12} />
                          <span>{t.useToday}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11.5px] font-medium text-[#5C6573] mt-1.5 leading-snug line-clamp-1">
                      {translateGroup(item.g, lang)}
                    </p>

                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="text-left mt-2 w-full group"
                    >
                      <h3 className="font-extrabold text-[16.5px] leading-snug text-[#122A47] group-hover:text-[#1E4A75] transition-colors">
                        {itemName}
                      </h3>
                      {item.a === 'PL3' && (item.enName || item.weight) && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] font-medium text-[#5C6573]">
                          {item.enName && (
                            <span>
                              {lang === 'EN' ? item.name : item.enName}
                            </span>
                          )}
                          {item.enName && item.weight && (
                            <span aria-hidden="true">·</span>
                          )}
                          {item.weight && (
                            <span className="font-mono tabular-nums font-bold text-[#1E4A75]">
                              {translateDuration(item.weight, lang)}
                            </span>
                          )}
                        </div>
                      )}
                    </button>

                    {qaFlag && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] font-bold text-[#9A6700]">
                        <TriangleAlert size={13} className="shrink-0" />
                        <span>{t.qaTitle}</span>
                      </div>
                    )}
                  </div>

                  {/* Hairline-Divided Cold-Chain Storage Matrix */}
                  {item.a === 'PL3' ? (
                    <div className="border-t border-b border-[#EAE5DA] divide-y divide-[#EAE5DA]">
                      <div className="grid grid-cols-2 divide-x divide-[#EAE5DA]">
                        <StorageCell
                          label={t.colCold}
                          value={translateDuration(item.cool, lang)}
                          tone="teal"
                          icon={<Thermometer size={12} />}
                          hideHint={true}
                          emptyCellHint={t.emptyCellHint}
                        />
                        <StorageCell
                          label={t.colFrozen}
                          value={translateDuration(item.freeze, lang)}
                          tone="indigo"
                          icon={<Snowflake size={12} />}
                          hideHint={true}
                          emptyCellHint={t.emptyCellHint}
                        />
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-[#EAE5DA]">
                        <StorageCell
                          label={t.colRoom}
                          value={translateDuration(item.room, lang)}
                          tone="amber"
                          icon={<House size={12} />}
                          hideHint={true}
                          emptyCellHint={t.emptyCellHint}
                        />
                        <StorageCell
                          label={t.colDisplayCool}
                          value={translateDuration(item.displayCool || '', lang)}
                          tone="teal"
                          icon={<Thermometer size={12} />}
                          hideHint={true}
                          emptyCellHint={t.emptyCellHint}
                        />
                      </div>
                      <StorageCell
                        label={t.colDisplayHot}
                        value={translateDuration(item.displayHot || '', lang)}
                        tone="amber"
                        icon={<Flame size={12} />}
                        hideHint={true}
                        emptyCellHint={t.emptyCellHint}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 border-t border-b border-[#EAE5DA] divide-x divide-[#EAE5DA]">
                      <StorageCell
                        label={t.colRoom}
                        value={translateDuration(item.room, lang)}
                        tone="amber"
                        icon={<House size={12} />}
                        emptyCellHint={t.emptyCellHint}
                      />
                      <StorageCell
                        label={t.colCool}
                        value={translateDuration(item.cool, lang)}
                        tone="teal"
                        icon={<Thermometer size={12} />}
                        emptyCellHint={t.emptyCellHint}
                      />
                      <StorageCell
                        label={t.colFreeze}
                        value={translateDuration(item.freeze, lang)}
                        tone="indigo"
                        icon={<Snowflake size={12} />}
                        emptyCellHint={t.emptyCellHint}
                      />
                    </div>
                  )}

                  {/* Note Excerpt (for PL1/PL2) + Card Actions */}
                  <div className="p-4 sm:px-5 sm:py-3.5 flex flex-col flex-1 justify-between bg-white">
                    {item.a !== 'PL3' && (
                      <p className="text-[12.5px] text-[#334155] leading-relaxed line-clamp-3 mb-3">
                        <span className="font-bold text-[#182230]">
                          {t.noteLabel}:{' '}
                        </span>
                        {isEmptyCell(item.note)
                          ? t.emptyNote
                          : translateItemNote(item, lang)}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#122A47] text-white text-[13px] font-bold hover:bg-[#1E4A75] flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>{t.detail}</span>
                        <ChevronRight size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyExcerpt(
                            formatExcerpt(item),
                            `${itemCode} ${itemName}`
                          )
                        }
                        aria-label={`${t.copy} ${itemName}`}
                        title={t.copy}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] text-[#1E4A75] hover:bg-[#EFECE4] flex items-center justify-center transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* List / Enterprise Audit Table View (Optimized for both Mobile & Desktop) */
          <div className="rounded-2xl border border-[#E2DDD0] bg-white overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-[90px_minmax(0,1.5fr)_120px_120px_120px_minmax(0,1.4fr)_136px] gap-3 px-5 py-3 text-[11px] font-bold tracking-wider uppercase text-[#5C6573] border-b border-[#EAE5DA] bg-[#FAF9F6]">
              <span>{t.codeLabel.replace(':', '')}</span>
              <span>{t.colName}</span>
              <span>{t.colRoom}</span>
              <span>{t.colCool}</span>
              <span>{t.colFreeze}</span>
              <span>{t.noteLabel}</span>
              <span className="text-right">{t.colAction}</span>
            </div>

            {filteredItems.map((item) => {
              const itemCode = getItemCode(item);
              const itemName = translateItemName(item, lang);
              const qaFlag = translateFlag(item, lang);

              if (item.a === 'PL3') {
                return (
                  <div
                    key={itemCode}
                    className="px-4 sm:px-5 py-3.5 border-b border-[#EAE5DA] last:border-b-0 hover:bg-[#FAF9F6] transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="text-left min-w-0 flex-1"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-mono tabular-nums text-[12px] font-bold text-[#8A6510]">
                            {itemCode}
                          </span>
                          <span className="font-bold text-[14.5px] text-[#122A47]">
                            {itemName}
                          </span>
                        </div>
                        <p className="text-[12px] font-medium text-[#5C6573] mt-0.5">
                          {lang === 'EN' ? item.name : item.enName} ·{' '}
                          {t.colWeight}:{' '}
                          <span className="font-mono tabular-nums font-bold text-[#1E4A75]">
                            {translateDuration(item.weight || '', lang)}
                          </span>
                        </p>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#122A47] text-white text-[12px] font-bold hover:bg-[#1E4A75]"
                        >
                          {t.detail}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyExcerpt(formatExcerpt(item), itemCode)}
                          aria-label={t.copy}
                          title={t.copy}
                          className="min-h-[38px] min-w-[38px] px-2.5 py-1.5 rounded-lg border border-[#DFD9CB] bg-[#FAF9F6] text-[#1E4A75] hover:bg-[#EFECE4] flex items-center justify-center"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2.5 text-[12px]">
                      {(
                        [
                          [t.colCold, item.cool, 'teal'],
                          [t.colFrozen, item.freeze, 'indigo'],
                          [t.colRoom, item.room, 'amber'],
                          [t.colDisplayCool, item.displayCool || '', 'teal'],
                          [t.colDisplayHot, item.displayHot || '', 'amber'],
                        ] as const
                      ).map(([colLabel, rawVal, tone]) => {
                        const displayVal = translateDuration(rawVal, lang);
                        const empty = isEmptyCell(displayVal);
                        const activeBox =
                          tone === 'amber'
                            ? 'bg-gradient-to-b from-[#FFFDF7] to-[#FDF6E2] ring-1 ring-inset ring-[#DFBA51] shadow-[0_2px_6px_rgba(138,101,16,0.12)]'
                            : tone === 'teal'
                              ? 'bg-gradient-to-b from-[#FAFEFF] to-[#E6F4F7] ring-1 ring-inset ring-[#57A7B8] shadow-[0_2px_6px_rgba(15,94,110,0.12)]'
                              : 'bg-gradient-to-b from-[#FAFBFD] to-[#E8ECF9] ring-1 ring-inset ring-[#7A8CC7] shadow-[0_2px_6px_rgba(43,62,107,0.12)]';
                        const activeLabel =
                          tone === 'amber'
                            ? 'text-[#8A6510]'
                            : tone === 'teal'
                              ? 'text-[#0F5E6E]'
                              : 'text-[#2B3E6B]';
                        return (
                          <div
                            key={colLabel}
                            className={`relative overflow-hidden rounded-lg px-2.5 py-1.5 ${
                              empty
                                ? 'border border-[#E4DFD3] bg-[#EAE6DC]/75 select-none'
                                : activeBox
                            }`}
                          >
                            <span
                              className={`block text-[10px] font-bold truncate ${
                                empty ? 'text-[#7A818D] opacity-50' : activeLabel
                              }`}
                            >
                              {colLabel}
                            </span>
                            {empty ? (
                              <>
                                <span className="block min-h-[18px]" aria-hidden="true" />
                                <div
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-[#E4DFD3]/55 to-[#D9D3C4]/65 backdrop-blur-[1.5px]"
                                />
                              </>
                            ) : (
                              <span className="tabular-nums font-extrabold text-[#122A47]">
                                {displayVal}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const roomVal = translateDuration(item.room, lang);
              const coolVal = translateDuration(item.cool, lang);
              const freezeVal = translateDuration(item.freeze, lang);
              const roomEmpty = isEmptyCell(roomVal);
              const coolEmpty = isEmptyCell(coolVal);
              const freezeEmpty = isEmptyCell(freezeVal);

              return (
                <div
                  key={itemCode}
                  className="px-4 sm:px-5 py-3.5 border-b border-[#EAE5DA] last:border-b-0 hover:bg-[#FAF9F6] transition-colors"
                >
                  {/* Desktop Audit Row */}
                  <div className="hidden lg:grid grid-cols-[90px_minmax(0,1.5fr)_120px_120px_120px_minmax(0,1.4fr)_136px] gap-3 items-center">
                    <span className="font-mono tabular-nums text-[12px] font-bold text-[#8A6510]">
                      {itemCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="text-left font-bold text-[14px] text-[#122A47] hover:text-[#1E4A75]"
                    >
                      <span>{itemName}</span>
                      {qaFlag && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#9A6700]">
                          <TriangleAlert size={12} />
                          QA
                        </span>
                      )}
                    </button>
                    {roomEmpty ? (
                      <span
                        aria-hidden="true"
                        className="relative block h-7 rounded-md border border-[#E4DFD3] bg-[#EAE6DC]/75 overflow-hidden"
                      >
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-[#E4DFD3]/55 to-[#D9D3C4]/65 backdrop-blur-[1.5px]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gradient-to-b from-[#FFFDF7] to-[#FDF6E2] ring-1 ring-inset ring-[#DFBA51] shadow-[0_2px_6px_rgba(138,101,16,0.10)] tabular-nums text-[13px] font-extrabold text-[#122A47]">
                        {roomVal}
                      </span>
                    )}
                    {coolEmpty ? (
                      <span
                        aria-hidden="true"
                        className="relative block h-7 rounded-md border border-[#E4DFD3] bg-[#EAE6DC]/75 overflow-hidden"
                      >
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-[#E4DFD3]/55 to-[#D9D3C4]/65 backdrop-blur-[1.5px]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gradient-to-b from-[#FAFEFF] to-[#E6F4F7] ring-1 ring-inset ring-[#57A7B8] shadow-[0_2px_6px_rgba(15,94,110,0.10)] tabular-nums text-[13px] font-extrabold text-[#0F5E6E]">
                        {coolVal}
                      </span>
                    )}
                    {freezeEmpty ? (
                      <span
                        aria-hidden="true"
                        className="relative block h-7 rounded-md border border-[#E4DFD3] bg-[#EAE6DC]/75 overflow-hidden"
                      >
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-[#E4DFD3]/55 to-[#D9D3C4]/65 backdrop-blur-[1.5px]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gradient-to-b from-[#FAFBFD] to-[#E8ECF9] ring-1 ring-inset ring-[#7A8CC7] shadow-[0_2px_6px_rgba(43,62,107,0.10)] tabular-nums text-[13px] font-extrabold text-[#2B3E6B]">
                        {freezeVal}
                      </span>
                    )}
                    <span className="text-[12px] text-[#5C6573] line-clamp-2">
                      {isEmptyCell(item.note)
                        ? t.emptyNote
                        : translateItemNote(item, lang)}
                    </span>
                    <span className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#122A47] text-white text-[12px] font-bold hover:bg-[#1E4A75]"
                      >
                        {t.detail}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyExcerpt(formatExcerpt(item), itemCode)}
                        aria-label={t.copy}
                        title={t.copy}
                        className="min-h-[36px] min-w-[36px] px-2.5 py-1.5 rounded-lg border border-[#DFD9CB] bg-[#FAF9F6] text-[#1E4A75] hover:bg-[#EFECE4] flex items-center justify-center"
                      >
                        <Copy size={14} />
                      </button>
                    </span>
                  </div>

                  {/* Mobile / Tablet Compact Row */}
                  <div className="lg:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="text-left min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-1.5 text-[11.5px]">
                          <span className="font-mono tabular-nums font-bold text-[#8A6510]">
                            {itemCode}
                          </span>
                          {hasUseToday(item) && (
                            <span className="font-bold text-[#1E4A75]">
                              · {t.useToday}
                            </span>
                          )}
                          {qaFlag && (
                            <span className="inline-flex items-center gap-0.5 font-bold text-[#9A6700]">
                              · <TriangleAlert size={11} /> QA
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[14.5px] text-[#122A47] mt-0.5 leading-snug">
                          {itemName}
                        </p>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="min-h-[40px] px-3 rounded-lg bg-[#122A47] text-white text-[12px] font-bold"
                        >
                          {t.detail}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyExcerpt(formatExcerpt(item), itemCode)}
                          aria-label={t.copy}
                          className="min-h-[40px] min-w-[40px] rounded-lg border border-[#DFD9CB] bg-[#FAF9F6] text-[#1E4A75] flex items-center justify-center"
                        >
                          <Copy size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2.5 text-[12px]">
                      <div
                        className={`relative overflow-hidden rounded-lg px-2.5 py-1.5 ${
                          roomEmpty
                            ? 'border border-[#E4DFD3] bg-[#EAE6DC]/75 select-none'
                            : 'bg-gradient-to-b from-[#FFFDF7] to-[#FDF6E2] ring-1 ring-inset ring-[#DFBA51] shadow-[0_2px_6px_rgba(138,101,16,0.12)]'
                        }`}
                      >
                        <span
                          className={`block text-[10px] font-bold ${
                            roomEmpty ? 'text-[#7A818D] opacity-50' : 'text-[#8A6510]'
                          }`}
                        >
                          {t.colRoom}
                        </span>
                        {roomEmpty ? (
                          <>
                            <span className="block min-h-[18px]" aria-hidden="true" />
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-[#E4DFD3]/55 to-[#D9D3C4]/65 backdrop-blur-[1.5px]"
                            />
                          </>
                        ) : (
                          <span className="tabular-nums font-extrabold text-[#122A47]">
                            {roomVal}
                          </span>
                        )}
                      </div>
                      <div
                        className={`relative overflow-hidden rounded-lg px-2.5 py-1.5 ${
                          coolEmpty
                            ? 'border border-[#E4DFD3] bg-[#EAE6DC]/75 select-none'
                            : 'bg-gradient-to-b from-[#FAFEFF] to-[#E6F4F7] ring-1 ring-inset ring-[#57A7B8] shadow-[0_2px_6px_rgba(15,94,110,0.12)]'
                        }`}
                      >
                        <span
                          className={`block text-[10px] font-bold ${
                            coolEmpty ? 'text-[#7A818D] opacity-50' : 'text-[#0F5E6E]'
                          }`}
                        >
                          {t.colCool}
                        </span>
                        {coolEmpty ? (
                          <>
                            <span className="block min-h-[18px]" aria-hidden="true" />
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-[#E4DFD3]/55 to-[#D9D3C4]/65 backdrop-blur-[1.5px]"
                            />
                          </>
                        ) : (
                          <span className="tabular-nums font-extrabold text-[#122A47]">
                            {coolVal}
                          </span>
                        )}
                      </div>
                      <div
                        className={`relative overflow-hidden rounded-lg px-2.5 py-1.5 ${
                          freezeEmpty
                            ? 'border border-[#E4DFD3] bg-[#EAE6DC]/75 select-none'
                            : 'bg-gradient-to-b from-[#FAFBFD] to-[#E8ECF9] ring-1 ring-inset ring-[#7A8CC7] shadow-[0_2px_6px_rgba(43,62,107,0.12)]'
                        }`}
                      >
                        <span
                          className={`block text-[10px] font-bold ${
                            freezeEmpty ? 'text-[#7A818D] opacity-50' : 'text-[#2B3E6B]'
                          }`}
                        >
                          {t.colFreeze}
                        </span>
                        {freezeEmpty ? (
                          <>
                            <span className="block min-h-[18px]" aria-hidden="true" />
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-[#E4DFD3]/55 to-[#D9D3C4]/65 backdrop-blur-[1.5px]"
                            />
                          </>
                        ) : (
                          <span className="tabular-nums font-extrabold text-[#122A47]">
                            {freezeVal}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legal Principle Notice */}
        <div className="mt-6 flex items-start sm:items-center gap-3 rounded-xl border border-[#E8D9A8] bg-[#FDF8EB] px-4 py-3.5">
          <TriangleAlert size={18} className="text-[#8A6510] shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[13px] text-[#2B3647] font-medium leading-relaxed">
            {t.principle}
          </p>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#C9A227]/70 bg-[#122A47]">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col sm:flex-row items-center justify-between gap-1 px-4 sm:px-6 py-4 text-[12.5px] font-semibold text-[#E2C665]">
          <span>{ex.footerInternal}</span>
          <span className="font-bold">By Le Hoang Phuc</span>
        </div>
      </footer>

      {/* Copy Toast */}
      {copiedLabel && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-[#122A47] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-xl flex items-center gap-2 border border-[#C9A227]/60 whitespace-nowrap max-w-[90vw] truncate"
        >
          <Check size={16} className="text-[#E2C665] shrink-0" />
          <span className="truncate">
            {t.copied} {copiedLabel}
          </span>
        </div>
      )}

      {/* Responsive Bottom-Sheet (Mobile) / Centered Dialog (Desktop) */}
      {selectedItem && (
        <div
          className="fade-in fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={translateItemName(selectedItem, lang)}
        >
          <button
            type="button"
            aria-label={t.close}
            onClick={() => setSelectedItem(null)}
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
          />
          <div className="sheet-up relative w-full max-w-[760px] max-h-[90dvh] flex flex-col bg-white text-[#182230] border border-[#E2DDD0] rounded-t-[24px] sm:rounded-[20px] shadow-2xl overflow-hidden">
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#D6D0C0] sm:hidden shrink-0" />

            {/* Sheet Header */}
            <div className="bg-white border-b border-[#EAE5DA] px-5 sm:px-6 py-4 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                  <span className="font-mono tabular-nums font-bold text-[#8A6510]">
                    {getItemCode(selectedItem)}
                  </span>
                  <span className="text-[#C5BEB0]" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-semibold text-[#5C6573]">
                    {translateGroup(selectedItem.g, lang)}
                  </span>
                  {hasUseToday(selectedItem) && (
                    <>
                      <span className="text-[#C5BEB0]" aria-hidden="true">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#1E4A75]">
                        <Clock3 size={12} />
                        {t.useToday}
                      </span>
                    </>
                  )}
                </div>

                <h3 className="text-[19px] sm:text-[21px] font-extrabold leading-snug mt-1 text-[#122A47]">
                  {translateItemName(selectedItem, lang)}
                </h3>

                {selectedItem.a === 'PL3' &&
                  (selectedItem.enName || selectedItem.weight) && (
                    <p className="text-[13px] font-medium text-[#5C6573] mt-0.5">
                      {lang === 'EN' ? selectedItem.name : selectedItem.enName}
                      {selectedItem.weight && (
                        <>
                          {' '}
                          · {t.colWeight}:{' '}
                          <span className="font-mono tabular-nums font-bold text-[#1E4A75]">
                            {translateDuration(selectedItem.weight, lang)}
                          </span>
                        </>
                      )}
                    </p>
                  )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label={t.close}
                className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-xl bg-[#F6F4EF] text-[#182230] hover:bg-[#EAE5DA] flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {selectedItem.a === 'PL3' ? (
                <div className="rounded-xl border border-[#EAE5DA] overflow-hidden divide-y divide-[#EAE5DA]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE5DA]">
                    <StorageCell
                      label={t.colCold}
                      value={translateDuration(selectedItem.cool, lang)}
                      tone="teal"
                      icon={<Thermometer size={12} />}
                      emptyCellHint={t.emptyCellHint}
                    />
                    <StorageCell
                      label={t.colFrozen}
                      value={translateDuration(selectedItem.freeze, lang)}
                      tone="indigo"
                      icon={<Snowflake size={12} />}
                      emptyCellHint={t.emptyCellHint}
                    />
                    <StorageCell
                      label={t.colRoom}
                      value={translateDuration(selectedItem.room, lang)}
                      tone="amber"
                      icon={<House size={12} />}
                      emptyCellHint={t.emptyCellHint}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE5DA]">
                    <StorageCell
                      label={t.colDisplayCool}
                      value={translateDuration(
                        selectedItem.displayCool || '',
                        lang
                      )}
                      tone="teal"
                      icon={<Thermometer size={12} />}
                      emptyCellHint={t.emptyCellHint}
                    />
                    <StorageCell
                      label={t.colDisplayHot}
                      value={translateDuration(
                        selectedItem.displayHot || '',
                        lang
                      )}
                      tone="amber"
                      icon={<Flame size={12} />}
                      emptyCellHint={t.emptyCellHint}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#EAE5DA] overflow-hidden grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE5DA]">
                  <StorageCell
                    label={t.colRoom}
                    value={translateDuration(selectedItem.room, lang)}
                    tone="amber"
                    icon={<House size={12} />}
                    emptyCellHint={t.emptyCellHint}
                  />
                  <StorageCell
                    label={t.colCool}
                    value={translateDuration(selectedItem.cool, lang)}
                    tone="teal"
                    icon={<Thermometer size={12} />}
                    emptyCellHint={t.emptyCellHint}
                  />
                  <StorageCell
                    label={t.colFreeze}
                    value={translateDuration(selectedItem.freeze, lang)}
                    tone="indigo"
                    icon={<Snowflake size={12} />}
                    emptyCellHint={t.emptyCellHint}
                  />
                </div>
              )}

              <div className="rounded-xl border border-[#EAE5DA] bg-[#FAF9F6] p-4">
                <p className="text-[11px] font-bold tracking-wider text-[#5C6573]">
                  {t.originalNote}
                </p>
                <p className="text-[14px] leading-relaxed mt-1.5 text-[#182230]">
                  {selectedItem.a === 'PL3'
                    ? t.sourcePL3
                    : isEmptyCell(selectedItem.note)
                      ? t.emptyNote
                      : translateItemNote(selectedItem, lang)}
                </p>
              </div>

              {translateFlag(selectedItem, lang) && (
                <div className="rounded-xl border border-[#E8D9A8] bg-[#FDF8EB] p-4">
                  <p className="text-[11px] font-bold tracking-wider text-[#8A6510] flex items-center gap-1.5">
                    <TriangleAlert size={13} />
                    <span>{t.qaTitle}</span>
                  </p>
                  <p className="text-[14px] leading-relaxed mt-1.5 text-[#182230]">
                    {translateFlag(selectedItem, lang)}
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Thumb-Zone Footer Actions */}
            <div
              className="border-t border-[#EAE5DA] bg-white px-5 sm:px-6 py-3.5 flex items-center gap-2.5 shrink-0"
              style={{
                paddingBottom: 'calc(0.875rem + var(--safe-area-inset-bottom))',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  copyExcerpt(
                    formatExcerpt(selectedItem),
                    translateItemName(selectedItem, lang)
                  )
                }
                className="flex-1 sm:flex-none min-h-[48px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] text-[#122A47] font-bold text-[13.5px] hover:bg-[#EFECE4] transition-colors"
              >
                <Copy size={16} />
                <span>{t.copy}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex-1 sm:flex-none min-h-[48px] px-6 py-2.5 rounded-xl bg-[#122A47] text-white text-[13.5px] font-bold hover:bg-[#1E4A75] transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
