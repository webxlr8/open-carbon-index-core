// @tgwf/co2 ships no type declarations. It is a devDependency used only by
// the parity test, which asserts our SWDM v4 implementation matches the
// Green Web Foundation's reference within 1%.
declare module "@tgwf/co2" {
  export class co2 {
    constructor(options?: {
      model?: string;
      version?: number;
      rating?: boolean;
    });
    perByte(bytes: number, green?: boolean, options?: unknown): number;
    perVisit(bytes: number, green?: boolean, options?: unknown): number;
  }
  export const averageIntensity: { data: Record<string, number>; type: string };
}
