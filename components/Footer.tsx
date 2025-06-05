
import React from 'react';
import { FOOTER_TEXT } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 dark:bg-neutral-900 text-center p-4 text-sm text-gray-600 dark:text-neutral-500 border-t border-gray-200 dark:border-neutral-800">
      <p>{FOOTER_TEXT}</p>
    </footer>
  );
};

export default Footer;