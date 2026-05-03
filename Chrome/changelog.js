function handleChangelog() {
	let changelogHeader = document.querySelector('#youtube-redux-header');
	let changelogVersion = document.querySelector('#version');
	let version = chrome.runtime.getManifest().version;
	let extensionName = chrome.runtime.getManifest().name;
	if (!changelogHeader) return;
	if (window.location.href.includes('#install')) {
		changelogHeader.innerText = `${extensionName} has been installed!`;
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

chrome.storage.sync.get(['reduxSettings'], function(result) {
	if (result) {
		const settings = result.reduxSettings;
		const changelogToggle = document.querySelector('input[name="showChangelog"]');
		changelogToggle.checked = settings.showChangelog ? true : false;
		changelogToggle.addEventListener('change', function() {
			settings.showChangelog = this.checked;
			chrome.storage.sync.set({ reduxSettings: settings });
		});
	}
});

document.querySelector('.point-link').addEventListener('click', () => {
	document.querySelector('.pointer').style.display = 'block';
});