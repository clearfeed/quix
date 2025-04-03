import { QuixUserAccessLevel } from '../constants';

//  Type definition for access settings
export type AccessSettingsType = {
  allowedUsersForDmInteraction: QuixUserAccessLevel;
  allowedChannelIds?: string[];
};
