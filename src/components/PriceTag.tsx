import type { Product } from "@/data/menu";
import { discountPercent } from "@/lib/campaign";
import { formatNaira } from "@/lib/format";

/**
 * Price with an optional crossed-out original value and discount pill.
 * `showPill={false}` keeps the price + strike but hides the percentage badge
 * (used where the badge is anchored over the photo instead).
 */
export function PriceTag({
  product,
  className = "",
  showPill = true,
}: {
  product: Product;
  className?: string;
  showPill?: boolean;
}) {
  const pct = product.originalPrice ? discountPercent(product.price, product.originalPrice) : 0;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      {product.meals && <span className="text-xs font-medium opacity-70">From </span>}
      <span className="whitespace-nowrap">{formatNaira(product.price)}</span>
      {pct > 0 && (
        <>
          <s className="whitespace-nowrap text-[0.8em] font-medium opacity-60">{formatNaira(product.originalPrice!)}</s>
          {showPill && (
            <span className="whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
              {pct}% OFF
            </span>
          )}
        </>
      )}
    </span>
  );
}

