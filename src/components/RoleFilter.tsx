import { useId } from 'react';
import type { RoleFilter as Filter } from '../content/types';
import styles from './RoleFilter.module.css';

const OPTIONS: readonly { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'software-development', label: 'Software development' },
  { value: 'project-management', label: 'Project management' },
];

type RoleFilterProps = {
  value: Filter;
  onChange: (value: Filter) => void;
  // Off until the page runs script: without it the controls cannot work, and they keep their
  // place so nothing shifts.
  disabled: boolean;
};

// Radios from 640 px, a select below (board-b.html). Both show the same choice.
export function RoleFilter({ value, onChange, disabled }: RoleFilterProps) {
  const name = useId();
  const selectId = useId();
  return (
    <>
      <fieldset className={styles.radios} disabled={disabled}>
        <legend className={styles.legend}>Show</legend>
        {OPTIONS.map((o) => (
          <label key={o.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </fieldset>
      <div className={styles.select}>
        <label htmlFor={selectId}>
          <b>Show</b>
        </label>
        <select
          id={selectId}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const picked = OPTIONS.find((o) => o.value === e.target.value);
            if (picked) onChange(picked.value);
          }}
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
