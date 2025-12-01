import React from 'react';

const MultiRecipientSelector = ({ names = [], selected = [], onChange }) => {
  const toggle = (name) => {
    if (selected.includes(name)) onChange(selected.filter(n => n !== name));
    else onChange([...selected, name]);
  };
  return (
    <div className="border rounded p-2 max-h-64 overflow-auto">
      {names.filter(Boolean).map(n => (
        <label key={n} className="flex items-center gap-2 py-1 text-sm">
          <input type="checkbox" checked={selected.includes(n)} onChange={() => toggle(n)} />
          <span>{n}</span>
        </label>
      ))}
    </div>
  );
};

export default MultiRecipientSelector;
