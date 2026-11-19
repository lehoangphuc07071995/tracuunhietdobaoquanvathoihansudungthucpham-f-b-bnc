import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { getItemCode, isEmptyCell } from '../data/foodData';
import {
  translateDuration,
  translateGroup,
  translateItemName,
  translateItemNote,
} from '../data/translations';
import { recordAiHistory } from '../db/dexieDb';
import {
  AiStreamHttpError,
  buildHistoryPayload,
  streamAskGemini,
} from '../utils/aiStreamClient';
import {
  runSmartSearch,
  shouldRouteToGeminiTier2,
} from '../utils/smartSearch';
import {
  buildNotFoundFallbackReply,
  resolveChatQueryLocally,
  type ChatPaginationState,
  type PendingDisambiguation,
} from '../utils/chatEngine';
import { FormattedAiText } from './FormattedAiText';
import type { AiChatTurn, FoodItem, Lang } from '../types';

interface AIChatboxProps {
  items: FoodItem[];
  lang: Lang;
  isOnline: boolean;
  onSelectItem: (item: FoodItem) => void;
  externalPrompt?: { id: number; text: string } | null;
}

const CHAT_TEXT: Record<
  Lang,
  {
    triggerLabel: string;
    triggerAria: string;
    headerTitle: string;
    offlineSubtitle: string;
    clearTitle: string;
    closeAria: string;
    welcome: string;
    resetMsg: string;
    offlineBadge: string;
    tier1Badge: string;
    askDeeperBtn: string;
    loadingMsg: string;
    sampleTitle: string;
    samples: string[];
    placeholder: string;
    followupPlaceholder: string;
    sendAria: string;
  }
