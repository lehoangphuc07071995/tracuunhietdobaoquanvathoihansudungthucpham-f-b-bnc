import React, { useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { Lang } from '../types';

const PWA_LABELS: Record<
  Lang,
  {
    installTitle: string;
    installFull: string;
    installShort: string;
    iosModalLabel: string;
    close: string;
    iosHeading: string;
    iosSubheading: string;
    iosStep1Pre: string;
    iosStep1Action: string;
    iosStep1Post: string;
    iosStep2Pre: string;
    iosStep2Action: string;
    iosStep2Mid: string;
    iosStep2Post: string;
    iosConfirm: string;
    offlineBadge: string;
  }
> = {
  VI: {
    installTitle: 'Cài đặt ứng dụng Offline (PWA)',
    installFull: 'Cài App Offline',
    installShort: 'Cài đặt',
    iosModalLabel: 'Hướng dẫn cài đặt ứng dụng trên iOS',
    close: 'Đóng',
    iosHeading: 'Cài đặt lên Màn hình chính',
    iosSubheading: 'Sử dụng tra cứu mượt mà 100% không cần mạng',
    iosStep1Pre: 'Nhấn biểu tượng',
    iosStep1Action: 'Chia sẻ',
    iosStep1Post: 'ở thanh dưới trình duyệt Safari.',
    iosStep2Pre: 'Chọn',
    iosStep2Action: '“Thêm vào MH chính” (Add to Home Screen)',
    iosStep2Mid: 'rồi nhấn',
    iosStep2Post: 'Thêm',
    iosConfirm: 'Đã hiểu',
    offlineBadge: 'Đang hoạt động Offline - Dữ liệu đã lưu trên máy',
  },
  EN: {
    installTitle: 'Install Offline App (PWA)',
    installFull: 'Install Offline',
    installShort: 'Install',
    iosModalLabel: 'Install App on iOS Home Screen',
    close: 'Close',
    iosHeading: 'Add to Home Screen',
    iosSubheading: '100% smooth food shelf-life lookup even offline',
    iosStep1Pre: 'Tap the',
    iosStep1Action: 'Share',
    iosStep1Post: 'icon in Safari’s bottom toolbar.',
    iosStep2Pre: 'Select',
    iosStep2Action: '“Add to Home Screen”',
    iosStep2Mid: 'and then tap',
    iosStep2Post: 'Add',
    iosConfirm: 'Got it',
    offlineBadge: 'Working Offline — Data saved locally on device',
  },
  KO: {
    installTitle: '오프라인 앱 설치 (PWA)',
    installFull: '오프라인 설치',
    installShort: '설치',
    iosModalLabel: 'iOS 홈 화면에 앱 설치 안내',
    close: '닫기',
    iosHeading: '홈 화면에 추가',
    iosSubheading: '인터넷 연결 없이도 100% 원활한 식품 보관 조회',
    iosStep1Pre: 'Safari 하단 도구 막대에서',
    iosStep1Action: '공유',
    iosStep1Post: '아이콘을 누르세요.',
    iosStep2Pre: '',
    iosStep2Action: '“홈 화면에 추가”',
    iosStep2Mid: '를 선택한 다음',
    iosStep2Post: '추가',
    iosConfirm: '확인',
    offlineBadge: '오프라인 작동 중 — 기기에 저장된 데이터 사용',
  },
  HI: {
    installTitle: 'ऑफ़लाइन ऐप इंस्टॉल करें (PWA)',
    installFull: 'ऑफ़लाइन इंस्टॉल',
    installShort: 'इंस्टॉल',
    iosModalLabel: 'iOS होम स्क्रीन पर ऐप इंस्टॉल करें',
    close: 'बंद करें',
    iosHeading: 'होम स्क्रीन पर जोड़ें',
    iosSubheading: 'बिना इंटरनेट के भी 100% सहज खोज उपयोग',
    iosStep1Pre: 'Safari के निचले बार में',
    iosStep1Action: 'Share',
    iosStep1Post: 'आइकन पर टैप करें।',
    iosStep2Pre: '',
    iosStep2Action: '“Add to Home Screen”',
    iosStep2Mid: 'चुनें और फिर',
    iosStep2Post: 'Add',
    iosConfirm: 'समझ गया',
    offlineBadge: 'ऑफ़लाइन मोड सक्रिय — डेटा डिवाइस पर सहेजा गया है',
  },
};

interface PWAInstallButtonProps {
  compact?: boolean;
  lang?: Lang;
}

export function PWAInstallButton({
  compact = false,
  lang = 'VI',
}: PWAInstallButtonProps) {
  const { canInstall, canNativePrompt, isIOS, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const L = PWA_LABELS[lang];

  if (!canInstall) return null;

  const handleClick = async () => {
    if (canNativePrompt) {
      await promptInstall();
      return;
    }
    if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        title={L.installTitle}
        className={`h-[28px] sm:h-[34px] rounded-lg border border-[#E2C665]/45 bg-[#C9A227]/15 hover:bg-[#C9A227]/25 text-[#F3DA7B] flex items-center gap-1.5 font-bold whitespace-nowrap transition-colors ${
          compact ? 'px-2 text-[11px]' : 'px-2.5 text-[11.5px]'
        }`}
      >
        <Download size={13} className="shrink-0" />
        <span className="hidden md:inline">{L.installFull}</span>
        <span className="md:hidden">{L.installShort}</span>
      </button>

      {showIOSGuide && (
        <div
          className="fade-in fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={L.iosModalLabel}
        >
          <button
            type="button"
            aria-label={L.close}
            onClick={() => setShowIOSGuide(false)}
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
          />
          <div className="sheet-up relative w-full max-w-md rounded-t-[24px] sm:rounded-[20px] bg-white border border-[#E2DDD0] p-5 text-[#182230] shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-[#122A47] text-[#E2C665] flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-[#122A47]">
                    {L.iosHeading}
                  </h3>
                  <p className="text-[12px] text-[#5C6573]">{L.iosSubheading}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label={L.close}
                className="h-9 w-9 rounded-lg bg-[#F6F4EF] hover:bg-[#EAE5DA] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <ol className="mt-4 space-y-2.5 text-[13.5px] text-[#2B3647]">
              <li className="flex items-center gap-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE5DA] p-3">
                <span className="h-6 w-6 rounded-full bg-[#122A47] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  {L.iosStep1Pre}{' '}
                  <strong className="inline-flex items-center gap-1 text-[#1E4A75]">
                    <Share size={14} /> {L.iosStep1Action}
                  </strong>{' '}
                  {L.iosStep1Post}
                </span>
              </li>
              <li className="flex items-center gap-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE5DA] p-3">
                <span className="h-6 w-6 rounded-full bg-[#122A47] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  {L.iosStep2Pre ? `${L.iosStep2Pre} ` : ''}
                  <strong>{L.iosStep2Action}</strong> {L.iosStep2Mid}{' '}
                  <strong>{L.iosStep2Post}</strong>.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full min-h-[44px] rounded-xl bg-[#122A47] text-white font-bold text-[13.5px] hover:bg-[#1E4A75]"
            >
              {L.iosConfirm}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

interface OfflineBadgeProps {
  isOnline: boolean;
  lang?: Lang;
}

export function OfflineStatusBadge({ isOnline, lang = 'VI' }: OfflineBadgeProps) {
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#FDF8EB] border-b border-[#E8D9A8] text-[#7D5B0F] px-3.5 sm:px-6 py-1.5"
    >
      <div className="mx-auto max-w-[1360px] flex items-center justify-center sm:justify-start gap-2 text-[12px] font-bold">
        <WifiOff size={14} className="shrink-0 text-[#9A6700]" />
        <span>{PWA_LABELS[lang].offlineBadge}</span>
      </div>
    </div>
  );
}
