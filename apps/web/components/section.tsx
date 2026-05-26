import { cn } from "@/lib/utils";

type SectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Section({ eyebrow, title, description, children, className }: SectionProps) {
  return (
    <section className={cn("px-4 py-20 sm:px-6 lg:px-8", className)}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-lagoon">{eyebrow}</p> : null}
          <h2 className="font-display text-4xl font-semibold tracking-normal text-ink dark:text-white md:text-6xl">{title}</h2>
          {description ? <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{description}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
