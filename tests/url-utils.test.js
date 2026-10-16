import { describe, expect, test } from "bun:test";
import {
  isUrlInList,
  isValidUrlPattern,
  parseSitesFromText,
  shouldApplyFilter,
  urlMatchesPattern,
} from "../src/utils/url-utils.ts";

describe("wildcard subdomains", () => {
  test("accepts bare wildcard domains through site entry validation", () => {
    for (const pattern of [
      "*.example.org",
      "*.team.corp.example.org",
      "https://*.example.org",
      "*.example.org/*",
      "*.example.org/private/*",
    ]) {
      expect(isValidUrlPattern(pattern)).toBe(true);
      expect(parseSitesFromText(pattern)[0]).toMatchObject({
        type: "pattern",
        valid: true,
      });
    }
  });

  test("matches www and arbitrary child depths across all paths", () => {
    for (const pattern of ["*.example.org", "*.example.org/*"]) {
      for (const url of [
        "https://www.example.org",
        "https://www.example.org/news",
        "http://mail.example.org/inbox?unread=true#today",
        "https://www.team32.dev.example.org/projects/1",
        "https://EXAMPLE-TEAM.EXAMPLE.ORG/page",
      ]) {
        expect(urlMatchesPattern(url, pattern)).toBe(true);
      }
    }
  });

  test("supports subdomain roots at any depth", () => {
    const pattern = "*.team.corp.example.org";
    for (const url of [
      "https://www.team.corp.example.org/page",
      "https://dev.team.corp.example.org/page",
      "https://www.dev.team.corp.example.org/page",
    ]) {
      expect(urlMatchesPattern(url, pattern)).toBe(true);
    }
    for (const url of [
      "https://team.corp.example.org/page",
      "https://other.corp.example.org/page",
      "https://team.example.org/page",
    ]) {
      expect(urlMatchesPattern(url, pattern)).toBe(false);
    }
  });

  test("does not match the parent, lookalike hosts, or a hostname in the URL path", () => {
    for (const pattern of ["*.example.org", "*.example.org/*"]) {
      for (const url of [
        "https://example.org/page",
        "https://notexample.org/page",
        "https://foo.example.org.evil.com/page",
        "https://evil.com/path.example.org/page",
        "https://evil.com/?next=https://mail.example.org/page",
        "https://mail.example.org@evil.com/page",
      ]) {
        expect(urlMatchesPattern(url, pattern)).toBe(false);
      }
    }
  });

  test("retains path, query, and fragment constraints", () => {
    expect(
      urlMatchesPattern(
        "https://www.example.org/private/notes",
        "*.example.org/private/*"
      )
    ).toBe(true);
    expect(
      urlMatchesPattern(
        "https://dev.example.org/public/notes",
        "*.example.org/private/*"
      )
    ).toBe(false);
    expect(
      urlMatchesPattern(
        "https://www.example.org/search?q=docs#results",
        "*.example.org/search?q=*#results"
      )
    ).toBe(true);
    expect(
      urlMatchesPattern(
        "https://www.example.org/search?q=docs#other",
        "*.example.org/search?q=*#results"
      )
    ).toBe(false);
    expect(
      urlMatchesPattern("https://www.example.org/page", "*.example.org/")
    ).toBe(false);
    expect(
      urlMatchesPattern("https://www.example.org/", "*.example.org/")
    ).toBe(true);
  });

  test("uses wildcard rules in both blacklist and whitelist modes", () => {
    const settings = {
      blacklist: [],
      whitelist: [],
      urlPatternBlacklist: ["*.google.com"],
      urlPatternWhitelist: ["*.google.com"],
    };
    const url = "https://www.google.com/search?q=monochromate";
    expect(isUrlInList(url, [], ["*.google.com"])).toBe(true);
    expect(shouldApplyFilter(url, { ...settings, mode: "blacklist" })).toBe(
      false
    );
    expect(shouldApplyFilter(url, { ...settings, mode: "whitelist" })).toBe(
      true
    );
    expect(
      shouldApplyFilter("https://unrelated.org", {
        ...settings,
        mode: "whitelist",
      })
    ).toBe(false);
  });

  test("rejects malformed wildcard domain entries", () => {
    for (const pattern of [
      "*.",
      "*.example..org/*",
      "*.-example.org/*",
      "*.example.org@evil.com/*",
    ]) {
      expect(isValidUrlPattern(pattern)).toBe(false);
      expect(urlMatchesPattern("https://evil.com/page", pattern)).toBe(false);
    }
  });

  test("preserves ordinary domain and path wildcard behavior", () => {
    expect(
      urlMatchesPattern(
        "https://www.youtube.com/watch?v=123",
        "youtube.com/watch*"
      )
    ).toBe(true);
    expect(
      urlMatchesPattern(
        "https://www.reddit.com/r/programming/new",
        "reddit.com/r/*"
      )
    ).toBe(true);
    expect(
      isUrlInList("https://www.example.org/page", ["example.org"], [])
    ).toBe(true);
    expect(
      isUrlInList("https://mail.example.org/page", ["example.org"], [])
    ).toBe(false);
  });
});
