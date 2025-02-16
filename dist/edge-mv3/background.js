var background = function() {
  "use strict";
  var _a, _b;
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls)
        return true;
      const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
  }
  const browser = (
    // @ts-expect-error
    ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) == null ? globalThis.chrome : (
      // @ts-expect-error
      globalThis.browser
    )
  );
  const definition = defineBackground(() => {
    browser.storage.local.get("Monofilter").then((data) => {
      if (!data.Monofilter) {
        browser.storage.local.set({
          Monofilter: {
            enabled: false,
            intensity: 100,
            blacklist: ["localhost"]
          }
        });
      } else if (data.Monofilter.enabled) {
        applyGreyscaleToAllTabs(data.Monofilter.intensity ?? 100);
      }
    });
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "toggleGreyscale") {
        browser.storage.local.get("Monofilter").then((data) => {
          const currentSettings = data.Monofilter;
          const intensity = message.intensity ?? (currentSettings == null ? void 0 : currentSettings.intensity) ?? 100;
          (currentSettings == null ? void 0 : currentSettings.blacklist) ?? [];
          if (currentSettings == null ? void 0 : currentSettings.enabled) {
            disableGreyscaleForAllTabs();
            browser.storage.local.set({
              Monofilter: {
                ...currentSettings,
                enabled: false
              }
            });
          } else {
            applyGreyscaleToAllTabs(intensity);
            browser.storage.local.set({
              Monofilter: {
                ...currentSettings,
                enabled: true,
                intensity
              }
            });
          }
        });
      }
      if (message.type === "setIntensity") {
        browser.storage.local.get("Monofilter").then((data) => {
          const currentSettings = data.Monofilter;
          const intensity = message.value;
          browser.storage.local.set({
            Monofilter: {
              ...currentSettings,
              enabled: true,
              intensity
            }
          });
          applyGreyscaleToAllTabs(intensity);
        });
      }
      if (message.type === "setBlacklist") {
        browser.storage.local.get("Monofilter").then((data) => {
          const currentSettings = data.Monofilter;
          const newBlacklist = message.value;
          browser.storage.local.set({
            Monofilter: {
              ...currentSettings,
              blacklist: newBlacklist
            }
          });
          if (currentSettings.enabled) {
            applyGreyscaleToAllTabs(currentSettings.intensity);
          }
        });
      }
    });
    function applyGreyscaleToAllTabs(intensity) {
      browser.storage.local.get("Monofilter").then((data) => {
        var _a2;
        const blacklist = ((_a2 = data.Monofilter) == null ? void 0 : _a2.blacklist) ?? [];
        browser.tabs.query({}).then((tabs) => {
          tabs.forEach((tab) => {
            if (tab.id && tab.url) {
              const url = new URL(tab.url);
              const domain = url.hostname.replace("www.", "");
              if (!blacklist.includes(domain)) {
                browser.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: (intensity2) => {
                    document.documentElement.style.filter = `grayscale(${intensity2}%)`;
                  },
                  args: [intensity]
                });
              }
            }
          });
        });
      });
    }
    function disableGreyscaleForAllTabs() {
      browser.tabs.query({}).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            browser.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                document.documentElement.style.filter = "";
              }
            });
          }
        });
      });
    }
  });
  background;
  function initPlugins() {
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = `${"ws:"}//${"localhost"}:${3e3}`;
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws == null ? void 0 : ws.send(JSON.stringify({ type: "custom", event, payload }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === "custom") {
            ws == null ? void 0 : ws.dispatchEvent(
              new CustomEvent(message.event, { detail: message.data })
            );
          }
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    const manifest = browser.runtime.getManifest();
    if (manifest.manifest_version == 2) {
      void reloadContentScriptMv2();
    } else {
      void reloadContentScriptMv3(payload);
    }
  }
  async function reloadContentScriptMv3({
    registration,
    contentScript
  }) {
    if (registration === "runtime") {
      await reloadRuntimeContentScriptMv3(contentScript);
    } else {
      await reloadManifestContentScriptMv3(contentScript);
    }
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([{ ...contentScript, id }]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([{ ...contentScript, id }]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      var _a2, _b2;
      const hasJs = (_a2 = contentScript.js) == null ? void 0 : _a2.find((js) => {
        var _a3;
        return (_a3 = cs.js) == null ? void 0 : _a3.includes(js);
      });
      const hasCss = (_b2 = contentScript.css) == null ? void 0 : _b2.find((css) => {
        var _a3;
        return (_a3 = cs.css) == null ? void 0 : _a3.includes(css);
      });
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log(
        "Content script is not registered yet, nothing to reload",
        contentScript
      );
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map(
      (match) => new MatchPattern(match)
    );
    const matchingTabs = allTabs.filter((tab) => {
      const url = tab.url;
      if (!url)
        return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url));
    });
    await Promise.all(
      matchingTabs.map(async (tab) => {
        try {
          await browser.tabs.reload(tab.id);
        } catch (err) {
          logger.warn("Failed to reload tab:", err);
        }
      })
    );
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener(
          "open",
          () => ws2.sendCustom("wxt:background-initialized")
        );
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") {
        browser.runtime.reload();
      }
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) {
      console.warn(
        "The background's main() function return a promise, but it must be synchronous"
      );
    }
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  const result$1 = result;
  return result$1;
}();
background;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3NhbmRib3gvZGVmaW5lLWJhY2tncm91bmQubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9saWIvaW5kZXguanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci9jaHJvbWUubWpzIiwiLi4vLi4vc3JjL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuICByZXR1cm4gYXJnO1xufVxuIiwiLy8gc3JjL2luZGV4LnRzXG52YXIgX01hdGNoUGF0dGVybiA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuKSB7XG4gICAgaWYgKG1hdGNoUGF0dGVybiA9PT0gXCI8YWxsX3VybHM+XCIpIHtcbiAgICAgIHRoaXMuaXNBbGxVcmxzID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gWy4uLl9NYXRjaFBhdHRlcm4uUFJPVE9DT0xTXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gXCIqXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IC8oLiopOlxcL1xcLyguKj8pKFxcLy4qKS8uZXhlYyhtYXRjaFBhdHRlcm4pO1xuICAgICAgaWYgKGdyb3VwcyA9PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIFwiSW5jb3JyZWN0IGZvcm1hdFwiKTtcbiAgICAgIGNvbnN0IFtfLCBwcm90b2NvbCwgaG9zdG5hbWUsIHBhdGhuYW1lXSA9IGdyb3VwcztcbiAgICAgIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCk7XG4gICAgICB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpO1xuICAgICAgdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gcHJvdG9jb2wgPT09IFwiKlwiID8gW1wiaHR0cFwiLCBcImh0dHBzXCJdIDogW3Byb3RvY29sXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IGhvc3RuYW1lO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gcGF0aG5hbWU7XG4gICAgfVxuICB9XG4gIGluY2x1ZGVzKHVybCkge1xuICAgIGlmICh0aGlzLmlzQWxsVXJscylcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IHUgPSB0eXBlb2YgdXJsID09PSBcInN0cmluZ1wiID8gbmV3IFVSTCh1cmwpIDogdXJsIGluc3RhbmNlb2YgTG9jYXRpb24gPyBuZXcgVVJMKHVybC5ocmVmKSA6IHVybDtcbiAgICByZXR1cm4gISF0aGlzLnByb3RvY29sTWF0Y2hlcy5maW5kKChwcm90b2NvbCkgPT4ge1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cHNcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwc01hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZpbGVcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGaWxlTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZnRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRnRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwidXJuXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzVXJuTWF0Y2godSk7XG4gICAgfSk7XG4gIH1cbiAgaXNIdHRwTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIdHRwc01hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0hvc3RQYXRoTWF0Y2godXJsKSB7XG4gICAgaWYgKCF0aGlzLmhvc3RuYW1lTWF0Y2ggfHwgIXRoaXMucGF0aG5hbWVNYXRjaClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBob3N0bmFtZU1hdGNoUmVnZXhzID0gW1xuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoKSxcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaC5yZXBsYWNlKC9eXFwqXFwuLywgXCJcIikpXG4gICAgXTtcbiAgICBjb25zdCBwYXRobmFtZU1hdGNoUmVnZXggPSB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLnBhdGhuYW1lTWF0Y2gpO1xuICAgIHJldHVybiAhIWhvc3RuYW1lTWF0Y2hSZWdleHMuZmluZCgocmVnZXgpID0+IHJlZ2V4LnRlc3QodXJsLmhvc3RuYW1lKSkgJiYgcGF0aG5hbWVNYXRjaFJlZ2V4LnRlc3QodXJsLnBhdGhuYW1lKTtcbiAgfVxuICBpc0ZpbGVNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZmlsZTovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNGdHBNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZnRwOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc1Vybk1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiB1cm46Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGNvbnZlcnRQYXR0ZXJuVG9SZWdleChwYXR0ZXJuKSB7XG4gICAgY29uc3QgZXNjYXBlZCA9IHRoaXMuZXNjYXBlRm9yUmVnZXgocGF0dGVybik7XG4gICAgY29uc3Qgc3RhcnNSZXBsYWNlZCA9IGVzY2FwZWQucmVwbGFjZSgvXFxcXFxcKi9nLCBcIi4qXCIpO1xuICAgIHJldHVybiBSZWdFeHAoYF4ke3N0YXJzUmVwbGFjZWR9JGApO1xuICB9XG4gIGVzY2FwZUZvclJlZ2V4KHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICB9XG59O1xudmFyIE1hdGNoUGF0dGVybiA9IF9NYXRjaFBhdHRlcm47XG5NYXRjaFBhdHRlcm4uUFJPVE9DT0xTID0gW1wiaHR0cFwiLCBcImh0dHBzXCIsIFwiZmlsZVwiLCBcImZ0cFwiLCBcInVyblwiXTtcbnZhciBJbnZhbGlkTWF0Y2hQYXR0ZXJuID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybiwgcmVhc29uKSB7XG4gICAgc3VwZXIoYEludmFsaWQgbWF0Y2ggcGF0dGVybiBcIiR7bWF0Y2hQYXR0ZXJufVwiOiAke3JlYXNvbn1gKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCkge1xuICBpZiAoIU1hdGNoUGF0dGVybi5QUk9UT0NPTFMuaW5jbHVkZXMocHJvdG9jb2wpICYmIHByb3RvY29sICE9PSBcIipcIilcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGAke3Byb3RvY29sfSBub3QgYSB2YWxpZCBwcm90b2NvbCAoJHtNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmpvaW4oXCIsIFwiKX0pYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpIHtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiOlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGBIb3N0bmFtZSBjYW5ub3QgaW5jbHVkZSBhIHBvcnRgKTtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiKlwiKSAmJiBob3N0bmFtZS5sZW5ndGggPiAxICYmICFob3N0bmFtZS5zdGFydHNXaXRoKFwiKi5cIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgSWYgdXNpbmcgYSB3aWxkY2FyZCAoKiksIGl0IG11c3QgZ28gYXQgdGhlIHN0YXJ0IG9mIHRoZSBob3N0bmFtZWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKSB7XG4gIHJldHVybjtcbn1cbmV4cG9ydCB7XG4gIEludmFsaWRNYXRjaFBhdHRlcm4sXG4gIE1hdGNoUGF0dGVyblxufTtcbiIsImV4cG9ydCBjb25zdCBicm93c2VyID0gKFxuICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gIGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWQgPT0gbnVsbCA/IGdsb2JhbFRoaXMuY2hyb21lIDogKFxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgKVxuKTtcbiIsImV4cG9ydCBkZWZhdWx0IGRlZmluZUJhY2tncm91bmQoKCkgPT4ge1xuICBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0KFwiTW9ub2ZpbHRlclwiKS50aGVuKChkYXRhKSA9PiB7XG4gICAgaWYgKCFkYXRhLk1vbm9maWx0ZXIpIHtcbiAgICAgIGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoe1xuICAgICAgICBNb25vZmlsdGVyOiB7XG4gICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgaW50ZW5zaXR5OiAxMDAsXG4gICAgICAgICAgYmxhY2tsaXN0OiBbXCJsb2NhbGhvc3RcIl0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGRhdGEuTW9ub2ZpbHRlci5lbmFibGVkKSB7XG4gICAgICBhcHBseUdyZXlzY2FsZVRvQWxsVGFicyhkYXRhLk1vbm9maWx0ZXIuaW50ZW5zaXR5ID8/IDEwMCk7XG4gICAgfVxuICB9KTtcblxuICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlKSA9PiB7XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJ0b2dnbGVHcmV5c2NhbGVcIikge1xuICAgICAgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChcIk1vbm9maWx0ZXJcIikudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50U2V0dGluZ3MgPSBkYXRhLk1vbm9maWx0ZXI7XG4gICAgICAgIGNvbnN0IGludGVuc2l0eSA9XG4gICAgICAgICAgbWVzc2FnZS5pbnRlbnNpdHkgPz8gY3VycmVudFNldHRpbmdzPy5pbnRlbnNpdHkgPz8gMTAwO1xuICAgICAgICBjb25zdCBibGFja2xpc3QgPSBjdXJyZW50U2V0dGluZ3M/LmJsYWNrbGlzdCA/PyBbXTtcblxuICAgICAgICBpZiAoY3VycmVudFNldHRpbmdzPy5lbmFibGVkKSB7XG4gICAgICAgICAgZGlzYWJsZUdyZXlzY2FsZUZvckFsbFRhYnMoKTtcbiAgICAgICAgICBicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0KHtcbiAgICAgICAgICAgIE1vbm9maWx0ZXI6IHtcbiAgICAgICAgICAgICAgLi4uY3VycmVudFNldHRpbmdzLFxuICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXBwbHlHcmV5c2NhbGVUb0FsbFRhYnMoaW50ZW5zaXR5KTtcbiAgICAgICAgICBicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0KHtcbiAgICAgICAgICAgIE1vbm9maWx0ZXI6IHtcbiAgICAgICAgICAgICAgLi4uY3VycmVudFNldHRpbmdzLFxuICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICBpbnRlbnNpdHksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobWVzc2FnZS50eXBlID09PSBcInNldEludGVuc2l0eVwiKSB7XG4gICAgICBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0KFwiTW9ub2ZpbHRlclwiKS50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTZXR0aW5ncyA9IGRhdGEuTW9ub2ZpbHRlcjtcbiAgICAgICAgY29uc3QgaW50ZW5zaXR5ID0gbWVzc2FnZS52YWx1ZTtcblxuICAgICAgICBicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0KHtcbiAgICAgICAgICBNb25vZmlsdGVyOiB7XG4gICAgICAgICAgICAuLi5jdXJyZW50U2V0dGluZ3MsXG4gICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgaW50ZW5zaXR5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICBhcHBseUdyZXlzY2FsZVRvQWxsVGFicyhpbnRlbnNpdHkpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwic2V0QmxhY2tsaXN0XCIpIHtcbiAgICAgIGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQoXCJNb25vZmlsdGVyXCIpLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudFNldHRpbmdzID0gZGF0YS5Nb25vZmlsdGVyO1xuICAgICAgICBjb25zdCBuZXdCbGFja2xpc3QgPSBtZXNzYWdlLnZhbHVlO1xuXG4gICAgICAgIGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoe1xuICAgICAgICAgIE1vbm9maWx0ZXI6IHtcbiAgICAgICAgICAgIC4uLmN1cnJlbnRTZXR0aW5ncyxcbiAgICAgICAgICAgIGJsYWNrbGlzdDogbmV3QmxhY2tsaXN0LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjdXJyZW50U2V0dGluZ3MuZW5hYmxlZCkge1xuICAgICAgICAgIGFwcGx5R3JleXNjYWxlVG9BbGxUYWJzKGN1cnJlbnRTZXR0aW5ncy5pbnRlbnNpdHkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGFwcGx5R3JleXNjYWxlVG9BbGxUYWJzKGludGVuc2l0eTogbnVtYmVyKSB7XG4gICAgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChcIk1vbm9maWx0ZXJcIikudGhlbigoZGF0YSkgPT4ge1xuICAgICAgY29uc3QgYmxhY2tsaXN0ID0gZGF0YS5Nb25vZmlsdGVyPy5ibGFja2xpc3QgPz8gW107XG5cbiAgICAgIGJyb3dzZXIudGFicy5xdWVyeSh7fSkudGhlbigodGFicykgPT4ge1xuICAgICAgICB0YWJzLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgIGlmICh0YWIuaWQgJiYgdGFiLnVybCkge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTCh0YWIudXJsKTtcbiAgICAgICAgICAgIGNvbnN0IGRvbWFpbiA9IHVybC5ob3N0bmFtZS5yZXBsYWNlKFwid3d3LlwiLCBcIlwiKTtcblxuICAgICAgICAgICAgaWYgKCFibGFja2xpc3QuaW5jbHVkZXMoZG9tYWluKSkge1xuICAgICAgICAgICAgICBicm93c2VyLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHsgdGFiSWQ6IHRhYi5pZCB9LFxuICAgICAgICAgICAgICAgIGZ1bmM6IChpbnRlbnNpdHk6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmZpbHRlciA9IGBncmF5c2NhbGUoJHtpbnRlbnNpdHl9JSlgO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXJnczogW2ludGVuc2l0eV0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRpc2FibGVHcmV5c2NhbGVGb3JBbGxUYWJzKCkge1xuICAgIGJyb3dzZXIudGFicy5xdWVyeSh7fSkudGhlbigodGFicykgPT4ge1xuICAgICAgdGFicy5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgaWYgKHRhYi5pZCkge1xuICAgICAgICAgIGJyb3dzZXIuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgdGFyZ2V0OiB7IHRhYklkOiB0YWIuaWQgfSxcbiAgICAgICAgICAgIGZ1bmM6ICgpID0+IHtcbiAgICAgICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmZpbHRlciA9IFwiXCI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufSk7XG4iXSwibmFtZXMiOlsiX2EiLCJpbnRlbnNpdHkiXSwibWFwcGluZ3MiOiI7OztBQUFPLFdBQVMsaUJBQWlCLEtBQUs7QUFDcEMsUUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLFdBQVksUUFBTyxFQUFFLE1BQU0sSUFBSztBQUNsRSxXQUFPO0FBQUEsRUFDVDtBQ0ZBLE1BQUksZ0JBQWdC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USxNQUFNLElBQUk7QUFBQSxZQUN4QixZQUFZO0FBQUEsY0FDVixHQUFHO0FBQUEsY0FDSCxXQUFXO0FBQUEsWUFBQTtBQUFBLFVBQ2IsQ0FDRDtBQUVELGNBQUksZ0JBQWdCLFNBQVM7QUFDM0Isb0NBQXdCLGdCQUFnQixTQUFTO0FBQUEsVUFBQTtBQUFBLFFBQ25ELENBQ0Q7QUFBQSxNQUFBO0FBQUEsSUFDSCxDQUNEO0FBRUQsYUFBUyx3QkFBd0IsV0FBbUI7QUFDbEQsY0FBUSxRQUFRLE1BQU0sSUFBSSxZQUFZLEVBQUUsS0FBSyxDQUFDLFNBQVM7O0FBQ3JELGNBQU0sY0FBWUEsTUFBQSxLQUFLLGVBQUwsZ0JBQUFBLElBQWlCLGNBQWEsQ0FBQztBQUVqRCxnQkFBUSxLQUFLLE1BQU0sQ0FBRSxDQUFBLEVBQUUsS0FBSyxDQUFDLFNBQVM7QUFDL0IsZUFBQSxRQUFRLENBQUMsUUFBUTtBQUNoQixnQkFBQSxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQ3JCLG9CQUFNLE1BQU0sSUFBSSxJQUFJLElBQUksR0FBRztBQUMzQixvQkFBTSxTQUFTLElBQUksU0FBUyxRQUFRLFFBQVEsRUFBRTtBQUU5QyxrQkFBSSxDQUFDLFVBQVUsU0FBUyxNQUFNLEdBQUc7QUFDL0Isd0JBQVEsVUFBVSxjQUFjO0FBQUEsa0JBQzlCLFFBQVEsRUFBRSxPQUFPLElBQUksR0FBRztBQUFBLGtCQUN4QixNQUFNLENBQUNDLGVBQXNCO0FBQzNCLDZCQUFTLGdCQUFnQixNQUFNLFNBQVMsYUFBYUEsVUFBUztBQUFBLGtCQUNoRTtBQUFBLGtCQUNBLE1BQU0sQ0FBQyxTQUFTO0FBQUEsZ0JBQUEsQ0FDakI7QUFBQSxjQUFBO0FBQUEsWUFDSDtBQUFBLFVBQ0YsQ0FDRDtBQUFBLFFBQUEsQ0FDRjtBQUFBLE1BQUEsQ0FDRjtBQUFBLElBQUE7QUFHSCxhQUFTLDZCQUE2QjtBQUNwQyxjQUFRLEtBQUssTUFBTSxDQUFFLENBQUEsRUFBRSxLQUFLLENBQUMsU0FBUztBQUMvQixhQUFBLFFBQVEsQ0FBQyxRQUFRO0FBQ3BCLGNBQUksSUFBSSxJQUFJO0FBQ1Ysb0JBQVEsVUFBVSxjQUFjO0FBQUEsY0FDOUIsUUFBUSxFQUFFLE9BQU8sSUFBSSxHQUFHO0FBQUEsY0FDeEIsTUFBTSxNQUFNO0FBQ0QseUJBQUEsZ0JBQWdCLE1BQU0sU0FBUztBQUFBLGNBQUE7QUFBQSxZQUMxQyxDQUNEO0FBQUEsVUFBQTtBQUFBLFFBQ0gsQ0FDRDtBQUFBLE1BQUEsQ0FDRjtBQUFBLElBQUE7QUFBQSxFQUVMLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMl19
