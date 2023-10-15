import { type SlotOptions, slot } from "../slot.jsx";
import type { type } from "../type.js";

export function Slot<
  const ID extends string,
  const T extends type = "string",
>(input: { id: ID; type?: T; options?: SlotOptions }): JSX.Element {
  return <>{slot(input.id, input.type, input.options)}</>;
}
