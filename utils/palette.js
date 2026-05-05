const BEAD_PALETTE = [
  { code: 'W01', name: 'Snow White', hex: '#f5f5f0', rgb: [245, 245, 240] },
  { code: 'W02', name: 'Warm White', hex: '#efe6da', rgb: [239, 230, 218] },
  { code: 'W03', name: 'Cool White', hex: '#e4e8ef', rgb: [228, 232, 239] },
  { code: 'K01', name: 'Jet Black', hex: '#222222', rgb: [34, 34, 34] },
  { code: 'K02', name: 'Soft Black', hex: '#3b3537', rgb: [59, 53, 55] },
  { code: 'N01', name: 'Soft Beige', hex: '#d8c3a5', rgb: [216, 195, 165] },
  { code: 'N02', name: 'Warm Beige', hex: '#cda987', rgb: [205, 169, 135] },
  { code: 'S01', name: 'Light Skin', hex: '#fae8de', rgb: [250, 232, 222] },
  { code: 'S02', name: 'Warm Skin', hex: '#efc7b6', rgb: [239, 199, 182] },
  { code: 'S03', name: 'Rosy Skin', hex: '#e7b5a7', rgb: [231, 181, 167] },
  { code: 'S04', name: 'Shadow Skin', hex: '#c99582', rgb: [201, 149, 130] },
  { code: 'S05', name: 'Deep Skin Shadow', hex: '#b78373', rgb: [183, 131, 115] },
  { code: 'P01', name: 'Powder Pink', hex: '#f6dbe7', rgb: [246, 219, 231] },
  { code: 'P02', name: 'Soft Pink', hex: '#efbfd6', rgb: [239, 191, 214] },
  { code: 'P03', name: 'Rose Pink', hex: '#e89bb7', rgb: [232, 155, 183] },
  { code: 'P04', name: 'Peach Pink', hex: '#efb0a2', rgb: [239, 176, 162] },
  { code: 'R01', name: 'Cherry Red', hex: '#e23d48', rgb: [226, 61, 72] },
  { code: 'R02', name: 'Coral Red', hex: '#ef6f68', rgb: [239, 111, 104] },
  { code: 'R03', name: 'Muted Rose', hex: '#cb7884', rgb: [203, 120, 132] },
  { code: 'Y01', name: 'Honey Yellow', hex: '#f5c542', rgb: [245, 197, 66] },
  { code: 'H01', name: 'Light Blonde', hex: '#e0cca0', rgb: [224, 204, 160] },
  { code: 'H02', name: 'Golden Blonde', hex: '#d7b07a', rgb: [215, 176, 122] },
  { code: 'H03', name: 'Deep Brown', hex: '#523c36', rgb: [82, 60, 54] },
  { code: 'H04', name: 'Hair Shadow', hex: '#b0936c', rgb: [176, 147, 108] },
  { code: 'G01', name: 'Leaf Green', hex: '#4e9f5a', rgb: [78, 159, 90] },
  { code: 'B01', name: 'Sky Blue', hex: '#5aa9e6', rgb: [90, 169, 230] },
  { code: 'GY1', name: 'Light Gray', hex: '#d8d8dc', rgb: [216, 216, 220] },
  { code: 'GY2', name: 'Mid Gray', hex: '#a8a8b3', rgb: [168, 168, 179] },
  { code: 'GY3', name: 'Deep Gray', hex: '#787985', rgb: [120, 121, 133] }
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

function pickNearestBeadColor(input) {
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
