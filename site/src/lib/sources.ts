export interface SourceData {
  id: string;
  title: string;
  publisher: string;
  url: string;
  official: boolean;
  state: string;
  checkedOn: Date | string;
  pageLastUpdated?: Date | string;
  notes?: string;
}

export function assertOfficialSource(figureId: string, source: SourceData | undefined): SourceData {
  if (!source) {
    throw new Error(`Figure "${figureId}" references missing source.`);
  }
  if (!source.official) {
    throw new Error(
      `Figure "${figureId}" references non-official source "${source.id}". Only official sources can back a figure.`,
    );
  }
  return source;
}
