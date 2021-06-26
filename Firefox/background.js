function handleInstalled() {
	browser.tabs.create({
		url: "./changelog.html"
	});
}
  
browser.runtime.onInstalled.addListener(handleInstalled);