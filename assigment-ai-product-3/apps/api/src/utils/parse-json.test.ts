import { describe, it, expect } from "vitest";
import { parseJSON } from "./parse-json";

describe("parseJSON", () => {
  it("parses plain JSON string directly", () => {
    const input = '{"name":"test","value":42}';
    const result = parseJSON(input);
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("strips ```json fence and parses", () => {
    const input = '```json\n{"name":"test","value":42}\n```';
    const result = parseJSON(input);
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("strips ``` fence (without json label) and parses", () => {
    const input = '```\n{"name":"test","value":42}\n```';
    const result = parseJSON(input);
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("handles leading/trailing whitespace", () => {
    const input = '  \n```json\n{"key":"value"}\n```\n  ';
    const result = parseJSON(input);
    expect(result).toEqual({ key: "value" });
  });

  it("parses arrays correctly", () => {
    const input = '```json\n[1,2,3]\n```';
    const result = parseJSON<number[]>(input);
    expect(result).toEqual([1, 2, 3]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJSON("not valid json")).toThrow();
  });
});
