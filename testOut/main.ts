import * as out from "./out";
import * as cliColor from "cli-color";

const objectEqual = <T>(a: T, b: T): boolean => {
  if (a === b) {
    return true;
  }
  if (isPrimitive(a) || isPrimitive(b)) {
    return false;
  }
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!objectEqual(a[key], b[key])) {
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

const test = <T>(
  title: string,
  jsValue: T,
  encodeFunction: (a: T) => ReadonlyArray<number>,
  decodeFunction: (a: number, b: Uint8Array) => { result: T; nextIndex: number }
) => {
  console.group(title);
  console.log("js value        :", jsValue);
  const binary = encodeFunction(jsValue);
  console.log("binary          :", binary);
  const decodedJsValue = decodeFunction(0, new Uint8Array(binary)).result;
  console.log("decoded js value:", decodedJsValue);
  if (objectEqual(jsValue, decodedJsValue)) {
    console.log(cliColor.red("failure!!"));
  } else {
    console.log(cliColor.green("ok"));
  }
  console.log();
  console.groupEnd();
};

test("string", "sample text", out.encodeString, out.decodeString);
test(
  "maybe string",
  out.maybeJust("それな"),
  out.encodeMaybe(out.encodeString),
  out.decodeMaybe(out.decodeString)
);
test(
  "list number",
  [1, 43, 6423, 334, 663, 74],
  out.encodeList(out.encodeInt32),
  out.decodeList(out.decodeInt)
);
test("custom", out.typeList(out.typeInt), out.encodeType, out.decodeType);
