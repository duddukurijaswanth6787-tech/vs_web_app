import React from 'react';

interface Props {
  title: string;
  children: React.ReactNode;
}

export function MobileScrollSection({ title, children }: Props) {
  return (
    <section className="w-full py-2.5 sm:py-6 lg:hidden">
      <h2 className="text-lg font-bold font-serif text-neutral-900 tracking-tight mb-2.5 px-4">
        {title}
      </h2>
      <div className="w-full flex overflow-x-auto gap-3.5 px-4 pb-2.5 snap-x snap-mandatory scrollbar-none">
        {children}
      </div>
    </section>
  );
}
