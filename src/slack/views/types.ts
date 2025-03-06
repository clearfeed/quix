import { INTEGRATIONS } from "@quix/lib/constants";

export type HomeViewArgs = {
  teamId: string;
  selectedTool?: typeof INTEGRATIONS[number]['value'];
}