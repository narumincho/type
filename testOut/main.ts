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
    if (
      !objectEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    ) {
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
): void => {
  console.group(title);
  console.log("js value        :", jsValue);
  const binary = encodeFunction(jsValue);
  console.log(
    "binary          :",
    binary.map(e => e.toString(16).padStart(2, "0"))
  );
  const decodedJsValue = decodeFunction(0, new Uint8Array(binary)).result;
  console.log("decoded js value:", decodedJsValue);
  if (objectEqual(jsValue, decodedJsValue)) {
    console.log(cliColor.green("ok"));
  } else {
    console.log(cliColor.red("failure!!"));
  }
  console.log();
  console.groupEnd();
};

/* 
0000: 0
0001: 1
0010: 2
0011: 3
0100: 4
0101: 5
0110: 6
0111: 7
1000: 8
1001: 9
1010: A
1011: B
1100: C
1101: D
1110: E
1111: F
*/
test("min int32", -(2 ** 31), out.encodeInt32, out.decodeInt32);

test("string ascii", "sample text", out.encodeString, out.decodeString);

test(
  "string japanese emoji",
  "やったぜ😀👨‍👩‍👧‍👦",
  out.encodeString,
  out.decodeString
);

test(
  "maybe string",
  out.maybeJust("sample"),
  out.encodeMaybe(out.encodeString),
  out.decodeMaybe(out.decodeString)
);

test(
  "list number",
  [1, 43, 6423, 334, 663, 0, 74, -1, -29031, 2 ** 31 - 1],
  out.encodeList(out.encodeInt32),
  out.decodeList(out.decodeInt32)
);

test("custom", out.typeList(out.typeInt), out.encodeType, out.decodeType);
test(
  "binary",
  out.maybeJust(new Uint8Array([1, 2, 5, 2, 722, 36, 163, -31, 61])),
  out.encodeMaybe(out.encodeBinary),
  out.decodeMaybe(out.decodeBinary)
);

test(
  "token",
  "24b6b3789d903e841490ac04ffc2b6f9848ea529b2d9db380d190583b09995e6",
  out.encodeToken,
  out.decodeToken
);

test("id", "756200c85a0ff28f08daa2d201d616a9", out.encodeId, out.decodeId);

test<out.Maybe<out.Project>>(
  "maybe project",
  out.maybeJust({
    name: "サンプルプロジェクト",
    icon: "b13333411078d64e9be75bebc374708868c728a340516c563c49fe9c5bd456c5" as out.FileHash,
    image: "0cbeb09760a312a3562547115aa855a39d9e1ca837ed00331e3a84d6de50ff3b" as out.FileHash
  }),
  out.encodeMaybe(out.encodeProject),
  out.decodeMaybe(out.decodeProject)
);
