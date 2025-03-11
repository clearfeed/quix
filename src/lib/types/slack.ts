import { Nullable } from "./common";

export type ParseSlackMentionsUserMap = Record<
  string,
  { name: string; email: string; avatar: Nullable<string> }
>;