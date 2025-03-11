import { Nullable } from "./common";

export type ParseSlackMentionsUserMap = Record<
  string,
  { name: string; email: Nullable<string>; avatar: Nullable<string> }
>;