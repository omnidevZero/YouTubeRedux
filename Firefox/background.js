function handleInstalled(reason) {
	browser.storage.sync.get(['reduxSettings'], function(result) {
		if (Object.keys(result).length > 0 && !result.reduxSettings.showChangelog) {
			return;
		} else {
			chrome.tabs.create({
				url: `./changelog.html#${reason}`
			});
		}
	});
}

browser.runtime.onInstalled.addListener(reason => {
	handleInstalled(reason.reason);
});