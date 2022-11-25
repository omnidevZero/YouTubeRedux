'use strict';
let flags = {
	"likesChanged":false,
	"stylesChanged":false,
	"isRearranged":false,
	"isRearrangedNew":false,
	"likesTracked":false,
	"recalcListenersAdded":false,
	"trueFullscreenListenersAdded":false,
	"homeObserverAdded": false
};
let alignRetry = {
	startCount: 0,
	maxCount: 5,
	timeout: 20
};
let YTReduxURLPath;
let YTReduxURLSearch;
let confirmInterval;
aspectRatio = (window.screen.width / window.screen.height).toFixed(2);
playerSize = {};
playerSize.width = reduxSettings.smallPlayerWidth == undefined ? 853 : reduxSettings.smallPlayerWidth;
playerSize.height = Math.ceil(playerSize.width / aspectRatio);
let observerComments;
let observerRelated;
let intervalsArray = [];
let isCheckingRecalc = false;

function confirmIt() {
	let confirmButton = document.querySelector('paper-dialog > yt-confirm-dialog-renderer > div:last-child > div > #confirm-button') || document.querySelector('ytd-popup-container  yt-confirm-dialog-renderer > #main > div.buttons > #confirm-button');
	if (!confirmButton) return;
	let buttonParent = confirmButton.closest('tp-yt-paper-dialog');
	let buttonParentVisible = buttonParent.style.display !== 'none';
	let buttonVisible = document.querySelector('ytd-popup-container tp-yt-paper-dialog:not([aria-hidden="true"])');
	let popupElement = document.querySelector('ytd-popup-container yt-confirm-dialog-renderer > #main > div.buttons > yt-button-renderer');
	let popupTypeCheck = popupElement == null ? false : popupElement.hasAttribute('hidden');
	if (confirmButton != null && !!buttonVisible && popupTypeCheck && buttonParentVisible) {
		confirmButton.click();
		document.querySelector('video').play();
		//log('Clicked at: ' + new Date());
	}
}

function changeGridWidth() {
	let styleItem;

	const changeGridAction = () => {
		if (flags.homeObserverAdded) {
			homeObserver.disconnect();
		}

		styleItem = document.querySelector('#primary > ytd-rich-grid-renderer');
		if (!styleItem) return;
		let currentStyle = styleItem.style.cssText;
		let currentStyleArray = currentStyle.split(";");
		
		for (let i = 0; i < currentStyleArray.length-1; i++) { //split, replace and join settings on the fly
			if (currentStyleArray[i].includes('--ytd-rich-grid-items-per-row')) {
				let splitElement = currentStyleArray[i].split(":");
				splitElement[1] = reduxSettings.gridItems + '!important'; //to override different important from css
				currentStyleArray[i] = splitElement.join(":");  
			}
		}
		styleItem.style.cssText = currentStyleArray.join(";");

		if (flags.homeObserverAdded) {
			homeObserver.observe(styleItem, {attributes: true, attributeFilter: ['style']});
		}
	};

	changeGridAction();

	if (pageLocation === PAGE_LOCATION.Home) {
		if (!flags.homeObserverAdded) {
			//observe since YT keeps restoring grid values on page navigation
			homeObserver = new MutationObserver(() => {
				changeGridAction();
			});
			homeObserver.observe(styleItem, {attributes: true, attributeFilter: ['style']});
			flags.homeObserverAdded = true;
		}
	}
}

function waitForElement(selector, interval, callback, timeout = 10 * 60 * 1000) {
	let wait = setInterval(() => {
		let element = document.querySelector(selector);

		if (element != null) {
			stopInterval(wait);
			callback();
		}
	}, interval);

	let stopInterval = (interval) => {
		clearInterval(interval);
		wait = undefined;
		let index = intervalsArray.indexOf(interval); //get index of and remove the previously added interval from array when it's cleared
		if (index !== -1) {
			intervalsArray.splice(index, 1);
		}
	};

	if (timeout) {
		setTimeout(() => {
			if (wait) {
				stopInterval(wait);
			}
		}, timeout);
	}

	intervalsArray.push(wait); //add current interval to array
}

function alignItems() {
	let playerElement = document.querySelector('#player-container-outer');
	let content = document.querySelector('#columns > #primary > #primary-inner');
	let videoInfoElement = document.querySelector('#columns > #primary > #primary-inner #info ytd-video-primary-info-renderer');
	let calcPadding = Math.ceil(playerElement.getBoundingClientRect().left - content.getBoundingClientRect().left);

	if (calcPadding == 0 || calcPadding >= 1000 || playerElement == null || content == null || videoInfoElement == null) {
		waitForElement('#columns > #primary > #primary-inner #info ytd-video-primary-info-renderer', 10, alignItems);
		return;
	} else if (!isTheater() && !isFullscreen()) {
		const reduxAlignElement = document.querySelector('#redux-style-align');
		const videoPlayer = document.querySelector('#player video');
		const calcInner = `
		#playlist > #container,
		ytd-playlist-panel-renderer#playlist {
			max-height: calc(${Math.ceil(videoPlayer.getBoundingClientRect().height)}px + 1px) !important;
		}
		#primary.ytd-watch-flexy > #primary-inner {
			padding-left: ${Math.max((calcPadding / window.innerWidth * 100).toFixed(3), 0)}vw !important;
		}
		#secondary.ytd-watch-flexy {
			margin-right: ${Math.max((calcPadding / window.innerWidth * 100).toFixed(3), 0)}vw !important;
		}
        `;

		if (!reduxAlignElement) {
			let customStyle = document.createElement("style");
			customStyle.id = 'redux-style-align';
			let customStyleInner = calcInner;
			customStyle.appendChild(document.createTextNode(customStyleInner));
			document.head.append(customStyle); 
		} else {
			reduxAlignElement.textContent = "";
			reduxAlignElement.appendChild(document.createTextNode(calcInner));
		}

		alignRetry.startCount++;
		if (alignRetry.startCount <= alignRetry.maxCount) {
			setTimeout(alignItems, alignRetry.timeout);
		} else {
			alignRetry.startCount = 0;
			return;
		}
	}
}

function changeLikesCounter() {
	let likesButton = document.querySelector('#info #segmented-like-button button');
	let observerConfig = {
		attributes: true
	};
	let observerLikes = new MutationObserver(fixLikes);
	observerLikes.observe(likesButton, observerConfig);

	fixLikes();
	flags.likesTracked = true;

	function fixLikes() {
		observerLikes.disconnect();

		let likesButton = document.querySelector('#info #segmented-like-button button');
		let likesText = document.querySelector('#info #segmented-like-button span');
		let rawLikes = likesButton.getAttribute('aria-label') ? likesButton.getAttribute('aria-label').match(/(?=\d).*(?<=\d)/g)[0] : '';

		if (!rawLikes) {
			let likeButton = document.querySelector('#info #segmented-like-button button');
			let buttonAria = likeButton.getAttribute('aria-label');
			let replacementText = /\d+/.test(buttonAria) ? formatNumber(buttonAria.replace(/[^\d]/g, '')) : buttonAria;
			likesText.innerText = replacementText;
		} else {
			likesText.innerText = rawLikes;
		}

		observerLikes.observe(likesButton, observerConfig);
	}
}

function isTheater() {
	if (document.querySelector('ytd-watch-flexy[theater]') != null) {
		return true;
	}
}

function isFullscreen() {
	if (document.querySelector('ytd-watch-flexy[fullscreen]') != null) {
		return true;
	}
}

