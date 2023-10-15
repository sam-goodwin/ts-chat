export type simplify<T> = {
  [KeyType in keyof T]: T[KeyType];
} & {};