> = {
  VI: {
    triggerLabel: 'Trợ lý AI',
    triggerAria: 'Mở Trợ lý AI tra cứu quy định SHE',
    headerTitle: 'Trợ lý AI',
    offlineSubtitle: 'Offline · Tìm kiếm thông minh cục bộ',
    clearTitle: 'Xóa đoạn chat hiện tại',
    closeAria: 'Đóng chatbox',
    welcome:
      'Xin chào! Tôi là Trợ lý AI tra cứu Quy định bảo quản và hạn sử dụng thực phẩm, tôi có thể giúp gì cho bạn?',
    resetMsg:
      'Đã làm mới hội thoại. Bạn cần tra cứu nhóm thực phẩm (SHE-01..66), danh mục không cấp đông (Điều 8) hay quy trình rã đông / làm nguội / ghi nhãn?',
    offlineBadge: 'Tra cứu cục bộ Offline',
    tier1Badge: 'Tra cứu tức thì (0 token)',
    askDeeperBtn: 'Hỏi sâu AI',
    loadingMsg: 'Đang tra cứu quy định...',
    sampleTitle: 'Gợi ý câu hỏi nhanh:',
    samples: [
      'Thịt tươi bảo quản mát mấy ngày?',
      'Quy định sữa đã mở nắp?',
      'Hải sản đông lạnh nhiệt độ bao nhiêu?',
      'Những thực phẩm nào không được cấp đông theo Điều 8?',
    ],
    placeholder: 'Nhập bất kì thông tin liên quan bạn cần tư vấn',
    followupPlaceholder: 'Hỏi nối tiếp (VD: Vậy còn nếu cấp đông thì sao?)...',
    sendAria: 'Gửi câu hỏi',
  },
  EN: {
    triggerLabel: 'AI Assistant',
    triggerAria: 'Open SHE Compliance AI Assistant',
    headerTitle: 'AI Assistant',
    offlineSubtitle: 'Offline · Smart Local Search',
    clearTitle: 'Clear current chat',
    closeAria: 'Close chatbox',
    welcome:
      'Hello! I am the AI Assistant for Food Storage & Shelf-Life lookup. How can I help you?',
    resetMsg:
      'Conversation cleared. Which SHE-01..66 food rule, Article 8 restriction, or thawing/cooling SOP would you like to check?',
    offlineBadge: 'Offline Local Lookup',
    tier1Badge: 'Instant Lookup (0 tokens)',
    askDeeperBtn: 'Ask AI deeper',
    loadingMsg: 'Looking up regulation...',
    sampleTitle: 'Quick example questions:',
    samples: [
      'How many days can fresh meat stay chilled?',
      'What are the rules for opened milk?',
      'What freezing temperature is required for seafood?',
      'Which foods cannot be frozen under Article 8?',
    ],
    placeholder: 'Enter any related information you need advice on',
    followupPlaceholder: 'Ask follow-up (e.g. What if frozen?)...',
    sendAria: 'Send question',
  },
  KO: {
    triggerLabel: 'AI 도우미',
    triggerAria: 'SHE 규정 조회 AI 도우미 열기',
    headerTitle: 'AI 도우미',
    offlineSubtitle: '오프라인 · 로컬 스마트 검색',
    clearTitle: '현재 대화 지우기',
    closeAria: '채팅창 닫기',
    welcome:
      '안녕하세요! 식품 보관 및 소비기한 규정 조회 AI 도우미입니다. 무엇을 도와드릴까요?',
    resetMsg:
      '대화가 초기화되었습니다. SHE-01..66 보관 기준, 제8조 냉동 금지 목록 또는 해동/냉각/라벨 규정을 질문해 주세요.',
    offlineBadge: '오프라인 로컬 조회',
    tier1Badge: '즉시 조회 (0 토큰)',
    askDeeperBtn: 'AI에게 자세히 묻기',
    loadingMsg: '규정을 조회하는 중...',
    sampleTitle: '빠른 질문 예시:',
    samples: [
      '생고기는 냉장 보관 며칠까지 가능한가요?',
      '개봉한 우유 보관 규정은 무엇인가요?',
      '냉동 해산물 보관 온도는 얼마인가요?',
      '제8조에 따라 냉동 금지 식품은 무엇인가요?',
    ],
    placeholder: '상담이 필요한 관련 정보를 무엇이든 입력하세요',
    followupPlaceholder: '이어서 질문 (예: 냉동 보관 시에는요?)...',
    sendAria: '질문 보내기',
  },
  HI: {
    triggerLabel: 'AI सहायक',
    triggerAria: 'SHE नियम AI सहायक खोलें',
    headerTitle: 'AI सहायक',
    offlineSubtitle: 'ऑफ़लाइन · स्मार्ट लोकल सर्च',
    clearTitle: 'वर्तमान चैट साफ़ करें',
    closeAria: 'चैटबॉट बंद करें',
    welcome:
      'नमस्ते! मैं खाद्य भंडारण और शेल्फ-लाइफ़ नियम खोज AI सहायक हूँ, मैं आपकी क्या मदद कर सकता हूँ?',
    resetMsg:
      'वार्तालाप रीसेट हो गया है। आप कौन सा SHE-01..66 नियम, अनुच्छेद 8 सूची, या डीफ़्रॉस्टिंग/कूलिंग नियम देखना चाहते हैं?',
    offlineBadge: 'ऑफ़लाइन स्थानीय खोज',
    tier1Badge: 'तत्काल खोज (0 टोकन)',
    askDeeperBtn: 'AI से विस्तार से पूछें',
    loadingMsg: 'नियम की जाँच हो रही है...',
    sampleTitle: 'त्वरित प्रश्न उदाहरण:',
    samples: [
      'ताज़ा मांस को फ्रिज में कितने दिन रख सकते हैं?',
      'खुले दूध के भंडारण के नियम क्या हैं?',
      'फ़्रोज़न सीफ़ूड का तापमान कितना होना चाहिए?',
      'अनुच्छेद 8 के अनुसार कौन-से खाद्य फ़्रीज़ नहीं किए जा सकते?',
    ],
    placeholder: 'परामर्श के लिए कोई भी संबंधित जानकारी दर्ज करें',
    followupPlaceholder: 'आगे पूछें (जैसे: अगर फ़्रीज़ किया हो तो?)...',
    sendAria: 'प्रश्न भेजें',
  },
};

