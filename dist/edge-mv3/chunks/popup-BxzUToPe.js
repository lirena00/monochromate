(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
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
{
  try {
    const ws2 = getDevServerWebSocket();
    ws2.addWxtEventListener("wxt:reload-page", (event) => {
      if (event.detail === location.pathname.substring(1))
        location.reload();
    });
  } catch (err) {
    logger.error("Failed to setup web socket connection with dev server", err);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAtQnh6VVRvUGUuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC92aXJ0dWFsL3JlbG9hZC1odG1sLm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBwcmludChtZXRob2QsIC4uLmFyZ3MpIHtcbiAgaWYgKGltcG9ydC5tZXRhLmVudi5NT0RFID09PSBcInByb2R1Y3Rpb25cIilcbiAgICByZXR1cm47XG4gIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBhcmdzLnNoaWZ0KCk7XG4gICAgbWV0aG9kKGBbd3h0XSAke21lc3NhZ2V9YCwgLi4uYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG4gIH1cbn1cbmNvbnN0IGxvZ2dlciA9IHtcbiAgZGVidWc6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmRlYnVnLCAuLi5hcmdzKSxcbiAgbG9nOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5sb2csIC4uLmFyZ3MpLFxuICB3YXJuOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS53YXJuLCAuLi5hcmdzKSxcbiAgZXJyb3I6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmVycm9yLCAuLi5hcmdzKVxufTtcblxubGV0IHdzO1xuZnVuY3Rpb24gZ2V0RGV2U2VydmVyV2ViU29ja2V0KCkge1xuICBpZiAoaW1wb3J0Lm1ldGEuZW52LkNPTU1BTkQgIT09IFwic2VydmVcIilcbiAgICB0aHJvdyBFcnJvcihcbiAgICAgIFwiTXVzdCBiZSBydW5uaW5nIFdYVCBkZXYgY29tbWFuZCB0byBjb25uZWN0IHRvIGNhbGwgZ2V0RGV2U2VydmVyV2ViU29ja2V0KClcIlxuICAgICk7XG4gIGlmICh3cyA9PSBudWxsKSB7XG4gICAgY29uc3Qgc2VydmVyVXJsID0gYCR7X19ERVZfU0VSVkVSX1BST1RPQ09MX199Ly8ke19fREVWX1NFUlZFUl9IT1NUTkFNRV9ffToke19fREVWX1NFUlZFUl9QT1JUX199YDtcbiAgICBsb2dnZXIuZGVidWcoXCJDb25uZWN0aW5nIHRvIGRldiBzZXJ2ZXIgQFwiLCBzZXJ2ZXJVcmwpO1xuICAgIHdzID0gbmV3IFdlYlNvY2tldChzZXJ2ZXJVcmwsIFwidml0ZS1obXJcIik7XG4gICAgd3MuYWRkV3h0RXZlbnRMaXN0ZW5lciA9IHdzLmFkZEV2ZW50TGlzdGVuZXIuYmluZCh3cyk7XG4gICAgd3Muc2VuZEN1c3RvbSA9IChldmVudCwgcGF5bG9hZCkgPT4gd3M/LnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcImN1c3RvbVwiLCBldmVudCwgcGF5bG9hZCB9KSk7XG4gICAgd3MuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgKCkgPT4ge1xuICAgICAgbG9nZ2VyLmRlYnVnKFwiQ29ubmVjdGVkIHRvIGRldiBzZXJ2ZXJcIik7XG4gICAgfSk7XG4gICAgd3MuYWRkRXZlbnRMaXN0ZW5lcihcImNsb3NlXCIsICgpID0+IHtcbiAgICAgIGxvZ2dlci5kZWJ1ZyhcIkRpc2Nvbm5lY3RlZCBmcm9tIGRldiBzZXJ2ZXJcIik7XG4gICAgfSk7XG4gICAgd3MuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIChldmVudCkgPT4ge1xuICAgICAgbG9nZ2VyLmVycm9yKFwiRmFpbGVkIHRvIGNvbm5lY3QgdG8gZGV2IHNlcnZlclwiLCBldmVudCk7XG4gICAgfSk7XG4gICAgd3MuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgKGUpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKGUuZGF0YSk7XG4gICAgICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiY3VzdG9tXCIpIHtcbiAgICAgICAgICB3cz8uZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICAgIG5ldyBDdXN0b21FdmVudChtZXNzYWdlLmV2ZW50LCB7IGRldGFpbDogbWVzc2FnZS5kYXRhIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcihcIkZhaWxlZCB0byBoYW5kbGUgbWVzc2FnZVwiLCBlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybiB3cztcbn1cblxuaWYgKGltcG9ydC5tZXRhLmVudi5DT01NQU5EID09PSBcInNlcnZlXCIpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB3cyA9IGdldERldlNlcnZlcldlYlNvY2tldCgpO1xuICAgIHdzLmFkZFd4dEV2ZW50TGlzdGVuZXIoXCJ3eHQ6cmVsb2FkLXBhZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQuZGV0YWlsID09PSBsb2NhdGlvbi5wYXRobmFtZS5zdWJzdHJpbmcoMSkpXG4gICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2dnZXIuZXJyb3IoXCJGYWlsZWQgdG8gc2V0dXAgd2ViIHNvY2tldCBjb25uZWN0aW9uIHdpdGggZGV2IHNlcnZlclwiLCBlcnIpO1xuICB9XG59XG4iXSwibmFtZXMiOlsid3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxTQUFTLE1BQU0sV0FBVyxNQUFNO0FBRzlCLE1BQUksT0FBTyxLQUFLLENBQUMsTUFBTSxVQUFVO0FBQ3pCLFVBQUEsVUFBVSxLQUFLLE1BQU07QUFDM0IsV0FBTyxTQUFTLE9BQU8sSUFBSSxHQUFHLElBQUk7QUFBQSxFQUFBLE9BQzdCO0FBQ0UsV0FBQSxTQUFTLEdBQUcsSUFBSTtBQUFBLEVBQUE7QUFFM0I7QUFDQSxNQUFNLFNBQVM7QUFBQSxFQUNiLE9BQU8sSUFBSSxTQUFTLE1BQU0sUUFBUSxPQUFPLEdBQUcsSUFBSTtBQUFBLEVBQ2hELEtBQUssSUFBSSxTQUFTLE1BQU0sUUFBUSxLQUFLLEdBQUcsSUFBSTtBQUFBLEVBQzVDLE1BQU0sSUFBSSxTQUFTLE1BQU0sUUFBUSxNQUFNLEdBQUcsSUFBSTtBQUFBLEVBQzlDLE9BQU8sSUFBSSxTQUFTLE1BQU0sUUFBUSxPQUFPLEdBQUcsSUFBSTtBQUNsRDtBQUVBLElBQUk7QUFDSixTQUFTLHdCQUF3QjtBQUsvQixNQUFJLE1BQU0sTUFBTTtBQUNkLFVBQU0sWUFBWSxHQUFHLEtBQXVCLEtBQUssV0FBdUIsSUFBSSxHQUFtQjtBQUN4RixXQUFBLE1BQU0sOEJBQThCLFNBQVM7QUFDL0MsU0FBQSxJQUFJLFVBQVUsV0FBVyxVQUFVO0FBQ3hDLE9BQUcsc0JBQXNCLEdBQUcsaUJBQWlCLEtBQUssRUFBRTtBQUNwRCxPQUFHLGFBQWEsQ0FBQyxPQUFPLFlBQVkseUJBQUksS0FBSyxLQUFLLFVBQVUsRUFBRSxNQUFNLFVBQVUsT0FBTyxRQUFTLENBQUE7QUFDM0YsT0FBQSxpQkFBaUIsUUFBUSxNQUFNO0FBQ2hDLGFBQU8sTUFBTSx5QkFBeUI7QUFBQSxJQUFBLENBQ3ZDO0FBQ0UsT0FBQSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLGFBQU8sTUFBTSw4QkFBOEI7QUFBQSxJQUFBLENBQzVDO0FBQ0UsT0FBQSxpQkFBaUIsU0FBUyxDQUFDLFVBQVU7QUFDL0IsYUFBQSxNQUFNLG1DQUFtQyxLQUFLO0FBQUEsSUFBQSxDQUN0RDtBQUNFLE9BQUEsaUJBQWlCLFdBQVcsQ0FBQyxNQUFNO0FBQ2hDLFVBQUE7QUFDRixjQUFNLFVBQVUsS0FBSyxNQUFNLEVBQUUsSUFBSTtBQUM3QixZQUFBLFFBQVEsU0FBUyxVQUFVO0FBQ3pCLG1DQUFBO0FBQUEsWUFDRixJQUFJLFlBQVksUUFBUSxPQUFPLEVBQUUsUUFBUSxRQUFRLEtBQU0sQ0FBQTtBQUFBO0FBQUEsUUFDekQ7QUFBQSxlQUVLLEtBQUs7QUFDTCxlQUFBLE1BQU0sNEJBQTRCLEdBQUc7QUFBQSxNQUFBO0FBQUEsSUFDOUMsQ0FDRDtBQUFBLEVBQUE7QUFFSSxTQUFBO0FBQ1Q7QUFFeUM7QUFDbkMsTUFBQTtBQUNGLFVBQU1BLE1BQUssc0JBQXNCO0FBQ2pDQSxRQUFHLG9CQUFvQixtQkFBbUIsQ0FBQyxVQUFVO0FBQ25ELFVBQUksTUFBTSxXQUFXLFNBQVMsU0FBUyxVQUFVLENBQUM7QUFDaEQsaUJBQVMsT0FBTztBQUFBLElBQUEsQ0FDbkI7QUFBQSxXQUNNLEtBQUs7QUFDTCxXQUFBLE1BQU0seURBQXlELEdBQUc7QUFBQSxFQUFBO0FBRTdFOyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswXX0=