function recalculateVideoSize() {

	function addListenersForRecalc() {
		let buttons = [
			document.querySelector('.ytp-size-button')
			//document.querySelector('.ytp-fullscreen-button')
		];

		for (let i = 0; i < buttons.length; i++) {
			buttons[i].addEventListener('click', function() {
				startRecalc();
				setTimeout(alignItems, 40); //TODO slow systems may struggle with this timeout when exiting fullscreen - properly detect mode change
			});
		}
		document.addEventListener("fullscreenchange", function() {
			startRecalc();
			setTimeout(alignItems, 40);
		});
		window.addEventListener('resize', () => {
			let repeatInsert = setInterval(() => { //insert in loop for X seconds to prevent YT from overriding
				let specialWidth = document.querySelector('video').offsetWidth;
				let specialHeight = document.querySelector('video').offsetHeight;
				insertRecalcScript(specialWidth, specialHeight);
			}, 500);
			setTimeout(() => {
				clearInterval(repeatInsert);
			}, 2000);
			alignItems();
		});
		flags.recalcListenersAdded = true;
	}

	function insertRecalcScript(width, height) {
		if (width == undefined) {width = playerSize.width;}
		if (height == undefined) {height = playerSize.height;}
		let existingRecalc = document.querySelector('#redux-recalc');
		if (existingRecalc) {existingRecalc.remove();}
		let script = document.createElement('script');
		script.id = 'redux-recalc';
		let scriptInner = `
            var player = document.querySelector('#movie_player');
            player.setInternalSize(${width},${height});
            `;
		script.appendChild(document.createTextNode(scriptInner));
		document.body.append(script);

		if (!isCheckingRecalc) {
			isCheckingRecalc = true;
			let checkLoop = setInterval(() => {
				checkIfProperlyRecalculated(width, height);
			}, 100);
    
			setTimeout(() => {
				clearInterval(checkLoop);
				isCheckingRecalc = false;
			}, 2000);

		}

		function checkIfProperlyRecalculated(width, height) {
			let videoPlayerElement = document.querySelector('ytd-watch-flexy .html5-video-container');
			let bottomBarElement = document.querySelector('.ytp-chrome-bottom');
			if (videoPlayerElement != null && bottomBarElement != null && (bottomBarElement.offsetWidth < videoPlayerElement.offsetWidth*0.9)) {
				insertRecalcScript(width, height);
			}
		}
	}

	function startRecalc() {
		let checkingTimeout;
		let retryTimeout = 2500; 
		let retryCount = 0;
		let retryInterval = 10;
		let checkingVideo = setInterval(() => { //check in loop for X seconds if player size is correct; reset checking if it's not; applied to fix initial page elements load
			let progressBar = document.querySelector('ytd-watch-flexy .ytp-chrome-bottom');
			let leftEdgeDistancePlayer = document.querySelector('#player-container-outer').getBoundingClientRect().x;
			let leftEdgeDistanceInfo = document.querySelector('#page-manager.ytd-app #primary-inner #info').getBoundingClientRect().x;
			let videoElement = document.querySelector('video');
			let widthCtrlElement = document.querySelector('#columns > #primary > #primary-inner #info');

			if ((widthCtrlElement.offsetWidth) < (playerSize.width-1)) { //condition for starting page in small window
				let specialWidth = document.querySelector('video').offsetWidth;
				let specialHeight = document.querySelector('video').offsetHeight;
				insertRecalcScript(specialWidth, specialHeight);
			}

			if (progressBar != null && (leftEdgeDistancePlayer > leftEdgeDistanceInfo+10 
				|| (progressBar.offsetWidth+24) <= videoElement.offsetWidth*0.95 
				|| (progressBar.offsetWidth+24) >= videoElement.offsetWidth*1.05) && !isTheater() && !isFullscreen()) { //TODO more precise condition
				insertRecalcScript();
				retryCount++;

				if ((retryCount*retryInterval) >= retryTimeout) {
					clearInterval(checkingVideo);
				}

				if (checkingTimeout != undefined) {
					clearTimeout(checkingTimeout);
					checkingTimeout = undefined;
				}
			} else {
				if (checkingTimeout == undefined) {
					checkingTimeout = setTimeout(() => {
						clearInterval(checkingVideo);
					}, retryTimeout);
				}
			}
		}, retryInterval);
	}
	if (!flags.recalcListenersAdded) {
		waitForElement('.ytp-size-button', 10, addListenersForRecalc);
	} //to recalculate player size when changing between normal, theater and fullscreen modes
	startRecalc();
}

function startObservingScrolling(mode) {
	let maxComments = 20;
	let commentsInterval = 20;
	let commentsContElement;
	let maxRelated;
	let relatedInterval = 20;
	let relatedElement;
	let related;
	let relatedContinuation;

	function disableInfiniteComments() {
		let comments = document.querySelectorAll('#contents > ytd-comment-thread-renderer');
		commentsContElement = document.querySelector('ytd-comments#comments ytd-item-section-renderer > #contents > ytd-comment-thread-renderer + ytd-continuation-item-renderer');
		if (comments.length >= maxComments && commentsContElement != null) {
			observerComments.disconnect();
			commentsContElement.remove();
			if (document.querySelector('#show-more-comments') == null) {
				addCommentsButton();
			}
		}
	}

	function disableInfiniteRelated() {
		setLayoutDifferences();
		if (related.length >= maxRelated && relatedContinuation != null) {
			observerRelated.disconnect();
			relatedContinuation.remove();
			if (document.querySelector('#show-more-related') == null) {
				addRelatedButton();
			}
		}
	}

	function addCommentsButton() {
		let showMoreComments = document.createElement('div');
		let continueElement = commentsContElement;
		let showMoreText = document.querySelector('.more-button.ytd-video-secondary-info-renderer') == null ? 'SHOW MORE' : document.querySelector('.more-button.ytd-video-secondary-info-renderer').textContent;
		showMoreComments.id = 'show-more-comments';
		showMoreComments.style = 'text-align:center; margin-bottom: 16px; margin-right: 15px;';
		showMoreComments.innerHTML = '<input type="button" style="font-family: Roboto, Arial, sans-serif; padding-top: 9px; width: 100%; border-top: 1px solid #e2e2e2; border-bottom: none; border-left: none; border-right: none; background:none; font-size: 1.1rem; outline: none; cursor:pointer; text-transform: uppercase; font-weight: 500; color: var(--redux-spec-text-secondary); letter-spacing: 0.007px; padding-bottom: 8px;"></input>';
		showMoreComments.querySelector('input').value = showMoreText;
		contentsElement.append(showMoreComments);
		document.querySelector('#show-more-comments').onclick = function() {
			let comments = document.querySelector('ytd-comments#comments ytd-item-section-renderer > #contents');
			comments.append(continueElement);
			window.scrollBy({top: 50, left: 0, behavior: "smooth"});
			this.remove();
			maxComments += commentsInterval;
			observerComments.observe(contentsElement, observerConfig);
		};
	}

	function addRelatedButton() {
		let showMoreRelated = document.createElement('div');
		let continueElement = relatedContinuation;
		let showMoreText = document.querySelector('.more-button.ytd-video-secondary-info-renderer') == null ? 'SHOW MORE' : document.querySelector('.more-button.ytd-video-secondary-info-renderer').textContent;
		showMoreRelated.id = 'show-more-related';
		showMoreRelated.style = 'text-align:center; margin-top: 4px; margin-right: 15px';
		showMoreRelated.innerHTML = '<input type="button" style="font-family: Roboto, Arial, sans-serif; padding-top: 9px; width: 100%; border-top: 1px solid #e2e2e2; border-bottom: none; border-left: none; border-right: none; background:none; font-size: 1.1rem; outline: none; cursor:pointer; text-transform: uppercase; font-weight: 500; color: var(--redux-spec-text-secondary); letter-spacing: 0.007px;"></input>';
		showMoreRelated.querySelector('input').value = showMoreText;
		relatedElement.append(showMoreRelated);
		document.querySelector('#show-more-related').onclick = function() {
			relatedElement.append(continueElement);
			window.scrollBy({top: 50, left: 0, behavior: "smooth"});
			this.remove();
			maxRelated += relatedInterval;
			observerRelated.observe(relatedElement, observerConfig);
		};
	}

	function setLayoutDifferences() {
		if (document.querySelector('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items').childElementCount <= 3) { //condition for differences in layout between YT languages
			relatedElement = document.querySelector('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-item-section-renderer > #contents');
			related = relatedElement.querySelectorAll('ytd-compact-video-renderer, ytd-compact-radio-renderer, ytd-compact-playlist-renderer'); //normal video + mix + playlist
			relatedContinuation = relatedElement.querySelector('ytd-continuation-item-renderer');
		} else {
			relatedElement = document.querySelector('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items');
			related = relatedElement.querySelectorAll('.ytd-watch-next-secondary-results-renderer');
			relatedContinuation = relatedElement.querySelector('ytd-continuation-item-renderer');
		}
	}

	const observerConfig = {
		childList: true
	};
	const contentsElement = document.querySelector('#comments > #sections > #contents.style-scope.ytd-item-section-renderer');

	if (mode === INFINITE_SCROLLING_MODE.Comments) {
		if (!!document.querySelector('#show-more-comments')) {document.querySelector('#show-more-comments').remove();}
		observerComments = new MutationObserver(disableInfiniteComments);
		observerComments.observe(contentsElement, observerConfig);

		const sortButtons = document.querySelectorAll('div[slot="dropdown-content"] > #menu > a');
		sortButtons.forEach(element => {
			element.onclick = resetCommentsObserver;
		});
	} else if (mode === INFINITE_SCROLLING_MODE.Related) {
		if (!!document.querySelector('#show-more-related')) {document.querySelector('#show-more-related').remove();}
		setLayoutDifferences();

		maxRelated = related.length >= 39 ? 20 : related.length; //to reset max on url change;
		if (related.length >= maxRelated && relatedContinuation != null) {
			relatedContinuation.remove();
			addRelatedButton();
		}
		observerRelated = new MutationObserver(disableInfiniteRelated);
		observerRelated.observe(relatedElement, observerConfig);
	}

	function resetCommentsObserver() {
		const comments = document.querySelectorAll('#contents > ytd-comment-thread-renderer');
		comments.forEach(element => {
			element.remove();
		});
		if (!!document.querySelector('#show-more-comments')) {document.querySelector('#show-more-comments').remove();}
		maxComments = 20;
		observerComments.observe(contentsElement, observerConfig);
	}
}

