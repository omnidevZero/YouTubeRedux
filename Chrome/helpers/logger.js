const extensionName = chrome.runtime.getManifest().name;
const logStyle = `background-image: linear-gradient(135deg, #e2e2e2 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,1) 100%); color: black; padding: 5px; border-radius: 5px;`;

const log = (input, isError) => {
	if (typeof input === "object") {
		console.log(`%c${extensionName}: ${typeof input}`, logStyle);
		isError? console.error(input) : console.log(input);
	} else {
		console.log(`%c${extensionName}: ${input}`, logStyle);
	}
};