function buildTier1InstantReply(matches: FoodItem[], lang: Lang): {
  reply: string;
  matchedCodes: string[];
} {
  const top = matches.slice(0, 4);
  const codes = top.map((it) => getItemCode(it));

  const labels: Record<
    Lang,
    {
      room: string;
      cool: string;
      freeze: string;
      note: string;
      moreHint: (total: number) => string;
      cite: string;
    }
  > = {
    VI: {
      room: 'Phòng (15–25°C)',
      cool: 'Lạnh (0–5°C)',
      freeze: 'Đông (≤ −18°C)',
      note: 'Lưu ý',
      moreHint: (total) =>
        `\n_Còn ${total - 4} mục liên quan khác trong bảng — xem chi tiết hoặc bấm **Hỏi sâu AI** nếu cần tư vấn tình huống._`,
      cite: '\n*Căn cứ: Quyết định 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13).*',
    },
    EN: {
      room: 'Room (15–25°C)',
      cool: 'Chilled (0–5°C)',
      freeze: 'Frozen (≤ −18°C)',
      note: 'Note',
      moreHint: (total) =>
        `\n_${total - 4} additional related item(s) exist in the table — click **Ask AI deeper** for scenario advice._`,
      cite: '\n*Basis: Decision 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13).*',
    },
    KO: {
      room: '실온 (15–25°C)',
      cool: '냉장 (0–5°C)',
      freeze: '냉동 (≤ −18°C)',
      note: '비고',
      moreHint: (total) =>
        `\n_표에 관련 항목이 ${total - 4}개 더 있습니다. 상황별 안내가 필요하면 **AI에게 자세히 묻기**를 누르세요._`,
      cite: '\n*근거: 결정 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13).*',
    },
    HI: {
      room: 'कमरा (15–25°C)',
      cool: 'ठंडा (0–5°C)',
      freeze: 'फ़्रीज़ (≤ −18°C)',
      note: 'नोट',
      moreHint: (total) =>
        `\n_तालिका में ${total - 4} अन्य संबंधित आइटम हैं — स्थितिजन्य सलाह के लिए **AI से विस्तार से पूछें** दबाएँ._`,
      cite: '\n*आधार: निर्णय 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13).*',
    },
  };

  const T = labels[lang];
  const lines = top.map((it) => {
    const code = getItemCode(it);
    const name = translateItemName(it, lang);
    const group = translateGroup(it.g, lang);
    const cells: string[] = [];
    if (!isEmptyCell(it.room)) {
      cells.push(`${T.room}: **${translateDuration(it.room, lang)}**`);
    }
    if (!isEmptyCell(it.cool)) {
      cells.push(`${T.cool}: **${translateDuration(it.cool, lang)}**`);
    }
    if (!isEmptyCell(it.freeze)) {
      cells.push(`${T.freeze}: **${translateDuration(it.freeze, lang)}**`);
    }
    const noteText = !isEmptyCell(it.note)
      ? ` — _${T.note}: ${translateItemNote(it, lang)}_`
      : '';
    return `• **[${code}] ${name}** (${group}): ${cells.join(' · ')}${noteText}`;
  });

  if (matches.length > 4) {
    lines.push(T.moreHint(matches.length));
  }
  lines.push(T.cite);
  return {
    reply: lines.join('\n'),
    matchedCodes: codes,
  };
}

