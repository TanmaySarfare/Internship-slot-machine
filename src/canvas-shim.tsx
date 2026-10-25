import type { CSSProperties, ReactNode } from "react";
export { useEffect, useMemo, useRef, useState } from "react";
export type { CSSProperties } from "react";
export type StackProps = { children?: ReactNode };

export function Link({ children, href, style }: { children?: ReactNode; href: string; style?: CSSProperties }) {
  return (
    <a href={href} style={style} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
