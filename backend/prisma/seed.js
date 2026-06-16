const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const categories = [
  { name: '상의', slug: 'tops', sortOrder: 1 },
  { name: '하의', slug: 'bottoms', sortOrder: 2 },
  { name: '아우터', slug: 'outerwear', sortOrder: 3 },
  { name: '원피스', slug: 'dresses', sortOrder: 4 },
  { name: '가방', slug: 'bags', sortOrder: 5 },
  { name: '신발', slug: 'shoes', sortOrder: 6 },
  { name: '액세서리', slug: 'accessories', sortOrder: 7 },
];

const subCategories = [
  { name: '티셔츠', slug: 'tshirts', parent: 'tops', sortOrder: 1 },
  { name: '셔츠/블라우스', slug: 'shirts', parent: 'tops', sortOrder: 2 },
  { name: '니트/스웨터', slug: 'knitwear', parent: 'tops', sortOrder: 3 },
  { name: '청바지', slug: 'jeans', parent: 'bottoms', sortOrder: 1 },
  { name: '슬랙스', slug: 'slacks', parent: 'bottoms', sortOrder: 2 },
  { name: '스커트', slug: 'skirts', parent: 'bottoms', sortOrder: 3 },
  { name: '코트', slug: 'coats', parent: 'outerwear', sortOrder: 1 },
  { name: '패딩', slug: 'padding', parent: 'outerwear', sortOrder: 2 },
  { name: '재킷', slug: 'jackets', parent: 'outerwear', sortOrder: 3 },
];

