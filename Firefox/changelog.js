function handleChangelog() {
	let changelogHeader = document.querySelector('#youtube-redux-header');
	if (!changelogHeader) return;
	if (window.location.href.includes('#install')) {
		changelogHeader.innerText = 'YouTube Redux has been installed!';
	}
}

handleChangelog();