import React, { useState } from 'react';
import { Category } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronDown, Trash2, X } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

interface IconOption {
  emoji: string;
  labels: { uk: string; ru: string; en: string };
}

const CATEGORY_ICON_OPTIONS: IconOption[] = [
  // Groceries & Food
  { emoji: '🛒', labels: { uk: 'Покупки', ru: 'Покупки', en: 'Shopping' } },
  { emoji: '🥦', labels: { uk: 'Овочі', ru: 'Овощи', en: 'Produce' } },
  { emoji: '🍎', labels: { uk: 'Фрукти', ru: 'Фрукты', en: 'Fruit' } },
  { emoji: '🧀', labels: { uk: 'Молочне', ru: 'Молочное', en: 'Dairy' } },
  { emoji: '🥖', labels: { uk: 'Хліб', ru: 'Хлеб', en: 'Bakery' } },
  { emoji: '🥩', labels: { uk: "М'ясо", ru: 'Мясо', en: 'Meat' } },
  { emoji: '🐟', labels: { uk: 'Риба', ru: 'Рыба', en: 'Seafood' } },
  { emoji: '🌾', labels: { uk: 'Бакалія', ru: 'Бакалея', en: 'Grains' } },
  { emoji: '🍝', labels: { uk: 'Макарони', ru: 'Паста', en: 'Pantry' } },
  { emoji: '🧊', labels: { uk: 'Заморозка', ru: 'Заморозка', en: 'Frozen' } },
  { emoji: '🍫', labels: { uk: 'Солодощі', ru: 'Сладости', en: 'Sweets' } },
  { emoji: '☕', labels: { uk: 'Кава і чай', ru: 'Кофе и чай', en: 'Coffee & Tea' } },
  { emoji: '🧃', labels: { uk: 'Напої', ru: 'Напитки', en: 'Beverages' } },
  { emoji: '🍷', labels: { uk: 'Вино', ru: 'Напитки / Вино', en: 'Wine' } },

  // Household & Health
  { emoji: '🧼', labels: { uk: 'Хімія', ru: 'Бытовая химия', en: 'Cleaning' } },
  { emoji: '🧴', labels: { uk: 'Гігієна', ru: 'Гигиена', en: 'Personal Care' } },
  { emoji: '🧹', labels: { uk: 'Прибирання', ru: 'Уборка', en: 'Household' } },
  { emoji: '🧺', labels: { uk: 'Прання', ru: 'Стирка', en: 'Laundry' } },
  { emoji: '🧻', labels: { uk: 'Папір', ru: 'Бумага', en: 'Paper goods' } },
  { emoji: '💊', labels: { uk: 'Аптека', ru: 'Аптека', en: 'Pharmacy' } },
  { emoji: '🩹', labels: { uk: 'Медтовари', ru: 'Медтовары', en: 'First Aid' } },

  // Electronics & Tech
  { emoji: '📱', labels: { uk: 'Електроніка', ru: 'Электроника', en: 'Electronics' } },
  { emoji: '💻', labels: { uk: 'Комп’ютер', ru: 'Компьютер', en: 'Computers' } },
  { emoji: '🔌', labels: { uk: 'Кабелі й живлення', ru: 'Кабели и питание', en: 'Cables & Power' } },
  { emoji: '💡', labels: { uk: 'Освітлення', ru: 'Освещение', en: 'Lighting' } },
  { emoji: '🔋', labels: { uk: 'Батарейки', ru: 'Батарейки', en: 'Batteries' } },
  { emoji: '🎧', labels: { uk: 'Аудіо', ru: 'Аудио', en: 'Audio' } },
  { emoji: '📷', labels: { uk: 'Фото', ru: 'Фото', en: 'Camera' } },
  { emoji: '📺', labels: { uk: 'ТБ і техніка', ru: 'ТВ и техника', en: 'TV & Tech' } },
  { emoji: '🎮', labels: { uk: 'Ігри', ru: 'Игры', en: 'Gaming' } },

  // Repair, Tools & Garden
  { emoji: '🛠️', labels: { uk: 'Ремонт', ru: 'Ремонт', en: 'Repair' } },
  { emoji: '🔧', labels: { uk: 'Інструменти', ru: 'Инструменты', en: 'Tools' } },
  { emoji: '🔨', labels: { uk: 'Будівництво', ru: 'Стройка', en: 'Hardware' } },
  { emoji: '🪚', labels: { uk: 'Майстерня', ru: 'Мастерская', en: 'Workshop' } },
  { emoji: '🪛', labels: { uk: 'Кріплення', ru: 'Крепёж', en: 'Fasteners' } },
  { emoji: '🎨', labels: { uk: 'Фарби й декор', ru: 'Краски и декор', en: 'Paint & Craft' } },
  { emoji: '🪜', labels: { uk: 'Господарство', ru: 'Хозтовары', en: 'Maintenance' } },
  { emoji: '🌱', labels: { uk: 'Сад і дача', ru: 'Сад и дача', en: 'Garden' } },

  // Auto & Transport
  { emoji: '🚗', labels: { uk: 'Авто', ru: 'Машина', en: 'Car' } },
  { emoji: '⛽', labels: { uk: 'Паливо й автохімія', ru: 'Топливо и автохимия', en: 'Fuel & Auto' } },
  { emoji: '🛞', labels: { uk: 'Шини й сервіс', ru: 'Шины и сервис', en: 'Tires & Service' } },
  { emoji: '🚲', labels: { uk: 'Велосипед', ru: 'Велосипед', en: 'Bicycle' } },

  // Clothing, Shoes & Accessories
  { emoji: '👕', labels: { uk: 'Одяг', ru: 'Одежда', en: 'Clothing' } },
  { emoji: '👗', labels: { uk: 'Сукні й мода', ru: 'Платья и мода', en: 'Apparel' } },
  { emoji: '👖', labels: { uk: 'Джинси й штани', ru: 'Джинсы и брюки', en: 'Pants' } },
  { emoji: '🧥', labels: { uk: 'Верхній одяг', ru: 'Верхняя одежда', en: 'Outerwear' } },
  { emoji: '👟', labels: { uk: 'Взуття', ru: 'Обувь', en: 'Shoes' } },
  { emoji: '🧦', labels: { uk: 'Білизна й шкарпетки', ru: 'Бельё и носки', en: 'Socks & Basics' } },
  { emoji: '👜', labels: { uk: 'Сумки й аксесуари', ru: 'Сумки и аксессуары', en: 'Bags' } },
  { emoji: '🧢', labels: { uk: 'Головні убори', ru: 'Головные уборы', en: 'Hats' } },

  // Furniture, Kitchen & Home
  { emoji: '🛋️', labels: { uk: 'Меблі', ru: 'Мебель', en: 'Furniture' } },
  { emoji: '🪑', labels: { uk: 'Стільці й столи', ru: 'Стулья и столы', en: 'Chairs & Tables' } },
  { emoji: '🛏️', labels: { uk: 'Спальня й текстиль', ru: 'Спальня и текстиль', en: 'Bedding' } },
  { emoji: '🪴', labels: { uk: 'Рослини й інтер’єр', ru: 'Растения и интерьер', en: 'Plants & Decor' } },
  { emoji: '🕯️', labels: { uk: 'Затишок', ru: 'Уют', en: 'Home Cozy' } },
  { emoji: '🖼️', labels: { uk: 'Декор', ru: 'Декор', en: 'Decor' } },
  { emoji: '🍳', labels: { uk: 'Кухня й посуд', ru: 'Кухня и посуда', en: 'Cookware' } },
  { emoji: '🍽️', labels: { uk: 'Сервірування', ru: 'Посуда', en: 'Tableware' } },

  // Pets, Kids, Leisure & Other
  { emoji: '🐶', labels: { uk: 'Собака', ru: 'Собака', en: 'Dog' } },
  { emoji: '🐱', labels: { uk: 'Кіт', ru: 'Кошка', en: 'Cat' } },
  { emoji: '🧸', labels: { uk: 'Дитячі товари', ru: 'Детские товары', en: 'Kids & Toys' } },
  { emoji: '🍼', labels: { uk: 'Малюк', ru: 'Малыш', en: 'Baby' } },
  { emoji: '📚', labels: { uk: 'Книги й канцелярія', ru: 'Книги и канцелярия', en: 'Books & Office' } },
  { emoji: '🎁', labels: { uk: 'Подарунки', ru: 'Подарки', en: 'Gifts' } },
  { emoji: '⚽', labels: { uk: 'Спорт', ru: 'Спорт', en: 'Sports' } },
  { emoji: '🏕️', labels: { uk: 'Туризм', ru: 'Туризм', en: 'Outdoors' } },
  { emoji: '✈️', labels: { uk: 'Подорожі', ru: 'Путешествия', en: 'Travel' } },
  { emoji: '📦', labels: { uk: 'Різне', ru: 'Разное', en: 'Other' } },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
}) => {
  const { t, getCategoryName, locale } = useLanguage();
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🛒');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [showNewIconPicker, setShowNewIconPicker] = useState(false);
  const [editingIconCatId, setEditingIconCatId] = useState<string | null>(null);

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
    setShowNewIconPicker(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(t.confirmDeleteCategory(name))) {
      await firebaseService.deleteCategory(id);
    }
  };

  const handleUpdateIcon = async (catId: string, icon: string) => {
    setEditingIconCatId(null);
    await firebaseService.updateCategory(catId, { icon });
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
                    className="w-7 h-7 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-base transition-colors"
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-sm shrink-0"
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
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
                  showNewIconPicker ? 'rotate-180' : ''
                }`}
              />
            </button>

            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer p-0.5 shrink-0"
              title={locale === 'uk' ? 'Колір' : locale === 'ru' ? 'Цвет' : 'Color'}
            />

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
