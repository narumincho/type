import * as out from "./out";

const objectEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  if (isPrimitive(a) || isPrimitive(b)) {
    return false;
  }
  for (const [k, v] of Object.entries(a)) {
    if (!objectEqual(b[k], v)) {
      return false;
    }
  }
  return true;
};

const isPrimitive = (value: unknown): boolean => {
  const valueType = typeof value;
  return (
    value === undefined ||
    value === null ||
    valueType === "number" ||
    valueType === "string" ||
    valueType === "boolean" ||
    valueType === "symbol" ||
    valueType === "bigint"
  );
};

const maybeStringJsValue = out.maybeJust("それな");
console.group("maybe string");
console.log("js value", maybeStringJsValue);
const maybeStringBinary = out.encodeMaybe(out.encodeString)(maybeStringJsValue);
console.log("binary", maybeStringBinary);
const maybeStringDecodedJsValue = out.decodeMaybe(out.decodeString)(
  0,
  new Uint8Array(maybeStringBinary)
);
console.log("decoded js value", maybeStringDecodedJsValue);
console.log(
  "equal",
  objectEqual(maybeStringJsValue, maybeStringDecodedJsValue)
);
