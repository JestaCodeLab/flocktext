export type DateRangePreset = 'all_time' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export interface DateRangeParams {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

const RANGE_PRESET_LABEL: Record<DateRangePreset, string> = {
  all_time: 'All time',
  this_week: 'This week',
  this_month: 'This month',
  last_month: 'Last month',
  custom: 'Custom range',
};

export function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Display label for the filter dropdown trigger and any subtitle/sub-line that
// echoes the current selection, e.g. "This month" or "Jul 1 – Jul 15".
export function rangeLabel(range: DateRangeParams) {
  if (range.preset === 'custom' && range.startDate && range.endDate) {
    return `${formatDateShort(range.startDate)} – ${formatDateShort(range.endDate)}`;
  }
  return RANGE_PRESET_LABEL[range.preset];
}
