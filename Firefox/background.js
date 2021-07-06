function handleInstalled(reason) {
	browser.tabs.create({
		url: `./changelog.html#${reason}`
	});
}
  
browser.runtime.onInstalled.addListener(reason => {
	handleInstalled(reason.reason);
});