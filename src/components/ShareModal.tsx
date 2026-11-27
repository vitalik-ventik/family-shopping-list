import React, { useState, useEffect } from 'react';
import { FirebaseConfig } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import QRCode from 'qrcode';
import { Copy, Check, X } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FirebaseConfig;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, config }) => {
  const { t } = useLanguage();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const payload = {
      apiKey: config.apiKey,
      projectId: config.projectId,
      appId: config.appId,
      groupId: config.groupId || 'default-family',
      mode: config.mode,
    };

    QRCode.toDataURL(JSON.stringify(payload), { width: 220, margin: 1 })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleCopyGroupCode = () => {
    navigator.clipboard.writeText(config.groupId || 'default-family');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/30 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-neutral-200 space-y-5 text-center">
        <div className="flex items-start justify-between pb-3 border-b border-neutral-100 text-left">
          <div>
            <h3 className="font-semibold text-neutral-900 text-base">{t.shareTitle}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{t.shareSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Family Sync QR Code"
              className="w-44 h-44 rounded-lg bg-white p-2 border border-neutral-200"
            />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center text-xs text-neutral-400">
              ...
            </div>
          )}

          <div className="mt-3 text-xs font-medium text-neutral-600">{t.scanWithAndroidApp}</div>
        </div>

        <div className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs">
          <div className="text-left">
            <div className="text-[11px] text-neutral-400">{t.familyGroupCode}</div>
            <div className="font-mono font-semibold text-neutral-900">
              {config.groupId || 'default-family'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyGroupCode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedLink ? t.copiedCodeBtn : 'Copy'}</span>
          </button>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed">{t.shareExplanation}</p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors"
        >
          {t.closeBtn}
        </button>
      </div>
    </div>
  );
};
