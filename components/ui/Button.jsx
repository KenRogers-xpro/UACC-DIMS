import React from 'react';

export default function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 rounded bg-uacc-gold text-black ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
