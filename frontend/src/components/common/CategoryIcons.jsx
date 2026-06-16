const iconProps = {
  width: 28,
  height: 28,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// 상의 / 티셔츠 / 셔츠 / 니트
export const IconTops = () => (
  <svg {...iconProps}>
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
  </svg>
);

// 하의 / 청바지 / 슬랙스
export const IconBottoms = () => (
  <svg {...iconProps}>
    <path d="M5 2h14l-2 10-3 10h-4L7 12 5 2z" />
    <path d="M10 12h4" />
    <path d="M5 2h14" />
  </svg>
);

// 스커트
export const IconSkirt = () => (
  <svg {...iconProps}>
    <path d="M8 2h8l4 20H4L8 2z" />
    <path d="M7 8h10" />
  </svg>
);

// 아우터 / 코트 / 패딩 / 자켓
export const IconOuterwear = () => (
  <svg {...iconProps}>
    <path d="M7 2 4 5v16h6v-7h4v7h6V5l-3-3-2 2c-.9 1-2.1 1.5-3 1.5S9.9 5 9 4L7 2z" />
    <path d="M4 9h6" />
    <path d="M14 9h6" />
  </svg>
);

// 원피스
export const IconDress = () => (
  <svg {...iconProps}>
    <path d="M9 2c.5 2 1.7 3 3 3s2.5-1 3-3" />
    <path d="M9 2H7L5 8l-3 14h20L19 8l-2-6h-2" />
    <path d="M9 2l-2 6h10l-2-6" />
  </svg>
);

// 가방
export const IconBag = () => (
  <svg {...iconProps}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

// 신발 / 스니커즈
export const IconShoes = () => (
  <svg {...iconProps}>
    <path d="M2 18c0-1 .7-1.7 1.5-1.8L8 15.4l4.5-5.4H17a4 4 0 0 1 4 4v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
    <path d="M8 15.4V12" />
    <path d="M2 18h20" />
  </svg>
);

// 악세서리 / 주얼리
export const IconAccessories = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="14" r="4" />
    <path d="M9 10C9 8.3 10.3 7 12 7s3 1.3 3 3" />
    <path d="M8 7 5 4" />
    <path d="M16 7l3-3" />
    <path d="M12 7V3" />
    <path d="M9 4h6" />
  </svg>
);

const ICON_MAP = {
  tops: IconTops,
  tshirts: IconTops,
  shirts: IconTops,
  knitwear: IconTops,
  bottoms: IconBottoms,
  jeans: IconBottoms,
  slacks: IconBottoms,
  skirts: IconSkirt,
  outerwear: IconOuterwear,
  coats: IconOuterwear,
  padding: IconOuterwear,
  jackets: IconOuterwear,
  dresses: IconDress,
  bags: IconBag,
  shoes: IconShoes,
  accessories: IconAccessories,
};

export function CategoryIcon({ slug }) {
  const Icon = ICON_MAP[slug];
  if (!Icon) {
    return (
      <svg {...iconProps}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }
  return <Icon />;
}
