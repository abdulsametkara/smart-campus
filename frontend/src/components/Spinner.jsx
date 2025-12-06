import React from 'react';

const Spinner = ({ size = 'default', className = '' }) => {
  const sizeClass = size === 'lg' ? 'spinner-lg' : '';
  return <div className={`spinner ${sizeClass} ${className}`}></div>;
};

export default Spinner;
