import { INTEGRATIONS } from "@quix/lib/constants";

export type HomeViewArgs = {
  selectedTool?: typeof INTEGRATIONS[number]['value'];
}