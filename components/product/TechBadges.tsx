type TechBadgesProps = {
  tech: string[];
};

export function TechBadges({ tech }: TechBadgesProps) {
  if (tech.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {tech.map((item) => (
        <li
          key={item}
          className="border border-navy/20 px-2 py-1 font-mono text-xs uppercase tracking-wide text-navy"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
