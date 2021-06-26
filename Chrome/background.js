function handleInstalled() {
	chrome.tabs.create({
		url: "./changelog.html"
	});
}
  
chrome.runtime.onInstalled.addListener(handleInstalled);