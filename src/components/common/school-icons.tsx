import { useId, type ComponentProps } from 'react'

type IconProps = ComponentProps<'svg'>

/**
 * School bus front view (source: Group-5.svg).
 */
export function BusFrontIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 95'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M23.48 74.59H13.19C11.22 74.59 9.61005 72.98 9.61005 71.01V59.87C9.61005 57.89 11.22 56.28 13.19 56.28H23.48C28.52 56.28 32.63 60.39 32.63 65.44C32.63 70.49 28.52 74.59 23.48 74.59ZM14.41 69.79H23.48C25.88 69.79 27.83 67.84 27.83 65.44C27.83 63.04 25.88 61.08 23.48 61.08H14.41V69.79Z" fill="currentColor"/>
      <path d="M86.81 74.59H76.53C71.48 74.59 67.38 70.48 67.38 65.44C67.38 60.4 71.48 56.28 76.53 56.28H86.81C88.79 56.28 90.4 57.89 90.4 59.87V71.01C90.4 72.98 88.79 74.59 86.81 74.59ZM76.53 61.08C74.13 61.08 72.18 63.04 72.18 65.44C72.18 67.84 74.13 69.79 76.53 69.79H85.6V61.08H76.53Z" fill="currentColor"/>
      <path d="M56.02 61.6H43.99C41.8747 61.6 40.16 63.3148 40.16 65.43V65.44C40.16 67.5553 41.8747 69.27 43.99 69.27H56.02C58.1353 69.27 59.85 67.5553 59.85 65.44V65.43C59.85 63.3148 58.1353 61.6 56.02 61.6Z" fill="currentColor"/>
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="40" y="61" width="20" height="9">
      <path d="M56.02 61.6H43.99C41.8747 61.6 40.16 63.3148 40.16 65.43V65.44C40.16 67.5553 41.8747 69.27 43.99 69.27H56.02C58.1353 69.27 59.85 67.5553 59.85 65.44V65.43C59.85 63.3148 58.1353 61.6 56.02 61.6Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <path d="M40.35 61.6H40.16V69.27H40.35V61.6Z" fill="currentColor"/>
      <path d="M40.54 61.6H40.35V69.27H40.54V61.6Z" fill="currentColor"/>
      <path d="M40.73 61.6H40.54V69.27H40.73V61.6Z" fill="currentColor"/>
      <path d="M40.92 61.6H40.73V69.27H40.92V61.6Z" fill="currentColor"/>
      <path d="M41.11 61.6H40.92V69.27H41.11V61.6Z" fill="currentColor"/>
      <path d="M41.31 61.6H41.12V69.27H41.31V61.6Z" fill="currentColor"/>
      <path d="M41.5 61.6H41.31V69.27H41.5V61.6Z" fill="currentColor"/>
      <path d="M41.69 61.6H41.5V69.27H41.69V61.6Z" fill="currentColor"/>
      <path d="M41.88 61.6H41.69V69.27H41.88V61.6Z" fill="currentColor"/>
      <path d="M42.07 61.6H41.88V69.27H42.07V61.6Z" fill="currentColor"/>
      <path d="M42.26 61.6H42.07V69.27H42.26V61.6Z" fill="currentColor"/>
      <path d="M42.45 61.6H42.26V69.27H42.45V61.6Z" fill="currentColor"/>
      <path d="M42.64 61.6H42.45V69.27H42.64V61.6Z" fill="currentColor"/>
      <path d="M42.83 61.6H42.64V69.27H42.83V61.6Z" fill="currentColor"/>
      <path d="M43.03 61.6H42.84V69.27H43.03V61.6Z" fill="currentColor"/>
      <path d="M43.22 61.6H43.03V69.27H43.22V61.6Z" fill="currentColor"/>
      <path d="M43.41 61.6H43.22V69.27H43.41V61.6Z" fill="currentColor"/>
      <path d="M43.6 61.6H43.41V69.27H43.6V61.6Z" fill="currentColor"/>
      <path d="M43.79 61.6H43.6V69.27H43.79V61.6Z" fill="currentColor"/>
      <path d="M43.98 61.6H43.79V69.27H43.98V61.6Z" fill="currentColor"/>
      <path d="M44.17 61.6H43.98V69.27H44.17V61.6Z" fill="currentColor"/>
      <path d="M44.36 61.6H44.17V69.27H44.36V61.6Z" fill="currentColor"/>
      <path d="M44.55 61.6H44.36V69.27H44.55V61.6Z" fill="currentColor"/>
      <path d="M44.75 61.6H44.56V69.27H44.75V61.6Z" fill="currentColor"/>
      <path d="M44.94 61.6H44.75V69.27H44.94V61.6Z" fill="currentColor"/>
      <path d="M45.13 61.6H44.94V69.27H45.13V61.6Z" fill="currentColor"/>
      <path d="M45.32 61.6H45.13V69.27H45.32V61.6Z" fill="currentColor"/>
      <path d="M45.51 61.6H45.32V69.27H45.51V61.6Z" fill="currentColor"/>
      <path d="M45.7 61.6H45.51V69.27H45.7V61.6Z" fill="currentColor"/>
      <path d="M45.89 61.6H45.7V69.27H45.89V61.6Z" fill="currentColor"/>
      <path d="M46.08 61.6H45.89V69.27H46.08V61.6Z" fill="currentColor"/>
      <path d="M46.27 61.6H46.08V69.27H46.27V61.6Z" fill="currentColor"/>
      <path d="M46.47 61.6H46.28V69.27H46.47V61.6Z" fill="currentColor"/>
      <path d="M46.66 61.6H46.47V69.27H46.66V61.6Z" fill="currentColor"/>
      <path d="M46.85 61.6H46.66V69.27H46.85V61.6Z" fill="currentColor"/>
      <path d="M47.04 61.6H46.85V69.27H47.04V61.6Z" fill="currentColor"/>
      <path d="M47.23 61.6H47.04V69.27H47.23V61.6Z" fill="currentColor"/>
      <path d="M47.42 61.6H47.23V69.27H47.42V61.6Z" fill="currentColor"/>
      <path d="M47.61 61.6H47.42V69.27H47.61V61.6Z" fill="currentColor"/>
      <path d="M47.8 61.6H47.61V69.27H47.8V61.6Z" fill="currentColor"/>
      <path d="M48 61.6H47.81V69.27H48V61.6Z" fill="currentColor"/>
      <path d="M48.19 61.6H48V69.27H48.19V61.6Z" fill="currentColor"/>
      <path d="M48.38 61.6H48.19V69.27H48.38V61.6Z" fill="currentColor"/>
      <path d="M48.57 61.6H48.38V69.27H48.57V61.6Z" fill="currentColor"/>
      <path d="M48.76 61.6H48.57V69.27H48.76V61.6Z" fill="currentColor"/>
      <path d="M48.95 61.6H48.76V69.27H48.95V61.6Z" fill="currentColor"/>
      <path d="M49.14 61.6H48.95V69.27H49.14V61.6Z" fill="currentColor"/>
      <path d="M49.33 61.6H49.14V69.27H49.33V61.6Z" fill="currentColor"/>
      <path d="M49.52 61.6H49.33V69.27H49.52V61.6Z" fill="currentColor"/>
      <path d="M49.72 61.6H49.53V69.27H49.72V61.6Z" fill="currentColor"/>
      <path d="M49.91 61.6H49.72V69.27H49.91V61.6Z" fill="currentColor"/>
      <path d="M50.1 61.6H49.91V69.27H50.1V61.6Z" fill="currentColor"/>
      <path d="M50.29 61.6H50.1V69.27H50.29V61.6Z" fill="currentColor"/>
      <path d="M50.48 61.6H50.29V69.27H50.48V61.6Z" fill="currentColor"/>
      <path d="M50.67 61.6H50.48V69.27H50.67V61.6Z" fill="currentColor"/>
      <path d="M50.86 61.6H50.67V69.27H50.86V61.6Z" fill="currentColor"/>
      <path d="M51.05 61.6H50.86V69.27H51.05V61.6Z" fill="currentColor"/>
      <path d="M51.24 61.6H51.05V69.27H51.24V61.6Z" fill="currentColor"/>
      <path d="M51.44 61.6H51.25V69.27H51.44V61.6Z" fill="currentColor"/>
      <path d="M51.63 61.6H51.44V69.27H51.63V61.6Z" fill="currentColor"/>
      <path d="M51.82 61.6H51.63V69.27H51.82V61.6Z" fill="currentColor"/>
      <path d="M52.01 61.6H51.82V69.27H52.01V61.6Z" fill="currentColor"/>
      <path d="M52.2 61.6H52.01V69.27H52.2V61.6Z" fill="currentColor"/>
      <path d="M52.39 61.6H52.2V69.27H52.39V61.6Z" fill="currentColor"/>
      <path d="M52.58 61.6H52.39V69.27H52.58V61.6Z" fill="currentColor"/>
      <path d="M52.77 61.6H52.58V69.27H52.77V61.6Z" fill="currentColor"/>
      <path d="M52.96 61.6H52.77V69.27H52.96V61.6Z" fill="currentColor"/>
      <path d="M53.16 61.6H52.97V69.27H53.16V61.6Z" fill="currentColor"/>
      <path d="M53.35 61.6H53.16V69.27H53.35V61.6Z" fill="currentColor"/>
      <path d="M53.54 61.6H53.35V69.27H53.54V61.6Z" fill="currentColor"/>
      <path d="M53.73 61.6H53.54V69.27H53.73V61.6Z" fill="currentColor"/>
      <path d="M53.92 61.6H53.73V69.27H53.92V61.6Z" fill="currentColor"/>
      <path d="M54.11 61.6H53.92V69.27H54.11V61.6Z" fill="currentColor"/>
      <path d="M54.3 61.6H54.11V69.27H54.3V61.6Z" fill="currentColor"/>
      <path d="M54.49 61.6H54.3V69.27H54.49V61.6Z" fill="currentColor"/>
      <path d="M54.69 61.6H54.5V69.27H54.69V61.6Z" fill="currentColor"/>
      <path d="M54.88 61.6H54.69V69.27H54.88V61.6Z" fill="currentColor"/>
      <path d="M55.07 61.6H54.88V69.27H55.07V61.6Z" fill="currentColor"/>
      <path d="M55.26 61.6H55.07V69.27H55.26V61.6Z" fill="currentColor"/>
      <path d="M55.45 61.6H55.26V69.27H55.45V61.6Z" fill="currentColor"/>
      <path d="M55.64 61.6H55.45V69.27H55.64V61.6Z" fill="currentColor"/>
      <path d="M55.83 61.6H55.64V69.27H55.83V61.6Z" fill="currentColor"/>
      <path d="M56.02 61.6H55.83V69.27H56.02V61.6Z" fill="currentColor"/>
      <path d="M56.21 61.6H56.02V69.27H56.21V61.6Z" fill="currentColor"/>
      <path d="M56.41 61.6H56.22V69.27H56.41V61.6Z" fill="currentColor"/>
      <path d="M56.6 61.6H56.41V69.27H56.6V61.6Z" fill="currentColor"/>
      <path d="M56.79 61.6H56.6V69.27H56.79V61.6Z" fill="currentColor"/>
      <path d="M56.98 61.6H56.79V69.27H56.98V61.6Z" fill="currentColor"/>
      <path d="M57.17 61.6H56.98V69.27H57.17V61.6Z" fill="currentColor"/>
      <path d="M57.36 61.6H57.17V69.27H57.36V61.6Z" fill="currentColor"/>
      <path d="M57.55 61.6H57.36V69.27H57.55V61.6Z" fill="currentColor"/>
      <path d="M57.74 61.6H57.55V69.27H57.74V61.6Z" fill="currentColor"/>
      <path d="M57.93 61.6H57.74V69.27H57.93V61.6Z" fill="currentColor"/>
      <path d="M58.13 61.6H57.94V69.27H58.13V61.6Z" fill="currentColor"/>
      <path d="M58.32 61.6H58.13V69.27H58.32V61.6Z" fill="currentColor"/>
      <path d="M58.51 61.6H58.32V69.27H58.51V61.6Z" fill="currentColor"/>
      <path d="M58.7 61.6H58.51V69.27H58.7V61.6Z" fill="currentColor"/>
      <path d="M58.89 61.6H58.7V69.27H58.89V61.6Z" fill="currentColor"/>
      <path d="M59.08 61.6H58.89V69.27H59.08V61.6Z" fill="currentColor"/>
      <path d="M59.27 61.6H59.08V69.27H59.27V61.6Z" fill="currentColor"/>
      <path d="M59.46 61.6H59.27V69.27H59.46V61.6Z" fill="currentColor"/>
      <path d="M59.65 61.6H59.46V69.27H59.65V61.6Z" fill="currentColor"/>
      <path d="M59.85 61.6H59.66V69.27H59.85V61.6Z" fill="currentColor"/>
      </g>
      <path d="M50.17 52.94C34.88 52.94 20.47 49.39 10.64 43.2L13.2 39.13C22.29 44.86 35.76 48.14 50.17 48.14C64.58 48.14 78.24 44.81 87.33 39L89.92 43.05C80.08 49.34 65.59 52.94 50.17 52.94Z" fill="currentColor"/>
      <path d="M17.55 79.59H33.52V89.58C33.52 92.54 31.12 94.95 28.15 94.95H22.92C19.96 94.95 17.55 92.54 17.55 89.58V79.59Z" fill="currentColor"/>
      <mask id={`${id}-1`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="17" y="79" width="17" height="16">
      <path d="M17.55 79.59H33.52V89.58C33.52 92.54 31.12 94.95 28.15 94.95H22.92C19.96 94.95 17.55 92.54 17.55 89.58V79.59Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-1)`}>
      <path d="M17.71 79.59H17.55V94.95H17.71V79.59Z" fill="currentColor"/>
      <path d="M17.86 79.59H17.7V94.95H17.86V79.59Z" fill="currentColor"/>
      <path d="M18.02 79.59H17.86V94.95H18.02V79.59Z" fill="currentColor"/>
      <path d="M18.17 79.59H18.01V94.95H18.17V79.59Z" fill="currentColor"/>
      <path d="M18.33 79.59H18.17V94.95H18.33V79.59Z" fill="currentColor"/>
      <path d="M18.48 79.59H18.32V94.95H18.48V79.59Z" fill="currentColor"/>
      <path d="M18.64 79.59H18.48V94.95H18.64V79.59Z" fill="currentColor"/>
      <path d="M18.79 79.59H18.63V94.95H18.79V79.59Z" fill="currentColor"/>
      <path d="M18.95 79.59H18.79V94.95H18.95V79.59Z" fill="currentColor"/>
      <path d="M19.1 79.59H18.94V94.95H19.1V79.59Z" fill="currentColor"/>
      <path d="M19.26 79.59H19.1V94.95H19.26V79.59Z" fill="currentColor"/>
      <path d="M19.41 79.59H19.25V94.95H19.41V79.59Z" fill="currentColor"/>
      <path d="M19.57 79.59H19.41V94.95H19.57V79.59Z" fill="currentColor"/>
      <path d="M19.72 79.59H19.56V94.95H19.72V79.59Z" fill="currentColor"/>
      <path d="M19.88 79.59H19.72V94.95H19.88V79.59Z" fill="currentColor"/>
      <path d="M20.03 79.59H19.87V94.95H20.03V79.59Z" fill="currentColor"/>
      <path d="M20.19 79.59H20.03V94.95H20.19V79.59Z" fill="currentColor"/>
      <path d="M20.34 79.59H20.18V94.95H20.34V79.59Z" fill="currentColor"/>
      <path d="M20.5 79.59H20.34V94.95H20.5V79.59Z" fill="currentColor"/>
      <path d="M20.65 79.59H20.49V94.95H20.65V79.59Z" fill="currentColor"/>
      <path d="M20.81 79.59H20.65V94.95H20.81V79.59Z" fill="currentColor"/>
      <path d="M20.97 79.59H20.81V94.95H20.97V79.59Z" fill="currentColor"/>
      <path d="M21.12 79.59H20.96V94.95H21.12V79.59Z" fill="currentColor"/>
      <path d="M21.28 79.59H21.12V94.95H21.28V79.59Z" fill="currentColor"/>
      <path d="M21.43 79.59H21.27V94.95H21.43V79.59Z" fill="currentColor"/>
      <path d="M21.59 79.59H21.43V94.95H21.59V79.59Z" fill="currentColor"/>
      <path d="M21.74 79.59H21.58V94.95H21.74V79.59Z" fill="currentColor"/>
      <path d="M21.9 79.59H21.74V94.95H21.9V79.59Z" fill="currentColor"/>
      <path d="M22.05 79.59H21.89V94.95H22.05V79.59Z" fill="currentColor"/>
      <path d="M22.21 79.59H22.05V94.95H22.21V79.59Z" fill="currentColor"/>
      <path d="M22.36 79.59H22.2V94.95H22.36V79.59Z" fill="currentColor"/>
      <path d="M22.52 79.59H22.36V94.95H22.52V79.59Z" fill="currentColor"/>
      <path d="M22.67 79.59H22.51V94.95H22.67V79.59Z" fill="currentColor"/>
      <path d="M22.83 79.59H22.67V94.95H22.83V79.59Z" fill="currentColor"/>
      <path d="M22.98 79.59H22.82V94.95H22.98V79.59Z" fill="currentColor"/>
      <path d="M23.14 79.59H22.98V94.95H23.14V79.59Z" fill="currentColor"/>
      <path d="M23.29 79.59H23.13V94.95H23.29V79.59Z" fill="currentColor"/>
      <path d="M23.45 79.59H23.29V94.95H23.45V79.59Z" fill="currentColor"/>
      <path d="M23.6 79.59H23.44V94.95H23.6V79.59Z" fill="currentColor"/>
      <path d="M23.76 79.59H23.6V94.95H23.76V79.59Z" fill="currentColor"/>
      <path d="M23.91 79.59H23.75V94.95H23.91V79.59Z" fill="currentColor"/>
      <path d="M24.07 79.59H23.91V94.95H24.07V79.59Z" fill="currentColor"/>
      <path d="M24.22 79.59H24.06V94.95H24.22V79.59Z" fill="currentColor"/>
      <path d="M24.38 79.59H24.22V94.95H24.38V79.59Z" fill="currentColor"/>
      <path d="M24.53 79.59H24.37V94.95H24.53V79.59Z" fill="currentColor"/>
      <path d="M24.69 79.59H24.53V94.95H24.69V79.59Z" fill="currentColor"/>
      <path d="M24.84 79.59H24.68V94.95H24.84V79.59Z" fill="currentColor"/>
      <path d="M25 79.59H24.84V94.95H25V79.59Z" fill="currentColor"/>
      <path d="M25.15 79.59H24.99V94.95H25.15V79.59Z" fill="currentColor"/>
      <path d="M25.31 79.59H25.15V94.95H25.31V79.59Z" fill="currentColor"/>
      <path d="M25.46 79.59H25.3V94.95H25.46V79.59Z" fill="currentColor"/>
      <path d="M25.62 79.59H25.46V94.95H25.62V79.59Z" fill="currentColor"/>
      <path d="M25.77 79.59H25.61V94.95H25.77V79.59Z" fill="currentColor"/>
      <path d="M25.93 79.59H25.77V94.95H25.93V79.59Z" fill="currentColor"/>
      <path d="M26.08 79.59H25.92V94.95H26.08V79.59Z" fill="currentColor"/>
      <path d="M26.24 79.59H26.08V94.95H26.24V79.59Z" fill="currentColor"/>
      <path d="M26.39 79.59H26.23V94.95H26.39V79.59Z" fill="currentColor"/>
      <path d="M26.55 79.59H26.39V94.95H26.55V79.59Z" fill="currentColor"/>
      <path d="M26.7 79.59H26.54V94.95H26.7V79.59Z" fill="currentColor"/>
      <path d="M26.86 79.59H26.7V94.95H26.86V79.59Z" fill="currentColor"/>
      <path d="M27.01 79.59H26.85V94.95H27.01V79.59Z" fill="currentColor"/>
      <path d="M27.17 79.59H27.01V94.95H27.17V79.59Z" fill="currentColor"/>
      <path d="M27.32 79.59H27.16V94.95H27.32V79.59Z" fill="currentColor"/>
      <path d="M27.48 79.59H27.32V94.95H27.48V79.59Z" fill="currentColor"/>
      <path d="M27.63 79.59H27.47V94.95H27.63V79.59Z" fill="currentColor"/>
      <path d="M27.79 79.59H27.63V94.95H27.79V79.59Z" fill="currentColor"/>
      <path d="M27.95 79.59H27.79V94.95H27.95V79.59Z" fill="currentColor"/>
      <path d="M28.1 79.59H27.94V94.95H28.1V79.59Z" fill="currentColor"/>
      <path d="M28.26 79.59H28.1V94.95H28.26V79.59Z" fill="currentColor"/>
      <path d="M28.41 79.59H28.25V94.95H28.41V79.59Z" fill="currentColor"/>
      <path d="M28.57 79.59H28.41V94.95H28.57V79.59Z" fill="currentColor"/>
      <path d="M28.72 79.59H28.56V94.95H28.72V79.59Z" fill="currentColor"/>
      <path d="M28.88 79.59H28.72V94.95H28.88V79.59Z" fill="currentColor"/>
      <path d="M29.03 79.59H28.87V94.95H29.03V79.59Z" fill="currentColor"/>
      <path d="M29.19 79.59H29.03V94.95H29.19V79.59Z" fill="currentColor"/>
      <path d="M29.34 79.59H29.18V94.95H29.34V79.59Z" fill="currentColor"/>
      <path d="M29.5 79.59H29.34V94.95H29.5V79.59Z" fill="currentColor"/>
      <path d="M29.65 79.59H29.49V94.95H29.65V79.59Z" fill="currentColor"/>
      <path d="M29.81 79.59H29.65V94.95H29.81V79.59Z" fill="currentColor"/>
      <path d="M29.96 79.59H29.8V94.95H29.96V79.59Z" fill="currentColor"/>
      <path d="M30.12 79.59H29.96V94.95H30.12V79.59Z" fill="currentColor"/>
      <path d="M30.27 79.59H30.11V94.95H30.27V79.59Z" fill="currentColor"/>
      <path d="M30.43 79.59H30.27V94.95H30.43V79.59Z" fill="currentColor"/>
      <path d="M30.58 79.59H30.42V94.95H30.58V79.59Z" fill="currentColor"/>
      <path d="M30.74 79.59H30.58V94.95H30.74V79.59Z" fill="currentColor"/>
      <path d="M30.89 79.59H30.73V94.95H30.89V79.59Z" fill="currentColor"/>
      <path d="M31.05 79.59H30.89V94.95H31.05V79.59Z" fill="currentColor"/>
      <path d="M31.2 79.59H31.04V94.95H31.2V79.59Z" fill="currentColor"/>
      <path d="M31.36 79.59H31.2V94.95H31.36V79.59Z" fill="currentColor"/>
      <path d="M31.51 79.59H31.35V94.95H31.51V79.59Z" fill="currentColor"/>
      <path d="M31.67 79.59H31.51V94.95H31.67V79.59Z" fill="currentColor"/>
      <path d="M31.82 79.59H31.66V94.95H31.82V79.59Z" fill="currentColor"/>
      <path d="M31.98 79.59H31.82V94.95H31.98V79.59Z" fill="currentColor"/>
      <path d="M32.13 79.59H31.97V94.95H32.13V79.59Z" fill="currentColor"/>
      <path d="M32.29 79.59H32.13V94.95H32.29V79.59Z" fill="currentColor"/>
      <path d="M32.44 79.59H32.28V94.95H32.44V79.59Z" fill="currentColor"/>
      <path d="M32.6 79.59H32.44V94.95H32.6V79.59Z" fill="currentColor"/>
      <path d="M32.75 79.59H32.59V94.95H32.75V79.59Z" fill="currentColor"/>
      <path d="M32.91 79.59H32.75V94.95H32.91V79.59Z" fill="currentColor"/>
      <path d="M33.06 79.59H32.9V94.95H33.06V79.59Z" fill="currentColor"/>
      <path d="M33.22 79.59H33.06V94.95H33.22V79.59Z" fill="currentColor"/>
      <path d="M33.37 79.59H33.21V94.95H33.37V79.59Z" fill="currentColor"/>
      <path d="M33.53 79.59H33.37V94.95H33.53V79.59Z" fill="currentColor"/>
      </g>
      <path d="M67.26 79.59H83.23V89.58C83.23 92.54 80.82 94.95 77.86 94.95H72.63C69.67 94.95 67.26 92.54 67.26 89.58V79.59Z" fill="currentColor"/>
      <mask id={`${id}-2`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="67" y="79" width="17" height="16">
      <path d="M67.26 79.59H83.23V89.58C83.23 92.54 80.82 94.95 77.86 94.95H72.63C69.67 94.95 67.26 92.54 67.26 89.58V79.59Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-2)`}>
      <path d="M67.42 79.59H67.26V94.95H67.42V79.59Z" fill="currentColor"/>
      <path d="M67.57 79.59H67.41V94.95H67.57V79.59Z" fill="currentColor"/>
      <path d="M67.73 79.59H67.57V94.95H67.73V79.59Z" fill="currentColor"/>
      <path d="M67.88 79.59H67.72V94.95H67.88V79.59Z" fill="currentColor"/>
      <path d="M68.04 79.59H67.88V94.95H68.04V79.59Z" fill="currentColor"/>
      <path d="M68.19 79.59H68.03V94.95H68.19V79.59Z" fill="currentColor"/>
      <path d="M68.35 79.59H68.19V94.95H68.35V79.59Z" fill="currentColor"/>
      <path d="M68.5 79.59H68.34V94.95H68.5V79.59Z" fill="currentColor"/>
      <path d="M68.66 79.59H68.5V94.95H68.66V79.59Z" fill="currentColor"/>
      <path d="M68.81 79.59H68.65V94.95H68.81V79.59Z" fill="currentColor"/>
      <path d="M68.97 79.59H68.81V94.95H68.97V79.59Z" fill="currentColor"/>
      <path d="M69.12 79.59H68.96V94.95H69.12V79.59Z" fill="currentColor"/>
      <path d="M69.28 79.59H69.12V94.95H69.28V79.59Z" fill="currentColor"/>
      <path d="M69.43 79.59H69.27V94.95H69.43V79.59Z" fill="currentColor"/>
      <path d="M69.59 79.59H69.43V94.95H69.59V79.59Z" fill="currentColor"/>
      <path d="M69.74 79.59H69.58V94.95H69.74V79.59Z" fill="currentColor"/>
      <path d="M69.9 79.59H69.74V94.95H69.9V79.59Z" fill="currentColor"/>
      <path d="M70.05 79.59H69.89V94.95H70.05V79.59Z" fill="currentColor"/>
      <path d="M70.21 79.59H70.05V94.95H70.21V79.59Z" fill="currentColor"/>
      <path d="M70.36 79.59H70.2V94.95H70.36V79.59Z" fill="currentColor"/>
      <path d="M70.52 79.59H70.36V94.95H70.52V79.59Z" fill="currentColor"/>
      <path d="M70.67 79.59H70.51V94.95H70.67V79.59Z" fill="currentColor"/>
      <path d="M70.83 79.59H70.67V94.95H70.83V79.59Z" fill="currentColor"/>
      <path d="M70.98 79.59H70.82V94.95H70.98V79.59Z" fill="currentColor"/>
      <path d="M71.14 79.59H70.98V94.95H71.14V79.59Z" fill="currentColor"/>
      <path d="M71.3 79.59H71.14V94.95H71.3V79.59Z" fill="currentColor"/>
      <path d="M71.45 79.59H71.29V94.95H71.45V79.59Z" fill="currentColor"/>
      <path d="M71.61 79.59H71.45V94.95H71.61V79.59Z" fill="currentColor"/>
      <path d="M71.76 79.59H71.6V94.95H71.76V79.59Z" fill="currentColor"/>
      <path d="M71.92 79.59H71.76V94.95H71.92V79.59Z" fill="currentColor"/>
      <path d="M72.07 79.59H71.91V94.95H72.07V79.59Z" fill="currentColor"/>
      <path d="M72.23 79.59H72.07V94.95H72.23V79.59Z" fill="currentColor"/>
      <path d="M72.38 79.59H72.22V94.95H72.38V79.59Z" fill="currentColor"/>
      <path d="M72.54 79.59H72.38V94.95H72.54V79.59Z" fill="currentColor"/>
      <path d="M72.69 79.59H72.53V94.95H72.69V79.59Z" fill="currentColor"/>
      <path d="M72.85 79.59H72.69V94.95H72.85V79.59Z" fill="currentColor"/>
      <path d="M73 79.59H72.84V94.95H73V79.59Z" fill="currentColor"/>
      <path d="M73.16 79.59H73V94.95H73.16V79.59Z" fill="currentColor"/>
      <path d="M73.31 79.59H73.15V94.95H73.31V79.59Z" fill="currentColor"/>
      <path d="M73.47 79.59H73.31V94.95H73.47V79.59Z" fill="currentColor"/>
      <path d="M73.62 79.59H73.46V94.95H73.62V79.59Z" fill="currentColor"/>
      <path d="M73.78 79.59H73.62V94.95H73.78V79.59Z" fill="currentColor"/>
      <path d="M73.93 79.59H73.77V94.95H73.93V79.59Z" fill="currentColor"/>
      <path d="M74.09 79.59H73.93V94.95H74.09V79.59Z" fill="currentColor"/>
      <path d="M74.24 79.59H74.08V94.95H74.24V79.59Z" fill="currentColor"/>
      <path d="M74.4 79.59H74.24V94.95H74.4V79.59Z" fill="currentColor"/>
      <path d="M74.55 79.59H74.39V94.95H74.55V79.59Z" fill="currentColor"/>
      <path d="M74.71 79.59H74.55V94.95H74.71V79.59Z" fill="currentColor"/>
      <path d="M74.86 79.59H74.7V94.95H74.86V79.59Z" fill="currentColor"/>
      <path d="M75.02 79.59H74.86V94.95H75.02V79.59Z" fill="currentColor"/>
      <path d="M75.17 79.59H75.01V94.95H75.17V79.59Z" fill="currentColor"/>
      <path d="M75.33 79.59H75.17V94.95H75.33V79.59Z" fill="currentColor"/>
      <path d="M75.48 79.59H75.32V94.95H75.48V79.59Z" fill="currentColor"/>
      <path d="M75.64 79.59H75.48V94.95H75.64V79.59Z" fill="currentColor"/>
      <path d="M75.79 79.59H75.63V94.95H75.79V79.59Z" fill="currentColor"/>
      <path d="M75.95 79.59H75.79V94.95H75.95V79.59Z" fill="currentColor"/>
      <path d="M76.1 79.59H75.94V94.95H76.1V79.59Z" fill="currentColor"/>
      <path d="M76.26 79.59H76.1V94.95H76.26V79.59Z" fill="currentColor"/>
      <path d="M76.41 79.59H76.25V94.95H76.41V79.59Z" fill="currentColor"/>
      <path d="M76.57 79.59H76.41V94.95H76.57V79.59Z" fill="currentColor"/>
      <path d="M76.72 79.59H76.56V94.95H76.72V79.59Z" fill="currentColor"/>
      <path d="M76.88 79.59H76.72V94.95H76.88V79.59Z" fill="currentColor"/>
      <path d="M77.03 79.59H76.87V94.95H77.03V79.59Z" fill="currentColor"/>
      <path d="M77.19 79.59H77.03V94.95H77.19V79.59Z" fill="currentColor"/>
      <path d="M77.34 79.59H77.18V94.95H77.34V79.59Z" fill="currentColor"/>
      <path d="M77.5 79.59H77.34V94.95H77.5V79.59Z" fill="currentColor"/>
      <path d="M77.65 79.59H77.49V94.95H77.65V79.59Z" fill="currentColor"/>
      <path d="M77.81 79.59H77.65V94.95H77.81V79.59Z" fill="currentColor"/>
      <path d="M77.96 79.59H77.8V94.95H77.96V79.59Z" fill="currentColor"/>
      <path d="M78.12 79.59H77.96V94.95H78.12V79.59Z" fill="currentColor"/>
      <path d="M78.28 79.59H78.12V94.95H78.28V79.59Z" fill="currentColor"/>
      <path d="M78.43 79.59H78.27V94.95H78.43V79.59Z" fill="currentColor"/>
      <path d="M78.59 79.59H78.43V94.95H78.59V79.59Z" fill="currentColor"/>
      <path d="M78.74 79.59H78.58V94.95H78.74V79.59Z" fill="currentColor"/>
      <path d="M78.9 79.59H78.74V94.95H78.9V79.59Z" fill="currentColor"/>
      <path d="M79.05 79.59H78.89V94.95H79.05V79.59Z" fill="currentColor"/>
      <path d="M79.21 79.59H79.05V94.95H79.21V79.59Z" fill="currentColor"/>
      <path d="M79.36 79.59H79.2V94.95H79.36V79.59Z" fill="currentColor"/>
      <path d="M79.52 79.59H79.36V94.95H79.52V79.59Z" fill="currentColor"/>
      <path d="M79.67 79.59H79.51V94.95H79.67V79.59Z" fill="currentColor"/>
      <path d="M79.83 79.59H79.67V94.95H79.83V79.59Z" fill="currentColor"/>
      <path d="M79.98 79.59H79.82V94.95H79.98V79.59Z" fill="currentColor"/>
      <path d="M80.14 79.59H79.98V94.95H80.14V79.59Z" fill="currentColor"/>
      <path d="M80.29 79.59H80.13V94.95H80.29V79.59Z" fill="currentColor"/>
      <path d="M80.45 79.59H80.29V94.95H80.45V79.59Z" fill="currentColor"/>
      <path d="M80.6 79.59H80.44V94.95H80.6V79.59Z" fill="currentColor"/>
      <path d="M80.76 79.59H80.6V94.95H80.76V79.59Z" fill="currentColor"/>
      <path d="M80.91 79.59H80.75V94.95H80.91V79.59Z" fill="currentColor"/>
      <path d="M81.07 79.59H80.91V94.95H81.07V79.59Z" fill="currentColor"/>
      <path d="M81.22 79.59H81.06V94.95H81.22V79.59Z" fill="currentColor"/>
      <path d="M81.38 79.59H81.22V94.95H81.38V79.59Z" fill="currentColor"/>
      <path d="M81.53 79.59H81.37V94.95H81.53V79.59Z" fill="currentColor"/>
      <path d="M81.69 79.59H81.53V94.95H81.69V79.59Z" fill="currentColor"/>
      <path d="M81.84 79.59H81.68V94.95H81.84V79.59Z" fill="currentColor"/>
      <path d="M82 79.59H81.84V94.95H82V79.59Z" fill="currentColor"/>
      <path d="M82.15 79.59H81.99V94.95H82.15V79.59Z" fill="currentColor"/>
      <path d="M82.31 79.59H82.15V94.95H82.31V79.59Z" fill="currentColor"/>
      <path d="M82.46 79.59H82.3V94.95H82.46V79.59Z" fill="currentColor"/>
      <path d="M82.62 79.59H82.46V94.95H82.62V79.59Z" fill="currentColor"/>
      <path d="M82.77 79.59H82.61V94.95H82.77V79.59Z" fill="currentColor"/>
      <path d="M82.93 79.59H82.77V94.95H82.93V79.59Z" fill="currentColor"/>
      <path d="M83.08 79.59H82.92V94.95H83.08V79.59Z" fill="currentColor"/>
      <path d="M83.24 79.59H83.08V94.95H83.24V79.59Z" fill="currentColor"/>
      </g>
      <path d="M88.63 12.17H11.92V16.97H88.63V12.17Z" fill="currentColor"/>
      <path d="M97.6 31.27C96.28 31.27 95.2 30.2 95.2 28.87V23.26H87.96C86.64 23.26 85.56 22.18 85.56 20.86C85.56 19.54 86.64 18.46 87.96 18.46H95.78C98.11 18.46 100 20.35 100 22.67V28.87C100 30.2 98.93 31.27 97.6 31.27Z" fill="currentColor"/>
      <path d="M2.40002 31.27C1.08002 31.27 0 30.2 0 28.87V22.67C0 20.35 1.90003 18.46 4.22003 18.46H12.04C13.37 18.46 14.44 19.53 14.44 20.86C14.44 22.19 13.37 23.26 12.04 23.26H4.81V28.87C4.81 30.2 3.73002 31.27 2.40002 31.27Z" fill="currentColor"/>
      <path d="M84.73 82.05H15.28C12.15 82.05 9.61005 79.51 9.61005 76.38V9.35C9.61005 4.19 13.81 0 18.97 0H81.04C86.2 0 90.4 4.19 90.4 9.35V76.38C90.4 79.51 87.85 82.05 84.73 82.05ZM18.97 4.8C16.45 4.8 14.41 6.84 14.41 9.35V76.38C14.41 76.86 14.8 77.25 15.28 77.25H84.73C85.21 77.25 85.6 76.86 85.6 76.38V9.35C85.6 6.84 83.55 4.8 81.04 4.8H18.97Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * CCTV security camera (source: Group-22.svg).
 */
export function CctvCameraIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 75'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M49.78 74.25C27.43 74.25 9.25 56.07 9.25 33.72V21.88H14.91V33.72C14.91 52.94 30.55 68.59 49.78 68.59C69.01 68.59 84.65 52.94 84.65 33.72V21.88H90.3101V33.72C90.3101 56.07 72.13 74.25 49.78 74.25Z" fill="currentColor"/>
      <path d="M89.33 24.47H10.6801C4.79005 24.47 0 19.68 0 13.79V0H100V13.79C100 19.68 95.21 24.47 89.33 24.47ZM5.66003 5.65999V13.79C5.66003 16.56 7.91005 18.81 10.6801 18.81H89.33C92.09 18.81 94.34 16.56 94.34 13.79V5.65999H5.66003Z" fill="currentColor"/>
      <path d="M71.8 64.6H66.14V49.41C66.14 40.39 58.8 33.05 49.78 33.05C40.76 33.05 33.4301 40.39 33.4301 49.41V64.6H27.77V49.41C27.77 37.27 37.64 27.39 49.78 27.39C61.92 27.39 71.8 37.27 71.8 49.41V64.6Z" fill="currentColor"/>
      <path d="M49.78 62.03C43.45 62.03 38.3 56.88 38.3 50.55C38.3 44.22 43.45 39.07 49.78 39.07C56.11 39.07 61.26 44.22 61.26 50.55C61.26 56.88 56.11 62.03 49.78 62.03ZM49.78 44.73C46.57 44.73 43.96 47.34 43.96 50.55C43.96 53.76 46.57 56.37 49.78 56.37C52.99 56.37 55.6 53.76 55.6 50.55C55.6 47.34 52.99 44.73 49.78 44.73Z" fill="currentColor"/>
      <path d="M39.62 15.1C41.2051 15.1 42.49 13.8151 42.49 12.23C42.49 10.6449 41.2051 9.36 39.62 9.36C38.0349 9.36 36.75 10.6449 36.75 12.23C36.75 13.8151 38.0349 15.1 39.62 15.1Z" fill="currentColor"/>
      <path d="M96.28 15.06H50C48.44 15.06 47.17 13.8 47.17 12.23C47.17 10.66 48.44 9.39999 50 9.39999H96.28C97.84 9.39999 99.11 10.67 99.11 12.23C99.11 13.79 97.84 15.06 96.28 15.06Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Chat bubble with ellipsis (source: Group.svg).
 */
export function ChatBubbleDotsIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 100'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M53 99.8711C43.26 100.531 33.88 98.2911 25.56 93.7811L7.77 98.7611C5.93 99.2811 3.9 98.3411 2.72 97.1211C1.44 95.7911 0.59 93.8611 1.17 91.8811L6.33 74.2611C2.87 67.8611 0.7 60.9011 0.19 53.6111C0.02 51.0911 -0.15 48.9111 0.21 46.3811C2.22 18.8311 26.04 -1.84889 53.75 0.131105C64.86 0.921105 75.3 5.49111 83.57 12.8811C84.97 14.1311 86.06 15.2111 87.3 16.6211C96.56 27.1411 100.95 40.1211 99.83 54.2011C97.88 78.7611 77.73 98.4911 53 99.8711ZM22.53 86.9811C25.04 86.2311 27.2 86.4411 29.46 87.6611C45.43 96.2611 65.09 93.9811 78.58 81.8111C79.17 81.2711 79.8 80.7511 80.34 80.1611L82.48 77.8511C93.85 65.5111 95.96 47.2111 88.72 31.6511C82.22 17.6911 68.11 7.90111 52.12 7.08111C26.4 5.76111 5.07 27.2111 7.07 53.1111C7.51 58.8511 8.99 64.2811 11.67 69.4011C12.82 71.5711 13.88 73.8011 13.13 76.3411L8.78 91.1511L22.53 86.9811Z" fill="currentColor"/>
      <path d="M49.86 57.9411C53.1019 57.9411 55.73 55.313 55.73 52.0711C55.73 48.8292 53.1019 46.2011 49.86 46.2011C46.6181 46.2011 43.99 48.8292 43.99 52.0711C43.99 55.313 46.6181 57.9411 49.86 57.9411Z" fill="currentColor"/>
      <path d="M31.29 57.9311C34.5319 57.9311 37.16 55.303 37.16 52.0611C37.16 48.8192 34.5319 46.1911 31.29 46.1911C28.0481 46.1911 25.42 48.8192 25.42 52.0611C25.42 55.303 28.0481 57.9311 31.29 57.9311Z" fill="currentColor"/>
      <path d="M68.44 57.9411C71.6819 57.9411 74.31 55.313 74.31 52.0711C74.31 48.8292 71.6819 46.2011 68.44 46.2011C65.1981 46.2011 62.57 48.8292 62.57 52.0711C62.57 55.313 65.1981 57.9411 68.44 57.9411Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Clipboard with pencil (source: Group-2.svg).
 */
export function ClipboardEditIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 98'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M99.09 56.93C97.64 53.56 94.37 51.01 90.38 50.82C87.8 50.7 84.9 51.08 82.97 53L56.03 79.89C55.56 80.36 55.26 81.25 55.16 81.83L53.69 90.16L53.65 92.53C54.26 95.17 56.36 96.89 59.19 97.13L68.49 95.6C69.38 95.28 70.37 95.1 71.11 94.36L97.36 68C100.25 65.1 100.67 60.61 99.09 56.93ZM67.53 89.76L59.42 91.4L60.8 83.31L79.02 65.08L85.57 71.71L67.53 89.76Z" fill="currentColor"/>
      <path d="M45.95 91.75H14.81C10.03 91.75 6.13998 87.86 6.13998 83.08V23.33C6.13998 18.56 10.03 14.67 14.81 14.67H21.37V16.7C21.37 20.28 24.29 23.2 27.88 23.2H63.61C67.19 23.2 70.11 20.28 70.11 16.7V14.67H76.67C81.45 14.67 85.34 18.56 85.34 23.33V42.12C85.34 43.82 86.71 45.19 88.41 45.19C90.11 45.19 91.48 43.82 91.48 42.12V23.33C91.48 15.17 84.84 8.53 76.67 8.53H70.11V6.5C70.11 2.92 67.19 0 63.61 0H27.88C24.29 0 21.37 2.92 21.37 6.5V8.53H14.81C6.64 8.53 0 15.17 0 23.33V83.08C0 91.25 6.64 97.89 14.81 97.89H45.95C47.65 97.89 49.03 96.52 49.03 94.82C49.03 93.12 47.65 91.75 45.95 91.75ZM27.52 6.5C27.52 6.31 27.68 6.14 27.88 6.14H63.61C63.81 6.14 63.97 6.31 63.97 6.5V16.7C63.97 16.89 63.81 17.06 63.61 17.06H27.88C27.68 17.06 27.52 16.89 27.52 16.7V6.5Z" fill="currentColor"/>
      <path d="M72.15 41.03C72.15 39.33 70.78 37.95 69.08 37.95H23.04C21.35 37.95 19.97 39.33 19.97 41.03C19.97 42.73 21.35 44.1 23.04 44.1H69.08C70.78 44.1 72.15 42.72 72.15 41.03Z" fill="currentColor"/>
      <path d="M23.04 68.68C21.35 68.68 19.97 70.05 19.97 71.75C19.97 73.45 21.35 74.82 23.04 74.82H38.33C40.02 74.82 41.4 73.44 41.4 71.75C41.4 70.06 40.02 68.68 38.33 68.68H23.04Z" fill="currentColor"/>
      <path d="M64.05 56.39C64.05 54.69 62.67 53.32 60.98 53.32H23.04C21.35 53.32 19.97 54.69 19.97 56.39C19.97 58.09 21.35 59.46 23.04 59.46H60.98C62.67 59.46 64.05 58.08 64.05 56.39Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Compass navigation target (source: Group-11.svg).
 */
export function CompassTargetIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 101'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M50 94.056C25.82 94.056 6.15002 74.376 6.15002 50.196C6.15002 26.016 25.82 6.34599 50 6.34599C74.18 6.34599 93.85 26.026 93.85 50.196C93.85 74.366 74.18 94.056 50 94.056ZM50 11.346C28.57 11.346 11.14 28.776 11.14 50.196C11.14 71.616 28.57 89.056 50 89.056C71.43 89.056 88.86 71.626 88.86 50.196C88.86 28.766 71.42 11.346 50 11.346Z" fill="currentColor"/>
      <path d="M13.95 45.176H3.01001C1.34763 45.176 0 46.5236 0 48.186V51.936C0 53.5984 1.34763 54.946 3.01001 54.946H13.95C15.6123 54.946 16.96 53.5984 16.96 51.936V48.186C16.96 46.5236 15.6123 45.176 13.95 45.176Z" fill="currentColor"/>
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="45" width="17" height="10">
      <path d="M13.95 45.176H3.01001C1.34763 45.176 0 46.5236 0 48.186V51.936C0 53.5984 1.34763 54.946 3.01001 54.946H13.95C15.6123 54.946 16.96 53.5984 16.96 51.936V48.186C16.96 46.5236 15.6123 45.176 13.95 45.176Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <path d="M0.160034 45.176H0V54.946H0.160034V45.176Z" fill="currentColor"/>
      <path d="M0.319946 45.176H0.160034V54.946H0.319946V45.176Z" fill="currentColor"/>
      <path d="M0.48999 45.176H0.329956V54.946H0.48999V45.176Z" fill="currentColor"/>
      <path d="M0.650024 45.176H0.48999V54.946H0.650024V45.176Z" fill="currentColor"/>
      <path d="M0.819946 45.176H0.660034V54.946H0.819946V45.176Z" fill="currentColor"/>
      <path d="M0.97998 45.176H0.819946V54.946H0.97998V45.176Z" fill="currentColor"/>
      <path d="M1.15002 45.176H0.98999V54.946H1.15002V45.176Z" fill="currentColor"/>
      <path d="M1.31006 45.176H1.15002V54.946H1.31006V45.176Z" fill="currentColor"/>
      <path d="M1.47998 45.176H1.31995V54.946H1.47998V45.176Z" fill="currentColor"/>
      <path d="M1.64001 45.176H1.47998V54.946H1.64001V45.176Z" fill="currentColor"/>
      <path d="M1.80005 45.176H1.64001V54.946H1.80005V45.176Z" fill="currentColor"/>
      <path d="M1.96997 45.176H1.81006V54.946H1.96997V45.176Z" fill="currentColor"/>
      <path d="M2.13 45.176H1.96997V54.946H2.13V45.176Z" fill="currentColor"/>
      <path d="M2.30005 45.176H2.14001V54.946H2.30005V45.176Z" fill="currentColor"/>
      <path d="M2.45996 45.176H2.30005V54.946H2.45996V45.176Z" fill="currentColor"/>
      <path d="M2.63 45.176H2.46997V54.946H2.63V45.176Z" fill="currentColor"/>
      <path d="M2.79004 45.176H2.63V54.946H2.79004V45.176Z" fill="currentColor"/>
      <path d="M2.95996 45.176H2.80005V54.946H2.95996V45.176Z" fill="currentColor"/>
      <path d="M3.12 45.176H2.95996V54.946H3.12V45.176Z" fill="currentColor"/>
      <path d="M3.29004 45.176H3.13V54.946H3.29004V45.176Z" fill="currentColor"/>
      <path d="M3.44995 45.176H3.29004V54.946H3.44995V45.176Z" fill="currentColor"/>
      <path d="M3.62 45.176H3.45996V54.946H3.62V45.176Z" fill="currentColor"/>
      <path d="M3.78003 45.176H3.62V54.946H3.78003V45.176Z" fill="currentColor"/>
      <path d="M3.94995 45.176H3.79004V54.946H3.94995V45.176Z" fill="currentColor"/>
      <path d="M4.10999 45.176H3.94995V54.946H4.10999V45.176Z" fill="currentColor"/>
      <path d="M4.28003 45.176H4.12V54.946H4.28003V45.176Z" fill="currentColor"/>
      <path d="M4.43994 45.176H4.28003V54.946H4.43994V45.176Z" fill="currentColor"/>
      <path d="M4.59998 45.176H4.43994V54.946H4.59998V45.176Z" fill="currentColor"/>
      <path d="M4.77002 45.176H4.60999V54.946H4.77002V45.176Z" fill="currentColor"/>
      <path d="M4.93005 45.176H4.77002V54.946H4.93005V45.176Z" fill="currentColor"/>
      <path d="M5.09998 45.176H4.93994V54.946H5.09998V45.176Z" fill="currentColor"/>
      <path d="M5.26001 45.176H5.09998V54.946H5.26001V45.176Z" fill="currentColor"/>
      <path d="M5.43005 45.176H5.27002V54.946H5.43005V45.176Z" fill="currentColor"/>
      <path d="M5.58997 45.176H5.43005V54.946H5.58997V45.176Z" fill="currentColor"/>
      <path d="M5.76001 45.176H5.59998V54.946H5.76001V45.176Z" fill="currentColor"/>
      <path d="M5.92004 45.176H5.76001V54.946H5.92004V45.176Z" fill="currentColor"/>
      <path d="M6.08997 45.176H5.93005V54.946H6.08997V45.176Z" fill="currentColor"/>
      <path d="M6.25 45.176H6.08997V54.946H6.25V45.176Z" fill="currentColor"/>
      <path d="M6.42004 45.176H6.26001V54.946H6.42004V45.176Z" fill="currentColor"/>
      <path d="M6.57996 45.176H6.42004V54.946H6.57996V45.176Z" fill="currentColor"/>
      <path d="M6.75 45.176H6.58997V54.946H6.75V45.176Z" fill="currentColor"/>
      <path d="M6.91003 45.176H6.75V54.946H6.91003V45.176Z" fill="currentColor"/>
      <path d="M7.07996 45.176H6.92004V54.946H7.07996V45.176Z" fill="currentColor"/>
      <path d="M7.23999 45.176H7.07996V54.946H7.23999V45.176Z" fill="currentColor"/>
      <path d="M7.40002 45.176H7.23999V54.946H7.40002V45.176Z" fill="currentColor"/>
      <path d="M7.56995 45.176H7.41003V54.946H7.56995V45.176Z" fill="currentColor"/>
      <path d="M7.72998 45.176H7.56995V54.946H7.72998V45.176Z" fill="currentColor"/>
      <path d="M7.90002 45.176H7.73999V54.946H7.90002V45.176Z" fill="currentColor"/>
      <path d="M8.06006 45.176H7.90002V54.946H8.06006V45.176Z" fill="currentColor"/>
      <path d="M8.22998 45.176H8.06995V54.946H8.22998V45.176Z" fill="currentColor"/>
      <path d="M8.39001 45.176H8.22998V54.946H8.39001V45.176Z" fill="currentColor"/>
      <path d="M8.56006 45.176H8.40002V54.946H8.56006V45.176Z" fill="currentColor"/>
      <path d="M8.71997 45.176H8.56006V54.946H8.71997V45.176Z" fill="currentColor"/>
      <path d="M8.89001 45.176H8.72998V54.946H8.89001V45.176Z" fill="currentColor"/>
      <path d="M9.05005 45.176H8.89001V54.946H9.05005V45.176Z" fill="currentColor"/>
      <path d="M9.21997 45.176H9.06006V54.946H9.21997V45.176Z" fill="currentColor"/>
      <path d="M9.38 45.176H9.21997V54.946H9.38V45.176Z" fill="currentColor"/>
      <path d="M9.55005 45.176H9.39001V54.946H9.55005V45.176Z" fill="currentColor"/>
      <path d="M9.70996 45.176H9.55005V54.946H9.70996V45.176Z" fill="currentColor"/>
      <path d="M9.88 45.176H9.71997V54.946H9.88V45.176Z" fill="currentColor"/>
      <path d="M10.04 45.176H9.88V54.946H10.04V45.176Z" fill="currentColor"/>
      <path d="M10.2 45.176H10.04V54.946H10.2V45.176Z" fill="currentColor"/>
      <path d="M10.37 45.176H10.21V54.946H10.37V45.176Z" fill="currentColor"/>
      <path d="M10.53 45.176H10.37V54.946H10.53V45.176Z" fill="currentColor"/>
      <path d="M10.7 45.176H10.54V54.946H10.7V45.176Z" fill="currentColor"/>
      <path d="M10.86 45.176H10.7V54.946H10.86V45.176Z" fill="currentColor"/>
      <path d="M11.03 45.176H10.87V54.946H11.03V45.176Z" fill="currentColor"/>
      <path d="M11.1899 45.176H11.03V54.946H11.1899V45.176Z" fill="currentColor"/>
      <path d="M11.36 45.176H11.2V54.946H11.36V45.176Z" fill="currentColor"/>
      <path d="M11.52 45.176H11.36V54.946H11.52V45.176Z" fill="currentColor"/>
      <path d="M11.6899 45.176H11.53V54.946H11.6899V45.176Z" fill="currentColor"/>
      <path d="M11.85 45.176H11.6899V54.946H11.85V45.176Z" fill="currentColor"/>
      <path d="M12.02 45.176H11.86V54.946H12.02V45.176Z" fill="currentColor"/>
      <path d="M12.1801 45.176H12.02V54.946H12.1801V45.176Z" fill="currentColor"/>
      <path d="M12.35 45.176H12.1899V54.946H12.35V45.176Z" fill="currentColor"/>
      <path d="M12.51 45.176H12.35V54.946H12.51V45.176Z" fill="currentColor"/>
      <path d="M12.6801 45.176H12.52V54.946H12.6801V45.176Z" fill="currentColor"/>
      <path d="M12.84 45.176H12.6801V54.946H12.84V45.176Z" fill="currentColor"/>
      <path d="M13 45.176H12.84V54.946H13V45.176Z" fill="currentColor"/>
      <path d="M13.17 45.176H13.01V54.946H13.17V45.176Z" fill="currentColor"/>
      <path d="M13.33 45.176H13.17V54.946H13.33V45.176Z" fill="currentColor"/>
      <path d="M13.5 45.176H13.34V54.946H13.5V45.176Z" fill="currentColor"/>
      <path d="M13.66 45.176H13.5V54.946H13.66V45.176Z" fill="currentColor"/>
      <path d="M13.83 45.176H13.67V54.946H13.83V45.176Z" fill="currentColor"/>
      <path d="M13.99 45.176H13.83V54.946H13.99V45.176Z" fill="currentColor"/>
      <path d="M14.16 45.176H14V54.946H14.16V45.176Z" fill="currentColor"/>
      <path d="M14.3199 45.176H14.16V54.946H14.3199V45.176Z" fill="currentColor"/>
      <path d="M14.49 45.176H14.33V54.946H14.49V45.176Z" fill="currentColor"/>
      <path d="M14.65 45.176H14.49V54.946H14.65V45.176Z" fill="currentColor"/>
      <path d="M14.8199 45.176H14.66V54.946H14.8199V45.176Z" fill="currentColor"/>
      <path d="M14.98 45.176H14.8199V54.946H14.98V45.176Z" fill="currentColor"/>
      <path d="M15.15 45.176H14.99V54.946H15.15V45.176Z" fill="currentColor"/>
      <path d="M15.3101 45.176H15.15V54.946H15.3101V45.176Z" fill="currentColor"/>
      <path d="M15.48 45.176H15.3199V54.946H15.48V45.176Z" fill="currentColor"/>
      <path d="M15.64 45.176H15.48V54.946H15.64V45.176Z" fill="currentColor"/>
      <path d="M15.8 45.176H15.64V54.946H15.8V45.176Z" fill="currentColor"/>
      <path d="M15.97 45.176H15.8101V54.946H15.97V45.176Z" fill="currentColor"/>
      <path d="M16.13 45.176H15.97V54.946H16.13V45.176Z" fill="currentColor"/>
      <path d="M16.3 45.176H16.14V54.946H16.3V45.176Z" fill="currentColor"/>
      <path d="M16.46 45.176H16.3V54.946H16.46V45.176Z" fill="currentColor"/>
      <path d="M16.63 45.176H16.47V54.946H16.63V45.176Z" fill="currentColor"/>
      <path d="M16.79 45.176H16.63V54.946H16.79V45.176Z" fill="currentColor"/>
      <path d="M16.96 45.176H16.8V54.946H16.96V45.176Z" fill="currentColor"/>
      </g>
      <path d="M96.98 45.176H86.04C84.3777 45.176 83.03 46.5236 83.03 48.186V51.936C83.03 53.5984 84.3777 54.946 86.04 54.946H96.98C98.6424 54.946 99.99 53.5984 99.99 51.936V48.186C99.99 46.5236 98.6424 45.176 96.98 45.176Z" fill="currentColor"/>
      <mask id={`${id}-1`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="83" y="45" width="17" height="10">
      <path d="M96.98 45.176H86.04C84.3777 45.176 83.03 46.5236 83.03 48.186V51.936C83.03 53.5984 84.3777 54.946 86.04 54.946H96.98C98.6424 54.946 99.99 53.5984 99.99 51.936V48.186C99.99 46.5236 98.6424 45.176 96.98 45.176Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-1)`}>
      <path d="M83.1899 45.176H83.03V54.946H83.1899V45.176Z" fill="currentColor"/>
      <path d="M83.36 45.176H83.2V54.946H83.36V45.176Z" fill="currentColor"/>
      <path d="M83.52 45.176H83.36V54.946H83.52V45.176Z" fill="currentColor"/>
      <path d="M83.6899 45.176H83.53V54.946H83.6899V45.176Z" fill="currentColor"/>
      <path d="M83.85 45.176H83.6899V54.946H83.85V45.176Z" fill="currentColor"/>
      <path d="M84.02 45.176H83.86V54.946H84.02V45.176Z" fill="currentColor"/>
      <path d="M84.1801 45.176H84.02V54.946H84.1801V45.176Z" fill="currentColor"/>
      <path d="M84.35 45.176H84.1899V54.946H84.35V45.176Z" fill="currentColor"/>
      <path d="M84.51 45.176H84.35V54.946H84.51V45.176Z" fill="currentColor"/>
      <path d="M84.6801 45.176H84.52V54.946H84.6801V45.176Z" fill="currentColor"/>
      <path d="M84.84 45.176H84.6801V54.946H84.84V45.176Z" fill="currentColor"/>
      <path d="M85.01 45.176H84.85V54.946H85.01V45.176Z" fill="currentColor"/>
      <path d="M85.17 45.176H85.01V54.946H85.17V45.176Z" fill="currentColor"/>
      <path d="M85.33 45.176H85.17V54.946H85.33V45.176Z" fill="currentColor"/>
      <path d="M85.5 45.176H85.34V54.946H85.5V45.176Z" fill="currentColor"/>
      <path d="M85.66 45.176H85.5V54.946H85.66V45.176Z" fill="currentColor"/>
      <path d="M85.83 45.176H85.67V54.946H85.83V45.176Z" fill="currentColor"/>
      <path d="M85.99 45.176H85.83V54.946H85.99V45.176Z" fill="currentColor"/>
      <path d="M86.16 45.176H86V54.946H86.16V45.176Z" fill="currentColor"/>
      <path d="M86.3199 45.176H86.16V54.946H86.3199V45.176Z" fill="currentColor"/>
      <path d="M86.49 45.176H86.33V54.946H86.49V45.176Z" fill="currentColor"/>
      <path d="M86.65 45.176H86.49V54.946H86.65V45.176Z" fill="currentColor"/>
      <path d="M86.8199 45.176H86.66V54.946H86.8199V45.176Z" fill="currentColor"/>
      <path d="M86.98 45.176H86.8199V54.946H86.98V45.176Z" fill="currentColor"/>
      <path d="M87.15 45.176H86.99V54.946H87.15V45.176Z" fill="currentColor"/>
      <path d="M87.3101 45.176H87.15V54.946H87.3101V45.176Z" fill="currentColor"/>
      <path d="M87.48 45.176H87.3199V54.946H87.48V45.176Z" fill="currentColor"/>
      <path d="M87.64 45.176H87.48V54.946H87.64V45.176Z" fill="currentColor"/>
      <path d="M87.8101 45.176H87.65V54.946H87.8101V45.176Z" fill="currentColor"/>
      <path d="M87.97 45.176H87.8101V54.946H87.97V45.176Z" fill="currentColor"/>
      <path d="M88.13 45.176H87.97V54.946H88.13V45.176Z" fill="currentColor"/>
      <path d="M88.3 45.176H88.14V54.946H88.3V45.176Z" fill="currentColor"/>
      <path d="M88.46 45.176H88.3V54.946H88.46V45.176Z" fill="currentColor"/>
      <path d="M88.63 45.176H88.47V54.946H88.63V45.176Z" fill="currentColor"/>
      <path d="M88.79 45.176H88.63V54.946H88.79V45.176Z" fill="currentColor"/>
      <path d="M88.96 45.176H88.8V54.946H88.96V45.176Z" fill="currentColor"/>
      <path d="M89.12 45.176H88.96V54.946H89.12V45.176Z" fill="currentColor"/>
      <path d="M89.29 45.176H89.13V54.946H89.29V45.176Z" fill="currentColor"/>
      <path d="M89.45 45.176H89.29V54.946H89.45V45.176Z" fill="currentColor"/>
      <path d="M89.62 45.176H89.46V54.946H89.62V45.176Z" fill="currentColor"/>
      <path d="M89.78 45.176H89.62V54.946H89.78V45.176Z" fill="currentColor"/>
      <path d="M89.95 45.176H89.79V54.946H89.95V45.176Z" fill="currentColor"/>
      <path d="M90.11 45.176H89.95V54.946H90.11V45.176Z" fill="currentColor"/>
      <path d="M90.28 45.176H90.12V54.946H90.28V45.176Z" fill="currentColor"/>
      <path d="M90.4399 45.176H90.28V54.946H90.4399V45.176Z" fill="currentColor"/>
      <path d="M90.61 45.176H90.45V54.946H90.61V45.176Z" fill="currentColor"/>
      <path d="M90.77 45.176H90.61V54.946H90.77V45.176Z" fill="currentColor"/>
      <path d="M90.9301 45.176H90.77V54.946H90.9301V45.176Z" fill="currentColor"/>
      <path d="M91.1 45.176H90.9399V54.946H91.1V45.176Z" fill="currentColor"/>
      <path d="M91.26 45.176H91.1V54.946H91.26V45.176Z" fill="currentColor"/>
      <path d="M91.4301 45.176H91.27V54.946H91.4301V45.176Z" fill="currentColor"/>
      <path d="M91.59 45.176H91.4301V54.946H91.59V45.176Z" fill="currentColor"/>
      <path d="M91.76 45.176H91.6V54.946H91.76V45.176Z" fill="currentColor"/>
      <path d="M91.92 45.176H91.76V54.946H91.92V45.176Z" fill="currentColor"/>
      <path d="M92.09 45.176H91.9301V54.946H92.09V45.176Z" fill="currentColor"/>
      <path d="M92.25 45.176H92.09V54.946H92.25V45.176Z" fill="currentColor"/>
      <path d="M92.42 45.176H92.26V54.946H92.42V45.176Z" fill="currentColor"/>
      <path d="M92.58 45.176H92.42V54.946H92.58V45.176Z" fill="currentColor"/>
      <path d="M92.75 45.176H92.59V54.946H92.75V45.176Z" fill="currentColor"/>
      <path d="M92.91 45.176H92.75V54.946H92.91V45.176Z" fill="currentColor"/>
      <path d="M93.08 45.176H92.92V54.946H93.08V45.176Z" fill="currentColor"/>
      <path d="M93.24 45.176H93.08V54.946H93.24V45.176Z" fill="currentColor"/>
      <path d="M93.41 45.176H93.25V54.946H93.41V45.176Z" fill="currentColor"/>
      <path d="M93.5699 45.176H93.41V54.946H93.5699V45.176Z" fill="currentColor"/>
      <path d="M93.73 45.176H93.5699V54.946H93.73V45.176Z" fill="currentColor"/>
      <path d="M93.9 45.176H93.74V54.946H93.9V45.176Z" fill="currentColor"/>
      <path d="M94.0601 45.176H93.9V54.946H94.0601V45.176Z" fill="currentColor"/>
      <path d="M94.23 45.176H94.0699V54.946H94.23V45.176Z" fill="currentColor"/>
      <path d="M94.39 45.176H94.23V54.946H94.39V45.176Z" fill="currentColor"/>
      <path d="M94.5601 45.176H94.4V54.946H94.5601V45.176Z" fill="currentColor"/>
      <path d="M94.72 45.176H94.5601V54.946H94.72V45.176Z" fill="currentColor"/>
      <path d="M94.89 45.176H94.73V54.946H94.89V45.176Z" fill="currentColor"/>
      <path d="M95.05 45.176H94.89V54.946H95.05V45.176Z" fill="currentColor"/>
      <path d="M95.22 45.176H95.0601V54.946H95.22V45.176Z" fill="currentColor"/>
      <path d="M95.38 45.176H95.22V54.946H95.38V45.176Z" fill="currentColor"/>
      <path d="M95.55 45.176H95.39V54.946H95.55V45.176Z" fill="currentColor"/>
      <path d="M95.71 45.176H95.55V54.946H95.71V45.176Z" fill="currentColor"/>
      <path d="M95.88 45.176H95.72V54.946H95.88V45.176Z" fill="currentColor"/>
      <path d="M96.04 45.176H95.88V54.946H96.04V45.176Z" fill="currentColor"/>
      <path d="M96.21 45.176H96.05V54.946H96.21V45.176Z" fill="currentColor"/>
      <path d="M96.37 45.176H96.21V54.946H96.37V45.176Z" fill="currentColor"/>
      <path d="M96.53 45.176H96.37V54.946H96.53V45.176Z" fill="currentColor"/>
      <path d="M96.7 45.176H96.54V54.946H96.7V45.176Z" fill="currentColor"/>
      <path d="M96.86 45.176H96.7V54.946H96.86V45.176Z" fill="currentColor"/>
      <path d="M97.03 45.176H96.87V54.946H97.03V45.176Z" fill="currentColor"/>
      <path d="M97.1899 45.176H97.03V54.946H97.1899V45.176Z" fill="currentColor"/>
      <path d="M97.36 45.176H97.2V54.946H97.36V45.176Z" fill="currentColor"/>
      <path d="M97.52 45.176H97.36V54.946H97.52V45.176Z" fill="currentColor"/>
      <path d="M97.6899 45.176H97.53V54.946H97.6899V45.176Z" fill="currentColor"/>
      <path d="M97.85 45.176H97.6899V54.946H97.85V45.176Z" fill="currentColor"/>
      <path d="M98.02 45.176H97.86V54.946H98.02V45.176Z" fill="currentColor"/>
      <path d="M98.1801 45.176H98.02V54.946H98.1801V45.176Z" fill="currentColor"/>
      <path d="M98.35 45.176H98.1899V54.946H98.35V45.176Z" fill="currentColor"/>
      <path d="M98.51 45.176H98.35V54.946H98.51V45.176Z" fill="currentColor"/>
      <path d="M98.6801 45.176H98.52V54.946H98.6801V45.176Z" fill="currentColor"/>
      <path d="M98.84 45.176H98.6801V54.946H98.84V45.176Z" fill="currentColor"/>
      <path d="M99.01 45.176H98.85V54.946H99.01V45.176Z" fill="currentColor"/>
      <path d="M99.17 45.176H99.01V54.946H99.17V45.176Z" fill="currentColor"/>
      <path d="M99.33 45.176H99.17V54.946H99.33V45.176Z" fill="currentColor"/>
      <path d="M99.5 45.176H99.34V54.946H99.5V45.176Z" fill="currentColor"/>
      <path d="M99.66 45.176H99.5V54.946H99.66V45.176Z" fill="currentColor"/>
      <path d="M99.83 45.176H99.67V54.946H99.83V45.176Z" fill="currentColor"/>
      <path d="M99.99 45.176H99.83V54.946H99.99V45.176Z" fill="currentColor"/>
      </g>
      <path d="M54.4734 14.15V3.01001C54.4734 1.34763 53.1258 0 51.4634 0L47.7134 0C46.051 0 44.7034 1.34763 44.7034 3.01001V14.15C44.7034 15.8124 46.051 17.16 47.7134 17.16H51.4634C53.1258 17.16 54.4734 15.8124 54.4734 14.15Z" fill="currentColor"/>
      <mask id={`${id}-2`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="44" y="0" width="11" height="18">
      <path d="M54.4734 14.15V3.01001C54.4734 1.34763 53.1258 0 51.4634 0L47.7134 0C46.051 0 44.7034 1.34763 44.7034 3.01001V14.15C44.7034 15.8124 46.051 17.16 47.7134 17.16H51.4634C53.1258 17.16 54.4734 15.8124 54.4734 14.15Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-2)`}>
      <path d="M54.48 0.00599098H44.71V0.175991H54.48V0.00599098Z" fill="currentColor"/>
      <path d="M54.48 0.165991H44.71V0.335991H54.48V0.165991Z" fill="currentColor"/>
      <path d="M54.48 0.335991H44.71V0.505991H54.48V0.335991Z" fill="currentColor"/>
      <path d="M54.48 0.505991H44.71V0.675991H54.48V0.505991Z" fill="currentColor"/>
      <path d="M54.48 0.665991H44.71V0.835991H54.48V0.665991Z" fill="currentColor"/>
      <path d="M54.48 0.835991H44.71V1.00599H54.48V0.835991Z" fill="currentColor"/>
      <path d="M54.48 1.00599H44.71V1.17599H54.48V1.00599Z" fill="currentColor"/>
      <path d="M54.48 1.16599H44.71V1.33599H54.48V1.16599Z" fill="currentColor"/>
      <path d="M54.48 1.33599H44.71V1.50599H54.48V1.33599Z" fill="currentColor"/>
      <path d="M54.48 1.50599H44.71V1.67599H54.48V1.50599Z" fill="currentColor"/>
      <path d="M54.48 1.66599H44.71V1.83599H54.48V1.66599Z" fill="currentColor"/>
      <path d="M54.48 1.83599H44.71V2.00599H54.48V1.83599Z" fill="currentColor"/>
      <path d="M54.48 2.00599H44.71V2.17599H54.48V2.00599Z" fill="currentColor"/>
      <path d="M54.48 2.16599H44.71V2.33599H54.48V2.16599Z" fill="currentColor"/>
      <path d="M54.48 2.33599H44.71V2.50599H54.48V2.33599Z" fill="currentColor"/>
      <path d="M54.48 2.50599H44.71V2.67599H54.48V2.50599Z" fill="currentColor"/>
      <path d="M54.48 2.66599H44.71V2.83599H54.48V2.66599Z" fill="currentColor"/>
      <path d="M54.48 2.83599H44.71V3.00599H54.48V2.83599Z" fill="currentColor"/>
      <path d="M54.48 3.00599H44.71V3.17599H54.48V3.00599Z" fill="currentColor"/>
      <path d="M54.48 3.16599H44.71V3.33599H54.48V3.16599Z" fill="currentColor"/>
      <path d="M54.48 3.33599H44.71V3.50599H54.48V3.33599Z" fill="currentColor"/>
      <path d="M54.48 3.50599H44.71V3.67599H54.48V3.50599Z" fill="currentColor"/>
      <path d="M54.48 3.66599H44.71V3.83599H54.48V3.66599Z" fill="currentColor"/>
      <path d="M54.48 3.83599H44.71V4.00599H54.48V3.83599Z" fill="currentColor"/>
      <path d="M54.48 4.00599H44.71V4.17599H54.48V4.00599Z" fill="currentColor"/>
      <path d="M54.48 4.16599H44.71V4.33599H54.48V4.16599Z" fill="currentColor"/>
      <path d="M54.48 4.33599H44.71V4.50599H54.48V4.33599Z" fill="currentColor"/>
      <path d="M54.48 4.50599H44.71V4.67599H54.48V4.50599Z" fill="currentColor"/>
      <path d="M54.48 4.66599H44.71V4.83599H54.48V4.66599Z" fill="currentColor"/>
      <path d="M54.48 4.83599H44.71V5.00599H54.48V4.83599Z" fill="currentColor"/>
      <path d="M54.48 5.00599H44.71V5.17599H54.48V5.00599Z" fill="currentColor"/>
      <path d="M54.48 5.16599H44.71V5.33599H54.48V5.16599Z" fill="currentColor"/>
      <path d="M54.48 5.33599H44.71V5.50599H54.48V5.33599Z" fill="currentColor"/>
      <path d="M54.48 5.50599H44.71V5.67599H54.48V5.50599Z" fill="currentColor"/>
      <path d="M54.48 5.66599H44.71V5.83599H54.48V5.66599Z" fill="currentColor"/>
      <path d="M54.48 5.83599H44.71V6.00599H54.48V5.83599Z" fill="currentColor"/>
      <path d="M54.48 6.00599H44.71V6.17599H54.48V6.00599Z" fill="currentColor"/>
      <path d="M54.48 6.16599H44.71V6.33599H54.48V6.16599Z" fill="currentColor"/>
      <path d="M54.48 6.33599H44.71V6.50599H54.48V6.33599Z" fill="currentColor"/>
      <path d="M54.48 6.50599H44.71V6.67599H54.48V6.50599Z" fill="currentColor"/>
      <path d="M54.48 6.66599H44.71V6.83599H54.48V6.66599Z" fill="currentColor"/>
      <path d="M54.48 6.83599H44.71V7.00599H54.48V6.83599Z" fill="currentColor"/>
      <path d="M54.48 7.00599H44.71V7.17599H54.48V7.00599Z" fill="currentColor"/>
      <path d="M54.48 7.16599H44.71V7.33599H54.48V7.16599Z" fill="currentColor"/>
      <path d="M54.48 7.33599H44.71V7.50599H54.48V7.33599Z" fill="currentColor"/>
      <path d="M54.48 7.50599H44.71V7.67599H54.48V7.50599Z" fill="currentColor"/>
      <path d="M54.48 7.66599H44.71V7.83599H54.48V7.66599Z" fill="currentColor"/>
      <path d="M54.48 7.83599H44.71V8.00599H54.48V7.83599Z" fill="currentColor"/>
      <path d="M54.48 8.00599H44.71V8.17599H54.48V8.00599Z" fill="currentColor"/>
      <path d="M54.48 8.16599H44.71V8.33599H54.48V8.16599Z" fill="currentColor"/>
      <path d="M54.48 8.33599H44.71V8.50599H54.48V8.33599Z" fill="currentColor"/>
      <path d="M54.48 8.50599H44.71V8.67599H54.48V8.50599Z" fill="currentColor"/>
      <path d="M54.48 8.66599H44.71V8.83599H54.48V8.66599Z" fill="currentColor"/>
      <path d="M54.48 8.83599H44.71V9.00599H54.48V8.83599Z" fill="currentColor"/>
      <path d="M54.48 9.00599H44.71V9.17599H54.48V9.00599Z" fill="currentColor"/>
      <path d="M54.48 9.16599H44.71V9.33599H54.48V9.16599Z" fill="currentColor"/>
      <path d="M54.48 9.33599H44.71V9.50599H54.48V9.33599Z" fill="currentColor"/>
      <path d="M54.48 9.50599H44.71V9.67599H54.48V9.50599Z" fill="currentColor"/>
      <path d="M54.48 9.66599H44.71V9.83599H54.48V9.66599Z" fill="currentColor"/>
      <path d="M54.48 9.83599H44.71V10.006H54.48V9.83599Z" fill="currentColor"/>
      <path d="M54.48 9.99599H44.71V10.166H54.48V9.99599Z" fill="currentColor"/>
      <path d="M54.48 10.166H44.71V10.336H54.48V10.166Z" fill="currentColor"/>
      <path d="M54.48 10.336H44.71V10.506H54.48V10.336Z" fill="currentColor"/>
      <path d="M54.48 10.496H44.71V10.666H54.48V10.496Z" fill="currentColor"/>
      <path d="M54.48 10.666H44.71V10.836H54.48V10.666Z" fill="currentColor"/>
      <path d="M54.48 10.836H44.71V11.006H54.48V10.836Z" fill="currentColor"/>
      <path d="M54.48 10.996H44.71V11.166H54.48V10.996Z" fill="currentColor"/>
      <path d="M54.48 11.166H44.71V11.336H54.48V11.166Z" fill="currentColor"/>
      <path d="M54.48 11.336H44.71V11.506H54.48V11.336Z" fill="currentColor"/>
      <path d="M54.48 11.496H44.71V11.666H54.48V11.496Z" fill="currentColor"/>
      <path d="M54.48 11.666H44.71V11.836H54.48V11.666Z" fill="currentColor"/>
      <path d="M54.48 11.836H44.71V12.006H54.48V11.836Z" fill="currentColor"/>
      <path d="M54.48 11.996H44.71V12.166H54.48V11.996Z" fill="currentColor"/>
      <path d="M54.48 12.166H44.71V12.336H54.48V12.166Z" fill="currentColor"/>
      <path d="M54.48 12.336H44.71V12.506H54.48V12.336Z" fill="currentColor"/>
      <path d="M54.48 12.496H44.71V12.666H54.48V12.496Z" fill="currentColor"/>
      <path d="M54.48 12.666H44.71V12.836H54.48V12.666Z" fill="currentColor"/>
      <path d="M54.48 12.836H44.71V13.006H54.48V12.836Z" fill="currentColor"/>
      <path d="M54.48 12.996H44.71V13.166H54.48V12.996Z" fill="currentColor"/>
      <path d="M54.48 13.166H44.71V13.336H54.48V13.166Z" fill="currentColor"/>
      <path d="M54.48 13.336H44.71V13.506H54.48V13.336Z" fill="currentColor"/>
      <path d="M54.48 13.496H44.71V13.666H54.48V13.496Z" fill="currentColor"/>
      <path d="M54.48 13.666H44.71V13.836H54.48V13.666Z" fill="currentColor"/>
      <path d="M54.48 13.836H44.71V14.006H54.48V13.836Z" fill="currentColor"/>
      <path d="M54.48 13.996H44.71V14.166H54.48V13.996Z" fill="currentColor"/>
      <path d="M54.48 14.166H44.71V14.336H54.48V14.166Z" fill="currentColor"/>
      <path d="M54.48 14.336H44.71V14.506H54.48V14.336Z" fill="currentColor"/>
      <path d="M54.48 14.496H44.71V14.666H54.48V14.496Z" fill="currentColor"/>
      <path d="M54.48 14.666H44.71V14.836H54.48V14.666Z" fill="currentColor"/>
      <path d="M54.48 14.836H44.71V15.006H54.48V14.836Z" fill="currentColor"/>
      <path d="M54.48 14.996H44.71V15.166H54.48V14.996Z" fill="currentColor"/>
      <path d="M54.48 15.166H44.71V15.336H54.48V15.166Z" fill="currentColor"/>
      <path d="M54.48 15.336H44.71V15.506H54.48V15.336Z" fill="currentColor"/>
      <path d="M54.48 15.496H44.71V15.666H54.48V15.496Z" fill="currentColor"/>
      <path d="M54.48 15.666H44.71V15.836H54.48V15.666Z" fill="currentColor"/>
      <path d="M54.48 15.836H44.71V16.006H54.48V15.836Z" fill="currentColor"/>
      <path d="M54.48 15.996H44.71V16.166H54.48V15.996Z" fill="currentColor"/>
      <path d="M54.48 16.166H44.71V16.336H54.48V16.166Z" fill="currentColor"/>
      <path d="M54.48 16.336H44.71V16.506H54.48V16.336Z" fill="currentColor"/>
      <path d="M54.48 16.496H44.71V16.666H54.48V16.496Z" fill="currentColor"/>
      <path d="M54.48 16.666H44.71V16.836H54.48V16.666Z" fill="currentColor"/>
      <path d="M54.48 16.836H44.71V17.006H54.48V16.836Z" fill="currentColor"/>
      <path d="M54.48 16.996H44.71V17.166H54.48V16.996Z" fill="currentColor"/>
      </g>
      <path d="M54.476 97.3824V86.2424C54.476 84.58 53.1283 83.2324 51.466 83.2324H47.716C46.0536 83.2324 44.706 84.58 44.706 86.2424V97.3824C44.706 99.0448 46.0536 100.392 47.716 100.392H51.466C53.1283 100.392 54.476 99.0448 54.476 97.3824Z" fill="currentColor"/>
      <mask id={`${id}-3`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="44" y="83" width="11" height="18">
      <path d="M54.476 97.3824V86.2424C54.476 84.58 53.1283 83.2324 51.466 83.2324H47.716C46.0536 83.2324 44.706 84.58 44.706 86.2424V97.3824C44.706 99.0448 46.0536 100.392 47.716 100.392H51.466C53.1283 100.392 54.476 99.0448 54.476 97.3824Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-3)`}>
      <path d="M54.48 83.236H44.71V83.406H54.48V83.236Z" fill="currentColor"/>
      <path d="M54.48 83.406H44.71V83.576H54.48V83.406Z" fill="currentColor"/>
      <path d="M54.48 83.566H44.71V83.736H54.48V83.566Z" fill="currentColor"/>
      <path d="M54.48 83.736H44.71V83.906H54.48V83.736Z" fill="currentColor"/>
      <path d="M54.48 83.906H44.71V84.076H54.48V83.906Z" fill="currentColor"/>
      <path d="M54.48 84.066H44.71V84.236H54.48V84.066Z" fill="currentColor"/>
      <path d="M54.48 84.236H44.71V84.406H54.48V84.236Z" fill="currentColor"/>
      <path d="M54.48 84.406H44.71V84.576H54.48V84.406Z" fill="currentColor"/>
      <path d="M54.48 84.566H44.71V84.736H54.48V84.566Z" fill="currentColor"/>
      <path d="M54.48 84.736H44.71V84.906H54.48V84.736Z" fill="currentColor"/>
      <path d="M54.48 84.906H44.71V85.076H54.48V84.906Z" fill="currentColor"/>
      <path d="M54.48 85.066H44.71V85.236H54.48V85.066Z" fill="currentColor"/>
      <path d="M54.48 85.236H44.71V85.406H54.48V85.236Z" fill="currentColor"/>
      <path d="M54.48 85.406H44.71V85.576H54.48V85.406Z" fill="currentColor"/>
      <path d="M54.48 85.566H44.71V85.736H54.48V85.566Z" fill="currentColor"/>
      <path d="M54.48 85.736H44.71V85.906H54.48V85.736Z" fill="currentColor"/>
      <path d="M54.48 85.906H44.71V86.076H54.48V85.906Z" fill="currentColor"/>
      <path d="M54.48 86.066H44.71V86.236H54.48V86.066Z" fill="currentColor"/>
      <path d="M54.48 86.236H44.71V86.406H54.48V86.236Z" fill="currentColor"/>
      <path d="M54.48 86.406H44.71V86.576H54.48V86.406Z" fill="currentColor"/>
      <path d="M54.48 86.566H44.71V86.736H54.48V86.566Z" fill="currentColor"/>
      <path d="M54.48 86.736H44.71V86.906H54.48V86.736Z" fill="currentColor"/>
      <path d="M54.48 86.906H44.71V87.076H54.48V86.906Z" fill="currentColor"/>
      <path d="M54.48 87.066H44.71V87.236H54.48V87.066Z" fill="currentColor"/>
      <path d="M54.48 87.236H44.71V87.406H54.48V87.236Z" fill="currentColor"/>
      <path d="M54.48 87.406H44.71V87.576H54.48V87.406Z" fill="currentColor"/>
      <path d="M54.48 87.566H44.71V87.736H54.48V87.566Z" fill="currentColor"/>
      <path d="M54.48 87.736H44.71V87.906H54.48V87.736Z" fill="currentColor"/>
      <path d="M54.48 87.906H44.71V88.076H54.48V87.906Z" fill="currentColor"/>
      <path d="M54.48 88.066H44.71V88.236H54.48V88.066Z" fill="currentColor"/>
      <path d="M54.48 88.236H44.71V88.406H54.48V88.236Z" fill="currentColor"/>
      <path d="M54.48 88.406H44.71V88.576H54.48V88.406Z" fill="currentColor"/>
      <path d="M54.48 88.566H44.71V88.736H54.48V88.566Z" fill="currentColor"/>
      <path d="M54.48 88.736H44.71V88.906H54.48V88.736Z" fill="currentColor"/>
      <path d="M54.48 88.906H44.71V89.076H54.48V88.906Z" fill="currentColor"/>
      <path d="M54.48 89.066H44.71V89.236H54.48V89.066Z" fill="currentColor"/>
      <path d="M54.48 89.236H44.71V89.406H54.48V89.236Z" fill="currentColor"/>
      <path d="M54.48 89.406H44.71V89.576H54.48V89.406Z" fill="currentColor"/>
      <path d="M54.48 89.566H44.71V89.736H54.48V89.566Z" fill="currentColor"/>
      <path d="M54.48 89.736H44.71V89.906H54.48V89.736Z" fill="currentColor"/>
      <path d="M54.48 89.906H44.71V90.076H54.48V89.906Z" fill="currentColor"/>
      <path d="M54.48 90.066H44.71V90.236H54.48V90.066Z" fill="currentColor"/>
      <path d="M54.48 90.236H44.71V90.406H54.48V90.236Z" fill="currentColor"/>
      <path d="M54.48 90.396H44.71V90.566H54.48V90.396Z" fill="currentColor"/>
      <path d="M54.48 90.566H44.71V90.736H54.48V90.566Z" fill="currentColor"/>
      <path d="M54.48 90.736H44.71V90.906H54.48V90.736Z" fill="currentColor"/>
      <path d="M54.48 90.896H44.71V91.066H54.48V90.896Z" fill="currentColor"/>
      <path d="M54.48 91.066H44.71V91.236H54.48V91.066Z" fill="currentColor"/>
      <path d="M54.48 91.236H44.71V91.406H54.48V91.236Z" fill="currentColor"/>
      <path d="M54.48 91.396H44.71V91.566H54.48V91.396Z" fill="currentColor"/>
      <path d="M54.48 91.566H44.71V91.736H54.48V91.566Z" fill="currentColor"/>
      <path d="M54.48 91.736H44.71V91.906H54.48V91.736Z" fill="currentColor"/>
      <path d="M54.48 91.896H44.71V92.066H54.48V91.896Z" fill="currentColor"/>
      <path d="M54.48 92.066H44.71V92.236H54.48V92.066Z" fill="currentColor"/>
      <path d="M54.48 92.236H44.71V92.406H54.48V92.236Z" fill="currentColor"/>
      <path d="M54.48 92.396H44.71V92.566H54.48V92.396Z" fill="currentColor"/>
      <path d="M54.48 92.566H44.71V92.736H54.48V92.566Z" fill="currentColor"/>
      <path d="M54.48 92.736H44.71V92.906H54.48V92.736Z" fill="currentColor"/>
      <path d="M54.48 92.896H44.71V93.066H54.48V92.896Z" fill="currentColor"/>
      <path d="M54.48 93.066H44.71V93.236H54.48V93.066Z" fill="currentColor"/>
      <path d="M54.48 93.236H44.71V93.406H54.48V93.236Z" fill="currentColor"/>
      <path d="M54.48 93.396H44.71V93.566H54.48V93.396Z" fill="currentColor"/>
      <path d="M54.48 93.566H44.71V93.736H54.48V93.566Z" fill="currentColor"/>
      <path d="M54.48 93.736H44.71V93.906H54.48V93.736Z" fill="currentColor"/>
      <path d="M54.48 93.896H44.71V94.066H54.48V93.896Z" fill="currentColor"/>
      <path d="M54.48 94.066H44.71V94.236H54.48V94.066Z" fill="currentColor"/>
      <path d="M54.48 94.236H44.71V94.406H54.48V94.236Z" fill="currentColor"/>
      <path d="M54.48 94.396H44.71V94.566H54.48V94.396Z" fill="currentColor"/>
      <path d="M54.48 94.566H44.71V94.736H54.48V94.566Z" fill="currentColor"/>
      <path d="M54.48 94.736H44.71V94.906H54.48V94.736Z" fill="currentColor"/>
      <path d="M54.48 94.896H44.71V95.066H54.48V94.896Z" fill="currentColor"/>
      <path d="M54.48 95.066H44.71V95.236H54.48V95.066Z" fill="currentColor"/>
      <path d="M54.48 95.236H44.71V95.406H54.48V95.236Z" fill="currentColor"/>
      <path d="M54.48 95.396H44.71V95.566H54.48V95.396Z" fill="currentColor"/>
      <path d="M54.48 95.566H44.71V95.736H54.48V95.566Z" fill="currentColor"/>
      <path d="M54.48 95.736H44.71V95.906H54.48V95.736Z" fill="currentColor"/>
      <path d="M54.48 95.896H44.71V96.066H54.48V95.896Z" fill="currentColor"/>
      <path d="M54.48 96.066H44.71V96.236H54.48V96.066Z" fill="currentColor"/>
      <path d="M54.48 96.236H44.71V96.406H54.48V96.236Z" fill="currentColor"/>
      <path d="M54.48 96.396H44.71V96.566H54.48V96.396Z" fill="currentColor"/>
      <path d="M54.48 96.566H44.71V96.736H54.48V96.566Z" fill="currentColor"/>
      <path d="M54.48 96.736H44.71V96.906H54.48V96.736Z" fill="currentColor"/>
      <path d="M54.48 96.896H44.71V97.066H54.48V96.896Z" fill="currentColor"/>
      <path d="M54.48 97.066H44.71V97.236H54.48V97.066Z" fill="currentColor"/>
      <path d="M54.48 97.236H44.71V97.406H54.48V97.236Z" fill="currentColor"/>
      <path d="M54.48 97.396H44.71V97.566H54.48V97.396Z" fill="currentColor"/>
      <path d="M54.48 97.566H44.71V97.736H54.48V97.566Z" fill="currentColor"/>
      <path d="M54.48 97.736H44.71V97.906H54.48V97.736Z" fill="currentColor"/>
      <path d="M54.48 97.896H44.71V98.066H54.48V97.896Z" fill="currentColor"/>
      <path d="M54.48 98.066H44.71V98.236H54.48V98.066Z" fill="currentColor"/>
      <path d="M54.48 98.236H44.71V98.406H54.48V98.236Z" fill="currentColor"/>
      <path d="M54.48 98.396H44.71V98.566H54.48V98.396Z" fill="currentColor"/>
      <path d="M54.48 98.566H44.71V98.736H54.48V98.566Z" fill="currentColor"/>
      <path d="M54.48 98.736H44.71V98.906H54.48V98.736Z" fill="currentColor"/>
      <path d="M54.48 98.896H44.71V99.066H54.48V98.896Z" fill="currentColor"/>
      <path d="M54.48 99.066H44.71V99.236H54.48V99.066Z" fill="currentColor"/>
      <path d="M54.48 99.236H44.71V99.406H54.48V99.236Z" fill="currentColor"/>
      <path d="M54.48 99.396H44.71V99.566H54.48V99.396Z" fill="currentColor"/>
      <path d="M54.48 99.566H44.71V99.736H54.48V99.566Z" fill="currentColor"/>
      <path d="M54.48 99.736H44.71V99.906H54.48V99.736Z" fill="currentColor"/>
      <path d="M54.48 99.896H44.71V100.066H54.48V99.896Z" fill="currentColor"/>
      <path d="M54.48 100.066H44.71V100.236H54.48V100.066Z" fill="currentColor"/>
      <path d="M54.48 100.236H44.71V100.406H54.48V100.236Z" fill="currentColor"/>
      </g>
      <path d="M32.9 70.876C31.58 70.876 30.3 70.336 29.36 69.316C27.99 67.846 27.68 65.726 28.55 63.916L45.9499 27.886C46.7699 26.196 48.4399 25.146 50.3199 25.146C52.1999 25.146 53.87 26.196 54.68 27.886L72.0799 63.916C72.9599 65.726 72.64 67.846 71.28 69.316C69.91 70.796 67.8199 71.276 65.9499 70.536L50.3199 64.426L34.68 70.536C34.1 70.766 33.5 70.876 32.9 70.876ZM50.3199 32.236L34.87 64.216L48.55 58.866C49.69 58.426 50.9399 58.426 52.0799 58.866L65.76 64.216L50.3199 32.236Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Credit or debit card (source: Group-15.svg).
 */
export function CreditCardIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 106 67'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M97.89 66.48H8.10999C3.63999 66.48 0 62.84 0 58.37V8.11C0 3.64 3.63999 0 8.10999 0H97.89C102.36 0 106 3.64 106 8.11V58.37C106 62.84 102.36 66.48 97.89 66.48ZM8.10999 6C6.94999 6 6 6.95 6 8.11V58.37C6 59.53 6.94999 60.48 8.10999 60.48H97.89C99.05 60.48 100 59.53 100 58.37V8.11C100 6.95 99.05 6 97.89 6H8.10999Z" fill="currentColor"/>
      <path d="M102.82 19.53H3V29.88H102.82V19.53Z" fill="currentColor"/>
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="3" y="19" width="100" height="11">
      <path d="M102.82 19.53H3V29.88H102.82V19.53Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <path d="M3.97 19.53H3V29.88H3.97V19.53Z" fill="currentColor"/>
      <path d="M4.94 19.53H3.97V29.88H4.94V19.53Z" fill="currentColor"/>
      <path d="M5.90997 19.53H4.94V29.88H5.90997V19.53Z" fill="currentColor"/>
      <path d="M6.87997 19.53H5.90997V29.88H6.87997V19.53Z" fill="currentColor"/>
      <path d="M7.84998 19.53H6.87997V29.88H7.84998V19.53Z" fill="currentColor"/>
      <path d="M8.81998 19.53H7.84998V29.88H8.81998V19.53Z" fill="currentColor"/>
      <path d="M9.78998 19.53H8.81998V29.88H9.78998V19.53Z" fill="currentColor"/>
      <path d="M10.76 19.53H9.78998V29.88H10.76V19.53Z" fill="currentColor"/>
      <path d="M11.72 19.53H10.75V29.88H11.72V19.53Z" fill="currentColor"/>
      <path d="M12.69 19.53H11.72V29.88H12.69V19.53Z" fill="currentColor"/>
      <path d="M13.66 19.53H12.69V29.88H13.66V19.53Z" fill="currentColor"/>
      <path d="M14.63 19.53H13.66V29.88H14.63V19.53Z" fill="currentColor"/>
      <path d="M15.6 19.53H14.63V29.88H15.6V19.53Z" fill="currentColor"/>
      <path d="M16.57 19.53H15.6V29.88H16.57V19.53Z" fill="currentColor"/>
      <path d="M17.54 19.53H16.57V29.88H17.54V19.53Z" fill="currentColor"/>
      <path d="M18.51 19.53H17.54V29.88H18.51V19.53Z" fill="currentColor"/>
      <path d="M19.48 19.53H18.51V29.88H19.48V19.53Z" fill="currentColor"/>
      <path d="M20.45 19.53H19.48V29.88H20.45V19.53Z" fill="currentColor"/>
      <path d="M21.42 19.53H20.45V29.88H21.42V19.53Z" fill="currentColor"/>
      <path d="M22.38 19.53H21.41V29.88H22.38V19.53Z" fill="currentColor"/>
      <path d="M23.35 19.53H22.38V29.88H23.35V19.53Z" fill="currentColor"/>
      <path d="M24.32 19.53H23.35V29.88H24.32V19.53Z" fill="currentColor"/>
      <path d="M25.29 19.53H24.32V29.88H25.29V19.53Z" fill="currentColor"/>
      <path d="M26.26 19.53H25.29V29.88H26.26V19.53Z" fill="currentColor"/>
      <path d="M27.23 19.53H26.26V29.88H27.23V19.53Z" fill="currentColor"/>
      <path d="M28.2 19.53H27.23V29.88H28.2V19.53Z" fill="currentColor"/>
      <path d="M29.17 19.53H28.2V29.88H29.17V19.53Z" fill="currentColor"/>
      <path d="M30.14 19.53H29.17V29.88H30.14V19.53Z" fill="currentColor"/>
      <path d="M31.11 19.53H30.14V29.88H31.11V19.53Z" fill="currentColor"/>
      <path d="M32.08 19.53H31.11V29.88H32.08V19.53Z" fill="currentColor"/>
      <path d="M33.05 19.53H32.08V29.88H33.05V19.53Z" fill="currentColor"/>
      <path d="M34.01 19.53H33.04V29.88H34.01V19.53Z" fill="currentColor"/>
      <path d="M34.98 19.53H34.01V29.88H34.98V19.53Z" fill="currentColor"/>
      <path d="M35.95 19.53H34.98V29.88H35.95V19.53Z" fill="currentColor"/>
      <path d="M36.92 19.53H35.95V29.88H36.92V19.53Z" fill="currentColor"/>
      <path d="M37.89 19.53H36.92V29.88H37.89V19.53Z" fill="currentColor"/>
      <path d="M38.86 19.53H37.89V29.88H38.86V19.53Z" fill="currentColor"/>
      <path d="M39.83 19.53H38.86V29.88H39.83V19.53Z" fill="currentColor"/>
      <path d="M40.8 19.53H39.83V29.88H40.8V19.53Z" fill="currentColor"/>
      <path d="M41.77 19.53H40.8V29.88H41.77V19.53Z" fill="currentColor"/>
      <path d="M42.74 19.53H41.77V29.88H42.74V19.53Z" fill="currentColor"/>
      <path d="M43.71 19.53H42.74V29.88H43.71V19.53Z" fill="currentColor"/>
      <path d="M44.67 19.53H43.7V29.88H44.67V19.53Z" fill="currentColor"/>
      <path d="M45.64 19.53H44.67V29.88H45.64V19.53Z" fill="currentColor"/>
      <path d="M46.61 19.53H45.64V29.88H46.61V19.53Z" fill="currentColor"/>
      <path d="M47.58 19.53H46.61V29.88H47.58V19.53Z" fill="currentColor"/>
      <path d="M48.55 19.53H47.58V29.88H48.55V19.53Z" fill="currentColor"/>
      <path d="M49.52 19.53H48.55V29.88H49.52V19.53Z" fill="currentColor"/>
      <path d="M50.49 19.53H49.52V29.88H50.49V19.53Z" fill="currentColor"/>
      <path d="M51.46 19.53H50.49V29.88H51.46V19.53Z" fill="currentColor"/>
      <path d="M52.43 19.53H51.46V29.88H52.43V19.53Z" fill="currentColor"/>
      <path d="M53.4 19.53H52.43V29.88H53.4V19.53Z" fill="currentColor"/>
      <path d="M54.37 19.53H53.4V29.88H54.37V19.53Z" fill="currentColor"/>
      <path d="M55.33 19.53H54.36V29.88H55.33V19.53Z" fill="currentColor"/>
      <path d="M56.3 19.53H55.33V29.88H56.3V19.53Z" fill="currentColor"/>
      <path d="M57.27 19.53H56.3V29.88H57.27V19.53Z" fill="currentColor"/>
      <path d="M58.24 19.53H57.27V29.88H58.24V19.53Z" fill="currentColor"/>
      <path d="M59.21 19.53H58.24V29.88H59.21V19.53Z" fill="currentColor"/>
      <path d="M60.18 19.53H59.21V29.88H60.18V19.53Z" fill="currentColor"/>
      <path d="M61.15 19.53H60.18V29.88H61.15V19.53Z" fill="currentColor"/>
      <path d="M62.12 19.53H61.15V29.88H62.12V19.53Z" fill="currentColor"/>
      <path d="M63.09 19.53H62.12V29.88H63.09V19.53Z" fill="currentColor"/>
      <path d="M64.06 19.53H63.09V29.88H64.06V19.53Z" fill="currentColor"/>
      <path d="M65.03 19.53H64.06V29.88H65.03V19.53Z" fill="currentColor"/>
      <path d="M65.99 19.53H65.02V29.88H65.99V19.53Z" fill="currentColor"/>
      <path d="M66.96 19.53H65.99V29.88H66.96V19.53Z" fill="currentColor"/>
      <path d="M67.93 19.53H66.96V29.88H67.93V19.53Z" fill="currentColor"/>
      <path d="M68.9 19.53H67.93V29.88H68.9V19.53Z" fill="currentColor"/>
      <path d="M69.87 19.53H68.9V29.88H69.87V19.53Z" fill="currentColor"/>
      <path d="M70.84 19.53H69.87V29.88H70.84V19.53Z" fill="currentColor"/>
      <path d="M71.81 19.53H70.84V29.88H71.81V19.53Z" fill="currentColor"/>
      <path d="M72.78 19.53H71.81V29.88H72.78V19.53Z" fill="currentColor"/>
      <path d="M73.75 19.53H72.78V29.88H73.75V19.53Z" fill="currentColor"/>
      <path d="M74.72 19.53H73.75V29.88H74.72V19.53Z" fill="currentColor"/>
      <path d="M75.69 19.53H74.72V29.88H75.69V19.53Z" fill="currentColor"/>
      <path d="M76.65 19.53H75.68V29.88H76.65V19.53Z" fill="currentColor"/>
      <path d="M77.62 19.53H76.65V29.88H77.62V19.53Z" fill="currentColor"/>
      <path d="M78.59 19.53H77.62V29.88H78.59V19.53Z" fill="currentColor"/>
      <path d="M79.56 19.53H78.59V29.88H79.56V19.53Z" fill="currentColor"/>
      <path d="M80.53 19.53H79.56V29.88H80.53V19.53Z" fill="currentColor"/>
      <path d="M81.5 19.53H80.53V29.88H81.5V19.53Z" fill="currentColor"/>
      <path d="M82.47 19.53H81.5V29.88H82.47V19.53Z" fill="currentColor"/>
      <path d="M83.44 19.53H82.47V29.88H83.44V19.53Z" fill="currentColor"/>
      <path d="M84.41 19.53H83.44V29.88H84.41V19.53Z" fill="currentColor"/>
      <path d="M85.38 19.53H84.41V29.88H85.38V19.53Z" fill="currentColor"/>
      <path d="M86.35 19.53H85.38V29.88H86.35V19.53Z" fill="currentColor"/>
      <path d="M87.32 19.53H86.35V29.88H87.32V19.53Z" fill="currentColor"/>
      <path d="M88.28 19.53H87.31V29.88H88.28V19.53Z" fill="currentColor"/>
      <path d="M89.25 19.53H88.28V29.88H89.25V19.53Z" fill="currentColor"/>
      <path d="M90.22 19.53H89.25V29.88H90.22V19.53Z" fill="currentColor"/>
      <path d="M91.19 19.53H90.22V29.88H91.19V19.53Z" fill="currentColor"/>
      <path d="M92.16 19.53H91.19V29.88H92.16V19.53Z" fill="currentColor"/>
      <path d="M93.13 19.53H92.16V29.88H93.13V19.53Z" fill="currentColor"/>
      <path d="M94.1 19.53H93.13V29.88H94.1V19.53Z" fill="currentColor"/>
      <path d="M95.07 19.53H94.1V29.88H95.07V19.53Z" fill="currentColor"/>
      <path d="M96.04 19.53H95.07V29.88H96.04V19.53Z" fill="currentColor"/>
      <path d="M97.01 19.53H96.04V29.88H97.01V19.53Z" fill="currentColor"/>
      <path d="M97.98 19.53H97.01V29.88H97.98V19.53Z" fill="currentColor"/>
      <path d="M98.94 19.53H97.97V29.88H98.94V19.53Z" fill="currentColor"/>
      <path d="M99.91 19.53H98.94V29.88H99.91V19.53Z" fill="currentColor"/>
      <path d="M100.88 19.53H99.91V29.88H100.88V19.53Z" fill="currentColor"/>
      <path d="M101.85 19.53H100.88V29.88H101.85V19.53Z" fill="currentColor"/>
      <path d="M102.82 19.53H101.85V29.88H102.82V19.53Z" fill="currentColor"/>
      </g>
      <path d="M23.27 46.86C23.27 44.8386 21.6313 43.2 19.61 43.2C17.5886 43.2 15.95 44.8386 15.95 46.86C15.95 48.8814 17.5886 50.52 19.61 50.52C21.6313 50.52 23.27 48.8814 23.27 46.86Z" fill="currentColor"/>
      <mask id={`${id}-1`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="15" y="43" width="9" height="8">
      <path d="M23.27 46.86C23.27 44.8386 21.6313 43.2 19.61 43.2C17.5886 43.2 15.95 44.8386 15.95 46.86C15.95 48.8814 17.5886 50.52 19.61 50.52C21.6313 50.52 23.27 48.8814 23.27 46.86Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-1)`}>
      <path d="M16.02 43.2H15.95V50.52H16.02V43.2Z" fill="currentColor"/>
      <path d="M16.09 43.2H16.02V50.52H16.09V43.2Z" fill="currentColor"/>
      <path d="M16.16 43.2H16.09V50.52H16.16V43.2Z" fill="currentColor"/>
      <path d="M16.23 43.2H16.16V50.52H16.23V43.2Z" fill="currentColor"/>
      <path d="M16.3 43.2H16.23V50.52H16.3V43.2Z" fill="currentColor"/>
      <path d="M16.38 43.2H16.31V50.52H16.38V43.2Z" fill="currentColor"/>
      <path d="M16.45 43.2H16.38V50.52H16.45V43.2Z" fill="currentColor"/>
      <path d="M16.52 43.2H16.45V50.52H16.52V43.2Z" fill="currentColor"/>
      <path d="M16.59 43.2H16.52V50.52H16.59V43.2Z" fill="currentColor"/>
      <path d="M16.66 43.2H16.59V50.52H16.66V43.2Z" fill="currentColor"/>
      <path d="M16.73 43.2H16.66V50.52H16.73V43.2Z" fill="currentColor"/>
      <path d="M16.8 43.2H16.73V50.52H16.8V43.2Z" fill="currentColor"/>
      <path d="M16.87 43.2H16.8V50.52H16.87V43.2Z" fill="currentColor"/>
      <path d="M16.94 43.2H16.87V50.52H16.94V43.2Z" fill="currentColor"/>
      <path d="M17.01 43.2H16.94V50.52H17.01V43.2Z" fill="currentColor"/>
      <path d="M17.09 43.2H17.02V50.52H17.09V43.2Z" fill="currentColor"/>
      <path d="M17.16 43.2H17.09V50.52H17.16V43.2Z" fill="currentColor"/>
      <path d="M17.23 43.2H17.16V50.52H17.23V43.2Z" fill="currentColor"/>
      <path d="M17.3 43.2H17.23V50.52H17.3V43.2Z" fill="currentColor"/>
      <path d="M17.37 43.2H17.3V50.52H17.37V43.2Z" fill="currentColor"/>
      <path d="M17.44 43.2H17.37V50.52H17.44V43.2Z" fill="currentColor"/>
      <path d="M17.51 43.2H17.44V50.52H17.51V43.2Z" fill="currentColor"/>
      <path d="M17.58 43.2H17.51V50.52H17.58V43.2Z" fill="currentColor"/>
      <path d="M17.65 43.2H17.58V50.52H17.65V43.2Z" fill="currentColor"/>
      <path d="M17.73 43.2H17.66V50.52H17.73V43.2Z" fill="currentColor"/>
      <path d="M17.8 43.2H17.73V50.52H17.8V43.2Z" fill="currentColor"/>
      <path d="M17.87 43.2H17.8V50.52H17.87V43.2Z" fill="currentColor"/>
      <path d="M17.94 43.2H17.87V50.52H17.94V43.2Z" fill="currentColor"/>
      <path d="M18.01 43.2H17.94V50.52H18.01V43.2Z" fill="currentColor"/>
      <path d="M18.08 43.2H18.01V50.52H18.08V43.2Z" fill="currentColor"/>
      <path d="M18.15 43.2H18.08V50.52H18.15V43.2Z" fill="currentColor"/>
      <path d="M18.22 43.2H18.15V50.52H18.22V43.2Z" fill="currentColor"/>
      <path d="M18.29 43.2H18.22V50.52H18.29V43.2Z" fill="currentColor"/>
      <path d="M18.37 43.2H18.3V50.52H18.37V43.2Z" fill="currentColor"/>
      <path d="M18.44 43.2H18.37V50.52H18.44V43.2Z" fill="currentColor"/>
      <path d="M18.51 43.2H18.44V50.52H18.51V43.2Z" fill="currentColor"/>
      <path d="M18.58 43.2H18.51V50.52H18.58V43.2Z" fill="currentColor"/>
      <path d="M18.65 43.2H18.58V50.52H18.65V43.2Z" fill="currentColor"/>
      <path d="M18.72 43.2H18.65V50.52H18.72V43.2Z" fill="currentColor"/>
      <path d="M18.79 43.2H18.72V50.52H18.79V43.2Z" fill="currentColor"/>
      <path d="M18.86 43.2H18.79V50.52H18.86V43.2Z" fill="currentColor"/>
      <path d="M18.93 43.2H18.86V50.52H18.93V43.2Z" fill="currentColor"/>
      <path d="M19.01 43.2H18.94V50.52H19.01V43.2Z" fill="currentColor"/>
      <path d="M19.08 43.2H19.01V50.52H19.08V43.2Z" fill="currentColor"/>
      <path d="M19.15 43.2H19.08V50.52H19.15V43.2Z" fill="currentColor"/>
      <path d="M19.22 43.2H19.15V50.52H19.22V43.2Z" fill="currentColor"/>
      <path d="M19.29 43.2H19.22V50.52H19.29V43.2Z" fill="currentColor"/>
      <path d="M19.36 43.2H19.29V50.52H19.36V43.2Z" fill="currentColor"/>
      <path d="M19.43 43.2H19.36V50.52H19.43V43.2Z" fill="currentColor"/>
      <path d="M19.5 43.2H19.43V50.52H19.5V43.2Z" fill="currentColor"/>
      <path d="M19.57 43.2H19.5V50.52H19.57V43.2Z" fill="currentColor"/>
      <path d="M19.65 43.2H19.58V50.52H19.65V43.2Z" fill="currentColor"/>
      <path d="M19.72 43.2H19.65V50.52H19.72V43.2Z" fill="currentColor"/>
      <path d="M19.79 43.2H19.72V50.52H19.79V43.2Z" fill="currentColor"/>
      <path d="M19.86 43.2H19.79V50.52H19.86V43.2Z" fill="currentColor"/>
      <path d="M19.93 43.2H19.86V50.52H19.93V43.2Z" fill="currentColor"/>
      <path d="M20 43.2H19.93V50.52H20V43.2Z" fill="currentColor"/>
      <path d="M20.07 43.2H20V50.52H20.07V43.2Z" fill="currentColor"/>
      <path d="M20.14 43.2H20.07V50.52H20.14V43.2Z" fill="currentColor"/>
      <path d="M20.21 43.2H20.14V50.52H20.21V43.2Z" fill="currentColor"/>
      <path d="M20.28 43.2H20.21V50.52H20.28V43.2Z" fill="currentColor"/>
      <path d="M20.36 43.2H20.29V50.52H20.36V43.2Z" fill="currentColor"/>
      <path d="M20.43 43.2H20.36V50.52H20.43V43.2Z" fill="currentColor"/>
      <path d="M20.5 43.2H20.43V50.52H20.5V43.2Z" fill="currentColor"/>
      <path d="M20.57 43.2H20.5V50.52H20.57V43.2Z" fill="currentColor"/>
      <path d="M20.64 43.2H20.57V50.52H20.64V43.2Z" fill="currentColor"/>
      <path d="M20.71 43.2H20.64V50.52H20.71V43.2Z" fill="currentColor"/>
      <path d="M20.78 43.2H20.71V50.52H20.78V43.2Z" fill="currentColor"/>
      <path d="M20.85 43.2H20.78V50.52H20.85V43.2Z" fill="currentColor"/>
      <path d="M20.92 43.2H20.85V50.52H20.92V43.2Z" fill="currentColor"/>
      <path d="M21 43.2H20.93V50.52H21V43.2Z" fill="currentColor"/>
      <path d="M21.07 43.2H21V50.52H21.07V43.2Z" fill="currentColor"/>
      <path d="M21.14 43.2H21.07V50.52H21.14V43.2Z" fill="currentColor"/>
      <path d="M21.21 43.2H21.14V50.52H21.21V43.2Z" fill="currentColor"/>
      <path d="M21.28 43.2H21.21V50.52H21.28V43.2Z" fill="currentColor"/>
      <path d="M21.35 43.2H21.28V50.52H21.35V43.2Z" fill="currentColor"/>
      <path d="M21.42 43.2H21.35V50.52H21.42V43.2Z" fill="currentColor"/>
      <path d="M21.49 43.2H21.42V50.52H21.49V43.2Z" fill="currentColor"/>
      <path d="M21.56 43.2H21.49V50.52H21.56V43.2Z" fill="currentColor"/>
      <path d="M21.64 43.2H21.57V50.52H21.64V43.2Z" fill="currentColor"/>
      <path d="M21.71 43.2H21.64V50.52H21.71V43.2Z" fill="currentColor"/>
      <path d="M21.78 43.2H21.71V50.52H21.78V43.2Z" fill="currentColor"/>
      <path d="M21.85 43.2H21.78V50.52H21.85V43.2Z" fill="currentColor"/>
      <path d="M21.92 43.2H21.85V50.52H21.92V43.2Z" fill="currentColor"/>
      <path d="M21.99 43.2H21.92V50.52H21.99V43.2Z" fill="currentColor"/>
      <path d="M22.06 43.2H21.99V50.52H22.06V43.2Z" fill="currentColor"/>
      <path d="M22.13 43.2H22.06V50.52H22.13V43.2Z" fill="currentColor"/>
      <path d="M22.2 43.2H22.13V50.52H22.2V43.2Z" fill="currentColor"/>
      <path d="M22.28 43.2H22.21V50.52H22.28V43.2Z" fill="currentColor"/>
      <path d="M22.35 43.2H22.28V50.52H22.35V43.2Z" fill="currentColor"/>
      <path d="M22.42 43.2H22.35V50.52H22.42V43.2Z" fill="currentColor"/>
      <path d="M22.49 43.2H22.42V50.52H22.49V43.2Z" fill="currentColor"/>
      <path d="M22.56 43.2H22.49V50.52H22.56V43.2Z" fill="currentColor"/>
      <path d="M22.63 43.2H22.56V50.52H22.63V43.2Z" fill="currentColor"/>
      <path d="M22.7 43.2H22.63V50.52H22.7V43.2Z" fill="currentColor"/>
      <path d="M22.77 43.2H22.7V50.52H22.77V43.2Z" fill="currentColor"/>
      <path d="M22.84 43.2H22.77V50.52H22.84V43.2Z" fill="currentColor"/>
      <path d="M22.91 43.2H22.84V50.52H22.91V43.2Z" fill="currentColor"/>
      <path d="M22.99 43.2H22.92V50.52H22.99V43.2Z" fill="currentColor"/>
      <path d="M23.06 43.2H22.99V50.52H23.06V43.2Z" fill="currentColor"/>
      <path d="M23.13 43.2H23.06V50.52H23.13V43.2Z" fill="currentColor"/>
      <path d="M23.2 43.2H23.13V50.52H23.2V43.2Z" fill="currentColor"/>
      <path d="M23.27 43.2H23.2V50.52H23.27V43.2Z" fill="currentColor"/>
      </g>
      <path d="M36.55 46.86C36.55 44.8386 34.9113 43.2 32.89 43.2C30.8686 43.2 29.23 44.8386 29.23 46.86C29.23 48.8814 30.8686 50.52 32.89 50.52C34.9113 50.52 36.55 48.8814 36.55 46.86Z" fill="currentColor"/>
      <mask id={`${id}-2`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="29" y="43" width="8" height="8">
      <path d="M36.55 46.86C36.55 44.8386 34.9113 43.2 32.89 43.2C30.8686 43.2 29.23 44.8386 29.23 46.86C29.23 48.8814 30.8686 50.52 32.89 50.52C34.9113 50.52 36.55 48.8814 36.55 46.86Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-2)`}>
      <path d="M29.3 43.2H29.23V50.52H29.3V43.2Z" fill="currentColor"/>
      <path d="M29.37 43.2H29.3V50.52H29.37V43.2Z" fill="currentColor"/>
      <path d="M29.44 43.2H29.37V50.52H29.44V43.2Z" fill="currentColor"/>
      <path d="M29.51 43.2H29.44V50.52H29.51V43.2Z" fill="currentColor"/>
      <path d="M29.59 43.2H29.52V50.52H29.59V43.2Z" fill="currentColor"/>
      <path d="M29.66 43.2H29.59V50.52H29.66V43.2Z" fill="currentColor"/>
      <path d="M29.73 43.2H29.66V50.52H29.73V43.2Z" fill="currentColor"/>
      <path d="M29.8 43.2H29.73V50.52H29.8V43.2Z" fill="currentColor"/>
      <path d="M29.87 43.2H29.8V50.52H29.87V43.2Z" fill="currentColor"/>
      <path d="M29.94 43.2H29.87V50.52H29.94V43.2Z" fill="currentColor"/>
      <path d="M30.01 43.2H29.94V50.52H30.01V43.2Z" fill="currentColor"/>
      <path d="M30.08 43.2H30.01V50.52H30.08V43.2Z" fill="currentColor"/>
      <path d="M30.15 43.2H30.08V50.52H30.15V43.2Z" fill="currentColor"/>
      <path d="M30.23 43.2H30.16V50.52H30.23V43.2Z" fill="currentColor"/>
      <path d="M30.3 43.2H30.23V50.52H30.3V43.2Z" fill="currentColor"/>
      <path d="M30.37 43.2H30.3V50.52H30.37V43.2Z" fill="currentColor"/>
      <path d="M30.44 43.2H30.37V50.52H30.44V43.2Z" fill="currentColor"/>
      <path d="M30.51 43.2H30.44V50.52H30.51V43.2Z" fill="currentColor"/>
      <path d="M30.58 43.2H30.51V50.52H30.58V43.2Z" fill="currentColor"/>
      <path d="M30.65 43.2H30.58V50.52H30.65V43.2Z" fill="currentColor"/>
      <path d="M30.72 43.2H30.65V50.52H30.72V43.2Z" fill="currentColor"/>
      <path d="M30.79 43.2H30.72V50.52H30.79V43.2Z" fill="currentColor"/>
      <path d="M30.87 43.2H30.8V50.52H30.87V43.2Z" fill="currentColor"/>
      <path d="M30.94 43.2H30.87V50.52H30.94V43.2Z" fill="currentColor"/>
      <path d="M31.01 43.2H30.94V50.52H31.01V43.2Z" fill="currentColor"/>
      <path d="M31.08 43.2H31.01V50.52H31.08V43.2Z" fill="currentColor"/>
      <path d="M31.15 43.2H31.08V50.52H31.15V43.2Z" fill="currentColor"/>
      <path d="M31.22 43.2H31.15V50.52H31.22V43.2Z" fill="currentColor"/>
      <path d="M31.29 43.2H31.22V50.52H31.29V43.2Z" fill="currentColor"/>
      <path d="M31.36 43.2H31.29V50.52H31.36V43.2Z" fill="currentColor"/>
      <path d="M31.43 43.2H31.36V50.52H31.43V43.2Z" fill="currentColor"/>
      <path d="M31.51 43.2H31.44V50.52H31.51V43.2Z" fill="currentColor"/>
      <path d="M31.58 43.2H31.51V50.52H31.58V43.2Z" fill="currentColor"/>
      <path d="M31.65 43.2H31.58V50.52H31.65V43.2Z" fill="currentColor"/>
      <path d="M31.72 43.2H31.65V50.52H31.72V43.2Z" fill="currentColor"/>
      <path d="M31.79 43.2H31.72V50.52H31.79V43.2Z" fill="currentColor"/>
      <path d="M31.86 43.2H31.79V50.52H31.86V43.2Z" fill="currentColor"/>
      <path d="M31.93 43.2H31.86V50.52H31.93V43.2Z" fill="currentColor"/>
      <path d="M32 43.2H31.93V50.52H32V43.2Z" fill="currentColor"/>
      <path d="M32.07 43.2H32V50.52H32.07V43.2Z" fill="currentColor"/>
      <path d="M32.14 43.2H32.07V50.52H32.14V43.2Z" fill="currentColor"/>
      <path d="M32.22 43.2H32.15V50.52H32.22V43.2Z" fill="currentColor"/>
      <path d="M32.29 43.2H32.22V50.52H32.29V43.2Z" fill="currentColor"/>
      <path d="M32.36 43.2H32.29V50.52H32.36V43.2Z" fill="currentColor"/>
      <path d="M32.43 43.2H32.36V50.52H32.43V43.2Z" fill="currentColor"/>
      <path d="M32.5 43.2H32.43V50.52H32.5V43.2Z" fill="currentColor"/>
      <path d="M32.57 43.2H32.5V50.52H32.57V43.2Z" fill="currentColor"/>
      <path d="M32.64 43.2H32.57V50.52H32.64V43.2Z" fill="currentColor"/>
      <path d="M32.71 43.2H32.64V50.52H32.71V43.2Z" fill="currentColor"/>
      <path d="M32.78 43.2H32.71V50.52H32.78V43.2Z" fill="currentColor"/>
      <path d="M32.86 43.2H32.79V50.52H32.86V43.2Z" fill="currentColor"/>
      <path d="M32.93 43.2H32.86V50.52H32.93V43.2Z" fill="currentColor"/>
      <path d="M33 43.2H32.93V50.52H33V43.2Z" fill="currentColor"/>
      <path d="M33.07 43.2H33V50.52H33.07V43.2Z" fill="currentColor"/>
      <path d="M33.14 43.2H33.07V50.52H33.14V43.2Z" fill="currentColor"/>
      <path d="M33.21 43.2H33.14V50.52H33.21V43.2Z" fill="currentColor"/>
      <path d="M33.28 43.2H33.21V50.52H33.28V43.2Z" fill="currentColor"/>
      <path d="M33.35 43.2H33.28V50.52H33.35V43.2Z" fill="currentColor"/>
      <path d="M33.42 43.2H33.35V50.52H33.42V43.2Z" fill="currentColor"/>
      <path d="M33.5 43.2H33.43V50.52H33.5V43.2Z" fill="currentColor"/>
      <path d="M33.57 43.2H33.5V50.52H33.57V43.2Z" fill="currentColor"/>
      <path d="M33.64 43.2H33.57V50.52H33.64V43.2Z" fill="currentColor"/>
      <path d="M33.71 43.2H33.64V50.52H33.71V43.2Z" fill="currentColor"/>
      <path d="M33.78 43.2H33.71V50.52H33.78V43.2Z" fill="currentColor"/>
      <path d="M33.85 43.2H33.78V50.52H33.85V43.2Z" fill="currentColor"/>
      <path d="M33.92 43.2H33.85V50.52H33.92V43.2Z" fill="currentColor"/>
      <path d="M33.99 43.2H33.92V50.52H33.99V43.2Z" fill="currentColor"/>
      <path d="M34.06 43.2H33.99V50.52H34.06V43.2Z" fill="currentColor"/>
      <path d="M34.14 43.2H34.07V50.52H34.14V43.2Z" fill="currentColor"/>
      <path d="M34.21 43.2H34.14V50.52H34.21V43.2Z" fill="currentColor"/>
      <path d="M34.28 43.2H34.21V50.52H34.28V43.2Z" fill="currentColor"/>
      <path d="M34.35 43.2H34.28V50.52H34.35V43.2Z" fill="currentColor"/>
      <path d="M34.42 43.2H34.35V50.52H34.42V43.2Z" fill="currentColor"/>
      <path d="M34.49 43.2H34.42V50.52H34.49V43.2Z" fill="currentColor"/>
      <path d="M34.56 43.2H34.49V50.52H34.56V43.2Z" fill="currentColor"/>
      <path d="M34.63 43.2H34.56V50.52H34.63V43.2Z" fill="currentColor"/>
      <path d="M34.7 43.2H34.63V50.52H34.7V43.2Z" fill="currentColor"/>
      <path d="M34.77 43.2H34.7V50.52H34.77V43.2Z" fill="currentColor"/>
      <path d="M34.85 43.2H34.78V50.52H34.85V43.2Z" fill="currentColor"/>
      <path d="M34.92 43.2H34.85V50.52H34.92V43.2Z" fill="currentColor"/>
      <path d="M34.99 43.2H34.92V50.52H34.99V43.2Z" fill="currentColor"/>
      <path d="M35.06 43.2H34.99V50.52H35.06V43.2Z" fill="currentColor"/>
      <path d="M35.13 43.2H35.06V50.52H35.13V43.2Z" fill="currentColor"/>
      <path d="M35.2 43.2H35.13V50.52H35.2V43.2Z" fill="currentColor"/>
      <path d="M35.27 43.2H35.2V50.52H35.27V43.2Z" fill="currentColor"/>
      <path d="M35.34 43.2H35.27V50.52H35.34V43.2Z" fill="currentColor"/>
      <path d="M35.41 43.2H35.34V50.52H35.41V43.2Z" fill="currentColor"/>
      <path d="M35.49 43.2H35.42V50.52H35.49V43.2Z" fill="currentColor"/>
      <path d="M35.56 43.2H35.49V50.52H35.56V43.2Z" fill="currentColor"/>
      <path d="M35.63 43.2H35.56V50.52H35.63V43.2Z" fill="currentColor"/>
      <path d="M35.7 43.2H35.63V50.52H35.7V43.2Z" fill="currentColor"/>
      <path d="M35.77 43.2H35.7V50.52H35.77V43.2Z" fill="currentColor"/>
      <path d="M35.84 43.2H35.77V50.52H35.84V43.2Z" fill="currentColor"/>
      <path d="M35.91 43.2H35.84V50.52H35.91V43.2Z" fill="currentColor"/>
      <path d="M35.98 43.2H35.91V50.52H35.98V43.2Z" fill="currentColor"/>
      <path d="M36.05 43.2H35.98V50.52H36.05V43.2Z" fill="currentColor"/>
      <path d="M36.13 43.2H36.06V50.52H36.13V43.2Z" fill="currentColor"/>
      <path d="M36.2 43.2H36.13V50.52H36.2V43.2Z" fill="currentColor"/>
      <path d="M36.27 43.2H36.2V50.52H36.27V43.2Z" fill="currentColor"/>
      <path d="M36.34 43.2H36.27V50.52H36.34V43.2Z" fill="currentColor"/>
      <path d="M36.41 43.2H36.34V50.52H36.41V43.2Z" fill="currentColor"/>
      <path d="M36.48 43.2H36.41V50.52H36.48V43.2Z" fill="currentColor"/>
      <path d="M36.55 43.2H36.48V50.52H36.55V43.2Z" fill="currentColor"/>
      </g>
      <path d="M49.83 46.86C49.83 44.8386 48.1913 43.2 46.17 43.2C44.1486 43.2 42.51 44.8386 42.51 46.86C42.51 48.8814 44.1486 50.52 46.17 50.52C48.1913 50.52 49.83 48.8814 49.83 46.86Z" fill="currentColor"/>
      <mask id={`${id}-3`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="42" y="43" width="8" height="8">
      <path d="M49.83 46.86C49.83 44.8386 48.1913 43.2 46.17 43.2C44.1486 43.2 42.51 44.8386 42.51 46.86C42.51 48.8814 44.1486 50.52 46.17 50.52C48.1913 50.52 49.83 48.8814 49.83 46.86Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-3)`}>
      <path d="M42.58 43.2H42.51V50.52H42.58V43.2Z" fill="currentColor"/>
      <path d="M42.65 43.2H42.58V50.52H42.65V43.2Z" fill="currentColor"/>
      <path d="M42.73 43.2H42.66V50.52H42.73V43.2Z" fill="currentColor"/>
      <path d="M42.8 43.2H42.73V50.52H42.8V43.2Z" fill="currentColor"/>
      <path d="M42.87 43.2H42.8V50.52H42.87V43.2Z" fill="currentColor"/>
      <path d="M42.94 43.2H42.87V50.52H42.94V43.2Z" fill="currentColor"/>
      <path d="M43.01 43.2H42.94V50.52H43.01V43.2Z" fill="currentColor"/>
      <path d="M43.08 43.2H43.01V50.52H43.08V43.2Z" fill="currentColor"/>
      <path d="M43.15 43.2H43.08V50.52H43.15V43.2Z" fill="currentColor"/>
      <path d="M43.22 43.2H43.15V50.52H43.22V43.2Z" fill="currentColor"/>
      <path d="M43.29 43.2H43.22V50.52H43.29V43.2Z" fill="currentColor"/>
      <path d="M43.37 43.2H43.3V50.52H43.37V43.2Z" fill="currentColor"/>
      <path d="M43.44 43.2H43.37V50.52H43.44V43.2Z" fill="currentColor"/>
      <path d="M43.51 43.2H43.44V50.52H43.51V43.2Z" fill="currentColor"/>
      <path d="M43.58 43.2H43.51V50.52H43.58V43.2Z" fill="currentColor"/>
      <path d="M43.65 43.2H43.58V50.52H43.65V43.2Z" fill="currentColor"/>
      <path d="M43.72 43.2H43.65V50.52H43.72V43.2Z" fill="currentColor"/>
      <path d="M43.79 43.2H43.72V50.52H43.79V43.2Z" fill="currentColor"/>
      <path d="M43.86 43.2H43.79V50.52H43.86V43.2Z" fill="currentColor"/>
      <path d="M43.93 43.2H43.86V50.52H43.93V43.2Z" fill="currentColor"/>
      <path d="M44.01 43.2H43.94V50.52H44.01V43.2Z" fill="currentColor"/>
      <path d="M44.08 43.2H44.01V50.52H44.08V43.2Z" fill="currentColor"/>
      <path d="M44.15 43.2H44.08V50.52H44.15V43.2Z" fill="currentColor"/>
      <path d="M44.22 43.2H44.15V50.52H44.22V43.2Z" fill="currentColor"/>
      <path d="M44.29 43.2H44.22V50.52H44.29V43.2Z" fill="currentColor"/>
      <path d="M44.36 43.2H44.29V50.52H44.36V43.2Z" fill="currentColor"/>
      <path d="M44.43 43.2H44.36V50.52H44.43V43.2Z" fill="currentColor"/>
      <path d="M44.5 43.2H44.43V50.52H44.5V43.2Z" fill="currentColor"/>
      <path d="M44.57 43.2H44.5V50.52H44.57V43.2Z" fill="currentColor"/>
      <path d="M44.64 43.2H44.57V50.52H44.64V43.2Z" fill="currentColor"/>
      <path d="M44.72 43.2H44.65V50.52H44.72V43.2Z" fill="currentColor"/>
      <path d="M44.79 43.2H44.72V50.52H44.79V43.2Z" fill="currentColor"/>
      <path d="M44.86 43.2H44.79V50.52H44.86V43.2Z" fill="currentColor"/>
      <path d="M44.93 43.2H44.86V50.52H44.93V43.2Z" fill="currentColor"/>
      <path d="M45 43.2H44.93V50.52H45V43.2Z" fill="currentColor"/>
      <path d="M45.07 43.2H45V50.52H45.07V43.2Z" fill="currentColor"/>
      <path d="M45.14 43.2H45.07V50.52H45.14V43.2Z" fill="currentColor"/>
      <path d="M45.21 43.2H45.14V50.52H45.21V43.2Z" fill="currentColor"/>
      <path d="M45.28 43.2H45.21V50.52H45.28V43.2Z" fill="currentColor"/>
      <path d="M45.36 43.2H45.29V50.52H45.36V43.2Z" fill="currentColor"/>
      <path d="M45.43 43.2H45.36V50.52H45.43V43.2Z" fill="currentColor"/>
      <path d="M45.5 43.2H45.43V50.52H45.5V43.2Z" fill="currentColor"/>
      <path d="M45.57 43.2H45.5V50.52H45.57V43.2Z" fill="currentColor"/>
      <path d="M45.64 43.2H45.57V50.52H45.64V43.2Z" fill="currentColor"/>
      <path d="M45.71 43.2H45.64V50.52H45.71V43.2Z" fill="currentColor"/>
      <path d="M45.78 43.2H45.71V50.52H45.78V43.2Z" fill="currentColor"/>
      <path d="M45.85 43.2H45.78V50.52H45.85V43.2Z" fill="currentColor"/>
      <path d="M45.92 43.2H45.85V50.52H45.92V43.2Z" fill="currentColor"/>
      <path d="M46 43.2H45.93V50.52H46V43.2Z" fill="currentColor"/>
      <path d="M46.07 43.2H46V50.52H46.07V43.2Z" fill="currentColor"/>
      <path d="M46.14 43.2H46.07V50.52H46.14V43.2Z" fill="currentColor"/>
      <path d="M46.21 43.2H46.14V50.52H46.21V43.2Z" fill="currentColor"/>
      <path d="M46.28 43.2H46.21V50.52H46.28V43.2Z" fill="currentColor"/>
      <path d="M46.35 43.2H46.28V50.52H46.35V43.2Z" fill="currentColor"/>
      <path d="M46.42 43.2H46.35V50.52H46.42V43.2Z" fill="currentColor"/>
      <path d="M46.49 43.2H46.42V50.52H46.49V43.2Z" fill="currentColor"/>
      <path d="M46.56 43.2H46.49V50.52H46.56V43.2Z" fill="currentColor"/>
      <path d="M46.64 43.2H46.57V50.52H46.64V43.2Z" fill="currentColor"/>
      <path d="M46.71 43.2H46.64V50.52H46.71V43.2Z" fill="currentColor"/>
      <path d="M46.78 43.2H46.71V50.52H46.78V43.2Z" fill="currentColor"/>
      <path d="M46.85 43.2H46.78V50.52H46.85V43.2Z" fill="currentColor"/>
      <path d="M46.92 43.2H46.85V50.52H46.92V43.2Z" fill="currentColor"/>
      <path d="M46.99 43.2H46.92V50.52H46.99V43.2Z" fill="currentColor"/>
      <path d="M47.06 43.2H46.99V50.52H47.06V43.2Z" fill="currentColor"/>
      <path d="M47.13 43.2H47.06V50.52H47.13V43.2Z" fill="currentColor"/>
      <path d="M47.2 43.2H47.13V50.52H47.2V43.2Z" fill="currentColor"/>
      <path d="M47.27 43.2H47.2V50.52H47.27V43.2Z" fill="currentColor"/>
      <path d="M47.35 43.2H47.28V50.52H47.35V43.2Z" fill="currentColor"/>
      <path d="M47.42 43.2H47.35V50.52H47.42V43.2Z" fill="currentColor"/>
      <path d="M47.49 43.2H47.42V50.52H47.49V43.2Z" fill="currentColor"/>
      <path d="M47.56 43.2H47.49V50.52H47.56V43.2Z" fill="currentColor"/>
      <path d="M47.63 43.2H47.56V50.52H47.63V43.2Z" fill="currentColor"/>
      <path d="M47.7 43.2H47.63V50.52H47.7V43.2Z" fill="currentColor"/>
      <path d="M47.77 43.2H47.7V50.52H47.77V43.2Z" fill="currentColor"/>
      <path d="M47.84 43.2H47.77V50.52H47.84V43.2Z" fill="currentColor"/>
      <path d="M47.91 43.2H47.84V50.52H47.91V43.2Z" fill="currentColor"/>
      <path d="M47.99 43.2H47.92V50.52H47.99V43.2Z" fill="currentColor"/>
      <path d="M48.06 43.2H47.99V50.52H48.06V43.2Z" fill="currentColor"/>
      <path d="M48.13 43.2H48.06V50.52H48.13V43.2Z" fill="currentColor"/>
      <path d="M48.2 43.2H48.13V50.52H48.2V43.2Z" fill="currentColor"/>
      <path d="M48.27 43.2H48.2V50.52H48.27V43.2Z" fill="currentColor"/>
      <path d="M48.34 43.2H48.27V50.52H48.34V43.2Z" fill="currentColor"/>
      <path d="M48.41 43.2H48.34V50.52H48.41V43.2Z" fill="currentColor"/>
      <path d="M48.48 43.2H48.41V50.52H48.48V43.2Z" fill="currentColor"/>
      <path d="M48.55 43.2H48.48V50.52H48.55V43.2Z" fill="currentColor"/>
      <path d="M48.63 43.2H48.56V50.52H48.63V43.2Z" fill="currentColor"/>
      <path d="M48.7 43.2H48.63V50.52H48.7V43.2Z" fill="currentColor"/>
      <path d="M48.77 43.2H48.7V50.52H48.77V43.2Z" fill="currentColor"/>
      <path d="M48.84 43.2H48.77V50.52H48.84V43.2Z" fill="currentColor"/>
      <path d="M48.91 43.2H48.84V50.52H48.91V43.2Z" fill="currentColor"/>
      <path d="M48.98 43.2H48.91V50.52H48.98V43.2Z" fill="currentColor"/>
      <path d="M49.05 43.2H48.98V50.52H49.05V43.2Z" fill="currentColor"/>
      <path d="M49.12 43.2H49.05V50.52H49.12V43.2Z" fill="currentColor"/>
      <path d="M49.19 43.2H49.12V50.52H49.19V43.2Z" fill="currentColor"/>
      <path d="M49.27 43.2H49.2V50.52H49.27V43.2Z" fill="currentColor"/>
      <path d="M49.34 43.2H49.27V50.52H49.34V43.2Z" fill="currentColor"/>
      <path d="M49.41 43.2H49.34V50.52H49.41V43.2Z" fill="currentColor"/>
      <path d="M49.48 43.2H49.41V50.52H49.48V43.2Z" fill="currentColor"/>
      <path d="M49.55 43.2H49.48V50.52H49.55V43.2Z" fill="currentColor"/>
      <path d="M49.62 43.2H49.55V50.52H49.62V43.2Z" fill="currentColor"/>
      <path d="M49.69 43.2H49.62V50.52H49.69V43.2Z" fill="currentColor"/>
      <path d="M49.76 43.2H49.69V50.52H49.76V43.2Z" fill="currentColor"/>
      <path d="M49.83 43.2H49.76V50.52H49.83V43.2Z" fill="currentColor"/>
      </g>
    </svg>
  )
}

/**
 * Document with clock (source: Group-27.svg).
 */
export function DocumentClockIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 103 91'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M52.75 27.24H24.16C23.19 27.24 22.11 26.77 21.66 26.16C20.84 25.07 20.61 23.89 21.19 22.7C21.59 21.87 22.58 20.82 23.97 20.82H52.95C54.33 20.82 55.33 21.87 55.73 22.7C56.31 23.89 56.08 25.07 55.26 26.16C54.8 26.77 53.72 27.24 52.75 27.24Z" fill="currentColor"/>
      <path d="M43.04 42.75H24.16C23.19 42.75 22.11 42.28 21.66 41.67C20.84 40.58 20.61 39.41 21.19 38.21C21.59 37.38 22.58 36.33 23.97 36.33H43.24C44.62 36.33 45.62 37.38 46.02 38.21C46.6 39.41 46.37 40.58 45.55 41.67C45.09 42.28 44.01 42.75 43.04 42.75Z" fill="currentColor"/>
      <path d="M33.04 58.26H24.16C23.19 58.26 22.11 57.8 21.66 57.18C20.84 56.09 20.61 54.92 21.19 53.72C21.59 52.89 22.58 51.85 23.97 51.85H33.24C34.62 51.85 35.62 52.89 36.02 53.72C36.6 54.92 36.37 56.09 35.55 57.18C35.09 57.8 34.01 58.26 33.04 58.26Z" fill="currentColor"/>
      <path d="M50.78 90.55H16.9C7.57996 90.55 0 82.97 0 73.66V16.89C0 7.57998 7.57996 0 16.9 0H60.78C70.09 0 77.67 7.57998 77.67 16.89V23.5C77.67 25.16 76.33 26.5 74.67 26.5C73.01 26.5 71.67 25.16 71.67 23.5V16.89C71.67 10.89 66.78 6 60.78 6H16.9C10.89 6 6 10.89 6 16.89V73.66C6 79.66 10.89 84.55 16.9 84.55H50.78C52.43 84.55 53.78 85.89 53.78 87.55C53.78 89.21 52.43 90.55 50.78 90.55Z" fill="currentColor"/>
      <path d="M73.31 89.61L71.91 89.51C65.88 88.91 60.28 86.41 55.78 82.4C50.18 77.42 46.69 70.11 46.36 62.62C46.03 55.13 48.62 47.98 53.53 42.44C58.44 36.9 65.14 33.62 72.14 33.07L73.25 32.98H76.36C83.07 33.42 89.38 36.14 94.22 40.79L95.2 41.77C99.97 46.54 102.61 53.01 103 59.75V62.85C102.17 77.26 90.79 88.69 76.36 89.6H73.31V89.61ZM90.22 78.41C92.11 76.67 93.65 74.8 94.89 72.56C96.57 69.51 97.55 66.23 97.78 62.74C98.24 55.72 95.37 48.72 90.12 44.05C81.3 36.2 67.99 36.19 59.22 44.12C58.55 44.64 58.04 45.15 57.52 45.82C53.34 50.39 51.18 56.67 51.62 62.87C52.44 74.44 61.57 83.57 73.12 84.37C79.35 84.8 85.65 82.62 90.22 78.41Z" fill="currentColor"/>
      <path d="M80.83 71.12L72.68 62.96C72.25 62.52 72.21 61.96 72.03 61.37L72.08 45.78C72.08 44.31 73.32 43.27 74.65 43.25C75.98 43.23 77.3 44.28 77.31 45.78L77.36 60.27L84.46 67.44C85.37 68.36 85.05 70 84.24 70.76C83.36 71.73 82.03 71.83 80.83 71.12Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Document with question mark (source: Group-4.svg).
 */
export function DocumentQuestionIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 86 100'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M45.66 100H9.43005C4.45005 99.25 0.74 95.54 0 90.57V9.43C0.72 4.52 4.30004 0.99 8.98004 0H48.2401C48.6101 0.33 49.23 0.31 49.75 0.43C51.92 0.95 53.45 2.33 54.97 3.78L58.79 7.41L62.3 10.74L66.01 14.26L69.53 17.59L73.9 21.95C75.28 23.33 75.71 25.11 76.17 27.04V49.4C76.17 51.04 74.84 52.36 73.2 52.35C71.58 52.33 70.28 51.02 70.28 49.4L70.32 29.29H51.58C48.52 28.81 46.18 26.48 45.7 23.42V5.84L10.58 5.9C8.15002 5.9 5.88 8.11 5.88 10.59V89.4C5.88 91.85 8.15003 94.11 10.59 94.11H45.66C47.22 94.11 48.5101 95.34 48.5601 96.91C48.5601 96.91 48.5601 96.9367 48.5601 96.99C48.6201 98.63 47.31 100 45.66 100Z" fill="currentColor"/>
      <path d="M59.6201 44.88L15.46 44.9C13.96 44.9 13.0801 43.22 13.0501 42.08C13.0101 40.85 13.9 39.09 15.46 39.09H59.5401C61.0301 39.09 61.92 40.74 61.95 41.9C61.98 42.99 61.2101 44.87 59.6201 44.88Z" fill="currentColor"/>
      <path d="M44.14 60.5L15.46 60.52C13.96 60.52 13.0801 58.85 13.0501 57.71C13.0101 56.48 13.9 54.71 15.46 54.71H44.0601C45.5501 54.71 46.44 56.37 46.47 57.53C46.5 58.61 45.74 60.5 44.14 60.5Z" fill="currentColor"/>
      <path d="M30.75 76.11H15.44C13.98 76.12 13.08 74.51 13.05 73.34C13.01 72.06 13.92 70.36 15.44 70.36L30.66 70.34C32.14 70.34 33.16 71.86 33.2 73.15C33.24 74.44 32.31 76.11 30.75 76.11Z" fill="currentColor"/>
      <path d="M66.51 59.36C56.14 59.36 47.69 67.8 47.69 78.18C47.69 88.56 56.14 97 66.51 97C76.88 97 85.33 88.55 85.33 78.18C85.33 67.81 76.89 59.36 66.51 59.36ZM68.26 87.69C67.7867 88.17 67.2134 88.41 66.54 88.41C65.8667 88.41 65.3 88.17 64.84 87.69C64.38 87.21 64.1467 86.6367 64.14 85.97C64.1333 85.3033 64.3667 84.7367 64.84 84.27C65.3134 83.8033 65.88 83.57 66.54 83.57C67.2 83.57 67.7733 83.8033 68.26 84.27C68.7467 84.7367 68.9834 85.3033 68.97 85.97C68.9567 86.6367 68.72 87.21 68.26 87.69ZM72.33 74.71C72.1967 75.1367 72.0167 75.5367 71.79 75.91C71.57 76.28 71.31 76.63 71.01 76.96C70.7167 77.2867 70.4001 77.6067 70.0601 77.92C69.7467 78.22 69.4834 78.4933 69.27 78.74C69.05 78.98 68.88 79.21 68.76 79.45C68.64 79.68 68.55 79.93 68.5 80.19C68.44 80.45 68.41 80.7467 68.41 81.08V81.53H64.75V80.61C64.75 80.1633 64.7967 79.7467 64.89 79.36C64.9833 78.98 65.1267 78.6133 65.32 78.26C65.52 77.9067 65.7834 77.5533 66.11 77.2C66.4367 76.8467 66.84 76.4633 67.32 76.05C67.8267 75.6033 68.22 75.1933 68.5 74.82C68.78 74.4467 68.92 73.99 68.92 73.45C68.92 72.89 68.71 72.3967 68.29 71.97C67.87 71.5433 67.2967 71.33 66.57 71.33C66.18 71.33 65.82 71.39 65.51 71.52C65.19 71.65 64.91 71.83 64.67 72.05C64.4234 72.2767 64.2233 72.53 64.07 72.81C63.91 73.09 63.79 73.38 63.72 73.68L60.5 72.33C60.6533 71.81 60.8934 71.29 61.22 70.77C61.5467 70.25 61.9567 69.78 62.45 69.36C62.9433 68.94 63.5233 68.6 64.19 68.34C64.8633 68.08 65.62 67.95 66.46 67.95C67.3534 67.95 68.1734 68.0833 68.92 68.35C69.66 68.6233 70.2967 68.9967 70.83 69.47C71.3633 69.9433 71.7767 70.5067 72.07 71.16C72.37 71.8133 72.52 72.5133 72.52 73.26C72.52 73.8 72.4567 74.2833 72.33 74.71Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Document with text lines (source: Group-3.svg).
 */
export function DocumentTextIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 77 100'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M48.24 0C48.62 0.33 49.23 0.31 49.75 0.43C51.92 0.95 53.45 2.33 54.98 3.78L58.79 7.41L62.31 10.74L66.01 14.26L69.53 17.59L73.9 21.95C75.29 23.33 75.71 25.11 76.17 27.04V90.57C75.42 95.55 71.73 99.25 66.75 100H9.42999C4.44999 99.25 0.75 95.54 0 90.57V9.43C0.72 4.52 4.30999 0.99 8.98999 0H48.24ZM70.28 89.32L70.33 29.29H51.58C48.52 28.81 46.19 26.48 45.71 23.42V5.84L10.58 5.9C8.16002 5.9 5.89001 8.11 5.89001 10.59V89.4C5.89001 91.85 8.16003 94.11 10.59 94.11H65.58C68.05 94.1 70.28 91.88 70.28 89.32Z" fill="currentColor"/>
      <path d="M59.62 44.88L15.46 44.9C13.97 44.9 13.08 43.22 13.05 42.08C13.01 40.85 13.9 39.09 15.46 39.09H59.54C61.03 39.09 61.92 40.74 61.95 41.9C61.98 42.99 61.22 44.87 59.62 44.88Z" fill="currentColor"/>
      <path d="M44.15 60.5L15.46 60.52C13.97 60.52 13.08 58.85 13.05 57.71C13.01 56.48 13.9 54.71 15.46 54.71H44.07C45.56 54.71 46.45 56.37 46.48 57.53C46.51 58.61 45.74 60.5 44.15 60.5Z" fill="currentColor"/>
      <path d="M30.75 76.11H15.44C13.99 76.12 13.08 74.51 13.05 73.34C13.01 72.06 13.92 70.36 15.44 70.36L30.66 70.34C32.15 70.34 33.16 71.86 33.21 73.15C33.26 74.44 32.31 76.11 30.75 76.11Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Fuel pump (source: Group-8.svg).
 */
export function FuelPumpIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 98'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M53.1801 12.96H25.05C23.9841 12.96 23.12 13.8241 23.12 14.89V31.84C23.12 32.9059 23.9841 33.77 25.05 33.77H53.1801C54.246 33.77 55.11 32.9059 55.11 31.84V14.89C55.11 13.8241 54.246 12.96 53.1801 12.96Z" fill="currentColor"/>
      <path d="M100 23.37C100 20.1 98.55 17.17 96.26 15.17C96.22 15.12 96.17 15.07 96.12 15.02L85.55 4.45C84.3 3.19 82.26 3.19 81 4.45C79.75 5.7 79.75 7.74 81 9L85.22 13.21C81.14 14.78 78.23 18.74 78.23 23.37C78.23 28.25 81.47 32.39 85.9 33.77V67.12C85.9 68.16 85.06 68.99 84.03 68.99C83 68.99 82.16 68.16 82.16 67.12V48.47C82.16 43.9 78.43 40.17 73.85 40.17H68.35V7.31C68.35 3.28 65.07 0 61.04 0H17.1801C13.1501 0 9.88 3.28 9.88 7.31V76.59H7.65002C3.43002 76.59 0 80.02 0 84.24V92.31C0 94.92 2.12999 97.05 4.73999 97.05H73.48C76.1 97.05 78.23 94.92 78.23 92.31V84.24C78.23 80.02 74.8001 76.59 70.5801 76.59H68.35V46.6H73.85C74.89 46.6 75.72 47.44 75.72 48.47V67.12C75.72 71.7 79.45 75.43 84.03 75.43C88.61 75.43 92.3301 71.7 92.3301 67.12V33.77C96.7701 32.39 100 28.25 100 23.37ZM72.05 81.17C72.75 81.17 73.3201 82 73.3201 83.01V91.16C73.3201 91.98 72.6601 92.64 71.8401 92.64H6.39001C5.57001 92.64 4.91003 91.98 4.91003 91.16V83.01C4.91003 82 5.48005 81.17 6.18005 81.17H72.05ZM15.28 76.18V7.67C15.28 6.11 16.54 4.85 18.1 4.85H60.13C61.69 4.85 62.9501 6.11 62.9501 7.67V76.18H15.28ZM89.12 27.82C86.66 27.82 84.67 25.82 84.67 23.37C84.67 20.92 86.66 18.92 89.12 18.92C91.58 18.92 93.5701 20.92 93.5701 23.37C93.5701 25.82 91.57 27.82 89.12 27.82Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Arch handle (source: Vector-9.svg).
 */
export function GateArchHandleIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 46 19'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M0 18.37V8.11002C0 3.64002 3.63999 0 8.10999 0H37.89C42.36 0 46 3.64002 46 8.11002V18.37M40 18.37V8.11002C40 6.95002 39.05 6 37.89 6H8.10999C6.94999 6 6 6.95002 6 8.11002V18.37" fill="currentColor"/>
    </svg>
  )
}

/**
 * Graduation cap (source: Vector.svg).
 */
export function GraduationCapIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 83'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M96.44 64.1V35.69L97.25 35.22C98.97 34.22 100 32.44 100 30.45C100 28.46 98.97 26.68 97.25 25.68L55.67 1.53C53.95 0.53 51.99 0 50 0C48.01 0 46.04 0.53 44.32 1.53L2.73999 25.69C1.01999 26.69 0 28.47 0 30.45C0 32.43 1.01999 34.22 2.73999 35.23L15.34 42.55V59.58C15.34 61.53 15.86 63.44 16.83 65.12C17.81 66.81 19.21 68.21 20.89 69.18L38.25 79.19C41.87 81.27 45.93 82.32 49.99 82.32C54.05 82.32 58.12 81.28 61.74 79.19L79.09 69.18C80.78 68.21 82.18 66.81 83.15 65.12C84.12 63.44 84.64 61.53 84.64 59.58V42.55L90.28 39.27V64.1C89.31 64.76 88.58 65.71 88.19 66.81C87.81 67.92 87.78 69.12 88.13 70.24C88.47 71.36 89.17 72.34 90.11 73.03C91.05 73.73 92.19 74.1 93.36 74.1C94.53 74.1 95.67 73.73 96.61 73.03C97.56 72.34 98.25 71.36 98.59 70.24C98.94 69.12 98.91 67.92 98.53 66.81C98.14 65.71 97.41 64.76 96.44 64.1ZM78.49 59.58C78.49 61.33 77.55 62.97 76.02 63.84L58.67 73.85C56.03 75.36 53.04 76.16 50 76.16C46.96 76.16 43.96 75.36 41.32 73.85L23.97 63.84C23.22 63.41 22.6 62.79 22.16 62.04C21.73 61.29 21.5 60.44 21.5 59.58V46.13L44.32 59.38C46.04 60.38 48 60.91 50 60.91C52 60.91 53.95 60.38 55.67 59.38L78.49 46.13V59.58ZM52.58 54.06C51.79 54.52 50.9 54.76 50 54.76C49.1 54.76 48.2 54.52 47.41 54.06L6.78 30.45L47.41 6.85C48.19 6.39 49.08 6.15 49.99 6.15C50.9 6.15 51.79 6.39 52.58 6.85L93.2 30.45L52.58 54.06Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Hand holding Indian Rupee (source: Group-17.svg).
 */
export function HandRupeeIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 73'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M94.53 72.15C94.47 72.15 94.42 72.15 94.36 72.15H43.37C42.81 72.15 42.25 72.07 41.71 71.91C39.54 71.26 37.43 70.53 35.65 68.72L20.63 53.42C20.63 53.42 20.56 53.36 20.53 53.33L19.2 52.17C17.66 50.5 16.12 49.55 14.62 49.37L13.02 49.18C12.96 49.18 12.87 49.18 12.84 49.18L6 49.23C4.4 49.29 2.90996 48.69 1.76996 47.59C0.629959 46.48 0 44.99 0 43.41V23.05C0 21.49 0.609971 20.02 1.71997 18.92C2.82997 17.82 4.30999 17.23 5.85999 17.23L30.23 17.35C33.88 17.37 37.42 18.34 41.71 20.48C41.87 20.56 42.03 20.64 42.18 20.73C47.06 23.66 50.63 28.19 52.52 33.85C52.96 35.2 53.67 36.37 54.63 37.32L61.99 44.75C62.13 44.9 62.27 45.05 62.4 45.21C64.03 47.25 65.56 49.55 65.74 52.61C65.9 55.13 64.94 57.64 63.09 59.48C61.29 61.27 58.85 62.19 56.39 62.01C53.55 61.82 51.2 60.82 49.41 59.04L39.43 49.18C39.01 48.76 38.52 48.66 38.18 48.68C37.61 48.68 37.05 48.93 36.65 49.35C35.8 50.23 34.4 50.26 33.53 49.42C32.64 48.57 32.61 47.18 33.46 46.3C34.68 45.02 36.38 44.28 38.13 44.26C39.78 44.24 41.38 44.88 42.55 46.05L52.52 55.9C53.55 56.93 54.92 57.49 56.7 57.61C57.8899 57.69 59.08 57.23 59.98 56.34C60.92 55.41 61.41 54.15 61.33 52.88C61.23 51.14 60.35 49.71 58.95 47.97C58.92 47.93 58.88 47.89 58.84 47.85L51.5 40.44C50.06 39 48.98 37.24 48.33 35.24C46.78 30.6 43.87 26.9 39.91 24.52C39.86 24.49 39.8 24.46 39.74 24.43C36.09 22.61 33.1399 21.78 30.2 21.77L5.83997 21.64C5.45997 21.64 5.09997 21.79 4.83997 22.05C4.56997 22.32 4.41998 22.67 4.41998 23.05V43.41C4.41998 43.79 4.56998 44.15 4.84998 44.42C5.11998 44.69 5.47 44.83 5.87 44.82L7.10999 44.78L12.83 44.76C13.07 44.74 13.3 44.76 13.53 44.8L15.15 44.98C17.69 45.29 20.11 46.67 22.36 49.09L23.39 49.96C23.53 50.08 23.66 50.2 23.79 50.34L27.58 54.22L38.8 65.63C39.84 66.69 41.24 67.16 42.97 67.67C43.1 67.71 43.23 67.73 43.37 67.73H94.16C94.24 67.68 94.32 67.63 94.37 67.6L94.66 67.43C95.91 66.81 95.56 65.35 95.43 64.92C94.9 63.13 93.5799 62.17 92.5699 61.68L90.42 60.61C90.37 60.59 90.31 60.56 90.25 60.54C86.83 59.23 83.24 58.79 80.18 58.54L76.0699 58.38C75.6999 58.37 75.33 58.32 74.96 58.23L68.81 56.79C67.62 56.51 66.89 55.33 67.16 54.14C67.44 52.95 68.6299 52.21 69.8199 52.49L75.97 53.93C76.06 53.95 76.15 53.97 76.24 53.97L80.49 54.13C83.88 54.41 87.87 54.9 91.83 56.41C92.01 56.48 92.2 56.56 92.38 56.65L94.5099 57.71C97.06 58.95 98.9 61.06 99.66 63.64C100.65 66.82 99.48 69.9 96.74 71.33C96.2 71.67 95.44 72.15 94.53 72.15Z" fill="currentColor"/>
      <path d="M82.87 12.48C83.04 12.53 83.18 12.67 83.18 12.87V14.2C83.14 14.42 82.99 14.58 82.75 14.58H79.83C80.23 15.13 80.48 15.71 80.61 16.35H82.78C83.04 16.38 83.19 16.54 83.21 16.78V18.04C83.21 18.23 83.09 18.45 82.87 18.45H80.66C80.23 21.1 78.09 22.49 75.52 22.79C75.7 22.99 75.9 23.21 76.09 23.42L76.5 23.85L78.09 25.65L79.17 26.91L81.39 29.56C81.52 29.79 81.4 30.07 81.15 30.16H78.53C78.37 30.16 78.28 30.1 78.19 29.98L76.5699 28.09L74.5099 25.74L73.23 24.31L72.85 23.89L72.43 23.44L72.03 23.01C71.88 22.86 71.74 22.73 71.74 22.49V20.99C71.75 20.78 71.92 20.57 72.13 20.57L74.0699 20.55C74.5999 20.55 75.1 20.45 75.6 20.3C76.57 20.01 77.33 19.44 77.6 18.46H72.09C71.88 18.46 71.75 18.22 71.75 18.04V16.78C71.75 16.55 71.93 16.36 72.18 16.36H77.41C76.94 15.41 75.57 15 74.56 14.99L72.14 14.96C71.9 14.96 71.75 14.73 71.75 14.51V12.91C71.75 12.71 71.88 12.58 72.02 12.48H82.87Z" fill="currentColor"/>
      <path d="M77.48 38.87C66.62 38.87 57.79 30.15 57.79 19.43C57.79 8.70999 66.62 0 77.48 0C88.34 0 97.17 8.71999 97.17 19.43C97.17 30.14 88.34 38.87 77.48 38.87ZM77.48 3.56999C68.6 3.56999 61.38 10.69 61.38 19.43C61.38 28.17 68.6 35.3 77.48 35.3C86.36 35.3 93.58 28.18 93.58 19.43C93.58 10.68 86.36 3.56999 77.48 3.56999Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Heart with pulse line (source: Vector-7.svg).
 */
export function HeartPulseIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 91'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M0 31.99V26.32C0.63 20.17 3.24 14.57 7.34 9.91998C12.14 4.46998 19.24 0.669988 26.54 0.0499878L31.95 0.0299988C38.72 0.679999 44.85 3.71999 49.94 8.20999C54.99 3.70999 61.02 0.82 67.77 0L73.34 0.0299988C83.94 1.09 93.16 7.94001 97.52 17.63C100.96 25.3 100.82 33.97 97.17 41.55C95.67 44.65 93.92 47.63 91.43 50.11L63.62 77.9L51.72 89.68C50.87 90.52 49 90.53 48.14 89.68L34.49 76.15L8.25 49.92C5.83 47.5 4.17 44.53 2.71 41.56C1.19 38.47 0.34 35.28 0 31.99ZM87.7 45.3C91.06 41.39 93.3 36.65 93.92 31.45C93.74 30.62 94.1 29.85 94.04 29.08L93.87 26.91C93.44 21.26 90.24 15.48 85.95 11.79C82.35 8.69998 77.97 6.61 73.16 6.09L67.97 6.10999C65.48 6.33999 63.22 7.06998 60.95 8.06998C57.42 9.62998 54.51 12 51.7 14.64C50.82 15.47 49.05 15.49 48.16 14.64C43.21 9.89998 37.99 6.56999 30.97 5.95999C25.15 5.45999 19.17 7.46999 14.66 11.21L11.16 14.71C8.21 18.27 6.43 22.54 5.93 27.1C5.19 33.67 7.95 40.41 12.15 45.3L26.3 45.29L30.11 38.97C30.73 37.92 31.71 37.41 32.83 37.44C33.89 37.46 34.74 37.99 35.37 38.97L43.27 51.43L55.06 26.62C55.65 25.39 56.76 24.86 58.04 24.94C59.13 25.01 60.04 25.72 60.6 26.86L70.51 45.29L87.7 45.3ZM32.01 65.28L49.93 83.08L65.96 67.18L82.07 51.18L68.11 51.16C66.92 50.93 66.21 50.09 65.74 49.01L57.91 34.57L46.51 58.63C45.96 59.79 45.09 60.49 43.97 60.57C42.72 60.65 41.74 60.14 41.04 59.04L32.81 46.07L30.65 49.67C30.26 50.35 29.51 51.12 28.64 51.13L17.8 51.18L32.01 65.28Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Medium horizontal pill bar (source: Vector-2.svg).
 */
export function HorizontalBarMediumIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 29 7'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M25.1724 6.42001H3.30238C2.32238 6.42001 1.25238 5.95001 0.792375 5.34001C-0.0276249 4.25001 -0.257596 3.07 0.322404 1.88C0.722404 1.04 1.71237 0 3.10237 0H25.3724C26.7624 0 27.7524 1.04 28.1524 1.88C28.7324 3.07 28.5024 4.25001 27.6824 5.34001C27.2224 5.95001 26.1524 6.42001 25.1724 6.42001Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Thick horizontal pill bar (source: Vector-3.svg).
 */
export function HorizontalBarThickIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 19 7'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M15.1724 6.42H3.30238C2.32238 6.42 1.25238 5.95 0.792375 5.34C-0.0276249 4.25 -0.257596 3.07999 0.322404 1.87999C0.722404 1.04999 1.71237 0 3.10237 0H15.3724C16.7624 0 17.7524 1.04999 18.1524 1.87999C18.7324 3.07999 18.5024 4.25 17.6824 5.34C17.2224 5.95 16.1524 6.42 15.1724 6.42Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Thin horizontal pill bar (source: Vector-1.svg).
 */
export function HorizontalBarThinIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 39 7'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M34.8923 6.42H3.30238C2.32238 6.42 1.25238 5.95 0.792375 5.34C-0.0276249 4.25 -0.257596 3.07 0.322404 1.88C0.722404 1.04 1.71237 0 3.10237 0H35.0824C36.4724 0 37.4624 1.04 37.8624 1.88C38.4424 3.07 38.2123 4.24 37.3923 5.34C36.9324 5.95 35.8624 6.42 34.8824 6.42H34.8923Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * ID card with info symbol (source: Group-24.svg).
 */
export function IdCardInfoIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 73'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M92.35 72.15H7.66C3.44 72.15 0 68.72 0 64.5V7.66C0 3.44 3.44 0 7.66 0H92.35C96.57 0 100 3.44 100 7.66V64.5C100 68.72 96.57 72.15 92.35 72.15ZM7.66 5.66C6.56 5.66 5.66 6.56 5.66 7.66V64.5C5.66 65.6 6.56 66.49 7.66 66.49H92.35C93.45 66.49 94.34 65.6 94.34 64.5V7.66C94.34 6.56 93.45 5.66 92.35 5.66H7.66Z" fill="currentColor"/>
      <path d="M84.16 24.47H57.18C56.26 24.47 55.25 24.03 54.82 23.45C54.05 22.42 53.83 21.32 54.37 20.19C54.75 19.4 55.69 18.42 57 18.42H84.34C85.65 18.42 86.58 19.4 86.96 20.19C87.51 21.32 87.29 22.42 86.52 23.45C86.08 24.03 85.07 24.47 84.15 24.47H84.16Z" fill="currentColor"/>
      <path d="M74.99 39.11H57.18C56.26 39.11 55.25 38.66 54.82 38.09C54.05 37.06 53.83 35.95 54.37 34.82C54.75 34.03 55.69 33.05 57 33.05H75.18C76.48 33.05 77.42 34.03 77.8 34.82C78.35 35.95 78.13 37.06 77.36 38.09C76.92 38.66 75.91 39.11 74.99 39.11Z" fill="currentColor"/>
      <path d="M65.56 53.74H57.18C56.26 53.74 55.25 53.3 54.82 52.72C54.05 51.69 53.83 50.58 54.37 49.46C54.75 48.67 55.69 47.69 57 47.69H65.74C67.05 47.69 67.99 48.67 68.37 49.46C68.92 50.58 68.7 51.69 67.92 52.72C67.49 53.3 66.48 53.74 65.56 53.74Z" fill="currentColor"/>
      <path d="M29.9 18.92C20.44 18.92 12.74 26.62 12.74 36.08C12.74 45.54 20.44 53.24 29.9 53.24C39.36 53.24 47.06 45.54 47.06 36.08C47.06 26.62 39.37 18.92 29.9 18.92ZM29.9 25.39C31.1 25.39 32.07 26.36 32.07 27.55C32.07 28.74 31.1 29.71 29.9 29.71C28.7 29.71 27.74 28.75 27.74 27.55C27.74 26.35 28.71 25.39 29.9 25.39ZM32.07 44.79C32.07 45.88 31.19 46.77 30.09 46.77H29.71C28.62 46.77 27.73 45.88 27.73 44.79V33.95C27.73 32.86 28.62 31.97 29.71 31.97H30.09C31.19 31.97 32.07 32.86 32.07 33.95V44.79Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Verified ID card with checkmark (source: Group-23.svg).
 */
export function IdCardVerifiedIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 73'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M82.31 24.47H52.51C51.59 24.47 50.58 24.03 50.14 23.45C49.37 22.42 49.15 21.32 49.7 20.19C50.08 19.4 51.02 18.42 52.32 18.42H82.5C83.8 18.42 84.74 19.4 85.12 20.19C85.67 21.32 85.45 22.42 84.68 23.45C84.24 24.03 83.23 24.47 82.31 24.47Z" fill="currentColor"/>
      <path d="M73.15 39.11H52.51C51.59 39.11 50.58 38.66 50.14 38.09C49.37 37.06 49.15 35.95 49.7 34.82C50.08 34.04 51.02 33.05 52.32 33.05H73.33C74.64 33.05 75.58 34.04 75.96 34.82C76.51 35.95 76.29 37.06 75.52 38.09C75.08 38.66 74.07 39.11 73.15 39.11Z" fill="currentColor"/>
      <path d="M63.71 53.74H52.51C51.59 53.74 50.58 53.3 50.14 52.72C49.37 51.69 49.15 50.58 49.7 49.46C50.08 48.67 51.02 47.69 52.32 47.69H63.9C65.21 47.69 66.14 48.67 66.52 49.46C67.07 50.58 66.85 51.69 66.08 52.72C65.65 53.3 64.63 53.74 63.71 53.74Z" fill="currentColor"/>
      <path d="M92.35 72.15H7.64999C3.42999 72.15 0 68.72 0 64.5V7.66C0 3.44 3.42999 0 7.64999 0H92.35C96.57 0 100 3.44 100 7.66V64.5C100 68.72 96.57 72.15 92.35 72.15ZM7.64999 5.66C6.54999 5.66 5.66 6.56 5.66 7.66V64.5C5.66 65.6 6.54999 66.49 7.64999 66.49H92.35C93.44 66.49 94.34 65.6 94.34 64.5V7.66C94.34 6.56 93.44 5.66 92.35 5.66H7.64999Z" fill="currentColor"/>
      <path d="M29.29 20.69C20.81 20.69 13.91 27.6 13.91 36.08C13.91 44.56 20.81 51.46 29.29 51.46C37.77 51.46 44.68 44.56 44.68 36.08C44.68 27.6 37.78 20.69 29.29 20.69ZM38.32 32.26L28.56 42.02C28.26 42.31 27.88 42.46 27.5 42.46C27.12 42.46 26.73 42.31 26.43 42.02L21.55 37.14C20.97 36.55 20.97 35.61 21.55 35.02C22.14 34.43 23.09 34.43 23.67 35.02L27.5 38.84L36.2 30.14C36.78 29.55 37.73 29.55 38.32 30.14C38.91 30.72 38.91 31.67 38.32 32.26Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Location pin with signal waves (source: Group-10.svg).
 */
export function LocationSignalIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 84'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M50.0432 77.4667C48.6132 77.4667 47.2831 76.7867 46.2631 75.5267C38.9131 66.5467 33.4732 58.4267 30.0932 51.4067C28.7232 48.5667 27.7632 45.9967 27.0632 43.2967C26.5532 41.3067 26.3431 39.3967 26.4031 37.2967C26.7531 25.2467 36.4231 15.1567 48.4031 14.3067L48.8632 14.2667C49.7632 14.1967 50.7032 14.1167 51.8232 14.3367C58.1832 14.7567 64.2032 17.9167 68.3532 23.0167C72.5332 28.1567 74.3932 34.7467 73.4632 41.0867C72.4332 48.0667 67.9032 55.7467 64.5932 60.9167C61.0632 66.4268 57.1232 71.4667 54.0832 75.2367C53.5732 75.8767 52.5132 77.1967 50.6032 77.4267C50.4132 77.4467 50.2332 77.4667 50.0432 77.4667ZM50.2731 18.6467C49.9531 18.6467 49.6132 18.6667 49.2132 18.7067L48.7132 18.7367C38.9832 19.4267 31.1332 27.6367 30.8532 37.4267C30.8032 39.1267 30.9631 40.5967 31.3731 42.1867C31.9931 44.5967 32.8532 46.9067 34.0932 49.4767C37.3332 56.1867 42.5832 64.0067 49.7032 72.7167C49.7432 72.7667 49.9632 73.0267 50.0732 73.0167C50.1232 72.9967 50.2531 72.9167 50.6231 72.4567C53.5831 68.7668 57.4332 63.8467 60.8532 58.5167C65.6932 50.9567 68.3832 45.0467 69.0632 40.4367C69.8132 35.3267 68.2931 29.9967 64.9031 25.8267C61.5031 21.6467 56.5831 19.0767 51.4031 18.7667L51.0732 18.7167C50.8132 18.6667 50.5531 18.6467 50.2731 18.6467Z" fill="currentColor"/>
      <path d="M50.0032 83.8868C35.7032 83.8868 20.5032 79.9167 20.5032 72.5767C20.5032 68.4667 25.2232 65.0667 33.8032 63.0167C34.6932 62.7967 35.6032 63.3567 35.8132 64.2467C36.0332 65.1467 35.4733 66.0467 34.5833 66.2567C27.1633 68.0367 23.8333 70.7067 23.8333 72.5767C23.8333 75.9067 33.7932 80.5467 50.0032 80.5467C66.2132 80.5467 76.1732 75.9067 76.1732 72.5767C76.1732 70.7367 72.9132 68.0868 65.6432 66.3068C64.7432 66.0968 64.1932 65.1867 64.4132 64.2967C64.6332 63.3967 65.5332 62.8467 66.4332 63.0667C74.8632 65.1367 79.5032 68.5067 79.5032 72.5767C79.5032 79.9167 64.3032 83.8868 50.0032 83.8868Z" fill="currentColor"/>
      <path d="M50.0032 46.7267C55.5481 46.7267 60.0432 42.2317 60.0432 36.6867C60.0432 31.1418 55.5481 26.6467 50.0032 26.6467C44.4582 26.6467 39.9633 31.1418 39.9633 36.6867C39.9633 42.2317 44.4582 46.7267 50.0032 46.7267Z" fill="currentColor"/>
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="39" y="26" width="22" height="21">
      <path d="M50.0032 46.7267C55.5481 46.7267 60.0432 42.2317 60.0432 36.6867C60.0432 31.1418 55.5481 26.6467 50.0032 26.6467C44.4582 26.6467 39.9633 31.1418 39.9633 36.6867C39.9633 42.2317 44.4582 46.7267 50.0032 46.7267Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <path d="M40.1532 26.6467H39.9532V46.7367H40.1532V26.6467Z" fill="currentColor"/>
      <path d="M40.3533 26.6467H40.1532V46.7367H40.3533V26.6467Z" fill="currentColor"/>
      <path d="M40.5432 26.6467H40.3433V46.7367H40.5432V26.6467Z" fill="currentColor"/>
      <path d="M40.7432 26.6467H40.5432V46.7367H40.7432V26.6467Z" fill="currentColor"/>
      <path d="M40.9332 26.6467H40.7333V46.7367H40.9332V26.6467Z" fill="currentColor"/>
      <path d="M41.1332 26.6467H40.9332V46.7367H41.1332V26.6467Z" fill="currentColor"/>
      <path d="M41.3333 26.6467H41.1332V46.7367H41.3333V26.6467Z" fill="currentColor"/>
      <path d="M41.5232 26.6467H41.3232V46.7367H41.5232V26.6467Z" fill="currentColor"/>
      <path d="M41.7233 26.6467H41.5232V46.7367H41.7233V26.6467Z" fill="currentColor"/>
      <path d="M41.9132 26.6467H41.7133V46.7367H41.9132V26.6467Z" fill="currentColor"/>
      <path d="M42.1133 26.6467H41.9132V46.7367H42.1133V26.6467Z" fill="currentColor"/>
      <path d="M42.3032 26.6467H42.1033V46.7367H42.3032V26.6467Z" fill="currentColor"/>
      <path d="M42.5032 26.6467H42.3032V46.7367H42.5032V26.6467Z" fill="currentColor"/>
      <path d="M42.6932 26.6467H42.4932V46.7367H42.6932V26.6467Z" fill="currentColor"/>
      <path d="M42.8932 26.6467H42.6932V46.7367H42.8932V26.6467Z" fill="currentColor"/>
      <path d="M43.0833 26.6467H42.8832V46.7367H43.0833V26.6467Z" fill="currentColor"/>
      <path d="M43.2832 26.6467H43.0833V46.7367H43.2832V26.6467Z" fill="currentColor"/>
      <path d="M43.4733 26.6467H43.2732V46.7367H43.4733V26.6467Z" fill="currentColor"/>
      <path d="M43.6732 26.6467H43.4733V46.7367H43.6732V26.6467Z" fill="currentColor"/>
      <path d="M43.8633 26.6467H43.6632V46.7367H43.8633V26.6467Z" fill="currentColor"/>
      <path d="M44.0632 26.6467H43.8633V46.7367H44.0632V26.6467Z" fill="currentColor"/>
      <path d="M44.2532 26.6467H44.0532V46.7367H44.2532V26.6467Z" fill="currentColor"/>
      <path d="M44.4532 26.6467H44.2532V46.7367H44.4532V26.6467Z" fill="currentColor"/>
      <path d="M44.6432 26.6467H44.4432V46.7367H44.6432V26.6467Z" fill="currentColor"/>
      <path d="M44.8433 26.6467H44.6432V46.7367H44.8433V26.6467Z" fill="currentColor"/>
      <path d="M45.0332 26.6467H44.8333V46.7367H45.0332V26.6467Z" fill="currentColor"/>
      <path d="M45.2333 26.6467H45.0332V46.7367H45.2333V26.6467Z" fill="currentColor"/>
      <path d="M45.4232 26.6467H45.2233V46.7367H45.4232V26.6467Z" fill="currentColor"/>
      <path d="M45.6232 26.6467H45.4232V46.7367H45.6232V26.6467Z" fill="currentColor"/>
      <path d="M45.8132 26.6467H45.6133V46.7367H45.8132V26.6467Z" fill="currentColor"/>
      <path d="M46.0132 26.6467H45.8132V46.7367H46.0132V26.6467Z" fill="currentColor"/>
      <path d="M46.2032 26.6467H46.0032V46.7367H46.2032V26.6467Z" fill="currentColor"/>
      <path d="M46.4032 26.6467H46.2032V46.7367H46.4032V26.6467Z" fill="currentColor"/>
      <path d="M46.5933 26.6467H46.3932V46.7367H46.5933V26.6467Z" fill="currentColor"/>
      <path d="M46.7932 26.6467H46.5933V46.7367H46.7932V26.6467Z" fill="currentColor"/>
      <path d="M46.9833 26.6467H46.7832V46.7367H46.9833V26.6467Z" fill="currentColor"/>
      <path d="M47.1832 26.6467H46.9833V46.7367H47.1832V26.6467Z" fill="currentColor"/>
      <path d="M47.3732 26.6467H47.1732V46.7367H47.3732V26.6467Z" fill="currentColor"/>
      <path d="M47.5732 26.6467H47.3732V46.7367H47.5732V26.6467Z" fill="currentColor"/>
      <path d="M47.7632 26.6467H47.5632V46.7367H47.7632V26.6467Z" fill="currentColor"/>
      <path d="M47.9633 26.6467H47.7632V46.7367H47.9633V26.6467Z" fill="currentColor"/>
      <path d="M48.1532 26.6467H47.9532V46.7367H48.1532V26.6467Z" fill="currentColor"/>
      <path d="M48.3533 26.6467H48.1532V46.7367H48.3533V26.6467Z" fill="currentColor"/>
      <path d="M48.5432 26.6467H48.3433V46.7367H48.5432V26.6467Z" fill="currentColor"/>
      <path d="M48.7432 26.6467H48.5432V46.7367H48.7432V26.6467Z" fill="currentColor"/>
      <path d="M48.9332 26.6467H48.7333V46.7367H48.9332V26.6467Z" fill="currentColor"/>
      <path d="M49.1332 26.6467H48.9332V46.7367H49.1332V26.6467Z" fill="currentColor"/>
      <path d="M49.3232 26.6467H49.1232V46.7367H49.3232V26.6467Z" fill="currentColor"/>
      <path d="M49.5232 26.6467H49.3232V46.7367H49.5232V26.6467Z" fill="currentColor"/>
      <path d="M49.7133 26.6467H49.5132V46.7367H49.7133V26.6467Z" fill="currentColor"/>
      <path d="M49.9132 26.6467H49.7133V46.7367H49.9132V26.6467Z" fill="currentColor"/>
      <path d="M50.1033 26.6467H49.9032V46.7367H50.1033V26.6467Z" fill="currentColor"/>
      <path d="M50.3032 26.6467H50.1033V46.7367H50.3032V26.6467Z" fill="currentColor"/>
      <path d="M50.4932 26.6467H50.2932V46.7367H50.4932V26.6467Z" fill="currentColor"/>
      <path d="M50.6932 26.6467H50.4932V46.7367H50.6932V26.6467Z" fill="currentColor"/>
      <path d="M50.8832 26.6467H50.6832V46.7367H50.8832V26.6467Z" fill="currentColor"/>
      <path d="M51.0833 26.6467H50.8832V46.7367H51.0833V26.6467Z" fill="currentColor"/>
      <path d="M51.2732 26.6467H51.0732V46.7367H51.2732V26.6467Z" fill="currentColor"/>
      <path d="M51.4733 26.6467H51.2732V46.7367H51.4733V26.6467Z" fill="currentColor"/>
      <path d="M51.6632 26.6467H51.4633V46.7367H51.6632V26.6467Z" fill="currentColor"/>
      <path d="M51.8633 26.6467H51.6632V46.7367H51.8633V26.6467Z" fill="currentColor"/>
      <path d="M52.0532 26.6467H51.8533V46.7367H52.0532V26.6467Z" fill="currentColor"/>
      <path d="M52.2532 26.6467H52.0532V46.7367H52.2532V26.6467Z" fill="currentColor"/>
      <path d="M52.4432 26.6467H52.2432V46.7367H52.4432V26.6467Z" fill="currentColor"/>
      <path d="M52.6432 26.6467H52.4432V46.7367H52.6432V26.6467Z" fill="currentColor"/>
      <path d="M52.8333 26.6467H52.6332V46.7367H52.8333V26.6467Z" fill="currentColor"/>
      <path d="M53.0332 26.6467H52.8333V46.7367H53.0332V26.6467Z" fill="currentColor"/>
      <path d="M53.2233 26.6467H53.0232V46.7367H53.2233V26.6467Z" fill="currentColor"/>
      <path d="M53.4232 26.6467H53.2233V46.7367H53.4232V26.6467Z" fill="currentColor"/>
      <path d="M53.6133 26.6467H53.4132V46.7367H53.6133V26.6467Z" fill="currentColor"/>
      <path d="M53.8132 26.6467H53.6133V46.7367H53.8132V26.6467Z" fill="currentColor"/>
      <path d="M54.0032 26.6467H53.8032V46.7367H54.0032V26.6467Z" fill="currentColor"/>
      <path d="M54.2032 26.6467H54.0032V46.7367H54.2032V26.6467Z" fill="currentColor"/>
      <path d="M54.3932 26.6467H54.1932V46.7367H54.3932V26.6467Z" fill="currentColor"/>
      <path d="M54.5933 26.6467H54.3932V46.7367H54.5933V26.6467Z" fill="currentColor"/>
      <path d="M54.7832 26.6467H54.5833V46.7367H54.7832V26.6467Z" fill="currentColor"/>
      <path d="M54.9833 26.6467H54.7832V46.7367H54.9833V26.6467Z" fill="currentColor"/>
      <path d="M55.1732 26.6467H54.9733V46.7367H55.1732V26.6467Z" fill="currentColor"/>
      <path d="M55.3732 26.6467H55.1732V46.7367H55.3732V26.6467Z" fill="currentColor"/>
      <path d="M55.5632 26.6467H55.3633V46.7367H55.5632V26.6467Z" fill="currentColor"/>
      <path d="M55.7632 26.6467H55.5632V46.7367H55.7632V26.6467Z" fill="currentColor"/>
      <path d="M55.9532 26.6467H55.7532V46.7367H55.9532V26.6467Z" fill="currentColor"/>
      <path d="M56.1532 26.6467H55.9532V46.7367H56.1532V26.6467Z" fill="currentColor"/>
      <path d="M56.3433 26.6467H56.1432V46.7367H56.3433V26.6467Z" fill="currentColor"/>
      <path d="M56.5432 26.6467H56.3433V46.7367H56.5432V26.6467Z" fill="currentColor"/>
      <path d="M56.7333 26.6467H56.5332V46.7367H56.7333V26.6467Z" fill="currentColor"/>
      <path d="M56.9332 26.6467H56.7333V46.7367H56.9332V26.6467Z" fill="currentColor"/>
      <path d="M57.1232 26.6467H56.9232V46.7367H57.1232V26.6467Z" fill="currentColor"/>
      <path d="M57.3232 26.6467H57.1232V46.7367H57.3232V26.6467Z" fill="currentColor"/>
      <path d="M57.5132 26.6467H57.3132V46.7367H57.5132V26.6467Z" fill="currentColor"/>
      <path d="M57.7133 26.6467H57.5132V46.7367H57.7133V26.6467Z" fill="currentColor"/>
      <path d="M57.9032 26.6467H57.7032V46.7367H57.9032V26.6467Z" fill="currentColor"/>
      <path d="M58.1033 26.6467H57.9032V46.7367H58.1033V26.6467Z" fill="currentColor"/>
      <path d="M58.2932 26.6467H58.0933V46.7367H58.2932V26.6467Z" fill="currentColor"/>
      <path d="M58.4932 26.6467H58.2932V46.7367H58.4932V26.6467Z" fill="currentColor"/>
      <path d="M58.6832 26.6467H58.4833V46.7367H58.6832V26.6467Z" fill="currentColor"/>
      <path d="M58.8832 26.6467H58.6832V46.7367H58.8832V26.6467Z" fill="currentColor"/>
      <path d="M59.0732 26.6467H58.8732V46.7367H59.0732V26.6467Z" fill="currentColor"/>
      <path d="M59.2732 26.6467H59.0732V46.7367H59.2732V26.6467Z" fill="currentColor"/>
      <path d="M59.4633 26.6467H59.2632V46.7367H59.4633V26.6467Z" fill="currentColor"/>
      <path d="M59.6632 26.6467H59.4633V46.7367H59.6632V26.6467Z" fill="currentColor"/>
      <path d="M59.8533 26.6467H59.6532V46.7367H59.8533V26.6467Z" fill="currentColor"/>
      <path d="M60.0532 26.6467H59.8533V46.7367H60.0532V26.6467Z" fill="currentColor"/>
      </g>
      <path d="M80.8432 38.7767C80.6332 38.7767 80.4232 38.7467 80.2032 38.6767C79.0332 38.3267 78.3632 37.0867 78.7132 35.9067C80.0532 31.4467 79.3732 26.6367 76.8432 22.7167C75.8432 21.1767 74.5932 19.8267 73.1432 18.7167C72.1632 17.9767 71.9832 16.5767 72.7232 15.6067C73.4732 14.6267 74.8632 14.4367 75.8432 15.1867C77.7032 16.6067 79.2932 18.3267 80.5732 20.3067C83.8132 25.3167 84.6932 31.4667 82.9732 37.1867C82.6832 38.1467 81.8032 38.7767 80.8432 38.7767Z" fill="currentColor"/>
      <path d="M96.6932 42.1667C96.5032 42.1667 96.3131 42.1467 96.1331 42.0967C94.9431 41.7867 94.2232 40.5767 94.5332 39.3867C96.7832 30.7267 95.2832 21.4467 90.4232 13.9367C87.8232 9.91674 84.4632 6.61674 80.4232 4.11674C79.3832 3.46674 79.0632 2.09675 79.7132 1.04675C80.3532 0.00674534 81.7232 -0.313254 82.7732 0.336746C87.3632 3.18675 91.1932 6.94674 94.1532 11.5267C99.6932 20.0767 101.393 30.6467 98.8432 40.5067C98.5832 41.5067 97.6732 42.1667 96.6932 42.1667Z" fill="currentColor"/>
      <path d="M19.1532 38.7767C18.2032 38.7767 17.3132 38.1467 17.0332 37.1867C15.3132 31.4667 16.1832 25.3167 19.4332 20.3067C20.7132 18.3267 22.3032 16.6067 24.1632 15.1867C25.1432 14.4367 26.5332 14.6267 27.2832 15.6067C28.0232 16.5767 27.8333 17.9767 26.8633 18.7167C25.4133 19.8267 24.1632 21.1767 23.1632 22.7267C20.6332 26.6367 19.9532 31.4467 21.2932 35.9067C21.6432 37.0867 20.9732 38.3267 19.7932 38.6767C19.5832 38.7467 19.3732 38.7767 19.1532 38.7767Z" fill="currentColor"/>
      <path d="M3.31325 42.1667C2.32325 42.1667 1.42322 41.5067 1.16322 40.5067C-1.39678 30.6467 0.313286 20.0767 5.85329 11.5267C8.80329 6.94674 12.6333 3.18675 17.2333 0.336746C18.2733 -0.313254 19.6532 0.00674534 20.2932 1.04675C20.9432 2.09675 20.6233 3.46674 19.5833 4.11674C15.5433 6.61674 12.1833 9.91674 9.58327 13.9367C4.72327 21.4467 3.22328 30.7267 5.47328 39.3867C5.78328 40.5767 5.06318 41.7867 3.87318 42.0967C3.69318 42.1467 3.50325 42.1667 3.31325 42.1667Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Map pin on location base (source: Group-16.svg).
 */
export function MapPinLocationIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 105 93'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M96.8831 92.8838H7.25312C5.07312 92.8838 3.02313 91.9238 1.64313 90.2338C0.26313 88.5438 -0.28687 86.3538 0.14313 84.2138L8.44312 42.7138C9.11312 39.3438 12.1031 36.8838 15.5531 36.8838H35.4231V42.8838H15.5531C14.9531 42.8838 14.4431 43.3138 14.3231 43.8938L6.02314 85.3938C5.92314 85.8938 6.14315 86.2638 6.28314 86.4338C6.42314 86.6038 6.73312 86.8838 7.25312 86.8838H96.8831C97.3931 86.8838 97.7031 86.6038 97.8431 86.4338C97.9831 86.2638 98.2031 85.8938 98.1031 85.3938L89.8031 43.8938C89.6931 43.3138 89.1731 42.8838 88.5831 42.8838H68.8731V36.8838H88.5831C92.0231 36.8838 95.0131 39.3438 95.6931 42.7138L103.993 84.2138C104.413 86.3538 103.873 88.5438 102.483 90.2338C101.093 91.9238 99.0631 92.8838 96.8831 92.8838Z" fill="currentColor"/>
      <path d="M52.0631 63.2738C50.6331 63.2738 49.3032 62.5938 48.2832 61.3338C40.9432 52.3538 35.5031 44.2338 32.1131 37.2138C30.7431 34.3738 29.7831 31.8038 29.0831 29.1038C28.5731 27.1138 28.3631 25.2038 28.4231 23.1038C28.7831 11.0538 38.4431 0.96378 50.4231 0.113779L50.8831 0.0737862C51.7831 0.0037862 52.7231 -0.0762217 53.8431 0.143778C60.2132 0.563778 66.2231 3.72379 70.3731 8.82379C74.5531 13.9638 76.4131 20.5538 75.4831 26.8938C74.4531 33.8738 69.9331 41.5538 66.6131 46.7238C63.0831 52.2338 59.1431 57.2738 56.1031 61.0438C55.5931 61.6838 54.5331 63.0038 52.6231 63.2338C52.4331 63.2538 52.2531 63.2738 52.0631 63.2738ZM52.2931 4.45378C51.9731 4.45378 51.6331 4.47379 51.2331 4.51379L50.7431 4.54379C41.0031 5.23379 33.1631 13.4438 32.8731 23.2338C32.8231 24.9338 32.9831 26.4038 33.3931 27.9938C34.0131 30.4038 34.8731 32.7138 36.1131 35.2838C39.3531 41.9938 44.6031 49.8138 51.7231 58.5238C51.7631 58.5738 51.9831 58.8338 52.0931 58.8238C52.1431 58.8038 52.2731 58.7238 52.6431 58.2638C55.6131 54.5738 59.4531 49.6538 62.8731 44.3238C67.7131 36.7638 70.4031 30.8538 71.0831 26.2438C71.8331 21.1338 70.3131 15.8038 66.9231 11.6338C63.5231 7.45378 58.6031 4.88379 53.4231 4.57379L53.0931 4.52378C52.8331 4.47378 52.5731 4.45378 52.2931 4.45378Z" fill="currentColor"/>
      <path d="M52.0231 32.1238C57.3416 32.1238 61.6531 27.8123 61.6531 22.4938C61.6531 17.1753 57.3416 12.8638 52.0231 12.8638C46.7046 12.8638 42.3931 17.1753 42.3931 22.4938C42.3931 27.8123 46.7046 32.1238 52.0231 32.1238Z" fill="currentColor"/>
      <path d="M52.0631 75.3438C37.7631 75.3438 22.5631 71.3838 22.5631 64.0338C22.5631 59.9238 27.2831 56.5338 35.8631 54.4738C36.7631 54.2638 37.6631 54.8138 37.8831 55.7138C38.0931 56.6038 37.5431 57.5038 36.6431 57.7238C29.2231 59.5038 25.9031 62.1738 25.9031 64.0338C25.9031 67.3638 35.8531 72.0138 52.0631 72.0138C68.2731 72.0138 78.2331 67.3638 78.2331 64.0338C78.2331 62.2038 74.9731 59.5538 67.7031 57.7738C66.8031 57.5538 66.2631 56.6538 66.4731 55.7538C66.6931 54.8638 67.5931 54.3138 68.4931 54.5338C76.9231 56.5938 81.5631 59.9738 81.5631 64.0338C81.5631 71.3838 66.3631 75.3438 52.0631 75.3438Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Medical cross / plus (source: Vector-10.svg).
 */
export function MedicalPlusIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 49 49'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M34.13 48.27H14.13V34.14H0V14.14H14.13V0H34.13V14.14H48.27V34.14H34.13V48.27ZM19.13 43.27H29.13V29.14H43.27V19.14H29.13V5H19.13V19.14H5V29.14H19.13V43.27Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Megaphone announcement (source: Vector-11.svg).
 */
export function MegaphoneIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 88'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M0 47.7005L0.0200195 28.4205C1.04002 23.6905 4.59003 19.9105 9.59003 19.4405L33.51 19.3105L73.74 0.670543C75.8 -0.289457 78.23 -0.17947 80.13 0.75053C82.62 1.97053 84.22 4.42052 84.24 7.21052L84.36 19.5805C90.93 20.6205 96.35 25.2305 98.62 30.9705C101.29 37.7205 100.01 44.9405 95.4501 50.1505C92.5201 53.5105 88.8 55.6905 84.38 56.3805L84.26 68.7205C84.23 72.3805 81.41 75.7005 77.24 75.9605C75.26 76.0805 73.5201 75.2605 71.6801 74.4005L33.77 56.7205L29.53 56.6805L29.36 78.0805C29.06 83.7305 24.14 87.9205 18.79 88.0005C13.28 88.0905 8.61004 84.1005 7.85004 78.4505L7.71002 56.2605C3.88002 54.8305 0.69 51.8105 0 47.7005ZM76.2001 69.9205C76.8501 70.0505 77.43 69.9905 77.72 69.7505C77.93 69.5705 78.28 69.2005 78.28 68.7105V7.37052C78.28 6.71052 77.8 6.25054 77.46 6.07054C76.97 5.82054 76.5901 6.07054 75.9501 6.17054L37.28 24.2005V51.8005L76.2001 69.9205ZM10.06 50.6405H31.24V25.2405L10.4401 25.2705C7.84006 25.6505 6.14001 27.4205 5.88 30.0205V45.8705C6.09 48.3005 7.56 50.2005 10.06 50.6405ZM93.9 36.4405C93.71 33.7205 92.4101 31.4105 90.6901 29.4305C88.9701 27.4505 86.88 26.4005 84.35 25.6905V50.3105C89.97 48.9005 93.83 44.0305 94.03 38.2805L93.9 36.4405ZM23.42 78.0305V56.6805H13.65L13.72 77.0805C13.8 79.7005 15.62 81.7405 18.1 82.0205C20.58 82.3005 22.86 80.6905 23.42 78.0305Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Open book (source: Group-29.svg).
 */
export function OpenBookIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 86'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M100 15.6543V78.5343C99.77 79.3243 98.84 80.0243 97.8 79.7143C93.9 78.5643 90.0601 77.4043 85.9401 77.1343L82.62 76.9143C81 76.8143 79.5501 76.8243 77.9301 76.9143L74.5901 77.1243C66.3601 78.0343 58.48 80.6643 51.51 85.0943C50.4 85.8043 49.47 85.7043 48.37 85.0143C41.38 80.6143 33.47 77.9943 25.23 77.1243L21.6901 76.9143C20.5801 76.8543 19.66 76.8643 18.53 76.9143L15.28 77.0243C10.77 77.4443 6.50008 78.3743 2.21008 79.7543C1.71008 79.9143 0.959995 79.6343 0.619995 79.4243C0.309995 79.2243 0.0200195 78.6643 0.0200195 78.1243V66.8143C0.0700195 64.8543 0.140073 62.9043 0.200073 60.9543C0.0400732 60.3443 0.0500732 59.4443 0.200073 58.8143C0.0300732 58.1343 0.0400732 57.1643 0.200073 56.4643C0.0300732 55.7243 0.0400732 54.6843 0.200073 53.9243C0.0400732 53.5843 0.0500732 52.9243 0.200073 52.5643C0.0400732 51.9443 0.0500732 51.0443 0.200073 50.4143C0.0300732 49.9443 0.0500732 49.1743 0.200073 48.6543V28.3443C0.26674 26.191 0.333358 24.0443 0.400024 21.9043C0.230024 21.2843 0.240024 20.3843 0.400024 19.7543C0.230024 19.1443 0.240024 18.2343 0.400024 17.6043C0.340024 17.0443 0.27675 16.461 0.210083 15.8543C0.240083 15.1443 0.730054 14.7443 1.43005 14.5043C3.92005 13.6643 6.37998 12.9543 8.97998 12.2743L9.04004 2.22429C9.04004 0.754293 10.53 -0.21572 11.9 0.0542801C12.91 -0.0957199 13.67 0.104285 14.67 0.184285C28.96 1.37428 42.02 8.63428 50.6 20.2743C59.1 8.77428 72.1601 1.38429 86.3101 0.194295C87.3201 0.104295 88.06 -0.0457187 89.11 0.0242813C89.96 0.0842813 91.17 0.774281 91.17 1.77428L91.2201 12.5143C93.3001 13.0543 95.24 13.6343 97.26 14.2743C98.29 14.6043 99.37 14.8243 100 15.6543ZM48.4301 76.7443L48.4501 24.6743C47.1801 22.9143 46.0801 21.2043 44.5701 19.7043C43.5101 18.3043 42.32 17.2443 40.98 16.0543C33.42 9.30428 23.8201 5.2643 13.6801 4.6043V59.3043L16.16 59.4843C26.44 60.6343 36.1001 64.9243 43.7101 71.9043C44.9001 72.9943 45.9801 73.8843 46.9501 75.1543C47.3801 75.7143 47.9901 76.2743 48.4301 76.7443ZM54.0901 75.8843L58.6901 71.3943C66.8701 64.2943 77.04 60.1143 87.89 59.4743V4.58428C77.19 5.34428 67.4101 9.67429 59.8201 16.8443C57.2701 19.3343 55 21.8343 53.12 24.8143V76.9543C53.56 76.7743 53.8401 76.3643 54.0901 75.8843ZM41.3 76.1943C34.05 69.0043 24.6701 65.0343 14.8301 64.1443L11.36 63.9943C10.59 63.9543 9.03003 63.3943 9.03003 62.2743L8.97998 16.9743L4.5 18.3843V74.5543C8.18 73.6443 11.52 72.9743 15.03 72.6643C15.78 72.6043 16.5101 72.8043 17.2001 72.4643L23.8 72.5543C29.81 72.9043 35.47 74.2343 41.3 76.1943ZM84.24 72.5643L86.7201 72.7043L92.8101 73.6243L96.6801 74.4643V18.2543L92.1901 16.9743L92.17 62.1043C92.17 63.4143 90.51 64.1843 89.51 63.8143C88.59 64.2143 87.9801 64.0043 87.0701 64.0643C76.9001 64.7943 67.2901 69.0043 59.8401 76.2743C65.7301 74.2343 71.37 72.8943 77.39 72.5643H84.24Z" fill="currentColor"/>
      <path d="M0.200073 28.3443V21.9043C0.260073 21.7243 0.330024 21.7343 0.400024 21.9043V28.1343C0.400024 28.2743 0.280073 28.3543 0.200073 28.3443Z" fill="#3E3E3E"/>
      <path d="M0.0100098 66.8143V60.9543C0.0600098 60.7843 0.130073 60.7943 0.200073 60.9543V66.6143C0.200073 66.7443 0.0900098 66.8243 0.0100098 66.8143Z" fill="#414141"/>
      <path d="M0.200073 56.4643C0.150073 56.6343 0.0800098 56.6343 0.0100098 56.4643V53.9243C0.0600098 53.7543 0.130073 53.7643 0.200073 53.9243V56.4643Z" fill="#6E6E6E"/>
      <path d="M0.200073 58.8143C0.150073 58.9843 0.0800098 58.9743 0.0100098 58.8143V56.4643H0.200073V58.8143Z" fill="#5E5E5E"/>
      <path d="M0.400024 19.7543C0.340024 19.9243 0.280073 19.9143 0.200073 19.7543V17.6043C0.260073 17.4343 0.330024 17.4343 0.400024 17.6043V19.7543Z" fill="#5C5C5C"/>
      <path d="M0.400024 19.7543H0.200073V21.9043H0.400024V19.7543Z" fill="#4E4E4E"/>
      <path d="M0.200073 52.5643C0.150073 52.7343 0.0800098 52.7243 0.0100098 52.5643V50.4143C0.0600098 50.2443 0.130073 50.2443 0.200073 50.4143V52.5643Z" fill="#868686"/>
      <path d="M0.210083 58.8143H0.0100098V60.9643H0.210083V58.8143Z" fill="#4F4F4F"/>
      <path d="M0.400024 17.6043H0.200073V15.8543C0.340073 15.8643 0.410034 16.0143 0.410034 16.2243V17.6043H0.400024Z" fill="#686868"/>
      <path d="M0.200073 50.4143H0.0100098L0 49.0343C0 48.8243 0.0700732 48.6743 0.200073 48.6543V50.4143Z" fill="#939393"/>
      <path d="M0.210083 52.5643H0.0100098V53.9343H0.210083V52.5643Z" fill="#7B7B7B"/>
      <path d="M61.14 28.9943C60.43 29.6543 59.6 29.8143 58.81 29.6443C58.11 29.4943 57.47 28.8343 57.15 28.0043C56.79 27.0843 57.33 26.3043 58.06 25.6143C63.74 20.2643 70.69 16.4143 78.28 14.4843C79.65 14.1343 80.86 15.2243 81.03 16.3243C81.24 17.5743 80.47 18.7143 79.15 19.0643C72.39 20.8643 66.34 24.2043 61.14 28.9943Z" fill="currentColor"/>
      <path d="M61.8401 62.9043C61.0201 63.6543 60.22 64.3943 59.19 64.1343C58.26 63.8943 57.48 63.2343 57.29 62.5543C56.98 61.4043 57.33 60.6543 58.16 59.8943C63.94 54.6243 70.86 50.7743 78.53 48.8743C79.79 48.5643 81.06 50.0843 81.02 51.1143C80.98 52.3843 80.2 53.2143 79.06 53.5243C72.65 55.2843 66.8201 58.3643 61.8401 62.9043Z" fill="currentColor"/>
      <path d="M61.5 40.1243C60.33 41.2143 58.9101 41.4243 57.8401 40.3243C56.7101 39.1743 57.1701 37.6743 58.3201 36.6443C64.1101 31.4543 70.89 27.6243 78.51 25.8143C79.75 25.5143 80.9 26.8843 81.01 27.8443C81.16 29.2643 80.2 30.1243 78.87 30.4943C72.39 32.2743 66.49 35.4743 61.5 40.1243Z" fill="currentColor"/>
      <path d="M60.01 52.6343C59.01 53.0043 57.8 52.3343 57.42 51.5043C56.89 50.3643 57.26 49.3943 58.15 48.5743C63.77 43.3943 70.45 39.6743 77.82 37.6743C78.95 36.7943 80.37 37.7043 80.92 38.7643C81.43 39.9743 80.79 41.4943 79.32 41.9043C73.19 43.5943 67.6 46.4543 62.68 50.5943C61.8 51.3343 61.15 52.2043 60.01 52.6343Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Angled open door panel (source: Vector-6.svg).
 */
export function OpenDoorPanelIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 59 104'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M49.37 103.493C48.8 103.493 48.2299 103.433 47.6699 103.323L7.32996 95.623C3.07996 94.813 0 91.093 0 86.763V16.723C0 12.403 3.07996 8.67304 7.32996 7.86304L47.6699 0.163043C50.3199 -0.346957 53.03 0.353046 55.11 2.07305C57.19 3.79305 58.38 6.32304 58.38 9.02304V94.463C58.38 97.163 57.19 99.693 55.11 101.413C53.47 102.773 51.45 103.493 49.37 103.493ZM48.7899 97.433C50.0099 97.663 50.87 97.133 51.28 96.793C51.69 96.453 52.38 95.703 52.38 94.463V9.02304C52.38 7.78304 51.69 7.03304 51.28 6.69304C50.87 6.36304 50.0099 5.82304 48.7899 6.05304L8.45996 13.753C7.03996 14.033 6 15.273 6 16.723V86.763C6 88.213 7.03996 89.463 8.45996 89.733L48.7899 97.433Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Telephone handset (source: Group-28.svg).
 */
export function PhoneCallIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 81 83'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M69.4294 59.6456C70.4994 61.1357 70.8894 62.8657 71.0394 64.6257C71.3594 68.2657 69.8294 72.0257 66.9294 74.3357L59.3593 79.6557C54.4393 83.1157 48.2193 83.8957 42.8193 81.1057C36.5393 77.8457 30.8393 73.8557 25.6093 69.1057L20.3393 63.8257C9.64928 52.1057 2.60931 37.5557 0.11931 21.8757C-0.45069 18.2357 1.0793 13.4357 3.4793 10.4957L5.80937 8.17568L13.2793 2.76568C18.2093 -1.10432 25.2193 -0.674345 29.2593 4.27565L34.0293 10.7857C35.8493 13.2657 37.0193 16.1457 36.7693 19.2257C36.4193 22.2457 35.2294 24.9157 32.9294 26.9257L27.4394 31.0557C31.1494 39.3557 36.5593 46.6856 43.2493 52.8357L48.8293 48.8857C50.3293 47.8157 52.1094 47.3657 53.9194 47.3457C57.1394 46.8357 61.5593 48.7157 63.4593 51.3557L69.4294 59.6456ZM58.4194 55.0857C57.2194 53.4657 54.0493 52.7257 51.4593 54.6057L45.0394 59.2657C43.4894 60.3857 41.9993 60.1557 40.5993 58.9557C31.9793 51.5457 25.2293 42.2957 20.8393 31.7857C20.2793 30.4457 20.0594 28.6957 21.3094 27.7657L28.6593 22.2557C30.7093 20.7157 31.2293 17.7656 29.7193 15.6456L24.1593 7.86565C22.2493 6.22565 19.8393 5.85567 17.7593 7.29567L10.0394 12.5957C7.32935 14.4557 5.97932 17.9057 6.49932 21.1657C8.78932 35.4657 15.1393 48.6457 24.8293 59.3457L30.2894 64.8057C34.8694 68.9457 39.8694 72.4157 45.2994 75.3057C48.3394 76.9357 52.2793 76.8957 54.9493 75.0257L62.5793 69.6357C65.2593 67.7457 65.2393 64.2957 63.3593 61.7557L58.4194 55.0857Z" fill="currentColor"/>
      <path d="M69.9293 11.6357C75.8993 18.4157 79.4993 26.7557 80.5193 35.6357C80.6893 37.0957 80.5893 38.1957 79.5793 39.2057C78.7193 40.0757 77.1993 40.2357 76.0393 39.6957C74.7693 39.1057 74.3093 37.9457 74.1593 36.5057C72.7493 23.1857 64.3693 11.7057 52.1293 6.31567C50.3993 5.55567 49.4492 4.23569 49.9492 2.26569C50.3292 0.805686 52.2892 -0.494332 53.9492 0.185668C58.3092 1.99567 62.2193 4.41568 65.7593 7.50568L69.9293 11.6357Z" fill="currentColor"/>
      <path d="M65.6992 36.9057C65.7692 38.1357 65.4892 38.8757 64.7492 39.6557C64.0092 40.4357 62.7892 40.8057 61.6092 40.4357C60.8092 40.1957 59.6093 39.2557 59.5593 38.0457C59.3293 32.8957 57.4393 28.0957 53.6693 24.4557C51.6393 22.5057 49.3893 21.0457 46.6893 20.1257C45.1793 19.5957 44.3592 17.8057 44.7392 16.3957C45.1192 14.9857 46.6693 13.6457 48.2793 14.1057C52.3993 15.2757 56.7092 18.2957 59.5092 21.5657C63.1792 25.8557 65.3492 31.1257 65.6992 36.9057Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Printer (source: Group-25.svg).
 */
export function PrinterIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 101'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M75.3 100.01H24.59C20.9 99.9 17.98 96.82 17.19 93.35C17.0433 88.3367 16.93 83.34 16.85 78.36C8.90004 79.12 0.5 74.04 0 65.48L0.0300293 37.8C0.570029 29.12 8.91 24.12 16.94 24.88L17.01 12.83C18.31 5.76999 23.33 0.09 30.84 0L69.04 0.019989C76.57 0.109989 81.52 5.66 82.9 12.81C82.8667 16.8567 82.9134 20.88 83.04 24.88C91.19 24.1 99.43 29.34 100 38.04V65.19C99.41 73.94 91.16 79.15 82.98 78.36L82.87 92.26C82.36 96.44 79.65 99.7 75.3 100.01ZM76.69 25.27L76.64 14.23C76.26 9.70001 72.95 6.41 68.39 5.97H31.51C26.96 6.41 23.65 9.70001 23.26 14.23L23.22 25.28H76.69V25.27ZM84.92 56.49C86.53 56.93 87.29 58.13 87.27 59.53C87.24 60.82 86.32 62.31 84.88 62.33L82.54 62.37V72.1L85.81 72.05C90.28 71.7 93.62 68.36 94.03 63.82V39.42C93.61 34.86 90.32 31.59 85.76 31.14H14.15C9.59002 31.59 6.29 34.86 5.88 39.42V63.82C6.29 68.36 9.63004 71.7 14.1 72.05L17.37 72.1V62.37L15.03 62.33C13.52 62.06 12.59 60.77 12.64 59.3C12.68 58.22 13.56 56.52 15.06 56.52L84.92 56.49ZM73.96 94.16C75.44 93.85 76.65 92.86 76.65 91.35L76.69 62.35H23.22L23.26 91.35C23.26 92.93 24.58 93.92 26.03 94.16H73.96Z" fill="currentColor"/>
      <path d="M25.64 43.65L15.03 43.56C13.58 43.56 12.68 42.01 12.64 40.78C12.6 39.5 13.51 37.82 15.03 37.82H25.55C27 37.82 27.91 39.43 27.94 40.57C27.98 42.02 27.17 43.15 25.64 43.65Z" fill="currentColor"/>
      <path d="M58.42 74.77L41.58 74.8C40.12 74.8 39.22 73.17 39.18 72.01C39.14 70.74 40.05 69.04 41.57 69.04H58.33C59.79 69.04 60.7 70.64 60.73 71.82C60.76 73 59.97 74.77 58.42 74.77Z" fill="currentColor"/>
      <path d="M58.42 87.26L41.58 87.29C40.12 87.29 39.22 85.66 39.18 84.5C39.14 83.23 40.05 81.53 41.57 81.53H58.33C59.79 81.53 60.7 83.13 60.73 84.31C60.76 85.49 59.97 87.25 58.42 87.26Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * QR code (source: Group-19.svg).
 */
export function QrCodeIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 100'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M5.65997 31.52H0V0H31.52V5.66H5.65997V31.52Z" fill="currentColor"/>
      <path d="M99.9999 31.52H94.34V5.66H68.47V0H99.9999V31.52Z" fill="currentColor"/>
      <path d="M99.9999 100H68.47V94.34H94.34V68.47H99.9999V100Z" fill="currentColor"/>
      <path d="M31.52 100H0V68.47H5.65997V94.34H31.52V100Z" fill="currentColor"/>
      <path d="M47.22 47.21H14.67V14.67H47.22V47.21ZM20.33 41.55H41.55V20.33H20.33V41.55Z" fill="currentColor"/>
      <path d="M47.22 84.95H14.67V52.4H47.22V84.95ZM20.33 79.29H41.55V58.06H20.33V79.29Z" fill="currentColor"/>
      <path d="M85.33 47.21H52.78V14.67H85.33V47.21ZM58.44 41.55H79.67V20.33H58.44V41.55Z" fill="currentColor"/>
      <path d="M60.72 52.51H52.95V68.47H60.72V76.6H69.32V84.84H85.69V76.6H69.42V60.64H60.72V52.51Z" fill="currentColor"/>
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="52" y="52" width="34" height="33">
      <path d="M60.72 52.51H52.95V68.47H60.72V76.6H69.32V84.84H85.69V76.6H69.42V60.64H60.72V52.51Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <path d="M53.27 52.51H52.95V84.85H53.27V52.51Z" fill="currentColor"/>
      <path d="M53.58 52.51H53.2599V84.85H53.58V52.51Z" fill="currentColor"/>
      <path d="M53.9 52.51H53.58V84.85H53.9V52.51Z" fill="currentColor"/>
      <path d="M54.22 52.51H53.9V84.85H54.22V52.51Z" fill="currentColor"/>
      <path d="M54.54 52.51H54.22V84.85H54.54V52.51Z" fill="currentColor"/>
      <path d="M54.8499 52.51H54.53V84.85H54.8499V52.51Z" fill="currentColor"/>
      <path d="M55.17 52.51H54.8499V84.85H55.17V52.51Z" fill="currentColor"/>
      <path d="M55.4899 52.51H55.17V84.85H55.4899V52.51Z" fill="currentColor"/>
      <path d="M55.81 52.51H55.4899V84.85H55.81V52.51Z" fill="currentColor"/>
      <path d="M56.1299 52.51H55.81V84.85H56.1299V52.51Z" fill="currentColor"/>
      <path d="M56.44 52.51H56.1199V84.85H56.44V52.51Z" fill="currentColor"/>
      <path d="M56.7599 52.51H56.44V84.85H56.7599V52.51Z" fill="currentColor"/>
      <path d="M57.08 52.51H56.7599V84.85H57.08V52.51Z" fill="currentColor"/>
      <path d="M57.4 52.51H57.08V84.85H57.4V52.51Z" fill="currentColor"/>
      <path d="M57.72 52.51H57.4V84.85H57.72V52.51Z" fill="currentColor"/>
      <path d="M58.03 52.51H57.71V84.85H58.03V52.51Z" fill="currentColor"/>
      <path d="M58.3499 52.51H58.03V84.85H58.3499V52.51Z" fill="currentColor"/>
      <path d="M58.67 52.51H58.3499V84.85H58.67V52.51Z" fill="currentColor"/>
      <path d="M58.9899 52.51H58.67V84.85H58.9899V52.51Z" fill="currentColor"/>
      <path d="M59.31 52.51H58.9899V84.85H59.31V52.51Z" fill="currentColor"/>
      <path d="M59.6199 52.51H59.3V84.85H59.6199V52.51Z" fill="currentColor"/>
      <path d="M59.94 52.51H59.6199V84.85H59.94V52.51Z" fill="currentColor"/>
      <path d="M60.2599 52.51H59.94V84.85H60.2599V52.51Z" fill="currentColor"/>
      <path d="M60.58 52.51H60.2599V84.85H60.58V52.51Z" fill="currentColor"/>
      <path d="M60.9 52.51H60.58V84.85H60.9V52.51Z" fill="currentColor"/>
      <path d="M61.21 52.51H60.89V84.85H61.21V52.51Z" fill="currentColor"/>
      <path d="M61.53 52.51H61.21V84.85H61.53V52.51Z" fill="currentColor"/>
      <path d="M61.8499 52.51H61.53V84.85H61.8499V52.51Z" fill="currentColor"/>
      <path d="M62.17 52.51H61.8499V84.85H62.17V52.51Z" fill="currentColor"/>
      <path d="M62.4899 52.51H62.17V84.85H62.4899V52.51Z" fill="currentColor"/>
      <path d="M62.8 52.51H62.4799V84.85H62.8V52.51Z" fill="currentColor"/>
      <path d="M63.1199 52.51H62.8V84.85H63.1199V52.51Z" fill="currentColor"/>
      <path d="M63.44 52.51H63.1199V84.85H63.44V52.51Z" fill="currentColor"/>
      <path d="M63.7599 52.51H63.44V84.85H63.7599V52.51Z" fill="currentColor"/>
      <path d="M64.08 52.51H63.7599V84.85H64.08V52.51Z" fill="currentColor"/>
      <path d="M64.39 52.51H64.07V84.85H64.39V52.51Z" fill="currentColor"/>
      <path d="M64.71 52.51H64.39V84.85H64.71V52.51Z" fill="currentColor"/>
      <path d="M65.03 52.51H64.71V84.85H65.03V52.51Z" fill="currentColor"/>
      <path d="M65.3499 52.51H65.03V84.85H65.3499V52.51Z" fill="currentColor"/>
      <path d="M65.67 52.51H65.3499V84.85H65.67V52.51Z" fill="currentColor"/>
      <path d="M65.9799 52.51H65.66V84.85H65.9799V52.51Z" fill="currentColor"/>
      <path d="M66.3 52.51H65.9799V84.85H66.3V52.51Z" fill="currentColor"/>
      <path d="M66.6199 52.51H66.3V84.85H66.6199V52.51Z" fill="currentColor"/>
      <path d="M66.94 52.51H66.6199V84.85H66.94V52.51Z" fill="currentColor"/>
      <path d="M67.2499 52.51H66.93V84.85H67.2499V52.51Z" fill="currentColor"/>
      <path d="M67.57 52.51H67.2499V84.85H67.57V52.51Z" fill="currentColor"/>
      <path d="M67.89 52.51H67.57V84.85H67.89V52.51Z" fill="currentColor"/>
      <path d="M68.21 52.51H67.89V84.85H68.21V52.51Z" fill="currentColor"/>
      <path d="M68.53 52.51H68.21V84.85H68.53V52.51Z" fill="currentColor"/>
      <path d="M68.84 52.51H68.52V84.85H68.84V52.51Z" fill="currentColor"/>
      <path d="M69.16 52.51H68.84V84.85H69.16V52.51Z" fill="currentColor"/>
      <path d="M69.4799 52.51H69.16V84.85H69.4799V52.51Z" fill="currentColor"/>
      <path d="M69.8 52.51H69.4799V84.85H69.8V52.51Z" fill="currentColor"/>
      <path d="M70.1199 52.51H69.8V84.85H70.1199V52.51Z" fill="currentColor"/>
      <path d="M70.43 52.51H70.1099V84.85H70.43V52.51Z" fill="currentColor"/>
      <path d="M70.7499 52.51H70.43V84.85H70.7499V52.51Z" fill="currentColor"/>
      <path d="M71.07 52.51H70.7499V84.85H71.07V52.51Z" fill="currentColor"/>
      <path d="M71.39 52.51H71.07V84.85H71.39V52.51Z" fill="currentColor"/>
      <path d="M71.71 52.51H71.39V84.85H71.71V52.51Z" fill="currentColor"/>
      <path d="M72.02 52.51H71.7V84.85H72.02V52.51Z" fill="currentColor"/>
      <path d="M72.34 52.51H72.02V84.85H72.34V52.51Z" fill="currentColor"/>
      <path d="M72.66 52.51H72.34V84.85H72.66V52.51Z" fill="currentColor"/>
      <path d="M72.9799 52.51H72.66V84.85H72.9799V52.51Z" fill="currentColor"/>
      <path d="M73.3 52.51H72.9799V84.85H73.3V52.51Z" fill="currentColor"/>
      <path d="M73.6099 52.51H73.29V84.85H73.6099V52.51Z" fill="currentColor"/>
      <path d="M73.93 52.51H73.6099V84.85H73.93V52.51Z" fill="currentColor"/>
      <path d="M74.2499 52.51H73.93V84.85H74.2499V52.51Z" fill="currentColor"/>
      <path d="M74.57 52.51H74.2499V84.85H74.57V52.51Z" fill="currentColor"/>
      <path d="M74.89 52.51H74.57V84.85H74.89V52.51Z" fill="currentColor"/>
      <path d="M75.2 52.51H74.8799V84.85H75.2V52.51Z" fill="currentColor"/>
      <path d="M75.52 52.51H75.2V84.85H75.52V52.51Z" fill="currentColor"/>
      <path d="M75.84 52.51H75.52V84.85H75.84V52.51Z" fill="currentColor"/>
      <path d="M76.16 52.51H75.84V84.85H76.16V52.51Z" fill="currentColor"/>
      <path d="M76.4799 52.51H76.16V84.85H76.4799V52.51Z" fill="currentColor"/>
      <path d="M76.79 52.51H76.47V84.85H76.79V52.51Z" fill="currentColor"/>
      <path d="M77.1099 52.51H76.79V84.85H77.1099V52.51Z" fill="currentColor"/>
      <path d="M77.43 52.51H77.1099V84.85H77.43V52.51Z" fill="currentColor"/>
      <path d="M77.7499 52.51H77.43V84.85H77.7499V52.51Z" fill="currentColor"/>
      <path d="M78.07 52.51H77.7499V84.85H78.07V52.51Z" fill="currentColor"/>
      <path d="M78.3799 52.51H78.06V84.85H78.3799V52.51Z" fill="currentColor"/>
      <path d="M78.7 52.51H78.3799V84.85H78.7V52.51Z" fill="currentColor"/>
      <path d="M79.02 52.51H78.7V84.85H79.02V52.51Z" fill="currentColor"/>
      <path d="M79.34 52.51H79.02V84.85H79.34V52.51Z" fill="currentColor"/>
      <path d="M79.65 52.51H79.33V84.85H79.65V52.51Z" fill="currentColor"/>
      <path d="M79.97 52.51H79.65V84.85H79.97V52.51Z" fill="currentColor"/>
      <path d="M80.29 52.51H79.97V84.85H80.29V52.51Z" fill="currentColor"/>
      <path d="M80.6099 52.51H80.29V84.85H80.6099V52.51Z" fill="currentColor"/>
      <path d="M80.93 52.51H80.6099V84.85H80.93V52.51Z" fill="currentColor"/>
      <path d="M81.2399 52.51H80.92V84.85H81.2399V52.51Z" fill="currentColor"/>
      <path d="M81.56 52.51H81.2399V84.85H81.56V52.51Z" fill="currentColor"/>
      <path d="M81.8799 52.51H81.56V84.85H81.8799V52.51Z" fill="currentColor"/>
      <path d="M82.2 52.51H81.8799V84.85H82.2V52.51Z" fill="currentColor"/>
      <path d="M82.52 52.51H82.2V84.85H82.52V52.51Z" fill="currentColor"/>
      <path d="M82.83 52.51H82.5099V84.85H82.83V52.51Z" fill="currentColor"/>
      <path d="M83.15 52.51H82.83V84.85H83.15V52.51Z" fill="currentColor"/>
      <path d="M83.47 52.51H83.15V84.85H83.47V52.51Z" fill="currentColor"/>
      <path d="M83.79 52.51H83.47V84.85H83.79V52.51Z" fill="currentColor"/>
      <path d="M84.1099 52.51H83.79V84.85H84.1099V52.51Z" fill="currentColor"/>
      <path d="M84.42 52.51H84.0999V84.85H84.42V52.51Z" fill="currentColor"/>
      <path d="M84.7399 52.51H84.42V84.85H84.7399V52.51Z" fill="currentColor"/>
      <path d="M85.06 52.51H84.7399V84.85H85.06V52.51Z" fill="currentColor"/>
      <path d="M85.3799 52.51H85.06V84.85H85.3799V52.51Z" fill="currentColor"/>
      <path d="M85.7 52.51H85.3799V84.85H85.7V52.51Z" fill="currentColor"/>
      </g>
      <path d="M60.7299 76.6H52.95V84.84H60.7299V76.6Z" fill="currentColor"/>
      <mask id={`${id}-1`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="52" y="76" width="9" height="9">
      <path d="M60.7299 76.6H52.95V84.84H60.7299V76.6Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-1)`}>
      <path d="M53.03 76.6H52.95V84.84H53.03V76.6Z" fill="currentColor"/>
      <path d="M53.0999 76.6H53.02V84.84H53.0999V76.6Z" fill="currentColor"/>
      <path d="M53.18 76.6H53.0999V84.84H53.18V76.6Z" fill="currentColor"/>
      <path d="M53.2499 76.6H53.17V84.84H53.2499V76.6Z" fill="currentColor"/>
      <path d="M53.33 76.6H53.2499V84.84H53.33V76.6Z" fill="currentColor"/>
      <path d="M53.4 76.6H53.32V84.84H53.4V76.6Z" fill="currentColor"/>
      <path d="M53.4799 76.6H53.4V84.84H53.4799V76.6Z" fill="currentColor"/>
      <path d="M53.55 76.6H53.47V84.84H53.55V76.6Z" fill="currentColor"/>
      <path d="M53.6299 76.6H53.55V84.84H53.6299V76.6Z" fill="currentColor"/>
      <path d="M53.7 76.6H53.6199V84.84H53.7V76.6Z" fill="currentColor"/>
      <path d="M53.78 76.6H53.7V84.84H53.78V76.6Z" fill="currentColor"/>
      <path d="M53.8599 76.6H53.78V84.84H53.8599V76.6Z" fill="currentColor"/>
      <path d="M53.93 76.6H53.8499V84.84H53.93V76.6Z" fill="currentColor"/>
      <path d="M54.0099 76.6H53.93V84.84H54.0099V76.6Z" fill="currentColor"/>
      <path d="M54.08 76.6H53.9999V84.84H54.08V76.6Z" fill="currentColor"/>
      <path d="M54.16 76.6H54.08V84.84H54.16V76.6Z" fill="currentColor"/>
      <path d="M54.2299 76.6H54.15V84.84H54.2299V76.6Z" fill="currentColor"/>
      <path d="M54.31 76.6H54.2299V84.84H54.31V76.6Z" fill="currentColor"/>
      <path d="M54.3799 76.6H54.3V84.84H54.3799V76.6Z" fill="currentColor"/>
      <path d="M54.46 76.6H54.3799V84.84H54.46V76.6Z" fill="currentColor"/>
      <path d="M54.54 76.6H54.46V84.84H54.54V76.6Z" fill="currentColor"/>
      <path d="M54.6099 76.6H54.53V84.84H54.6099V76.6Z" fill="currentColor"/>
      <path d="M54.69 76.6H54.6099V84.84H54.69V76.6Z" fill="currentColor"/>
      <path d="M54.7599 76.6H54.68V84.84H54.7599V76.6Z" fill="currentColor"/>
      <path d="M54.84 76.6H54.7599V84.84H54.84V76.6Z" fill="currentColor"/>
      <path d="M54.91 76.6H54.83V84.84H54.91V76.6Z" fill="currentColor"/>
      <path d="M54.9899 76.6H54.91V84.84H54.9899V76.6Z" fill="currentColor"/>
      <path d="M55.06 76.6H54.9799V84.84H55.06V76.6Z" fill="currentColor"/>
      <path d="M55.14 76.6H55.06V84.84H55.14V76.6Z" fill="currentColor"/>
      <path d="M55.22 76.6H55.14V84.84H55.22V76.6Z" fill="currentColor"/>
      <path d="M55.29 76.6H55.21V84.84H55.29V76.6Z" fill="currentColor"/>
      <path d="M55.3699 76.6H55.29V84.84H55.3699V76.6Z" fill="currentColor"/>
      <path d="M55.44 76.6H55.3599V84.84H55.44V76.6Z" fill="currentColor"/>
      <path d="M55.52 76.6H55.44V84.84H55.52V76.6Z" fill="currentColor"/>
      <path d="M55.59 76.6H55.5099V84.84H55.59V76.6Z" fill="currentColor"/>
      <path d="M55.67 76.6H55.59V84.84H55.67V76.6Z" fill="currentColor"/>
      <path d="M55.7399 76.6H55.66V84.84H55.7399V76.6Z" fill="currentColor"/>
      <path d="M55.82 76.6H55.7399V84.84H55.82V76.6Z" fill="currentColor"/>
      <path d="M55.89 76.6H55.81V84.84H55.89V76.6Z" fill="currentColor"/>
      <path d="M55.97 76.6H55.89V84.84H55.97V76.6Z" fill="currentColor"/>
      <path d="M56.05 76.6H55.97V84.84H56.05V76.6Z" fill="currentColor"/>
      <path d="M56.1199 76.6H56.04V84.84H56.1199V76.6Z" fill="currentColor"/>
      <path d="M56.2 76.6H56.1199V84.84H56.2V76.6Z" fill="currentColor"/>
      <path d="M56.27 76.6H56.19V84.84H56.27V76.6Z" fill="currentColor"/>
      <path d="M56.3499 76.6H56.27V84.84H56.3499V76.6Z" fill="currentColor"/>
      <path d="M56.42 76.6H56.34V84.84H56.42V76.6Z" fill="currentColor"/>
      <path d="M56.4999 76.6H56.42V84.84H56.4999V76.6Z" fill="currentColor"/>
      <path d="M56.57 76.6H56.4899V84.84H56.57V76.6Z" fill="currentColor"/>
      <path d="M56.65 76.6H56.57V84.84H56.65V76.6Z" fill="currentColor"/>
      <path d="M56.7299 76.6H56.65V84.84H56.7299V76.6Z" fill="currentColor"/>
      <path d="M56.8 76.6H56.72V84.84H56.8V76.6Z" fill="currentColor"/>
      <path d="M56.8799 76.6H56.8V84.84H56.8799V76.6Z" fill="currentColor"/>
      <path d="M56.95 76.6H56.8699V84.84H56.95V76.6Z" fill="currentColor"/>
      <path d="M57.03 76.6H56.95V84.84H57.03V76.6Z" fill="currentColor"/>
      <path d="M57.0999 76.6H57.02V84.84H57.0999V76.6Z" fill="currentColor"/>
      <path d="M57.18 76.6H57.0999V84.84H57.18V76.6Z" fill="currentColor"/>
      <path d="M57.2499 76.6H57.17V84.84H57.2499V76.6Z" fill="currentColor"/>
      <path d="M57.33 76.6H57.2499V84.84H57.33V76.6Z" fill="currentColor"/>
      <path d="M57.4 76.6H57.32V84.84H57.4V76.6Z" fill="currentColor"/>
      <path d="M57.4799 76.6H57.4V84.84H57.4799V76.6Z" fill="currentColor"/>
      <path d="M57.56 76.6H57.4799V84.84H57.56V76.6Z" fill="currentColor"/>
      <path d="M57.6299 76.6H57.55V84.84H57.6299V76.6Z" fill="currentColor"/>
      <path d="M57.71 76.6H57.6299V84.84H57.71V76.6Z" fill="currentColor"/>
      <path d="M57.78 76.6H57.7V84.84H57.78V76.6Z" fill="currentColor"/>
      <path d="M57.8599 76.6H57.78V84.84H57.8599V76.6Z" fill="currentColor"/>
      <path d="M57.93 76.6H57.8499V84.84H57.93V76.6Z" fill="currentColor"/>
      <path d="M58.0099 76.6H57.93V84.84H58.0099V76.6Z" fill="currentColor"/>
      <path d="M58.08 76.6H57.9999V84.84H58.08V76.6Z" fill="currentColor"/>
      <path d="M58.16 76.6H58.08V84.84H58.16V76.6Z" fill="currentColor"/>
      <path d="M58.2399 76.6H58.16V84.84H58.2399V76.6Z" fill="currentColor"/>
      <path d="M58.31 76.6H58.2299V84.84H58.31V76.6Z" fill="currentColor"/>
      <path d="M58.39 76.6H58.31V84.84H58.39V76.6Z" fill="currentColor"/>
      <path d="M58.46 76.6H58.3799V84.84H58.46V76.6Z" fill="currentColor"/>
      <path d="M58.54 76.6H58.46V84.84H58.54V76.6Z" fill="currentColor"/>
      <path d="M58.6099 76.6H58.53V84.84H58.6099V76.6Z" fill="currentColor"/>
      <path d="M58.69 76.6H58.6099V84.84H58.69V76.6Z" fill="currentColor"/>
      <path d="M58.7599 76.6H58.68V84.84H58.7599V76.6Z" fill="currentColor"/>
      <path d="M58.84 76.6H58.7599V84.84H58.84V76.6Z" fill="currentColor"/>
      <path d="M58.92 76.6H58.84V84.84H58.92V76.6Z" fill="currentColor"/>
      <path d="M58.9899 76.6H58.91V84.84H58.9899V76.6Z" fill="currentColor"/>
      <path d="M59.07 76.6H58.9899V84.84H59.07V76.6Z" fill="currentColor"/>
      <path d="M59.14 76.6H59.06V84.84H59.14V76.6Z" fill="currentColor"/>
      <path d="M59.22 76.6H59.14V84.84H59.22V76.6Z" fill="currentColor"/>
      <path d="M59.29 76.6H59.21V84.84H59.29V76.6Z" fill="currentColor"/>
      <path d="M59.3699 76.6H59.29V84.84H59.3699V76.6Z" fill="currentColor"/>
      <path d="M59.44 76.6H59.3599V84.84H59.44V76.6Z" fill="currentColor"/>
      <path d="M59.52 76.6H59.44V84.84H59.52V76.6Z" fill="currentColor"/>
      <path d="M59.59 76.6H59.5099V84.84H59.59V76.6Z" fill="currentColor"/>
      <path d="M59.67 76.6H59.59V84.84H59.67V76.6Z" fill="currentColor"/>
      <path d="M59.7499 76.6H59.67V84.84H59.7499V76.6Z" fill="currentColor"/>
      <path d="M59.82 76.6H59.7399V84.84H59.82V76.6Z" fill="currentColor"/>
      <path d="M59.9 76.6H59.82V84.84H59.9V76.6Z" fill="currentColor"/>
      <path d="M59.97 76.6H59.89V84.84H59.97V76.6Z" fill="currentColor"/>
      <path d="M60.05 76.6H59.97V84.84H60.05V76.6Z" fill="currentColor"/>
      <path d="M60.1199 76.6H60.04V84.84H60.1199V76.6Z" fill="currentColor"/>
      <path d="M60.2 76.6H60.1199V84.84H60.2V76.6Z" fill="currentColor"/>
      <path d="M60.27 76.6H60.19V84.84H60.27V76.6Z" fill="currentColor"/>
      <path d="M60.3499 76.6H60.27V84.84H60.3499V76.6Z" fill="currentColor"/>
      <path d="M60.43 76.6H60.3499V84.84H60.43V76.6Z" fill="currentColor"/>
      <path d="M60.4999 76.6H60.42V84.84H60.4999V76.6Z" fill="currentColor"/>
      <path d="M60.58 76.6H60.4999V84.84H60.58V76.6Z" fill="currentColor"/>
      <path d="M60.65 76.6H60.57V84.84H60.65V76.6Z" fill="currentColor"/>
      <path d="M60.7299 76.6H60.65V84.84H60.7299V76.6Z" fill="currentColor"/>
      </g>
      <path d="M85.69 68.42V52.51H81.21H77.92H69.42V60.64H77.92V68.42H85.69Z" fill="currentColor"/>
      <mask id={`${id}-2`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="69" y="52" width="17" height="17">
      <path d="M85.69 68.42V52.51H81.21H77.92H69.42V60.64H77.92V68.42H85.69Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-2)`}>
      <path d="M69.58 52.51H69.42V68.42H69.58V52.51Z" fill="currentColor"/>
      <path d="M69.7299 52.51H69.57V68.42H69.7299V52.51Z" fill="currentColor"/>
      <path d="M69.89 52.51H69.7299V68.42H69.89V52.51Z" fill="currentColor"/>
      <path d="M70.05 52.51H69.89V68.42H70.05V52.51Z" fill="currentColor"/>
      <path d="M70.21 52.51H70.05V68.42H70.21V52.51Z" fill="currentColor"/>
      <path d="M70.3699 52.51H70.21V68.42H70.3699V52.51Z" fill="currentColor"/>
      <path d="M70.52 52.51H70.3599V68.42H70.52V52.51Z" fill="currentColor"/>
      <path d="M70.68 52.51H70.52V68.42H70.68V52.51Z" fill="currentColor"/>
      <path d="M70.84 52.51H70.68V68.42H70.84V52.51Z" fill="currentColor"/>
      <path d="M70.9999 52.51H70.84V68.42H70.9999V52.51Z" fill="currentColor"/>
      <path d="M71.16 52.51H70.9999V68.42H71.16V52.51Z" fill="currentColor"/>
      <path d="M71.31 52.51H71.15V68.42H71.31V52.51Z" fill="currentColor"/>
      <path d="M71.47 52.51H71.31V68.42H71.47V52.51Z" fill="currentColor"/>
      <path d="M71.6299 52.51H71.47V68.42H71.6299V52.51Z" fill="currentColor"/>
      <path d="M71.79 52.51H71.6299V68.42H71.79V52.51Z" fill="currentColor"/>
      <path d="M71.95 52.51H71.79V68.42H71.95V52.51Z" fill="currentColor"/>
      <path d="M72.0999 52.51H71.94V68.42H72.0999V52.51Z" fill="currentColor"/>
      <path d="M72.2599 52.51H72.0999V68.42H72.2599V52.51Z" fill="currentColor"/>
      <path d="M72.42 52.51H72.2599V68.42H72.42V52.51Z" fill="currentColor"/>
      <path d="M72.58 52.51H72.42V68.42H72.58V52.51Z" fill="currentColor"/>
      <path d="M72.7399 52.51H72.58V68.42H72.7399V52.51Z" fill="currentColor"/>
      <path d="M72.89 52.51H72.7299V68.42H72.89V52.51Z" fill="currentColor"/>
      <path d="M73.05 52.51H72.89V68.42H73.05V52.51Z" fill="currentColor"/>
      <path d="M73.21 52.51H73.05V68.42H73.21V52.51Z" fill="currentColor"/>
      <path d="M73.3699 52.51H73.21V68.42H73.3699V52.51Z" fill="currentColor"/>
      <path d="M73.53 52.51H73.3699V68.42H73.53V52.51Z" fill="currentColor"/>
      <path d="M73.68 52.51H73.52V68.42H73.68V52.51Z" fill="currentColor"/>
      <path d="M73.84 52.51H73.68V68.42H73.84V52.51Z" fill="currentColor"/>
      <path d="M73.9999 52.51H73.84V68.42H73.9999V52.51Z" fill="currentColor"/>
      <path d="M74.16 52.51H73.9999V68.42H74.16V52.51Z" fill="currentColor"/>
      <path d="M74.32 52.51H74.16V68.42H74.32V52.51Z" fill="currentColor"/>
      <path d="M74.47 52.51H74.31V68.42H74.47V52.51Z" fill="currentColor"/>
      <path d="M74.6299 52.51H74.47V68.42H74.6299V52.51Z" fill="currentColor"/>
      <path d="M74.79 52.51H74.6299V68.42H74.79V52.51Z" fill="currentColor"/>
      <path d="M74.95 52.51H74.79V68.42H74.95V52.51Z" fill="currentColor"/>
      <path d="M75.1099 52.51H74.95V68.42H75.1099V52.51Z" fill="currentColor"/>
      <path d="M75.2599 52.51H75.0999V68.42H75.2599V52.51Z" fill="currentColor"/>
      <path d="M75.42 52.51H75.2599V68.42H75.42V52.51Z" fill="currentColor"/>
      <path d="M75.58 52.51H75.42V68.42H75.58V52.51Z" fill="currentColor"/>
      <path d="M75.7399 52.51H75.58V68.42H75.7399V52.51Z" fill="currentColor"/>
      <path d="M75.9 52.51H75.7399V68.42H75.9V52.51Z" fill="currentColor"/>
      <path d="M76.06 52.51H75.9V68.42H76.06V52.51Z" fill="currentColor"/>
      <path d="M76.21 52.51H76.05V68.42H76.21V52.51Z" fill="currentColor"/>
      <path d="M76.3699 52.51H76.21V68.42H76.3699V52.51Z" fill="currentColor"/>
      <path d="M76.53 52.51H76.3699V68.42H76.53V52.51Z" fill="currentColor"/>
      <path d="M76.69 52.51H76.53V68.42H76.69V52.51Z" fill="currentColor"/>
      <path d="M76.8499 52.51H76.69V68.42H76.8499V52.51Z" fill="currentColor"/>
      <path d="M76.9999 52.51H76.84V68.42H76.9999V52.51Z" fill="currentColor"/>
      <path d="M77.16 52.51H76.9999V68.42H77.16V52.51Z" fill="currentColor"/>
      <path d="M77.32 52.51H77.16V68.42H77.32V52.51Z" fill="currentColor"/>
      <path d="M77.4799 52.51H77.32V68.42H77.4799V52.51Z" fill="currentColor"/>
      <path d="M77.64 52.51H77.4799V68.42H77.64V52.51Z" fill="currentColor"/>
      <path d="M77.79 52.51H77.6299V68.42H77.79V52.51Z" fill="currentColor"/>
      <path d="M77.95 52.51H77.79V68.42H77.95V52.51Z" fill="currentColor"/>
      <path d="M78.1099 52.51H77.95V68.42H78.1099V52.51Z" fill="currentColor"/>
      <path d="M78.27 52.51H78.1099V68.42H78.27V52.51Z" fill="currentColor"/>
      <path d="M78.43 52.51H78.27V68.42H78.43V52.51Z" fill="currentColor"/>
      <path d="M78.58 52.51H78.42V68.42H78.58V52.51Z" fill="currentColor"/>
      <path d="M78.7399 52.51H78.58V68.42H78.7399V52.51Z" fill="currentColor"/>
      <path d="M78.9 52.51H78.7399V68.42H78.9V52.51Z" fill="currentColor"/>
      <path d="M79.06 52.51H78.9V68.42H79.06V52.51Z" fill="currentColor"/>
      <path d="M79.22 52.51H79.06V68.42H79.22V52.51Z" fill="currentColor"/>
      <path d="M79.3699 52.51H79.21V68.42H79.3699V52.51Z" fill="currentColor"/>
      <path d="M79.53 52.51H79.3699V68.42H79.53V52.51Z" fill="currentColor"/>
      <path d="M79.69 52.51H79.53V68.42H79.69V52.51Z" fill="currentColor"/>
      <path d="M79.8499 52.51H79.69V68.42H79.8499V52.51Z" fill="currentColor"/>
      <path d="M80.0099 52.51H79.8499V68.42H80.0099V52.51Z" fill="currentColor"/>
      <path d="M80.16 52.51H79.9999V68.42H80.16V52.51Z" fill="currentColor"/>
      <path d="M80.32 52.51H80.16V68.42H80.32V52.51Z" fill="currentColor"/>
      <path d="M80.4799 52.51H80.32V68.42H80.4799V52.51Z" fill="currentColor"/>
      <path d="M80.64 52.51H80.4799V68.42H80.64V52.51Z" fill="currentColor"/>
      <path d="M80.8 52.51H80.64V68.42H80.8V52.51Z" fill="currentColor"/>
      <path d="M80.95 52.51H80.79V68.42H80.95V52.51Z" fill="currentColor"/>
      <path d="M81.1099 52.51H80.95V68.42H81.1099V52.51Z" fill="currentColor"/>
      <path d="M81.27 52.51H81.1099V68.42H81.27V52.51Z" fill="currentColor"/>
      <path d="M81.43 52.51H81.27V68.42H81.43V52.51Z" fill="currentColor"/>
      <path d="M81.59 52.51H81.43V68.42H81.59V52.51Z" fill="currentColor"/>
      <path d="M81.7399 52.51H81.58V68.42H81.7399V52.51Z" fill="currentColor"/>
      <path d="M81.9 52.51H81.7399V68.42H81.9V52.51Z" fill="currentColor"/>
      <path d="M82.06 52.51H81.9V68.42H82.06V52.51Z" fill="currentColor"/>
      <path d="M82.22 52.51H82.06V68.42H82.22V52.51Z" fill="currentColor"/>
      <path d="M82.3799 52.51H82.22V68.42H82.3799V52.51Z" fill="currentColor"/>
      <path d="M82.53 52.51H82.3699V68.42H82.53V52.51Z" fill="currentColor"/>
      <path d="M82.69 52.51H82.53V68.42H82.69V52.51Z" fill="currentColor"/>
      <path d="M82.8499 52.51H82.69V68.42H82.8499V52.51Z" fill="currentColor"/>
      <path d="M83.0099 52.51H82.8499V68.42H83.0099V52.51Z" fill="currentColor"/>
      <path d="M83.17 52.51H83.0099V68.42H83.17V52.51Z" fill="currentColor"/>
      <path d="M83.33 52.51H83.17V68.42H83.33V52.51Z" fill="currentColor"/>
      <path d="M83.4799 52.51H83.32V68.42H83.4799V52.51Z" fill="currentColor"/>
      <path d="M83.64 52.51H83.4799V68.42H83.64V52.51Z" fill="currentColor"/>
      <path d="M83.8 52.51H83.64V68.42H83.8V52.51Z" fill="currentColor"/>
      <path d="M83.96 52.51H83.8V68.42H83.96V52.51Z" fill="currentColor"/>
      <path d="M84.1199 52.51H83.96V68.42H84.1199V52.51Z" fill="currentColor"/>
      <path d="M84.27 52.51H84.1099V68.42H84.27V52.51Z" fill="currentColor"/>
      <path d="M84.43 52.51H84.27V68.42H84.43V52.51Z" fill="currentColor"/>
      <path d="M84.59 52.51H84.43V68.42H84.59V52.51Z" fill="currentColor"/>
      <path d="M84.7499 52.51H84.59V68.42H84.7499V52.51Z" fill="currentColor"/>
      <path d="M84.91 52.51H84.7499V68.42H84.91V52.51Z" fill="currentColor"/>
      <path d="M85.06 52.51H84.9V68.42H85.06V52.51Z" fill="currentColor"/>
      <path d="M85.22 52.51H85.06V68.42H85.22V52.51Z" fill="currentColor"/>
      <path d="M85.3799 52.51H85.22V68.42H85.3799V52.51Z" fill="currentColor"/>
      <path d="M85.54 52.51H85.3799V68.42H85.54V52.51Z" fill="currentColor"/>
      <path d="M85.7 52.51H85.54V68.42H85.7V52.51Z" fill="currentColor"/>
      </g>
    </svg>
  )
}

/**
 * Receipt / invoice document (source: Group-13.svg).
 */
export function ReceiptIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 77 100'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M51.33 99.9984H48.99C48.1967 99.9517 47.5167 99.7117 46.95 99.2784L38.34 91.5684C35.22 94.2351 32.0967 96.9417 28.97 99.6884L27.51 99.9984H25.17C24.04 99.6084 23.18 98.8684 22.25 98.0384L14.34 90.9984L8.46001 96.1884C6.92001 97.5484 5.17 98.3884 3.12 97.5684C1.56 96.9484 0 95.4184 0 93.2584V6.58839C0.01 4.43839 1.89 2.8784 3.39 2.3784C5.53 1.6584 7.14 2.7084 8.66 4.0384L14.34 9.05839L22.43 1.77839C24.49 -0.0716059 27.25 -0.751605 29.49 1.2484L38.25 9.0684L45.49 2.5984C46.4 1.7884 47.23 0.868406 48.31 0.368406C50.58 -0.591594 52.56 0.458406 54.26 1.97841L62.15 9.05839L67.93 3.9384C69.44 2.5984 71.15 1.6584 73.24 2.4284C74.72 2.9684 76.49 4.46839 76.49 6.58839V93.4584C76.49 95.5484 74.69 97.0884 73.24 97.6184C71.14 98.3884 69.46 97.4584 67.93 96.0984L62.2 90.9684L54.16 98.1384C53.25 98.9484 52.4 99.5984 51.33 99.9984ZM50.22 95.2484L52.2 93.4284L59.33 87.1484C61.11 85.5784 63.6 85.8784 65.31 87.3884L71.63 92.9884V7.0684L65.2 12.7384C63.53 14.2084 61.05 14.4084 59.33 12.8984L52.19 6.6084L50.19 4.8184L41.69 12.4284C39.57 14.3284 36.93 14.3284 34.81 12.4284L26.31 4.8184L24.3 6.6084L17.17 12.8984C15.45 14.4084 12.96 14.2084 11.3 12.7384L5.03 7.1784C4.82 6.8484 4.36 7.3084 4.86 7.5784V92.9784L11.3 87.3084C12.97 85.8384 15.45 85.6384 17.16 87.1484L24.3 93.4384L26.23 95.2684L34.81 87.6084C36.93 85.7184 39.56 85.7084 41.69 87.6084L50.22 95.2484Z" fill="currentColor"/>
      <path d="M60.37 62.7284L16.21 62.7084C14.71 62.7084 13.83 64.3784 13.79 65.5184C13.75 66.7484 14.65 68.5184 16.2 68.5184H60.29C61.78 68.5184 62.67 66.8584 62.7 65.6984C62.73 64.6184 61.96 62.7284 60.37 62.7284Z" fill="currentColor"/>
      <path d="M44.89 47.0984L16.21 47.0784C14.71 47.0784 13.83 48.7584 13.79 49.8984C13.75 51.1284 14.65 52.8884 16.2 52.8884H44.81C46.3 52.8884 47.19 51.2384 47.22 50.0784C47.25 48.9884 46.49 47.0984 44.89 47.0984Z" fill="currentColor"/>
      <path d="M31.49 31.4884H16.19C14.73 31.4884 13.83 33.0984 13.79 34.2684C13.75 35.5484 14.67 37.2384 16.19 37.2384L31.4 37.2584C32.89 37.2584 33.9 35.7484 33.95 34.4484C34 33.1484 33.05 31.4884 31.49 31.4884Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Door frame right bracket (source: Vector-5.svg).
 */
export function RightBracketDoorIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 21 79'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M11.25 78.56H3C1.35 78.56 0 77.22 0 75.56C0 73.9 1.35 72.56 3 72.56H11.25C13.24 72.56 14.86 70.94 14.86 68.95V9.61C14.86 7.62 13.24 6 11.25 6H3C1.35 6 0 4.66 0 3C0 1.34 1.35 0 3 0H11.25C16.55 0 20.86 4.31 20.86 9.61V68.95C20.86 74.25 16.55 78.56 11.25 78.56Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Rounded box outline (source: Vector-8.svg).
 */
export function RoundedBoxOutlineIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 106 77'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M97.89 76.48H8.10999C3.63999 76.48 0 72.84 0 68.37V8.10999C0 3.63999 3.63999 0 8.10999 0H97.89C102.36 0 106 3.63999 106 8.10999V68.37C106 72.84 102.36 76.48 97.89 76.48ZM8.10999 6C6.94999 6 6 6.93999 6 8.10999V68.37C6 69.53 6.94999 70.48 8.10999 70.48H97.89C99.05 70.48 100 69.53 100 68.37V8.10999C100 6.93999 99.05 6 97.89 6H8.10999Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Rounded rectangle frame (source: Vector-4.svg).
 */
export function RoundedFrameIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 106 77'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M97.89 76.48H8.12C3.64 76.48 0 72.84 0 68.37V8.11C0 3.64 3.64 0 8.12 0H97.89C102.37 0 106 3.64 106 8.11V68.37C106 72.84 102.37 76.48 97.89 76.48ZM8.12 6C6.95 6 6 6.95 6 8.11V68.37C6 69.53 6.95 70.48 8.12 70.48H97.89C99.06 70.48 100 69.53 100 68.37V8.11C100 6.95 99.06 6 97.89 6H8.12Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Winding route path to pin (source: Group-6.svg).
 */
export function RoutePathIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 109'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M96.3499 30.9977L83.4701 49.0077C82.1801 50.8077 78.93 51.0977 77.57 49.1977L64.5 30.9977C60.31 25.1577 59.6 17.6877 62.86 10.9277C66.49 3.38766 74.82 -0.952337 83.02 0.177663C92.27 1.44766 99.4001 8.98766 99.9601 18.2477C100.24 22.9477 99.1099 27.1277 96.3499 30.9977ZM88.99 12.3677C86.6 9.38766 82.9 8.10766 79.14 8.51766C71.98 9.28766 67.58 16.5377 69.82 23.1877C72.03 29.7477 79.78 32.8277 85.89 29.3377C91.84 25.9377 93.58 18.0977 88.99 12.3677Z" fill="currentColor"/>
      <path d="M12.11 108.768C18.7982 108.768 24.22 103.346 24.22 96.6577C24.22 89.9695 18.7982 84.5477 12.11 84.5477C5.42182 84.5477 0 89.9695 0 96.6577C0 103.346 5.42182 108.768 12.11 108.768Z" fill="currentColor"/>
      <path d="M63.6299 108.778H63.18C51.82 108.778 42.5699 99.5277 42.5699 88.1577V39.8977C42.5699 32.4877 36.5399 26.4677 29.1299 26.4677C21.7199 26.4677 15.7 32.4877 15.7 39.8977V72.4977C15.7 74.4777 14.09 76.0877 12.11 76.0877C10.13 76.0877 8.51996 74.4777 8.51996 72.4977V39.8977C8.51996 28.5377 17.7699 19.2877 29.1299 19.2877C40.4899 19.2877 49.75 28.5377 49.75 39.8977V88.1577C49.75 95.5677 55.77 101.598 63.18 101.598H63.6299C71.0399 101.598 77.07 95.5677 77.07 88.1577V66.3377C77.07 64.3577 78.67 62.7477 80.65 62.7477C82.63 62.7477 84.2399 64.3577 84.2399 66.3377V88.1577C84.2399 99.5277 74.9899 108.778 63.6299 108.778Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Indian Rupee symbol in circle (source: Group-12.svg).
 */
export function RupeeCircleIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 99'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M66.07 32.32C66.58 32.46 66.98 32.88 66.99 33.48L67.01 37.43C66.88 38.09 66.43 38.57 65.72 38.57L56.99 38.61C58.2 40.21 58.94 41.93 59.32 43.84L65.81 43.86C66.56 43.93 67.03 44.39 67.09 45.13V48.86C67.06 49.44 66.72 50.1 66.07 50.1L59.46 50.13C58.19 58 51.82 62.14 44.16 63.02C44.71 63.64 45.28 64.27 45.87 64.9L47.07 66.19L51.83 71.57L55.04 75.31L61.65 83.2C62.03 83.88 61.69 84.73 60.95 85H53.14C52.65 85.01 52.4 84.82 52.1 84.47L47.29 78.83L41.16 71.81L37.34 67.55L36.19 66.32L34.94 64.98L33.74 63.69C33.31 63.23 32.9 62.84 32.9 62.14L32.92 57.66C32.92 57.04 33.42 56.42 34.04 56.42L39.83 56.35C41.41 56.33 42.91 56.07 44.41 55.62C47.29 54.75 49.55 53.05 50.35 50.12H33.95C33.3 50.11 32.91 49.42 32.92 48.87V45.12C32.92 44.44 33.45 43.86 34.21 43.86L49.78 43.84C48.38 41.03 44.32 39.81 41.29 39.78L34.07 39.69C33.36 39.69 32.92 39.01 32.92 38.36V33.58C32.92 33 33.31 32.59 33.73 32.32H66.07Z" fill="currentColor"/>
      <path d="M50 98.71C22.43 98.71 0 76.57 0 49.35C0 22.13 22.43 0 50 0C77.57 0 100 22.14 100 49.35C100 76.56 77.57 98.71 50 98.71ZM50 5.58C25.51 5.58 5.59 25.22 5.59 49.35C5.59 73.48 25.51 93.12 50 93.12C74.49 93.12 94.41 73.49 94.41 49.35C94.41 25.21 74.49 5.58 50 5.58Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * School building with flag (source: Clip path group.svg).
 */
export function SchoolBuildingIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 100'
      fill='none'
      className={className}
      {...props}
    >
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <path d="M100 0H0V100H100V0Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <mask id={`${id}-1`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <path d="M0 0H100V100H0V0Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-1)`}>
      <path d="M68.83 100C70.45 100 71.76 98.69 71.76 97.07V40.59C71.76 39.81 71.45 39.06 70.9 38.51L52.07 19.69C50.93 18.54 49.07 18.54 47.93 19.69L29.1 38.51C28.55 39.06 28.24 39.81 28.24 40.59V97.07C28.24 98.69 29.56 100 31.17 100H68.83ZM34.1 41.8L50 25.9L65.9 41.8V94.14H34.1V41.8Z" fill="currentColor"/>
      <path d="M31.17 56.07C32.79 56.07 34.1 54.76 34.1 53.14V40.59C34.1 38.97 32.79 37.66 31.17 37.66H15.48C14.71 37.66 13.96 37.96 13.41 38.51L0.859994 51.07C0.019994 51.9 -0.230011 53.16 0.229989 54.26C0.679989 55.35 1.74999 56.07 2.92999 56.07H31.17ZM16.7 43.52H28.24V50.21H10.01L16.7 43.52Z" fill="currentColor"/>
      <path d="M97.07 56.07C98.26 56.07 99.33 55.35 99.78 54.26C100.23 53.16 99.98 51.9 99.14 51.07L86.59 38.51C86.04 37.96 85.3 37.66 84.52 37.66H68.83C67.21 37.66 65.9 38.97 65.9 40.59V53.14C65.9 54.76 67.21 56.07 68.83 56.07H97.07ZM71.76 43.52H83.31L90 50.21H71.76V43.52Z" fill="currentColor"/>
      </g>
      <path d="M15.69 81.38V84.52C15.69 86.14 17 87.45 18.62 87.45C20.24 87.45 21.55 86.14 21.55 84.52V81.38C21.55 79.76 20.24 78.45 18.62 78.45C17 78.45 15.69 79.76 15.69 81.38Z" fill="currentColor"/>
      <path d="M78.45 81.38V84.52C78.45 86.14 79.76 87.45 81.38 87.45C83 87.45 84.31 86.14 84.31 84.52V81.38C84.31 79.76 83 78.45 81.38 78.45C79.76 78.45 78.45 79.76 78.45 81.38Z" fill="currentColor"/>
      <path d="M15.69 65.69V68.83C15.69 70.45 17 71.76 18.62 71.76C20.24 71.76 21.55 70.45 21.55 68.83V65.69C21.55 64.07 20.24 62.76 18.62 62.76C17 62.76 15.69 64.07 15.69 65.69Z" fill="currentColor"/>
      <path d="M78.45 65.69V68.83C78.45 70.45 79.76 71.76 81.38 71.76C83 71.76 84.31 70.45 84.31 68.83V65.69C84.31 64.07 83 62.76 81.38 62.76C79.76 62.76 78.45 64.07 78.45 65.69Z" fill="currentColor"/>
      <path d="M40.8 65.69V68.83C40.8 70.45 42.11 71.76 43.73 71.76C45.35 71.76 46.66 70.45 46.66 68.83V65.69C46.66 64.07 45.34 62.76 43.73 62.76C42.12 62.76 40.8 64.07 40.8 65.69Z" fill="currentColor"/>
      <path d="M53.35 65.69V68.83C53.35 70.45 54.66 71.76 56.28 71.76C57.9 71.76 59.21 70.45 59.21 68.83V65.69C59.21 64.07 57.9 62.76 56.28 62.76C54.66 62.76 53.35 64.07 53.35 65.69Z" fill="currentColor"/>
      <mask id={`${id}-2`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <path d="M0 0H100V100H0V0Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-2)`}>
      <path d="M31.17 100C32.79 100 34.1 98.69 34.1 97.07V53.14C34.1 51.52 32.79 50.21 31.17 50.21H6.06999C4.44999 50.21 3.14 51.52 3.14 53.14V97.07C3.14 98.69 4.44999 100 6.06999 100H31.17ZM93.93 100C95.55 100 96.86 98.69 96.86 97.07V53.14C96.86 51.52 95.55 50.21 93.93 50.21H68.83C67.21 50.21 65.9 51.52 65.9 53.14V97.07C65.9 98.69 67.21 100 68.83 100H93.93ZM71.76 56.07H91V94.14H71.76V56.07ZM8.99998 56.07H28.24V94.14H8.99998V56.07ZM56.28 100C57.9 100 59.21 98.69 59.21 97.07V81.38C59.21 79.76 57.9 78.45 56.28 78.45H43.73C42.11 78.45 40.8 79.76 40.8 81.38V97.07C40.8 98.69 42.11 100 43.73 100H56.28ZM46.66 84.31H53.35V94.14H46.66V84.31Z" fill="currentColor"/>
      <path d="M59.21 46.86C59.21 41.78 55.09 37.66 50 37.66C44.91 37.66 40.8 41.78 40.8 46.86C40.8 51.94 44.92 56.07 50 56.07C55.08 56.07 59.21 51.94 59.21 46.86Z" fill="currentColor"/>
      <path d="M47.07 2.93V21.76C47.07 23.38 48.38 24.69 50 24.69C51.62 24.69 52.93 23.38 52.93 21.76V2.93C52.93 1.31 51.62 0 50 0C48.38 0 47.07 1.31 47.07 2.93Z" fill="currentColor"/>
      <path d="M68.83 18.41C70.45 18.41 71.76 17.1 71.76 15.48V2.93C71.76 1.31 70.45 0 68.83 0H50C48.38 0 47.07 1.31 47.07 2.93V15.48C47.07 17.1 48.38 18.41 50 18.41H68.83ZM52.93 5.86H65.9V12.55H52.93V5.86Z" fill="currentColor"/>
      </g>
      </g>
    </svg>
  )
}

/**
 * Phone with SOS alert (source: Group-21.svg).
 */
export function SosPhoneIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 99'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M58.57 36.16C53.6 40.5 46.26 40.45 41.34 36.2C35.79 31.41 35.11 23.27 39.83 17.62C41.98 15.05 45.07 13.45 48.44 13.01C52.71 12.45 57.3101 14.37 60.0201 17.62C64.7001 23.25 64.12 31.31 58.57 36.16ZM42.3801 26.96C42.6901 30.57 45.61 33.22 48.8 33.7C52.35 34.23 55.6301 32.19 56.9001 29.2C58.3601 25.76 57.1601 21.99 54.4001 20.02C51.4501 17.91 47.57 18.12 44.86 20.49C43.03 22.08 42.1601 24.39 42.3801 26.96Z" fill="currentColor"/>
      <path d="M76.87 39.39C73.34 39.29 70.14 37.93 67.83 35.3C69.24 34.1 70.68 32.82 72 31.51C73.07 32.88 74.46 33.4 76.04 33.69C78.99 34.23 81.0499 32.38 80.5599 30.98C79.8299 28.89 74.81 28.16 71.41 26.16C69.46 25.02 68.4499 22.86 68.3099 20.87C68.1399 18.5 69.15 16.48 70.95 14.93C74.63 11.76 80.75 12.63 84.6 15.75L81.03 20.08C79.04 18.68 76.63 17.96 74.6 19.18C73.96 19.57 73.53 21 74.35 21.35L81.24 24.25C85.36 25.98 87.67 30.64 85.41 34.76C83.72 37.84 80.5 39.48 76.87 39.39Z" fill="currentColor"/>
      <path d="M25.74 38.99C21.54 40.12 17.25 38.82 14.16 35.97C13.98 35.8 13.7599 35.77 13.7099 35.54C13.6699 35.33 13.76 35.04 14.01 34.87C14.81 34.31 15.45 33.66 16.15 32.96C16.65 32.46 17.25 32.18 17.76 31.51C18.82 32.88 20.21 33.4 21.79 33.69C24.56 34.2 26.6799 32.57 26.3399 31.11C26.1199 30.14 25.11 29.56 24.24 29.18C21.89 28.17 19.49 27.46 17.27 26.23C15.28 25.14 14.1899 23.01 14.0499 21.05C13.8799 18.62 14.8199 16.61 16.5899 15.02C17.9699 13.77 19.7099 13.24 21.5599 12.97C24.2999 12.57 27.8599 13.9 30.3499 15.7L26.7199 20.04C24.0499 17.94 19.8 18.16 19.65 20.35C19.62 20.78 19.8399 21.33 20.3199 21.53L27.2099 24.37C28.3299 24.83 29.2699 25.62 30.0699 26.48C31.8999 28.46 32.5299 31.16 31.5899 33.74C30.6499 36.32 28.51 38.24 25.74 38.99Z" fill="currentColor"/>
      <path d="M72.5699 98.81H27.42C23.41 98.81 20.15 95.54 20.15 91.53V51.9H25.8099V91.53C25.8099 92.42 26.53 93.15 27.42 93.15H72.5699C73.4599 93.15 74.1899 92.42 74.1899 91.53V51.9H79.85V91.53C79.85 95.54 76.5799 98.81 72.5699 98.81Z" fill="currentColor"/>
      <path d="M77.02 71.11H22.98V76.77H77.02V71.11Z" fill="currentColor"/>
      <path d="M50 89.59C52.2478 89.59 54.0699 87.7678 54.0699 85.52C54.0699 83.2722 52.2478 81.45 50 81.45C47.7522 81.45 45.9299 83.2722 45.9299 85.52C45.9299 87.7678 47.7522 89.59 50 89.59Z" fill="currentColor"/>
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="45" y="81" width="10" height="9">
      <path d="M50 89.59C52.2478 89.59 54.0699 87.7678 54.0699 85.52C54.0699 83.2722 52.2478 81.45 50 81.45C47.7522 81.45 45.9299 83.2722 45.9299 85.52C45.9299 87.7678 47.7522 89.59 50 89.59Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <path d="M46.01 81.45H45.9299V89.58H46.01V81.45Z" fill="currentColor"/>
      <path d="M46.09 81.45H46.01V89.58H46.09V81.45Z" fill="currentColor"/>
      <path d="M46.17 81.45H46.09V89.58H46.17V81.45Z" fill="currentColor"/>
      <path d="M46.25 81.45H46.17V89.58H46.25V81.45Z" fill="currentColor"/>
      <path d="M46.33 81.45H46.25V89.58H46.33V81.45Z" fill="currentColor"/>
      <path d="M46.41 81.45H46.33V89.58H46.41V81.45Z" fill="currentColor"/>
      <path d="M46.49 81.45H46.41V89.58H46.49V81.45Z" fill="currentColor"/>
      <path d="M46.5599 81.45H46.48V89.58H46.5599V81.45Z" fill="currentColor"/>
      <path d="M46.64 81.45H46.5599V89.58H46.64V81.45Z" fill="currentColor"/>
      <path d="M46.72 81.45H46.64V89.58H46.72V81.45Z" fill="currentColor"/>
      <path d="M46.7999 81.45H46.72V89.58H46.7999V81.45Z" fill="currentColor"/>
      <path d="M46.88 81.45H46.7999V89.58H46.88V81.45Z" fill="currentColor"/>
      <path d="M46.96 81.45H46.88V89.58H46.96V81.45Z" fill="currentColor"/>
      <path d="M47.04 81.45H46.96V89.58H47.04V81.45Z" fill="currentColor"/>
      <path d="M47.12 81.45H47.04V89.58H47.12V81.45Z" fill="currentColor"/>
      <path d="M47.2 81.45H47.12V89.58H47.2V81.45Z" fill="currentColor"/>
      <path d="M47.28 81.45H47.2V89.58H47.28V81.45Z" fill="currentColor"/>
      <path d="M47.35 81.45H47.27V89.58H47.35V81.45Z" fill="currentColor"/>
      <path d="M47.4299 81.45H47.35V89.58H47.4299V81.45Z" fill="currentColor"/>
      <path d="M47.51 81.45H47.4299V89.58H47.51V81.45Z" fill="currentColor"/>
      <path d="M47.59 81.45H47.51V89.58H47.59V81.45Z" fill="currentColor"/>
      <path d="M47.67 81.45H47.59V89.58H47.67V81.45Z" fill="currentColor"/>
      <path d="M47.75 81.45H47.67V89.58H47.75V81.45Z" fill="currentColor"/>
      <path d="M47.83 81.45H47.75V89.58H47.83V81.45Z" fill="currentColor"/>
      <path d="M47.91 81.45H47.83V89.58H47.91V81.45Z" fill="currentColor"/>
      <path d="M47.99 81.45H47.91V89.58H47.99V81.45Z" fill="currentColor"/>
      <path d="M48.0599 81.45H47.98V89.58H48.0599V81.45Z" fill="currentColor"/>
      <path d="M48.14 81.45H48.0599V89.58H48.14V81.45Z" fill="currentColor"/>
      <path d="M48.22 81.45H48.14V89.58H48.22V81.45Z" fill="currentColor"/>
      <path d="M48.2999 81.45H48.22V89.58H48.2999V81.45Z" fill="currentColor"/>
      <path d="M48.38 81.45H48.2999V89.58H48.38V81.45Z" fill="currentColor"/>
      <path d="M48.46 81.45H48.38V89.58H48.46V81.45Z" fill="currentColor"/>
      <path d="M48.54 81.45H48.46V89.58H48.54V81.45Z" fill="currentColor"/>
      <path d="M48.62 81.45H48.54V89.58H48.62V81.45Z" fill="currentColor"/>
      <path d="M48.7 81.45H48.62V89.58H48.7V81.45Z" fill="currentColor"/>
      <path d="M48.78 81.45H48.7V89.58H48.78V81.45Z" fill="currentColor"/>
      <path d="M48.85 81.45H48.77V89.58H48.85V81.45Z" fill="currentColor"/>
      <path d="M48.9299 81.45H48.85V89.58H48.9299V81.45Z" fill="currentColor"/>
      <path d="M49.01 81.45H48.9299V89.58H49.01V81.45Z" fill="currentColor"/>
      <path d="M49.09 81.45H49.01V89.58H49.09V81.45Z" fill="currentColor"/>
      <path d="M49.17 81.45H49.09V89.58H49.17V81.45Z" fill="currentColor"/>
      <path d="M49.25 81.45H49.17V89.58H49.25V81.45Z" fill="currentColor"/>
      <path d="M49.33 81.45H49.25V89.58H49.33V81.45Z" fill="currentColor"/>
      <path d="M49.41 81.45H49.33V89.58H49.41V81.45Z" fill="currentColor"/>
      <path d="M49.49 81.45H49.41V89.58H49.49V81.45Z" fill="currentColor"/>
      <path d="M49.5599 81.45H49.48V89.58H49.5599V81.45Z" fill="currentColor"/>
      <path d="M49.64 81.45H49.5599V89.58H49.64V81.45Z" fill="currentColor"/>
      <path d="M49.72 81.45H49.64V89.58H49.72V81.45Z" fill="currentColor"/>
      <path d="M49.7999 81.45H49.72V89.58H49.7999V81.45Z" fill="currentColor"/>
      <path d="M49.88 81.45H49.7999V89.58H49.88V81.45Z" fill="currentColor"/>
      <path d="M49.96 81.45H49.88V89.58H49.96V81.45Z" fill="currentColor"/>
      <path d="M50.04 81.45H49.96V89.58H50.04V81.45Z" fill="currentColor"/>
      <path d="M50.12 81.45H50.04V89.58H50.12V81.45Z" fill="currentColor"/>
      <path d="M50.2 81.45H50.12V89.58H50.2V81.45Z" fill="currentColor"/>
      <path d="M50.28 81.45H50.2V89.58H50.28V81.45Z" fill="currentColor"/>
      <path d="M50.35 81.45H50.27V89.58H50.35V81.45Z" fill="currentColor"/>
      <path d="M50.4299 81.45H50.35V89.58H50.4299V81.45Z" fill="currentColor"/>
      <path d="M50.51 81.45H50.4299V89.58H50.51V81.45Z" fill="currentColor"/>
      <path d="M50.59 81.45H50.51V89.58H50.59V81.45Z" fill="currentColor"/>
      <path d="M50.67 81.45H50.59V89.58H50.67V81.45Z" fill="currentColor"/>
      <path d="M50.75 81.45H50.67V89.58H50.75V81.45Z" fill="currentColor"/>
      <path d="M50.83 81.45H50.75V89.58H50.83V81.45Z" fill="currentColor"/>
      <path d="M50.91 81.45H50.83V89.58H50.91V81.45Z" fill="currentColor"/>
      <path d="M50.99 81.45H50.91V89.58H50.99V81.45Z" fill="currentColor"/>
      <path d="M51.0599 81.45H50.98V89.58H51.0599V81.45Z" fill="currentColor"/>
      <path d="M51.14 81.45H51.0599V89.58H51.14V81.45Z" fill="currentColor"/>
      <path d="M51.22 81.45H51.14V89.58H51.22V81.45Z" fill="currentColor"/>
      <path d="M51.2999 81.45H51.22V89.58H51.2999V81.45Z" fill="currentColor"/>
      <path d="M51.38 81.45H51.2999V89.58H51.38V81.45Z" fill="currentColor"/>
      <path d="M51.46 81.45H51.38V89.58H51.46V81.45Z" fill="currentColor"/>
      <path d="M51.54 81.45H51.46V89.58H51.54V81.45Z" fill="currentColor"/>
      <path d="M51.62 81.45H51.54V89.58H51.62V81.45Z" fill="currentColor"/>
      <path d="M51.7 81.45H51.62V89.58H51.7V81.45Z" fill="currentColor"/>
      <path d="M51.78 81.45H51.7V89.58H51.78V81.45Z" fill="currentColor"/>
      <path d="M51.85 81.45H51.77V89.58H51.85V81.45Z" fill="currentColor"/>
      <path d="M51.9299 81.45H51.85V89.58H51.9299V81.45Z" fill="currentColor"/>
      <path d="M52.01 81.45H51.9299V89.58H52.01V81.45Z" fill="currentColor"/>
      <path d="M52.09 81.45H52.01V89.58H52.09V81.45Z" fill="currentColor"/>
      <path d="M52.17 81.45H52.09V89.58H52.17V81.45Z" fill="currentColor"/>
      <path d="M52.25 81.45H52.17V89.58H52.25V81.45Z" fill="currentColor"/>
      <path d="M52.33 81.45H52.25V89.58H52.33V81.45Z" fill="currentColor"/>
      <path d="M52.41 81.45H52.33V89.58H52.41V81.45Z" fill="currentColor"/>
      <path d="M52.49 81.45H52.41V89.58H52.49V81.45Z" fill="currentColor"/>
      <path d="M52.5599 81.45H52.48V89.58H52.5599V81.45Z" fill="currentColor"/>
      <path d="M52.64 81.45H52.5599V89.58H52.64V81.45Z" fill="currentColor"/>
      <path d="M52.72 81.45H52.64V89.58H52.72V81.45Z" fill="currentColor"/>
      <path d="M52.7999 81.45H52.72V89.58H52.7999V81.45Z" fill="currentColor"/>
      <path d="M52.88 81.45H52.7999V89.58H52.88V81.45Z" fill="currentColor"/>
      <path d="M52.96 81.45H52.88V89.58H52.96V81.45Z" fill="currentColor"/>
      <path d="M53.04 81.45H52.96V89.58H53.04V81.45Z" fill="currentColor"/>
      <path d="M53.12 81.45H53.04V89.58H53.12V81.45Z" fill="currentColor"/>
      <path d="M53.2 81.45H53.12V89.58H53.2V81.45Z" fill="currentColor"/>
      <path d="M53.28 81.45H53.2V89.58H53.28V81.45Z" fill="currentColor"/>
      <path d="M53.35 81.45H53.27V89.58H53.35V81.45Z" fill="currentColor"/>
      <path d="M53.4299 81.45H53.35V89.58H53.4299V81.45Z" fill="currentColor"/>
      <path d="M53.51 81.45H53.4299V89.58H53.51V81.45Z" fill="currentColor"/>
      <path d="M53.59 81.45H53.51V89.58H53.59V81.45Z" fill="currentColor"/>
      <path d="M53.67 81.45H53.59V89.58H53.67V81.45Z" fill="currentColor"/>
      <path d="M53.75 81.45H53.67V89.58H53.75V81.45Z" fill="currentColor"/>
      <path d="M53.83 81.45H53.75V89.58H53.83V81.45Z" fill="currentColor"/>
      <path d="M53.91 81.45H53.83V89.58H53.91V81.45Z" fill="currentColor"/>
      <path d="M53.99 81.45H53.91V89.58H53.99V81.45Z" fill="currentColor"/>
      <path d="M54.0599 81.45H53.98V89.58H54.0599V81.45Z" fill="currentColor"/>
      </g>
      <path d="M47.86 64.86C47.28 64.86 46.69 64.71 46.16 64.41C45.07 63.8 44.4 62.64 44.39 61.39L44.38 52.83H7.04004C3.16004 52.83 0 49.67 0 45.78V7.03999C0 3.15999 3.16004 0 7.04004 0H92.95C96.84 0 100 3.15999 100 7.03999V45.78C100 49.67 96.84 52.83 92.95 52.83H68.65L49.66 64.35C49.11 64.69 48.49 64.86 47.86 64.86ZM7.04004 5.66C6.28004 5.66 5.66003 6.27999 5.66003 7.03999V45.78C5.66003 46.55 6.28004 47.17 7.04004 47.17H50.03L50.0499 57.5L67.0599 47.17H92.95C93.7199 47.17 94.34 46.55 94.34 45.78V7.03999C94.34 6.27999 93.7199 5.66 92.95 5.66H7.04004Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Speedometer gauge (source: Group-7.svg).
 */
export function SpeedometerIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 69'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M92.3011 64.6757H7.70108C4.30108 64.6757 1.39105 62.2457 0.791047 58.8957C0.201047 55.6357 -0.0588607 52.2757 0.0111393 48.9257C0.551139 23.0057 21.2311 1.55574 47.0811 0.0857366C61.0011 -0.714263 74.2311 4.10574 84.3311 13.6457C94.4311 23.1957 100.001 36.1057 100.001 49.9957C100.001 52.9857 99.7311 55.9757 99.2111 58.8857C98.6111 62.2457 95.7011 64.6757 92.3011 64.6757ZM47.3011 3.97574C23.4711 5.33574 4.41104 25.1157 3.91104 49.0057C3.84104 52.0957 4.09113 55.1957 4.63113 58.2057C4.90113 59.6957 6.19108 60.7757 7.70108 60.7757H92.3011C93.8111 60.7757 95.1011 59.6957 95.3711 58.1957C95.8511 55.5157 96.1011 52.7557 96.1011 49.9957C96.1011 37.1857 90.9712 25.2857 81.6512 16.4857C72.3412 7.68574 60.1311 3.24574 47.3011 3.97574Z" fill="#1B0021"/>
      <path d="M49.5111 52.4557C51.9711 53.9057 55.1511 52.8957 56.3211 50.2857L68.6411 23.4457C69.1011 22.4357 67.761 21.5957 67.061 22.4457L48.3311 45.1857C46.3711 47.4457 46.9311 50.9357 49.5111 52.4557Z" fill="#1B0021"/>
      <path d="M47.1511 68.8457C53.6111 68.8457 58.8411 63.6157 58.8411 57.1557C58.8411 50.6957 53.6111 45.4757 47.1511 45.4757C40.6911 45.4757 35.4711 50.7057 35.4711 57.1557C35.4711 63.6057 40.7011 68.8457 47.1511 68.8457Z" fill="#1B0021"/>
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="35" y="45" width="24" height="24">
      <path d="M47.1511 68.8457C53.6111 68.8457 58.8411 63.6157 58.8411 57.1557C58.8411 50.6957 53.6111 45.4757 47.1511 45.4757C40.6911 45.4757 35.4711 50.7057 35.4711 57.1557C35.4711 63.6057 40.7011 68.8457 47.1511 68.8457Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <path d="M40.661 45.4757L35.821 68.8457H35.4711V45.4757H40.661Z" fill="#1B0021"/>
      <path d="M40.791 45.4757L35.951 68.8457H35.821L40.661 45.4757H40.791Z" fill="#1B0021"/>
      <path d="M40.921 45.4757L36.0811 68.8457H35.951L40.791 45.4757H40.921Z" fill="#1B0021"/>
      <path d="M41.051 45.4757L36.201 68.8457H36.0811L40.921 45.4757H41.051Z" fill="#1B0021"/>
      <path d="M41.171 45.4757L36.3311 68.8457H36.201L41.051 45.4757H41.171Z" fill="#1B0021"/>
      <path d="M41.301 45.4757L36.4611 68.8457H36.3311L41.171 45.4757H41.301Z" fill="#1B0021"/>
      <path d="M41.431 45.4757L36.5911 68.8457H36.4611L41.301 45.4757H41.431Z" fill="#1B0021"/>
      <path d="M41.561 45.4757L36.7211 68.8457H36.5911L41.431 45.4757H41.561Z" fill="#1B0021"/>
      <path d="M41.691 45.4757L36.8511 68.8457H36.7211L41.561 45.4757H41.691Z" fill="#1B0021"/>
      <path d="M41.821 45.4757L36.9711 68.8457H36.8511L41.691 45.4757H41.821Z" fill="#1B0021"/>
      <path d="M41.951 45.4757L37.1011 68.8457H36.9711L41.821 45.4757H41.951Z" fill="#1B0021"/>
      <path d="M42.071 45.4757L37.2311 68.8457H37.1011L41.951 45.4757H42.071Z" fill="#1B0021"/>
      <path d="M42.201 45.4757L37.3611 68.8457H37.2311L42.071 45.4757H42.201Z" fill="#1B0021"/>
      <path d="M42.3311 45.4757L37.4911 68.8457H37.3611L42.201 45.4757H42.3311Z" fill="#1B0021"/>
      <path d="M42.4611 45.4757L37.6211 68.8457H37.4911L42.3311 45.4757H42.4611Z" fill="#1B0021"/>
      <path d="M42.5911 45.4757L37.7411 68.8457H37.6211L42.4611 45.4757H42.5911Z" fill="#1B0021"/>
      <path d="M42.7211 45.4757L37.8711 68.8457H37.7411L42.5911 45.4757H42.7211Z" fill="#1B0021"/>
      <path d="M42.8411 45.4757L38.0011 68.8457H37.8711L42.7211 45.4757H42.8411Z" fill="#1B0021"/>
      <path d="M42.9711 45.4757L38.1311 68.8457H38.0011L42.8411 45.4757H42.9711Z" fill="#1B0021"/>
      <path d="M43.1011 45.4757L38.2611 68.8457H38.1311L42.9711 45.4757H43.1011Z" fill="#1B0021"/>
      <path d="M43.2311 45.4757L38.3911 68.8457H38.2611L43.1011 45.4757H43.2311Z" fill="#1B0021"/>
      <path d="M43.3611 45.4757L38.5211 68.8457H38.3911L43.2311 45.4757H43.3611Z" fill="#1B0021"/>
      <path d="M43.4911 45.4757L38.6411 68.8457H38.5211L43.3611 45.4757H43.4911Z" fill="#1B0021"/>
      <path d="M43.6111 45.4757L38.7711 68.8457H38.6411L43.4911 45.4757H43.6111Z" fill="#1B0021"/>
      <path d="M43.7411 45.4757L38.9011 68.8457H38.7711L43.6111 45.4757H43.7411Z" fill="#1B0021"/>
      <path d="M43.8711 45.4757L39.0311 68.8457H38.9011L43.7411 45.4757H43.8711Z" fill="#1B0021"/>
      <path d="M44.0011 45.4757L39.161 68.8457H39.0311L43.8711 45.4757H44.0011Z" fill="#1B0021"/>
      <path d="M44.1311 45.4757L39.291 68.8457H39.161L44.0011 45.4757H44.1311Z" fill="#1B0021"/>
      <path d="M44.2611 45.4757L39.411 68.8457H39.291L44.1311 45.4757H44.2611Z" fill="#1B0021"/>
      <path d="M44.3811 45.4757L39.541 68.8457H39.411L44.2611 45.4757H44.3811Z" fill="#1B0021"/>
      <path d="M44.5111 45.4757L39.671 68.8457H39.541L44.3811 45.4757H44.5111Z" fill="#1B0021"/>
      <path d="M44.6411 45.4757L39.801 68.8457H39.671L44.5111 45.4757H44.6411Z" fill="#1B0021"/>
      <path d="M44.7711 45.4757L39.931 68.8457H39.801L44.6411 45.4757H44.7711Z" fill="#1B0021"/>
      <path d="M44.9011 45.4757L40.061 68.8457H39.931L44.7711 45.4757H44.9011Z" fill="#1B0021"/>
      <path d="M45.0311 45.4757L40.181 68.8457H40.061L44.9011 45.4757H45.0311Z" fill="#1B0021"/>
      <path d="M45.161 45.4757L40.311 68.8457H40.181L45.0311 45.4757H45.161Z" fill="#1B0021"/>
      <path d="M45.2811 45.4757L40.441 68.8457H40.311L45.161 45.4757H45.2811Z" fill="#1B0021"/>
      <path d="M45.411 45.4757L40.571 68.8457H40.441L45.2811 45.4757H45.411Z" fill="#1B0021"/>
      <path d="M45.541 45.4757L40.701 68.8457H40.571L45.411 45.4757H45.541Z" fill="#1B0021"/>
      <path d="M45.671 45.4757L40.8311 68.8457H40.701L45.541 45.4757H45.671Z" fill="#1B0021"/>
      <path d="M45.801 45.4757L40.951 68.8457H40.8311L45.671 45.4757H45.801Z" fill="#1B0021"/>
      <path d="M45.931 45.4757L41.0811 68.8457H40.951L45.801 45.4757H45.931Z" fill="#1B0021"/>
      <path d="M46.051 45.4757L41.2111 68.8457H41.0811L45.931 45.4757H46.051Z" fill="#1B0021"/>
      <path d="M46.181 45.4757L41.3411 68.8457H41.2111L46.051 45.4757H46.181Z" fill="#1B0021"/>
      <path d="M46.311 45.4757L41.4711 68.8457H41.3411L46.181 45.4757H46.311Z" fill="#1B0021"/>
      <path d="M46.441 45.4757L41.6011 68.8457H41.4711L46.311 45.4757H46.441Z" fill="#1B0021"/>
      <path d="M46.571 45.4757L41.7311 68.8457H41.6011L46.441 45.4757H46.571Z" fill="#1B0021"/>
      <path d="M46.701 45.4757L41.8511 68.8457H41.7311L46.571 45.4757H46.701Z" fill="#1B0021"/>
      <path d="M46.821 45.4757L41.9811 68.8457H41.8511L46.701 45.4757H46.821Z" fill="#1B0021"/>
      <path d="M46.951 45.4757L42.1111 68.8457H41.9811L46.821 45.4757H46.951Z" fill="#1B0021"/>
      <path d="M47.0811 45.4757L42.2411 68.8457H42.1111L46.951 45.4757H47.0811Z" fill="#1B0021"/>
      <path d="M47.2111 45.4757L42.3711 68.8457H42.2411L47.0811 45.4757H47.2111Z" fill="#1B0021"/>
      <path d="M47.3411 45.4757L42.5011 68.8457H42.3711L47.2111 45.4757H47.3411Z" fill="#1B0021"/>
      <path d="M47.4711 45.4757L42.6211 68.8457H42.5011L47.3411 45.4757H47.4711Z" fill="#1B0021"/>
      <path d="M47.6011 45.4757L42.7511 68.8457H42.6211L47.4711 45.4757H47.6011Z" fill="#1B0021"/>
      <path d="M47.7211 45.4757L42.8811 68.8457H42.7511L47.6011 45.4757H47.7211Z" fill="#1B0021"/>
      <path d="M47.8511 45.4757L43.0111 68.8457H42.8811L47.7211 45.4757H47.8511Z" fill="#1B0021"/>
      <path d="M47.9811 45.4757L43.1411 68.8457H43.0111L47.8511 45.4757H47.9811Z" fill="#1B0021"/>
      <path d="M48.1111 45.4757L43.2711 68.8457H43.1411L47.9811 45.4757H48.1111Z" fill="#1B0021"/>
      <path d="M48.2411 45.4757L43.3911 68.8457H43.2711L48.1111 45.4757H48.2411Z" fill="#1B0021"/>
      <path d="M48.3711 45.4757L43.5211 68.8457H43.3911L48.2411 45.4757H48.3711Z" fill="#1B0021"/>
      <path d="M48.4911 45.4757L43.6511 68.8457H43.5211L48.3711 45.4757H48.4911Z" fill="#1B0021"/>
      <path d="M48.6211 45.4757L43.7811 68.8457H43.6511L48.4911 45.4757H48.6211Z" fill="#1B0021"/>
      <path d="M48.7511 45.4757L43.911 68.8457H43.7811L48.6211 45.4757H48.7511Z" fill="#1B0021"/>
      <path d="M48.8811 45.4757L44.041 68.8457H43.911L48.7511 45.4757H48.8811Z" fill="#1B0021"/>
      <path d="M49.0111 45.4757L44.161 68.8457H44.041L48.8811 45.4757H49.0111Z" fill="#1B0021"/>
      <path d="M49.1411 45.4757L44.291 68.8457H44.161L49.0111 45.4757H49.1411Z" fill="#1B0021"/>
      <path d="M49.2611 45.4757L44.421 68.8457H44.291L49.1411 45.4757H49.2611Z" fill="#1B0021"/>
      <path d="M49.3911 45.4757L44.551 68.8457H44.421L49.2611 45.4757H49.3911Z" fill="#1B0021"/>
      <path d="M49.5211 45.4757L44.681 68.8457H44.551L49.3911 45.4757H49.5211Z" fill="#1B0021"/>
      <path d="M49.6511 45.4757L44.811 68.8457H44.681L49.5211 45.4757H49.6511Z" fill="#1B0021"/>
      <path d="M49.7811 45.4757L44.941 68.8457H44.811L49.6511 45.4757H49.7811Z" fill="#1B0021"/>
      <path d="M49.911 45.4757L45.061 68.8457H44.941L49.7811 45.4757H49.911Z" fill="#1B0021"/>
      <path d="M50.0311 45.4757L45.191 68.8457H45.061L49.911 45.4757H50.0311Z" fill="#1B0021"/>
      <path d="M50.161 45.4757L45.321 68.8457H45.191L50.0311 45.4757H50.161Z" fill="#1B0021"/>
      <path d="M50.291 45.4757L45.451 68.8457H45.321L50.161 45.4757H50.291Z" fill="#1B0021"/>
      <path d="M50.421 45.4757L45.5811 68.8457H45.451L50.291 45.4757H50.421Z" fill="#1B0021"/>
      <path d="M50.551 45.4757L45.7111 68.8457H45.5811L50.421 45.4757H50.551Z" fill="#1B0021"/>
      <path d="M50.681 45.4757L45.8311 68.8457H45.7111L50.551 45.4757H50.681Z" fill="#1B0021"/>
      <path d="M50.811 45.4757L45.9611 68.8457H45.8311L50.681 45.4757H50.811Z" fill="#1B0021"/>
      <path d="M50.931 45.4757L46.0911 68.8457H45.9611L50.811 45.4757H50.931Z" fill="#1B0021"/>
      <path d="M51.061 45.4757L46.2211 68.8457H46.0911L50.931 45.4757H51.061Z" fill="#1B0021"/>
      <path d="M51.191 45.4757L46.3511 68.8457H46.2211L51.061 45.4757H51.191Z" fill="#1B0021"/>
      <path d="M51.321 45.4757L46.4811 68.8457H46.3511L51.191 45.4757H51.321Z" fill="#1B0021"/>
      <path d="M51.451 45.4757L46.6011 68.8457H46.4811L51.321 45.4757H51.451Z" fill="#1B0021"/>
      <path d="M51.5811 45.4757L46.7311 68.8457H46.6011L51.451 45.4757H51.5811Z" fill="#1B0021"/>
      <path d="M51.701 45.4757L46.8611 68.8457H46.7311L51.5811 45.4757H51.701Z" fill="#1B0021"/>
      <path d="M51.8311 45.4757L46.9911 68.8457H46.8611L51.701 45.4757H51.8311Z" fill="#1B0021"/>
      <path d="M51.9611 45.4757L47.1211 68.8457H46.9911L51.8311 45.4757H51.9611Z" fill="#1B0021"/>
      <path d="M52.0911 45.4757L47.2511 68.8457H47.1211L51.9611 45.4757H52.0911Z" fill="#1B0021"/>
      <path d="M52.2211 45.4757L47.3711 68.8457H47.2511L52.0911 45.4757H52.2211Z" fill="#1B0021"/>
      <path d="M52.3511 45.4757L47.5011 68.8457H47.3711L52.2211 45.4757H52.3511Z" fill="#1B0021"/>
      <path d="M52.4711 45.4757L47.6311 68.8457H47.5011L52.3511 45.4757H52.4711Z" fill="#1B0021"/>
      <path d="M52.6011 45.4757L47.7611 68.8457H47.6311L52.4711 45.4757H52.6011Z" fill="#1B0021"/>
      <path d="M52.7311 45.4757L47.8911 68.8457H47.7611L52.6011 45.4757H52.7311Z" fill="#1B0021"/>
      <path d="M52.8611 45.4757L48.0211 68.8457H47.8911L52.7311 45.4757H52.8611Z" fill="#1B0021"/>
      <path d="M52.9911 45.4757L48.1511 68.8457H48.0211L52.8611 45.4757H52.9911Z" fill="#1B0021"/>
      <path d="M53.1211 45.4757L48.2711 68.8457H48.1511L52.9911 45.4757H53.1211Z" fill="#1B0021"/>
      <path d="M53.2411 45.4757L48.4011 68.8457H48.2711L53.1211 45.4757H53.2411Z" fill="#1B0021"/>
      <path d="M53.3711 45.4757L48.5311 68.8457H48.4011L53.2411 45.4757H53.3711Z" fill="#1B0021"/>
      <path d="M53.5011 45.4757L48.661 68.8457H48.5311L53.3711 45.4757H53.5011Z" fill="#1B0021"/>
      <path d="M53.6311 45.4757L48.791 68.8457H48.661L53.5011 45.4757H53.6311Z" fill="#1B0021"/>
      <path d="M53.7611 45.4757L48.921 68.8457H48.791L53.6311 45.4757H53.7611Z" fill="#1B0021"/>
      <path d="M53.8911 45.4757L49.041 68.8457H48.921L53.7611 45.4757H53.8911Z" fill="#1B0021"/>
      <path d="M49.041 68.8457L53.8911 45.4757H58.8411V68.8457H49.041Z" fill="#1B0021"/>
      </g>
      <path d="M47.1511 17.0857C49.3411 17.0857 51.1111 15.3157 51.1111 13.1357C51.1111 10.9557 49.3411 9.17574 47.1511 9.17574C44.9611 9.17574 43.201 10.9457 43.201 13.1357C43.201 15.3257 44.9711 17.0857 47.1511 17.0857Z" fill="#1B0021"/>
      <mask id={`${id}-1`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="43" y="9" width="9" height="9">
      <path d="M47.1511 17.0857C49.3411 17.0857 51.1111 15.3157 51.1111 13.1357C51.1111 10.9557 49.3411 9.17574 47.1511 9.17574C44.9611 9.17574 43.201 10.9457 43.201 13.1357C43.201 15.3257 44.9711 17.0857 47.1511 17.0857Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-1)`}>
      <path d="M44.9611 9.17574L43.321 17.0857H43.201V9.17574H44.9611Z" fill="#1B0021"/>
      <path d="M45.0011 9.17574L43.3611 17.0857H43.321L44.9611 9.17574H45.0011Z" fill="#1B0021"/>
      <path d="M45.051 9.17574L43.411 17.0857H43.3611L45.0011 9.17574H45.051Z" fill="#1B0021"/>
      <path d="M45.0911 9.17574L43.451 17.0857H43.411L45.051 9.17574H45.0911Z" fill="#1B0021"/>
      <path d="M45.1311 9.17574L43.4911 17.0857H43.451L45.0911 9.17574H45.1311Z" fill="#1B0021"/>
      <path d="M45.181 9.17574L43.541 17.0857H43.4911L45.1311 9.17574H45.181Z" fill="#1B0021"/>
      <path d="M45.2211 9.17574L43.5811 17.0857H43.541L45.181 9.17574H45.2211Z" fill="#1B0021"/>
      <path d="M45.2611 9.17574L43.6211 17.0857H43.5811L45.2211 9.17574H45.2611Z" fill="#1B0021"/>
      <path d="M45.311 9.17574L43.671 17.0857H43.6211L45.2611 9.17574H45.311Z" fill="#1B0021"/>
      <path d="M45.3511 9.17574L43.7111 17.0857H43.671L45.311 9.17574H45.3511Z" fill="#1B0021"/>
      <path d="M45.3911 9.17574L43.7511 17.0857H43.7111L45.3511 9.17574H45.3911Z" fill="#1B0021"/>
      <path d="M45.441 9.17574L43.801 17.0857H43.7511L45.3911 9.17574H45.441Z" fill="#1B0021"/>
      <path d="M45.4811 9.17574L43.8411 17.0857H43.801L45.441 9.17574H45.4811Z" fill="#1B0021"/>
      <path d="M45.5211 9.17574L43.8911 17.0857H43.8411L45.4811 9.17574H45.5211Z" fill="#1B0021"/>
      <path d="M45.571 9.17574L43.931 17.0857H43.8911L45.5211 9.17574H45.571Z" fill="#1B0021"/>
      <path d="M45.6111 9.17574L43.9711 17.0857H43.931L45.571 9.17574H45.6111Z" fill="#1B0021"/>
      <path d="M45.6511 9.17574L44.0211 17.0857H43.9711L45.6111 9.17574H45.6511Z" fill="#1B0021"/>
      <path d="M45.701 9.17574L44.061 17.0857H44.0211L45.6511 9.17574H45.701Z" fill="#1B0021"/>
      <path d="M45.7411 9.17574L44.1011 17.0857H44.061L45.701 9.17574H45.7411Z" fill="#1B0021"/>
      <path d="M45.7811 9.17574L44.1511 17.0857H44.1011L45.7411 9.17574H45.7811Z" fill="#1B0021"/>
      <path d="M45.8311 9.17574L44.191 17.0857H44.1511L45.7811 9.17574H45.8311Z" fill="#1B0021"/>
      <path d="M45.8711 9.17574L44.2311 17.0857H44.191L45.8311 9.17574H45.8711Z" fill="#1B0021"/>
      <path d="M45.911 9.17574L44.2811 17.0857H44.2311L45.8711 9.17574H45.911Z" fill="#1B0021"/>
      <path d="M45.9611 9.17574L44.321 17.0857H44.2811L45.911 9.17574H45.9611Z" fill="#1B0021"/>
      <path d="M46.0011 9.17574L44.3611 17.0857H44.321L45.9611 9.17574H46.0011Z" fill="#1B0021"/>
      <path d="M46.041 9.17574L44.411 17.0857H44.3611L46.0011 9.17574H46.041Z" fill="#1B0021"/>
      <path d="M46.0911 9.17574L44.451 17.0857H44.411L46.041 9.17574H46.0911Z" fill="#1B0021"/>
      <path d="M46.1311 9.17574L44.4911 17.0857H44.451L46.0911 9.17574H46.1311Z" fill="#1B0021"/>
      <path d="M46.171 9.17574L44.541 17.0857H44.4911L46.1311 9.17574H46.171Z" fill="#1B0021"/>
      <path d="M46.2211 9.17574L44.5811 17.0857H44.541L46.171 9.17574H46.2211Z" fill="#1B0021"/>
      <path d="M46.2611 9.17574L44.6211 17.0857H44.5811L46.2211 9.17574H46.2611Z" fill="#1B0021"/>
      <path d="M46.301 9.17574L44.671 17.0857H44.6211L46.2611 9.17574H46.301Z" fill="#1B0021"/>
      <path d="M46.3511 9.17574L44.7111 17.0857H44.671L46.301 9.17574H46.3511Z" fill="#1B0021"/>
      <path d="M46.3911 9.17574L44.7511 17.0857H44.7111L46.3511 9.17574H46.3911Z" fill="#1B0021"/>
      <path d="M46.431 9.17574L44.801 17.0857H44.7511L46.3911 9.17574H46.431Z" fill="#1B0021"/>
      <path d="M46.4811 9.17574L44.8411 17.0857H44.801L46.431 9.17574H46.4811Z" fill="#1B0021"/>
      <path d="M46.5211 9.17574L44.8811 17.0857H44.8411L46.4811 9.17574H46.5211Z" fill="#1B0021"/>
      <path d="M46.561 9.17574L44.931 17.0857H44.8811L46.5211 9.17574H46.561Z" fill="#1B0021"/>
      <path d="M46.6111 9.17574L44.9711 17.0857H44.931L46.561 9.17574H46.6111Z" fill="#1B0021"/>
      <path d="M46.6511 9.17574L45.0111 17.0857H44.9711L46.6111 9.17574H46.6511Z" fill="#1B0021"/>
      <path d="M46.701 9.17574L45.061 17.0857H45.0111L46.6511 9.17574H46.701Z" fill="#1B0021"/>
      <path d="M46.7411 9.17574L45.1011 17.0857H45.061L46.701 9.17574H46.7411Z" fill="#1B0021"/>
      <path d="M46.7811 9.17574L45.1411 17.0857H45.1011L46.7411 9.17574H46.7811Z" fill="#1B0021"/>
      <path d="M46.8311 9.17574L45.191 17.0857H45.1411L46.7811 9.17574H46.8311Z" fill="#1B0021"/>
      <path d="M46.8711 9.17574L45.2311 17.0857H45.191L46.8311 9.17574H46.8711Z" fill="#1B0021"/>
      <path d="M46.911 9.17574L45.2711 17.0857H45.2311L46.8711 9.17574H46.911Z" fill="#1B0021"/>
      <path d="M46.9611 9.17574L45.321 17.0857H45.2711L46.911 9.17574H46.9611Z" fill="#1B0021"/>
      <path d="M47.0011 9.17574L45.3611 17.0857H45.321L46.9611 9.17574H47.0011Z" fill="#1B0021"/>
      <path d="M47.041 9.17574L45.4011 17.0857H45.3611L47.0011 9.17574H47.041Z" fill="#1B0021"/>
      <path d="M47.0911 9.17574L45.451 17.0857H45.4011L47.041 9.17574H47.0911Z" fill="#1B0021"/>
      <path d="M47.1311 9.17574L45.4911 17.0857H45.451L47.0911 9.17574H47.1311Z" fill="#1B0021"/>
      <path d="M47.171 9.17574L45.541 17.0857H45.4911L47.1311 9.17574H47.171Z" fill="#1B0021"/>
      <path d="M47.2211 9.17574L45.5811 17.0857H45.541L47.171 9.17574H47.2211Z" fill="#1B0021"/>
      <path d="M47.2611 9.17574L45.6211 17.0857H45.5811L47.2211 9.17574H47.2611Z" fill="#1B0021"/>
      <path d="M47.301 9.17574L45.671 17.0857H45.6211L47.2611 9.17574H47.301Z" fill="#1B0021"/>
      <path d="M47.3511 9.17574L45.7111 17.0857H45.671L47.301 9.17574H47.3511Z" fill="#1B0021"/>
      <path d="M47.3911 9.17574L45.7511 17.0857H45.7111L47.3511 9.17574H47.3911Z" fill="#1B0021"/>
      <path d="M47.431 9.17574L45.801 17.0857H45.7511L47.3911 9.17574H47.431Z" fill="#1B0021"/>
      <path d="M47.4811 9.17574L45.8411 17.0857H45.801L47.431 9.17574H47.4811Z" fill="#1B0021"/>
      <path d="M47.5211 9.17574L45.8811 17.0857H45.8411L47.4811 9.17574H47.5211Z" fill="#1B0021"/>
      <path d="M47.561 9.17574L45.931 17.0857H45.8811L47.5211 9.17574H47.561Z" fill="#1B0021"/>
      <path d="M47.6111 9.17574L45.9711 17.0857H45.931L47.561 9.17574H47.6111Z" fill="#1B0021"/>
      <path d="M47.6511 9.17574L46.0111 17.0857H45.9711L47.6111 9.17574H47.6511Z" fill="#1B0021"/>
      <path d="M47.691 9.17574L46.061 17.0857H46.0111L47.6511 9.17574H47.691Z" fill="#1B0021"/>
      <path d="M47.7411 9.17574L46.1011 17.0857H46.061L47.691 9.17574H47.7411Z" fill="#1B0021"/>
      <path d="M47.7811 9.17574L46.1411 17.0857H46.1011L47.7411 9.17574H47.7811Z" fill="#1B0021"/>
      <path d="M47.821 9.17574L46.191 17.0857H46.1411L47.7811 9.17574H47.821Z" fill="#1B0021"/>
      <path d="M47.8711 9.17574L46.2311 17.0857H46.191L47.821 9.17574H47.8711Z" fill="#1B0021"/>
      <path d="M47.911 9.17574L46.2711 17.0857H46.2311L47.8711 9.17574H47.911Z" fill="#1B0021"/>
      <path d="M47.951 9.17574L46.321 17.0857H46.2711L47.911 9.17574H47.951Z" fill="#1B0021"/>
      <path d="M48.0011 9.17574L46.3611 17.0857H46.321L47.951 9.17574H48.0011Z" fill="#1B0021"/>
      <path d="M48.041 9.17574L46.4011 17.0857H46.3611L48.0011 9.17574H48.041Z" fill="#1B0021"/>
      <path d="M48.0811 9.17574L46.451 17.0857H46.4011L48.041 9.17574H48.0811Z" fill="#1B0021"/>
      <path d="M48.1311 9.17574L46.4911 17.0857H46.451L48.0811 9.17574H48.1311Z" fill="#1B0021"/>
      <path d="M48.171 9.17574L46.5311 17.0857H46.4911L48.1311 9.17574H48.171Z" fill="#1B0021"/>
      <path d="M48.2111 9.17574L46.5811 17.0857H46.5311L48.171 9.17574H48.2111Z" fill="#1B0021"/>
      <path d="M48.2611 9.17574L46.6211 17.0857H46.5811L48.2111 9.17574H48.2611Z" fill="#1B0021"/>
      <path d="M48.301 9.17574L46.661 17.0857H46.6211L48.2611 9.17574H48.301Z" fill="#1B0021"/>
      <path d="M48.3511 9.17574L46.7111 17.0857H46.661L48.301 9.17574H48.3511Z" fill="#1B0021"/>
      <path d="M48.3911 9.17574L46.7511 17.0857H46.7111L48.3511 9.17574H48.3911Z" fill="#1B0021"/>
      <path d="M48.431 9.17574L46.791 17.0857H46.7511L48.3911 9.17574H48.431Z" fill="#1B0021"/>
      <path d="M48.4811 9.17574L46.8411 17.0857H46.791L48.431 9.17574H48.4811Z" fill="#1B0021"/>
      <path d="M48.5211 9.17574L46.8811 17.0857H46.8411L48.4811 9.17574H48.5211Z" fill="#1B0021"/>
      <path d="M48.561 9.17574L46.921 17.0857H46.8811L48.5211 9.17574H48.561Z" fill="#1B0021"/>
      <path d="M48.6111 9.17574L46.9711 17.0857H46.921L48.561 9.17574H48.6111Z" fill="#1B0021"/>
      <path d="M48.6511 9.17574L47.0111 17.0857H46.9711L48.6111 9.17574H48.6511Z" fill="#1B0021"/>
      <path d="M48.691 9.17574L47.061 17.0857H47.0111L48.6511 9.17574H48.691Z" fill="#1B0021"/>
      <path d="M48.7411 9.17574L47.1011 17.0857H47.061L48.691 9.17574H48.7411Z" fill="#1B0021"/>
      <path d="M48.7811 9.17574L47.1411 17.0857H47.1011L48.7411 9.17574H48.7811Z" fill="#1B0021"/>
      <path d="M48.821 9.17574L47.191 17.0857H47.1411L48.7811 9.17574H48.821Z" fill="#1B0021"/>
      <path d="M48.8711 9.17574L47.2311 17.0857H47.191L48.821 9.17574H48.8711Z" fill="#1B0021"/>
      <path d="M48.911 9.17574L47.2711 17.0857H47.2311L48.8711 9.17574H48.911Z" fill="#1B0021"/>
      <path d="M48.951 9.17574L47.321 17.0857H47.2711L48.911 9.17574H48.951Z" fill="#1B0021"/>
      <path d="M49.0011 9.17574L47.3611 17.0857H47.321L48.951 9.17574H49.0011Z" fill="#1B0021"/>
      <path d="M49.041 9.17574L47.4011 17.0857H47.3611L49.0011 9.17574H49.041Z" fill="#1B0021"/>
      <path d="M49.0811 9.17574L47.451 17.0857H47.4011L49.041 9.17574H49.0811Z" fill="#1B0021"/>
      <path d="M49.1311 9.17574L47.4911 17.0857H47.451L49.0811 9.17574H49.1311Z" fill="#1B0021"/>
      <path d="M49.171 9.17574L47.5311 17.0857H47.4911L49.1311 9.17574H49.171Z" fill="#1B0021"/>
      <path d="M49.2111 9.17574L47.5811 17.0857H47.5311L49.171 9.17574H49.2111Z" fill="#1B0021"/>
      <path d="M49.2611 9.17574L47.6211 17.0857H47.5811L49.2111 9.17574H49.2611Z" fill="#1B0021"/>
      <path d="M49.301 9.17574L47.661 17.0857H47.6211L49.2611 9.17574H49.301Z" fill="#1B0021"/>
      <path d="M49.3411 9.17574L47.7111 17.0857H47.661L49.301 9.17574H49.3411Z" fill="#1B0021"/>
      <path d="M49.3911 9.17574L47.7511 17.0857H47.7111L49.3411 9.17574H49.3911Z" fill="#1B0021"/>
      <path d="M49.431 9.17574L47.791 17.0857H47.7511L49.3911 9.17574H49.431Z" fill="#1B0021"/>
      <path d="M47.791 17.0857L49.431 9.17574H51.1111V17.0857H47.791Z" fill="#1B0021"/>
      </g>
      <path d="M22.0811 28.2257C24.2611 28.2257 26.0311 26.4557 26.0311 24.2757C26.0311 22.0957 24.2611 20.3257 22.0811 20.3257C19.9011 20.3257 18.1211 22.0957 18.1211 24.2757C18.1211 26.4557 19.8911 28.2257 22.0811 28.2257Z" fill="#1B0021"/>
      <mask id={`${id}-2`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="18" y="20" width="9" height="9">
      <path d="M22.0811 28.2257C24.2611 28.2257 26.0311 26.4557 26.0311 24.2757C26.0311 22.0957 24.2611 20.3257 22.0811 20.3257C19.9011 20.3257 18.1211 22.0957 18.1211 24.2757C18.1211 26.4557 19.8911 28.2257 22.0811 28.2257Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-2)`}>
      <path d="M19.8811 20.3257L18.2411 28.2257H18.1211V20.3257H19.8811Z" fill="#1B0021"/>
      <path d="M19.921 20.3257L18.291 28.2257H18.2411L19.8811 20.3257H19.921Z" fill="#1B0021"/>
      <path d="M19.9711 20.3257L18.3311 28.2257H18.291L19.921 20.3257H19.9711Z" fill="#1B0021"/>
      <path d="M20.0111 20.3257L18.3711 28.2257H18.3311L19.9711 20.3257H20.0111Z" fill="#1B0021"/>
      <path d="M20.051 20.3257L18.421 28.2257H18.3711L20.0111 20.3257H20.051Z" fill="#1B0021"/>
      <path d="M20.1011 20.3257L18.4611 28.2257H18.421L20.051 20.3257H20.1011Z" fill="#1B0021"/>
      <path d="M20.1411 20.3257L18.5011 28.2257H18.4611L20.1011 20.3257H20.1411Z" fill="#1B0021"/>
      <path d="M20.181 20.3257L18.551 28.2257H18.5011L20.1411 20.3257H20.181Z" fill="#1B0021"/>
      <path d="M20.2311 20.3257L18.5911 28.2257H18.551L20.181 20.3257H20.2311Z" fill="#1B0021"/>
      <path d="M20.2711 20.3257L18.6311 28.2257H18.5911L20.2311 20.3257H20.2711Z" fill="#1B0021"/>
      <path d="M20.311 20.3257L18.681 28.2257H18.6311L20.2711 20.3257H20.311Z" fill="#1B0021"/>
      <path d="M20.3611 20.3257L18.7211 28.2257H18.681L20.311 20.3257H20.3611Z" fill="#1B0021"/>
      <path d="M20.4011 20.3257L18.7611 28.2257H18.7211L20.3611 20.3257H20.4011Z" fill="#1B0021"/>
      <path d="M20.441 20.3257L18.811 28.2257H18.7611L20.4011 20.3257H20.441Z" fill="#1B0021"/>
      <path d="M20.4911 20.3257L18.8511 28.2257H18.811L20.441 20.3257H20.4911Z" fill="#1B0021"/>
      <path d="M20.5311 20.3257L18.8911 28.2257H18.8511L20.4911 20.3257H20.5311Z" fill="#1B0021"/>
      <path d="M20.5811 20.3257L18.941 28.2257H18.8911L20.5311 20.3257H20.5811Z" fill="#1B0021"/>
      <path d="M20.6211 20.3257L18.9811 28.2257H18.941L20.5811 20.3257H20.6211Z" fill="#1B0021"/>
      <path d="M20.661 20.3257L19.0211 28.2257H18.9811L20.6211 20.3257H20.661Z" fill="#1B0021"/>
      <path d="M20.7111 20.3257L19.071 28.2257H19.0211L20.661 20.3257H20.7111Z" fill="#1B0021"/>
      <path d="M20.7511 20.3257L19.1111 28.2257H19.071L20.7111 20.3257H20.7511Z" fill="#1B0021"/>
      <path d="M20.791 20.3257L19.1511 28.2257H19.1111L20.7511 20.3257H20.791Z" fill="#1B0021"/>
      <path d="M20.8411 20.3257L19.201 28.2257H19.1511L20.791 20.3257H20.8411Z" fill="#1B0021"/>
      <path d="M20.8811 20.3257L19.2411 28.2257H19.201L20.8411 20.3257H20.8811Z" fill="#1B0021"/>
      <path d="M20.921 20.3257L19.2811 28.2257H19.2411L20.8811 20.3257H20.921Z" fill="#1B0021"/>
      <path d="M20.9711 20.3257L19.3311 28.2257H19.2811L20.921 20.3257H20.9711Z" fill="#1B0021"/>
      <path d="M21.0111 20.3257L19.3711 28.2257H19.3311L20.9711 20.3257H21.0111Z" fill="#1B0021"/>
      <path d="M21.051 20.3257L19.421 28.2257H19.3711L21.0111 20.3257H21.051Z" fill="#1B0021"/>
      <path d="M21.1011 20.3257L19.4611 28.2257H19.421L21.051 20.3257H21.1011Z" fill="#1B0021"/>
      <path d="M21.1411 20.3257L19.5011 28.2257H19.4611L21.1011 20.3257H21.1411Z" fill="#1B0021"/>
      <path d="M21.181 20.3257L19.551 28.2257H19.5011L21.1411 20.3257H21.181Z" fill="#1B0021"/>
      <path d="M21.2311 20.3257L19.5911 28.2257H19.551L21.181 20.3257H21.2311Z" fill="#1B0021"/>
      <path d="M21.2711 20.3257L19.6311 28.2257H19.5911L21.2311 20.3257H21.2711Z" fill="#1B0021"/>
      <path d="M21.311 20.3257L19.681 28.2257H19.6311L21.2711 20.3257H21.311Z" fill="#1B0021"/>
      <path d="M21.3611 20.3257L19.7211 28.2257H19.681L21.311 20.3257H21.3611Z" fill="#1B0021"/>
      <path d="M21.4011 20.3257L19.7611 28.2257H19.7211L21.3611 20.3257H21.4011Z" fill="#1B0021"/>
      <path d="M21.441 20.3257L19.811 28.2257H19.7611L21.4011 20.3257H21.441Z" fill="#1B0021"/>
      <path d="M21.4911 20.3257L19.8511 28.2257H19.811L21.441 20.3257H21.4911Z" fill="#1B0021"/>
      <path d="M21.5311 20.3257L19.8911 28.2257H19.8511L21.4911 20.3257H21.5311Z" fill="#1B0021"/>
      <path d="M21.571 20.3257L19.941 28.2257H19.8911L21.5311 20.3257H21.571Z" fill="#1B0021"/>
      <path d="M21.6211 20.3257L19.9811 28.2257H19.941L21.571 20.3257H21.6211Z" fill="#1B0021"/>
      <path d="M21.661 20.3257L20.0211 28.2257H19.9811L21.6211 20.3257H21.661Z" fill="#1B0021"/>
      <path d="M21.701 20.3257L20.071 28.2257H20.0211L21.661 20.3257H21.701Z" fill="#1B0021"/>
      <path d="M21.7511 20.3257L20.1111 28.2257H20.071L21.701 20.3257H21.7511Z" fill="#1B0021"/>
      <path d="M21.791 20.3257L20.1511 28.2257H20.1111L21.7511 20.3257H21.791Z" fill="#1B0021"/>
      <path d="M21.8311 20.3257L20.201 28.2257H20.1511L21.791 20.3257H21.8311Z" fill="#1B0021"/>
      <path d="M21.8811 20.3257L20.2411 28.2257H20.201L21.8311 20.3257H21.8811Z" fill="#1B0021"/>
      <path d="M21.921 20.3257L20.2811 28.2257H20.2411L21.8811 20.3257H21.921Z" fill="#1B0021"/>
      <path d="M21.9611 20.3257L20.3311 28.2257H20.2811L21.921 20.3257H21.9611Z" fill="#1B0021"/>
      <path d="M22.0111 20.3257L20.3711 28.2257H20.3311L21.9611 20.3257H22.0111Z" fill="#1B0021"/>
      <path d="M22.051 20.3257L20.411 28.2257H20.3711L22.0111 20.3257H22.051Z" fill="#1B0021"/>
      <path d="M22.0911 20.3257L20.4611 28.2257H20.411L22.051 20.3257H22.0911Z" fill="#1B0021"/>
      <path d="M22.1411 20.3257L20.5011 28.2257H20.4611L22.0911 20.3257H22.1411Z" fill="#1B0021"/>
      <path d="M22.181 20.3257L20.541 28.2257H20.5011L22.1411 20.3257H22.181Z" fill="#1B0021"/>
      <path d="M22.2311 20.3257L20.5911 28.2257H20.541L22.181 20.3257H22.2311Z" fill="#1B0021"/>
      <path d="M22.2711 20.3257L20.6311 28.2257H20.5911L22.2311 20.3257H22.2711Z" fill="#1B0021"/>
      <path d="M22.311 20.3257L20.671 28.2257H20.6311L22.2711 20.3257H22.311Z" fill="#1B0021"/>
      <path d="M22.3611 20.3257L20.7211 28.2257H20.671L22.311 20.3257H22.3611Z" fill="#1B0021"/>
      <path d="M22.4011 20.3257L20.7611 28.2257H20.7211L22.3611 20.3257H22.4011Z" fill="#1B0021"/>
      <path d="M22.441 20.3257L20.801 28.2257H20.7611L22.4011 20.3257H22.441Z" fill="#1B0021"/>
      <path d="M22.4911 20.3257L20.8511 28.2257H20.801L22.441 20.3257H22.4911Z" fill="#1B0021"/>
      <path d="M22.5311 20.3257L20.8911 28.2257H20.8511L22.4911 20.3257H22.5311Z" fill="#1B0021"/>
      <path d="M22.571 20.3257L20.931 28.2257H20.8911L22.5311 20.3257H22.571Z" fill="#1B0021"/>
      <path d="M22.6211 20.3257L20.9811 28.2257H20.931L22.571 20.3257H22.6211Z" fill="#1B0021"/>
      <path d="M22.661 20.3257L21.0211 28.2257H20.9811L22.6211 20.3257H22.661Z" fill="#1B0021"/>
      <path d="M22.701 20.3257L21.071 28.2257H21.0211L22.661 20.3257H22.701Z" fill="#1B0021"/>
      <path d="M22.7511 20.3257L21.1111 28.2257H21.071L22.701 20.3257H22.7511Z" fill="#1B0021"/>
      <path d="M22.791 20.3257L21.1511 28.2257H21.1111L22.7511 20.3257H22.791Z" fill="#1B0021"/>
      <path d="M22.8311 20.3257L21.201 28.2257H21.1511L22.791 20.3257H22.8311Z" fill="#1B0021"/>
      <path d="M22.8811 20.3257L21.2411 28.2257H21.201L22.8311 20.3257H22.8811Z" fill="#1B0021"/>
      <path d="M22.921 20.3257L21.2811 28.2257H21.2411L22.8811 20.3257H22.921Z" fill="#1B0021"/>
      <path d="M22.9611 20.3257L21.3311 28.2257H21.2811L22.921 20.3257H22.9611Z" fill="#1B0021"/>
      <path d="M23.0111 20.3257L21.3711 28.2257H21.3311L22.9611 20.3257H23.0111Z" fill="#1B0021"/>
      <path d="M23.051 20.3257L21.411 28.2257H21.3711L23.0111 20.3257H23.051Z" fill="#1B0021"/>
      <path d="M23.0911 20.3257L21.4611 28.2257H21.411L23.051 20.3257H23.0911Z" fill="#1B0021"/>
      <path d="M23.1411 20.3257L21.5011 28.2257H21.4611L23.0911 20.3257H23.1411Z" fill="#1B0021"/>
      <path d="M23.181 20.3257L21.541 28.2257H21.5011L23.1411 20.3257H23.181Z" fill="#1B0021"/>
      <path d="M23.2211 20.3257L21.5911 28.2257H21.541L23.181 20.3257H23.2211Z" fill="#1B0021"/>
      <path d="M23.2711 20.3257L21.6311 28.2257H21.5911L23.2211 20.3257H23.2711Z" fill="#1B0021"/>
      <path d="M23.311 20.3257L21.671 28.2257H21.6311L23.2711 20.3257H23.311Z" fill="#1B0021"/>
      <path d="M23.3511 20.3257L21.7211 28.2257H21.671L23.311 20.3257H23.3511Z" fill="#1B0021"/>
      <path d="M23.4011 20.3257L21.7611 28.2257H21.7211L23.3511 20.3257H23.4011Z" fill="#1B0021"/>
      <path d="M23.441 20.3257L21.801 28.2257H21.7611L23.4011 20.3257H23.441Z" fill="#1B0021"/>
      <path d="M23.4811 20.3257L21.8511 28.2257H21.801L23.441 20.3257H23.4811Z" fill="#1B0021"/>
      <path d="M23.5311 20.3257L21.8911 28.2257H21.8511L23.4811 20.3257H23.5311Z" fill="#1B0021"/>
      <path d="M23.571 20.3257L21.931 28.2257H21.8911L23.5311 20.3257H23.571Z" fill="#1B0021"/>
      <path d="M23.6111 20.3257L21.9811 28.2257H21.931L23.571 20.3257H23.6111Z" fill="#1B0021"/>
      <path d="M23.661 20.3257L22.0211 28.2257H21.9811L23.6111 20.3257H23.661Z" fill="#1B0021"/>
      <path d="M23.701 20.3257L22.061 28.2257H22.0211L23.661 20.3257H23.701Z" fill="#1B0021"/>
      <path d="M23.7411 20.3257L22.1111 28.2257H22.061L23.701 20.3257H23.7411Z" fill="#1B0021"/>
      <path d="M23.791 20.3257L22.1511 28.2257H22.1111L23.7411 20.3257H23.791Z" fill="#1B0021"/>
      <path d="M23.8311 20.3257L22.191 28.2257H22.1511L23.791 20.3257H23.8311Z" fill="#1B0021"/>
      <path d="M23.8811 20.3257L22.2411 28.2257H22.191L23.8311 20.3257H23.8811Z" fill="#1B0021"/>
      <path d="M23.921 20.3257L22.2811 28.2257H22.2411L23.8811 20.3257H23.921Z" fill="#1B0021"/>
      <path d="M23.9611 20.3257L22.321 28.2257H22.2811L23.921 20.3257H23.9611Z" fill="#1B0021"/>
      <path d="M24.0111 20.3257L22.3711 28.2257H22.321L23.9611 20.3257H24.0111Z" fill="#1B0021"/>
      <path d="M24.051 20.3257L22.411 28.2257H22.3711L24.0111 20.3257H24.051Z" fill="#1B0021"/>
      <path d="M24.0911 20.3257L22.451 28.2257H22.411L24.051 20.3257H24.0911Z" fill="#1B0021"/>
      <path d="M24.1411 20.3257L22.5011 28.2257H22.451L24.0911 20.3257H24.1411Z" fill="#1B0021"/>
      <path d="M24.181 20.3257L22.541 28.2257H22.5011L24.1411 20.3257H24.181Z" fill="#1B0021"/>
      <path d="M24.2211 20.3257L22.5811 28.2257H22.541L24.181 20.3257H24.2211Z" fill="#1B0021"/>
      <path d="M24.2711 20.3257L22.6311 28.2257H22.5811L24.2211 20.3257H24.2711Z" fill="#1B0021"/>
      <path d="M24.311 20.3257L22.671 28.2257H22.6311L24.2711 20.3257H24.311Z" fill="#1B0021"/>
      <path d="M24.3511 20.3257L22.7211 28.2257H22.671L24.311 20.3257H24.3511Z" fill="#1B0021"/>
      <path d="M22.7211 28.2257L24.3511 20.3257H26.0311V28.2257H22.7211Z" fill="#1B0021"/>
      </g>
      <path d="M12.6011 56.0957C14.7811 56.0957 16.551 54.3257 16.551 52.1457C16.551 49.9657 14.7811 48.1857 12.6011 48.1857C10.4211 48.1857 8.65112 49.9557 8.65112 52.1457C8.65112 54.3357 10.4211 56.0957 12.6011 56.0957Z" fill="#1B0021"/>
      <mask id={`${id}-3`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="8" y="48" width="9" height="9">
      <path d="M12.6011 56.0957C14.7811 56.0957 16.551 54.3257 16.551 52.1457C16.551 49.9657 14.7811 48.1857 12.6011 48.1857C10.4211 48.1857 8.65112 49.9557 8.65112 52.1457C8.65112 54.3357 10.4211 56.0957 12.6011 56.0957Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-3)`}>
      <path d="M10.411 48.1857L8.77112 56.0957H8.65112V48.1857H10.411Z" fill="#1B0021"/>
      <path d="M10.451 48.1857L8.81104 56.0957H8.77112L10.411 48.1857H10.451Z" fill="#1B0021"/>
      <path d="M10.4911 48.1857L8.86108 56.0957H8.81104L10.451 48.1857H10.4911Z" fill="#1B0021"/>
      <path d="M10.541 48.1857L8.90112 56.0957H8.86108L10.4911 48.1857H10.541Z" fill="#1B0021"/>
      <path d="M10.5811 48.1857L8.94104 56.0957H8.90112L10.541 48.1857H10.5811Z" fill="#1B0021"/>
      <path d="M10.6211 48.1857L8.99109 56.0957H8.94104L10.5811 48.1857H10.6211Z" fill="#1B0021"/>
      <path d="M10.671 48.1857L9.03113 56.0957H8.99109L10.6211 48.1857H10.671Z" fill="#1B0021"/>
      <path d="M10.7111 48.1857L9.07104 56.0957H9.03113L10.671 48.1857H10.7111Z" fill="#1B0021"/>
      <path d="M10.7511 48.1857L9.12109 56.0957H9.07104L10.7111 48.1857H10.7511Z" fill="#1B0021"/>
      <path d="M10.801 48.1857L9.16101 56.0957H9.12109L10.7511 48.1857H10.801Z" fill="#1B0021"/>
      <path d="M10.8411 48.1857L9.20105 56.0957H9.16101L10.801 48.1857H10.8411Z" fill="#1B0021"/>
      <path d="M10.8811 48.1857L9.2511 56.0957H9.20105L10.8411 48.1857H10.8811Z" fill="#1B0021"/>
      <path d="M10.931 48.1857L9.29102 56.0957H9.2511L10.8811 48.1857H10.931Z" fill="#1B0021"/>
      <path d="M10.9711 48.1857L9.33105 56.0957H9.29102L10.931 48.1857H10.9711Z" fill="#1B0021"/>
      <path d="M11.0111 48.1857L9.3811 56.0957H9.33105L10.9711 48.1857H11.0111Z" fill="#1B0021"/>
      <path d="M11.061 48.1857L9.42102 56.0957H9.3811L11.0111 48.1857H11.061Z" fill="#1B0021"/>
      <path d="M11.1011 48.1857L9.46106 56.0957H9.42102L11.061 48.1857H11.1011Z" fill="#1B0021"/>
      <path d="M11.1411 48.1857L9.51111 56.0957H9.46106L11.1011 48.1857H11.1411Z" fill="#1B0021"/>
      <path d="M11.191 48.1857L9.55103 56.0957H9.51111L11.1411 48.1857H11.191Z" fill="#1B0021"/>
      <path d="M11.2311 48.1857L9.59106 56.0957H9.55103L11.191 48.1857H11.2311Z" fill="#1B0021"/>
      <path d="M11.2711 48.1857L9.64111 56.0957H9.59106L11.2311 48.1857H11.2711Z" fill="#1B0021"/>
      <path d="M11.321 48.1857L9.68103 56.0957H9.64111L11.2711 48.1857H11.321Z" fill="#1B0021"/>
      <path d="M11.3611 48.1857L9.72107 56.0957H9.68103L11.321 48.1857H11.3611Z" fill="#1B0021"/>
      <path d="M11.411 48.1857L9.77112 56.0957H9.72107L11.3611 48.1857H11.411Z" fill="#1B0021"/>
      <path d="M11.451 48.1857L9.81104 56.0957H9.77112L11.411 48.1857H11.451Z" fill="#1B0021"/>
      <path d="M11.4911 48.1857L9.85107 56.0957H9.81104L11.451 48.1857H11.4911Z" fill="#1B0021"/>
      <path d="M11.541 48.1857L9.90112 56.0957H9.85107L11.4911 48.1857H11.541Z" fill="#1B0021"/>
      <path d="M11.5811 48.1857L9.94104 56.0957H9.90112L11.541 48.1857H11.5811Z" fill="#1B0021"/>
      <path d="M11.6211 48.1857L9.98108 56.0957H9.94104L11.5811 48.1857H11.6211Z" fill="#1B0021"/>
      <path d="M11.671 48.1857L10.0311 56.0957H9.98108L11.6211 48.1857H11.671Z" fill="#1B0021"/>
      <path d="M11.7111 48.1857L10.071 56.0957H10.0311L11.671 48.1857H11.7111Z" fill="#1B0021"/>
      <path d="M11.7511 48.1857L10.1111 56.0957H10.071L11.7111 48.1857H11.7511Z" fill="#1B0021"/>
      <path d="M11.801 48.1857L10.161 56.0957H10.1111L11.7511 48.1857H11.801Z" fill="#1B0021"/>
      <path d="M11.8411 48.1857L10.201 56.0957H10.161L11.801 48.1857H11.8411Z" fill="#1B0021"/>
      <path d="M11.8811 48.1857L10.2511 56.0957H10.201L11.8411 48.1857H11.8811Z" fill="#1B0021"/>
      <path d="M11.931 48.1857L10.291 56.0957H10.2511L11.8811 48.1857H11.931Z" fill="#1B0021"/>
      <path d="M11.9711 48.1857L10.3311 56.0957H10.291L11.931 48.1857H11.9711Z" fill="#1B0021"/>
      <path d="M12.0111 48.1857L10.3811 56.0957H10.3311L11.9711 48.1857H12.0111Z" fill="#1B0021"/>
      <path d="M12.061 48.1857L10.421 56.0957H10.3811L12.0111 48.1857H12.061Z" fill="#1B0021"/>
      <path d="M12.1011 48.1857L10.4611 56.0957H10.421L12.061 48.1857H12.1011Z" fill="#1B0021"/>
      <path d="M12.1411 48.1857L10.5111 56.0957H10.4611L12.1011 48.1857H12.1411Z" fill="#1B0021"/>
      <path d="M12.191 48.1857L10.551 56.0957H10.5111L12.1411 48.1857H12.191Z" fill="#1B0021"/>
      <path d="M12.2311 48.1857L10.5911 56.0957H10.551L12.191 48.1857H12.2311Z" fill="#1B0021"/>
      <path d="M12.2711 48.1857L10.6411 56.0957H10.5911L12.2311 48.1857H12.2711Z" fill="#1B0021"/>
      <path d="M12.321 48.1857L10.681 56.0957H10.6411L12.2711 48.1857H12.321Z" fill="#1B0021"/>
      <path d="M12.3611 48.1857L10.7211 56.0957H10.681L12.321 48.1857H12.3611Z" fill="#1B0021"/>
      <path d="M12.4011 48.1857L10.7711 56.0957H10.7211L12.3611 48.1857H12.4011Z" fill="#1B0021"/>
      <path d="M12.451 48.1857L10.811 56.0957H10.7711L12.4011 48.1857H12.451Z" fill="#1B0021"/>
      <path d="M12.4911 48.1857L10.8511 56.0957H10.811L12.451 48.1857H12.4911Z" fill="#1B0021"/>
      <path d="M12.5311 48.1857L10.9011 56.0957H10.8511L12.4911 48.1857H12.5311Z" fill="#1B0021"/>
      <path d="M12.5811 48.1857L10.941 56.0957H10.9011L12.5311 48.1857H12.5811Z" fill="#1B0021"/>
      <path d="M12.6211 48.1857L10.9811 56.0957H10.941L12.5811 48.1857H12.6211Z" fill="#1B0021"/>
      <path d="M12.661 48.1857L11.0311 56.0957H10.9811L12.6211 48.1857H12.661Z" fill="#1B0021"/>
      <path d="M12.7111 48.1857L11.071 56.0957H11.0311L12.661 48.1857H12.7111Z" fill="#1B0021"/>
      <path d="M12.7511 48.1857L11.1111 56.0957H11.071L12.7111 48.1857H12.7511Z" fill="#1B0021"/>
      <path d="M12.791 48.1857L11.161 56.0957H11.1111L12.7511 48.1857H12.791Z" fill="#1B0021"/>
      <path d="M12.8411 48.1857L11.201 56.0957H11.161L12.791 48.1857H12.8411Z" fill="#1B0021"/>
      <path d="M12.8811 48.1857L11.2411 56.0957H11.201L12.8411 48.1857H12.8811Z" fill="#1B0021"/>
      <path d="M12.921 48.1857L11.291 56.0957H11.2411L12.8811 48.1857H12.921Z" fill="#1B0021"/>
      <path d="M12.9711 48.1857L11.3311 56.0957H11.291L12.921 48.1857H12.9711Z" fill="#1B0021"/>
      <path d="M13.0111 48.1857L11.3711 56.0957H11.3311L12.9711 48.1857H13.0111Z" fill="#1B0021"/>
      <path d="M13.061 48.1857L11.421 56.0957H11.3711L13.0111 48.1857H13.061Z" fill="#1B0021"/>
      <path d="M13.1011 48.1857L11.4611 56.0957H11.421L13.061 48.1857H13.1011Z" fill="#1B0021"/>
      <path d="M13.1411 48.1857L11.5011 56.0957H11.4611L13.1011 48.1857H13.1411Z" fill="#1B0021"/>
      <path d="M13.191 48.1857L11.551 56.0957H11.5011L13.1411 48.1857H13.191Z" fill="#1B0021"/>
      <path d="M13.2311 48.1857L11.5911 56.0957H11.551L13.191 48.1857H13.2311Z" fill="#1B0021"/>
      <path d="M13.2711 48.1857L11.6311 56.0957H11.5911L13.2311 48.1857H13.2711Z" fill="#1B0021"/>
      <path d="M13.321 48.1857L11.681 56.0957H11.6311L13.2711 48.1857H13.321Z" fill="#1B0021"/>
      <path d="M13.3611 48.1857L11.7211 56.0957H11.681L13.321 48.1857H13.3611Z" fill="#1B0021"/>
      <path d="M13.4011 48.1857L11.7611 56.0957H11.7211L13.3611 48.1857H13.4011Z" fill="#1B0021"/>
      <path d="M13.451 48.1857L11.811 56.0957H11.7611L13.4011 48.1857H13.451Z" fill="#1B0021"/>
      <path d="M13.4911 48.1857L11.8511 56.0957H11.811L13.451 48.1857H13.4911Z" fill="#1B0021"/>
      <path d="M13.5311 48.1857L11.9011 56.0957H11.8511L13.4911 48.1857H13.5311Z" fill="#1B0021"/>
      <path d="M13.5811 48.1857L11.941 56.0957H11.9011L13.5311 48.1857H13.5811Z" fill="#1B0021"/>
      <path d="M13.6211 48.1857L11.9811 56.0957H11.941L13.5811 48.1857H13.6211Z" fill="#1B0021"/>
      <path d="M13.661 48.1857L12.0311 56.0957H11.9811L13.6211 48.1857H13.661Z" fill="#1B0021"/>
      <path d="M13.7111 48.1857L12.071 56.0957H12.0311L13.661 48.1857H13.7111Z" fill="#1B0021"/>
      <path d="M13.7511 48.1857L12.1111 56.0957H12.071L13.7111 48.1857H13.7511Z" fill="#1B0021"/>
      <path d="M13.791 48.1857L12.161 56.0957H12.1111L13.7511 48.1857H13.791Z" fill="#1B0021"/>
      <path d="M13.8411 48.1857L12.201 56.0957H12.161L13.791 48.1857H13.8411Z" fill="#1B0021"/>
      <path d="M13.8811 48.1857L12.2411 56.0957H12.201L13.8411 48.1857H13.8811Z" fill="#1B0021"/>
      <path d="M13.921 48.1857L12.291 56.0957H12.2411L13.8811 48.1857H13.921Z" fill="#1B0021"/>
      <path d="M13.9711 48.1857L12.3311 56.0957H12.291L13.921 48.1857H13.9711Z" fill="#1B0021"/>
      <path d="M14.0111 48.1857L12.3711 56.0957H12.3311L13.9711 48.1857H14.0111Z" fill="#1B0021"/>
      <path d="M14.051 48.1857L12.421 56.0957H12.3711L14.0111 48.1857H14.051Z" fill="#1B0021"/>
      <path d="M14.1011 48.1857L12.4611 56.0957H12.421L14.051 48.1857H14.1011Z" fill="#1B0021"/>
      <path d="M14.1411 48.1857L12.5011 56.0957H12.4611L14.1011 48.1857H14.1411Z" fill="#1B0021"/>
      <path d="M14.181 48.1857L12.551 56.0957H12.5011L14.1411 48.1857H14.181Z" fill="#1B0021"/>
      <path d="M14.2311 48.1857L12.5911 56.0957H12.551L14.181 48.1857H14.2311Z" fill="#1B0021"/>
      <path d="M14.2711 48.1857L12.6311 56.0957H12.5911L14.2311 48.1857H14.2711Z" fill="#1B0021"/>
      <path d="M14.311 48.1857L12.681 56.0957H12.6311L14.2711 48.1857H14.311Z" fill="#1B0021"/>
      <path d="M14.3611 48.1857L12.7211 56.0957H12.681L14.311 48.1857H14.3611Z" fill="#1B0021"/>
      <path d="M14.4011 48.1857L12.7611 56.0957H12.7211L14.3611 48.1857H14.4011Z" fill="#1B0021"/>
      <path d="M14.441 48.1857L12.811 56.0957H12.7611L14.4011 48.1857H14.441Z" fill="#1B0021"/>
      <path d="M14.4911 48.1857L12.8511 56.0957H12.811L14.441 48.1857H14.4911Z" fill="#1B0021"/>
      <path d="M14.5311 48.1857L12.8911 56.0957H12.8511L14.4911 48.1857H14.5311Z" fill="#1B0021"/>
      <path d="M14.571 48.1857L12.941 56.0957H12.8911L14.5311 48.1857H14.571Z" fill="#1B0021"/>
      <path d="M14.6211 48.1857L12.9811 56.0957H12.941L14.571 48.1857H14.6211Z" fill="#1B0021"/>
      <path d="M14.661 48.1857L13.0211 56.0957H12.9811L14.6211 48.1857H14.661Z" fill="#1B0021"/>
      <path d="M14.7111 48.1857L13.071 56.0957H13.0211L14.661 48.1857H14.7111Z" fill="#1B0021"/>
      <path d="M14.7511 48.1857L13.1111 56.0957H13.071L14.7111 48.1857H14.7511Z" fill="#1B0021"/>
      <path d="M14.791 48.1857L13.1511 56.0957H13.1111L14.7511 48.1857H14.791Z" fill="#1B0021"/>
      <path d="M14.8411 48.1857L13.201 56.0957H13.1511L14.791 48.1857H14.8411Z" fill="#1B0021"/>
      <path d="M14.8811 48.1857L13.2411 56.0957H13.201L14.8411 48.1857H14.8811Z" fill="#1B0021"/>
      <path d="M13.2411 56.0957L14.8811 48.1857H16.551V56.0957H13.2411Z" fill="#1B0021"/>
      </g>
      <path d="M77.801 28.2257C75.621 28.2257 73.8511 26.4557 73.8511 24.2757C73.8511 22.0957 75.621 20.3257 77.801 20.3257C79.981 20.3257 81.7611 22.0957 81.7611 24.2757C81.7611 26.4557 79.991 28.2257 77.801 28.2257Z" fill="#1B0021"/>
      <mask id={`${id}-4`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="73" y="20" width="9" height="9">
      <path d="M77.801 28.2257C75.621 28.2257 73.8511 26.4557 73.8511 24.2757C73.8511 22.0957 75.621 20.3257 77.801 20.3257C79.981 20.3257 81.7611 22.0957 81.7611 24.2757C81.7611 26.4557 79.991 28.2257 77.801 28.2257Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-4)`}>
      <path d="M81.6411 28.2257L80.0011 20.3257H81.7611V28.2257H81.6411Z" fill="#1B0021"/>
      <path d="M81.5911 28.2257L79.9611 20.3257H80.0011L81.6411 28.2257H81.5911Z" fill="#1B0021"/>
      <path d="M81.551 28.2257L79.911 20.3257H79.9611L81.5911 28.2257H81.551Z" fill="#1B0021"/>
      <path d="M81.5111 28.2257L79.8711 20.3257H79.911L81.551 28.2257H81.5111Z" fill="#1B0021"/>
      <path d="M81.4611 28.2257L79.8311 20.3257H79.8711L81.5111 28.2257H81.4611Z" fill="#1B0021"/>
      <path d="M81.421 28.2257L79.7811 20.3257H79.8311L81.4611 28.2257H81.421Z" fill="#1B0021"/>
      <path d="M81.3811 28.2257L79.7411 20.3257H79.7811L81.421 28.2257H81.3811Z" fill="#1B0021"/>
      <path d="M81.3311 28.2257L79.701 20.3257H79.7411L81.3811 28.2257H81.3311Z" fill="#1B0021"/>
      <path d="M81.291 28.2257L79.6511 20.3257H79.701L81.3311 28.2257H81.291Z" fill="#1B0021"/>
      <path d="M81.2511 28.2257L79.6111 20.3257H79.6511L81.291 28.2257H81.2511Z" fill="#1B0021"/>
      <path d="M81.201 28.2257L79.571 20.3257H79.6111L81.2511 28.2257H81.201Z" fill="#1B0021"/>
      <path d="M81.161 28.2257L79.5211 20.3257H79.571L81.201 28.2257H81.161Z" fill="#1B0021"/>
      <path d="M81.1211 28.2257L79.4811 20.3257H79.5211L81.161 28.2257H81.1211Z" fill="#1B0021"/>
      <path d="M81.071 28.2257L79.441 20.3257H79.4811L81.1211 28.2257H81.071Z" fill="#1B0021"/>
      <path d="M81.0311 28.2257L79.3911 20.3257H79.441L81.071 28.2257H81.0311Z" fill="#1B0021"/>
      <path d="M80.9911 28.2257L79.3511 20.3257H79.3911L81.0311 28.2257H80.9911Z" fill="#1B0021"/>
      <path d="M80.941 28.2257L79.311 20.3257H79.3511L80.9911 28.2257H80.941Z" fill="#1B0021"/>
      <path d="M80.9011 28.2257L79.2611 20.3257H79.311L80.941 28.2257H80.9011Z" fill="#1B0021"/>
      <path d="M80.8611 28.2257L79.2211 20.3257H79.2611L80.9011 28.2257H80.8611Z" fill="#1B0021"/>
      <path d="M80.811 28.2257L79.181 20.3257H79.2211L80.8611 28.2257H80.811Z" fill="#1B0021"/>
      <path d="M80.7711 28.2257L79.1311 20.3257H79.181L80.811 28.2257H80.7711Z" fill="#1B0021"/>
      <path d="M80.7311 28.2257L79.0911 20.3257H79.1311L80.7711 28.2257H80.7311Z" fill="#1B0021"/>
      <path d="M80.681 28.2257L79.051 20.3257H79.0911L80.7311 28.2257H80.681Z" fill="#1B0021"/>
      <path d="M80.6411 28.2257L79.0011 20.3257H79.051L80.681 28.2257H80.6411Z" fill="#1B0021"/>
      <path d="M80.6011 28.2257L78.9611 20.3257H79.0011L80.6411 28.2257H80.6011Z" fill="#1B0021"/>
      <path d="M80.551 28.2257L78.911 20.3257H78.9611L80.6011 28.2257H80.551Z" fill="#1B0021"/>
      <path d="M80.5111 28.2257L78.8711 20.3257H78.911L80.551 28.2257H80.5111Z" fill="#1B0021"/>
      <path d="M80.4711 28.2257L78.8311 20.3257H78.8711L80.5111 28.2257H80.4711Z" fill="#1B0021"/>
      <path d="M80.421 28.2257L78.7811 20.3257H78.8311L80.4711 28.2257H80.421Z" fill="#1B0021"/>
      <path d="M80.3811 28.2257L78.7411 20.3257H78.7811L80.421 28.2257H80.3811Z" fill="#1B0021"/>
      <path d="M80.3411 28.2257L78.701 20.3257H78.7411L80.3811 28.2257H80.3411Z" fill="#1B0021"/>
      <path d="M80.291 28.2257L78.6511 20.3257H78.701L80.3411 28.2257H80.291Z" fill="#1B0021"/>
      <path d="M80.2511 28.2257L78.6111 20.3257H78.6511L80.291 28.2257H80.2511Z" fill="#1B0021"/>
      <path d="M80.2111 28.2257L78.571 20.3257H78.6111L80.2511 28.2257H80.2111Z" fill="#1B0021"/>
      <path d="M80.161 28.2257L78.5211 20.3257H78.571L80.2111 28.2257H80.161Z" fill="#1B0021"/>
      <path d="M80.1211 28.2257L78.4811 20.3257H78.5211L80.161 28.2257H80.1211Z" fill="#1B0021"/>
      <path d="M80.071 28.2257L78.441 20.3257H78.4811L80.1211 28.2257H80.071Z" fill="#1B0021"/>
      <path d="M80.0311 28.2257L78.3911 20.3257H78.441L80.071 28.2257H80.0311Z" fill="#1B0021"/>
      <path d="M79.9911 28.2257L78.3511 20.3257H78.3911L80.0311 28.2257H79.9911Z" fill="#1B0021"/>
      <path d="M79.941 28.2257L78.311 20.3257H78.3511L79.9911 28.2257H79.941Z" fill="#1B0021"/>
      <path d="M79.9011 28.2257L78.2611 20.3257H78.311L79.941 28.2257H79.9011Z" fill="#1B0021"/>
      <path d="M79.8611 28.2257L78.2211 20.3257H78.2611L79.9011 28.2257H79.8611Z" fill="#1B0021"/>
      <path d="M79.811 28.2257L78.181 20.3257H78.2211L79.8611 28.2257H79.811Z" fill="#1B0021"/>
      <path d="M79.7711 28.2257L78.1311 20.3257H78.181L79.811 28.2257H79.7711Z" fill="#1B0021"/>
      <path d="M79.7311 28.2257L78.0911 20.3257H78.1311L79.7711 28.2257H79.7311Z" fill="#1B0021"/>
      <path d="M79.681 28.2257L78.051 20.3257H78.0911L79.7311 28.2257H79.681Z" fill="#1B0021"/>
      <path d="M79.6411 28.2257L78.0011 20.3257H78.051L79.681 28.2257H79.6411Z" fill="#1B0021"/>
      <path d="M79.6011 28.2257L77.9611 20.3257H78.0011L79.6411 28.2257H79.6011Z" fill="#1B0021"/>
      <path d="M79.551 28.2257L77.921 20.3257H77.9611L79.6011 28.2257H79.551Z" fill="#1B0021"/>
      <path d="M79.5111 28.2257L77.8711 20.3257H77.921L79.551 28.2257H79.5111Z" fill="#1B0021"/>
      <path d="M79.4711 28.2257L77.8311 20.3257H77.8711L79.5111 28.2257H79.4711Z" fill="#1B0021"/>
      <path d="M79.421 28.2257L77.791 20.3257H77.8311L79.4711 28.2257H79.421Z" fill="#1B0021"/>
      <path d="M79.3811 28.2257L77.7411 20.3257H77.791L79.421 28.2257H79.3811Z" fill="#1B0021"/>
      <path d="M79.3411 28.2257L77.701 20.3257H77.7411L79.3811 28.2257H79.3411Z" fill="#1B0021"/>
      <path d="M79.291 28.2257L77.661 20.3257H77.701L79.3411 28.2257H79.291Z" fill="#1B0021"/>
      <path d="M79.2511 28.2257L77.6111 20.3257H77.661L79.291 28.2257H79.2511Z" fill="#1B0021"/>
      <path d="M79.2111 28.2257L77.571 20.3257H77.6111L79.2511 28.2257H79.2111Z" fill="#1B0021"/>
      <path d="M79.161 28.2257L77.5311 20.3257H77.571L79.2111 28.2257H79.161Z" fill="#1B0021"/>
      <path d="M79.1211 28.2257L77.4811 20.3257H77.5311L79.161 28.2257H79.1211Z" fill="#1B0021"/>
      <path d="M79.0811 28.2257L77.441 20.3257H77.4811L79.1211 28.2257H79.0811Z" fill="#1B0021"/>
      <path d="M79.0311 28.2257L77.4011 20.3257H77.441L79.0811 28.2257H79.0311Z" fill="#1B0021"/>
      <path d="M78.9911 28.2257L77.3511 20.3257H77.4011L79.0311 28.2257H78.9911Z" fill="#1B0021"/>
      <path d="M78.951 28.2257L77.311 20.3257H77.3511L78.9911 28.2257H78.951Z" fill="#1B0021"/>
      <path d="M78.9011 28.2257L77.2611 20.3257H77.311L78.951 28.2257H78.9011Z" fill="#1B0021"/>
      <path d="M78.8611 28.2257L77.2211 20.3257H77.2611L78.9011 28.2257H78.8611Z" fill="#1B0021"/>
      <path d="M78.821 28.2257L77.181 20.3257H77.2211L78.8611 28.2257H78.821Z" fill="#1B0021"/>
      <path d="M78.7711 28.2257L77.1311 20.3257H77.181L78.821 28.2257H78.7711Z" fill="#1B0021"/>
      <path d="M78.7311 28.2257L77.0911 20.3257H77.1311L78.7711 28.2257H78.7311Z" fill="#1B0021"/>
      <path d="M78.691 28.2257L77.051 20.3257H77.0911L78.7311 28.2257H78.691Z" fill="#1B0021"/>
      <path d="M78.6411 28.2257L77.0011 20.3257H77.051L78.691 28.2257H78.6411Z" fill="#1B0021"/>
      <path d="M78.6011 28.2257L76.9611 20.3257H77.0011L78.6411 28.2257H78.6011Z" fill="#1B0021"/>
      <path d="M78.561 28.2257L76.921 20.3257H76.9611L78.6011 28.2257H78.561Z" fill="#1B0021"/>
      <path d="M78.5111 28.2257L76.8711 20.3257H76.921L78.561 28.2257H78.5111Z" fill="#1B0021"/>
      <path d="M78.4711 28.2257L76.8311 20.3257H76.8711L78.5111 28.2257H78.4711Z" fill="#1B0021"/>
      <path d="M78.421 28.2257L76.791 20.3257H76.8311L78.4711 28.2257H78.421Z" fill="#1B0021"/>
      <path d="M78.3811 28.2257L76.7411 20.3257H76.791L78.421 28.2257H78.3811Z" fill="#1B0021"/>
      <path d="M78.3411 28.2257L76.701 20.3257H76.7411L78.3811 28.2257H78.3411Z" fill="#1B0021"/>
      <path d="M78.291 28.2257L76.661 20.3257H76.701L78.3411 28.2257H78.291Z" fill="#1B0021"/>
      <path d="M78.2511 28.2257L76.6111 20.3257H76.661L78.291 28.2257H78.2511Z" fill="#1B0021"/>
      <path d="M78.2111 28.2257L76.571 20.3257H76.6111L78.2511 28.2257H78.2111Z" fill="#1B0021"/>
      <path d="M78.161 28.2257L76.5311 20.3257H76.571L78.2111 28.2257H78.161Z" fill="#1B0021"/>
      <path d="M78.1211 28.2257L76.4811 20.3257H76.5311L78.161 28.2257H78.1211Z" fill="#1B0021"/>
      <path d="M78.0811 28.2257L76.441 20.3257H76.4811L78.1211 28.2257H78.0811Z" fill="#1B0021"/>
      <path d="M78.0311 28.2257L76.4011 20.3257H76.441L78.0811 28.2257H78.0311Z" fill="#1B0021"/>
      <path d="M77.9911 28.2257L76.3511 20.3257H76.4011L78.0311 28.2257H77.9911Z" fill="#1B0021"/>
      <path d="M77.951 28.2257L76.311 20.3257H76.3511L77.9911 28.2257H77.951Z" fill="#1B0021"/>
      <path d="M77.9011 28.2257L76.2711 20.3257H76.311L77.951 28.2257H77.9011Z" fill="#1B0021"/>
      <path d="M77.8611 28.2257L76.2211 20.3257H76.2711L77.9011 28.2257H77.8611Z" fill="#1B0021"/>
      <path d="M77.821 28.2257L76.181 20.3257H76.2211L77.8611 28.2257H77.821Z" fill="#1B0021"/>
      <path d="M77.7711 28.2257L76.1411 20.3257H76.181L77.821 28.2257H77.7711Z" fill="#1B0021"/>
      <path d="M77.7311 28.2257L76.0911 20.3257H76.1411L77.7711 28.2257H77.7311Z" fill="#1B0021"/>
      <path d="M77.691 28.2257L76.051 20.3257H76.0911L77.7311 28.2257H77.691Z" fill="#1B0021"/>
      <path d="M77.6411 28.2257L76.0111 20.3257H76.051L77.691 28.2257H77.6411Z" fill="#1B0021"/>
      <path d="M77.6011 28.2257L75.9611 20.3257H76.0111L77.6411 28.2257H77.6011Z" fill="#1B0021"/>
      <path d="M77.561 28.2257L75.921 20.3257H75.9611L77.6011 28.2257H77.561Z" fill="#1B0021"/>
      <path d="M77.5111 28.2257L75.8811 20.3257H75.921L77.561 28.2257H77.5111Z" fill="#1B0021"/>
      <path d="M77.4711 28.2257L75.8311 20.3257H75.8811L77.5111 28.2257H77.4711Z" fill="#1B0021"/>
      <path d="M77.431 28.2257L75.791 20.3257H75.8311L77.4711 28.2257H77.431Z" fill="#1B0021"/>
      <path d="M77.3811 28.2257L75.7511 20.3257H75.791L77.431 28.2257H77.3811Z" fill="#1B0021"/>
      <path d="M77.3411 28.2257L75.701 20.3257H75.7511L77.3811 28.2257H77.3411Z" fill="#1B0021"/>
      <path d="M77.301 28.2257L75.661 20.3257H75.701L77.3411 28.2257H77.301Z" fill="#1B0021"/>
      <path d="M77.2511 28.2257L75.6111 20.3257H75.661L77.301 28.2257H77.2511Z" fill="#1B0021"/>
      <path d="M77.2111 28.2257L75.571 20.3257H75.6111L77.2511 28.2257H77.2111Z" fill="#1B0021"/>
      <path d="M77.171 28.2257L75.5311 20.3257H75.571L77.2111 28.2257H77.171Z" fill="#1B0021"/>
      <path d="M75.5311 20.3257L77.171 28.2257H73.8511V20.3257H75.5311Z" fill="#1B0021"/>
      </g>
      <path d="M86.7211 56.0957C84.5411 56.0957 82.7711 54.3257 82.7711 52.1457C82.7711 49.9657 84.5411 48.1857 86.7211 48.1857C88.9011 48.1857 90.671 49.9557 90.671 52.1457C90.671 54.3357 88.9011 56.0957 86.7211 56.0957Z" fill="#1B0021"/>
      <mask id={`${id}-5`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="82" y="48" width="9" height="9">
      <path d="M86.7211 56.0957C84.5411 56.0957 82.7711 54.3257 82.7711 52.1457C82.7711 49.9657 84.5411 48.1857 86.7211 48.1857C88.9011 48.1857 90.671 49.9557 90.671 52.1457C90.671 54.3357 88.9011 56.0957 86.7211 56.0957Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-5)`}>
      <path d="M90.551 56.0957L88.921 48.1857H90.671V56.0957H90.551Z" fill="#1B0021"/>
      <path d="M90.5111 56.0957L88.8711 48.1857H88.921L90.551 56.0957H90.5111Z" fill="#1B0021"/>
      <path d="M90.4711 56.0957L88.8311 48.1857H88.8711L90.5111 56.0957H90.4711Z" fill="#1B0021"/>
      <path d="M90.421 56.0957L88.791 48.1857H88.8311L90.4711 56.0957H90.421Z" fill="#1B0021"/>
      <path d="M90.3811 56.0957L88.7411 48.1857H88.791L90.421 56.0957H90.3811Z" fill="#1B0021"/>
      <path d="M90.3411 56.0957L88.701 48.1857H88.7411L90.3811 56.0957H90.3411Z" fill="#1B0021"/>
      <path d="M90.291 56.0957L88.661 48.1857H88.701L90.3411 56.0957H90.291Z" fill="#1B0021"/>
      <path d="M90.2511 56.0957L88.6111 48.1857H88.661L90.291 56.0957H90.2511Z" fill="#1B0021"/>
      <path d="M90.2111 56.0957L88.571 48.1857H88.6111L90.2511 56.0957H90.2111Z" fill="#1B0021"/>
      <path d="M90.161 56.0957L88.5311 48.1857H88.571L90.2111 56.0957H90.161Z" fill="#1B0021"/>
      <path d="M90.1211 56.0957L88.4811 48.1857H88.5311L90.161 56.0957H90.1211Z" fill="#1B0021"/>
      <path d="M90.0811 56.0957L88.441 48.1857H88.4811L90.1211 56.0957H90.0811Z" fill="#1B0021"/>
      <path d="M90.0311 56.0957L88.4011 48.1857H88.441L90.0811 56.0957H90.0311Z" fill="#1B0021"/>
      <path d="M89.9911 56.0957L88.3511 48.1857H88.4011L90.0311 56.0957H89.9911Z" fill="#1B0021"/>
      <path d="M89.951 56.0957L88.311 48.1857H88.3511L89.9911 56.0957H89.951Z" fill="#1B0021"/>
      <path d="M89.9011 56.0957L88.2711 48.1857H88.311L89.951 56.0957H89.9011Z" fill="#1B0021"/>
      <path d="M89.8611 56.0957L88.2211 48.1857H88.2711L89.9011 56.0957H89.8611Z" fill="#1B0021"/>
      <path d="M89.821 56.0957L88.181 48.1857H88.2211L89.8611 56.0957H89.821Z" fill="#1B0021"/>
      <path d="M89.7711 56.0957L88.1411 48.1857H88.181L89.821 56.0957H89.7711Z" fill="#1B0021"/>
      <path d="M89.7311 56.0957L88.0911 48.1857H88.1411L89.7711 56.0957H89.7311Z" fill="#1B0021"/>
      <path d="M89.691 56.0957L88.051 48.1857H88.0911L89.7311 56.0957H89.691Z" fill="#1B0021"/>
      <path d="M89.6411 56.0957L88.0111 48.1857H88.051L89.691 56.0957H89.6411Z" fill="#1B0021"/>
      <path d="M89.6011 56.0957L87.9611 48.1857H88.0111L89.6411 56.0957H89.6011Z" fill="#1B0021"/>
      <path d="M89.561 56.0957L87.921 48.1857H87.9611L89.6011 56.0957H89.561Z" fill="#1B0021"/>
      <path d="M89.5111 56.0957L87.8711 48.1857H87.921L89.561 56.0957H89.5111Z" fill="#1B0021"/>
      <path d="M89.4711 56.0957L87.8311 48.1857H87.8711L89.5111 56.0957H89.4711Z" fill="#1B0021"/>
      <path d="M89.431 56.0957L87.791 48.1857H87.8311L89.4711 56.0957H89.431Z" fill="#1B0021"/>
      <path d="M89.3811 56.0957L87.7411 48.1857H87.791L89.431 56.0957H89.3811Z" fill="#1B0021"/>
      <path d="M89.3411 56.0957L87.701 48.1857H87.7411L89.3811 56.0957H89.3411Z" fill="#1B0021"/>
      <path d="M89.301 56.0957L87.661 48.1857H87.701L89.3411 56.0957H89.301Z" fill="#1B0021"/>
      <path d="M89.2511 56.0957L87.6111 48.1857H87.661L89.301 56.0957H89.2511Z" fill="#1B0021"/>
      <path d="M89.2111 56.0957L87.571 48.1857H87.6111L89.2511 56.0957H89.2111Z" fill="#1B0021"/>
      <path d="M89.171 56.0957L87.5311 48.1857H87.571L89.2111 56.0957H89.171Z" fill="#1B0021"/>
      <path d="M89.1211 56.0957L87.4811 48.1857H87.5311L89.171 56.0957H89.1211Z" fill="#1B0021"/>
      <path d="M89.0811 56.0957L87.441 48.1857H87.4811L89.1211 56.0957H89.0811Z" fill="#1B0021"/>
      <path d="M89.0311 56.0957L87.4011 48.1857H87.441L89.0811 56.0957H89.0311Z" fill="#1B0021"/>
      <path d="M88.9911 56.0957L87.3511 48.1857H87.4011L89.0311 56.0957H88.9911Z" fill="#1B0021"/>
      <path d="M88.951 56.0957L87.311 48.1857H87.3511L88.9911 56.0957H88.951Z" fill="#1B0021"/>
      <path d="M88.9011 56.0957L87.2711 48.1857H87.311L88.951 56.0957H88.9011Z" fill="#1B0021"/>
      <path d="M88.8611 56.0957L87.2211 48.1857H87.2711L88.9011 56.0957H88.8611Z" fill="#1B0021"/>
      <path d="M88.821 56.0957L87.181 48.1857H87.2211L88.8611 56.0957H88.821Z" fill="#1B0021"/>
      <path d="M88.7711 56.0957L87.1411 48.1857H87.181L88.821 56.0957H88.7711Z" fill="#1B0021"/>
      <path d="M88.7311 56.0957L87.0911 48.1857H87.1411L88.7711 56.0957H88.7311Z" fill="#1B0021"/>
      <path d="M88.691 56.0957L87.051 48.1857H87.0911L88.7311 56.0957H88.691Z" fill="#1B0021"/>
      <path d="M88.6411 56.0957L87.0111 48.1857H87.051L88.691 56.0957H88.6411Z" fill="#1B0021"/>
      <path d="M88.6011 56.0957L86.9611 48.1857H87.0111L88.6411 56.0957H88.6011Z" fill="#1B0021"/>
      <path d="M88.561 56.0957L86.921 48.1857H86.9611L88.6011 56.0957H88.561Z" fill="#1B0021"/>
      <path d="M88.5111 56.0957L86.8811 48.1857H86.921L88.561 56.0957H88.5111Z" fill="#1B0021"/>
      <path d="M88.4711 56.0957L86.8311 48.1857H86.8811L88.5111 56.0957H88.4711Z" fill="#1B0021"/>
      <path d="M88.431 56.0957L86.791 48.1857H86.8311L88.4711 56.0957H88.431Z" fill="#1B0021"/>
      <path d="M88.3811 56.0957L86.7511 48.1857H86.791L88.431 56.0957H88.3811Z" fill="#1B0021"/>
      <path d="M88.3411 56.0957L86.701 48.1857H86.7511L88.3811 56.0957H88.3411Z" fill="#1B0021"/>
      <path d="M88.301 56.0957L86.661 48.1857H86.701L88.3411 56.0957H88.301Z" fill="#1B0021"/>
      <path d="M88.2511 56.0957L86.6211 48.1857H86.661L88.301 56.0957H88.2511Z" fill="#1B0021"/>
      <path d="M88.2111 56.0957L86.571 48.1857H86.6211L88.2511 56.0957H88.2111Z" fill="#1B0021"/>
      <path d="M88.171 56.0957L86.5311 48.1857H86.571L88.2111 56.0957H88.171Z" fill="#1B0021"/>
      <path d="M88.1211 56.0957L86.4911 48.1857H86.5311L88.171 56.0957H88.1211Z" fill="#1B0021"/>
      <path d="M88.0811 56.0957L86.441 48.1857H86.4911L88.1211 56.0957H88.0811Z" fill="#1B0021"/>
      <path d="M88.041 56.0957L86.4011 48.1857H86.441L88.0811 56.0957H88.041Z" fill="#1B0021"/>
      <path d="M87.9911 56.0957L86.3611 48.1857H86.4011L88.041 56.0957H87.9911Z" fill="#1B0021"/>
      <path d="M87.951 56.0957L86.311 48.1857H86.3611L87.9911 56.0957H87.951Z" fill="#1B0021"/>
      <path d="M87.911 56.0957L86.2711 48.1857H86.311L87.951 56.0957H87.911Z" fill="#1B0021"/>
      <path d="M87.8611 56.0957L86.2211 48.1857H86.2711L87.911 56.0957H87.8611Z" fill="#1B0021"/>
      <path d="M87.821 56.0957L86.181 48.1857H86.2211L87.8611 56.0957H87.821Z" fill="#1B0021"/>
      <path d="M87.7811 56.0957L86.1411 48.1857H86.181L87.821 56.0957H87.7811Z" fill="#1B0021"/>
      <path d="M87.7311 56.0957L86.0911 48.1857H86.1411L87.7811 56.0957H87.7311Z" fill="#1B0021"/>
      <path d="M87.691 56.0957L86.051 48.1857H86.0911L87.7311 56.0957H87.691Z" fill="#1B0021"/>
      <path d="M87.6511 56.0957L86.0111 48.1857H86.051L87.691 56.0957H87.6511Z" fill="#1B0021"/>
      <path d="M87.6011 56.0957L85.9611 48.1857H86.0111L87.6511 56.0957H87.6011Z" fill="#1B0021"/>
      <path d="M87.561 56.0957L85.921 48.1857H85.9611L87.6011 56.0957H87.561Z" fill="#1B0021"/>
      <path d="M87.5211 56.0957L85.8811 48.1857H85.921L87.561 56.0957H87.5211Z" fill="#1B0021"/>
      <path d="M87.4711 56.0957L85.8311 48.1857H85.8811L87.5211 56.0957H87.4711Z" fill="#1B0021"/>
      <path d="M87.431 56.0957L85.791 48.1857H85.8311L87.4711 56.0957H87.431Z" fill="#1B0021"/>
      <path d="M87.3811 56.0957L85.7511 48.1857H85.791L87.431 56.0957H87.3811Z" fill="#1B0021"/>
      <path d="M87.3411 56.0957L85.701 48.1857H85.7511L87.3811 56.0957H87.3411Z" fill="#1B0021"/>
      <path d="M87.301 56.0957L85.661 48.1857H85.701L87.3411 56.0957H87.301Z" fill="#1B0021"/>
      <path d="M87.2511 56.0957L85.6211 48.1857H85.661L87.301 56.0957H87.2511Z" fill="#1B0021"/>
      <path d="M87.2111 56.0957L85.571 48.1857H85.6211L87.2511 56.0957H87.2111Z" fill="#1B0021"/>
      <path d="M87.171 56.0957L85.5311 48.1857H85.571L87.2111 56.0957H87.171Z" fill="#1B0021"/>
      <path d="M87.1211 56.0957L85.4911 48.1857H85.5311L87.171 56.0957H87.1211Z" fill="#1B0021"/>
      <path d="M87.0811 56.0957L85.441 48.1857H85.4911L87.1211 56.0957H87.0811Z" fill="#1B0021"/>
      <path d="M87.041 56.0957L85.4011 48.1857H85.441L87.0811 56.0957H87.041Z" fill="#1B0021"/>
      <path d="M86.9911 56.0957L85.3611 48.1857H85.4011L87.041 56.0957H86.9911Z" fill="#1B0021"/>
      <path d="M86.951 56.0957L85.311 48.1857H85.3611L86.9911 56.0957H86.951Z" fill="#1B0021"/>
      <path d="M86.911 56.0957L85.2711 48.1857H85.311L86.951 56.0957H86.911Z" fill="#1B0021"/>
      <path d="M86.8611 56.0957L85.2311 48.1857H85.2711L86.911 56.0957H86.8611Z" fill="#1B0021"/>
      <path d="M86.821 56.0957L85.181 48.1857H85.2311L86.8611 56.0957H86.821Z" fill="#1B0021"/>
      <path d="M86.7811 56.0957L85.1411 48.1857H85.181L86.821 56.0957H86.7811Z" fill="#1B0021"/>
      <path d="M86.7311 56.0957L85.1011 48.1857H85.1411L86.7811 56.0957H86.7311Z" fill="#1B0021"/>
      <path d="M86.691 56.0957L85.051 48.1857H85.1011L86.7311 56.0957H86.691Z" fill="#1B0021"/>
      <path d="M86.6511 56.0957L85.0111 48.1857H85.051L86.691 56.0957H86.6511Z" fill="#1B0021"/>
      <path d="M86.6011 56.0957L84.9711 48.1857H85.0111L86.6511 56.0957H86.6011Z" fill="#1B0021"/>
      <path d="M86.561 56.0957L84.921 48.1857H84.9711L86.6011 56.0957H86.561Z" fill="#1B0021"/>
      <path d="M86.5211 56.0957L84.8811 48.1857H84.921L86.561 56.0957H86.5211Z" fill="#1B0021"/>
      <path d="M86.4711 56.0957L84.8411 48.1857H84.8811L86.5211 56.0957H86.4711Z" fill="#1B0021"/>
      <path d="M86.431 56.0957L84.791 48.1857H84.8411L86.4711 56.0957H86.431Z" fill="#1B0021"/>
      <path d="M86.3911 56.0957L84.7511 48.1857H84.791L86.431 56.0957H86.3911Z" fill="#1B0021"/>
      <path d="M86.3411 56.0957L84.7111 48.1857H84.7511L86.3911 56.0957H86.3411Z" fill="#1B0021"/>
      <path d="M86.301 56.0957L84.661 48.1857H84.7111L86.3411 56.0957H86.301Z" fill="#1B0021"/>
      <path d="M86.2611 56.0957L84.6211 48.1857H84.661L86.301 56.0957H86.2611Z" fill="#1B0021"/>
      <path d="M86.2111 56.0957L84.571 48.1857H84.6211L86.2611 56.0957H86.2111Z" fill="#1B0021"/>
      <path d="M86.171 56.0957L84.5311 48.1857H84.571L86.2111 56.0957H86.171Z" fill="#1B0021"/>
      <path d="M86.1311 56.0957L84.4911 48.1857H84.5311L86.171 56.0957H86.1311Z" fill="#1B0021"/>
      <path d="M86.0811 56.0957L84.441 48.1857H84.4911L86.1311 56.0957H86.0811Z" fill="#1B0021"/>
      <path d="M84.441 48.1857L86.0811 56.0957H82.7711V48.1857H84.441Z" fill="#1B0021"/>
      </g>
    </svg>
  )
}

/**
 * Thermometer (source: Group-26.svg).
 */
export function ThermometerIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 46 100'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M25.4653 100.005H20.4453C9.4453 98.7645 0.835294 89.8245 0.0652943 78.7745C-0.524706 71.0245 2.91527 63.5645 9.10527 58.8345L9.08525 12.5245C9.74525 6.38452 14.2553 1.45452 20.2453 0.214519C22.3653 -0.145481 24.2153 -0.0254775 26.3353 0.374523C31.9153 1.75452 36.0053 6.39451 36.8453 12.1745V58.8445C43.0253 63.5645 46.4753 71.0345 45.8853 78.7745C45.1153 89.8745 36.4153 98.7945 25.4653 100.005ZM36.0953 66.5545C35.0853 65.2945 34.0853 64.2945 32.8053 63.5045C31.4153 62.6345 30.7853 61.4745 30.7853 59.7845V12.9945C30.1453 8.87452 26.8653 6.10453 22.8853 6.06453C18.9853 6.19453 15.7853 8.94453 15.1653 13.0045V59.7845C15.1653 61.4645 14.5453 62.6445 13.1453 63.5045C11.8253 64.3145 10.7853 65.3945 9.8253 66.5945C4.2453 73.5345 5.06531 83.5845 11.5153 89.5345C17.9653 95.4845 27.9353 95.5145 34.4353 89.5345C40.9353 83.5545 41.7253 73.5445 36.0953 66.5545Z" fill="currentColor"/>
      <path d="M27.5753 86.0245C24.7753 87.5245 21.6052 87.5545 18.8452 86.2445C15.0352 84.4445 12.7453 80.7345 12.9853 76.5645C13.2253 72.3945 15.8752 68.9245 19.8452 67.6545L19.8753 28.0445C19.8753 26.2745 21.3552 24.9845 22.9052 24.9445C24.4552 24.9045 26.0753 26.2245 26.0753 28.0445L26.1053 67.6545C29.9053 68.8645 32.5053 72.2845 32.9253 76.0245C33.3853 80.1845 31.3153 84.0145 27.5753 86.0245Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Trophy cup with star (source: Group-1.svg).
 */
export function TrophyStarIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 86 100'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M47.3787 36.91C46.2687 36.27 43.1587 34.64 43.0587 34.64C42.7187 34.61 42.5187 34.86 42.2087 35.02L38.6087 36.91C38.0187 37.22 37.3587 37.32 36.7787 37.04C36.3687 36.84 35.7287 36.23 35.8387 35.58L36.7387 30.04L33.7387 27.13C33.1587 26.57 32.4087 26.03 32.4487 25.16C32.4787 24.27 33.0887 23.58 33.9287 23.44L39.0787 22.68C39.3787 22.56 39.4087 22.06 39.5287 21.82L41.5187 17.91C41.7987 17.36 42.4187 17.06 42.9387 17.05C43.4987 17.02 44.1787 17.32 44.4687 17.91L46.8887 22.7L52.0587 23.46C53.0787 23.61 53.7587 24.64 53.4787 25.61C53.2687 26.38 52.6187 26.78 52.1087 27.28L49.2687 30.04L50.1687 35.58C50.2787 36.23 49.6287 36.84 49.2087 37.04C48.6387 37.32 47.9687 37.25 47.3787 36.91Z" fill="currentColor"/>
      <path d="M70.2587 100H15.9387C15.0787 99.44 14.3987 98.6 14.3987 97.44L14.4587 91.9C14.7587 88.32 17.2987 85.56 20.8987 85.22L25.7387 85.14L25.7787 74.42C25.7787 73.24 26.8187 72.5 27.8787 72.24C32.9187 71.02 36.2987 66.16 35.6987 61.08C28.8587 58.18 24.3787 52.44 21.0187 46.14L19.1787 42.22C9.07872 36.68 1.79871 26.74 0.0787111 15.28C-0.521289 11.2 2.37872 7.58 6.39872 7.12L14.1587 7L14.1987 4.7C14.4187 2.44 15.8987 0.62 18.1587 0.02L66.6987 0C69.4387 0 71.4587 1.88 71.7787 4.56L71.8187 7L79.5987 7.12C83.6187 7.58 86.5187 11.2 85.9187 15.28C84.1987 26.68 76.9987 36.6 66.9187 42.16L65.1787 45.76C61.7987 52.18 57.3587 58.06 50.4787 60.98C50.0387 66.08 52.9187 70.62 57.8787 72.1C58.7987 72.38 60.3587 72.84 60.3587 74.06L60.4587 85.14L65.2787 85.22C68.7787 85.58 71.3987 88.16 71.7587 91.66L71.8387 97.08C71.8587 98.36 71.2587 99.38 70.2387 100H70.2587ZM61.7787 41.92C64.7787 35.24 66.3587 28.16 66.7987 20.8L66.9387 4.68H19.0587L19.1787 20.8C19.6187 28.22 21.2187 35.34 24.2987 42.04C27.9387 50.02 34.9587 58.66 44.3187 57.76C52.6187 56.94 58.4187 49.12 61.7787 41.9V41.92ZM16.6187 34.82C15.5187 30.42 14.6987 26.22 14.4587 21.8L14.2787 18.46L14.1587 11.72L7.17872 11.78C5.61872 11.78 4.55873 13.14 4.75873 14.66C5.77873 20.96 8.59873 26.66 12.8787 31.34L14.8387 33.32L16.6187 34.82ZM81.2787 14.38C81.2787 12.86 80.2187 11.8 78.8187 11.78L71.8387 11.72L71.7187 18.46L71.5387 21.8C71.2987 26.22 70.4787 30.4 69.3987 34.82L71.2587 33.24C76.5987 28.2 80.1187 21.78 81.2787 14.38ZM55.7387 85.16V76.96H30.4587V85.16H55.7387Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Solid user profile silhouette (source: Group-18.svg).
 */
export function UserSolidIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 31 38'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M1.45001 37.4388C0.640012 37.4388 0 36.8188 0 36.0488V31.9487C0.03 29.1287 1.26 25.9187 3.37 23.6487C5.10999 21.7687 7.64998 20.7487 10.29 20.7487H20.66C23.27 20.7487 25.79 21.7487 27.53 23.5887C29.58 25.7687 30.73 28.8388 30.92 31.8188V36.0488C30.94 36.8188 30.29 37.4388 29.48 37.4388C24.28 37.4388 6.65001 37.4188 1.45001 37.4388Z" fill="currentColor"/>
      <path d="M25.18 10.0488C24.81 15.2788 19.86 19.1288 14.52 18.6088C9.45002 18.1188 5.71002 14.0588 5.71002 9.32875C5.71002 4.59875 9.45003 0.558755 14.53 0.0487554C17.3 -0.231245 20.04 0.708747 22.09 2.50875C24.3 4.44875 25.39 7.04876 25.18 10.0488Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Vertical pill bar (source: Group-20.svg).
 */
export function VerticalPillIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 8 21'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M3.99011 0H3.9801C1.78201 0 0 1.78192 0 3.98001V16.45C0 18.6481 1.78201 20.43 3.9801 20.43H3.99011C6.18821 20.43 7.97009 18.6481 7.97009 16.45V3.98001C7.97009 1.78192 6.18821 0 3.99011 0Z" fill="currentColor"/>
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="8" height="21">
      <path d="M3.99011 0H3.9801C1.78201 0 0 1.78192 0 3.98001V16.45C0 18.6481 1.78201 20.43 3.9801 20.43H3.99011C6.18821 20.43 7.97009 18.6481 7.97009 16.45V3.98001C7.97009 1.78192 6.18821 0 3.99011 0Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <path d="M0.0800781 0H0V20.43H0.0800781V0Z" fill="currentColor"/>
      <path d="M0.160034 0H0.0800781V20.43H0.160034V0Z" fill="currentColor"/>
      <path d="M0.240112 0H0.160034V20.43H0.240112V0Z" fill="currentColor"/>
      <path d="M0.320068 0H0.240112V20.43H0.320068V0Z" fill="currentColor"/>
      <path d="M0.390015 0H0.310059V20.43H0.390015V0Z" fill="currentColor"/>
      <path d="M0.470093 0H0.390015V20.43H0.470093V0Z" fill="currentColor"/>
      <path d="M0.550049 0H0.470093V20.43H0.550049V0Z" fill="currentColor"/>
      <path d="M0.630005 0H0.550049V20.43H0.630005V0Z" fill="currentColor"/>
      <path d="M0.700073 0H0.619995V20.43H0.700073V0Z" fill="currentColor"/>
      <path d="M0.780029 0H0.700073V20.43H0.780029V0Z" fill="currentColor"/>
      <path d="M0.860107 0H0.780029V20.43H0.860107V0Z" fill="currentColor"/>
      <path d="M0.930054 0H0.850098V20.43H0.930054V0Z" fill="currentColor"/>
      <path d="M1.01001 0H0.930054V20.43H1.01001V0Z" fill="currentColor"/>
      <path d="M1.09009 0H1.01001V20.43H1.09009V0Z" fill="currentColor"/>
      <path d="M1.17004 0H1.09009V20.43H1.17004V0Z" fill="currentColor"/>
      <path d="M1.24011 0H1.16003V20.43H1.24011V0Z" fill="currentColor"/>
      <path d="M1.32007 0H1.24011V20.43H1.32007V0Z" fill="currentColor"/>
      <path d="M1.40002 0H1.32007V20.43H1.40002V0Z" fill="currentColor"/>
      <path d="M1.4801 0H1.40002V20.43H1.4801V0Z" fill="currentColor"/>
      <path d="M1.55005 0H1.47009V20.43H1.55005V0Z" fill="currentColor"/>
      <path d="M1.63 0H1.55005V20.43H1.63V0Z" fill="currentColor"/>
      <path d="M1.71008 0H1.63V20.43H1.71008V0Z" fill="currentColor"/>
      <path d="M1.79004 0H1.71008V20.43H1.79004V0Z" fill="currentColor"/>
      <path d="M1.86011 0H1.78003V20.43H1.86011V0Z" fill="currentColor"/>
      <path d="M1.94006 0H1.86011V20.43H1.94006V0Z" fill="currentColor"/>
      <path d="M2.02002 0H1.94006V20.43H2.02002V0Z" fill="currentColor"/>
      <path d="M2.1001 0H2.02002V20.43H2.1001V0Z" fill="currentColor"/>
      <path d="M2.17004 0H2.09009V20.43H2.17004V0Z" fill="currentColor"/>
      <path d="M2.25 0H2.17004V20.43H2.25V0Z" fill="currentColor"/>
      <path d="M2.33008 0H2.25V20.43H2.33008V0Z" fill="currentColor"/>
      <path d="M2.40002 0H2.32007V20.43H2.40002V0Z" fill="currentColor"/>
      <path d="M2.4801 0H2.40002V20.43H2.4801V0Z" fill="currentColor"/>
      <path d="M2.56006 0H2.4801V20.43H2.56006V0Z" fill="currentColor"/>
      <path d="M2.64001 0H2.56006V20.43H2.64001V0Z" fill="currentColor"/>
      <path d="M2.71008 0H2.63V20.43H2.71008V0Z" fill="currentColor"/>
      <path d="M2.79004 0H2.71008V20.43H2.79004V0Z" fill="currentColor"/>
      <path d="M2.87 0H2.79004V20.43H2.87V0Z" fill="currentColor"/>
      <path d="M2.95007 0H2.87V20.43H2.95007V0Z" fill="currentColor"/>
      <path d="M3.02002 0H2.94006V20.43H3.02002V0Z" fill="currentColor"/>
      <path d="M3.1001 0H3.02002V20.43H3.1001V0Z" fill="currentColor"/>
      <path d="M3.18005 0H3.1001V20.43H3.18005V0Z" fill="currentColor"/>
      <path d="M3.26001 0H3.18005V20.43H3.26001V0Z" fill="currentColor"/>
      <path d="M3.33008 0H3.25V20.43H3.33008V0Z" fill="currentColor"/>
      <path d="M3.41003 0H3.33008V20.43H3.41003V0Z" fill="currentColor"/>
      <path d="M3.49011 0H3.41003V20.43H3.49011V0Z" fill="currentColor"/>
      <path d="M3.56006 0H3.4801V20.43H3.56006V0Z" fill="currentColor"/>
      <path d="M3.64001 0H3.56006V20.43H3.64001V0Z" fill="currentColor"/>
      <path d="M3.72009 0H3.64001V20.43H3.72009V0Z" fill="currentColor"/>
      <path d="M3.80005 0H3.72009V20.43H3.80005V0Z" fill="currentColor"/>
      <path d="M3.87 0H3.79004V20.43H3.87V0Z" fill="currentColor"/>
      <path d="M3.95007 0H3.87V20.43H3.95007V0Z" fill="currentColor"/>
      <path d="M4.03003 0H3.95007V20.43H4.03003V0Z" fill="currentColor"/>
      <path d="M4.11011 0H4.03003V20.43H4.11011V0Z" fill="currentColor"/>
      <path d="M4.18005 0H4.1001V20.43H4.18005V0Z" fill="currentColor"/>
      <path d="M4.26001 0H4.18005V20.43H4.26001V0Z" fill="currentColor"/>
      <path d="M4.34009 0H4.26001V20.43H4.34009V0Z" fill="currentColor"/>
      <path d="M4.42004 0H4.34009V20.43H4.42004V0Z" fill="currentColor"/>
      <path d="M4.49011 0H4.41003V20.43H4.49011V0Z" fill="currentColor"/>
      <path d="M4.57007 0H4.49011V20.43H4.57007V0Z" fill="currentColor"/>
      <path d="M4.65002 0H4.57007V20.43H4.65002V0Z" fill="currentColor"/>
      <path d="M4.72009 0H4.64001V20.43H4.72009V0Z" fill="currentColor"/>
      <path d="M4.80005 0H4.72009V20.43H4.80005V0Z" fill="currentColor"/>
      <path d="M4.88 0H4.80005V20.43H4.88V0Z" fill="currentColor"/>
      <path d="M4.96008 0H4.88V20.43H4.96008V0Z" fill="currentColor"/>
      <path d="M5.03003 0H4.95007V20.43H5.03003V0Z" fill="currentColor"/>
      <path d="M5.11011 0H5.03003V20.43H5.11011V0Z" fill="currentColor"/>
      <path d="M5.19006 0H5.11011V20.43H5.19006V0Z" fill="currentColor"/>
      <path d="M5.27002 0H5.19006V20.43H5.27002V0Z" fill="currentColor"/>
      <path d="M5.34009 0H5.26001V20.43H5.34009V0Z" fill="currentColor"/>
      <path d="M5.42004 0H5.34009V20.43H5.42004V0Z" fill="currentColor"/>
      <path d="M5.5 0H5.42004V20.43H5.5V0Z" fill="currentColor"/>
      <path d="M5.58008 0H5.5V20.43H5.58008V0Z" fill="currentColor"/>
      <path d="M5.65002 0H5.57007V20.43H5.65002V0Z" fill="currentColor"/>
      <path d="M5.7301 0H5.65002V20.43H5.7301V0Z" fill="currentColor"/>
      <path d="M5.81006 0H5.7301V20.43H5.81006V0Z" fill="currentColor"/>
      <path d="M5.89001 0H5.81006V20.43H5.89001V0Z" fill="currentColor"/>
      <path d="M5.96008 0H5.88V20.43H5.96008V0Z" fill="currentColor"/>
      <path d="M6.04004 0H5.96008V20.43H6.04004V0Z" fill="currentColor"/>
      <path d="M6.12 0H6.04004V20.43H6.12V0Z" fill="currentColor"/>
      <path d="M6.19006 0H6.11011V20.43H6.19006V0Z" fill="currentColor"/>
      <path d="M6.27002 0H6.19006V20.43H6.27002V0Z" fill="currentColor"/>
      <path d="M6.3501 0H6.27002V20.43H6.3501V0Z" fill="currentColor"/>
      <path d="M6.43005 0H6.3501V20.43H6.43005V0Z" fill="currentColor"/>
      <path d="M6.5 0H6.42004V20.43H6.5V0Z" fill="currentColor"/>
      <path d="M6.58008 0H6.5V20.43H6.58008V0Z" fill="currentColor"/>
      <path d="M6.66003 0H6.58008V20.43H6.66003V0Z" fill="currentColor"/>
      <path d="M6.74011 0H6.66003V20.43H6.74011V0Z" fill="currentColor"/>
      <path d="M6.81006 0H6.7301V20.43H6.81006V0Z" fill="currentColor"/>
      <path d="M6.89001 0H6.81006V20.43H6.89001V0Z" fill="currentColor"/>
      <path d="M6.97009 0H6.89001V20.43H6.97009V0Z" fill="currentColor"/>
      <path d="M7.05005 0H6.97009V20.43H7.05005V0Z" fill="currentColor"/>
      <path d="M7.12 0H7.04004V20.43H7.12V0Z" fill="currentColor"/>
      <path d="M7.20007 0H7.12V20.43H7.20007V0Z" fill="currentColor"/>
      <path d="M7.28003 0H7.20007V20.43H7.28003V0Z" fill="currentColor"/>
      <path d="M7.3501 0H7.27002V20.43H7.3501V0Z" fill="currentColor"/>
      <path d="M7.43005 0H7.3501V20.43H7.43005V0Z" fill="currentColor"/>
      <path d="M7.51001 0H7.43005V20.43H7.51001V0Z" fill="currentColor"/>
      <path d="M7.59009 0H7.51001V20.43H7.59009V0Z" fill="currentColor"/>
      <path d="M7.66003 0H7.58008V20.43H7.66003V0Z" fill="currentColor"/>
      <path d="M7.74011 0H7.66003V20.43H7.74011V0Z" fill="currentColor"/>
      <path d="M7.82007 0H7.74011V20.43H7.82007V0Z" fill="currentColor"/>
      <path d="M7.90002 0H7.82007V20.43H7.90002V0Z" fill="currentColor"/>
      <path d="M7.97009 0H7.89001V20.43H7.97009V0Z" fill="currentColor"/>
      </g>
    </svg>
  )
}

/**
 * Wallet with cash (source: Group-14.svg).
 */
export function WalletIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 100'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M99.94 55.5386V71.9186C99.88 74.3986 98.05 76.2586 95.86 77.1886L95.76 91.8186C95.21 96.2286 92.47 99.6986 87.85 99.9986H7.73001C3.78001 99.8886 -0.0499915 96.3186 0.0400085 92.2786L0 35.1586C0.3 30.4586 3.78001 27.6586 8.23001 26.9786L17.12 26.8186L62.03 0.7086C66.29 -0.7214 71.42 -0.15139 74.04 3.93861L87.32 27.0486C92.12 27.8186 95.01 30.7186 95.74 35.7086L95.89 50.2786C98.14 51.1586 99.87 53.0586 99.94 55.5386ZM35.22 27.2186L69.99 6.94861C68.85 4.96861 66.18 4.0986 64.08 5.3186L26.42 27.2586L35.22 27.2186ZM81.63 27.3086L76.8 18.8086L62.35 27.2786L81.63 27.3086ZM75.92 77.2486C69.3 76.7186 64.22 71.3286 63.67 64.9586C63.03 57.4386 68.23 51.0986 75.64 50.1086L90.8 50.0786L90.67 35.7386C90.65 33.5886 88.72 32.4086 86.74 31.9486L8.95999 31.9786C7.03999 31.9786 4.82001 33.7486 4.82001 35.6686V91.7886C4.81001 93.3786 6.71001 95.2986 8.32001 95.2986H87.03C88.85 95.2986 90.69 93.2686 90.7 91.6286L90.79 77.4086L75.92 77.2486ZM95.21 71.0286L95.22 56.1686C95.22 55.5186 94.34 55.0286 93.86 54.7586L75.83 54.7786C71.2 55.6686 68.04 59.5586 68.27 64.1186C68.45 68.5086 71.94 72.5886 76.57 72.6186L92.93 72.7286C93.82 72.7286 95.21 72.1586 95.21 71.0286Z" fill="currentColor"/>
      <path d="M81.78 63.0386C82.12 65.7086 80.2 67.9886 77.84 68.2286C75.27 68.4886 72.97 66.8086 72.68 64.1886C72.41 61.7886 74.22 59.3586 76.83 59.1286C79.14 58.9286 81.46 60.5886 81.78 63.0386Z" fill="currentColor"/>
    </svg>
  )
}

/**
 * Crossed wrench and screwdriver (source: Group-9.svg).
 */
export function WrenchToolsIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 100'
      fill='none'
      className={className}
      {...props}
    >
      <path d="M21.34 100C17.62 100 13.96 99.03 10.78 97.19L8.07996 95.65L20.77 82.95L16.96 79.13L4.27002 91.82L2.72998 89.1C0.94998 85.94 0 82.33 0 78.65C0 66.89 9.56997 57.32 21.34 57.32C23.3 57.32 25.22 57.58 27.08 58.1L58.11 27.08C57.59 25.22 57.33 23.29 57.33 21.33C57.33 9.57 66.9 0 78.66 0C82.32 0 85.93 0.939999 89.1 2.72L91.83 4.26L79.77 16.33L83.58 20.14L95.66 8.06L97.2 10.77C99.03 13.98 100 17.63 100 21.33C100 33.1 90.43 42.67 78.66 42.67C76.64 42.67 74.65 42.39 72.72 41.83L41.84 72.72C42.4 74.65 42.6799 76.64 42.6799 78.65C42.6799 90.42 33.1 100 21.34 100ZM16.08 94.38C17.76 94.94 19.54 95.23 21.34 95.23C30.48 95.23 37.9199 87.8 37.9199 78.65C37.9199 76.68 37.57 74.74 36.89 72.89L36.36 71.46L71.47 36.35L72.9 36.88C74.75 37.56 76.69 37.91 78.66 37.91C87.8 37.91 95.24 30.47 95.24 21.33C95.24 19.54 94.95 17.76 94.38 16.07L83.58 26.88L73.03 16.33L83.7899 5.57C82.1399 5.04 80.41 4.76 78.66 4.76C69.52 4.76 62.09 12.19 62.09 21.33C62.09 23.26 62.4199 25.15 63.0599 26.93L63.5699 28.35L28.35 63.57L26.9299 63.05C25.1499 62.41 23.27 62.08 21.34 62.08C12.2 62.08 4.76001 69.52 4.76001 78.65C4.76001 80.41 5.03995 82.14 5.56995 83.79L16.96 72.4L27.5 82.95L16.08 94.38Z" fill="currentColor"/>
      <path d="M78.66 99.99C66.9 99.99 57.33 90.42 57.33 78.65C57.33 76.64 57.6 74.67 58.15 72.78L46.59 61.23L61.28 46.54L72.85 58.12C74.73 57.59 76.68 57.32 78.66 57.32C90.43 57.32 100 66.89 100 78.65C100 90.41 90.43 99.99 78.66 99.99ZM53.33 61.23L63.63 71.53L63.1 72.96C62.43 74.77 62.09 76.68 62.09 78.65C62.09 87.8 69.52 95.23 78.66 95.23C87.8 95.23 95.24 87.8 95.24 78.65C95.24 69.5 87.8 62.08 78.66 62.08C76.71 62.08 74.81 62.41 73.01 63.07L71.59 63.58L61.28 53.28L53.33 61.23Z" fill="currentColor"/>
      <path d="M38.64 53.27L27.21 41.85C25.32 42.39 23.35 42.67 21.33 42.67C9.56996 42.67 0 33.1 0 21.33C0 9.56 9.56996 0 21.33 0C33.09 0 42.6699 9.57 42.6699 21.33C42.6699 23.3 42.4 25.25 41.87 27.14L53.33 38.59L38.64 53.27ZM28.46 36.37L38.64 46.54L46.59 38.59L36.4 28.41L36.9199 26.99C37.5799 25.17 37.91 23.26 37.91 21.33C37.91 12.19 30.48 4.76 21.33 4.76C12.18 4.76 4.76001 12.19 4.76001 21.33C4.76001 30.47 12.2 37.91 21.33 37.91C23.31 37.91 25.22 37.57 27.03 36.9L28.46 36.37Z" fill="currentColor"/>
      <path d="M29.08 26.28L22.7999 30.28L15.75 27.86L13.25 20.84L17.1799 14.51L24.58 13.63L29.87 18.87L29.08 26.28Z" fill="currentColor"/>
      <mask id={`${id}-0`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="13" y="13" width="17" height="18">
      <path d="M29.08 26.28L22.7999 30.28L15.75 27.86L13.25 20.84L17.1799 14.51L24.58 13.63L29.87 18.87L29.08 26.28Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-0)`}>
      <path d="M29.87 14.8L24.58 13.63H29.87V14.8Z" fill="currentColor"/>
      <path d="M29.87 14.96L23.8199 13.63H24.58L29.87 14.8V14.96Z" fill="currentColor"/>
      <path d="M29.87 15.13L23.0699 13.63H23.8199L29.87 14.96V15.13Z" fill="currentColor"/>
      <path d="M29.87 15.29L22.3199 13.63H23.0699L29.87 15.13V15.29Z" fill="currentColor"/>
      <path d="M29.87 15.46L21.5699 13.63H22.3199L29.87 15.29V15.46Z" fill="currentColor"/>
      <path d="M29.87 15.62L20.8199 13.63H21.5699L29.87 15.46V15.62Z" fill="currentColor"/>
      <path d="M29.87 15.79L20.0699 13.63H20.8199L29.87 15.62V15.79Z" fill="currentColor"/>
      <path d="M29.87 15.95L19.3199 13.63H20.0699L29.87 15.79V15.95Z" fill="currentColor"/>
      <path d="M29.87 16.12L18.5699 13.63H19.3199L29.87 15.95V16.12Z" fill="currentColor"/>
      <path d="M29.87 16.29L17.8199 13.63H18.5699L29.87 16.12V16.29Z" fill="currentColor"/>
      <path d="M29.87 16.45L17.0699 13.63H17.8199L29.87 16.29V16.45Z" fill="currentColor"/>
      <path d="M29.87 16.62L16.3199 13.63H17.0699L29.87 16.45V16.62Z" fill="currentColor"/>
      <path d="M29.87 16.78L15.5699 13.63H16.3199L29.87 16.62V16.78Z" fill="currentColor"/>
      <path d="M29.87 16.95L14.8199 13.63H15.5699L29.87 16.78V16.95Z" fill="currentColor"/>
      <path d="M29.87 17.11L14.0699 13.63H14.8199L29.87 16.95V17.11Z" fill="currentColor"/>
      <path d="M29.87 17.28L13.3199 13.63H14.0699L29.87 17.11V17.28Z" fill="currentColor"/>
      <path d="M29.87 17.44L13.25 13.78V13.63H13.3199L29.87 17.28V17.44Z" fill="currentColor"/>
      <path d="M29.87 17.61L13.25 13.95V13.78L29.87 17.44V17.61Z" fill="currentColor"/>
      <path d="M29.87 17.77L13.25 14.11V13.95L29.87 17.61V17.77Z" fill="currentColor"/>
      <path d="M29.87 17.94L13.25 14.28V14.11L29.87 17.77V17.94Z" fill="currentColor"/>
      <path d="M29.87 18.11L13.25 14.44V14.28L29.87 17.94V18.11Z" fill="currentColor"/>
      <path d="M29.87 18.27L13.25 14.61V14.44L29.87 18.11V18.27Z" fill="currentColor"/>
      <path d="M29.87 18.44L13.25 14.77V14.61L29.87 18.27V18.44Z" fill="currentColor"/>
      <path d="M29.87 18.6L13.25 14.94V14.77L29.87 18.44V18.6Z" fill="currentColor"/>
      <path d="M29.87 18.77L13.25 15.1V14.94L29.87 18.6V18.77Z" fill="currentColor"/>
      <path d="M29.87 18.93L13.25 15.27V15.1L29.87 18.77V18.93Z" fill="currentColor"/>
      <path d="M29.87 19.1L13.25 15.43V15.27L29.87 18.93V19.1Z" fill="currentColor"/>
      <path d="M29.87 19.26L13.25 15.6V15.43L29.87 19.1V19.26Z" fill="currentColor"/>
      <path d="M29.87 19.43L13.25 15.76V15.6L29.87 19.26V19.43Z" fill="currentColor"/>
      <path d="M29.87 19.59L13.25 15.93V15.76L29.87 19.43V19.59Z" fill="currentColor"/>
      <path d="M29.87 19.76L13.25 16.1V15.93L29.87 19.59V19.76Z" fill="currentColor"/>
      <path d="M29.87 19.93L13.25 16.26V16.1L29.87 19.76V19.93Z" fill="currentColor"/>
      <path d="M29.87 20.09L13.25 16.43V16.26L29.87 19.93V20.09Z" fill="currentColor"/>
      <path d="M29.87 20.26L13.25 16.59V16.43L29.87 20.09V20.26Z" fill="currentColor"/>
      <path d="M29.87 20.42L13.25 16.76V16.59L29.87 20.26V20.42Z" fill="currentColor"/>
      <path d="M29.87 20.59L13.25 16.92V16.76L29.87 20.42V20.59Z" fill="currentColor"/>
      <path d="M29.87 20.75L13.25 17.09V16.92L29.87 20.59V20.75Z" fill="currentColor"/>
      <path d="M29.87 20.92L13.25 17.25V17.09L29.87 20.75V20.92Z" fill="currentColor"/>
      <path d="M29.87 21.08L13.25 17.42V17.25L29.87 20.92V21.08Z" fill="currentColor"/>
      <path d="M29.87 21.25L13.25 17.58V17.42L29.87 21.08V21.25Z" fill="currentColor"/>
      <path d="M29.87 21.41L13.25 17.75V17.58L29.87 21.25V21.41Z" fill="currentColor"/>
      <path d="M29.87 21.58L13.25 17.92V17.75L29.87 21.41V21.58Z" fill="currentColor"/>
      <path d="M29.87 21.74L13.25 18.08V17.92L29.87 21.58V21.74Z" fill="currentColor"/>
      <path d="M29.87 21.91L13.25 18.25V18.08L29.87 21.74V21.91Z" fill="currentColor"/>
      <path d="M29.87 22.08L13.25 18.41V18.25L29.87 21.91V22.08Z" fill="currentColor"/>
      <path d="M29.87 22.24L13.25 18.58V18.41L29.87 22.08V22.24Z" fill="currentColor"/>
      <path d="M29.87 22.41L13.25 18.74V18.58L29.87 22.24V22.41Z" fill="currentColor"/>
      <path d="M29.87 22.57L13.25 18.91V18.74L29.87 22.41V22.57Z" fill="currentColor"/>
      <path d="M29.87 22.74L13.25 19.07V18.91L29.87 22.57V22.74Z" fill="currentColor"/>
      <path d="M29.87 22.9L13.25 19.24V19.07L29.87 22.74V22.9Z" fill="currentColor"/>
      <path d="M29.87 23.07L13.25 19.4V19.24L29.87 22.9V23.07Z" fill="currentColor"/>
      <path d="M29.87 23.23L13.25 19.57V19.4L29.87 23.07V23.23Z" fill="currentColor"/>
      <path d="M29.87 23.4L13.25 19.73V19.57L29.87 23.23V23.4Z" fill="currentColor"/>
      <path d="M29.87 23.56L13.25 19.9V19.73L29.87 23.4V23.56Z" fill="currentColor"/>
      <path d="M29.87 23.73L13.25 20.07V19.9L29.87 23.56V23.73Z" fill="currentColor"/>
      <path d="M29.87 23.9L13.25 20.23V20.07L29.87 23.73V23.9Z" fill="currentColor"/>
      <path d="M29.87 24.06L13.25 20.4V20.23L29.87 23.9V24.06Z" fill="currentColor"/>
      <path d="M29.87 24.23L13.25 20.56V20.4L29.87 24.06V24.23Z" fill="currentColor"/>
      <path d="M29.87 24.39L13.25 20.73V20.56L29.87 24.23V24.39Z" fill="currentColor"/>
      <path d="M29.87 24.56L13.25 20.89V20.73L29.87 24.39V24.56Z" fill="currentColor"/>
      <path d="M29.87 24.72L13.25 21.06V20.89L29.87 24.56V24.72Z" fill="currentColor"/>
      <path d="M29.87 24.89L13.25 21.22V21.06L29.87 24.72V24.89Z" fill="currentColor"/>
      <path d="M29.87 25.05L13.25 21.39V21.22L29.87 24.89V25.05Z" fill="currentColor"/>
      <path d="M29.87 25.22L13.25 21.55V21.39L29.87 25.05V25.22Z" fill="currentColor"/>
      <path d="M29.87 25.38L13.25 21.72V21.55L29.87 25.22V25.38Z" fill="currentColor"/>
      <path d="M29.87 25.55L13.25 21.89V21.72L29.87 25.38V25.55Z" fill="currentColor"/>
      <path d="M29.87 25.72L13.25 22.05V21.89L29.87 25.55V25.72Z" fill="currentColor"/>
      <path d="M29.87 25.88L13.25 22.22V22.05L29.87 25.72V25.88Z" fill="currentColor"/>
      <path d="M29.87 26.05L13.25 22.38V22.22L29.87 25.88V26.05Z" fill="currentColor"/>
      <path d="M29.87 26.21L13.25 22.55V22.38L29.87 26.05V26.21Z" fill="currentColor"/>
      <path d="M29.87 26.38L13.25 22.71V22.55L29.87 26.21V26.38Z" fill="currentColor"/>
      <path d="M29.87 26.54L13.25 22.88V22.71L29.87 26.38V26.54Z" fill="currentColor"/>
      <path d="M29.87 26.71L13.25 23.04V22.88L29.87 26.54V26.71Z" fill="currentColor"/>
      <path d="M29.87 26.87L13.25 23.21V23.04L29.87 26.71V26.87Z" fill="currentColor"/>
      <path d="M29.87 27.04L13.25 23.37V23.21L29.87 26.87V27.04Z" fill="currentColor"/>
      <path d="M29.87 27.2L13.25 23.54V23.37L29.87 27.04V27.2Z" fill="currentColor"/>
      <path d="M29.87 27.37L13.25 23.71V23.54L29.87 27.2V27.37Z" fill="currentColor"/>
      <path d="M29.87 27.53L13.25 23.87V23.71L29.87 27.37V27.53Z" fill="currentColor"/>
      <path d="M29.87 27.7L13.25 24.04V23.87L29.87 27.53V27.7Z" fill="currentColor"/>
      <path d="M29.87 27.87L13.25 24.2V24.04L29.87 27.7V27.87Z" fill="currentColor"/>
      <path d="M29.87 28.03L13.25 24.37V24.2L29.87 27.87V28.03Z" fill="currentColor"/>
      <path d="M29.87 28.2L13.25 24.53V24.37L29.87 28.03V28.2Z" fill="currentColor"/>
      <path d="M29.87 28.36L13.25 24.7V24.53L29.87 28.2V28.36Z" fill="currentColor"/>
      <path d="M29.87 28.53L13.25 24.86V24.7L29.87 28.36V28.53Z" fill="currentColor"/>
      <path d="M29.87 28.69L13.25 25.03V24.86L29.87 28.53V28.69Z" fill="currentColor"/>
      <path d="M29.87 28.86L13.25 25.19V25.03L29.87 28.69V28.86Z" fill="currentColor"/>
      <path d="M29.87 29.02L13.25 25.36V25.19L29.87 28.86V29.02Z" fill="currentColor"/>
      <path d="M29.87 29.19L13.25 25.52V25.36L29.87 29.02V29.19Z" fill="currentColor"/>
      <path d="M29.87 29.35L13.25 25.69V25.52L29.87 29.19V29.35Z" fill="currentColor"/>
      <path d="M29.87 29.52L13.25 25.86V25.69L29.87 29.35V29.52Z" fill="currentColor"/>
      <path d="M29.87 29.69L13.25 26.02V25.86L29.87 29.52V29.69Z" fill="currentColor"/>
      <path d="M29.87 29.85L13.25 26.19V26.02L29.87 29.69V29.85Z" fill="currentColor"/>
      <path d="M29.87 30.02L13.25 26.35V26.19L29.87 29.85V30.02Z" fill="currentColor"/>
      <path d="M29.87 30.06L29.85 30.18L13.25 26.52V26.35L29.87 30.02V30.06Z" fill="currentColor"/>
      <path d="M29.85 30.18L29.83 30.28H29.5499L13.25 26.68V26.52L29.85 30.18Z" fill="currentColor"/>
      <path d="M28.7999 30.28L13.25 26.85V26.68L29.5499 30.28H28.7999Z" fill="currentColor"/>
      <path d="M28.0499 30.28L13.25 27.01V26.85L28.7999 30.28H28.0499Z" fill="currentColor"/>
      <path d="M27.2999 30.28L13.25 27.18V27.01L28.0499 30.28H27.2999Z" fill="currentColor"/>
      <path d="M26.5499 30.28L13.25 27.34V27.18L27.2999 30.28H26.5499Z" fill="currentColor"/>
      <path d="M25.7999 30.28L13.25 27.51V27.34L26.5499 30.28H25.7999Z" fill="currentColor"/>
      <path d="M25.0499 30.28L13.25 27.68V27.51L25.7999 30.28H25.0499Z" fill="currentColor"/>
      <path d="M24.2999 30.28L13.25 27.84V27.68L25.0499 30.28H24.2999Z" fill="currentColor"/>
      <path d="M23.5499 30.28L13.25 28.01V27.84L24.2999 30.28H23.5499Z" fill="currentColor"/>
      <path d="M22.7999 30.28L13.25 28.17V28.01L23.5499 30.28H22.7999Z" fill="currentColor"/>
      <path d="M13.25 28.17L22.7999 30.28H13.25V28.17Z" fill="currentColor"/>
      </g>
      <path d="M86.2 83.54L79.9199 87.54L72.87 85.12L70.37 78.1L74.2999 71.77L81.6899 70.89L86.99 76.13L86.2 83.54Z" fill="currentColor"/>
      <mask id={`${id}-1`} style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="70" y="70" width="17" height="18">
      <path d="M86.2 83.54L79.9199 87.54L72.87 85.12L70.37 78.1L74.2999 71.77L81.6899 70.89L86.99 76.13L86.2 83.54Z" fill="white"/>
      </mask>
      <g mask={`url(#${id}-1)`}>
      <path d="M86.99 72.06L81.6899 70.89H86.99V72.06Z" fill="currentColor"/>
      <path d="M86.99 72.23L80.9399 70.89H81.6899L86.99 72.06V72.23Z" fill="currentColor"/>
      <path d="M86.99 72.39L80.1899 70.89H80.9399L86.99 72.23V72.39Z" fill="currentColor"/>
      <path d="M86.99 72.56L79.4399 70.89H80.1899L86.99 72.39V72.56Z" fill="currentColor"/>
      <path d="M86.99 72.72L78.6899 70.89H79.4399L86.99 72.56V72.72Z" fill="currentColor"/>
      <path d="M86.99 72.89L77.9399 70.89H78.6899L86.99 72.72V72.89Z" fill="currentColor"/>
      <path d="M86.99 73.05L77.1899 70.89H77.9399L86.99 72.89V73.05Z" fill="currentColor"/>
      <path d="M86.99 73.22L76.4399 70.89H77.1899L86.99 73.05V73.22Z" fill="currentColor"/>
      <path d="M86.99 73.38L75.6899 70.89H76.4399L86.99 73.22V73.38Z" fill="currentColor"/>
      <path d="M86.99 73.55L74.9399 70.89H75.6899L86.99 73.38V73.55Z" fill="currentColor"/>
      <path d="M86.99 73.72L74.1899 70.89H74.9399L86.99 73.55V73.72Z" fill="currentColor"/>
      <path d="M86.99 73.88L73.4399 70.89H74.1899L86.99 73.72V73.88Z" fill="currentColor"/>
      <path d="M86.99 74.05L72.6899 70.89H73.4399L86.99 73.88V74.05Z" fill="currentColor"/>
      <path d="M86.99 74.21L71.9399 70.89H72.6899L86.99 74.05V74.21Z" fill="currentColor"/>
      <path d="M86.99 74.38L71.1899 70.89H71.9399L86.99 74.21V74.38Z" fill="currentColor"/>
      <path d="M86.99 74.54L70.4399 70.89H71.1899L86.99 74.38V74.54Z" fill="currentColor"/>
      <path d="M86.99 74.71L70.37 71.04V70.89H70.4399L86.99 74.54V74.71Z" fill="currentColor"/>
      <path d="M86.99 74.87L70.37 71.21V71.04L86.99 74.71V74.87Z" fill="currentColor"/>
      <path d="M86.99 75.04L70.37 71.38V71.21L86.99 74.87V75.04Z" fill="currentColor"/>
      <path d="M86.99 75.2L70.37 71.54V71.38L86.99 75.04V75.2Z" fill="currentColor"/>
      <path d="M86.99 75.37L70.37 71.71V71.54L86.99 75.2V75.37Z" fill="currentColor"/>
      <path d="M86.99 75.54L70.37 71.87V71.71L86.99 75.37V75.54Z" fill="currentColor"/>
      <path d="M86.99 75.7L70.37 72.04V71.87L86.99 75.54V75.7Z" fill="currentColor"/>
      <path d="M86.99 75.87L70.37 72.2V72.04L86.99 75.7V75.87Z" fill="currentColor"/>
      <path d="M86.99 76.03L70.37 72.37V72.2L86.99 75.87V76.03Z" fill="currentColor"/>
      <path d="M86.99 76.2L70.37 72.53V72.37L86.99 76.03V76.2Z" fill="currentColor"/>
      <path d="M86.99 76.36L70.37 72.7V72.53L86.99 76.2V76.36Z" fill="currentColor"/>
      <path d="M86.99 76.53L70.37 72.86V72.7L86.99 76.36V76.53Z" fill="currentColor"/>
      <path d="M86.99 76.69L70.37 73.03V72.86L86.99 76.53V76.69Z" fill="currentColor"/>
      <path d="M86.99 76.86L70.37 73.19V73.03L86.99 76.69V76.86Z" fill="currentColor"/>
      <path d="M86.99 77.02L70.37 73.36V73.19L86.99 76.86V77.02Z" fill="currentColor"/>
      <path d="M86.99 77.19L70.37 73.53V73.36L86.99 77.02V77.19Z" fill="currentColor"/>
      <path d="M86.99 77.36L70.37 73.69V73.53L86.99 77.19V77.36Z" fill="currentColor"/>
      <path d="M86.99 77.52L70.37 73.86V73.69L86.99 77.36V77.52Z" fill="currentColor"/>
      <path d="M86.99 77.69L70.37 74.02V73.86L86.99 77.52V77.69Z" fill="currentColor"/>
      <path d="M86.99 77.85L70.37 74.19V74.02L86.99 77.69V77.85Z" fill="currentColor"/>
      <path d="M86.99 78.02L70.37 74.35V74.19L86.99 77.85V78.02Z" fill="currentColor"/>
      <path d="M86.99 78.18L70.37 74.52V74.35L86.99 78.02V78.18Z" fill="currentColor"/>
      <path d="M86.99 78.35L70.37 74.68V74.52L86.99 78.18V78.35Z" fill="currentColor"/>
      <path d="M86.99 78.51L70.37 74.85V74.68L86.99 78.35V78.51Z" fill="currentColor"/>
      <path d="M86.99 78.68L70.37 75.01V74.85L86.99 78.51V78.68Z" fill="currentColor"/>
      <path d="M86.99 78.84L70.37 75.18V75.01L86.99 78.68V78.84Z" fill="currentColor"/>
      <path d="M86.99 79.01L70.37 75.35V75.18L86.99 78.84V79.01Z" fill="currentColor"/>
      <path d="M86.99 79.17L70.37 75.51V75.35L86.99 79.01V79.17Z" fill="currentColor"/>
      <path d="M86.99 79.34L70.37 75.68V75.51L86.99 79.17V79.34Z" fill="currentColor"/>
      <path d="M86.99 79.51L70.37 75.84V75.68L86.99 79.34V79.51Z" fill="currentColor"/>
      <path d="M86.99 79.67L70.37 76.01V75.84L86.99 79.51V79.67Z" fill="currentColor"/>
      <path d="M86.99 79.84L70.37 76.17V76.01L86.99 79.67V79.84Z" fill="currentColor"/>
      <path d="M86.99 80L70.37 76.34V76.17L86.99 79.84V80Z" fill="currentColor"/>
      <path d="M86.99 80.17L70.37 76.5V76.34L86.99 80V80.17Z" fill="currentColor"/>
      <path d="M86.99 80.33L70.37 76.67V76.5L86.99 80.17V80.33Z" fill="currentColor"/>
      <path d="M86.99 80.5L70.37 76.83V76.67L86.99 80.33V80.5Z" fill="currentColor"/>
      <path d="M86.99 80.66L70.37 77V76.83L86.99 80.5V80.66Z" fill="currentColor"/>
      <path d="M86.99 80.83L70.37 77.17V77L86.99 80.66V80.83Z" fill="currentColor"/>
      <path d="M86.99 80.99L70.37 77.33V77.17L86.99 80.83V80.99Z" fill="currentColor"/>
      <path d="M86.99 81.16L70.37 77.5V77.33L86.99 80.99V81.16Z" fill="currentColor"/>
      <path d="M86.99 81.33L70.37 77.66V77.5L86.99 81.16V81.33Z" fill="currentColor"/>
      <path d="M86.99 81.49L70.37 77.83V77.66L86.99 81.33V81.49Z" fill="currentColor"/>
      <path d="M86.99 81.66L70.37 77.99V77.83L86.99 81.49V81.66Z" fill="currentColor"/>
      <path d="M86.99 81.82L70.37 78.16V77.99L86.99 81.66V81.82Z" fill="currentColor"/>
      <path d="M86.99 81.99L70.37 78.32V78.16L86.99 81.82V81.99Z" fill="currentColor"/>
      <path d="M86.99 82.15L70.37 78.49V78.32L86.99 81.99V82.15Z" fill="currentColor"/>
      <path d="M86.99 82.32L70.37 78.65V78.49L86.99 82.15V82.32Z" fill="currentColor"/>
      <path d="M86.99 82.48L70.37 78.82V78.65L86.99 82.32V82.48Z" fill="currentColor"/>
      <path d="M86.99 82.65L70.37 78.98V78.82L86.99 82.48V82.65Z" fill="currentColor"/>
      <path d="M86.99 82.81L70.37 79.15V78.98L86.99 82.65V82.81Z" fill="currentColor"/>
      <path d="M86.99 82.98L70.37 79.32V79.15L86.99 82.81V82.98Z" fill="currentColor"/>
      <path d="M86.99 83.15L70.37 79.48V79.32L86.99 82.98V83.15Z" fill="currentColor"/>
      <path d="M86.99 83.31L70.37 79.65V79.48L86.99 83.15V83.31Z" fill="currentColor"/>
      <path d="M86.99 83.48L70.37 79.81V79.65L86.99 83.31V83.48Z" fill="currentColor"/>
      <path d="M86.99 83.64L70.37 79.98V79.81L86.99 83.48V83.64Z" fill="currentColor"/>
      <path d="M86.99 83.81L70.37 80.14V79.98L86.99 83.64V83.81Z" fill="currentColor"/>
      <path d="M86.99 83.97L70.37 80.31V80.14L86.99 83.81V83.97Z" fill="currentColor"/>
      <path d="M86.99 84.14L70.37 80.47V80.31L86.99 83.97V84.14Z" fill="currentColor"/>
      <path d="M86.99 84.3L70.37 80.64V80.47L86.99 84.14V84.3Z" fill="currentColor"/>
      <path d="M86.99 84.47L70.37 80.8V80.64L86.99 84.3V84.47Z" fill="currentColor"/>
      <path d="M86.99 84.63L70.37 80.97V80.8L86.99 84.47V84.63Z" fill="currentColor"/>
      <path d="M86.99 84.8L70.37 81.14V80.97L86.99 84.63V84.8Z" fill="currentColor"/>
      <path d="M86.99 84.96L70.37 81.3V81.14L86.99 84.8V84.96Z" fill="currentColor"/>
      <path d="M86.99 85.13L70.37 81.47V81.3L86.99 84.96V85.13Z" fill="currentColor"/>
      <path d="M86.99 85.3L70.37 81.63V81.47L86.99 85.13V85.3Z" fill="currentColor"/>
      <path d="M86.99 85.46L70.37 81.8V81.63L86.99 85.3V85.46Z" fill="currentColor"/>
      <path d="M86.99 85.63L70.37 81.96V81.8L86.99 85.46V85.63Z" fill="currentColor"/>
      <path d="M86.99 85.79L70.37 82.13V81.96L86.99 85.63V85.79Z" fill="currentColor"/>
      <path d="M86.99 85.96L70.37 82.29V82.13L86.99 85.79V85.96Z" fill="currentColor"/>
      <path d="M86.99 86.12L70.37 82.46V82.29L86.99 85.96V86.12Z" fill="currentColor"/>
      <path d="M86.99 86.29L70.37 82.62V82.46L86.99 86.12V86.29Z" fill="currentColor"/>
      <path d="M86.99 86.45L70.37 82.79V82.62L86.99 86.29V86.45Z" fill="currentColor"/>
      <path d="M86.99 86.62L70.37 82.95V82.79L86.99 86.45V86.62Z" fill="currentColor"/>
      <path d="M86.99 86.78L70.37 83.12V82.95L86.99 86.62V86.78Z" fill="currentColor"/>
      <path d="M86.99 86.95L70.37 83.29V83.12L86.99 86.78V86.95Z" fill="currentColor"/>
      <path d="M86.99 87.12L70.37 83.45V83.29L86.99 86.95V87.12Z" fill="currentColor"/>
      <path d="M86.99 87.28L70.37 83.62V83.45L86.99 87.12V87.28Z" fill="currentColor"/>
      <path d="M86.99 87.32L86.97 87.44L70.37 83.78V83.62L86.99 87.28V87.32Z" fill="currentColor"/>
      <path d="M86.97 87.44L86.95 87.54H86.6699L70.37 83.95V83.78L86.97 87.44Z" fill="currentColor"/>
      <path d="M85.9199 87.54L70.37 84.11V83.95L86.6699 87.54H85.9199Z" fill="currentColor"/>
      <path d="M85.1699 87.54L70.37 84.28V84.11L85.9199 87.54H85.1699Z" fill="currentColor"/>
      <path d="M84.4199 87.54L70.37 84.44V84.28L85.1699 87.54H84.4199Z" fill="currentColor"/>
      <path d="M83.6699 87.54L70.37 84.61V84.44L84.4199 87.54H83.6699Z" fill="currentColor"/>
      <path d="M82.9199 87.54L70.37 84.77V84.61L83.6699 87.54H82.9199Z" fill="currentColor"/>
      <path d="M82.1699 87.54L70.37 84.94V84.77L82.9199 87.54H82.1699Z" fill="currentColor"/>
      <path d="M81.4199 87.54L70.37 85.11V84.94L82.1699 87.54H81.4199Z" fill="currentColor"/>
      <path d="M80.6699 87.54L70.37 85.27V85.11L81.4199 87.54H80.6699Z" fill="currentColor"/>
      <path d="M79.9199 87.54L70.37 85.44V85.27L80.6699 87.54H79.9199Z" fill="currentColor"/>
      <path d="M70.37 85.44L79.9199 87.54H70.37V85.44Z" fill="currentColor"/>
      </g>
    </svg>
  )
}
