'use client';

interface SelectAllToggleProps {
  targetName: string;
}

export function SelectAllToggle({ targetName }: SelectAllToggleProps) {
  return (
    <input
      type="checkbox"
      id="select-all"
      onChange={(e) => {
        const checkboxes = document.querySelectorAll<HTMLInputElement>(
          `input[name="${targetName}"]`,
        );
        checkboxes.forEach((cb) => {
          cb.checked = (e.target as HTMLInputElement).checked;
        });
      }}
    />
  );
}