function rearrangeInfo() {
	let infoTop = document.querySelector('#top-row.ytd-video-secondary-info-renderer');
	let infoBar = document.querySelector('#info.ytd-video-primary-info-renderer');
	let infoContents = document.querySelector('#info-contents > ytd-video-primary-info-renderer');
	let miscButton = document.querySelector('#menu-container > #menu > ytd-menu-renderer > yt-icon-button:not([hidden])') 
	|| document.querySelector('#info-contents > ytd-video-primary-info-renderer > yt-icon-button.ytd-menu-renderer:not([hidden])')
	|| document.querySelector('#menu-container > #menu > ytd-menu-renderer > #button-shape');
	let dateElement = document.querySelector('#info-strings > yt-formatted-string');
	let dateOuter = document.querySelector('#info-text > #date');
	let descriptionElement = document.querySelector('#container > ytd-expander.ytd-video-secondary-info-renderer > #content');
	let views = document.querySelector('#info-text > #count');
	let likesContainer = document.querySelector('#info > #menu-container');
	let likesBar = document.querySelector('#info > #menu-container > ytd-sentiment-bar-renderer');
	let subButton = document.querySelector('ytd-video-secondary-info-renderer > #container > #top-row > #subscribe-button');
	let uploadInfo = document.querySelector('#top-row > ytd-video-owner-renderer > #upload-info');
	let channelName = document.querySelector('#top-row > ytd-video-owner-renderer > #upload-info > #channel-name');
	let subCount = document.querySelector('#top-row > ytd-video-owner-renderer > #upload-info > #owner-sub-count');
	let subscribeButton = document.querySelector('#meta #sponsor-button');
	let analyticsButton = document.querySelector('#meta #analytics-button');
	let reduxSubDiv = document.createElement('div');
	let videoTitle = document.querySelector('#info-contents div#container > h1');
	let primaryElement = document.querySelector('#columns > #primary > #primary-inner');
	reduxSubDiv.id = 'reduxSubDiv';
	dateElement.classList.add('redux-moved-date');

	infoBar.prepend(infoTop);

	if (miscButton) {
		miscButton.setAttribute('redux-last-top', '');
		infoContents.append(miscButton);
	} else {
		//condition for streams which have a different last button
		let topLevelElements = document.querySelectorAll('.ytd-video-primary-info-renderer > #top-level-buttons-computed > ytd-button-renderer');
		let lastTopLevelElement = topLevelElements[topLevelElements.length-1];
		lastTopLevelElement.setAttribute('redux-last-top-stream', '');
		lastTopLevelElement.classList.add('redux-moved-info');
		infoContents.append(lastTopLevelElement);

		let hiddenMiscButton = document.querySelector('#menu-container > #menu > ytd-menu-renderer > yt-icon-button[hidden]') || document.querySelector('#info-contents > ytd-video-primary-info-renderer > yt-icon-button.ytd-menu-renderer[hidden]');
		hiddenMiscButton.setAttribute('redux-last-top', '');
		infoContents.append(hiddenMiscButton);
	}

	moveTopLevelItems();
	descriptionElement.prepend(dateElement);
	if (dateOuter != null) {dateOuter.remove();}
	likesContainer.prepend(likesBar);
	likesContainer.prepend(views);
	uploadInfo.prepend(reduxSubDiv);
	reduxSubDiv.append(subButton);
	reduxSubDiv.append(subCount);
	reduxSubDiv.prepend(analyticsButton);
	reduxSubDiv.prepend(subscribeButton);
	uploadInfo.prepend(channelName);

	if (reduxSettings.altVideoLayout) {
		let reduxHeader = document.createElement('div');
		reduxHeader.id = 'redux-video-header';
		primaryElement.prepend(reduxHeader);

		if (!reduxSettings.extraLayout) {
			reduxHeader.style = 'background-color: transparent; box-shadow: none !important;';
		}

		reduxHeader.append(videoTitle);
		reduxHeader.append(infoTop);
	}

	flags.isRearranged = true;

	if (reduxSettings.rearrangeInfoNew && pageLocation === PAGE_LOCATION.Video && !flags.isRearrangedNew) {
		waitForElement('#primary-inner ytd-watch-metadata', 10, rearrangeInfoNew);
	}
}

function rearrangeInfoNew() {
	const newInfo = document.querySelector('#primary-inner ytd-watch-metadata');
	if (newInfo.hasAttribute('disable-upgrade') || newInfo.hasAttribute('hidden')) return;

	const oldInfo = document.querySelector('#primary-inner #info-contents[hidden]');
	const oldMeta = document.querySelector('#primary-inner #meta-contents[hidden]');
	
	if (newInfo && oldInfo && oldMeta) {
		newInfo.setAttribute('hidden', '');
		oldInfo.removeAttribute('hidden');
		oldMeta.removeAttribute('hidden');
	} else {
		// primary div
		const container = newInfo.querySelector('#above-the-fold');
		const topRow = newInfo.querySelector('#top-row');
		const owner = newInfo.querySelector('#owner');
		const uploadInfo = newInfo.querySelector('#upload-info');
		const reduxSubDiv = document.createElement('div');
		reduxSubDiv.id = 'reduxSubDiv';
		const subButton = newInfo.querySelector('#subscribe-button');
		const subCount = newInfo.querySelector('#owner-sub-count');
		const snippetText = newInfo.querySelector('#formatted-snippet-text');
		const views = snippetText.childNodes[0];
		const date = snippetText.childNodes[2];
		const description1 = snippetText.childNodes[4] || null;
		const description2 = snippetText.childNodes[5] || null;

		uploadInfo.append(reduxSubDiv);
		reduxSubDiv.append(subButton);
		reduxSubDiv.append(subCount);

		container.insertBefore(owner, topRow);
		// REMOVE COMMENT AFTER FULL ROLLOUT
		/*
		// video info div
		const videoInfo = document.createElement('div');
		videoInfo.id = 'redux-video-info';
		videoInfo.append(views);
		const likeBar = document.createElement('div');
		likeBar.innerHTML = `<div id="container" class="style-scope ytd-sentiment-bar-renderer redux-like-bar-container">
		<div id="like-bar" class="style-scope ytd-sentiment-bar-renderer redux-like-bar"></div>
		</div>`;
		videoInfo.append(likeBar);
		owner.append(videoInfo);

		// secondary div
		const secondaryReduxDiv = document.createElement('div');
		secondaryReduxDiv.id = 'secondary-redux-div';
		const primaryInner = document.querySelector('#primary-inner');
		primaryInner.insertBefore(secondaryReduxDiv, newInfo.nextElementSibling);

		secondaryReduxDiv.append(date, description1, description2);
		date.classList.add('redux-moved-date');
		*/
	}

	flags.isRearrangedNew = true;
}

