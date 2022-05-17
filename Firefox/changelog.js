function handleChangelog() {
	let changelogHeader = document.querySelector('#youtube-redux-header');
	let changelogVersion = document.querySelector('#version');
	let version = browser.runtime.getManifest().version;
	if (!changelogHeader) return;
	if (window.location.href.includes('#install')) {
		changelogHeader.innerText = 'YouTube Redux has been installed!';
	} else {
		changelogVersion.innerText = ` to v.${version}`;
	}
}

function addShowMore() {
	const updatesToDisplay = 3;
	let counter = 0;
	let changesContainer = document.querySelector('#changes ul');
	let showMoreButton = document.createElement('div');
	showMoreButton.classList.add('show-more');
	showMoreButton.innerText = 'Show more...';
	showMoreButton.addEventListener('click', function () {
		for (let i = 0; i < changesContainer.children.length; i++) {
			changesContainer.children[i].removeAttribute('hidden');
		}
		this.remove();
	});
	

	for (let i = 0; i < changesContainer.children.length; i++) {
		const currentElement = changesContainer.children[i];
		const showMoreElement = document.querySelector('.show-more');
		if (currentElement.classList && currentElement.classList.contains('update')) counter++;
		if (!showMoreElement && counter > updatesToDisplay) {
			changesContainer.insertBefore(showMoreButton, currentElement);
		}
		if (showMoreElement) {
			currentElement.setAttribute('hidden', '');
		}
	}
}

handleChangelog();
addShowMore();
