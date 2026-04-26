export type NailShape = 'almond' | 'square' | 'stiletto' | 'round' | 'duck' | 'ballerina';
export type NailTexture = 'glossy' | 'matte';
export type NailArt = 'none' | 'french';

export interface FingerDesign {
  color: string;
  baseColor: string;
  parts: string[];
  length: number;
  widthScale: number;
  anchorOffset: number;
  sizeScale: number;
}

export interface NailDesign {
  color: string;
  baseColor: string;
  shape: NailShape;
  texture: NailTexture;
  art: NailArt;
  length: number;
  widthScale: number;
  anchorOffset: number;
  sizeScale: number;
  parts: string[];
  // Individual finger overrides
  individualFingers: { [key: number]: FingerDesign };
  useIndividual: boolean;
}

export const NAIL_SHAPES: { id: NailShape; label: string }[] = [
  { id: 'almond', label: '아몬드' },
  { id: 'square', label: '스퀘어' },
  { id: 'stiletto', label: '스틸레토' },
  { id: 'round', label: '라운드' },
  { id: 'duck', label: '덕네일' },
  { id: 'ballerina', label: '발레리나' },
];

export const TEXTURES: { id: NailTexture; label: string; icon: string }[] = [
  { id: 'glossy', label: '유광 마감', icon: '✨' },
  { id: 'matte', label: '무광 마감', icon: '🌑' },
];

export const ARTS: { id: NailArt; label: string; icon: string }[] = [
  { id: 'none', label: '기본 패턴', icon: '🎨' },
  { id: 'french', label: '프렌치 아트', icon: '💅' },
];

export const COLORS = [
  '#FFB7B2', '#FF9AA2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA',
  '#FDE2E4', '#FAD2E1', '#E2ECE9', '#BEE1E6', '#DFE7FD', '#CDDAFD',
  '#000000', '#FFFFFF', '#FF0000', '#FFD700', '#C0C0C0', '#4B0082',
  '#f3cfc6' // classic nude
];

export const PARTS = [
  { id: 'heart', name: '하트', icon: '❤️' },
  { id: 'star', name: '별', icon: '✨' },
  { id: 'diamond', name: '다이아', icon: '💎' },
  { id: 'pearl', name: '진주', icon: '⚪' },
  { id: 'flower', name: '꽃', icon: '🌸' },
  { id: 'stone', name: '스톤', icon: '💠' },
];
