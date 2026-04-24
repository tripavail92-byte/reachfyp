import type { CSSProperties, HTMLAttributes, PropsWithChildren } from "react";

type GlassPanelProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    style?: CSSProperties;
  }
>;

const baseStyle: CSSProperties = {
  background: "var(--app-surface)",
  border: "1px solid var(--app-border)",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 18px 50px var(--app-shadow)",
  backdropFilter: "blur(12px)",
};

export function GlassPanel({ children, style, ...props }: GlassPanelProps) {
  return (
    <div {...props} style={{ ...baseStyle, ...style }}>
      {children}
    </div>
  );
}
