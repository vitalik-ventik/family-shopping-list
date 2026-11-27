import React, { useState, useEffect } from 'react';
import { FirebaseConfig } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { buildPairingUrl } from '../utils/pairing';
import QRCode from 'qrcode';
import { Copy, Check, X, Link2, AlertCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FirebaseConfig;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, config }) => {
  const { t } = useLanguage();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pairingUrl, setPairingUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const hasFirebaseKeys = Boolean(config.apiKey && config.projectId);

  useEffect(() => {
    if (!isOpen) return;

    const url = buildPairingUrl(config);
    setPairingUrl(url);

    QRCode.toDataURL(url, { width: 220, margin: 1 })
      .then((dataUrl) => setQrCodeUrl(dataUrl))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleCopyGroupCode = () => {
    navigator.clipboard.writeText(config.groupId || 'my-family');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPairingLink = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/30 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-neutral-200 space-y-4 text-center">
        <div className="flex items-start justify-between pb-3 border-b border-neutral-100 text-left">
          <div>
            <h3 className="font-semibold text-neutral-900 text-base">{t.qrPairingTitle}</h3>
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

        {!hasFirebaseKeys && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t.qrNeedsConfigHint}</span>
          </div>
        )}

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

        <button
          type="button"
          onClick={handleCopyPairingLink}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 font-medium text-xs transition-colors"
        >
          {copiedLink ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Link2 className="w-3.5 h-3.5" />
          )}
          <span>{copiedLink ? t.copiedLinkBtn : t.copyPairingLinkBtn}</span>
        </button>

        <div className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs">
          <div className="text-left">
            <div className="text-[11px] text-neutral-400">{t.familyGroupCode}</div>
            <div className="font-mono font-semibold text-neutral-900">
              {config.groupId || 'my-family'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyGroupCode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
          >
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedCode ? t.copiedCodeBtn : 'Copy'}</span>
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
