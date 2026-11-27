import React, { useState } from 'react';
import { WeekendTemplate, Category, ShoppingItem } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useLanguage } from '../i18n/LanguageContext';
import { Plus, Trash2, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WeekendTemplateMasterProps {
  templates: WeekendTemplate[];
  categories: Category[];
  currentItems: ShoppingItem[];
  onBackToList: () => void;
}

export const WeekendTemplateMaster: React.FC<WeekendTemplateMasterProps> = ({
  templates,
  categories,
  currentItems,
  onBackToList,
}) => {
  const { t, getUnitName, locale } = useLanguage();

  const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<WeekendTemplate | null>(null);
  const [applyMode, setApplyMode] = useState<'merge' | 'replace'>('merge');
  const [selectedItemIndices, setSelectedItemIndices] = useState<Set<number>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateIcon, setNewTemplateIcon] = useState('🛒');
  const [newTemplateTag, setNewTemplateTag] = useState(
    locale === 'uk' ? 'Вихідні' : locale === 'ru' ? 'Выходные' : 'Weekend'
  );

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const handleOpenApply = (template: WeekendTemplate) => {
    setSelectedTemplateForApply(template);
    const allIndices = new Set<number>();
    template.items.forEach((_, idx) => allIndices.add(idx));
    setSelectedItemIndices(allIndices);
    setApplyMode('merge');
  };

  const handleToggleItemSelection = (index: number) => {
    setSelectedItemIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleExecuteApply = async () => {
    if (!selectedTemplateForApply) return;
    setIsApplying(true);

    try {
      await firebaseService.applyTemplate(selectedTemplateForApply.id, applyMode);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
      });

      setSelectedTemplateForApply(null);
      onBackToList();
    } catch (e) {
      console.error('Failed to apply template', e);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSnapshotCurrentList = async () => {
    const activeItems = currentItems.filter((i) => !i.completed && !i.cancelled);
    if (activeItems.length === 0) {
      alert(t.noActiveItemsToSave);
      return;
    }

    const defaultName =
      locale === 'uk'
        ? `Мій закуп (${new Date().toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' })})`
        : locale === 'ru'
          ? `Моя закупка (${new Date().toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })})`
          : `My Weekend List (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

    const templateName = prompt(t.promptTemplateName, defaultName);
    if (!templateName || !templateName.trim()) return;

    await firebaseService.saveTemplate({
      name: templateName.trim(),
      description:
        locale === 'uk'
          ? `Збережено з активного кошика (${activeItems.length} позицій).`
          : locale === 'ru'
            ? `Сохранено из списка (${activeItems.length} позиций).`
            : `Saved from active basket with ${activeItems.length} items.`,
      icon: '🛒',
      tag: locale === 'uk' ? 'Власний' : locale === 'ru' ? 'Свой' : 'Custom',
      items: activeItems.map((i) => ({
        title: i.title,
        categoryId: i.categoryId,
        quantity: i.quantity,
        unit: i.unit,
        note: i.note,
        estimatedPrice: i.estimatedPrice,
        urgent: i.urgent,
      })),
    });

    confetti({ particleCount: 40, spread: 50 });
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const items =
      currentItems.length > 0
        ? currentItems.map((i) => ({
            title: i.title,
            categoryId: i.categoryId,
            quantity: i.quantity,
            unit: i.unit,
            note: i.note,
            estimatedPrice: i.estimatedPrice,
            urgent: i.urgent,
          }))
        : [
            {
              title: locale === 'uk' ? 'Органічне молоко' : locale === 'ru' ? 'Молоко' : 'Organic Milk',
              categoryId: 'cat_dairy',
              quantity: 1,
              unit: 'gal',
            },
            {
              title: locale === 'uk' ? 'Яйця курячі' : locale === 'ru' ? 'Яйца куриные' : 'Eggs',
              categoryId: 'cat_dairy',
              quantity: 1,
              unit: 'dozen',
            },
            {
              title: locale === 'uk' ? 'Свіжий хліб' : locale === 'ru' ? 'Свежий хлеб' : 'Fresh Bread',
              categoryId: 'cat_bakery',
              quantity: 1,
              unit: 'loaf',
            },
          ];

    await firebaseService.saveTemplate({
      name: newTemplateName.trim(),
      description:
        newTemplateDesc.trim() ||
        (locale === 'uk'
          ? 'Власний шаблон покупок'
          : locale === 'ru'
            ? 'Свой шаблон покупок'
            : 'Custom shopping template'),
      icon: newTemplateIcon,
      tag: newTemplateTag,
      items,
    });

    setIsCreateModalOpen(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
  };

  const getLocalizedTemplateInfo = (template: WeekendTemplate) => {
    if (locale === 'uk') {
      if (template.id === 'template_weekend_haul') {
        return {
          name: 'Великий суботній закуп',
          description:
            'Тижневе поповнення: овочі та фрукти, молочні продукти, яйця, м\'ясо та побутові товари.',
          tag: 'Вихідні',
        };
      }
      if (template.id === 'template_weekday_basics') {
        return {
          name: 'Тижневий експрес-набір',
          description: 'Швидкий забіг серед тижня: молоко, батон, масло, банани та кава.',
          tag: 'Експрес',
        };
      }
      if (template.id === 'template_bbq_party') {
        return {
          name: 'Пікнік та барбекю',
          description: 'Бургери, булочки, сир, соуси, напої, вугілля та кавун.',
          tag: 'Пікнік',
        };
      }
      if (template.id === 'template_deep_pantry') {
        return {
          name: 'Запаси та побутова хімія',
          description: 'Засоби для прання, паперові рушники, олія, паста, рис та томати.',
          tag: 'Місяць',
        };
      }
    }
    if (locale === 'ru') {
      if (template.id === 'template_weekend_haul') {
        return {
          name: 'Большая субботняя закупка',
          description:
            'Недельное пополнение: овощи и фрукты, молочные продукты, яйца, мясо и бытовые товары.',
          tag: 'Выходные',
        };
      }
      if (template.id === 'template_weekday_basics') {
        return {
          name: 'Экспресс-набор на неделю',
          description: 'Быстрый закуп среди недели: молоко, батон, масло, бананы и кофе.',
          tag: 'Экспресс',
        };
      }
      if (template.id === 'template_bbq_party') {
        return {
          name: 'Пикник и барбекю',
          description: 'Бургеры, булочки, сыр, соусы, напитки, уголь и арбуз.',
          tag: 'Пикник',
        };
      }
      if (template.id === 'template_deep_pantry') {
        return {
          name: 'Запасы и бытовая химия',
          description: 'Средства для стирки, бумажные полотенца, масло, паста, рис и томаты.',
          tag: 'Месяц',
        };
      }
    }
    return {
      name: template.name,
      description: template.description,
      tag: template.tag,
    };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Minimalist Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.tabShoppingList}</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {t.weekendMasterTitle}
          </h1>
          <p className="text-xs text-neutral-500 max-w-xl">
            {t.weekendMasterDesc}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSnapshotCurrentList}
            className="px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-medium text-xs transition-colors whitespace-nowrap"
          >
            {t.saveCurrentAsTemplate}
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.createNewTemplate}</span>
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const locInfo = getLocalizedTemplateInfo(template);
          const totalEstCost = template.items.reduce(
            (sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1),
            0
          );

          return (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col justify-between gap-4 hover:border-neutral-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{template.icon}</span>
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm">
                        {locInfo.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5 tabular-nums">
                        <span>
                          {template.items.length}{' '}
                          {locale === 'uk' ? 'поз.' : locale === 'ru' ? 'поз.' : 'items'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{locInfo.tag}</span>
                        {totalEstCost > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>~${totalEstCost.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {template.id.startsWith('tmpl_') && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t.confirmDeleteTemplate(locInfo.name))) {
                          firebaseService.deleteTemplate(template.id);
                        }
                      }}
                      className="text-neutral-300 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  {locInfo.description}
                </p>

                {/* Clean unboxed inline preview */}
                <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                  {template.items.map((item) => item.title).join(', ')}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-neutral-400 tabular-nums">
                  {template.lastUsedAt
                    ? t.lastUsedOn(new Date(template.lastUsedAt).toLocaleDateString())
                    : ''}
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenApply(template)}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors whitespace-nowrap"
                >
                  {t.applyInOneTap}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1-Tap Apply Modal */}
      {selectedTemplateForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/30 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-semibold text-neutral-900 text-base">
                  {t.applyModalTitle(getLocalizedTemplateInfo(selectedTemplateForApply).name)}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">{t.applyModalDesc}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTemplateForApply(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-600">{t.applyModeLabel}</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setApplyMode('merge')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    applyMode === 'merge'
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-neutral-900">
                      {t.modeMergeTitle}
                    </span>
                    {applyMode === 'merge' && <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                    {t.modeMergeDesc}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setApplyMode('replace')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    applyMode === 'replace'
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-neutral-900">
                      {t.modeReplaceTitle}
                    </span>
                    {applyMode === 'replace' && <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                    {t.modeReplaceDesc}
                  </p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-600 tabular-nums">
                  {t.selectItemsToInclude(
                    selectedItemIndices.size,
                    selectedTemplateForApply.items.length
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItemIndices.size === selectedTemplateForApply.items.length) {
                      setSelectedItemIndices(new Set());
                    } else {
                      const all = new Set<number>();
                      selectedTemplateForApply.items.forEach((_, i) => all.add(i));
                      setSelectedItemIndices(all);
                    }
                  }}
                  className="text-xs text-neutral-700 font-medium hover:underline"
                >
                  {selectedItemIndices.size === selectedTemplateForApply.items.length
                    ? t.deselectAllBtn
                    : t.selectAllBtn}
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto divide-y divide-neutral-100 border border-neutral-200 rounded-lg">
                {selectedTemplateForApply.items.map((item, idx) => {
                  const isChecked = selectedItemIndices.has(idx);
                  const cat = categoryMap.get(item.categoryId);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleItemSelection(idx)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded text-neutral-900 focus:ring-neutral-900"
                        />
                        <span>{cat?.icon || '🛒'}</span>
                        <span className="font-medium text-neutral-800">{item.title}</span>
                        <span className="text-neutral-400 tabular-nums">
                          {item.quantity} {getUnitName(item.unit)}
                        </span>
                      </div>
                      {item.estimatedPrice && (
                        <span className="text-neutral-400 tabular-nums">
                          ~${(item.estimatedPrice * item.quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setSelectedTemplateForApply(null)}
                className="px-4 py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 text-xs font-medium"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                disabled={selectedItemIndices.size === 0 || isApplying}
                onClick={handleExecuteApply}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium transition-colors"
              >
                {isApplying ? t.loadingItemsBtn : t.loadItemsIntoListBtn(selectedItemIndices.size)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/30 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900 text-base">{t.createNewTemplate}</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  {locale === 'uk'
                    ? 'Назва шаблону'
                    : locale === 'ru'
                      ? 'Название шаблона'
                      : 'Template Name'}
                </label>
                <input
                  type="text"
                  placeholder={
                    locale === 'uk'
                      ? 'напр. Недільний сніданок'
                      : locale === 'ru'
                        ? 'напр. Воскресный завтрак'
                        : 'e.g. Sunday Family Brunch'
                  }
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  {locale === 'uk' ? 'Опис' : locale === 'ru' ? 'Описание' : 'Description'}
                </label>
                <input
                  type="text"
                  placeholder={
                    locale === 'uk'
                      ? 'Короткий опис'
                      : locale === 'ru'
                        ? 'Краткое описание'
                        : 'Brief description'
                  }
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {locale === 'uk' ? 'Іконка' : locale === 'ru' ? 'Иконка' : 'Icon'}
                  </label>
                  <select
                    value={newTemplateIcon}
                    onChange={(e) => setNewTemplateIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm"
                  >
                    <option value="🛒">🛒</option>
                    <option value="🥞">🥞</option>
                    <option value="🥩">🥩</option>
                    <option value="🥑">🥑</option>
                    <option value="🧼">🧼</option>
                    <option value="🎉">🎉</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {locale === 'uk' ? 'Тег' : locale === 'ru' ? 'Тег' : 'Tag'}
                  </label>
                  <input
                    type="text"
                    value={newTemplateTag}
                    onChange={(e) => setNewTemplateTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm"
                  />
                </div>
              </div>

              <p className="text-xs text-neutral-500">
                {locale === 'uk'
                  ? `У шаблон буде збережено поточні позиції (${currentItems.length}).`
                  : locale === 'ru'
                    ? `В шаблон будут сохранены текущие позиции (${currentItems.length}).`
                    : `Saves your current items (${currentItems.length}) into this template.`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-neutral-600 text-xs font-medium"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium"
                >
                  {locale === 'uk'
                    ? 'Зберегти шаблон'
                    : locale === 'ru'
                      ? 'Сохранить шаблон'
                      : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
