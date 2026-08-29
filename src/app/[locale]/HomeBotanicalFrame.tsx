export default function HomeBotanicalFrame() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-72 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-lime-300/55 via-green-200/25 to-transparent" />
      <svg viewBox="0 0 420 270" className="absolute -bottom-4 -left-10 h-64 w-[26rem] opacity-95 sm:-left-4 sm:h-72 sm:w-[30rem]">
        <defs>
          <linearGradient id="left-leaf" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0" stopColor="#166534" />
            <stop offset="0.55" stopColor="#22c55e" />
            <stop offset="1" stopColor="#84cc16" />
          </linearGradient>
          <linearGradient id="left-grass" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0" stopColor="#3f6212" />
            <stop offset="1" stopColor="#a3e635" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="#3f6212" strokeLinecap="round" strokeWidth="4" opacity="0.72">
          <path d="M46 268Q58 184 88 110" />
          <path d="M95 270Q101 176 145 83" />
          <path d="M151 270Q150 180 199 118" />
          <path d="M204 270Q209 197 255 138" />
          <path d="M266 270Q268 205 305 158" />
        </g>
        <g fill="url(#left-leaf)">
          <ellipse cx="66" cy="203" rx="27" ry="12" transform="rotate(-38 66 203)" />
          <ellipse cx="91" cy="163" rx="30" ry="13" transform="rotate(30 91 163)" />
          <ellipse cx="118" cy="194" rx="30" ry="13" transform="rotate(-38 118 194)" />
          <ellipse cx="145" cy="139" rx="33" ry="14" transform="rotate(-24 145 139)" />
          <ellipse cx="164" cy="181" rx="31" ry="13" transform="rotate(35 164 181)" />
          <ellipse cx="202" cy="157" rx="33" ry="14" transform="rotate(-33 202 157)" />
          <ellipse cx="226" cy="198" rx="32" ry="13" transform="rotate(31 226 198)" />
          <ellipse cx="265" cy="181" rx="29" ry="12" transform="rotate(-34 265 181)" />
          <ellipse cx="301" cy="207" rx="28" ry="12" transform="rotate(25 301 207)" />
        </g>
        <g fill="url(#left-grass)" opacity="0.9">
          <path d="M0 270 34 173l5 97Z" />
          <path d="M20 270 63 146l-8 124Z" />
          <path d="M56 270 84 183l2 87Z" />
          <path d="M94 270 130 162l-8 108Z" />
          <path d="M135 270 171 181l-7 89Z" />
          <path d="M185 270 219 176l-5 94Z" />
          <path d="M235 270 269 193l-2 77Z" />
          <path d="M290 270 320 208l4 62Z" />
        </g>
        <g>
          <g transform="translate(78 224)"><circle r="16" fill="#fef3c7" /><circle r="6" fill="#f59e0b" /><circle cx="0" cy="-14" r="7" fill="#fff" /><circle cx="14" cy="0" r="7" fill="#fff" /><circle cx="0" cy="14" r="7" fill="#fff" /><circle cx="-14" cy="0" r="7" fill="#fff" /></g>
          <g transform="translate(183 219)"><circle r="12" fill="#fef3c7" /><circle r="5" fill="#f59e0b" /><circle cx="0" cy="-11" r="5" fill="#fff" /><circle cx="11" cy="0" r="5" fill="#fff" /><circle cx="0" cy="11" r="5" fill="#fff" /><circle cx="-11" cy="0" r="5" fill="#fff" /></g>
          <g transform="translate(277 232)"><circle r="10" fill="#fef3c7" /><circle r="4" fill="#f59e0b" /><circle cx="0" cy="-9" r="4" fill="#fff" /><circle cx="9" cy="0" r="4" fill="#fff" /><circle cx="0" cy="9" r="4" fill="#fff" /><circle cx="-9" cy="0" r="4" fill="#fff" /></g>
        </g>
      </svg>

      <svg viewBox="0 0 420 270" className="absolute -bottom-4 -right-10 h-64 w-[26rem] -scale-x-100 opacity-95 sm:-right-4 sm:h-72 sm:w-[30rem]">
        <defs>
          <linearGradient id="right-leaf" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0" stopColor="#166534" />
            <stop offset="0.55" stopColor="#22c55e" />
            <stop offset="1" stopColor="#84cc16" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="#3f6212" strokeLinecap="round" strokeWidth="4" opacity="0.72">
          <path d="M46 268Q58 184 88 110" />
          <path d="M95 270Q101 176 145 83" />
          <path d="M151 270Q150 180 199 118" />
          <path d="M204 270Q209 197 255 138" />
          <path d="M266 270Q268 205 305 158" />
        </g>
        <g fill="url(#right-leaf)">
          <ellipse cx="66" cy="203" rx="27" ry="12" transform="rotate(-38 66 203)" />
          <ellipse cx="91" cy="163" rx="30" ry="13" transform="rotate(30 91 163)" />
          <ellipse cx="118" cy="194" rx="30" ry="13" transform="rotate(-38 118 194)" />
          <ellipse cx="145" cy="139" rx="33" ry="14" transform="rotate(-24 145 139)" />
          <ellipse cx="164" cy="181" rx="31" ry="13" transform="rotate(35 164 181)" />
          <ellipse cx="202" cy="157" rx="33" ry="14" transform="rotate(-33 202 157)" />
          <ellipse cx="226" cy="198" rx="32" ry="13" transform="rotate(31 226 198)" />
          <ellipse cx="265" cy="181" rx="29" ry="12" transform="rotate(-34 265 181)" />
          <ellipse cx="301" cy="207" rx="28" ry="12" transform="rotate(25 301 207)" />
        </g>
        <g>
          <g transform="translate(78 224)"><circle r="16" fill="#fef3c7" /><circle r="6" fill="#f59e0b" /><circle cx="0" cy="-14" r="7" fill="#fff" /><circle cx="14" cy="0" r="7" fill="#fff" /><circle cx="0" cy="14" r="7" fill="#fff" /><circle cx="-14" cy="0" r="7" fill="#fff" /></g>
          <g transform="translate(183 219)"><circle r="12" fill="#fef3c7" /><circle r="5" fill="#f59e0b" /><circle cx="0" cy="-11" r="5" fill="#fff" /><circle cx="11" cy="0" r="5" fill="#fff" /><circle cx="0" cy="11" r="5" fill="#fff" /><circle cx="-11" cy="0" r="5" fill="#fff" /></g>
        </g>
      </svg>
    </div>
  );
}
