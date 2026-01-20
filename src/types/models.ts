import type { 
  Bias, 
  Group, 
  Link, 
  Tag, 
  LinkMedia,
  BiasWithGroup
} from './database';

/**
 * Enriched Link with associated tags and media
 */
export interface EnrichedLink extends Link {
  tags: Tag[];
  media: LinkMedia[];
  bias?: BiasWithGroup | null;
}

/**
 * Type for grouped biases in the UI
 */
export interface GroupedBiases {
  group: Group | null;
  biases: BiasWithGroup[];
}

/**
 * Reexport common models
 */
export type { 
  Bias, 
  Group, 
  Link, 
  Tag, 
  LinkMedia,
  BiasWithGroup
};
