import { useState } from 'react';
import { X, Ruler } from 'lucide-react';

const SIZE_CHARTS = {
  tops: {
    label: '상의 사이즈',
    headers: ['사이즈', '어깨너비', '가슴둘레', '소매길이', '총장'],
    rows: [
      ['XS', '40', '86', '58', '63'],
      ['S',  '42', '90', '59', '65'],
      ['M',  '44', '96', '60', '67'],
      ['L',  '46', '102','61', '69'],
      ['XL', '48', '108','62', '71'],
      ['2XL','50', '114','63', '73'],
    ],
    unit: 'cm',
  },
  bottoms: {
    label: '하의 사이즈',
    headers: ['사이즈', '허리둘레', '엉덩이둘레', '허벅지둘레', '밑위', '총장'],
    rows: [
      ['26/XS', '68',  '88',  '54', '26', '97'],
      ['27/S',  '70',  '91',  '55', '27', '98'],
      ['28/M',  '74',  '94',  '57', '27', '99'],
      ['29/L',  '78',  '97',  '59', '28', '100'],
      ['30/XL', '82',  '100', '61', '28', '101'],
      ['32/2XL','86',  '104', '63', '29', '102'],
    ],
    unit: 'cm',
  },
  skirts: {
    label: '스커트 사이즈',
    headers: ['사이즈', '허리둘레', '엉덩이둘레', '총장(미니)', '총장(미디)'],
    rows: [
      ['XS', '62', '84', '40', '65'],
      ['S',  '65', '87', '42', '67'],
      ['M',  '68', '90', '44', '69'],
      ['L',  '72', '94', '46', '71'],
      ['XL', '76', '98', '48', '73'],
    ],
    unit: 'cm',
  },
  outerwear: {
    label: '아우터 사이즈',
    headers: ['사이즈', '어깨너비', '가슴둘레', '소매길이', '총장'],
    rows: [
      ['S',  '43', '94',  '60', '90'],
      ['M',  '45', '100', '61', '93'],
      ['L',  '47', '106', '62', '96'],
      ['XL', '49', '112', '63', '99'],
      ['2XL','51', '118', '64', '102'],
    ],
    unit: 'cm',
  },
  dresses: {
    label: '원피스 사이즈',
    headers: ['사이즈', '가슴둘레', '허리둘레', '엉덩이둘레', '총장'],
    rows: [
      ['XS', '82', '62', '88', '85'],
      ['S',  '86', '65', '91', '88'],
      ['M',  '90', '68', '94', '91'],
      ['L',  '95', '72', '98', '94'],
      ['XL', '100','76', '103','97'],
    ],
    unit: 'cm',
  },
  shoes: {
    label: '신발 사이즈',
    headers: ['한국(mm)', 'EU', 'US(남)', 'US(여)', 'UK'],
    rows: [
      ['235', '37',   '5.5', '6.5',  '4.5'],
      ['240', '38',   '6',   '7',    '5'],
      ['245', '38.5', '6.5', '7.5',  '5.5'],
      ['250', '39',   '7',   '8',    '6'],
      ['255', '40',   '7.5', '8.5',  '6.5'],
      ['260', '41',   '8',   '9',    '7'],
      ['265', '41.5', '8.5', '9.5',  '7.5'],
      ['270', '42',   '9',   '10',   '8'],
      ['275', '43',   '9.5', '10.5', '8.5'],
      ['280', '44',   '10',  '11',   '9'],
    ],
    unit: '',
  },
};

const CATEGORY_CHART_MAP = {
  tops: 'tops', tshirts: 'tops', shirts: 'tops', knitwear: 'tops',
  bottoms: 'bottoms', jeans: 'bottoms', slacks: 'bottoms',
  skirts: 'skirts',
  outerwear: 'outerwear', coats: 'outerwear', padding: 'outerwear', jackets: 'outerwear',
  dresses: 'dresses',
  shoes: 'shoes',
};

const HOW_TO_MEASURE = [
  { label: '가슴둘레', desc: '겨드랑이 아래 가장 넓은 부분을 수평으로 측정' },
  { label: '허리둘레', desc: '허리의 가장 가는 부분을 수평으로 측정' },
  { label: '엉덩이둘레', desc: '엉덩이의 가장 넓은 부분을 수평으로 측정' },
  { label: '어깨너비', desc: '어깨 끝에서 반대쪽 어깨 끝까지 수평 측정' },
];

export default function SizeGuide({ categorySlug }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chart');

  const chartKey = CATEGORY_CHART_MAP[categorySlug];
  if (!chartKey) return null;
  const chart = SIZE_CHARTS[chartKey];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors underline underline-offset-2"
      >
        <Ruler size={14} />
        사이즈 가이드
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{chart.label}</h2>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setTab('chart')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'chart' ? 'border-b-2 border-black' : 'text-gray-400'}`}
              >
                사이즈표
              </button>
              <button
                onClick={() => setTab('guide')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'guide' ? 'border-b-2 border-black' : 'text-gray-400'}`}
              >
                측정방법
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {tab === 'chart' ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          {chart.headers.map((h) => (
                            <th key={h} className="border border-gray-200 px-3 py-2 text-center font-medium whitespace-nowrap">
                              {h}{chart.unit ? ` (${chart.unit})` : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chart.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {row.map((cell, j) => (
                              <td key={j} className={`border border-gray-200 px-3 py-2 text-center ${j === 0 ? 'font-bold' : ''}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    * 위 사이즈는 참고용이며, 상품에 따라 실측과 1~3cm 차이가 있을 수 있습니다.
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  {HOW_TO_MEASURE.map((item) => (
                    <div key={item.label} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24 shrink-0 font-medium text-sm">{item.label}</div>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium mb-1">💡 측정 팁</p>
                    <p className="text-sm text-blue-600">줄자를 사용하여 타이트하지 않게 측정하고, 신체에 딱 맞게 두르세요. 혼자 측정하기 어려우면 다른 사람에게 도움을 요청하세요.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
