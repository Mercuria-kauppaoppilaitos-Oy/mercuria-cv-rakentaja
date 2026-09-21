import { useState } from 'react';

const months = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];

export function getMonthYears(selectedYear = '', currentYear = new Date().getFullYear()) {
  const years = Array.from({ length: Math.max(0, currentYear + 6 - 1990) }, (_, index) => String(1990 + index));
  if (selectedYear && !years.includes(selectedYear)) years.push(selectedYear);
  return years.sort((left, right) => Number(right) - Number(left));
}

/** Native selects retain keyboard and screen-reader support without a calendar. */
export function MonthPicker({ id, label, value, onChange, disabled = false }: {
  id: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean;
}) {
  const [partial, setPartial] = useState({ year: '', month: '' });
  const [year, month] = value ? value.split('-') : [partial.year, partial.month];
  const years = getMonthYears(year);
  function change(nextYear: string, nextMonth: string) {
    setPartial({ year: nextYear, month: nextMonth });
    onChange(nextYear && nextMonth ? `${nextYear}-${nextMonth}` : '');
  }
  return <div className="field month-field">
    <label htmlFor={id}>{label}</label>
    <div className="month-picker">
      <select id={id} value={month} disabled={disabled} onChange={(event) => change(year ?? '', event.target.value)}>
        <option value="">Kuukausi</option>
        {months.map((name, index) => <option key={name} value={String(index + 1).padStart(2, '0')}>{name}</option>)}
      </select>
      <select id={`${id}-year`} aria-label={`${label}: vuosi`} value={year} disabled={disabled} onChange={(event) => change(event.target.value, month ?? '')}>
        <option value="">Vuosi</option>
        {years.map((item) => <option key={item}>{item}</option>)}
      </select>
      <button type="button" aria-label={`Tyhjennä ${label.toLocaleLowerCase('fi')}`} disabled={disabled || (!year && !month)} onClick={() => change('', '')}>×</button>
    </div>
  </div>;
}
