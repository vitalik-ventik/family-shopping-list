import React, { useState } from 'react';
import { Category } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useLanguage } from '../i18n/LanguageContext';
import { Trash2, X } from 'lucide-react';

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
  const [newCatIcon, setNewCatIcon] = useState('🍎');
  const [newCatColor, setNewCatColor] = useState('#10b981');

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await firebaseService.addCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      bgLight: `${newCatColor}15`,
      order: categories.length + 1,
    });

    setNewCatName('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(t.confirmDeleteCategory(name))) {
      await firebaseService.deleteCategory(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/30 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-5">
        <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
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

        <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto border border-neutral-200 rounded-lg">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{cat.icon}</span>
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
          ))}
        </div>

        <form onSubmit={handleAddCategory} className="pt-2 space-y-2.5">
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

            <select
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-sm"
            >
              <option value="🥦">🥦</option>
              <option value="🧀">🧀</option>
              <option value="🥖">🥖</option>
              <option value="🥩">🥩</option>
              <option value="🌾">🌾</option>
              <option value="🧊">🧊</option>
              <option value="🍫">🍫</option>
              <option value="🧃">🧃</option>
              <option value="🧼">🧼</option>
              <option value="🐶">🐶</option>
              <option value="💊">💊</option>
              <option value="🍷">🍷</option>
            </select>

            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
              title={locale === 'uk' ? 'Колір' : 'Color'}
            />

            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-medium shrink-0"
            >
              {t.addItemBtn}
            </button>
          </div>
        </form>

        <div className="flex justify-end pt-2 border-t border-neutral-100">
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