const products = [
  // ── 티셔츠 ──────────────────────────────────
  {
    name: '베이직 크루넥 티셔츠',
    description: '380g 중량감 있는 코튼 소재로 제작한 크루넥 티셔츠입니다. 넉넉한 오버핏으로 이너와 아우터 모두 활용 가능합니다.',
    price: 29000,
    comparePrice: 39000,
    category: 'tshirts',
    tags: ['basic', 'cotton', 'daily'],
    isFeatured: true,
    salesCount: 124,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '화이트', color: '#f5f5f5' }, { value: '블랙', color: '#111111' }, { value: '그레이', color: '#9e9e9e' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    name: '피그먼트 오버핏 반팔',
    description: '피그먼트 워싱 가공으로 독특한 빈티지 색감을 낸 오버핏 반팔입니다. 착용할수록 자연스러운 색 변화가 생깁니다.',
    price: 35000,
    category: 'tshirts',
    tags: ['vintage', 'pigment', 'overfit'],
    isFeatured: true,
    salesCount: 89,
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1622445275576-721325763afe?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '머스타드', color: '#c49a22' }, { value: '올리브', color: '#6b6b3a' }, { value: '버건디', color: '#6e1423' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    name: '스트라이프 보더 티',
    description: '클래식한 스트라이프 패턴의 보더 티셔츠입니다. 마린룩의 베이스 아이템으로 완성도 높은 스타일링이 가능합니다.',
    price: 32000,
    comparePrice: 42000,
    category: 'tshirts',
    tags: ['stripe', 'marine', 'casual'],
    isFeatured: false,
    salesCount: 47,
    images: [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '네이비/화이트', color: '#1f2a44' }, { value: '블랙/화이트', color: '#111111' }],
    sizes: ['S', 'M', 'L'],
  },

  // ── 셔츠/블라우스 ─────────────────────────────
  {
    name: '코튼 오버핏 셔츠',
    description: '밀도 높은 코튼 원단으로 제작한 오버핏 셔츠입니다. 단독 착용은 물론 가벼운 아우터처럼 활용하기 좋습니다.',
    price: 49000,
    comparePrice: 59000,
    category: 'shirts',
    tags: ['cotton', 'daily', 'shirt'],
    isFeatured: true,
    salesCount: 42,
    images: [
      'https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '화이트', color: '#f8f8f8' }, { value: '스카이블루', color: '#b9d8f2' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: '린넨 루즈핏 셔츠',
    description: '통기성 좋은 린넨 혼방 소재의 루즈핏 셔츠입니다. 여름 시즌 단독 착용 또는 레이어드 스타일에 적합합니다.',
    price: 55000,
    category: 'shirts',
    tags: ['linen', 'summer', 'loose'],
    isFeatured: false,
    salesCount: 33,
    images: [
      'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '아이보리', color: '#f0ede3' }, { value: '민트', color: '#aed8d1' }, { value: '핑크', color: '#e8b4b8' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: '플라워 프린트 블라우스',
    description: '은은한 플라워 패턴이 돋보이는 쉬폰 블라우스입니다. 스커트나 슬랙스와 매치하면 여성스러운 룩이 완성됩니다.',
    price: 58000,
    comparePrice: 69000,
    category: 'shirts',
    tags: ['floral', 'blouse', 'feminine'],
    isFeatured: false,
    salesCount: 28,
    images: [
      'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551489186-cf8726f514f8?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '화이트', color: '#f5f5f5' }, { value: '블루', color: '#a2c4e8' }],
    sizes: ['S', 'M', 'L'],
  },

  // ── 니트/스웨터 ───────────────────────────────
  {
    name: '소프트 라운드 니트',
    description: '부드러운 터치감과 여유로운 실루엣이 특징인 데일리 니트입니다. 간절기부터 겨울까지 활용도가 높습니다.',
    price: 62000,
    comparePrice: 72000,
    category: 'knitwear',
    tags: ['knit', 'soft', 'basic'],
    isFeatured: true,
    salesCount: 35,
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '크림', color: '#efe6d6' }, { value: '차콜', color: '#4b4b4b' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: '케이블 터틀넥 스웨터',
    description: '입체적인 케이블 패턴과 넉넉한 터틀넥이 포인트인 두꺼운 울 혼방 스웨터입니다. 겨울 시즌 필수 아이템.',
    price: 89000,
    comparePrice: 109000,
    category: 'knitwear',
    tags: ['cable', 'turtleneck', 'winter'],
    isFeatured: true,
    salesCount: 61,
    images: [
      'https://images.unsplash.com/photo-1608756686954-d8b2a4db2e17?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1617922001439-4a2e6562f328?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '아이보리', color: '#f0ede3' }, { value: '카멜', color: '#c19a6b' }, { value: '그레이', color: '#9e9e9e' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    name: '크롭 가디건',
    description: '짧은 기장감과 단추 디테일이 포인트인 크롭 가디건입니다. 이너에 맞춰 다양하게 스타일링할 수 있습니다.',
    price: 68000,
    category: 'knitwear',
    tags: ['cardigan', 'crop', 'layering'],
    isFeatured: false,
    salesCount: 44,
    images: [
      'https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '베이지', color: '#d4b896' }, { value: '블루', color: '#7db3d5' }, { value: '화이트', color: '#f5f5f5' }],
    sizes: ['S', 'M', 'L'],
  },

  // ── 청바지 ───────────────────────────────────
  {
    name: '스트레이트 데님 팬츠',
    description: '탄탄한 데님 소재와 자연스러운 워싱으로 완성한 스트레이트 핏 데님 팬츠입니다.',
    price: 79000,
    category: 'jeans',
    tags: ['denim', 'straight', 'blue'],
    isFeatured: true,
    salesCount: 58,
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '라이트블루', color: '#8fb4d9' }, { value: '인디고', color: '#233d63' }],
    sizes: ['26', '28', '30', '32'],
  },
  {
    name: '와이드 데님 팬츠',
    description: '넉넉한 와이드 핏으로 편안한 착용감을 주는 데님 팬츠입니다. 스니커즈부터 힐까지 다양한 신발과 매치 가능합니다.',
    price: 89000,
    comparePrice: 105000,
    category: 'jeans',
    tags: ['wide', 'denim', 'trendy'],
    isFeatured: true,
    salesCount: 73,
    images: [
      'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '라이트블루', color: '#8fb4d9' }, { value: '블랙', color: '#111111' }],
    sizes: ['26', '28', '30', '32'],
  },
  {
    name: '크롭 슬림 데님',
    description: '발목 위로 살짝 올라오는 크롭 기장과 슬림한 핏이 특징입니다. 스트레치 소재로 활동성도 뛰어납니다.',
    price: 72000,
    category: 'jeans',
    tags: ['crop', 'slim', 'stretch'],
    isFeatured: false,
    salesCount: 39,
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '미디엄블루', color: '#5b8db8' }, { value: '화이트', color: '#f0f0f0' }],
    sizes: ['26', '27', '28', '29', '30'],
  },

  // ── 슬랙스 ───────────────────────────────────
  {
    name: '와이드 슬랙스',
    description: '부드럽게 흘러내리는 소재와 와이드한 핏이 우아한 분위기를 연출하는 슬랙스입니다. 블레이저나 니트와 잘 어울립니다.',
    price: 85000,
    comparePrice: 99000,
    category: 'slacks',
    tags: ['wide', 'slacks', 'office'],
    isFeatured: true,
    salesCount: 52,
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '그레이', color: '#808080' }, { value: '아이보리', color: '#f0ede3' }],
    sizes: ['26', '28', '30', '32'],
  },
  {
    name: '체크 패턴 슬랙스',
    description: '클래식한 체크 패턴이 포인트인 세미와이드 슬랙스입니다. 포멀과 캐주얼 모두에 활용할 수 있는 활용도 높은 아이템입니다.',
    price: 92000,
    category: 'slacks',
    tags: ['check', 'pattern', 'classic'],
    isFeatured: false,
    salesCount: 26,
    images: [
      'https://images.unsplash.com/photo-1617296538902-887900d9b592?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙체크', color: '#333333' }, { value: '그레이체크', color: '#808080' }],
    sizes: ['26', '28', '30', '32'],
  },

  // ── 스커트 ───────────────────────────────────
  {
    name: '플리츠 미디 스커트',
    description: '움직임에 따라 자연스럽게 흐르는 플리츠 디테일의 미디 스커트입니다.',
    price: 68000,
    category: 'skirts',
    tags: ['skirt', 'pleats', 'midi'],
    isFeatured: false,
    salesCount: 22,
    images: [
      'https://images.unsplash.com/photo-1583496661160-fb5886a13d27?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551163943-3f7fb8d8e18b?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '그레이', color: '#999999' }, { value: '네이비', color: '#1f2a44' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: '사틴 미니 스커트',
    description: '광택감 있는 사틴 소재로 고급스러운 분위기를 연출하는 미니 스커트입니다. 나이트 룩과 데이 룩 모두 활용 가능합니다.',
    price: 55000,
    comparePrice: 69000,
    category: 'skirts',
    tags: ['satin', 'mini', 'glossy'],
    isFeatured: true,
    salesCount: 48,
    images: [
      'https://images.unsplash.com/photo-1617922001439-4a2e6562f328?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1619603364853-f6c9dd5b46d6?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '실버', color: '#c0c0c0' }, { value: '블랙', color: '#111111' }, { value: '샴페인', color: '#f7e7ce' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: '데님 미디 스커트',
    description: '데님 소재로 제작한 A라인 미디 스커트입니다. 캐주얼하면서도 세련된 룩을 완성할 수 있습니다.',
    price: 62000,
    category: 'skirts',
    tags: ['denim', 'midi', 'casual'],
    isFeatured: false,
    salesCount: 31,
    images: [
      'https://images.unsplash.com/photo-1570976447640-ac859083963f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '라이트블루', color: '#8fb4d9' }, { value: '블루블랙', color: '#1a1f36' }],
    sizes: ['S', 'M', 'L'],
  },

  // ── 아우터: 재킷 ──────────────────────────────
  {
    name: '테일러드 싱글 재킷',
    description: '깔끔한 어깨선과 적당한 여유감으로 출근룩과 캐주얼룩 모두에 어울리는 싱글 재킷입니다.',
    price: 129000,
    comparePrice: 159000,
    category: 'jackets',
    tags: ['jacket', 'tailored', 'office'],
    isFeatured: true,
    salesCount: 27,
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '베이지', color: '#c4ad8d' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: '오버사이즈 블레이저',
    description: '의도적으로 넉넉하게 재단한 오버사이즈 블레이저입니다. 슬랙스나 데님과 레이어드하면 완성도 높은 스타일링이 가능합니다.',
    price: 145000,
    comparePrice: 175000,
    category: 'jackets',
    tags: ['blazer', 'oversized', 'layering'],
    isFeatured: true,
    salesCount: 65,
    images: [
      'https://images.unsplash.com/photo-1548126032-079a0fb0099d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '그레이', color: '#7a7a7a' }, { value: '카멜', color: '#c19a6b' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },

  // ── 아우터: 코트 ──────────────────────────────
  {
    name: '라이트 트렌치 코트',
    description: '가벼운 소재감과 클래식한 디테일을 살린 트렌치 코트입니다. 환절기 아우터로 적합합니다.',
    price: 189000,
    comparePrice: 219000,
    category: 'coats',
    tags: ['trench', 'coat', 'spring'],
    isFeatured: true,
    salesCount: 19,
    images: [
      'https://images.unsplash.com/photo-1520975682031-ae6bace0f060?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '베이지', color: '#c6ad8f' }, { value: '카키', color: '#74745c' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: '울 롱 코트',
    description: '80% 울 혼방 소재의 따뜻한 롱 코트입니다. 모던하고 세련된 실루엣으로 겨울철 스타일링의 완성도를 높여줍니다.',
    price: 265000,
    comparePrice: 320000,
    category: 'coats',
    tags: ['wool', 'long', 'winter'],
    isFeatured: true,
    salesCount: 42,
    images: [
      'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551489186-cf8726f514f8?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '카멜', color: '#c19a6b' }, { value: '그레이', color: '#808080' }],
    sizes: ['S', 'M', 'L'],
  },

  // ── 아우터: 패딩 ──────────────────────────────
  {
    name: '숏 구스다운 패딩',
    description: '90% 구스다운 충전재로 최고의 보온성을 자랑하는 숏 패딩입니다. 경량이면서도 부드러운 착용감을 제공합니다.',
    price: 238000,
    comparePrice: 289000,
    category: 'padding',
    tags: ['down', 'short', 'warm'],
    isFeatured: true,
    salesCount: 86,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '네이비', color: '#1f2a44' }, { value: '아이보리', color: '#f0ede3' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    name: '롱 덕다운 패딩',
    description: '무릎까지 오는 롱 기장으로 추운 겨울에도 완벽한 보온성을 제공합니다. 덕다운 80% 충전으로 가볍고 따뜻합니다.',
    price: 198000,
    comparePrice: 248000,
    category: 'padding',
    tags: ['long', 'duck-down', 'winter'],
    isFeatured: false,
    salesCount: 34,
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1520975682031-ae6bace0f060?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '카키', color: '#74745c' }],
    sizes: ['S', 'M', 'L', 'XL'],
  },

  // ── 원피스 ───────────────────────────────────
  {
    name: '플로럴 랩 원피스',
    description: '화사한 플로럴 패턴의 랩 스타일 원피스입니다. 허리를 강조하는 실루엣으로 여성스러운 분위기를 연출합니다.',
    price: 89000,
    comparePrice: 109000,
    category: 'dresses',
    tags: ['floral', 'wrap', 'feminine'],
    isFeatured: true,
    salesCount: 54,
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '플로럴핑크', color: '#e8a0b4' }, { value: '플로럴블루', color: '#7db3d5' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: '슬립 미디 원피스',
    description: '실크 터치 소재의 슬립 드레스 스타일 원피스입니다. 이너로도 단독으로도 연출 가능한 미디 기장입니다.',
    price: 75000,
    category: 'dresses',
    tags: ['slip', 'midi', 'silk'],
    isFeatured: true,
    salesCount: 67,
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '샴페인', color: '#f7e7ce' }, { value: '슬레이트블루', color: '#6a7f9a' }],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: '니트 칼라 원피스',
    description: '도톰한 니트 소재로 제작한 겨울용 원피스입니다. 부드러운 소재와 심플한 디자인으로 다양한 스타일링에 활용 가능합니다.',
    price: 98000,
    comparePrice: 119000,
    category: 'dresses',
    tags: ['knit', 'dress', 'winter'],
    isFeatured: false,
    salesCount: 29,
    images: [
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '베이지', color: '#d4b896' }, { value: '블랙', color: '#111111' }],
    sizes: ['S', 'M', 'L'],
  },

  // ── 가방 ─────────────────────────────────────
  {
    name: '미니멀 레더 토트백',
    description: '구조적인 실루엣과 넉넉한 수납 공간을 갖춘 데일리 토트백입니다.',
    price: 99000,
    category: 'bags',
    tags: ['bag', 'leather', 'daily'],
    isFeatured: true,
    salesCount: 31,
    images: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '브라운', color: '#7a4f2a' }],
    sizes: ['FREE'],
  },
  {
    name: '버킷 숄더백',
    description: '매일 들기 좋은 버킷 형태의 숄더백입니다. 부드러운 소재와 구조적인 라인이 균형을 이룹니다.',
    price: 85000,
    comparePrice: 105000,
    category: 'bags',
    tags: ['bucket', 'shoulder', 'daily'],
    isFeatured: true,
    salesCount: 48,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '베이지', color: '#d4b896' }, { value: '와인', color: '#722f37' }],
    sizes: ['FREE'],
  },
  {
    name: '크로스바디 미니백',
    description: '필수품만 넣을 수 있는 컴팩트한 크로스바디 백입니다. 체인 스트랩으로 세련된 포인트를 줍니다.',
    price: 72000,
    category: 'bags',
    tags: ['crossbody', 'mini', 'chain'],
    isFeatured: false,
    salesCount: 57,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '화이트', color: '#f5f5f5' }, { value: '골드', color: '#c8a951' }],
    sizes: ['FREE'],
  },
  {
    name: '캔버스 에코백',
    description: '두꺼운 캔버스 소재로 제작된 실용적인 에코백입니다. 가벼우면서도 넉넉한 수납 공간을 자랑합니다.',
    price: 28000,
    category: 'bags',
    tags: ['canvas', 'eco', 'casual'],
    isFeatured: false,
    salesCount: 93,
    images: [
      'https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534859108275-a3a6f52a5c0a?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '내추럴', color: '#e8dcc8' }, { value: '블랙', color: '#111111' }],
    sizes: ['FREE'],
  },

  // ── 신발 ─────────────────────────────────────
  {
    name: '클래식 로퍼',
    description: '군더더기 없는 디자인과 안정적인 착화감의 클래식 로퍼입니다.',
    price: 118000,
    category: 'shoes',
    tags: ['loafers', 'classic', 'shoes'],
    isFeatured: false,
    salesCount: 16,
    images: [
      'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '브라운', color: '#6f4528' }],
    sizes: ['240', '250', '260', '270', '280'],
  },
  {
    name: '청키 스니커즈',
    description: '두꺼운 밑창과 레트로한 디자인이 포인트인 청키 스니커즈입니다. 캐주얼 룩에 볼륨감을 더해줍니다.',
    price: 135000,
    comparePrice: 159000,
    category: 'shoes',
    tags: ['chunky', 'sneakers', 'retro'],
    isFeatured: true,
    salesCount: 79,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '화이트', color: '#f5f5f5' }, { value: '블랙', color: '#111111' }],
    sizes: ['230', '240', '250', '260', '270', '280'],
  },
  {
    name: '블록힐 뮬',
    description: '안정적인 블록힐과 슬립온 스타일이 편리한 뮬입니다. 포멀에서 캐주얼까지 다양하게 활용 가능합니다.',
    price: 95000,
    category: 'shoes',
    tags: ['block-heel', 'mule', 'feminine'],
    isFeatured: false,
    salesCount: 38,
    images: [
      'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '베이지', color: '#d4b896' }, { value: '화이트', color: '#f5f5f5' }],
    sizes: ['230', '235', '240', '245', '250', '255'],
  },
  {
    name: '앵클 부츠',
    description: '발목을 감싸는 짧은 기장의 앵클 부츠입니다. 지퍼 디테일로 착탈이 편리하고 다양한 룩과 잘 어울립니다.',
    price: 148000,
    comparePrice: 179000,
    category: 'shoes',
    tags: ['ankle', 'boots', 'zipper'],
    isFeatured: true,
    salesCount: 55,
    images: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '브라운', color: '#6f4528' }],
    sizes: ['230', '235', '240', '245', '250', '255', '260'],
  },

  // ── 액세서리 ─────────────────────────────────
  {
    name: '실버 레이어드 목걸이',
    description: '가는 체인 3개가 레이어드된 실버 목걸이 세트입니다. 일상적인 착용부터 특별한 날까지 활용도가 높습니다.',
    price: 38000,
    comparePrice: 48000,
    category: 'accessories',
    tags: ['necklace', 'silver', 'layered'],
    isFeatured: true,
    salesCount: 88,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '실버', color: '#c0c0c0' }, { value: '골드', color: '#c8a951' }],
    sizes: ['FREE'],
  },
  {
    name: '미니멀 링 이어링',
    description: '깔끔하고 심플한 링 형태의 귀걸이입니다. 다양한 스타일에 자연스럽게 녹아들어 매일 착용하기 좋습니다.',
    price: 22000,
    category: 'accessories',
    tags: ['earring', 'ring', 'minimal'],
    isFeatured: false,
    salesCount: 112,
    images: [
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1573408301185-9519f94816a1?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '실버', color: '#c0c0c0' }, { value: '골드', color: '#c8a951' }],
    sizes: ['FREE'],
  },
  {
    name: '울 버킷햇',
    description: '두꺼운 울 소재로 제작한 버킷햇입니다. 가을·겨울 시즌 룩의 완성도를 높여주는 소품입니다.',
    price: 45000,
    comparePrice: 55000,
    category: 'accessories',
    tags: ['hat', 'bucket', 'wool'],
    isFeatured: false,
    salesCount: 36,
    images: [
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '블랙', color: '#111111' }, { value: '베이지', color: '#d4b896' }, { value: '그레이', color: '#9e9e9e' }],
    sizes: ['FREE'],
  },
  {
    name: '캐시미어 머플러',
    description: '100% 캐시미어 소재의 부드러운 머플러입니다. 겨울철 목을 따뜻하게 감싸주면서 스타일도 살려줍니다.',
    price: 68000,
    comparePrice: 89000,
    category: 'accessories',
    tags: ['cashmere', 'scarf', 'winter'],
    isFeatured: false,
    salesCount: 44,
    images: [
      'https://images.unsplash.com/photo-1457545195570-67757db4c8d0?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80',
    ],
    colors: [{ value: '아이보리', color: '#f0ede3' }, { value: '카멜', color: '#c19a6b' }, { value: '그레이', color: '#9e9e9e' }],
    sizes: ['FREE'],
  },
];

