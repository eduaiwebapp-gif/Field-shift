// Small colour illustrations for each crop (24x24 viewBox).
const ICONS = {
  wheat: (
    <g>
      <path d="M12 22V8" stroke="#8a6a14" strokeWidth="1.6" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx="9.6" cy={9 + i * 3} rx="2.1" ry="1.2" transform={`rotate(-35 9.6 ${9 + i * 3})`} fill="#e8b931" />
          <ellipse cx="14.4" cy={9 + i * 3} rx="2.1" ry="1.2" transform={`rotate(35 14.4 ${9 + i * 3})`} fill="#d9a520" />
        </g>
      ))}
      <ellipse cx="12" cy="6" rx="1.3" ry="2.2" fill="#e8b931" />
    </g>
  ),
  barley: (
    <g>
      <path d="M12 22V9" stroke="#7a6a2a" strokeWidth="1.6" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx="10.3" cy={10 + i * 2.8} rx="1.6" ry="1.1" fill="#c9b458" />
          <ellipse cx="13.7" cy={10 + i * 2.8} rx="1.6" ry="1.1" fill="#b39f45" />
          <path d={`M10.3 ${10 + i * 2.8} L5 ${4 + i * 2.8}`} stroke="#c9b458" strokeWidth="0.8" />
          <path d={`M13.7 ${10 + i * 2.8} L19 ${4 + i * 2.8}`} stroke="#b39f45" strokeWidth="0.8" />
        </g>
      ))}
    </g>
  ),
  chickpea: (
    <g>
      <circle cx="9" cy="13" r="4.2" fill="#e7c48a" />
      <circle cx="15.5" cy="11" r="3.6" fill="#d9b06a" />
      <circle cx="13" cy="17" r="3.4" fill="#ecd09d" />
      <path d="M7.5 11.5 q1.5 -1 3 0" stroke="#b98d48" strokeWidth="0.9" fill="none" />
    </g>
  ),
  lentil: (
    <g>
      <ellipse cx="8.5" cy="12" rx="4" ry="2.6" fill="#c8743a" />
      <ellipse cx="15" cy="10" rx="3.6" ry="2.3" fill="#d98a4b" />
      <ellipse cx="13.5" cy="16" rx="3.8" ry="2.4" fill="#b8642e" />
    </g>
  ),
  faba: (
    <g>
      <path d="M4 15 C 6 6, 18 5, 20 9 C 21 12, 15 13, 12 15 C 9 17, 4 19, 4 15 Z" fill="#5fae5b" />
      <ellipse cx="9" cy="13" rx="2" ry="1.5" fill="#a5d98e" />
      <ellipse cx="13.5" cy="10.8" rx="2" ry="1.5" fill="#a5d98e" />
    </g>
  ),
  olive: (
    <g>
      <path d="M5 6 C 10 4, 17 6, 19 10" stroke="#5c6b3a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <ellipse cx="9" cy="6.5" rx="3.2" ry="1.3" transform="rotate(-20 9 6.5)" fill="#7f9a52" />
      <ellipse cx="15" cy="7" rx="3.2" ry="1.3" transform="rotate(20 15 7)" fill="#6d8a43" />
      <ellipse cx="10" cy="14.5" rx="3.3" ry="4.4" fill="#4b5a2a" />
      <ellipse cx="16" cy="15.5" rx="3" ry="4" fill="#6b7c38" />
      <ellipse cx="9" cy="13" rx="0.9" ry="1.3" fill="#7f8f50" />
    </g>
  ),
  tomato: (
    <g>
      <circle cx="12" cy="14" r="7" fill="#e0483b" />
      <ellipse cx="9.5" cy="12" rx="1.6" ry="2.2" fill="#f07a6c" />
      <path d="M12 7 l-3 -1.5 l2 2.2 l-3.5 1 l3.6 0.4 l-0.6 2.4 l1.5 -2 l1.5 2 l-0.6 -2.4 l3.6 -0.4 l-3.5 -1 l2 -2.2 z" fill="#3e8e3e" />
    </g>
  ),
};

export default function CropIcon({ id, size = 22, className = '' }) {
  const g = ICONS[id];
  if (!g) return null;
  return (
    <svg className={`crop-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {g}
    </svg>
  );
}
