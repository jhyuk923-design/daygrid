import React from 'react';
import { getCategory } from '../constants.js';

export default function CategoryTag({ category, small = false }) {
  const cat = getCategory(category);
  return (
    <span
      className={`category-tag${small ? ' category-tag-sm' : ''}`}
      style={{ backgroundColor: `${cat.color}1a`, color: cat.color, borderColor: `${cat.color}55` }}
    >
      {cat.label}
    </span>
  );
}
