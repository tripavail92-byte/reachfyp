"use client";

import Image from "next/image";
import type { PointerEvent, ReactNode } from "react";

type InteractiveImageFrameProps = {
  alt: string;
  src: string;
  sizes: string;
  priority?: boolean;
  containerClassName?: string;
  imageClassName?: string;
  children?: ReactNode;
};

function clampPercentage(value: number) {
  return Math.max(16, Math.min(84, value));
}

export function InteractiveImageFrame({
  alt,
  src,
  sizes,
  priority = false,
  containerClassName,
  imageClassName,
  children,
}: InteractiveImageFrameProps) {
  function updateFocus(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clampPercentage(((event.clientX - rect.left) / rect.width) * 100);
    const y = clampPercentage(((event.clientY - rect.top) / rect.height) * 100);

    event.currentTarget.style.setProperty("--image-focus-x", `${x}%`);
    event.currentTarget.style.setProperty("--image-focus-y", `${y}%`);
  }

  function resetFocus(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--image-focus-x", "50%");
    event.currentTarget.style.setProperty("--image-focus-y", "28%");
  }

  return (
    <div
      className={containerClassName ? `interactive-image-frame ${containerClassName}` : "interactive-image-frame"}
      onPointerLeave={resetFocus}
      onPointerMove={updateFocus}
    >
      <Image
        alt={alt}
        className={imageClassName ? `interactive-image-frame__image ${imageClassName}` : "interactive-image-frame__image"}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
      />
      {children}
    </div>
  );
}