const ensureUser = async ({ email, password, name, phone, role }) => {
  const hashedPassword = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { name, phone, role },
    create: { email, password: hashedPassword, name, phone, role },
  });
};

const upsertCategory = async (data) => (
  prisma.category.upsert({
    where: { slug: data.slug },
    update: data,
    create: data,
  })
);

const createProduct = async (product, categoryId) => {
  const existing = await prisma.product.findFirst({ where: { name: product.name } });
  if (existing) return existing; // 이미 있으면 건너뜀

  return prisma.product.create({
    data: {
      name: product.name,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice || null,
      images: JSON.stringify(product.images),
      categoryId,
      tags: JSON.stringify(product.tags),
      isActive: true,
      isFeatured: product.isFeatured,
      salesCount: product.salesCount,
      options: {
        create: [
          {
            name: '색상',
            sortOrder: 0,
            values: { create: product.colors },
          },
          {
            name: '사이즈',
            sortOrder: 1,
            values: { create: product.sizes.map((value) => ({ value })) },
          },
        ],
      },
      variants: {
        create: product.colors.flatMap((color) =>
          product.sizes.map((size, index) => ({
            sku: `${product.name.replace(/\s+/g, '-').toUpperCase()}-${color.value}-${size}`,
            options: JSON.stringify({ 색상: color.value, 사이즈: size }),
            stock: Math.max(0, 12 - index * 2),
            price: null,
          }))
        ),
      },
    },
  });
};

async function main() {
  console.log('Seed start');

  await ensureUser({
    email: 'admin@shop.kr',
    password: 'admin123!',
    name: '관리자',
    phone: '010-0000-0000',
    role: 'ADMIN',
  });

  await ensureUser({
    email: 'customer@havit.kr',
    password: 'user123!',
    name: '채하율',
    phone: '010-1234-5678',
    role: 'USER',
  });

  const categoryMap = {};
  for (const category of categories) {
    categoryMap[category.slug] = await upsertCategory(category);
  }

  for (const category of subCategories) {
    categoryMap[category.slug] = await upsertCategory({
      name: category.name,
      slug: category.slug,
      parentId: categoryMap[category.parent].id,
      sortOrder: category.sortOrder,
    });
  }

  for (const product of products) {
    await createProduct(product, categoryMap[product.category].id);
  }

  console.log(`Seed complete: ${products.length} products`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