function moveTopLevelItems() {
	let topLevelElements = document.querySelectorAll('.ytd-video-primary-info-renderer > #top-level-buttons-computed > *:not(ytd-toggle-button-renderer, ytd-segmented-like-dislike-button-renderer):not([is-hidden]), #info #flexible-item-buttons > *');
	let infoContents = document.querySelector('#info-contents > ytd-video-primary-info-renderer');
	let infoDiv = document.querySelector('#info-contents div#info');
	let miscButton = document.querySelector('#info-contents ytd-video-primary-info-renderer > yt-icon-button');
	let existingMovedItem = document.querySelector('[redux-last-top-stream]')
		|| document.querySelector('[redux-last-top]');

	if (reduxSettings.altVideoLayout) {
		document.querySelector('ytd-video-primary-info-renderer').style = 'padding-left: 15px !important; padding-top: 15px !important';
		if (miscButton != null) {
			infoDiv.prepend(miscButton);
			miscButton.style = 'transform: translateY(0px)';
		}

		for (let i = 0; i < topLevelElements.length; i++) {
			infoDiv.prepend(topLevelElements[i]);
			topLevelElements[i].classList.add('redux-moved-info');
			topLevelElements[i].setAttribute('redux-url-check', window.location.search);
		}
            
		if (reduxSettings.altVideoLayoutExtra) {
			let remainingTopLevel = document.querySelector('#info #top-level-buttons-computed');
			let likesValues = [
				document.querySelectorAll('ytd-toggle-button-renderer #text.ytd-toggle-button-renderer')[0].getAttribute('aria-label'),
				document.querySelectorAll('ytd-toggle-button-renderer #text.ytd-toggle-button-renderer')[1].getAttribute('aria-label')
			];
			let separator = ", ";
			if (likesValues[0] == null) {
				likesValues[0] = "";
				separator = "";
			}
			if (likesValues[1] == null) {
				likesValues[1] = "";
				separator = "";
			}
			let menu = document.querySelector('#menu.ytd-video-primary-info-renderer');
			let likesText = document.createTextNode(`${likesValues[0]}${separator}${likesValues[1]}`);

			document.querySelector('#info.ytd-video-primary-info-renderer > #menu-container').style = 'transform: translateY(0px) !important;';
			for (let i = 0; i < menu.childNodes.length; i++) { //remove existing text nodes
				if (menu.childNodes[i].nodeType == 3) {
					menu.childNodes[i].remove();
				}
			}

			menu.prepend(likesText);
			infoDiv.prepend(remainingTopLevel);
		}
            
	} else {
		for (let i = topLevelElements.length-1; i >= 0; i--) {
			infoContents.insertBefore(topLevelElements[i], existingMovedItem);
			topLevelElements[i].classList.add('redux-moved-info');
			topLevelElements[i].setAttribute('redux-url-check', window.location.search);
		}
	}
}

function clearMovedInfo() {
	let moveInfo = document.querySelectorAll('.redux-moved-info');
	moveInfo.forEach(element => element.remove());
	waitForElement('.ytd-video-primary-info-renderer > #top-level-buttons-computed > *:not(ytd-toggle-button-renderer, ytd-segmented-like-dislike-button-renderer):not([is-hidden])', 10, moveTopLevelItems);
}

function clearStoredIntervals() {
	intervalsArray.forEach(element => {
		clearInterval(element);
		intervalsArray.shift();
	});
}

function splitTrending() {
	let elems = document.querySelectorAll('ytd-two-column-browse-results-renderer:not([page-subtype="subscriptions"]) #contents > ytd-expanded-shelf-contents-renderer > #grid-container > ytd-video-renderer');
	if (elems.length == 0) { //repeat because it can be emptied when navigating through different pages
		setTimeout(() =>{splitTrending();}, 1000);
		return;
	}
	for (let i = 0; i < elems.length; i++) {
		if (i % 2 != 0) {elems[i].style.float = 'left';}
		elems[i].style.width = '50%';
		let description = elems[i].querySelector('yt-formatted-string#description-text');
		description.style.fontSize = '1.2rem';
		description.style.paddingTop = '4px';
		description.style.maxHeight = 'calc(2 * var(--yt-thumbnail-attribution-line-height, 3.5rem))';
	}
}

function splitTrendingLoop() {
	let splitLoop = setInterval(splitTrending, 100);
	setTimeout(() => {clearInterval(splitLoop);}, 5000);
}

function preventScrolling() {

	function scrollingAction(e) {
		e.preventDefault();
	}

	function keysAction(e) {
		if (e.keyCode == 33 || e.keyCode == 34) {
			e.preventDefault();
		}
	}

	document.addEventListener('fullscreenchange', function() {
		setTimeout(() => { //timeout accomodates for fullscreen transition animation
			if (document.querySelector('ytd-watch-flexy[fullscreen]') != null) {
				document.querySelector('.ytp-right-controls > button.ytp-fullerscreen-edu-button.ytp-button').style.display = 'none';
				document.addEventListener('wheel', scrollingAction, {passive: false});
				document.addEventListener('keydown', keysAction, {passive: false});
			} else {
				document.removeEventListener('wheel', scrollingAction, {passive: false});
				document.removeEventListener('keydown', keysAction, {passive: false});
			}
		}, 25);
	});

	flags.trueFullscreenListenersAdded = true;
}

function sortPlaylists() {
	if (!!document.querySelector('.redux-playlist')) return;
	const baseTimeout = 250;
	const playlistsSelector = reduxSettings.fixHomepage ? '[page-subtype="home"] #contents.ytd-rich-grid-renderer:not(.redux-playlist) > ytd-rich-item-renderer ytd-thumbnail-overlay-bottom-panel-renderer' : '[page-subtype="home"] #contents.ytd-rich-grid-renderer:not(.redux-playlist) > ytd-rich-grid-row ytd-thumbnail-overlay-bottom-panel-renderer';
	setTimeout(() => {
		let playlistItems = document.querySelectorAll(playlistsSelector);
		let itemsContainer = document.querySelector('[page-subtype="home"] #contents.ytd-rich-grid-renderer:not(.redux-playlist)');
		let allContainer = document.querySelector('ytd-rich-grid-renderer');
		let currentLength = playlistItems.length;
		if (currentLength == 0) return;
    
		let playlistReduxDiv = document.createElement('div');
		playlistReduxDiv.style = 'transition-duration: 0.5s; opacity:0';
		playlistReduxDiv.id = "contents";
		playlistReduxDiv.className += 'redux-playlist style-scope ytd-rich-grid-renderer';
		allContainer.insertBefore(playlistReduxDiv, itemsContainer);
		setTimeout(() => {playlistReduxDiv.style.opacity = '1';}, baseTimeout);
    
		for (let i = 0; i < playlistItems.length; i++) {
			let parentEl = playlistItems[i].closest('ytd-rich-item-renderer');
			parentEl.style = 'transition-duration:0.25s; opacity: 1;';
			setTimeout(() => {parentEl.style.opacity = '0';}, 0);
			setTimeout(() => {
				playlistReduxDiv.prepend(parentEl);
				parentEl.style.opacity = '1';
			}, baseTimeout);
		}

		function hidePlaylists() {
			let playlistItems = document.querySelectorAll(playlistsSelector);
			let movedItems = document.querySelector('.redux-playlist').children;
			let existingPlaylist = false;

			for (const playlist of playlistItems) { //check if playlist in main container exists in grouped container and then add or hide it
				const playlistId = playlist.closest('#thumbnail').href;
				for (const item of movedItems) {
					const movedItemId = item.querySelector('#thumbnail').href;
					if (movedItemId === playlistId) {
						existingPlaylist = true;
						playlist.closest('ytd-rich-item-renderer').style.display = 'none';
						break;
					}
				}
				if (!existingPlaylist) {
					playlistReduxDiv.append(playlist.closest('ytd-rich-item-renderer'));
				}
			}
		}
            
		if (reduxSettings.sortFoundPlaylists) {
			setTimeout(() => {
				let observerConfig = {
					childList: true
				};
				let observerPlaylistItems = new MutationObserver(hidePlaylists);
				observerPlaylistItems.observe(itemsContainer, observerConfig);
			}, baseTimeout*2);
		}
    
	}, baseTimeout);
}

