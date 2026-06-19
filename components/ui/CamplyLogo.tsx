import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

type CamplyLogoProps = {
  variant?: "complete" | "icon";
  className?: string;
  priority?: boolean;
};

export function CamplyLogo({
  variant = "complete",
  className,
  priority = false,
}: CamplyLogoProps) {
  if (variant === "icon") {
    return (
      <Image
        src={BRAND.icon}
        alt={BRAND.name}
        width={48}
        height={48}
        className={cn("rounded-xl", className)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={BRAND.logo}
      alt={BRAND.name}
      width={320}
      height={141}
      className={cn("h-auto w-auto object-contain", className)}
      priority={priority}
    />
  );
}
