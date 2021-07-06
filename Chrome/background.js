function handleInstalled(reason) {
	chrome.tabs.create({
		url: `./changelog.html#${reason}`
	});
}
  
chrome.runtime.onInstalled.addListener(reason => {
	handleInstalled(reason.reason);
});