function trimStrings() {
	trimSubs();

	let checkForChannelChange = setInterval(() => {
		let subString = document.querySelector('#reduxSubDiv > #owner-sub-count') || document.querySelector('#info #owner-sub-count');
		let channelElement = document.querySelector('#info ytd-video-owner-renderer > a[href]') || document.querySelector('#top-row ytd-video-owner-renderer > a[href]');
		if (subString.getAttribute('redux-sub-check') !== channelElement.href) {
			trimSubs();
			clearInterval(checkForChannelChange);
		}
	}, 50);

	setTimeout(() => {
		if (checkForChannelChange) {
			clearInterval(checkForChannelChange);
		}
	}, 10000);

	function trimSubs() {
		let subString = document.querySelector('#reduxSubDiv > #owner-sub-count') || document.querySelector('#info #owner-sub-count');
		let channelElement = document.querySelector('#info ytd-video-owner-renderer > a[href]') || document.querySelector('#top-row ytd-video-owner-renderer > a[href]');
		subString.setAttribute('redux-sub-check', channelElement.href);

		let existingSpan = document.querySelector('#redux-trim-span');
		if (subString.innerText === '') {
			if (existingSpan) existingSpan.remove();
			return;
		} else if (existingSpan) {
			existingSpan.innerText = subString.innerText.replace(/\s+\S*$/g, '');
			return;
		}

		let reduxTrimSpan = document.createElement('span');
		reduxTrimSpan.id = 'redux-trim-span';
		reduxTrimSpan.innerText = subString.innerText.replace(/\s+\S*$/g, '');
		reduxTrimSpan.classList.add('ytd-video-owner-renderer');

		let container = document.querySelector('#reduxSubDiv');
		container.insertBefore(reduxTrimSpan, subString);
	}
}

function trimViews() {
	let views = document.querySelector('span.view-count:not(#redux-view-count)');
	let reduxSpan = document.querySelector('#redux-view-count');
	if (reduxSpan) return;
	views.style.display = 'none';
	let container = document.querySelector('#count ytd-video-view-count-renderer');
	reduxSpan = document.createElement('span');
	reduxSpan.id = 'redux-view-count';
	reduxSpan.classList.add('view-count', 'style-scope', 'ytd-video-view-count-renderer');
	container.prepend(reduxSpan);

	const modifyViews = () => {
		let views = document.querySelector('span.view-count:not(#redux-view-count)');
		let reduxSpan = document.querySelector('#redux-view-count');
		reduxSpan.textContent = views.textContent.replace(/[^,.\d\s]/g,'').trim();
	};

	modifyViews();

	let viewsObserver = new MutationObserver(modifyViews);
	viewsObserver.observe(views, {characterData: true, subtree: true});
}

function alternativeStrings() {
	let saveButton = document.querySelector('ytd-watch-flexy #info-contents ytd-video-primary-info-renderer > ytd-button-renderer:first-of-type yt-formatted-string');
	saveButton.innerText = 'Add to';
}

function insertMyChannel() {
	let container = document.querySelector('#guide ytd-guide-section-renderer:first-child #items');
	let channelElement = document.querySelector('ytd-guide-entry-renderer a[href*="studio.youtube.com"]');

	if (document.querySelector('#redux-mychannel') || !channelElement) return;

	let myChannel = channelElement.href;
	let myChannelUrl = myChannel.substring(myChannel.indexOf('/channel/')+9, myChannel.length);
	let myChannelElement = document.createElement('div');
	myChannelElement.id = 'redux-mychannel';
	myChannelElement.classList.add('style-scope', 'ytd-guide-section-renderer');
	myChannelElement.setAttribute('is-primary', '');
	myChannelElement.setAttribute('line-end-style', 'none');
	myChannelElement.style = 'transition: 0.5s ease-out; max-height: 0; overflow: hidden;';
	myChannelElement.innerHTML = `
	<a id="endpoint" class="yt-simple-endpoint style-scope ytd-guide-entry-renderer" tabindex="-1" role="tablist" title="My channel" href="/channel/">
	<div style="padding: 0 24px; min-width:0; height: var(--paper-item-min-height, 48px); width: 100%; display: -ms-flexbox; display: -webkit-flex; display: flex; -ms-flex-direction: row; -webkit-flex-direction: row; flex-direction: row; -ms-flex-align: center; -webkit-align-items: center; align-items: center; font-family: var(--paper-font-subhead_-_font-family); -webkit-font-smoothing: var(--paper-font-subhead_-_-webkit-font-smoothing); font-size: var(--paper-font-subhead_-_font-size); font-weight: var(--paper-font-subhead_-_font-weight); line-height: var(--paper-font-subhead_-_line-height); white-space: var(--paper-item_-_white-space); font-size: var(--paper-item_-_font-size, var(--paper-font-subhead_-_font-size)); font-weight: var(--paper-item_-_font-weight, var(--paper-font-subhead_-_font-weight)); line-height: var(--paper-item_-_line-height, var(--paper-font-subhead_-_line-height)); letter-spacing: var(--paper-item_-_letter-spacing); font-family: var(--paper-item_-_font-family, var(--paper-font-subhead_-_font-family)); color: var(--paper-item_-_color); min-height: var(--paper-item-min-height, 48px);" role="tab" class="style-scope ytd-guide-entry-renderer" tabindex="0" aria-disabled="false" aria-selected="false">
		<icon style="height: 20px ; width: 20px; margin-right: 15px; fill: rgb(135, 135, 135);" class="guide-icon style-scope ytd-guide-entry-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block;"><g class="style-scope yt-icon"><path d="M12,2 C6.477,2 2,6.477 2,12 C2,17.523 6.477,22 12,22 C17.523,22 22,17.523 22,12 C22,6.477 17.523,2 12,2 L12,2 Z M12,5 C13.656,5 15,6.344 15,8 C15,9.658 13.656,11 12,11 C10.344,11 9,9.658 9,8 C9,6.344 10.344,5 12,5 L12,5 Z M12,19.2 C9.496,19.2 7.293,17.921 6.002,15.98 C6.028,13.993 10.006,12.9 12,12.9 C13.994,12.9 17.972,13.993 17.998,15.98 C16.707,17.921 14.504,19.2 12,19.2 L12,19.2 Z" class="style-scope yt-icon"></path></g></svg></icon>
		<img-shadow height="24" width="24" class="style-scope ytd-guide-entry-renderer" disable-upgrade="" hidden="">
		</img-shadow>
		<span id="redux-channel-text" class="title style-scope ytd-guide-entry-renderer">My channel</span>
		<span class="guide-entry-count style-scope ytd-guide-entry-renderer">
		</span>
		<icon class="guide-entry-badge style-scope ytd-guide-entry-renderer" disable-upgrade="">
		</icon>
		<div id="newness-dot" class="style-scope ytd-guide-entry-renderer"></div>
	</div>
	</a>
`;
	myChannelElement.querySelector('#endpoint').href = `/channel/${myChannelUrl}`;
	myChannelElement.querySelector('#redux-channel-text').innerText = reduxSettings.myChannelCustomText ? reduxSettings.myChannelCustomText : 'My channel';
	container.insertBefore(myChannelElement, container.children[0].nextSibling);
	setTimeout(() => {
		myChannelElement.style.maxHeight = '30px';
	},50);
}

function hideClip() {
	const clipButton = document.querySelector('#info path[d="M8,7c0,0.55-0.45,1-1,1S6,7.55,6,7c0-0.55,0.45-1,1-1S8,6.45,8,7z M7,16c-0.55,0-1,0.45-1,1c0,0.55,0.45,1,1,1s1-0.45,1-1 C8,16.45,7.55,16,7,16z M10.79,8.23L21,18.44V20h-3.27l-5.76-5.76l-1.27,1.27C10.89,15.97,11,16.47,11,17c0,2.21-1.79,4-4,4 c-2.21,0-4-1.79-4-4c0-2.21,1.79-4,4-4c0.42,0,0.81,0.08,1.19,0.2l1.37-1.37l-1.11-1.11C8,10.89,7.51,11,7,11c-2.21,0-4-1.79-4-4 c0-2.21,1.79-4,4-4c2.21,0,4,1.79,4,4C11,7.43,10.91,7.84,10.79,8.23z M10.08,8.94L9.65,8.5l0.19-0.58C9.95,7.58,10,7.28,10,7 c0-1.65-1.35-3-3-3S4,5.35,4,7c0,1.65,1.35,3,3,3c0.36,0,0.73-0.07,1.09-0.21L8.7,9.55l0.46,0.46l1.11,1.11l0.71,0.71l-0.71,0.71 L8.9,13.91l-0.43,0.43l-0.58-0.18C7.55,14.05,7.27,14,7,14c-1.65,0-3,1.35-3,3c0,1.65,1.35,3,3,3s3-1.35,3-3 c0-0.38-0.07-0.75-0.22-1.12l-0.25-0.61L10,14.8l1.27-1.27l0.71-0.71l0.71,0.71L18.15,19H20v-0.15L10.08,8.94z M17.73,4H21v1.56 l-5.52,5.52l-2.41-2.41L17.73,4z M18.15,5l-3.67,3.67l1,1L20,5.15V5H18.15z"]');

	if (clipButton) {
		clipButton.closest('ytd-button-renderer').style.display = 'none';
	}
}

