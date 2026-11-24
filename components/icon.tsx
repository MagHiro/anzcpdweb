import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function ArrowUpRight({ size = 18, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeWidth="1.5" {...props}><path d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function ArrowRight({ size = 18, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} {...props}><path d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>;
}

export function Phone({ size = 18, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} {...props}><path d="M7.1 3.8 9.2 3c.7-.3 1.5 0 1.8.7l1.1 2.7c.2.6 0 1.2-.5 1.6L10 9.2a14.8 14.8 0 0 0 4.8 4.8l1.2-1.6c.4-.5 1-.7 1.6-.5l2.7 1.1c.7.3 1 1.1.7 1.8l-.8 2.1c-.4 1-1.3 1.6-2.4 1.6C10.2 18.5 5.5 13.8 5.5 6.2c0-1.1.6-2 1.6-2.4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

export function Mail({ size = 18, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} {...props}><rect height="14" rx="2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

export function MenuIcon({ size = 20, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} {...props}><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}

export function CloseIcon({ size = 20, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} {...props}><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}
