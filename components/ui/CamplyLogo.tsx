import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

type CamplyLogoProps = {
  variant?: "complete" | "icon";
  className?: string;
  priority?: boolean;
  sizes?: string;
};

const COMPLETE_LOGO = { width: 2048, height: 903 } as const;
const ICON_LOGO = { width: 1254, height: 1254 } as const;

export function CamplyLogo({
  variant = "complete",
  className,
  priority = false,
  sizes,
}: CamplyLogoProps) {
  if (variant === "icon") {
    return (
      <Image
        src={BRAND.icon}
        alt={BRAND.name}
        width={ICON_LOGO.width}
        height={ICON_LOGO.height}
        sizes={sizes ?? "(max-width: 640px) 2.25rem, 2.5rem"}
        quality={90}
        className={cn("rounded-xl", className)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={BRAND.logo}
      alt={BRAND.name}
      width={COMPLETE_LOGO.width}
      height={COMPLETE_LOGO.height}
      sizes={sizes ?? "(max-width: 640px) 80vw, 20rem"}
      quality={90}
      className={cn("h-auto w-auto object-contain", className)}
      priority={priority}
    />
  );
}
