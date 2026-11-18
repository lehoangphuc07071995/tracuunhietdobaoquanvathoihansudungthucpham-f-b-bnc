import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react';
import { getItemCode } from '../data/foodData';
import { translateItemName } from '../data/translations';
import { recordAiHistory } from '../db/dexieDb';
import {
  buildNotFoundFallbackReply,
  resolveChatQueryLocally,
  type ChatPaginationState,
  type PendingDisambiguation,
} from '../utils/chatEngine';
import type { AiChatTurn, FoodItem, Lang } from '../types';

const NOT_FOUND_MESSAGE =
  'Không tìm thấy kết quả trong dữ liệu hệ thống, vui lòng liên hệ Quản lý trực tiếp để được hướng dẫn.';

interface AIChatboxProps {
  items: FoodItem[];
  lang: Lang;
  isOnline: boolean;
  onSelectItem: (item: FoodItem) => void;
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
    loadingMsg: string;
    sampleTitle: string;
    samples: string[];
    placeholder: string;
    sendAria: string;
    localSummaryPrefix: string;
    unopenedLabel: string;
    openedLabel: string;
    noteLabel: string;
  }
> = {
  VI: {
    triggerLabel: 'Trợ lý AI',
    triggerAria: 'Mở Trợ lý AI tra cứu quy định SHE',
    headerTitle: 'Trợ lý AI Quy Định Khối SHE',
    offlineSubtitle: 'Offline · Tìm kiếm thông minh cục bộ',
    clearTitle: 'Xóa đoạn chat hiện tại',
    closeAria: 'Đóng chatbox',
    welcome:
      'Xin chào! Tôi là Trợ lý AI tra cứu Quy định bảo quản và hạn sử dụng thực phẩm Khối SHE — Quyết định 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13, PB 00).',
    resetMsg:
      'Đã làm mới hội thoại. Bạn cần tra cứu nhóm thực phẩm (SHE-01..66), danh mục không cấp đông (Điều 8) hay quy trình rã đông / làm nguội / ghi nhãn?',
    offlineBadge: 'Tra cứu cục bộ Offline',
    loadingMsg: 'Đang đối chiếu Quy định SHE-QĐ-FB13...',
    sampleTitle: 'Gợi ý câu hỏi nhanh:',
    samples: [
      'Quy trình rã đông và làm nguội theo QĐ 107/2026/QĐ-SHE/SG?',
      'Những thực phẩm nào không được cấp đông theo Điều 8?',
      'Sữa tươi thanh trùng/tiệt trùng mở hộp bảo quản được mấy ngày?',
    ],
    placeholder: 'Nhập bất kì thông tin liên quan bạn cần tư vấn',
    sendAria: 'Gửi câu hỏi',
    localSummaryPrefix: 'Kết quả tra cứu dữ liệu cục bộ trên máy',
    unopenedLabel: 'Chưa mở',
    openedLabel: 'Sau mở',
    noteLabel: 'Lưu ý',
  },
  EN: {
    triggerLabel: 'AI Assistant',
    triggerAria: 'Open SHE Compliance AI Assistant',
    headerTitle: 'SHE Regulation AI Assistant',
    offlineSubtitle: 'Offline · Smart Local Search',
    clearTitle: 'Clear current chat',
    closeAria: 'Close chatbox',
    welcome:
      'Hello! I am the Food Storage & Shelf-Life AI Assistant for SHE Division — Decision 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13, Ver 00).',
    resetMsg:
      'Conversation cleared. Which SHE-01..66 food rule, Article 8 restriction, or thawing/cooling SOP would you like to check?',
    offlineBadge: 'Offline Local Lookup',
    loadingMsg: 'Checking SHE-QĐ-FB13 compliance data...',
    sampleTitle: 'Quick example questions:',
    samples: [
      'What are the thawing and cooling procedures in SHE-QĐ-FB13?',
      'Which foods cannot be frozen under Article 8?',
      'How long can opened fresh milk be kept chilled?',
    ],
    placeholder: 'Enter any related information you need advice on',
    sendAria: 'Send question',
    localSummaryPrefix: 'Local offline database results',
    unopenedLabel: 'Unopened',
    openedLabel: 'Opened',
    noteLabel: 'Note',
  },
  KO: {
    triggerLabel: 'AI 도우미',
    triggerAria: 'SHE 규정 조회 AI 도우미 열기',
    headerTitle: 'SHE 식품 보관 AI 도우미',
    offlineSubtitle: '오프라인 · 로컬 스마트 검색',
    clearTitle: '현재 대화 지우기',
    closeAria: '채팅창 닫기',
    welcome:
      '안녕하세요! SHE 식품 보관 및 소비기한 규정 AI 도우미입니다 — 결정 107/2026/QĐ-SHE/SG(SHE-QĐ-FB13, Ver 00) 기준을 정확히 안내합니다.',
    resetMsg:
      '대화가 초기화되었습니다. SHE-01..66 보관 기준, 제8조 냉동 금지 목록 또는 해동/냉각/라벨 규정을 질문해 주세요.',
    offlineBadge: '오프라인 로컬 조회',
    loadingMsg: 'SHE-QĐ-FB13 규정 확인 중...',
    sampleTitle: '빠른 질문 예시:',
    samples: [
      '107/2026/QĐ-SHE/SG의 해동 및 냉각 기준은 무엇인가요?',
      '제8조에 따라 냉동 금지 식품은 무엇인가요?',
      '개봉한 생우유는 냉장(0–5°C)에서 며칠간 보관하나요?',
    ],
    placeholder: '상담이 필요한 관련 정보를 무엇이든 입력하세요',
    sendAria: '질문 보내기',
    localSummaryPrefix: '기기 내 로컬 데이터 검색 결과',
    unopenedLabel: '미개봉',
    openedLabel: '개봉 후',
    noteLabel: '비고',
  },
  HI: {
    triggerLabel: 'AI सहायक',
    triggerAria: 'SHE नियम AI सहायक खोलें',
    headerTitle: 'SHE नियम AI सहायक',
    offlineSubtitle: 'ऑफ़लाइन · स्मार्ट लोकल सर्च',
    clearTitle: 'वर्तमान चैट साफ़ करें',
    closeAria: 'चैटबॉट बंद करें',
    welcome:
      'नमस्ते! मैं SHE डिवीजन का खाद्य भंडारण और शेल्फ-लाइफ़ AI सहायक हूँ — निर्णय 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13, Ver 00) के अनुसार जानकारी प्रदान करता हूँ।',
    resetMsg:
      'वार्तालाप रीसेट हो गया है। आप कौन सा SHE-01..66 नियम, अनुच्छेद 8 सूची, या डीफ़्रॉस्टिंग/कूलिंग नियम देखना चाहते हैं?',
    offlineBadge: 'ऑफ़लाइन स्थानीय खोज',
    loadingMsg: 'SHE-QĐ-FB13 डेटा की जाँच हो रही है...',
    sampleTitle: 'त्वरित प्रश्न उदाहरण:',
    samples: [
      'SHE-QĐ-FB13 में डीफ़्रॉस्टिंग और कूलिंग प्रक्रिया क्या है?',
      'अनुच्छेद 8 के अनुसार कौन-से खाद्य पदार्थ फ़्रीज़ नहीं किए जा सकते?',
      'खुला हुआ ताज़ा दूध फ्रिज (0–5°C) में कितने दिन रखा जा सकता है?',
    ],
    placeholder: 'परामर्श के लिए कोई भी संबंधित जानकारी दर्ज करें',
    sendAria: 'प्रश्न भेजें',
    localSummaryPrefix: 'डिवाइस पर ऑफ़लाइन डेटा परिणाम',
    unopenedLabel: 'बिना खुला',
    openedLabel: 'खुलने के बाद',
    noteLabel: 'नोट',
  },
};

