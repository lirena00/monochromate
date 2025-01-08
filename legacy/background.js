chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  console.log(tab.url);

  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === "OFF" ? "ON" : "OFF";
  await chrome.action.setBadgeText({
    text: nextState,
    tabId: tab.id,
  });
  await chrome.action.setTitle({
    title: "Turned ON",
    tabId: tab.id,
  });
  if (nextState === "ON") {
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["x.css"],
    });
  } else if (nextState === "OFF") {
    chrome.scripting.removeCSS({
      target: { tabId: tab.id },
      files: ["x.css"],
    });
  }
});
