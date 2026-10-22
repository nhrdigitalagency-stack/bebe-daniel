/**
 * Local licensed Lottie vector animation definitions in the rose palette
 * (#FF007F, #FF80BF, #FFE5F2, #392B33).
 */

export type BabyLottieVariant =
  | 'wavingBear'
  | 'sleepingCloud'
  | 'moonStars'
  | 'babyMobile'
  | 'subtleHearts';

const COLOR_PLUM = [0.224, 0.169, 0.2, 1];       // #392B33
const COLOR_ROSE_DEEP = [1.0, 0.0, 0.498, 1];    // #FF007F (attached rose swatch)
const COLOR_ROSE_SOFT = [1.0, 0.502, 0.749, 1];  // #FF80BF
const COLOR_ROSE_PASTEL = [1.0, 0.898, 0.949, 1]; // #FFE5F2

export const WAVING_BEAR_LOTTIE = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: 'WavingBear',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'WavingPaw',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-14], e: [18], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [18], e: [-14], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 120, s: [-14] },
          ],
        },
        p: { a: 0, k: [138, 118, 0] },
        a: { a: 0, k: [0, 15, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [24, 38] } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_SOFT }, o: { a: 0, k: 100 } },
            { ty: 'st', c: { a: 0, k: COLOR_PLUM }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 25 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'BearHead',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-2], e: [2], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 60, s: [2], e: [-2], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 120, s: [-2] },
          ],
        },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [100, 100, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [68, 64] }, s: { a: 0, k: [28, 28] } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_SOFT }, o: { a: 0, k: 100 } },
            { ty: 'st', c: { a: 0, k: COLOR_PLUM }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [132, 64] }, s: { a: 0, k: [28, 28] } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_SOFT }, o: { a: 0, k: 100 } },
            { ty: 'st', c: { a: 0, k: COLOR_PLUM }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [100, 96] }, s: { a: 0, k: [76, 72] } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_PASTEL }, o: { a: 0, k: 100 } },
            { ty: 'st', c: { a: 0, k: COLOR_PLUM }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [100, 104] }, s: { a: 0, k: [30, 22] } },
            { ty: 'fl', c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [85, 88] }, s: { a: 0, k: [6, 6] } },
            { ty: 'el', p: { a: 0, k: [115, 88] }, s: { a: 0, k: [6, 6] } },
            { ty: 'el', p: { a: 0, k: [100, 100] }, s: { a: 0, k: [9, 7] } },
            { ty: 'fl', c: { a: 0, k: COLOR_PLUM }, o: { a: 0, k: 100 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [76, 100] }, s: { a: 0, k: [12, 8] } },
            { ty: 'el', p: { a: 0, k: [124, 100] }, s: { a: 0, k: [12, 8] } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_DEEP }, o: { a: 0, k: 50 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
  ],
};

export const SLEEPING_CLOUD_LOTTIE = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: 'SleepingCloud',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'FloatingCloud',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [100, 104, 0], e: [100, 94, 0], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 60, s: [100, 94, 0], e: [100, 104, 0], i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 } },
            { t: 120, s: [100, 104, 0] },
          ],
        },
        a: { a: 0, k: [100, 100, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [72, 108] }, s: { a: 0, k: [52, 46] } },
            { ty: 'el', p: { a: 0, k: [102, 94] }, s: { a: 0, k: [64, 58] } },
            { ty: 'el', p: { a: 0, k: [132, 110] }, s: { a: 0, k: [48, 42] } },
            { ty: 'rc', p: { a: 0, k: [102, 118] }, s: { a: 0, k: [88, 28] }, r: { a: 0, k: 14 } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_PASTEL }, o: { a: 0, k: 100 } },
            { ty: 'st', c: { a: 0, k: COLOR_ROSE_SOFT }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [82, 110] }, s: { a: 0, k: [10, 6] } },
            { ty: 'el', p: { a: 0, k: [122, 110] }, s: { a: 0, k: [10, 6] } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_DEEP }, o: { a: 0, k: 50 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
  ],
};

export const MOON_STARS_LOTTIE = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: 'MoonAndStars',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Star1',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [40], e: [100] },
            { t: 60, s: [100], e: [40] },
            { t: 120, s: [40] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [145, 62, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [85, 85, 100], e: [115, 115, 100] },
            { t: 60, s: [115, 115, 100], e: [85, 85, 100] },
            { t: 120, s: [85, 85, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'sr',
              sy: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 4 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 12 },
              os: { a: 0, k: 0 },
            },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_DEEP }, o: { a: 0, k: 100 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'CradleMoon',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-6], e: [6] },
            { t: 60, s: [6], e: [-6] },
            { t: 120, s: [-6] },
          ],
        },
        p: { a: 0, k: [96, 104, 0] },
        a: { a: 0, k: [96, 104, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [96, 104] }, s: { a: 0, k: [84, 84] } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_SOFT }, o: { a: 0, k: 100 } },
            { ty: 'st', c: { a: 0, k: COLOR_PLUM }, o: { a: 0, k: 100 }, w: { a: 0, k: 2.5 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
  ],
};

export const BABY_MOBILE_LOTTIE = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: 'BabyMobile',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'MobileSwing',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-4], e: [4] },
            { t: 60, s: [4], e: [-4] },
            { t: 120, s: [-4] },
          ],
        },
        p: { a: 0, k: [100, 30, 0] },
        a: { a: 0, k: [100, 30, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'rc', p: { a: 0, k: [100, 58] }, s: { a: 0, k: [110, 6] }, r: { a: 0, k: 4 } },
            { ty: 'fl', c: { a: 0, k: COLOR_PLUM }, o: { a: 0, k: 100 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [60, 118] }, s: { a: 0, k: [24, 24] } },
            { ty: 'el', p: { a: 0, k: [100, 134] }, s: { a: 0, k: [28, 28] } },
            { ty: 'el', p: { a: 0, k: [140, 118] }, s: { a: 0, k: [24, 24] } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_SOFT }, o: { a: 0, k: 100 } },
            { ty: 'st', c: { a: 0, k: COLOR_ROSE_DEEP }, o: { a: 0, k: 100 }, w: { a: 0, k: 2 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
  ],
};

export const SUBTLE_HEARTS_LOTTIE = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: 'SubtleHearts',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'PulseHeart',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [75], e: [100] },
            { t: 60, s: [100], e: [75] },
            { t: 120, s: [75] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [100, 100, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [94, 94, 100], e: [106, 106, 100] },
            { t: 60, s: [106, 106, 100], e: [94, 94, 100] },
            { t: 120, s: [94, 94, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [86, 92] }, s: { a: 0, k: [36, 36] } },
            { ty: 'el', p: { a: 0, k: [114, 92] }, s: { a: 0, k: [36, 36] } },
            { ty: 'fl', c: { a: 0, k: COLOR_ROSE_DEEP }, o: { a: 0, k: 85 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
  ],
};

export const LOTTIE_MAP: Record<BabyLottieVariant, object> = {
  wavingBear: WAVING_BEAR_LOTTIE,
  sleepingCloud: SLEEPING_CLOUD_LOTTIE,
  moonStars: MOON_STARS_LOTTIE,
  babyMobile: BABY_MOBILE_LOTTIE,
  subtleHearts: SUBTLE_HEARTS_LOTTIE,
};
