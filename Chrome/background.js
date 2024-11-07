function handleInstalled(reason) {
	browser.storage.sync.set({ queueDisplayChangelog: false });
	browser.storage.sync.get(['reduxSettings'], function(result) {
		if (Object.keys(result).length > 0 && !result.reduxSettings.showChangelog) {
			return;
		} 
		else if (reason != "browser_update" && reason != "chrome_update") {
			browser.tabs.create({
				url: `./changelog.html#${reason}`
			});
		}
	});
}
  
let browser = chrome || browser;
browser.runtime.onInstalled.addListener(reason => {
	if (reason.reason === "install") {
		handleInstalled(reason.reason);
	} else {
		browser.storage.sync.set({ queueDisplayChangelog: true, updateReason: reason });
	}
});

browser.runtime.onMessage.addListener(request => {
	browser.storage.sync.get(['updateReason'], function(result) {
		if (Object.keys(result).length > 0 && request.message === "displayChangelog") {
			handleInstalled(result.updateReason.reason);
		}
	});
});