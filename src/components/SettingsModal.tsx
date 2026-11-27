import React, { useState, useEffect } from 'react';
import { FirebaseConfig, SyncStatus } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useLanguage } from '../i18n/LanguageContext';
import QRCode from 'qrcode';
import {
  Check,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: FirebaseConfig;
  syncStatus: SyncStatus;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
}) => {
  const { t, locale } = useLanguage();

  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(
    currentConfig.messagingSenderId || ''
  );
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [groupId, setGroupId] = useState(currentConfig.groupId || 'my-family');
  const [mode, setMode] = useState<'firebase' | 'demo'>(currentConfig.mode || 'demo');

  const [rawPasteSnippet, setRawPasteSnippet] = useState('');
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    loading?: boolean;
    latencyMs?: number;
  }>({});
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setApiKey(currentConfig.apiKey || '');
    setProjectId(currentConfig.projectId || '');
    setAppId(currentConfig.appId || '');
    setStorageBucket(currentConfig.storageBucket || '');
    setMessagingSenderId(currentConfig.messagingSenderId || '');
    setAuthDomain(currentConfig.authDomain || '');
    setGroupId(currentConfig.groupId || 'my-family');
    setMode(currentConfig.mode || 'demo');
  }, [currentConfig]);

  useEffect(() => {
    const configPayload = {
      apiKey,
      projectId,
      appId,
      storageBucket,
      messagingSenderId,
      groupId: groupId.trim() || 'default-family',
    };

    QRCode.toDataURL(JSON.stringify(configPayload), { width: 180, margin: 1 })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [apiKey, projectId, appId, storageBucket, messagingSenderId, groupId]);

  if (!isOpen) return null;

  const handleParsePastedConfig = () => {
    if (!rawPasteSnippet.trim()) return;

    try {
      let cleaned = rawPasteSnippet.trim();
      const matchObj = cleaned.match(/\{[\s\S]*\}/);
      if (matchObj) {
        cleaned = matchObj[0];
      }

      const jsonLike = cleaned
        .replace(/(\w+)\s*:/g, '"$1":')
        .replace(/'/g, '"')
        .replace(/,\s*\}/g, '}');

      const parsed = JSON.parse(jsonLike);

      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.appId) setAppId(parsed.appId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.groupId) setGroupId(parsed.groupId);

      setMode('firebase');
      setTestResult({
        success: true,
        message:
          locale === 'uk'
            ? 'Параметри Firebase розпізнано. Натисніть "Зберегти".'
            : 'Extracted Firebase parameters. Click Save to apply.',
      });
    } catch {
      const extract = (key: string) => {
        const regex = new RegExp(`${key}['"\\s]*[:=]['"\\s]*([^'",;\\s]+)`);
        const match = rawPasteSnippet.match(regex);
        return match ? match[1] : '';
      };

      const extractedApiKey = extract('apiKey');
      const extractedProjectId = extract('projectId');
      const extractedAppId = extract('appId');

      if (extractedApiKey && extractedProjectId) {
        setApiKey(extractedApiKey);
        setProjectId(extractedProjectId);
        if (extractedAppId) setAppId(extractedAppId);
        setStorageBucket(extract('storageBucket'));
        setMessagingSenderId(extract('messagingSenderId'));
        setAuthDomain(extract('authDomain'));
        setMode('firebase');
        setTestResult({
          success: true,
          message:
            locale === 'uk'
              ? 'Параметри розпізнано. Натисніть "Зберегти".'
              : 'Parsed config parameters. Click Save to apply.',
        });
      } else {
        setTestResult({
          success: false,
          message:
            locale === 'uk'
              ? 'Не вдалося розпізнати формат. Введіть поля вручну.'
              : 'Could not auto-parse. Please enter fields manually.',
        });
      }
    }
  };

  const handleTestConnection = async () => {
    setTestResult({ loading: true });
    const configToTest: FirebaseConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      appId: appId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      authDomain: authDomain.trim(),
      groupId: groupId.trim() || 'default-family',
      isConfigured: true,
      mode: 'firebase',
    };

    const res = await firebaseService.testConnection(configToTest);
    setTestResult({
      loading: false,
      success: res.success,
      message: res.success
        ? locale === 'uk'
          ? `Успішно підключено до Firestore (${res.latencyMs} мс)`
          : res.message
        : locale === 'uk'
        ? `Помилка підключення: ${res.message}`
        : res.message,
      latencyMs: res.latencyMs,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const newConfig: FirebaseConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      appId: appId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      authDomain: authDomain.trim(),
      groupId: groupId.trim() || 'default-family',
      isConfigured: apiKey.trim().length > 0 && projectId.trim().length > 0,
      mode: mode,
    };

    await firebaseService.saveConfig(newConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/30 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-neutral-200 my-8 space-y-5">
        <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-semibold text-neutral-900 text-base">{t.settingsTitle}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{t.settingsSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setMode('firebase')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              mode === 'firebase'
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <div className="font-medium text-xs text-neutral-900">{t.modeFirebaseTitle}</div>
            <p className="text-[11px] text-neutral-500 mt-0.5">{t.modeFirebaseDesc}</p>
          </button>

          <button
            type="button"
            onClick={() => setMode('demo')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              mode === 'demo'
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <div className="font-medium text-xs text-neutral-900">{t.modeDemoTitle}</div>
            <p className="text-[11px] text-neutral-500 mt-0.5">{t.modeDemoDesc}</p>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Group Identifier */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {t.familyGroupLabel}
            </label>
            <input
              type="text"
              placeholder={t.familyGroupPlaceholder}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm font-mono text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white"
              required
            />
            <p className="text-[11px] text-neutral-400 mt-1">{t.familyGroupHint}</p>
          </div>

          {/* Quick Paste Snippet */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {t.quickPasteLabel}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder='const firebaseConfig = { apiKey: "...", projectId: "..." };'
                value={rawPasteSnippet}
                onChange={(e) => setRawPasteSnippet(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs font-mono focus:outline-none focus:border-neutral-400"
              />
              <button
                type="button"
                onClick={handleParsePastedConfig}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium shrink-0 transition-colors"
              >
                {t.autoExtractBtn}
              </button>
            </div>
          </div>

          {/* Detailed Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                {t.projectIdLabel}
              </label>
              <input
                type="text"
                placeholder="my-family-cart-12345"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-400 focus:bg-white"
                required={mode === 'firebase'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                {t.apiKeyLabel}
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-400 focus:bg-white"
                required={mode === 'firebase'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                {t.appIdLabel}
              </label>
              <input
                type="text"
                placeholder="1:123456789:web:abcdef"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                {t.storageBucketLabel}
              </label>
              <input
                type="text"
                placeholder="my-project.appspot.com"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-400 focus:bg-white"
              />
            </div>
          </div>

          {testResult.message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                testResult.success
                  ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50/70 text-rose-800 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {qrCodeDataUrl && (
            <div className="pt-3 border-t border-neutral-100 flex items-center gap-4">
              <img
                src={qrCodeDataUrl}
                alt="Family Sync QR Code"
                className="w-20 h-20 rounded-lg border border-neutral-200 bg-white p-1 shrink-0"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-neutral-800">{t.qrPairingTitle}</div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  {t.qrPairingDesc(groupId)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <button
              type="button"
              disabled={testResult.loading || !apiKey || !projectId}
              onClick={handleTestConnection}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testResult.loading ? 'animate-spin' : ''}`} />
              <span>{testResult.loading ? t.testingConnectionBtn : t.testConnectionBtn}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 text-xs font-medium"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.savedSuccessBtn}</span>
                  </>
                ) : (
                  <span>{t.saveSettingsBtn}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
