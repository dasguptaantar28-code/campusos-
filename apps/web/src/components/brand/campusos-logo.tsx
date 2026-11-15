import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CampusLogo({
  href = '/',
  size = 'md',
  darkSurface = false,
  className,
}: {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  darkSurface?: boolean;
  subtitle?: string;
  className?: string;
}) {
  const widthClass = size === 'lg' ? 'w-44 h-14' : size === 'sm' ? 'w-28 h-9' : 'w-36 h-11';

  return (
    <Link href={href} className={cn('flex items-center gap-2 group', className)}>
      <div className={cn('relative rounded-lg transition-all', widthClass, darkSurface && 'brightness-0 invert opacity-95')}>
        <Image
          src="/logo.png"
          alt="MIC Smart Campus"
          fill
          className="object-contain dark:brightness-110"
          priority
        />
      </div>
    </Link>
  );
}
