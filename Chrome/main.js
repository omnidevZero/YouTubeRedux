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

function delay(ms) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}

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

function waitForElement(selector, interval, callback, timeout = 1 * 60 * 1000) {
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
				log(`Did not find ${selector} after ${timeout}ms (${callback.name})`);
			}
		}, timeout);
	}

	intervalsArray.push(wait); //add current interval to array
}

function alignItems() {
	let playerElement = document.querySelector('#player-container-outer');
	let content = document.querySelector('#columns > #primary > #primary-inner');
	let videoInfoElement = document.querySelector('#columns > #primary > #primary-inner #info ytd-video-primary-info-renderer');
	let flexPadding = 16;
	let calcPadding = Math.floor(playerElement.getBoundingClientRect().left - flexPadding);

	if (calcPadding <= 0 || calcPadding >= 1000 || playerElement == null || content == null || videoInfoElement == null) {
		waitForElement('#columns > #primary > #primary-inner #info ytd-video-primary-info-renderer', 10, alignItems);
		return;
	} else if (!isTheater() && !isFullscreen()) {
		const reduxAlignElement = document.querySelector('#redux-style-align');
		const videoPlayer = document.querySelector('#player video');
		const calcInner = `
		#playlist > #container,
		ytd-playlist-panel-renderer#playlist {
			max-height: ${videoPlayer.getBoundingClientRect().height}px !important;
		}
		#columns.ytd-watch-flexy {
			margin: 0 ${calcPadding}px !important;
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
	const fixLikes = () => {
		let likesButton = document.querySelector('#above-the-fold #segmented-like-button button, #above-the-fold like-button-view-model button');
		if (likesButton) {
			let likesText = likesButton.querySelector('.ytSpecButtonShapeNextButtonTextContent');
			let rawLikes = likesButton.getAttribute('aria-label')?.match(/(?=\d).*(?<=\d)/g) ? likesButton.getAttribute('aria-label').match(/(?=\d).*(?<=\d)/g)[0] : '';
	
			if (likesButton && rawLikes) {
				likesText.innerText = rawLikes;
			}
		}
	};

	fixLikes();

	const loop = setInterval(() => {
		fixLikes();
	}, 20);

	setTimeout(() => {
		if (loop != undefined) {
			clearInterval(loop);
		}
	}, 10000);
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
			setTimeout(alignItems, 40);
		});
		flags.recalcListenersAdded = true;
	}

	function insertRecalcScript(width, height) {
		if (width == undefined) {width = playerSize.width;}
		if (height == undefined) {height = playerSize.height;}
		let existingRecalc = document.querySelector('#redux-recalc');
		if (existingRecalc) {existingRecalc.remove();}
		document.body.setAttribute('redux-player-width', width);
		document.body.setAttribute('redux-player-height', height);
		let script = document.createElement('script');
		script.id = 'redux-recalc';
		script.src = browser.runtime.getURL('/helpers/resize.js');
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
			let bottomBarElement = document.querySelector('#movie_player:not(.ytp-delhi-modern) .ytp-chrome-bottom');
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
			let progressBar = document.querySelector('ytd-watch-flexy #movie_player:not(.ytp-delhi-modern) .ytp-chrome-bottom');
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
	const moreButtonSeletor = '#description tp-yt-paper-button#expand';

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
		let showMoreText = document.querySelector(moreButtonSeletor) == null ? 'SHOW MORE' : document.querySelector(moreButtonSeletor).textContent;
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
		let showMoreText = document.querySelector(moreButtonSeletor) == null ? 'SHOW MORE' : document.querySelector(moreButtonSeletor).textContent;
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
			related = relatedElement.querySelectorAll('yt-lockup-view-model');
			relatedContinuation = relatedElement.querySelector('ytd-continuation-item-renderer');
		} else {
			relatedElement = document.querySelector('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items');
			related = relatedElement.querySelectorAll('yt-lockup-view-model');
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
	const videoInfo = document.querySelector('#primary-inner ytd-watch-metadata');
	// primary div
	const container = videoInfo.querySelector('#above-the-fold');
	const topRow = videoInfo.querySelector('#top-row');
	const owner = videoInfo.querySelector('#owner');
	const uploadInfo = videoInfo.querySelector('#upload-info');
	const reduxSubDiv = document.createElement('div');
	reduxSubDiv.id = 'reduxSubDiv';
	const subButton = videoInfo.querySelector('#subscribe-button');
	const subCount = videoInfo.querySelector('#owner-sub-count');
	const viewsAndDate = videoInfo.querySelector('#description tp-yt-paper-tooltip:not([disable-upgrade]) > #tooltip');
	const views = viewsAndDate.innerText.split('•')[0];
	const date = viewsAndDate.innerText.split('•')[1];
	const description = videoInfo.querySelector("#description");
	const miscButton = videoInfo.querySelector('#above-the-fold #button-shape');
	const miscButtonTargetContainer = videoInfo.querySelector('#above-the-fold #top-level-buttons-computed');

	uploadInfo.append(reduxSubDiv);
	reduxSubDiv.append(subButton);
	reduxSubDiv.append(subCount);

	// move owner info between title and top row buttons
	container.insertBefore(owner, topRow);

	// video stats div
	const reduxViewsLikesContainer = document.createElement('div');
	reduxViewsLikesContainer.id = 'redux-video-stats';

	const reduxViewsCount = document.createElement('div');
	reduxViewsCount.id = 'redux-views-count';
	reduxViewsCount.innerText = views.trim();
	reduxViewsCount.setAttribute('redux-url-check', window.location.search);

	reduxViewsLikesContainer.append(reduxViewsCount);
	const likeBar = document.createElement('div');
	likeBar.innerHTML = `<div id="container" class="style-scope ytd-sentiment-bar-renderer redux-like-bar-container">
	<div id="like-bar" class="style-scope ytd-sentiment-bar-renderer redux-like-bar"></div>
	</div>`;
	reduxViewsLikesContainer.append(likeBar);
	owner.append(reduxViewsLikesContainer);

	// secondary div with description
	const reduxMovedDate = document.createElement('div');
	reduxMovedDate.id = 'redux-moved-date';
	reduxMovedDate.innerText = date;
	description.prepend(reduxMovedDate);
	description.setAttribute('redux-url-check', window.location.search);
	const secondaryReduxDiv = document.createElement('div');
	secondaryReduxDiv.id = 'secondary-redux-div';

	// if (reduxSettings.altVideoLayout) {
	// 	const videoTitle = document.querySelector('#above-the-fold #title');
	// 	let reduxHeader = document.createElement('div');
	// 	reduxHeader.id = 'redux-video-header';
	// 	primaryElement.prepend(reduxHeader);

	// 	if (!reduxSettings.extraLayout) {
	// 		reduxHeader.style = 'background-color: transparent; box-shadow: none !important;';
	// 	}

	// 	reduxHeader.append(videoTitle);
	// 	reduxHeader.append(videoInfo);
	// }

	flags.isRearranged = true;
}

function addMissingVideoPageElements() {
	//move to description observer instead of interval
	const loop = setInterval(() => {
		const viewsAndDate = document.querySelector('#description tp-yt-paper-tooltip:not([disable-upgrade]) > #tooltip');
		const views = viewsAndDate.innerText.split('•')[0];
		const date = viewsAndDate.innerText.split('•')[1];
		const reduxViewsLikesContainer = document.querySelector('#redux-video-stats');
		const reduxViewsCount = document.querySelector("#redux-views-count");
		reduxViewsCount.setAttribute('redux-url-check', window.location.search);
		reduxViewsCount.innerText = views.trim();

		const existingMovedDate = document.querySelector('#redux-moved-date');
		if (existingMovedDate && existingMovedDate.innerText != date) {
			existingMovedDate.innerText = date;
		}

		const existingLikesBar = document.querySelector('.redux-like-bar');
		if (!existingLikesBar) {
			const likeBar = document.createElement('div');
			likeBar.innerHTML = `<div id="container" class="style-scope ytd-sentiment-bar-renderer redux-like-bar-container">
			<div id="like-bar" class="style-scope ytd-sentiment-bar-renderer redux-like-bar"></div>
			</div>`;
			reduxViewsLikesContainer.append(likeBar);

			if (reduxSettings.compatibleDislikesRe) {
				updateDislikes(); //move outside the inverval/observer to avoid spamming calls?
			}
		}
	}, 100);

	setTimeout(() => {
		if (loop != undefined) {
			clearInterval(loop);
		}
	}, 10000);
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
			if (isFullscreen()) {
				document.querySelector('.ytp-right-controls > button.ytp-fullerscreen-edu-button.ytp-button').style.display = 'none';
				document.querySelector('.ytp-chapter-container').style.pointerEvents = 'none';
				document.addEventListener('wheel', scrollingAction, {passive: false});
				document.addEventListener('keydown', keysAction, {passive: false});
			} else {
				document.querySelector('.ytp-chapter-container').style.pointerEvents = null;
				document.removeEventListener('wheel', scrollingAction, {passive: false});
				document.removeEventListener('keydown', keysAction, {passive: false});
			}
		}, 25);
	});

	flags.trueFullscreenListenersAdded = true;
}

function sortPlaylists() {
	const baseTimeout = 250;
	const playlistsSelector = '[page-subtype="home"] ytd-two-column-browse-results-renderer #content .ytLockupViewModelCollectionStack2';

	setTimeout(() => {
		let playlistItems = document.querySelectorAll(playlistsSelector);
		let itemsContainer = document.querySelector('[page-subtype="home"] #contents.ytd-rich-grid-renderer:not(.redux-playlist)');
		let currentLength = playlistItems.length;
		if (currentLength == 0) return;
    
		for (let i = 0; i < playlistItems.length; i++) {
			let parentEl = playlistItems[i].closest('ytd-rich-item-renderer');

			setTimeout(() => {
				parentEl.style = 'transition-duration:0.25s; opacity: 0;';
				parentEl.classList.add('redux-reordered-playlist-item');
			}, 0);

			setTimeout(() => {
				parentEl.style.order = `-${i+1}`;
			}, baseTimeout);

			setTimeout(() => {
				parentEl.style.opacity = '1';
			}, baseTimeout*2);
		}

		function reorderNewPlaylistItems() {
			const alreadyReorderedItems = document.querySelectorAll('.redux-reordered-playlist-item');
			const playlistItems = document.querySelectorAll(playlistsSelector);

			for (let i = alreadyReorderedItems.length; i < playlistItems.length; i++) {
				let parentEl = playlistItems[i].closest('ytd-rich-item-renderer');

				setTimeout(() => {
					parentEl.style.order = `-${i+1}`;
					parentEl.classList.add('redux-reordered-playlist-item');
				}, baseTimeout);
			}
		}
            
		if (reduxSettings.sortFoundPlaylists) {
			setTimeout(() => {
				let observerConfig = {
					childList: true
				};
				let observerPlaylistItems = new MutationObserver(reorderNewPlaylistItems);
				observerPlaylistItems.observe(itemsContainer, observerConfig);
			}, baseTimeout*2);
		}
    
	}, baseTimeout);
}

function trimStrings() {
	trimSubs();

	let checkForChannelChange = setInterval(() => {
		let subString = document.querySelector('#reduxSubDiv > #owner-sub-count') || document.querySelector('#info #owner-sub-count');
		let channelElement = document.querySelector('#upload-info a[href]');
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
		let channelElement = document.querySelector('#upload-info a[href]');
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
		reduxTrimSpan.classList.add('style-scope', 'ytd-video-owner-renderer');

		let container = document.querySelector('#reduxSubDiv');
		container.insertBefore(reduxTrimSpan, subString);
	}
}

function trimViews() {
	let views = document.querySelector('#redux-views-count') || document.querySelector('span.view-count:not(#redux-views-count-trimmed)');
	let reduxViewsTrimmed = document.querySelector('#redux-views-count-trimmed');
	if (reduxViewsTrimmed) return;
	views.style.display = 'none';
	let container = document.querySelector('#redux-video-stats') || document.querySelector('#count ytd-video-view-count-renderer');
	reduxViewsTrimmed = document.createElement('span');
	reduxViewsTrimmed.id = 'redux-views-count-trimmed';
	reduxViewsTrimmed.classList.add('view-count', 'style-scope', 'ytd-video-view-count-renderer');
	container.prepend(reduxViewsTrimmed);

	const modifyViews = () => {
		let views = document.querySelector('#redux-views-count') || document.querySelector('span.view-count:not(#redux-views-count-trimmed)');
		let reduxViewsTrimmed = document.querySelector('#redux-views-count-trimmed');
		reduxViewsTrimmed.textContent = views.textContent.replace(/[^,.\d\s]/g,'').trim();
	};

	modifyViews();

	let viewsObserver = new MutationObserver(modifyViews);
	viewsObserver.observe(views, {attributes: true});
}

function alternativeStrings() {
	let saveButton = document.querySelector('#above-the-fold #flexible-item-buttons button .ytSpecButtonShapeNextButtonTextContent');
	saveButton.innerText = 'Add to';
}

function hideThanks() {
	const thanksButton = document.querySelector('#above-the-fold path[d="M16.25 2A6.7 6.7 0 0012 3.509 6.75 6.75 0 001 8.75c0 4.497 2.784 7.818 5.207 9.87a23.498 23.498 0 004.839 3.143l.096.044.03.013.01.005.003.002.002.001c.273-.609.544-1.218.813-1.828 0 0-9-4-9-11.25a4.75 4.75 0 018.932-2.247A1 1 0 0011 7.5v.638c-.357.1-.689.26-.979.49A2.35 2.35 0 009.13 10.5c-.007.424.112.84.342 1.197.21.31.497.563.831.734.546.29 1.23.411 1.693.502.557.109.899.19 1.117.315.086.048.109.082.114.09.004.006.028.045.028.162 0 .024-.008.118-.165.235-.162.122-.5.27-1.09.27-.721 0-1.049-.21-1.181-.323a.6.6 0 01-.142-.168l.005.013.006.014.002.009a.996.996 0 00-1.884.64l.947-.316-.003.001c-.875.292-.939.314-.943.317l.001.003.003.006.004.015.012.032c.045.111.1.218.162.321.146.236.324.444.535.624.357.306.841.566 1.476.702v.605a1 1 0 002 0v-.614c1.29-.289 2.245-1.144 2.245-2.386 0-.44-.103-.852-.327-1.212-.22-.355-.52-.6-.82-.77-.555-.316-1.244-.445-1.719-.539-.567-.111-.915-.185-1.143-.305a.5.5 0 01-.1-.07l-.004-.003-.003-.009a.4.4 0 01-.009-.092c0-.158.053-.244.14-.314.109-.086.341-.19.74-.19.373-.001.73.144.997.404a.996.996 0 001.518-1.286l-.699.58.698-.582v-.001l-.002-.001-.002-.003-.006-.006-.016-.018a2.984 2.984 0 00-.178-.182A3.45 3.45 0 0013 8.154V7.5a1 1 0 00-.933-.997A4.75 4.75 0 0121 8.75C21 16 12 20 12 20l.813 1.827.002-.001.003-.001.01-.005.029-.013.097-.045c.081-.037.191-.09.33-.16a23.5 23.5 0 004.509-2.982C20.216 16.568 23 13.248 23 8.75A6.75 6.75 0 0016.25 2Zm-3.437 19.827L12 20l-.813 1.828.813.36.813-.361Z"]');

	if (thanksButton) {
		thanksButton.closest('button-view-model').style.display = 'none';
	}
}

function moveAutoplay() {
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

	if (window.location.href.includes('&list') || reduxAutoplay || !document.querySelector('[data-tooltip-target-id="ytp-autonav-toggle-button"]')) return;

	const relatedContainer = document.querySelector('#secondary-inner.ytd-watch-flexy #related #items ytd-item-section-renderer #contents') || document.querySelector('#secondary-inner.ytd-watch-flexy #related #items');
	const relatedContainerParent = relatedContainer.parentElement;
	const originalAutoplay = document.querySelector('[data-tooltip-target-id="ytp-autonav-toggle-button"]');
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

	// disabled due to YT no longer exposing next autoplayed item in the related column
	// if (upNext) autoplayElement.querySelector('#redux-autoplay-upnext').innerText = upNext.innerText;	
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

function expandSidebarSections() {
	const expanders = document.querySelectorAll('#guide-renderer #expander-item');
	for (let i = expanders.length - 1; i >= 0 ; i--) {
		expanders[i].click();
	}
}

function formatNumber(number) {
	let likesButton = document.querySelector('#above-the-fold #segmented-like-button button') || document.querySelector('#above-the-fold like-button-view-model button') ;
	let likes = likesButton.getAttribute('aria-label')?.match(/(?=\d).*(?<=\d)/g) ? likesButton.getAttribute('aria-label').match(/(?=\d).*(?<=\d)/g)[0] : '';
	let views = document.querySelector('#count.ytd-video-primary-info-renderer');
	let separator = ' ';

	if (views.innerText.includes('.') || likes.includes('.')) {
		separator = '.';
	} else if (views.innerText.includes(',') || likes.includes(',')) {
		separator = ',';
	}

	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function updateDislikes() {
	let buttonsContainer = document.querySelector('#top-level-buttons-computed');
	let observerConfig = {
		childList: true
	};
	let observerLikes = new MutationObserver(update);
	observerLikes.observe(buttonsContainer, observerConfig); //not used anyway? needs investigation

	update();

	if (reduxSettings.showRawValues) {
		let checkIfChanged = setInterval(() => {
			let dislikesSource = document.querySelector('#top-level-buttons-computed .ryd-tooltip:last-of-type #tooltip') || document.querySelector('ytd-video-primary-info-renderer #top-level-buttons-computed #segmented-dislike-button span'); 
			if (!dislikesSource) return;
			
			let dislikes = document.querySelector('#above-the-fold dislike-button-view-model button');
			let dislikesCount = dislikesSource.innerText.match(/(?<=\/).*/) ? dislikesSource.innerText.match(/(?<=\/).*/)[0].trim() : dislikesSource.innerText;
			
			if (dislikes) {
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
		let likesButtonWithAria = document.querySelector('ytd-video-primary-info-renderer #top-level-buttons-computed #segmented-like-button button') || document.querySelector('ytd-video-primary-info-renderer #top-level-buttons-computed like-button-view-model button');
		if (!likesButtonWithAria?.getAttribute('aria-label')) return; //gets likes value from aria label as it's the same with or without precise values
		if (!parseInt(likesButtonWithAria.getAttribute('aria-label').replace(/[,.\s]/g, '').match(/\d+/))) return;

		let likesCount = parseInt(likesButtonWithAria.getAttribute('aria-label').replace(/[,.\s]/g, '').match(/\d+/)[0]);
		let dislikesSource = document.querySelector('.ryd-tooltip:last-of-type #tooltip');
		let dislikesCount = '';

		if (dislikesSource)
		{
			dislikesCount = dislikesSource.innerText.match(/(?<=\/).*/) ? dislikesSource.innerText.match(/(?<=\/).*/)[0].trim() : dislikesSource.innerText;
			dislikesCount = dislikesCount.replace(/[,.\s]/g, '');
		}

		updateLikesBar(likesCount, dislikesCount);
	}
}

function updateLikesBar(likesCount, dislikesCount) {
	let likeBar = document.querySelector('#above-the-fold #like-bar.ytd-sentiment-bar-renderer');
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
	window.location.replace(redirectLocation);
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

	if (reduxSettings.rearrangeInfo2 && pageLocation === PAGE_LOCATION.Video && !flags.isRearranged) {
		waitForElement('#above-the-fold #top-level-buttons-computed > *', 10, rearrangeInfo);
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
	if (reduxSettings.showRawValues && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#above-the-fold #segmented-like-button button[aria-label]:not([aria-label=""]), #above-the-fold like-button-view-model button[aria-label]:not([aria-label=""])', 10, changeLikesCounter);
	}
	if (reduxSettings.compatibleDislikesRe && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('.ryd-tooltip #tooltip', 10, updateDislikes, 20 * 1000);
	}
	if (pageLocation === PAGE_LOCATION.Trending || pageLocation === PAGE_LOCATION.Explore) {
		waitForElement('#page-manager ytd-browse #primary > ytd-section-list-renderer > #continuations', 10, splitTrendingLoop);
	}
	if (reduxSettings.trueFullscreen && pageLocation === PAGE_LOCATION.Video && !flags.trueFullscreenListenersAdded) {
		preventScrolling();
	}
	if (reduxSettings.playlistsFirst && pageLocation === PAGE_LOCATION.Home) {
		waitForElement('#page-manager ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer #content .ytLockupViewModelCollectionStack2', 10, sortPlaylists);
	}
	if (reduxSettings.trimSubs && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#reduxSubDiv > #owner-sub-count', 10, trimStrings);
	}
	if (reduxSettings.trimViews && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('span.view-count', 10, trimViews);
	}
	if (reduxSettings.altStrings && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#below #comments:not([hidden])', 10, alternativeStrings);
	}
	if (reduxSettings.hideThanks && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#above-the-fold path[d="M16.25 2A6.7 6.7 0 0012 3.509 6.75 6.75 0 001 8.75c0 4.497 2.784 7.818 5.207 9.87a23.498 23.498 0 004.839 3.143l.096.044.03.013.01.005.003.002.002.001c.273-.609.544-1.218.813-1.828 0 0-9-4-9-11.25a4.75 4.75 0 018.932-2.247A1 1 0 0011 7.5v.638c-.357.1-.689.26-.979.49A2.35 2.35 0 009.13 10.5c-.007.424.112.84.342 1.197.21.31.497.563.831.734.546.29 1.23.411 1.693.502.557.109.899.19 1.117.315.086.048.109.082.114.09.004.006.028.045.028.162 0 .024-.008.118-.165.235-.162.122-.5.27-1.09.27-.721 0-1.049-.21-1.181-.323a.6.6 0 01-.142-.168l.005.013.006.014.002.009a.996.996 0 00-1.884.64l.947-.316-.003.001c-.875.292-.939.314-.943.317l.001.003.003.006.004.015.012.032c.045.111.1.218.162.321.146.236.324.444.535.624.357.306.841.566 1.476.702v.605a1 1 0 002 0v-.614c1.29-.289 2.245-1.144 2.245-2.386 0-.44-.103-.852-.327-1.212-.22-.355-.52-.6-.82-.77-.555-.316-1.244-.445-1.719-.539-.567-.111-.915-.185-1.143-.305a.5.5 0 01-.1-.07l-.004-.003-.003-.009a.4.4 0 01-.009-.092c0-.158.053-.244.14-.314.109-.086.341-.19.74-.19.373-.001.73.144.997.404a.996.996 0 001.518-1.286l-.699.58.698-.582v-.001l-.002-.001-.002-.003-.006-.006-.016-.018a2.984 2.984 0 00-.178-.182A3.45 3.45 0 0013 8.154V7.5a1 1 0 00-.933-.997A4.75 4.75 0 0121 8.75C21 16 12 20 12 20l.813 1.827.002-.001.003-.001.01-.005.029-.013.097-.045c.081-.037.191-.09.33-.16a23.5 23.5 0 004.509-2.982C20.216 16.568 23 13.248 23 8.75A6.75 6.75 0 0016.25 2Zm-3.437 19.827L12 20l-.813 1.828.813.36.813-.361Z"]', 100, hideThanks);
	}
	if (reduxSettings.moveAutoplay && pageLocation === PAGE_LOCATION.Video) {
		waitForElement('#secondary-inner #related #contents > yt-lockup-view-model', 10, moveAutoplay);
	}
	if (reduxSettings.disableMiniplayer) {
		waitForElement('.ytp-miniplayer-ui .ytp-miniplayer-close-button', 10, removeMiniplayer);
	}
	if (reduxSettings.autoExpandSidebarSections) {
		waitForElement('#section-items > ytd-guide-collapsible-entry-renderer #expander-item', 10, expandSidebarSections);
	}
	if (reduxSettings.hideShorts && pageLocation === PAGE_LOCATION.SearchResults) {
		waitForElement('#contents.ytd-section-list-renderer', 10, hideShortsInSearch);
	}
	if (reduxSettings.redirectShorts && pageLocation === PAGE_LOCATION.Shorts) {
		redirectShorts();
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

			if (!!document.querySelector('#redux-video-stats') 
			&& pageLocation === PAGE_LOCATION.Video
			&& document.querySelector('#redux-video-stats').getAttribute('redux-url-check') != window.location.search) {
				addMissingVideoPageElements();
			}

			if (reduxSettings.compatibleDislikesRe) {
				const leftoverRYDTooltips = document.querySelectorAll('.ryd-tooltip');
				if (leftoverRYDTooltips.length > 0) {
					leftoverRYDTooltips.forEach(element => {
						element.remove();
					});
				}
			}

			try {
				main();
			} catch (error) {
				log(error, true);
			}
		}
	}, 100);
})();
