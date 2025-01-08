document.addEventListener("DOMContentLoaded", () => {
  const intensitySlider = document.getElementById("intensity");
  const intensityValue = document.getElementById("intensity-value");
  const blacklistInput = document.getElementById("blacklist");
  const applyButton = document.getElementById("apply-settings");

  // Update intensity value display
  intensitySlider.addEventListener("input", () => {
    intensityValue.textContent = `Intensity ${intensitySlider.value}%`;
  });

  // Apply settings when the button is clicked
  applyButton.addEventListener("click", async () => {
    const intensity = intensitySlider.value;
    const blacklist = blacklistInput.value.split(",").map((el) => el.trim());

    // Send settings to content script
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: applySettings,
      args: [intensity, blacklist],
    });
  });

  // Function to apply settings
  function applySettings(intensity, blacklist) {
    // Apply grayscale filter with intensity
    document.documentElement.style.filter = `grayscale(${intensity}%)`;

    // Remove filter from blacklisted elements
    blacklist.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.filter = "none";
      });
    });
  }
});
