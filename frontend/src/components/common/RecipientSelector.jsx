import React from 'react';

const RecipientSelector = ({ names = [], value, onChange }) => {
  return (
    <select className="w-full border rounded px-2 py-2"
            value={value || ''}
            onChange={e => onChange(e.target.value)}>
      <option value="">Select a person</option>
      {names.filter(Boolean).map(n => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  );
};

export default RecipientSelector;
