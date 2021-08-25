function handleChangelog() {
	let changelogHeader = document.querySelector('#youtube-redux-header');
	let changelogVersion = document.querySelector('#version');
	let version = chrome.runtime.getManifest().version;
	if (!changelogHeader) return;
	if (window.location.href.includes('#install')) {
		changelogHeader.innerText = 'YouTube Redux has been installed!';
	} else {
		changelogVersion.innerText = ` to v.${version}`;
	}
}

handleChangelog();