function hideThanks() {
	const thanksButton = document.querySelector('#info path[d="M16.5,3C19.02,3,21,5.19,21,7.99c0,3.7-3.28,6.94-8.25,11.86L12,20.59l-0.74-0.73l-0.04-0.04C6.27,14.92,3,11.69,3,7.99 C3,5.19,4.98,3,7.5,3c1.4,0,2.79,0.71,3.71,1.89L12,5.9l0.79-1.01C13.71,3.71,15.1,3,16.5,3 M16.5,2c-1.74,0-3.41,0.88-4.5,2.28 C10.91,2.88,9.24,2,7.5,2C4.42,2,2,4.64,2,7.99c0,4.12,3.4,7.48,8.55,12.58L12,22l1.45-1.44C18.6,15.47,22,12.11,22,7.99 C22,4.64,19.58,2,16.5,2L16.5,2z M11.33,10.86c0.2,0.14,0.53,0.26,1,0.36c0.47,0.1,0.86,0.22,1.18,0.35 c0.99,0.4,1.49,1.09,1.49,2.07c0,0.7-0.28,1.27-0.83,1.71c-0.33,0.26-0.73,0.43-1.17,0.54V17h-2v-1.16 c-0.18-0.05-0.37-0.1-0.53-0.19c-0.46-0.23-0.92-0.55-1.18-0.95C9.15,14.48,9.06,14.24,9,14h2c0.05,0.09,0.07,0.18,0.15,0.25 c0.23,0.19,0.54,0.29,0.92,0.29c0.36,0,0.63-0.07,0.82-0.22s0.28-0.35,0.28-0.59c0-0.25-0.11-0.45-0.34-0.6s-0.59-0.27-1.1-0.39 c-1.67-0.39-2.51-1.16-2.51-2.34c0-0.68,0.26-1.26,0.78-1.71c0.28-0.25,0.62-0.43,1-0.54V7h2v1.12c0.46,0.11,0.85,0.29,1.18,0.57 C14.59,9.05,14.9,9.48,15,10h-2c-0.04-0.09-0.1-0.17-0.16-0.24c-0.17-0.19-0.44-0.29-0.81-0.29c-0.32,0-0.56,0.08-0.74,0.24 c-0.17,0.16-0.26,0.36-0.26,0.6C11.03,10.53,11.13,10.72,11.33,10.86z"]');

	if (thanksButton) {
		thanksButton.closest('ytd-button-renderer').style.display = 'none';
	}
}

function autoplayInveral() {
	let autoInterval = setInterval(addOldAutoplay, 10);
	setTimeout(() => {
		clearInterval(autoInterval);
	}, 10000);
}

function addOldAutoplay() {
	const reduxAutoplay = document.querySelector('#redux-autoplay');

	if (getRelatedVideosType() != relatedVideosType) {
		setRelatedVideosType();
		if (reduxAutoplay) {
			reduxAutoplay.remove();
		}
	}

	if (window.location.href.includes('&list') || reduxAutoplay || !document.querySelector('[class="ytp-button"][data-tooltip-target-id="ytp-autonav-toggle-button"]')) return;

	const relatedContainer = document.querySelector('#secondary-inner.ytd-watch-flexy #related #items ytd-item-section-renderer #contents') || document.querySelector('#secondary-inner.ytd-watch-flexy #related #items');
	const relatedContainerParent = relatedContainer.parentElement;
	const originalAutoplay = document.querySelector('[class="ytp-button"][data-tooltip-target-id="ytp-autonav-toggle-button"]');
	const upNext = document.querySelector('.ytp-autonav-endscreen-upnext-header');
	const autoplayElement = document.createElement('div');
	autoplayElement.id = 'redux-autoplay';
	autoplayElement.style = 'display: flex; justify-content: space-between; padding-right: 24px; padding-bottom: 2px;';
	autoplayElement.innerHTML = `
	<div class="redux-auto-left">
		<span id="redux-autoplay-upnext"></span>
	</div>
	<div class="redux-auto-right">
		<span id="redux-autoplay-label"></span>
		<span class="redux-autoplay-checkbox-toggle">
			<input id="redux-autoplay-checkbox" type="checkbox">
			<label for="redux-autoplay-checkbox" id="redux-autoplay-checkbox-label">
				<span class="checked"></span>
				<span class="toggle"></span>
				<span class="unchecked"></span>
			</label>  
		</span>
	</div>
	`;

	if (upNext) autoplayElement.querySelector('#redux-autoplay-upnext').innerText = upNext.innerText;	
	autoplayElement.querySelector('#redux-autoplay-label').innerText = originalAutoplay.getAttribute('aria-label');

	if (originalAutoplay.querySelector('div[aria-checked]').getAttribute('aria-checked') === 'true') {
		autoplayElement.querySelector('#redux-autoplay-checkbox').checked = true;
	}
	
	relatedContainerParent.insertBefore(autoplayElement, relatedContainer);
	
	autoplayElement.querySelector('span.redux-autoplay-checkbox-toggle').addEventListener('click', () => {
		originalAutoplay.click();
		setTimeout(() => {
			document.querySelector('#redux-autoplay-label').innerText = originalAutoplay.getAttribute('aria-label');
		}, 50);
	});
}

function removeMiniplayer() {
	document.querySelector('.ytp-miniplayer-ui .ytp-miniplayer-close-button').click();
}

function expandPlaylists() {
	let expander = document.querySelector('#section-items > ytd-guide-collapsible-entry-renderer #expander-item');
	expander.click();
}

function expandSubs() {
	let expander = document.querySelector('#items > ytd-guide-collapsible-entry-renderer #expander-item');
	expander.click();
}

function fixHome() {
	if (!!document.querySelector('.redux-home-container')) return;
	let itemIds = [];
	let contents = document.querySelector('[page-subtype="home"] #contents.ytd-rich-grid-renderer:not(.redux-playlist):not(.redux-home-container)');
	let contentsParent = document.querySelector('ytd-rich-grid-renderer');
	let homeReduxDiv = document.createElement('div');
	homeReduxDiv.style = 'transition-duration: 0.5s; opacity:0';
	homeReduxDiv.id = "contents";
	homeReduxDiv.className += 'redux-home-container style-scope ytd-rich-grid-renderer';
	contentsParent.insertBefore(homeReduxDiv, contents);

	setTimeout(() => {
		addNewItems();
		homeReduxDiv.style.opacity = '1';
	}, 250);

	let observerConfig = {
		childList: true,
		subtree: true
	};
	let observerGridItems = new MutationObserver(addNewItems);
	observerGridItems.observe(contents, observerConfig);

	function addNewItems() {
		if (!!document.querySelector('.redux-home-spinner')) document.querySelector('.redux-home-spinner').remove();
		let rowItems = document.querySelectorAll('[page-subtype="home"] #contents.ytd-rich-grid-renderer:not(.redux-playlist):not(.redux-home-container) > ytd-rich-grid-row ytd-rich-item-renderer');
		for (const item of rowItems) {
			let currentId = item.querySelector('a#thumbnail') ? item.querySelector('a#thumbnail').href : 'MISSING';
			if (!itemIds.includes(currentId)) {
				itemIds.push(currentId);
				homeReduxDiv.append(item);
			} else {
				item.style.display = 'none';
			}
		}
		addSpinner();
	}

	function addSpinner() {
		let spinner = document.createElement('ytd-continuation-item-renderer');
		spinner.innerHTML = '<div id="spinnerContainer" class="active  style-scope tp-yt-paper-spinner"><div class="spinner-layer layer-1 style-scope tp-yt-paper-spinner"><div class="circle-clipper left style-scope tp-yt-paper-spinner"><div class="circle style-scope tp-yt-paper-spinner"></div></div><div class="circle-clipper right style-scope tp-yt-paper-spinner"><div class="circle style-scope tp-yt-paper-spinner"></div></div></div><div class="spinner-layer layer-2 style-scope tp-yt-paper-spinner"><div class="circle-clipper left style-scope tp-yt-paper-spinner"><div class="circle style-scope tp-yt-paper-spinner"></div></div><div class="circle-clipper right style-scope tp-yt-paper-spinner"><div class="circle style-scope tp-yt-paper-spinner"></div></div></div><div class="spinner-layer layer-3 style-scope tp-yt-paper-spinner"><div class="circle-clipper left style-scope tp-yt-paper-spinner"><div class="circle style-scope tp-yt-paper-spinner"></div></div><div class="circle-clipper right style-scope tp-yt-paper-spinner"><div class="circle style-scope tp-yt-paper-spinner"></div></div></div><div class="spinner-layer layer-4 style-scope tp-yt-paper-spinner"><div class="circle-clipper left style-scope tp-yt-paper-spinner"><div class="circle style-scope tp-yt-paper-spinner"></div></div><div class="circle-clipper right style-scope tp-yt-paper-spinner"><div class="circle style-scope tp-yt-paper-spinner"></div></div></div></div>';
		spinner.style.width = '100%';
		spinner.classList.add('style-scope', 'ytd-rich-grid-renderer', 'redux-home-spinner');
		homeReduxDiv.append(spinner);
	}
}

