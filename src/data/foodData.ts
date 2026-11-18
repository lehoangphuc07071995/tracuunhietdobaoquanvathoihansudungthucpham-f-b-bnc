import type { FoodItem } from '../types';
import { SHE_FOOD_ITEMS, SHE_GROUPS } from './sheRegulationData';

export const getItemCode = (item: Pick<FoodItem, 'a' | 'n'>): string =>
  `${item.a}-${String(item.n).padStart(2, '0')}`;

export const FOOD_ITEMS: FoodItem[] = SHE_FOOD_ITEMS.map((item) => {
  const numMatch = item.code.match(/(\d+)$/);
  const n = numMatch ? Number(numMatch[1]) : 1;
  return {
    a: 'SHE',
    g: item.group,
    n,
    order: n,
    name: item.name,
    room: item.room,
    cool: item.cool,
    freeze: item.freeze,
    note: item.note,
    flag: '',
    keywords: item.keywords,
  };
});

export const ALL_GROUPS: string[] = [...SHE_GROUPS];

export const isEmptyCell = (val?: string | null): boolean => {
  if (!val) return true;
  const trimmed = val.trim();
  return !trimmed || trimmed === '—' || trimmed === '-';
};

export const isNoFreezeCell = (val?: string | null): boolean => {
  if (!val) return false;
  return val.trim().toLowerCase().includes('không cấp đông');
};

export const isDisallowedCell = (val?: string | null): boolean => {
  if (!val) return true;
  const lower = val.trim().toLowerCase();
  return (
    !lower ||
    lower === '—' ||
    lower === '-' ||
    lower === 'không' ||
    lower.startsWith('không cấp đông')
  );
};

export const hasCellValue = (val?: string | null): boolean =>
  !isDisallowedCell(val);

export const hasUseToday = (item: Pick<FoodItem, 'room' | 'cool'>): boolean => {
  const r = item.room.toLowerCase();
  const c = item.cool.toLowerCase();
  return (
    r.includes('trong ngày') ||
    c.includes('trong ngày') ||
    /\d+\s*giờ/.test(r) ||
    /\d+\s*giờ/.test(c)
  );
};
