import React from 'react';

export type DoodlePatternGroup =
  | 'produce'
  | 'food_drink'
  | 'electronics'
  | 'repair_tools'
  | 'auto'
  | 'clothing'
  | 'furniture_home'
  | 'cleaning'
  | 'lifestyle_pets';

export interface IconOption {
  emoji: string;
  labels: { uk: string; ru: string; en: string };
}

export interface IconVisualConfig {
  patternGroup: DoodlePatternGroup;
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  saturation: number;
  variant: number;
}

export const CATEGORY_ICON_OPTIONS: IconOption[] = [
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

const ICON_VISUAL_MAP: Record<string, IconVisualConfig> = {
  // Groceries & Produce
  '🛒': { patternGroup: 'food_drink', h1: 152, h2: 184, h3: 128, h4: 205, saturation: 0.56, variant: 0 },
  '🥦': { patternGroup: 'produce', h1: 138, h2: 92, h3: 168, h4: 72, saturation: 0.58, variant: 0 },
  '🥬': { patternGroup: 'produce', h1: 138, h2: 92, h3: 168, h4: 72, saturation: 0.58, variant: 0 },
  '🍎': { patternGroup: 'produce', h1: 6, h2: 342, h3: 28, h4: 355, saturation: 0.62, variant: 1 },
  '🧀': { patternGroup: 'food_drink', h1: 42, h2: 28, h3: 52, h4: 18, saturation: 0.66, variant: 0 },
  '🥛': { patternGroup: 'food_drink', h1: 202, h2: 184, h3: 218, h4: 44, saturation: 0.56, variant: 1 },
  '🥖': { patternGroup: 'food_drink', h1: 30, h2: 42, h3: 18, h4: 48, saturation: 0.62, variant: 2 },
  '🥩': { patternGroup: 'food_drink', h1: 350, h2: 12, h3: 332, h4: 22, saturation: 0.58, variant: 3 },
  '🐟': { patternGroup: 'food_drink', h1: 194, h2: 214, h3: 174, h4: 232, saturation: 0.60, variant: 1 },
  '🌾': { patternGroup: 'food_drink', h1: 46, h2: 32, h3: 64, h4: 24, saturation: 0.56, variant: 2 },
  '🍝': { patternGroup: 'food_drink', h1: 26, h2: 44, h3: 10, h4: 52, saturation: 0.60, variant: 0 },
  '🧊': { patternGroup: 'food_drink', h1: 190, h2: 210, h3: 172, h4: 226, saturation: 0.62, variant: 2 },
  '❄️': { patternGroup: 'food_drink', h1: 190, h2: 210, h3: 172, h4: 226, saturation: 0.62, variant: 2 },
  '🍫': { patternGroup: 'food_drink', h1: 328, h2: 20, h3: 346, h4: 290, saturation: 0.56, variant: 3 },
  '☕': { patternGroup: 'food_drink', h1: 24, h2: 38, h3: 14, h4: 46, saturation: 0.52, variant: 1 },
  '🧃': { patternGroup: 'food_drink', h1: 272, h2: 304, h3: 248, h4: 330, saturation: 0.58, variant: 0 },
  '🍷': { patternGroup: 'food_drink', h1: 336, h2: 298, h3: 352, h4: 276, saturation: 0.56, variant: 2 },

  // Household & Health
  '🧼': { patternGroup: 'cleaning', h1: 206, h2: 182, h3: 226, h4: 166, saturation: 0.60, variant: 0 },
  '🧴': { patternGroup: 'cleaning', h1: 172, h2: 196, h3: 152, h4: 214, saturation: 0.58, variant: 1 },
  '🧹': { patternGroup: 'cleaning', h1: 188, h2: 164, h3: 208, h4: 144, saturation: 0.54, variant: 2 },
  '🧺': { patternGroup: 'cleaning', h1: 218, h2: 192, h3: 240, h4: 176, saturation: 0.54, variant: 3 },
  '🧻': { patternGroup: 'cleaning', h1: 200, h2: 220, h3: 182, h4: 236, saturation: 0.45, variant: 0 },
  '💊': { patternGroup: 'lifestyle_pets', h1: 158, h2: 198, h3: 138, h4: 216, saturation: 0.58, variant: 1 },
  '🩹': { patternGroup: 'lifestyle_pets', h1: 16, h2: 356, h3: 32, h4: 14, saturation: 0.54, variant: 2 },

  // Electronics & Tech
  '📱': { patternGroup: 'electronics', h1: 216, h2: 244, h3: 196, h4: 266, saturation: 0.62, variant: 0 },
  '💻': { patternGroup: 'electronics', h1: 228, h2: 198, h3: 254, h4: 182, saturation: 0.58, variant: 1 },
  '🔌': { patternGroup: 'electronics', h1: 196, h2: 232, h3: 176, h4: 252, saturation: 0.60, variant: 2 },
  '💡': { patternGroup: 'electronics', h1: 46, h2: 32, h3: 64, h4: 204, saturation: 0.66, variant: 3 },
  '🔋': { patternGroup: 'electronics', h1: 148, h2: 184, h3: 126, h4: 206, saturation: 0.60, variant: 0 },
  '🎧': { patternGroup: 'electronics', h1: 264, h2: 294, h3: 234, h4: 316, saturation: 0.60, variant: 1 },
  '📷': { patternGroup: 'electronics', h1: 210, h2: 240, h3: 286, h4: 192, saturation: 0.54, variant: 2 },
  '📺': { patternGroup: 'electronics', h1: 236, h2: 208, h3: 262, h4: 190, saturation: 0.56, variant: 3 },
  '🎮': { patternGroup: 'electronics', h1: 258, h2: 312, h3: 222, h4: 284, saturation: 0.62, variant: 0 },

  // Repair, Tools & Garden
  '🛠️': { patternGroup: 'repair_tools', h1: 28, h2: 208, h3: 40, h4: 224, saturation: 0.54, variant: 0 },
  '🔧': { patternGroup: 'repair_tools', h1: 212, h2: 230, h3: 194, h4: 34, saturation: 0.50, variant: 1 },
  '🔨': { patternGroup: 'repair_tools', h1: 22, h2: 38, h3: 210, h4: 12, saturation: 0.56, variant: 2 },
  '🪚': { patternGroup: 'repair_tools', h1: 34, h2: 18, h3: 200, h4: 48, saturation: 0.54, variant: 3 },
  '🪛': { patternGroup: 'repair_tools', h1: 18, h2: 206, h3: 36, h4: 224, saturation: 0.56, variant: 0 },
  '🎨': { patternGroup: 'repair_tools', h1: 318, h2: 42, h3: 196, h4: 274, saturation: 0.62, variant: 1 },
  '🪜': { patternGroup: 'repair_tools', h1: 36, h2: 52, h3: 22, h4: 204, saturation: 0.50, variant: 2 },
  '🌱': { patternGroup: 'produce', h1: 112, h2: 146, h3: 88, h4: 166, saturation: 0.60, variant: 3 },

  // Auto & Transport
  '🚗': { patternGroup: 'auto', h1: 216, h2: 236, h3: 198, h4: 4, saturation: 0.58, variant: 0 },
  '⛽': { patternGroup: 'auto', h1: 8, h2: 32, h3: 214, h4: 350, saturation: 0.58, variant: 1 },
  '🛞': { patternGroup: 'auto', h1: 214, h2: 238, h3: 192, h4: 256, saturation: 0.44, variant: 2 },
  '🚲': { patternGroup: 'auto', h1: 166, h2: 198, h3: 142, h4: 218, saturation: 0.58, variant: 3 },

  // Clothing & Accessories
  '👕': { patternGroup: 'clothing', h1: 208, h2: 236, h3: 186, h4: 258, saturation: 0.58, variant: 0 },
  '👗': { patternGroup: 'clothing', h1: 330, h2: 300, h3: 350, h4: 276, saturation: 0.60, variant: 1 },
  '👖': { patternGroup: 'clothing', h1: 222, h2: 246, h3: 204, h4: 266, saturation: 0.56, variant: 2 },
  '🧥': { patternGroup: 'clothing', h1: 26, h2: 14, h3: 42, h4: 216, saturation: 0.50, variant: 3 },
  '👟': { patternGroup: 'clothing', h1: 186, h2: 218, h3: 340, h4: 166, saturation: 0.56, variant: 0 },
  '🧦': { patternGroup: 'clothing', h1: 286, h2: 320, h3: 256, h4: 344, saturation: 0.54, variant: 1 },
  '👜': { patternGroup: 'clothing', h1: 24, h2: 354, h3: 40, h4: 334, saturation: 0.54, variant: 2 },
  '🧢': { patternGroup: 'clothing', h1: 196, h2: 224, h3: 174, h4: 38, saturation: 0.56, variant: 3 },

  // Furniture, Home & Kitchen
  '🛋️': { patternGroup: 'furniture_home', h1: 32, h2: 46, h3: 18, h4: 148, saturation: 0.52, variant: 0 },
  '🪑': { patternGroup: 'furniture_home', h1: 28, h2: 42, h3: 16, h4: 54, saturation: 0.48, variant: 1 },
  '🛏️': { patternGroup: 'furniture_home', h1: 248, h2: 274, h3: 222, h4: 294, saturation: 0.52, variant: 2 },
  '🪴': { patternGroup: 'furniture_home', h1: 132, h2: 36, h3: 154, h4: 96, saturation: 0.56, variant: 3 },
  '🕯️': { patternGroup: 'furniture_home', h1: 38, h2: 22, h3: 54, h4: 346, saturation: 0.58, variant: 0 },
  '🖼️': { patternGroup: 'furniture_home', h1: 266, h2: 212, h3: 294, h4: 42, saturation: 0.52, variant: 1 },
  '🍳': { patternGroup: 'furniture_home', h1: 16, h2: 38, h3: 356, h4: 210, saturation: 0.56, variant: 2 },
  '🍽️': { patternGroup: 'furniture_home', h1: 196, h2: 42, h3: 176, h4: 220, saturation: 0.46, variant: 3 },

  // Pets, Kids & Leisure
  '🐶': { patternGroup: 'lifestyle_pets', h1: 30, h2: 46, h3: 18, h4: 142, saturation: 0.56, variant: 0 },
  '🐱': { patternGroup: 'lifestyle_pets', h1: 282, h2: 318, h3: 38, h4: 256, saturation: 0.54, variant: 1 },
  '🧸': { patternGroup: 'lifestyle_pets', h1: 34, h2: 16, h3: 48, h4: 344, saturation: 0.56, variant: 2 },
  '🍼': { patternGroup: 'lifestyle_pets', h1: 194, h2: 336, h3: 174, h4: 218, saturation: 0.56, variant: 3 },
  '📚': { patternGroup: 'lifestyle_pets', h1: 232, h2: 264, h3: 206, h4: 38, saturation: 0.54, variant: 0 },
  '🎁': { patternGroup: 'lifestyle_pets', h1: 342, h2: 24, h3: 316, h4: 44, saturation: 0.62, variant: 1 },
  '⚽': { patternGroup: 'lifestyle_pets', h1: 146, h2: 196, h3: 122, h4: 216, saturation: 0.56, variant: 2 },
  '🏕️': { patternGroup: 'lifestyle_pets', h1: 142, h2: 34, h3: 174, h4: 92, saturation: 0.56, variant: 3 },
  '✈️': { patternGroup: 'lifestyle_pets', h1: 198, h2: 226, h3: 178, h4: 248, saturation: 0.60, variant: 0 },
  '📦': { patternGroup: 'lifestyle_pets', h1: 32, h2: 48, h3: 20, h4: 208, saturation: 0.48, variant: 1 },
};

const FALLBACK_BY_CATEGORY_ID: Record<string, string> = {
  cat_produce: '🥦',
  cat_dairy: '🧀',
  cat_bakery: '🥖',
  cat_meat: '🥩',
  cat_pantry: '🌾',
  cat_frozen: '🧊',
  cat_snacks: '🍫',
  cat_beverages: '🧃',
  cat_household: '🧼',
  cat_personal: '🧴',
  cat_other: '📦',
};

const PATTERN_GROUPS: DoodlePatternGroup[] = [
  'produce',
  'food_drink',
  'electronics',
  'repair_tools',
  'auto',
  'clothing',
  'furniture_home',
  'cleaning',
  'lifestyle_pets',
];

function normHue(h: number): number {
  return ((Math.round(h) % 360) + 360) % 360;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function resolveIconVisual(icon?: string | null, categoryId = ''): IconVisualConfig {
  const key = (icon || '').trim();
  if (key && ICON_VISUAL_MAP[key]) {
    return ICON_VISUAL_MAP[key];
  }
  if (categoryId && FALLBACK_BY_CATEGORY_ID[categoryId]) {
    const fb = FALLBACK_BY_CATEGORY_ID[categoryId];
    if (ICON_VISUAL_MAP[fb]) return ICON_VISUAL_MAP[fb];
  }
  const hash = hashString(key + categoryId);
  const baseHue = (hash % 12) * 30;
  return {
    patternGroup: PATTERN_GROUPS[hash % PATTERN_GROUPS.length],
    h1: baseHue,
    h2: baseHue + 28,
    h3: baseHue - 24,
    h4: baseHue + 52,
    saturation: 0.56,
    variant: hash % 4,
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = normHue(h) / 360;
  const sat = Math.max(0, Math.min(1, s));
  const light = Math.max(0, Math.min(1, l));
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const toChannel = (t: number) => {
    let v = t;
    if (v < 0) v += 1;
    if (v > 1) v -= 1;
    if (v < 1 / 6) return p + (q - p) * 6 * v;
    if (v < 1 / 2) return q;
    if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6;
    return p;
  };
  const r = Math.round(toChannel(hue + 1 / 3) * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(toChannel(hue) * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(toChannel(hue - 1 / 3) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function getCategoryDefaultColors(icon?: string | null, categoryId = ''): {
  color: string;
  bgLight: string;
} {
  const v = resolveIconVisual(icon, categoryId);
  return {
    color: hslToHex(v.h1, Math.min(0.72, v.saturation + 0.08), 0.45),
    bgLight: hslToHex(v.h1, v.saturation * 0.7, 0.94),
  };
}

function doodleSvgInner(group: DoodlePatternGroup, idx: number): string {
  switch (group) {
    case 'produce':
      switch (idx % 4) {
        case 0:
          return '<circle cx="0" cy="1.5" r="7.5"/><path d="M0 -6 L1.8 -10.5 M1.2 -8 Q7 -10.5 6.4 -5 Q3 -5 1.2 -8"/>';
        case 1:
          return '<polygon points="-4.5,-5 4.5,-5 0,10.5"/><path d="M0 -5.5 V-10.5 M-1.8 -5.5 L-4.5 -9.5 M1.8 -5.5 L4.5 -9.5"/>';
        case 2:
          return '<path d="M0 -10.5 Q9.5 -1.5 0 9.5 Q-9.5 -1.5 0 -10.5 M0 -6 V11"/>';
        default:
          return '<path d="M-9 -4 A9 7.5 0 0 0 9 -4 Z M0 -4 V3.5"/>';
      }
    case 'food_drink':
      switch (idx % 4) {
        case 0:
          return '<polygon points="-8.5,6.5 9.5,6.5 6.5,-6.5"/><circle cx="1.5" cy="2" r="1.8"/><circle cx="5.2" cy="3.2" r="1.2"/>';
        case 1:
          return '<rect x="-6" y="-3.5" width="11" height="11" rx="2"/><path d="M5 -1 A3 3 0 0 1 5 5 M-2 -6.5 V-9.5 M2 -6.5 V-9.5"/>';
        case 2:
          return '<polygon points="-2.4,-10 2.4,-10 2.4,-5 5,-1.8 5,9.5 -5,9.5 -5,-1.8 -2.4,-5"/>';
        default:
          return '<rect x="-9.5" y="-4.5" width="19" height="9" rx="4.5"/><path d="M-3.5 -2.5 L-1.5 2.5 M2 -2.5 L4 2.5"/>';
      }
    case 'electronics':
      switch (idx % 4) {
        case 0:
          return '<rect x="-5.5" y="-9.5" width="11" height="19" rx="2.4"/><circle cx="0" cy="6.2" r="0.9"/>';
        case 1:
          return '<circle cx="0" cy="-2.2" r="6.2"/><path d="M-3 5.2 H3 M-2.2 8.2 H2.2"/>';
        case 2:
          return '<path d="M-8.5 1 A8.5 8 0 0 1 8.5 1"/><rect x="-9.8" y="0" width="3.5" height="7" rx="1.4"/><rect x="6.3" y="0" width="3.5" height="7" rx="1.4"/>';
        default:
          return '<polygon points="1.5,-9.5 -4.8,0.8 0.5,0.8 -1.8,9.5 5,-1.2 -0.3,-1.2"/>';
      }
    case 'repair_tools':
      switch (idx % 4) {
        case 0:
          return '<path d="M-6.5 6.5 L3.5 -3.5 M2 -5.5 A4.2 4.2 0 1 1 6.5 -1"/>';
        case 1:
          return '<rect x="-7.2" y="-8" width="14.4" height="5" rx="1.2"/><path d="M0 -3 V10"/>';
        case 2:
          return '<circle cx="0" cy="0" r="5.5"/><circle cx="0" cy="0" r="2.2"/><path d="M0 -6 V-9 M0 6 V9 M-6 0 H-9 M6 0 H9 M-4.2 -4.2 L-6.4 -6.4 M4.2 4.2 L6.4 6.4"/>';
        default:
          return '<rect x="-5.5" y="-8.8" width="11" height="7" rx="1.4"/><path d="M0 -1.8 V9.5"/>';
      }
    case 'auto':
      switch (idx % 4) {
        case 0:
          return '<polygon points="-10,4 -10,-0.5 -6,-6 5,-6 9.5,-0.5 10,4"/><circle cx="-5.5" cy="5" r="2.4"/><circle cx="5.5" cy="5" r="2.4"/>';
        case 1:
          return '<circle cx="0" cy="0" r="8"/><circle cx="0" cy="0" r="2.4"/><path d="M-7.5 0 H-2.4 M2.4 0 H7.5 M0 2.4 V7.5"/>';
        case 2:
          return '<path d="M0 -9.5 Q8 1.5 0 9.5 Q-8 1.5 0 -9.5"/>';
        default:
          return '<path d="M-7.2 4.2 A8.4 8.4 0 1 1 7.2 4.2 M0 0 L4.5 -4"/>';
      }
    case 'clothing':
      switch (idx % 4) {
        case 0:
          return '<path d="M-4.2 -8 L-10 -4.2 L-7.4 0 L-5.2 -1.2 V8.8 H5.2 V-1.2 L7.4 0 L10 -4.2 L4.2 -8 Q0 -5.2 -4.2 -8 Z"/>';
        case 1:
          return '<polygon points="0,-5 -9.5,4.2 9.5,4.2"/><path d="M-2.2 -7.2 A2.3 2.3 0 1 1 2 -6"/>';
        case 2:
          return '<rect x="-7.2" y="-2.2" width="14.4" height="10.4" rx="2"/><path d="M-4 -2.2 A4 4 0 0 1 4 -2.2"/>';
        default:
          return '<path d="M-7.2 0.5 A7.2 6.5 0 0 1 7.2 0.5 Z M-8 0.5 H10.5"/>';
      }
    case 'furniture_home':
      switch (idx % 4) {
        case 0:
          return '<rect x="-8.4" y="-6.4" width="16.8" height="10.4" rx="2.5"/><path d="M-5.8 4 V7.5 M5.8 4 V7.5 M-8 0 H8"/>';
        case 1:
          return '<polygon points="-5,0.8 5,0.8 3.5,9 -3.5,9"/><path d="M0 0.8 V-8.4 M0 -2 L-5.2 -6.4 M0 -2 L5.2 -6.4"/>';
        case 2:
          return '<polygon points="-4.6,-8 4.6,-8 7.5,-0.8 -7.5,-0.8"/><path d="M0 -0.8 V8 M-4 8 H4"/>';
        default:
          return '<circle cx="-2.4" cy="0" r="6.4"/><path d="M4 0 H10.5"/>';
      }
    case 'cleaning':
      switch (idx % 4) {
        case 0:
          return '<circle cx="-2.6" cy="-1.8" r="4.8"/><circle cx="4.8" cy="3.8" r="3.2"/><circle cx="4.2" cy="-5" r="2"/>';
        case 1:
          return '<path d="M0 -9 Q1.2 -1.2 9 0 Q1.2 1.2 0 9 Q-1.2 1.2 -9 0 Q-1.2 -1.2 0 -9 Z"/>';
        case 2:
          return '<rect x="-4.4" y="-2.2" width="8.8" height="10.8" rx="2.2"/><path d="M0 -2.2 V-7.2 M-2.5 -7.2 H5.2"/>';
        default:
          return '<polygon points="-6.5,-2.2 6.5,-2.2 4.6,8.4 -4.6,8.4"/><path d="M-4.8 -2.2 A4.8 3.5 0 0 1 4.8 -2.2"/>';
      }
    case 'lifestyle_pets':
    default:
      switch (idx % 4) {
        case 0:
          return '<circle cx="0" cy="2.8" r="3.4"/><circle cx="-4.8" cy="-1.8" r="1.4"/><circle cx="-1.8" cy="-4.8" r="1.4"/><circle cx="2" cy="-4.8" r="1.4"/><circle cx="4.8" cy="-1.8" r="1.4"/>';
        case 1:
          return '<rect x="-6.6" y="-3.2" width="13.2" height="11.2" rx="1.4"/><path d="M0 -3.2 V8 M-6.6 1.6 H6.6"/><circle cx="-2.2" cy="-5.4" r="2"/><circle cx="2.2" cy="-5.4" r="2"/>';
        case 2:
          return '<path d="M0 8 C-10.5 1.5 -8 -8.2 0 -2.5 C8 -8.2 10.5 1.5 0 8 Z"/>';
        default:
          return '<rect x="-7" y="-7.2" width="14" height="14.4" rx="1.5"/><path d="M0 -7 V7"/>';
      }
  }
}

const PATTERN_TILE_CACHE = new Map<string, string>();

function buildDoodleDataUrl(
  group: DoodlePatternGroup,
  variant: number,
  strokeCss: string
): string {
  const cacheKey = `${group}|${variant}|${strokeCss}`;
  const cached = PATTERN_TILE_CACHE.get(cacheKey);
  if (cached) return cached;

  const placements = [
    { x: 20, y: 20, rot: -18, idx: variant % 4 },
    { x: 76, y: 22, rot: 14, idx: (variant + 1) % 4 },
    { x: 48, y: 66, rot: -10, idx: (variant + 2) % 4 },
    { x: 104, y: 68, rot: 22, idx: (variant + 3) % 4 },
  ];

  const shapes = placements
    .map(
      (p) =>
        `<g transform="translate(${p.x} ${p.y}) rotate(${p.rot})">${doodleSvgInner(
          group,
          p.idx
        )}</g>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="92" viewBox="0 0 112 92"><g fill="none" stroke="${strokeCss}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${shapes}</g></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  PATTERN_TILE_CACHE.set(cacheKey, url);
  return url;
}

const CORNER_POSITIONS: Array<[string, string, string, string]> = [
  ['8% 12%', '92% 15%', '15% 90%', '88% 88%'],
  ['85% 10%', '12% 25%', '90% 88%', '18% 85%'],
  ['22% 5%', '95% 45%', '5% 65%', '72% 95%'],
  ['50% 8%', '94% 80%', '6% 82%', '52% 55%'],
];

export interface TelegramCardStyleOptions {
  showDoodles?: boolean;
  subtleWeb?: boolean;
}

export function getCategoryTelegramStyle(
  icon: string | null | undefined,
  categoryId: string,
  isDark: boolean,
  isMuted: boolean,
  options?: TelegramCardStyleOptions
): React.CSSProperties {
  const v = resolveIconVisual(icon, categoryId);
  const satPct = Math.round(v.saturation * 100);
  const showDoodles = options?.showDoodles ?? true;
  const subtleWeb = options?.subtleWeb ?? false;

  const mutedAlphaScale = isMuted ? 0.42 : 1;
  const webStrength = subtleWeb ? 0.68 : 1;

  const baseColor = isDark
    ? isMuted
      ? '#151619'
      : `hsl(${normHue(v.h1)}, ${Math.round(satPct * 0.52)}%, 13%)`
    : isMuted
      ? '#f4f4f5'
      : `hsl(${normHue(v.h1)}, ${Math.round(satPct * 0.48)}%, ${subtleWeb ? 97 : 95}%)`;

  const borderColor = isDark
    ? `hsla(${normHue(v.h2)}, ${Math.round(satPct * 0.58)}%, 34%, ${isMuted ? 0.45 : 1})`
    : `hsla(${normHue(v.h2)}, ${Math.round(satPct * 0.55)}%, ${subtleWeb ? 85 : 80}%, ${isMuted ? 0.5 : 1})`;

  const corners = CORNER_POSITIONS[v.variant % 4];
  const hues = [v.h1, v.h2, v.h3, v.h4];
  const meshSats = [0.95, 0.9, 0.88, 0.82];
  const lightLights = subtleWeb ? [93, 92, 91, 94] : [89, 88, 87, 90];
  const darkLights = [21, 19, 20, 22];
  const alphas = [0.78, 0.72, 0.7, 0.66];

  const radialLayers = corners.map((pos, idx) => {
    const hue = normHue(hues[idx]);
    const s = Math.round(
      Math.min(82, satPct * meshSats[idx] * (isDark ? 1.15 : 1) * (isMuted ? 0.5 : 1))
    );
    const l = isDark ? darkLights[idx] : lightLights[idx];
    const a = (alphas[idx] * mutedAlphaScale * webStrength).toFixed(2);
    return `radial-gradient(circle at ${pos}, hsla(${hue}, ${s}%, ${l}%, ${a}) 0%, hsla(${hue}, ${s}%, ${l}%, 0) 76%)`;
  });

  const layers: string[] = [];
  const repeats: string[] = [];
  const sizes: string[] = [];

  if (showDoodles) {
    const doodleAlpha = isMuted
      ? 0.042
      : isDark
        ? 0.095
        : subtleWeb
          ? 0.068
          : 0.088;
    const doodleStroke = isDark
      ? `hsla(${normHue(v.h2)}, ${Math.round(satPct * 0.5)}%, 84%, ${doodleAlpha})`
      : `hsla(${normHue(v.h3)}, ${Math.round(satPct * 0.65)}%, 28%, ${doodleAlpha})`;
    layers.push(buildDoodleDataUrl(v.patternGroup, v.variant, doodleStroke));
    repeats.push('repeat');
    sizes.push('112px 92px');
  }

  radialLayers.forEach((grad) => {
    layers.push(grad);
    repeats.push('no-repeat');
    sizes.push('100% 100%');
  });

  return {
    backgroundColor: baseColor,
    backgroundImage: layers.join(', '),
    backgroundRepeat: repeats.join(', '),
    backgroundSize: sizes.join(', '),
    borderColor,
  };
}
