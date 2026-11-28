import React, { useState } from 'react';
import { Category } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronDown, Trash2, X } from 'lucide-react';
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryDefaultColors,
  getCategoryTelegramStyle,
} from '../utils/categoryTheme';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
}) => {
  const { t, getCategoryName, locale } = useLanguage();
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🛒');
  const [showNewIconPicker, setShowNewIconPicker] = useState(false);
  const [editingIconCatId, setEditingIconCatId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const { color, bgLight } = getCategoryDefaultColors(newCatIcon);
    await firebaseService.addCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      color,
      bgLight,
      order: categories.length + 1,
    });

    setNewCatName('');
    setShowNewIconPicker(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(t.confirmDeleteCategory(name))) {
      await firebaseService.deleteCategory(id);
    }
  };

  const handleUpdateIcon = async (catId: string, icon: string) => {
    setEditingIconCatId(null);
    const { color, bgLight } = getCategoryDefaultColors(icon, catId);
    await firebaseService.updateCategory(catId, { icon, color, bgLight });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/30 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between pb-3 border-b border-neutral-100 shrink-0">
          <div>
            <h3 className="font-semibold text-neutral-900 text-base">
              {t.categoriesModalTitle}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">{t.categoriesModalDesc}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-neutral-100 overflow-y-auto border border-neutral-200 rounded-lg flex-1 min-h-0">
          {categories.map((cat) => (
            <div key={cat.id} className="px-3 py-2 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingIconCatId(editingIconCatId === cat.id ? null : cat.id)
                    }
                    style={getCategoryTelegramStyle(cat.icon, cat.id, false, false, {
                      showDoodles: false,
                      subtleWeb: true,
                    })}
                    className="w-7 h-7 rounded-md border flex items-center justify-center text-base transition-transform hover:scale-105"
                    title={
                      locale === 'ru'
                        ? 'Сменить иконку'
                        : locale === 'en'
                          ? 'Change icon'
                          : 'Змінити іконку'
                    }
                  >
                    {cat.icon}
                  </button>
                  <span className="font-medium text-xs text-neutral-800">
                    {getCategoryName(cat)}
                  </span>
                </div>

                {categories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id, getCategoryName(cat))}
                    className="text-neutral-300 hover:text-rose-600 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {editingIconCatId === cat.id && (
                <div className="mt-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200 grid grid-cols-8 gap-1 max-h-36 overflow-y-auto">
                  {CATEGORY_ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.emoji}
                      type="button"
                      onClick={() => handleUpdateIcon(cat.id, opt.emoji)}
                      title={opt.labels[locale]}
                      className={`h-7 rounded flex items-center justify-center text-base hover:bg-white transition-colors ${
                        cat.icon === opt.emoji ? 'bg-white ring-1 ring-neutral-900' : ''
                      }`}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCategory} className="pt-1 space-y-2.5 shrink-0">
          <div className="text-xs font-medium text-neutral-600">{t.addNewCategoryLabel}</div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t.newCategoryPlaceholder}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-400 focus:bg-white"
              required
            />

            <button
              type="button"
              onClick={() => setShowNewIconPicker((v) => !v)}
              style={getCategoryTelegramStyle(newCatIcon, '', false, false, {
                showDoodles: false,
                subtleWeb: true,
              })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-sm shrink-0 transition-colors"
              title={
                locale === 'ru'
                  ? 'Выбрать иконку'
                  : locale === 'en'
                    ? 'Choose icon'
                    : 'Обрати іконку'
              }
            >
              <span>{newCatIcon}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${
                  showNewIconPicker ? 'rotate-180' : ''
                }`}
              />
            </button>

            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-medium shrink-0"
            >
              {t.addItemBtn}
            </button>
          </div>

          {showNewIconPicker && (
            <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200 grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
              {CATEGORY_ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.emoji}
                  type="button"
                  onClick={() => {
                    setNewCatIcon(opt.emoji);
                    setShowNewIconPicker(false);
                  }}
                  title={opt.labels[locale]}
                  className={`h-8 rounded-md flex items-center justify-center text-base hover:bg-white transition-colors ${
                    newCatIcon === opt.emoji
                      ? 'bg-white ring-1 ring-neutral-900 shadow-2xs'
                      : ''
                  }`}
                >
                  {opt.emoji}
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="flex justify-end pt-2 border-t border-neutral-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
