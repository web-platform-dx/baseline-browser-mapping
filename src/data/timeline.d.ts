export type BrowserShorthand =
  | "c"
  | "ca"
  | "e"
  | "f"
  | "fa"
  | "s"
  | "si"
  | "wva"
  | "sa"
  | "oa"
  | "o"
  | "k"
  | "y"
  | "u"
  | "q"
  | "fb"
  | "ia";

export type VersionNumber = string;

export type ReleaseDate = string;

export type EngineVersion = string;

export type CondensedTimelineEntry = [
  BrowserShorthand,
  VersionNumber,
  ReleaseDate,
  EngineVersion?,
];

export type CondensedTimeline = {
  [date: string]: CondensedTimelineEntry[];
};

export const timelineString: string;
export const lastUpdated: number;
