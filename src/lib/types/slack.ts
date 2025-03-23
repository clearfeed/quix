import { ViewOutput } from "@slack/bolt";
import { Nullable } from "./common";
import { InputBlock } from "@slack/web-api";

export type ParseSlackMentionsUserMap = Record<
  string,
  { name: string; email: Nullable<string>; avatar: Nullable<string> }
>;

export type SlackBlockStateValues = ViewOutput['state']['values'];

export type ParseInputBlockResponse = {
  initialValue: Nullable<string | string[]>;
  selectedValue: Nullable<string | string[]>;
  isUpdated: boolean;
  inputFieldType: InputBlock['element']['type'];
};