export function AIChatbox({
  items,
  lang,
  isOnline,
  onSelectItem,
}: AIChatboxProps) {
  const L = CHAT_TEXT[lang];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
  }, [open, turns, loading]);

  const findItemByCode = (code: string) =>
    items.find((it) => getItemCode(it).toUpperCase() === code.toUpperCase());

  const sendMessage = async (textOverride?: string) => {
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
    setLoading(true);

    const compactCatalog = items.map((it) => ({
      code: getItemCode(it),
      g: it.g,
      name: it.name,
      enName: it.enName || translateItemName(it, 'EN'),
      room: it.room,
      cool: it.cool,
      freeze: it.freeze,
      standardTemp: it.standardTemp || '',
      shelfLifeUnopened: it.shelfLifeUnopened || '',
      shelfLifeOpened: it.shelfLifeOpened || '',
      packagingSpec: it.packagingSpec || '',
      note: it.note,
      haccpNote: it.haccpNote || it.flag || '',
      customFields: it.customFields || {},
    }));

    // Preserve up to 10 conversation turns (20 messages)
    const historyPayload = updatedTurns.slice(-20).map((t) => ({
      role: t.role,
      content: t.content,
    }));

    let assistantReply = '';
    let matchedCodes: string[] = [];
    let mode: 'online_ai' | 'offline_local' = isOnline ? 'online_ai' : 'offline_local';

    const localEngineResult = resolveChatQueryLocally(
      question,
      items,
      lang,
      paginationState,
      pendingDisambiguation,
      turns
    );

    setPaginationState(localEngineResult.nextPagination);
    setPendingDisambiguation(localEngineResult.nextDisambiguation);

    if (localEngineResult.handled) {
      assistantReply = localEngineResult.reply;
      matchedCodes = localEngineResult.matchedCodes;
    } else if (!isOnline || window.location.protocol === 'file:') {
      mode = 'offline_local';
      const fallback = buildNotFoundFallbackReply(
        question,
        items,
        localEngineResult.detectedLang,
        localEngineResult.extractedKeyword
      );
      assistantReply = fallback.reply;
      matchedCodes = fallback.matchedCodes;
    } else {
      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: question,
            lang: localEngineResult.detectedLang,
            history: historyPayload,
            catalog: compactCatalog,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as {
          reply?: string;
          matchedCodes?: string[];
        };
        const apiReply =
          typeof data.reply === 'string' ? data.reply.trim() : '';
        const apiCodes = Array.isArray(data.matchedCodes)
          ? data.matchedCodes
          : [];

        if (!apiReply || apiReply === NOT_FOUND_MESSAGE) {
          const fallback = buildNotFoundFallbackReply(
            question,
            items,
            localEngineResult.detectedLang,
            localEngineResult.extractedKeyword
          );
          assistantReply = fallback.reply;
          matchedCodes = fallback.matchedCodes;
        } else {
          assistantReply = apiReply;
          matchedCodes = apiCodes;
        }
      } catch {
        mode = 'offline_local';
        const fallback = buildNotFoundFallbackReply(
          question,
          items,
          localEngineResult.detectedLang,
          localEngineResult.extractedKeyword
        );
        assistantReply = fallback.reply;
        matchedCodes = fallback.matchedCodes;
      }
    }

    const aiTurn: AiChatTurn = {
      role: 'assistant',
      content: assistantReply,
      matchedCodes,
      mode,
      timestamp: Date.now(),
    };

    setTurns((prev) => [...prev, aiTurn].slice(-20));
    setLoading(false);

    void recordAiHistory({
      question,
      answer: assistantReply,
      matchedCodes,
      mode,
      timestamp: Date.now(),
    });
  };

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
          className="sheet-up fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-[60] w-full sm:w-[410px] h-[82dvh] sm:h-[560px] flex flex-col bg-white border border-[#DFD9CB] rounded-t-[24px] sm:rounded-[20px] shadow-[0_24px_56px_rgba(15,23,42,0.28)] overflow-hidden"
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
            {turns.map((turn, idx) => (
              <div
                key={`${turn.timestamp}-${idx}`}
                className={`flex flex-col ${
                  turn.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${
                    turn.role === 'user'
                      ? 'bg-[#122A47] text-white rounded-br-sm'
                      : 'bg-white border border-[#E2DDD0] text-[#182230] rounded-bl-sm shadow-xs'
                  }`}
                >
                  {turn.mode === 'offline_local' && (
                    <span className="mb-1 inline-flex items-center gap-1 rounded bg-[#FDF8EB] border border-[#E8D9A8] px-1.5 py-0.5 text-[10px] font-bold text-[#8A6510]">
                      <WifiOff size={10} />
                      {L.offlineBadge}
                    </span>
                  )}
                  <div>{turn.content}</div>

                  {turn.matchedCodes && turn.matchedCodes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#EAE5DA] flex flex-wrap gap-1.5">
                      {turn.matchedCodes.map((code) => {
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
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm bg-white border border-[#E2DDD0] px-3.5 py-2.5 text-[12.5px] text-[#5C6573] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#1E4A75]" />
                  <span>{L.loadingMsg}</span>
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
              placeholder={L.placeholder}
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
