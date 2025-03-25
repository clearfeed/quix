import { QuixUserAccessLevel } from "../constants";

//  Type definition for access settings
export type AccessSettingsType = {
  allowedUsersForInteraction: QuixUserAccessLevel;
  allowedChannelIds?: string[];
};