function formatNumber(number) {
	let likes = document.querySelector('ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:first-child > a > yt-formatted-string');
	let views = document.querySelector('#count.ytd-video-primary-info-renderer');
	let separator = ' ';

	if (views.innerText.includes('.') || likes.innerText.includes('.')) {
		separator = '.';
	} else if (views.innerText.includes(',') || likes.innerText.includes(',')) {
		separator = ',';
	}

	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function updateDislikes() {
	let dislikesSource = document.querySelector('.ryd-tooltip #tooltip') || document.querySelector('ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:nth-child(2) > a > yt-formatted-string');
	let observerConfig = {
		childList: true
	};
	let observerLikes = new MutationObserver(update);
	observerLikes.observe(dislikesSource, observerConfig);

	update();
	if (reduxSettings.showRawValues) {
		let checkIfChanged = setInterval(() => {
			let dislikes = document.querySelector('ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:nth-child(2) > a > yt-formatted-string');
			let dislikesCount = dislikesSource.innerText.match(/(?<=\/).*/) ? dislikesSource.innerText.match(/(?<=\/).*/)[0].trim() : dislikesSource.innerText;
			if (dislikes && dislikes.innerText.match(/^[\d+]/)) {
				dislikes.innerText = formatNumber(dislikesCount.replace(/[,.\s]/g, ''));
			}
		}, 20);
		setTimeout(() => {
			if (checkIfChanged) {
				clearInterval(checkIfChanged);
			}
		}, 5000);
	}

	function update() {
		let likes = document.querySelector('ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:first-child > a > yt-formatted-string');
		if (!likes.getAttribute('aria-label')) return;
		let likesCount = parseInt(likes.getAttribute('aria-label').replace(/[,.\s]/g, '').replace(/[^\d]+$/g, ''));
		let dislikesCount = dislikesSource.innerText.match(/(?<=\/).*/) ? dislikesSource.innerText.match(/(?<=\/).*/)[0].trim() : dislikesSource.innerText;
		dislikesCount = dislikesCount.replace(/[,.\s]/g, '');
		updateLikesBar(likesCount, dislikesCount);
	}
}

function updateLikesBar(likesCount, dislikesCount) {
	let likeBar = document.querySelector('#like-bar.ytd-sentiment-bar-renderer');
	let likes = parseInt(likesCount);
	let dislikes = parseInt(parseFloat(dislikesCount.toString().replace(/\s+/g, '')).toFixed(0));
	likeBar.style.width = (likes / (likes + dislikes)) * 100 + '%';
}

function hideShortsInSearch() {
	const searchContents = document.querySelector('#contents.ytd-section-list-renderer');
	const observer = new MutationObserver(hideRows);
	const observerOptions = {
		childList: true,
		subtree: true
	};
	observer.observe(searchContents, observerOptions);
	hideRows();

	function hideRows() {
		const shorts = document.querySelectorAll('#thumbnail[href*="/shorts/"]');
		for (const short of shorts) {
			const parentRow = short.closest('ytd-video-renderer');
			if (parentRow) parentRow.style.display = 'none';
		}
	}
}

function redirectShorts() {
	const currentLocation = window.location.href;
	const redirectLocation = currentLocation.replace('/shorts/', '/watch?v=');
	window.location.href = redirectLocation;
}

function addClearHomepageEvent(selector, clearPlaylists) {
	const elements = document.querySelectorAll(selector);
	for (const element of elements) {
		element.addEventListener('click', () => {
			const reduxHomeContainerItems = document.querySelectorAll('.redux-home-container > ytd-rich-item-renderer');
			const reduxPlaylistContainerItems = document.querySelectorAll('.redux-playlist > ytd-rich-item-renderer');
			const containerItems = clearPlaylists ? [...reduxHomeContainerItems, ...reduxPlaylistContainerItems] : reduxHomeContainerItems;
			for (const item of containerItems) {
				item.style.opacity = '0';
			}
			setTimeout(() => {			
				for (const item of containerItems) {
					item.remove();
				}
			}, 1000);
		});
	}
}

function adjustAmbient() {
	if (cinematicsObserver) return;
	let cinematics = document.querySelector('#cinematics');
	const initialProperty = document.querySelector('html').style.getPropertyValue('--redux-spec-general-background-a') || "#181818";

	cinematicsObserver = new MutationObserver(() => {
		cinematics = document.querySelector('#cinematics');

		if (cinematics.hasChildNodes()) {
			document.querySelector('html[dark]').style.setProperty('--redux-spec-general-background-a', 'transparent');
		} else {
			document.querySelector('html[dark]').style.setProperty('--redux-spec-general-background-a', initialProperty);
		}
	});
	cinematicsObserver.observe(cinematics, { childList: true });
}

function main() {
	if (reduxSettings.autoConfirm) {
		if (confirmInterval == undefined) {
			confirmInterval = setInterval(confirmIt, 500);
			setInterval(() => {
				let keyboardEvent = document.createEvent('KeyboardEvent');
				let initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? 'initKeyboardEvent' : 'initKeyEvent';

				keyboardEvent[initMethod](
					'keydown', // event type: keydown, keyup, keypress
					true, // bubbles
					true, // cancelable
					window, // view: should be window
					false, // ctrlKey
					false, // altKey
					false, // shiftKey
					false, // metaKey
					113, // keyCode: unsigned long - the virtual key code, else 0
					0, // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
				);
				document.dispatchEvent(keyboardEvent);
			}, 60000*10);
		}
	}
	if (reduxSettings.rearrangeInfoRe && pageLocation === PAGE_LOCATION.Video && !flags.isRearranged) {
		waitForElement('.ytd-video-primary-info-renderer > #top-level-buttons-computed > ytd-button-renderer', 10, rearrangeInfo);
	}
	if (reduxSettings.rearrangeInfoNew && pageLocation === PAGE_LOCATION.Video && !flags.isRearrangedNew) {
		waitForElement('#primary-inner ytd-watch-metadata', 10, rearrangeInfoNew);
	}
	if (reduxSettings.smallPlayer && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('ytd-watch-flexy #movie_player', 10, recalculateVideoSize);
		waitForElement('#redux-recalc', 10, alignItems);
	}
	if (reduxSettings.disableInfiniteScrolling && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#contents > ytd-comment-thread-renderer, #contents > ytd-message-renderer', 10, () => { startObservingScrolling(INFINITE_SCROLLING_MODE.Comments); }); // additional element in selector for videos with disabled comments
	}
	if (reduxSettings.disableInfiniteScrolling && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items ytd-continuation-item-renderer', 10, () => { startObservingScrolling(INFINITE_SCROLLING_MODE.Related); });
	}
	if (reduxSettings.showRawValues && pageLocation === PAGE_LOCATION.Video && !flags.likesTracked) {
		waitForElement('#info #segmented-like-button button[aria-label]:not([aria-label=""])', 10, changeLikesCounter);
	}
	if (reduxSettings.compatibleDislikesRe && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('.ryd-tooltip #tooltip', 10, updateDislikes);
	}
	if (pageLocation === PAGE_LOCATION.Trending || pageLocation === PAGE_LOCATION.Explore) {
		waitForElement('#page-manager ytd-browse #primary > ytd-section-list-renderer > #continuations', 10, splitTrendingLoop);
	}
	if (reduxSettings.trueFullscreen && pageLocation === PAGE_LOCATION.Video && !flags.trueFullscreenListenersAdded) {
		preventScrolling();
	}
	if (reduxSettings.playlistsFirst && pageLocation === PAGE_LOCATION.Home) {
		waitForElement('#page-manager ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer ytd-thumbnail-overlay-bottom-panel-renderer', 10, sortPlaylists);
	}
	if (reduxSettings.trimSubs && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#reduxSubDiv > #owner-sub-count', 10, trimStrings);
	}
	if (reduxSettings.trimViews && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('span.view-count', 10, trimViews);
	}
	if (reduxSettings.altStrings && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('ytd-watch-flexy #info-contents ytd-video-primary-info-renderer > ytd-button-renderer:first-of-type yt-formatted-string', 10, alternativeStrings);
	}
	if (reduxSettings.myChannel) {
		waitForElement('#guide ytd-guide-section-renderer:first-child #items', 100, insertMyChannel);
	}
	if (reduxSettings.hideClip && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#info path[d="M8,7c0,0.55-0.45,1-1,1S6,7.55,6,7c0-0.55,0.45-1,1-1S8,6.45,8,7z M7,16c-0.55,0-1,0.45-1,1c0,0.55,0.45,1,1,1s1-0.45,1-1 C8,16.45,7.55,16,7,16z M10.79,8.23L21,18.44V20h-3.27l-5.76-5.76l-1.27,1.27C10.89,15.97,11,16.47,11,17c0,2.21-1.79,4-4,4 c-2.21,0-4-1.79-4-4c0-2.21,1.79-4,4-4c0.42,0,0.81,0.08,1.19,0.2l1.37-1.37l-1.11-1.11C8,10.89,7.51,11,7,11c-2.21,0-4-1.79-4-4 c0-2.21,1.79-4,4-4c2.21,0,4,1.79,4,4C11,7.43,10.91,7.84,10.79,8.23z M10.08,8.94L9.65,8.5l0.19-0.58C9.95,7.58,10,7.28,10,7 c0-1.65-1.35-3-3-3S4,5.35,4,7c0,1.65,1.35,3,3,3c0.36,0,0.73-0.07,1.09-0.21L8.7,9.55l0.46,0.46l1.11,1.11l0.71,0.71l-0.71,0.71 L8.9,13.91l-0.43,0.43l-0.58-0.18C7.55,14.05,7.27,14,7,14c-1.65,0-3,1.35-3,3c0,1.65,1.35,3,3,3s3-1.35,3-3 c0-0.38-0.07-0.75-0.22-1.12l-0.25-0.61L10,14.8l1.27-1.27l0.71-0.71l0.71,0.71L18.15,19H20v-0.15L10.08,8.94z M17.73,4H21v1.56 l-5.52,5.52l-2.41-2.41L17.73,4z M18.15,5l-3.67,3.67l1,1L20,5.15V5H18.15z"]', 100, hideClip);
	}
	if (reduxSettings.hideThanks && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#info path[d="M16.5,3C19.02,3,21,5.19,21,7.99c0,3.7-3.28,6.94-8.25,11.86L12,20.59l-0.74-0.73l-0.04-0.04C6.27,14.92,3,11.69,3,7.99 C3,5.19,4.98,3,7.5,3c1.4,0,2.79,0.71,3.71,1.89L12,5.9l0.79-1.01C13.71,3.71,15.1,3,16.5,3 M16.5,2c-1.74,0-3.41,0.88-4.5,2.28 C10.91,2.88,9.24,2,7.5,2C4.42,2,2,4.64,2,7.99c0,4.12,3.4,7.48,8.55,12.58L12,22l1.45-1.44C18.6,15.47,22,12.11,22,7.99 C22,4.64,19.58,2,16.5,2L16.5,2z M11.33,10.86c0.2,0.14,0.53,0.26,1,0.36c0.47,0.1,0.86,0.22,1.18,0.35 c0.99,0.4,1.49,1.09,1.49,2.07c0,0.7-0.28,1.27-0.83,1.71c-0.33,0.26-0.73,0.43-1.17,0.54V17h-2v-1.16 c-0.18-0.05-0.37-0.1-0.53-0.19c-0.46-0.23-0.92-0.55-1.18-0.95C9.15,14.48,9.06,14.24,9,14h2c0.05,0.09,0.07,0.18,0.15,0.25 c0.23,0.19,0.54,0.29,0.92,0.29c0.36,0,0.63-0.07,0.82-0.22s0.28-0.35,0.28-0.59c0-0.25-0.11-0.45-0.34-0.6s-0.59-0.27-1.1-0.39 c-1.67-0.39-2.51-1.16-2.51-2.34c0-0.68,0.26-1.26,0.78-1.71c0.28-0.25,0.62-0.43,1-0.54V7h2v1.12c0.46,0.11,0.85,0.29,1.18,0.57 C14.59,9.05,14.9,9.48,15,10h-2c-0.04-0.09-0.1-0.17-0.16-0.24c-0.17-0.19-0.44-0.29-0.81-0.29c-0.32,0-0.56,0.08-0.74,0.24 c-0.17,0.16-0.26,0.36-0.26,0.6C11.03,10.53,11.13,10.72,11.33,10.86z"]', 100, hideThanks);
	}
	if (reduxSettings.moveAutoplay && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#secondary-inner.ytd-watch-flexy #related #items ytd-item-section-renderer #contents ytd-compact-video-renderer, #secondary-inner.ytd-watch-flexy #related #items ytd-compact-video-renderer', 10, autoplayInveral);
	}
	if (reduxSettings.disableMiniplayer && pageLocation === PAGE_LOCATION.Home) {
		waitForElement('.ytp-miniplayer-ui .ytp-miniplayer-close-button', 10, removeMiniplayer);
	}
	if (reduxSettings.autoExpandPlaylists) {
		waitForElement('#section-items > ytd-guide-collapsible-entry-renderer #expander-item', 10, expandPlaylists);
	}
	if (reduxSettings.autoExpandSubs) {
		waitForElement('#items > ytd-guide-collapsible-entry-renderer #expander-item', 10, expandSubs);
	}
	if (reduxSettings.fixHomepage && pageLocation === PAGE_LOCATION.Home) {
		waitForElement('ytd-rich-grid-row', 10, fixHome);
	}
	if (reduxSettings.hideShorts && pageLocation === PAGE_LOCATION.SearchResults) {
		waitForElement('#contents.ytd-section-list-renderer', 10, hideShortsInSearch);
	}
	if (reduxSettings.redirectShorts && pageLocation === PAGE_LOCATION.Shorts) {
		redirectShorts();
	}
	if (reduxSettings.gridItems != defaultSettings.gridItems && pageLocation === PAGE_LOCATION.Home) {
		waitForElement('#primary > ytd-rich-grid-renderer', 10, changeGridWidth);
	}
	if (!reduxSettings.ignoreAmbientAdjustment && getTheme() === THEME.Dark && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#cinematics', 10, adjustAmbient);
	}
}

(() => {
	setPageLocation();

	try {
		main();
	} catch (error) {
		log(error, true);
	}
	
	if (reduxSettings.fixHomepage) {
		const logoSelector = 'ytd-topbar-logo-renderer#logo';
		waitForElement(logoSelector, 10, () => {
			addClearHomepageEvent(logoSelector);
		});

		if (pageLocation === PAGE_LOCATION.Home) {
			const filtersSelector = '[page-subtype="home"] #chips yt-chip-cloud-chip-renderer';
			waitForElement(filtersSelector, 10, () => {
				addClearHomepageEvent(filtersSelector, true);
			}, 30000);
		}
	}

	YTReduxURLPath = location.pathname;
	YTReduxURLSearch = location.search;

	setInterval(function() {
		if (location.pathname != YTReduxURLPath || location.search != YTReduxURLSearch) {
			setPageLocation();
			YTReduxURLPath = location.pathname;
			YTReduxURLSearch = location.search;
			flags.likesChanged = false;

			if (reduxSettings.disableInfiniteScrolling) {
				if (observerComments != undefined) {
					observerComments.disconnect();
				}
				if (observerRelated != undefined) {
					observerRelated.disconnect();
				}
				let comments = document.querySelectorAll('#contents > ytd-comment-thread-renderer');
				comments.forEach(element => { //remove comments because YT sometimes keeps old ones after url change which messes with comments observer checking their length; also applied when sorting
					element.remove();
				});
			}

			clearStoredIntervals();

			if (!!document.querySelector('.redux-moved-info') 
			&& pageLocation === PAGE_LOCATION.Video
			&& document.querySelector('.redux-moved-info').getAttribute('redux-url-check') != window.location.search) {
				clearMovedInfo(); //contains an interval
			}

			try {
				main();
			} catch (error) {
				log(error, true);
			}
		}
	}, 100);
})();