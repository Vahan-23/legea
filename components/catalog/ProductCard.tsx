import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ColorDots } from "@/components/catalog/ColorDots";
import { Link } from "@/i18n/navigation";
import { productName } from "@/types/product";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const name = productName(product, locale);
  const sizeFrom = product.sizes[0];
  const sizeTo = product.sizes[product.sizes.length - 1];

  return (
    <Link
      href={`/catalog/${product.id}`}
      className="group flex flex-col border border-transparent bg-white transition-all hover:-translate-y-1 hover:border-blue"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-off-white">
        <Image
          src="/images/product-placeholder.svg"
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="font-mono text-lg tracking-tight text-navy">
          {product.id}
        </p>
        <h3 className="font-sans text-base font-medium normal-case tracking-normal text-graphite">
          {name}
        </h3>

        <div className="space-y-1 text-sm text-muted">
          <p>
            {product.gsm != null
              ? t("gsmValue", { gsm: product.gsm })
              : t("gsmUnknown")}
          </p>
          {sizeFrom && sizeTo ? (
            <p className="font-mono text-xs">
              {t("sizeRange", { from: sizeFrom, to: sizeTo })}
            </p>
          ) : null}
        </div>

        <ColorDots colorways={product.colorways} />

        {product.tech.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-1.5">
            {product.tech.slice(0, 4).map((tech) => (
              <li
                key={tech}
                className="border border-navy/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-navy"
              >
                {tech}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Link>
  );
}
