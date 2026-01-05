'use client';

import { Check } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { useAppName } from '@/providers/config-provider';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  linkToHome?: boolean;
}

const sizes = {
  sm: { box: 'w-7 h-7 rounded-lg', icon: 'w-4 h-4', text: 'text-sm' },
  md: { box: 'w-8 h-8 rounded-xl', icon: 'w-5 h-5', text: 'text-lg' },
  lg: { box: 'w-10 h-10 rounded-xl', icon: 'w-6 h-6', text: 'text-xl' },
  xl: { box: 'w-10 h-10 rounded-xl', icon: 'w-6 h-6', text: 'text-2xl' },
};

export function AppLogo({ size = 'md', showText = true, linkToHome = false }: AppLogoProps) {
  const appName = useAppName();
  const s = sizes[size];

  const content = (
    <div className="flex items-center gap-2.5 group">
      <div className={`${s.box} bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow duration-300`}>
        <Check className={`${s.icon} text-white`} strokeWidth={3} />
      </div>
      {showText && (
        <span className={`${s.text} font-bold text-gray-900 dark:text-white`}>{appName}</span>
      )}
    </div>
  );

  if (linkToHome) {
    return <Link href="/">{content}</Link>;
  }

  return content;
}
