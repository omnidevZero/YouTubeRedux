function handleConfig() {
	const configData = new URLSearchParams(window.location.search).get('data');

	if (configData) {
		document.querySelector('#export-button-clipboard textarea').value = atob(configData);
	}

	//export to file
	const exportToFile = document.querySelector('#export-button-file');
	exportToFile.addEventListener('click', () => {
		browser.permissions.request({ permissions: ['downloads'] }, function(granted) {
			if (granted) {
				browser.downloads.download({
					url: URL.createObjectURL(new Blob([atob(configData)], { type: "application/json" })),
					filename: `YouTube_Redux_config_${new Date().toISOString().replaceAll(":", "-")}.json`,
					saveAs: true
				});
			} else {
				showAlert("Permission denied. File couldn't be saved. Use 'export to clipboard' and store the config manually");
			}
		});
	});

	//export to clipboard
	const exportToClipboard = document.querySelector('#export-button-clipboard .copy-paste-btn');
	exportToClipboard.addEventListener('click', function() {
		const copyData = document.querySelector('#export-button-clipboard textarea').value;
		navigator.clipboard.writeText(copyData);
		showAlert('Copied config to clipboard');
	});
	
	//import from file
	const importElement = document.querySelector('#import-button-file');
	importElement.addEventListener('click', function() {
		this.querySelector('input').click();
		this.querySelector('input').addEventListener('change', async(e) => {
			const file = e.target.files[0];
			const fileContent = await file.text();

			storage.set({reduxSettings: JSON.parse(fileContent)});
			document.querySelector('#export-button-clipboard textarea').value = fileContent;
			showAlert('Config successfully imported from file');
		});
	});

	//import from clipboard
	const importFromClipboard = document.querySelector('#import-button-clipboard .copy-paste-btn');
	importFromClipboard.addEventListener('click', () => {
		const pastedData = document.querySelector('#import-button-clipboard textarea').value;

		storage.set({reduxSettings: JSON.parse(pastedData)});
		showAlert('Config successfully imported from clipboard');
	});
}

function showAlert(text) {
	const existingAlert = document.querySelector('#alert');
	
	if (existingAlert) {
		existingAlert.remove();
	}

	const alert = document.createElement('div');
	alert.id = 'alert';
	alert.innerText = text;
	document.body.append(alert);
	alert.classList.add('show-alert');

	setTimeout(() => {
		alert.classList.remove('show-alert');
	}, 5000);
}

handleConfig();