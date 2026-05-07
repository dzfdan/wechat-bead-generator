const BEAD_PALETTE = [
  { code: 'H2', name: '米白', hex: '#F5F1E6', rgb: [245, 241, 230] },
  { code: 'H3', name: '浅灰白', hex: '#E6E2DB', rgb: [230, 226, 219] },
  { code: 'H10', name: '暖白', hex: '#EEE9EA', rgb: [238, 233, 234] },
  { code: 'H7', name: '纯黑', hex: '#000000', rgb: [0, 0, 0] },
  { code: 'H9', name: '炭灰', hex: '#55514E', rgb: [85, 81, 78] },
  { code: 'G2', name: '卡其', hex: '#D4BE9C', rgb: [212, 190, 156] },
  { code: 'G3', name: '驼色', hex: '#C2A882', rgb: [194, 168, 130] },
  { code: 'E1', name: '奶粉', hex: '#FFE6EF', rgb: [255, 230, 239] },
  { code: 'M7', name: '裸肤色浅', hex: '#F8D2BE', rgb: [248, 210, 190] },
  { code: 'M8', name: '标准肤色', hex: '#F0BFAA', rgb: [240, 191, 170] },
  { code: 'M10', name: '古铜肤色', hex: '#C98F75', rgb: [201, 143, 117] },
  { code: 'D1', name: '浅香芋紫', hex: '#E8D5F2', rgb: [232, 213, 242] },
  { code: 'E2', name: '樱花粉', hex: '#FEC0DF', rgb: [254, 192, 223] },
  { code: 'E8', name: '豆沙粉浅', hex: '#DDA3B4', rgb: [221, 163, 180] },
  { code: 'M11', name: '浅豹纹棕', hex: '#D9B396', rgb: [217, 179, 150] },
  { code: 'F4', name: '正红', hex: '#FC283C', rgb: [252, 40, 60] },
  { code: 'F3', name: '柿子红', hex: '#F76A48', rgb: [247, 106, 72] },
  { code: 'E10', name: '干枯玫瑰粉', hex: '#B37289', rgb: [179, 114, 137] },
  { code: 'A14', name: '南瓜黄', hex: '#FBBF4F', rgb: [251, 191, 79] },
  { code: 'G1', name: '浅卡其', hex: '#E8D6B9', rgb: [232, 214, 185] },
  { code: 'M9', name: '深肤色', hex: '#E2A88F', rgb: [226, 168, 143] },
  { code: 'G9', name: '深咖啡', hex: '#5E2E2A', rgb: [94, 46, 42] },
  { code: 'G4', name: '浅棕', hex: '#B08F68', rgb: [176, 143, 104] },
  { code: 'B15', name: '橄榄绿', hex: '#5F8A4F', rgb: [95, 138, 79] },
  { code: 'C5', name: '浅宝蓝', hex: '#30B4EE', rgb: [48, 180, 238] },
  { code: 'H4', name: '浅灰', hex: '#D1CDCA', rgb: [209, 205, 202] },
  { code: 'M5', name: '莫兰迪粉灰', hex: '#BFA9AF', rgb: [191, 169, 175] },
  { code: 'H8', name: '深灰', hex: '#7A7673', rgb: [122, 118, 115] }
];

function getLuma(input) {
  return (input.r * 0.299) + (input.g * 0.587) + (input.b * 0.114);
}

function weightedDistanceSquared(input, candidate) {
  const [r, g, b] = candidate.rgb;
  const dr = input.r - r;
  const dg = input.g - g;
  const db = input.b - b;
  const dl = getLuma(input) - getLuma({ r, g, b });

  return (
    (dr * dr * 3) +
    (dg * dg * 4) +
    (db * db * 2) +
    (dl * dl * 2)
  );
}

function getPortraitOverrideCode(input) {
  if (input.r >= 246 && input.g >= 224 && input.g <= 236 && input.b >= 214 && input.b <= 228) {
    return 'E1';
  }

  if (input.r >= 236 && input.r <= 248 && input.g >= 202 && input.g <= 220 && input.b >= 186 && input.b <= 202) {
    return 'M7';
  }

  if (input.r >= 198 && input.r <= 220 && input.g >= 108 && input.g <= 128 && input.b >= 118 && input.b <= 138) {
    return 'E10';
  }

  if (input.r >= 176 && input.r <= 196 && input.g >= 124 && input.g <= 144 && input.b >= 108 && input.b <= 126) {
    return 'M10';
  }

  if (input.r >= 168 && input.r <= 186 && input.g >= 140 && input.g <= 156 && input.b >= 96 && input.b <= 116) {
    return 'G4';
  }

  return null;
}

function pickNearestBeadColor(input) {
  const portraitOverrideCode = getPortraitOverrideCode(input);

  if (portraitOverrideCode) {
    return BEAD_PALETTE.find((item) => item.code === portraitOverrideCode);
  }

  return BEAD_PALETTE.reduce((best, item) => {
    if (!best) {
      return item;
    }

    return weightedDistanceSquared(input, item) < weightedDistanceSquared(input, best) ? item : best;
  }, null);
}

module.exports = {
  BEAD_PALETTE,
  pickNearestBeadColor
};
