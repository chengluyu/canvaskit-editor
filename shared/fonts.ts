export type FontDescription = {
  filePath: string;
  runtimeFileName: string;
  fontName: string;
};

export const fonts: FontDescription[] = [
  // {
  //   filePath: "node_modules/@fontsource/inter/files/inter-all-400-normal.woff",
  //   runtimeFileName: "inter-regular.woff",
  //   fontName: "Inter",
  // },
  {
    filePath:
      "node_modules/@fontsource/noto-sans/files/noto-sans-all-400-normal.woff",
    runtimeFileName: "noto-sans-regular.woff",
    fontName: "Noto Sans",
  },
  {
    filePath:
      "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff",
    runtimeFileName: "noto-sans-jp-regular.woff",
    fontName: "Noto Sans JP",
  },
  {
    filePath:
      "vendors/noto-sans-hebrew/instance_ttf/NotoSansHebrew-Regular.ttf",
    runtimeFileName: "noto-sans-hebrew-regular.ttf",
    fontName: "Noto Sans Hebrew",
  },
  {
    filePath: "vendors/noto-emoji/fonts/NotoColorEmoji.ttf",
    runtimeFileName: "noto-color-emoji.ttf",
    fontName: "Noto Color Emoji",
  },
];

export const fontFamilies = fonts.map((x) => x.fontName);
