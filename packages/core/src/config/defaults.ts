// ============================================================================
// Config — default values
// ============================================================================

import type { SpecordConfigV1 } from "@specord/types";

/** Default file-name suffixes for source discovery. */
export const DEFAULT_CONTROLLER_SUFFIXES = [".controller.ts"];
export const DEFAULT_DTO_SUFFIXES = [".dto.ts", ".entity.ts", ".enum.ts"];

/** Default config values applied when neither CLI nor config file provides them. */
export const DEFAULT_CONFIG: Required<
  Pick<SpecordConfigV1, "ci">
> & {
  source: {
    controllerSuffixes: string[];
    dtoSuffixes: string[];
  };
} = {
  source: {
    controllerSuffixes: DEFAULT_CONTROLLER_SUFFIXES,
    dtoSuffixes: DEFAULT_DTO_SUFFIXES,
  },
  ci: {
    failOnInvalid: true,
    failOnUnresolved: false,
    failOnWarning: false,
  },
};