export function AIChatbox({
  items,
  lang,
  isOnline,
  onSelectItem,
  externalPrompt,
}: AIChatboxProps) {
  const L = CHAT_TEXT[lang];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingReply, setStreamingReply] = useState('');
  const [apiErrorBanner, setApiErrorBanner] = useState('');
  const [paginationState, setPaginationState] =
    useState<ChatPaginationState | null>(null);
  const [pendingDisambiguation, setPendingDisambiguation] =
    useState<PendingDisambiguation | null>(null);
  const [turns, setTurns] = useState<AiChatTurn[]>([
    {
      role: 'assistant',
      content: CHAT_TEXT[lang].welcome,
      timestamp: Date.now(),
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const handledExternalIdRef = useRef<number>(0);
  const sendMessageRef = useRef<
    (textOverride?: string, options?: { forceTier2?: boolean }) => Promise<void>
  >(async () => {});

  const knownCodes = useMemo(
    () => new Set(items.map((it) => getItemCode(it).toUpperCase())),
    [items]
  );

  // Sync initial greeting automatically when user switches language before starting a chat
  useEffect(() => {
    setTurns((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ ...prev[0], content: CHAT_TEXT[lang].welcome }];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, turns, loading, streamingReply]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (
      externalPrompt &&
      externalPrompt.text.trim() &&
      externalPrompt.id !== handledExternalIdRef.current
    ) {
      handledExternalIdRef.current = externalPrompt.id;
      setOpen(true);
      void sendMessageRef.current(externalPrompt.text.trim(), { forceTier2: true });
    }
  }, [externalPrompt]);

  const findItemByCode = (code: string) =>
    items.find((it) => getItemCode(it).toUpperCase() === code.toUpperCase());

  const handleSelectCode = (code: string) => {
    const item = findItemByCode(code);
    if (item) onSelectItem(item);
  };

  const sendMessage = async (
    textOverride?: string,
    options?: { forceTier2?: boolean }
  ) => {
    const question = (textOverride ?? input).trim();
    if (!question || loading) return;

    const userTurn: AiChatTurn = {
      role: 'user',
      content: question,
      timestamp: Date.now(),
    };

    const updatedTurns = [...turns, userTurn].slice(-20);
    setTurns(updatedTurns);
    if (!textOverride) setInput('');
    setStreamingReply('');
    setApiErrorBanner('');

    const localEngineResult = resolveChatQueryLocally(
      question,
      items,
      lang,
      paginationState,
      pendingDisambiguation,
      turns
    );

    const activeLang = localEngineResult.detectedLang;
    const tier1Matches = runSmartSearch({
      items,
      query: question,
      lang: activeLang,
    });

    const useTier2 =
      Boolean(options?.forceTier2) ||
      shouldRouteToGeminiTier2(
        question,
        tier1Matches.length,
        turns.length > 1
      );

    // TIER 1 (0 Token, <0.01s): Pure item/code lookup answered instantaneously on client
    if (!useTier2 && tier1Matches.length > 0) {
      const instant = buildTier1InstantReply(tier1Matches, activeLang);
      const aiTurn: AiChatTurn = {
        role: 'assistant',
        content: instant.reply,
        matchedCodes: instant.matchedCodes,
        mode: 'tier1_instant',
        deepPrompt: question,
        timestamp: Date.now(),
      };
      setTurns((prev) => [...prev, aiTurn].slice(-20));
      void recordAiHistory({
        question,
        answer: instant.reply,
        matchedCodes: instant.matchedCodes,
        mode: 'tier1_instant',
        timestamp: Date.now(),
      });
      return;
    }

    // TIER 2 (Gemini 2.5 Flash — concise, 2-3 turn history cap) or Offline fallback
    setLoading(true);
    const historyPayload = buildHistoryPayload(updatedTurns.slice(0, -1));

    let assistantReply = '';
    let matchedCodes: string[] = [];
    let mode: 'online_ai' | 'offline_local' = isOnline ? 'online_ai' : 'offline_local';

    if (!isOnline || window.location.protocol === 'file:') {
      mode = 'offline_local';
      setPaginationState(localEngineResult.nextPagination);
      setPendingDisambiguation(localEngineResult.nextDisambiguation);
      if (localEngineResult.handled) {
        assistantReply = localEngineResult.reply;
        matchedCodes = localEngineResult.matchedCodes;
      } else {
        const fallback = buildNotFoundFallbackReply(
          question,
          items,
          activeLang,
          localEngineResult.extractedKeyword
        );
        assistantReply = fallback.reply;
        matchedCodes = fallback.matchedCodes;
      }
    } else {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const streamResult = await streamAskGemini({
          message: question,
          lang: activeLang,
          history: historyPayload,
          items,
          signal: controller.signal,
          onDelta: (accumulated) => {
            setStreamingReply(accumulated);
          },
        });

        assistantReply = streamResult.reply;
        matchedCodes = streamResult.matchedCodes;
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === 'AbortError') {
          setLoading(false);
          setStreamingReply('');
          return;
        }
        const errMsg =
          err instanceof AiStreamHttpError
            ? err.message
            : 'Không thể kết nối Gemini API lúc này.';
        setApiErrorBanner(errMsg);
        mode = 'offline_local';
        if (localEngineResult.handled) {
          assistantReply = localEngineResult.reply;
          matchedCodes = localEngineResult.matchedCodes;
        } else {
          const fallback = buildNotFoundFallbackReply(
            question,
            items,
            activeLang,
            localEngineResult.extractedKeyword
          );
          assistantReply = fallback.reply;
          matchedCodes = fallback.matchedCodes;
        }
      }
    }

    if (assistantReply) {
      const aiTurn: AiChatTurn = {
        role: 'assistant',
        content: assistantReply,
        matchedCodes,
        mode,
        timestamp: Date.now(),
      };
      setTurns((prev) => [...prev, aiTurn].slice(-20));
      void recordAiHistory({
        question,
        answer: assistantReply,
        matchedCodes,
        mode,
        timestamp: Date.now(),
      });
    }

    setStreamingReply('');
    setLoading(false);
  };

  sendMessageRef.current = sendMessage;

  return (
    <>
      {/* Floating Chatbox Trigger Button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={L.triggerAria}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-12 sm:h-13 px-4 rounded-2xl bg-[#122A47] text-white border border-[#C9A227] shadow-[0_12px_30px_rgba(18,42,71,0.32)] hover:bg-[#1E4A75] flex items-center gap-2 transition-transform active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <Bot size={20} className="text-[#E2C665]" />
          </div>
          <span className="text-[13px] font-extrabold tracking-tight">
            {L.triggerLabel}
          </span>
        </button>
      )}

      {/* Floating Chatbox Window */}
      {open && (
        <div
          role="dialog"
          aria-label={L.headerTitle}
          className="sheet-up fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-[60] w-full sm:w-[430px] h-[84dvh] sm:h-[580px] flex flex-col bg-white border border-[#DFD9CB] rounded-t-[24px] sm:rounded-[20px] shadow-[0_24px_56px_rgba(15,23,42,0.28)] overflow-hidden"
        >
          {/* Chat Header */}
          <div className="bg-[#122A47] text-white px-4 py-3 border-b border-[#C9A227]/60 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-white/10 border border-[#C9A227]/50 flex items-center justify-center shrink-0">
                <Sparkles size={17} className="text-[#E2C665]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[14px] font-extrabold leading-tight truncate">
                  {L.headerTitle}
                </h3>
                {!isOnline && (
                  <p className="text-[11px] text-[#E2C665] truncate flex items-center gap-1 mt-0.5">
                    <WifiOff size={11} />
                    <span>{L.offlineSubtitle}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                title={L.clearTitle}
                onClick={() => {
                  abortRef.current?.abort();
                  setLoading(false);
                  setStreamingReply('');
                  setApiErrorBanner('');
                  setPaginationState(null);
                  setPendingDisambiguation(null);
                  setTurns([
                    {
                      role: 'assistant',
                      content: L.resetMsg,
                      timestamp: Date.now(),
                    },
                  ]);
                }}
                className="h-8 w-8 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center"
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button"
                aria-label={L.closeAria}
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-white/10 text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Conversation Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#F6F4EF]"
          >
            {apiErrorBanner && (
              <div className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] px-3 py-2 text-[11.5px] font-semibold text-[#92400E] flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{apiErrorBanner}</span>
              </div>
            )}

            {turns.map((turn, idx) => (
              <div
                key={`${turn.timestamp}-${idx}`}
                className={`flex flex-col ${
                  turn.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    turn.role === 'user'
                      ? 'bg-[#122A47] text-white rounded-br-sm whitespace-pre-line'
                      : 'bg-white border border-[#E2DDD0] text-[#182230] rounded-bl-sm shadow-xs'
                  }`}
                >
                  {turn.mode === 'offline_local' && (
                    <span className="mb-1.5 inline-flex items-center gap-1 rounded bg-[#FDF8EB] border border-[#E8D9A8] px-1.5 py-0.5 text-[10px] font-bold text-[#8A6510]">
                      <WifiOff size={10} />
                      {L.offlineBadge}
                    </span>
                  )}

                  {turn.mode === 'tier1_instant' && (
                    <span className="mb-1.5 inline-flex items-center gap-1 rounded bg-[#EEF6F8] border border-[#C6DCE5] px-1.5 py-0.5 text-[10px] font-bold text-[#0F5E6E]">
                      <Zap size={10} />
                      {L.tier1Badge}
                    </span>
                  )}

                  {turn.role === 'user' ? (
                    <div>{turn.content}</div>
                  ) : (
                    <FormattedAiText
                      text={turn.content}
                      knownCodes={knownCodes}
                      onSelectCode={handleSelectCode}
                    />
                  )}

                  {((turn.matchedCodes && turn.matchedCodes.length > 0) ||
                    (turn.mode === 'tier1_instant' && turn.deepPrompt && isOnline)) && (
                    <div className="mt-2 pt-2 border-t border-[#EAE5DA] flex flex-wrap items-center gap-1.5">
                      {turn.matchedCodes?.map((code) => {
                        const item = findItemByCode(code);
                        const labelName = item
                          ? translateItemName(item, lang)
                          : '';
                        return (
                          <button
                            key={code}
                            type="button"
                            disabled={!item}
                            onClick={() => {
                              if (item) {
                                onSelectItem(item);
                              }
                            }}
                            className="px-2 py-0.5 rounded-md bg-[#F6F4EF] border border-[#DFD9CB] hover:border-[#122A47] font-mono text-[11px] font-bold text-[#122A47]"
                          >
                            {code}
                            {labelName ? ` · ${labelName.slice(0, 18)}` : ''}
                          </button>
                        );
                      })}

                      {turn.mode === 'tier1_instant' && turn.deepPrompt && isOnline && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            void sendMessage(
                              `${turn.deepPrompt} — giải thích chi tiết các tình huống & lưu ý bảo quản`,
                              { forceTier2: true }
                            )
                          }
                          className="ml-auto px-2 py-0.5 rounded-md bg-[#122A47] hover:bg-[#1E4A75] text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <Sparkles size={11} className="text-[#E2C665]" />
                          <span>{L.askDeeperBtn}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex flex-col items-start">
                <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-white border border-[#D4E2EA] px-3.5 py-2.5 text-[13px] text-[#182230] shadow-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#1E4A75]">
                    <Loader2 size={13} className="animate-spin" />
                    <span>{L.loadingMsg}</span>
                  </div>
                  {streamingReply && (
                    <FormattedAiText
                      text={streamingReply}
                      knownCodes={knownCodes}
                      onSelectCode={handleSelectCode}
                    />
                  )}
                </div>
              </div>
            )}

            {turns.length <= 1 && (
              <div className="pt-1 space-y-1.5">
                <p className="text-[11px] font-bold text-[#5C6573] flex items-center gap-1">
                  <MessageSquare size={12} />
                  <span>{L.sampleTitle}</span>
                </p>
                <div className="flex flex-col gap-1.5">
                  {L.samples.map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      onClick={() => void sendMessage(promptText)}
                      className="text-left rounded-xl border border-[#DFD9CB] bg-white hover:border-[#C9A227] px-3 py-2 text-[12px] font-semibold text-[#1E4A75] transition-colors"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="border-t border-[#EAE5DA] bg-white p-2.5 flex items-center gap-2 shrink-0"
            style={{
              paddingBottom: 'calc(0.625rem + var(--safe-area-inset-bottom))',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={turns.length > 1 ? L.followupPlaceholder : L.placeholder}
              className="flex-1 h-10 rounded-xl border border-[#D8D2C2] focus:border-[#1E4A75] bg-[#FAF9F6] px-3 text-[13px] font-medium text-[#182230]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label={L.sendAria}
              className="h-10 w-10 rounded-xl bg-[#122A47] text-white hover:bg-[#1E4A75] disabled:opacity-45 flex items-center justify-center shrink-0 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
