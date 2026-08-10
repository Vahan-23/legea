type StaticPageProps = {
  title: string;
  lead: string;
  body: string;
};

export function StaticPage({ title, lead, body }: StaticPageProps) {
  const paragraphs = body.split("\n").filter(Boolean);

  return (
    <div className="hex-bg-muted min-h-screen">
      <header className="border-b border-blue bg-white">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-display-sm text-navy">{title}</h1>
          <p className="mt-4 text-lg text-muted">{lead}</p>
        </div>
        <div className="section-rule" />
      </header>
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-12 text-graphite">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
