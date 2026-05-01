let minVersion = 53;
let browserVersion;
let storage = browser.storage.sync;
if (navigator.userAgent.match(/Firefox\/([^\s]+)/)) {
	browserVersion = parseInt(navigator.userAgent.match(/Firefox\/([^\s]+)/)[1]);
	if (browserVersion < minVersion) {
		storage = browser.storage.local;
	}
}
let reduxSettings;
let playerSize = {};
let aspectRatio = (window.screen.width / window.screen.height).toFixed(2);
let logoExtension;
const defaultSettings = {
	"completedSettingsTutorial": false,
	"gridItems": 6, 
	"hideAutoplayButton": false, 
	"hideCastButton": false,
	"darkPlaylist": true, 
	"smallPlayer": true, 
	"smallPlayerWidth": 853, 
	"showRawValues": true, 
	"classicLikesColors": false, 
	"autoConfirm": true, 
	"disableInfiniteScrolling": false, 
	"blackBars": true, 
	"rearrangeInfo2": true, 
	"classicLogoChoice": 2017, 
	"filterMainRe": false, 
	"filterVideo": true, 
	"filterMiniRe": true, 
	"extraLayout": true, 
	"darkerRed": false, 
	"immersiveFullscreen": false, 
	"trueFullscreen": false, 
	"favicon": 3,
	"squareAvatar": true, 
	"squareSubs": true,
	"noHomeScalingRe": true, 
	"squareSearch": true, 
	"squareComments": true,
	"extraSidebarStyles": true, 
	"altVideoLayout": false, 
	"altVideoLayoutExtra": false, 
	"playlistsFirst": true, 
	"sortFoundPlaylists": true, 
	"customTitleFont": false, 
	"titleFontValue": "Arial", 
	"hideVoiceSearch": false, 
	"subBorder": true,
	"classicLikesStyle": true,
	"classicLikesIconColors": false,
	"hideJoinButton": false,
	"trimSubs": false,
	"trimViews": false,
	"altStrings": false,
	"extraChannel": true,
	"noPlayerActionAnimations": false,
	"altLoader": false,
	"altLoaderSmaller": false,
	"showChangelog": true,
	"oldIcons": true,
	"extraComments": true,
	"collapseSidebar": false,
	"hideRelatedVideoAge": true,
	"hideVideoCategory": true,
	"hideDescriptionExtras": false,
	"moveAutoplay": true,
	"disableMiniplayer": false,
	"hideCountryCode": false,
	"disableVideoPreview": false,
	"autoExpandSidebarSections": false,
	"compatibleDislikesRe": true,
	"hideDislikes": false,
	"hideDownload": false,
	"hideChaptersInSearch": true,
	"hideChaptersInDescription": true,
	"hideHeatmap": false,
	"hideSurveys": true,
	"hideHomeChannelAvatars": true,
	"hideMixTopStack": true,
	"ignoreAmbientAdjustment": false,
	"hideClickAnimations": true,
	"hideHashtags": true,
	"altUploadIcon": true,
	"hideTicketShelf": true,
	"hideAISummary": true,
	"hideEndScreen": false,
	"hideExtraSearchCategories": true
};

initiate();

function initiate() {
	storage.get(['reduxSettings'], function(result) {
		if (Object.keys(result).length == 0) {
			storage.set({reduxSettings: defaultSettings});
			reduxSettings = defaultSettings;
		} else {
			//check which default settings are missing (e.g. due to updates) and add them
			for (let i in defaultSettings) { //loop through default settings
				let settingFound = false;
				for (let j in result.reduxSettings) { //loop through current settings
					if (i == j) {
						settingFound = true;
						break;
					}
				}
				if (!settingFound) {
					log('YouTube Redux - missing setting ' + i + ' was added.');
					result.reduxSettings[i] = defaultSettings[i];
					storage.set({reduxSettings: result.reduxSettings});
				}
			}
			reduxSettings = result.reduxSettings; //reassign in case missing settings were added
			playerSize.width = reduxSettings.smallPlayerWidth == undefined ? 853 : reduxSettings.smallPlayerWidth;
			playerSize.height = Math.ceil(playerSize.width / aspectRatio);
		}

		logoExtension = reduxSettings.classicLogoChoice === 'XL' ? 'png' : 'svg';
		addCustomStyles();
	});

	//display changelog if there was an update
	storage.get(['queueDisplayChangelog'], function(result) {
		const queueDisplayChangelog = result.queueDisplayChangelog;
		if (queueDisplayChangelog) {
			browser.runtime.sendMessage({ message: "displayChangelog" });
		}
	});
}

function addCustomStyles() {
	let allStyles = {
		gridItems: `
		#primary > ytd-rich-grid-renderer #contents {
			--ytd-rich-grid-items-per-row: ${reduxSettings.gridItems} !important;
		}
		`,
		hideCastButton: `/*PLAY ON TV BUTTON*/.ytp-remote-button:not([data-tooltip-target-id="ytp-autonav-toggle-button"]) {display:none !important;}`,
		hideAutoplayButton: `/*AUTOPLAY BUTTON*/[data-tooltip-target-id="ytp-autonav-toggle-button"], #redux-autoplay {display:none !important;}`,
		smallPlayer: `
		/*SMALL PLAYER*/
		#primary.ytd-watch-flexy {
		max-width: calc((100vh - (var(--ytd-watch-flexy-masthead-height) + var(--ytd-margin-6x) + var(--ytd-watch-flexy-space-below-player))) * (${window.screen.width} / ${window.screen.height})) !important;
		min-width: calc(var(--ytd-watch-flexy-min-player-height) * (${window.screen.width} / ${window.screen.height})) !important;
		}
		#player-container-outer {
		max-width: ${playerSize.width}px  !important;
		min-width: 0 !important;
		position: relative !important;
		}
		#player-container-inner {
		padding-top: calc(${window.screen.height} / ${window.screen.width} * 100%) !important;
		}
		.html5-video-container {
		width:100% !important;
		height:100% !important;
		}
		.html5-video-container video {
		width:100% !important;
		height:100% !important;
		left:0 !important;
		top: 0 !important;
		object-fit: contain !important;
		}
		`,
		darkPlaylist: `
		/*DARK PLAYLIST*/
		#playlist.ytd-watch-flexy {
		margin-left: -18px !important;
		}
		.header.ytd-playlist-panel-renderer {
		background-color: #1a1a1a !important;
		}
		ytd-playlist-panel-renderer[collapsible] .title.ytd-playlist-panel-renderer,
		ytd-playlist-panel-renderer #next-video-title {
		color: #fff !important;
		}
		.title.ytd-playlist-panel-renderer {
		--yt-endpoint-color: white !important;
		}
		.title.ytd-playlist-panel-renderer a {
		color: white !important;
		}
		.title.ytd-playlist-panel-renderer a:hover {
		--yt-endpoint-color: white !important;
		color: white !important;
		}
		.publisher.ytd-playlist-panel-renderer,
		.byline-title.ytd-playlist-panel-renderer {
		color: #B8B8B8 !important;
		}
		.playlist-items.ytd-playlist-panel-renderer {
		background-color: #222 !important;
		}
		#video-title.ytd-playlist-panel-video-renderer {
		color: #CACACA !important;
		}
		#byline.ytd-playlist-panel-video-renderer {
		color: #767676 !important;
		}
		ytd-playlist-panel-video-renderer.ytd-playlist-panel-renderer:hover:not(.dragging) {
		background-color: #525252 !important;
		}
		ytd-playlist-panel-video-renderer[selected] {
		background-color: #3a3a3a !important;
		}
		#publisher-container > yt-formatted-string[has-link-only_]:not([force-default-style]) a.yt-simple-endpoint.yt-formatted-string:visited {
		color: #CACACA !important;
		}
		#publisher-container > yt-formatted-string[has-link-only_]:not([force-default-style]) a.yt-simple-endpoint.yt-formatted-string {
		color: #B8B8B8 !important;
		}
		#playlist.ytd-watch-flexy #unplayableText:not([hidden]) {
		color: #CACACA !important;
		}
		#playlist.ytd-watch-flexy ytd-playlist-panel-video-renderer[watch-color-update_] #index.ytd-playlist-panel-video-renderer {
		color: #CACACA !important;
		}
		
		#playlist.ytd-watch-flexy .index-message-wrapper.ytd-playlist-panel-renderer {
		color: #B8B8B8 !important;
		}
		#playlist > #container {
		border: none !important;
		}
		/* Close button */
		#secondary ytd-playlist-panel-renderer #header-top-row button svg > path {
			fill: #606060;
		}
		/* Misc button */
		#secondary ytd-playlist-panel-renderer #end-actions button svg > path {
			fill: #606060;
		}
		/* Playlist shuffle/repeat buttons */
		#secondary ytd-playlist-panel-renderer #playlist-action-menu svg > path {
			fill: #606060;
		}
		/* Playlist shuffle active */
		path[d="M18.51,13.29l4.21,4.21l-4.21,4.21l-1.41-1.41l1.8-1.8c-2.95-0.03-5.73-1.32-7.66-3.55l1.51-1.31 c1.54,1.79,3.77,2.82,6.13,2.85l-1.79-1.79L18.51,13.29z M18.88,7.51l-1.78,1.78l1.41,1.41l4.21-4.21l-4.21-4.21l-1.41,1.41l1.8,1.8 c-3.72,0.04-7.12,2.07-8.9,5.34l-0.73,1.34C7.81,14.85,5.03,17,2,17v2c3.76,0,7.21-2.55,9.01-5.85l0.73-1.34 C13.17,9.19,15.9,7.55,18.88,7.51z M8.21,10.31l1.5-1.32C7.77,6.77,4.95,5,2,5v2C4.38,7,6.64,8.53,8.21,10.31z"] {
			fill: white;
		}
		/* Playlist repeat all active */
		path[d="M20,14h2v5L5.84,19.02l1.77,1.77l-1.41,1.41L1.99,18l4.21-4.21l1.41,1.41l-1.82,1.82L20,17V14z M4,7l14.21-0.02l-1.82,1.82 l1.41,1.41L22.01,6l-4.21-4.21l-1.41,1.41l1.77,1.77L2,5v6h2V7z"] {
			fill: white;
		}
		/* Playlist repeat all active once*/
		path[d="M13,15h-1.37v-4.52l-1.3,0.38v-1L12.83,9H13V15z M20,17L5.79,17.02l1.82-1.82l-1.41-1.41L1.99,18l4.21,4.21l1.41-1.41 l-1.77-1.77L22,19v-5h-2V17z M4,7l14.21-0.02l-1.82,1.82l1.41,1.41L22.01,6l-4.21-4.21l-1.41,1.41l1.77,1.77L2,5v6h2V7z"] {
			fill: white;
		}
		`,
		classicLogoChoice: `
		ytd-masthead #logo-icon-container, 
		#contentContainer #logo-icon-container, 
		ytd-topbar-logo-renderer > #logo,
		#start > #masthead-logo,
		#masthead > #masthead-logo {
			content: url('${browser.runtime.getURL(`/images/${reduxSettings.classicLogoChoice}logo.${logoExtension}`)}') !important;
			width: 72px !important;
			padding: 18px 14px 18px 16px !important;
		}
		ytd-masthead[dark] #logo-icon-container, 
		html[dark] #contentContainer #logo-icon-container, 
		ytd-masthead[dark] ytd-topbar-logo-renderer > #logo, 
		html[dark] ytd-topbar-logo-renderer > #logo,
		html[dark] #start > #masthead-logo,
		html[dark] #masthead > #masthead-logo {
			content: url('${browser.runtime.getURL(`/images/${reduxSettings.classicLogoChoice}logo-dark.${logoExtension}`)}') !important;
			width: 72px !important;
			padding: 18px 14px 18px 16px !important;
		}
		`,
		classicLikesColors: `
		/*LIKES*/
		#container > #like-bar.ytd-sentiment-bar-renderer {
			background: rgb(0 136 29) !important;
		}
		#container.ytd-sentiment-bar-renderer {
			background-color: rgb(222 0 17) !important;
		}
		`,
		filterMainRe: `
		[page-subtype="home"] > #primary > ytd-rich-grid-renderer > #header > ytd-feed-filter-chip-bar-renderer {
			display: none !important;
		}
		`,
		filterVideo: `
		#related yt-related-chip-cloud-renderer {
			display: none !important;
		}
		`,
		filterMiniRe: `
		#chips yt-chip-cloud-chip-renderer,
		#chips yt-chip-cloud-chip-renderer > #chip-container,
		#redux-sort-chip,
		.ytChipShapeChip {
			height: 20px !important;
		}
		yt-chip-cloud-chip-renderer.ytd-feed-filter-chip-bar-renderer {
			margin-top: 5px !important;
			margin-bottom: 5px !important;
		}
		ytd-feed-filter-chip-bar-renderer {
			height: 30px !important;
		}
		`,
		extraLayout: `
		/*EXTRA LAYOUT 1 - VIDEO*/
		ytd-app {
			background-color: #f1f1f1 !important;
		}
		html[dark] ytd-app {
			background-color: var(--redux-spec-general-background-a) !important;
		}
		ytd-video-primary-info-renderer {
			padding-top: 15px !important;
		}
		ytd-video-primary-info-renderer, 
		ytd-video-secondary-info-renderer {
			background-color: white;
			padding-left: 15px !important;
			padding-right: 15px !important;
			box-shadow: 0 1px 2px rgba(0,0,0,.1);
			border-bottom: 0;
			margin-bottom: 10px !important;
		}
		html[dark] ytd-video-primary-info-renderer, 
		html[dark] ytd-video-secondary-info-renderer {
			background-color: #222222;
			padding-left: 15px !important;
			box-shadow: 0 1px 2px rgba(255,255,255,.1);
			border-bottom: 0;
			margin-bottom: 10px !important;
		}
		ytd-video-secondary-info-renderer {
			padding-bottom: 8px !important;
		}
		.more-button.ytd-video-secondary-info-renderer, 
		.less-button.ytd-video-secondary-info-renderer {
			font-size: 1.1rem !important;
		}
		ytd-comments#comments {
			background-color: white;
			padding-left: 15px !important;
			padding-top: 1px !important;
			box-shadow: 0 1px 2px rgba(0,0,0,.1);
		}
		html[dark] ytd-comments#comments {
			background-color: #222222;
			padding-left: 15px !important;
			padding-top: 1px !important;
			box-shadow: 0 1px 2px rgba(255,255,255,.1);
		}
		#meta-contents > ytd-video-secondary-info-renderer > #container > ytd-expander > #content {
			padding-top: 10px;
		}
		#meta.ytd-watch-flexy paper-button#more,
		#meta.ytd-watch-flexy tp-yt-paper-button#more,
		#meta.ytd-watch-flexy paper-button#less,
		#meta.ytd-watch-flexy tp-yt-paper-button#less,
		tp-yt-paper-button#expand,
		tp-yt-paper-button#collapse {
			width: 100%;
			border-top: 1px solid #e2e2e2;
			margin-top: 10px;
			font-size: 1.1rem;
			text-transform: uppercase;
		}
		#meta.ytd-watch-flexy paper-button#more:hover > yt-formatted-string,
		#meta.ytd-watch-flexy tp-yt-paper-button#more:hover > yt-formatted-string,
		#meta.ytd-watch-flexy paper-button#less:hover > yt-formatted-string,
		#meta.ytd-watch-flexy tp-yt-paper-button#less:hover > yt-formatted-string {
			color: black;
		}
		#show-more-comments:hover > input {
			color: black;
		}
		#show-more-related:hover > input {
			color: black;
		}
		html[dark] #meta.ytd-watch-flexy paper-button#more, 
		html[dark] #meta.ytd-watch-flexy tp-yt-paper-button#more,
		html[dark] #meta.ytd-watch-flexy paper-button#less,
		html[dark] #meta.ytd-watch-flexy tp-yt-paper-button#less {
			border-top: 1px solid var(--redux-spec-10-percent-layer);
		}
		html[dark] #meta.ytd-watch-flexy paper-button#more:hover > yt-formatted-string,
		html[dark] #meta.ytd-watch-flexy tp-yt-paper-button#more:hover > yt-formatted-string,
		html[dark] #meta.ytd-watch-flexy paper-button#less:hover > yt-formatted-string,
		html[dark] #meta.ytd-watch-flexy tp-yt-paper-button#less:hover > yt-formatted-string {
			color: white;
		}
		html[dark] #show-more-comments:hover > input {
			color: white;
		}
		html[dark] #show-more-related:hover > input {
			color: white;
		}
		#secondary.ytd-watch-flexy {
			width: 416px !important;
		}
		#secondary-inner.ytd-watch-flexy #related {
			background-color: white;
			box-shadow: 0 1px 2px rgba(0,0,0,.1);
			padding-left: 15px;
			padding-top: 7px;
			margin-left: -13px;
		}
		html[dark] #secondary-inner.ytd-watch-flexy #related {
			background-color: #222222;
			box-shadow: 0 1px 2px rgba(255,255,255,.1);
			padding-left: 15px;
			padding-top: 7px;
			margin-left: -13px;
		}
		#secondary-inner.ytd-watch-flexy #playlist + #related:not(#secondary-inner.ytd-watch-flexy #playlist[hidden="true"] + #related) {
			padding-top: 7px;
		}
		#secondary-inner.ytd-watch-flexy #playlist[hidden="true"] + #related {
			padding-top: 15px;
		}
		#always-shown ytd-rich-metadata-renderer {
			background: none;
		}
		#secondary-inner.ytd-watch-flexy ytd-playlist-panel-renderer:not([hidden="true"]) + #related #items > ytd-compact-video-renderer:first-child {
			padding-top: 8px;
		}
		yt-chip-cloud-renderer,
		#left-arrow-button.yt-chip-cloud-renderer, 
		#right-arrow-button.yt-chip-cloud-renderer {
			background-color: white;
		}
		html[dark] yt-chip-cloud-renderer,
		html[dark] #left-arrow-button.yt-chip-cloud-renderer, 
		html[dark] #right-arrow-button.yt-chip-cloud-renderer {
			background-color: #222222;
		}
		#right-arrow.yt-chip-cloud-renderer:before {
			background: -webkit-gradient(linear, right top, left top, color-stop(10%, white), color-stop(90%, rgba(249, 249, 249, 0)));
			background: -webkit-linear-gradient(right, white 10%, rgba(249, 249, 249, 0) 90%);
			background: linear-gradient(to left, white 10%, rgb(249 249 249 / 0%) 90%);
		}
		#left-arrow.yt-chip-cloud-renderer:after {
			background: -webkit-gradient(linear, left top, right top, color-stop(10%, white), color-stop(90%, rgba(249, 249, 249, 0)));
			background: -webkit-linear-gradient(left, white 10%, rgba(249, 249, 249, 0) 90%);
			background: linear-gradient(to right, white 10%, rgba(249, 249, 249, 0) 90%);
		}
		yt-chip-cloud-renderer[is-dark-theme] #right-arrow.yt-chip-cloud-renderer:before {
			background: -webkit-gradient(linear, right top, left top, color-stop(10%, #222222), color-stop(90%, rgba(24, 24, 24, 0)));
    		background: -webkit-linear-gradient(right, #222222 10%, rgba(24, 24, 24, 0) 90%);
    		background: linear-gradient(to left, #222222 10%, rgba(24, 24, 24, 0) 90%);
		}
		yt-chip-cloud-renderer[is-dark-theme] #left-arrow.yt-chip-cloud-renderer:after {
			background: -webkit-gradient(linear, left top, right top, color-stop(10%, #222222), color-stop(90%, rgba(24, 24, 24, 0)));
    		background: -webkit-linear-gradient(left, #222222 10%, rgba(24, 24, 24, 0) 90%);
    		background: linear-gradient(to right, #222222 10%, rgba(24, 24, 24, 0) 90%);
		}
		ytd-watch-flexy #info.ytd-watch-flexy {
			margin-top: 10px;
		}
		ytd-thumbnail-overlay-time-status-renderer {
			font-size: 1.1rem;
			padding: 1px 4px;
			margin-right: 0;
		}
		#related #text.ytd-channel-name {
			font-size: 11px !important;
			line-height: 1.4em;
		}
		#video-title.ytd-compact-video-renderer {
			line-height: 1.2;
			margin-bottom: 2px;
		}
		#video-title.ytd-compact-video-renderer:hover {
			color: #167ac6;
		}
		#movie_player:not(.ytp-delhi-modern) .ytp-chrome-controls {
			height: 40px !important;
			line-height: 40px !important;
		}
		#movie_player:not(.ytp-delhi-modern) .ytp-chrome-bottom {
			height: 40px !important;
		}
		#movie_player:not(.ytp-delhi-modern) .ytp-progress-bar-container {
			bottom: 39px !important;
		}
		#movie_player:not(.ytp-delhi-modern) .ytp-time-display {
			line-height: 39px !important;
		}
		.ytp-big-mode .ytp-volume-slider {
			min-height: 40px !important;
		}
		.ytp-big-mode .ytp-volume-slider-handle:before {
			height: 3px !important;
		}
		.ytp-big-mode .ytp-volume-slider-handle:after {
			height: 3px !important;
		}
		.ytp-big-mode .ytp-volume-slider-handle {
			width: 12px !important;
			height: 12px !important;
			border-radius: 6px !important;
			margin-top: -6px !important;
		}
		.ytp-volume-area button {
			padding: 0 !important;
		}
		.ytp-volume-area .ytp-volume-icon {
			height: 38px !important;
		}
		ytd-compact-video-renderer.ytd-video-description-music-section-renderer {
			min-width: 200px;
			width: auto;
		}
		ytd-compact-video-renderer.ytd-video-description-music-section-renderer #video-title,
		ytd-compact-video-renderer.ytd-video-description-music-section-renderer #channel-name #text {
			font-size: 1.2rem;
		}
		#structured-description > #items > ytd-video-description-music-section-renderer {
			border-top: 1px solid var(--yt-spec-10-percent-layer);
		}
		#primary #info-rows ytd-info-row-renderer {
			padding: 2px 0;
			border-bottom: none;
		}
		#primary #info-rows #title {
			text-transform: lowercase;
			font-size: 1.2rem;
			margin-right: 10px;
			flex-basis: 8em;
    		max-width: 8em;
		}
		#primary #info-rows #title:first-line {
			text-transform: capitalize;
		}
		#primary #info-rows #default-metadata-section,
		#primary #info-rows #default-metadata-section > #truncation-text {
			margin-left: 0;
		}
		#primary #info-rows #default-metadata-section yt-formatted-string,
		#primary #info-rows #info-row-container > yt-formatted-string {
			font-size: 1.2rem;
		}
		like-button-view-model button::after {
			display: none !important;
		}
		ytd-toggle-button-renderer button:hover,
		#reply-button-end button:hover,
		#more-replies button:hover,
		#less-replies button:hover,
		#right-arrow-button button:hover,
		#left-arrow-button button:hover,
		#voice-search-button button:hover {
			background: none !important;
			filter: brightness(0.8);
		}
		.yt-spec-touch-feedback-shape {
			display: none !important;
		}

		/*EXTRA LAYOUT 2 - HOME*/
		#guide-content.ytd-app,
		#chips-wrapper.ytd-feed-filter-chip-bar-renderer,
		ytd-search-header-renderer #chip-bar {
			background-color: var(--redux-spec-base-background) !important;
		}
		#background.ytd-masthead {
			display: flex !important;
		}
		tp-yt-app-drawer#guide[position="left"] {
			border-right: 1px solid #e8e8e8;
		}
		html[dark] tp-yt-app-drawer#guide[position="left"] {
			border-right: 1px solid var(--redux-spec-10-percent-layer);
		}
		html:not([dark]) #masthead-container.ytd-app #masthead:not([dark]) {
			border-bottom: 1px solid #e8e8e8;
		}
		html[dark] #masthead-container.ytd-app {
			border-bottom: 1px solid var(--redux-spec-10-percent-layer);
		}
		@media (max-width: 2000px) {
			#page-manager ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer,
			#page-manager ytd-browse[page-subtype="subscriptions"] ytd-two-column-browse-results-renderer {
				max-width: 1356.81px;  
			}
		}
		@media (min-width: 2001px) {
			#page-manager ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer,
			#page-manager ytd-browse[page-subtype="subscriptions"] ytd-two-column-browse-results-renderer {
			  max-width: 2713.62px;
			} 
		}
		ytd-rich-shelf-renderer {
			border-top: 1px solid var(--redux-spec-10-percent-layer);
		}
		#video-title.ytd-rich-grid-media, 
		#video-title.yt-simple-endpoint.ytd-grid-video-renderer,
		ytd-rich-item-renderer yt-lockup-metadata-view-model a[href] {
			font-size: min(13px, calc((90 / var(--ytd-rich-grid-items-per-row)) * 1px)) !important;
			line-height: 1.3em !important;
		}
		#contents.ytd-rich-grid-renderer #text.ytd-channel-name,
		#contents.ytd-rich-grid-renderer .ytLockupMetadataViewModelMetadata a[href],
		[page-subtype="subscriptions"] #text.ytd-channel-name, 
		[page-subtype="subscriptions"] #metadata-line.ytd-grid-video-renderer, 
		[page-subtype="channels"] #text.complex-string.ytd-channel-name, 
		[page-subtype="channels"] #metadata-line.ytd-grid-video-renderer,
		yt-lockup-metadata-view-model div > span {
			font-size: min(11px, calc((90 / var(--ytd-rich-grid-items-per-row)) * 1px)) !important;
			line-height: 1.3em !important;
		}
		ytd-two-column-browse-results-renderer[page-subtype="subscriptions"] {
			margin-top: 12px !important;
		}
		[page-subtype="subscriptions"] ytd-item-section-renderer:first-child .grid-subheader.ytd-shelf-renderer {
			margin-top: 0px !important;
		}
		ytd-two-column-browse-results-renderer:not([page-subtype="subscriptions"]) ytd-thumbnail.ytd-grid-video-renderer, 
		ytd-two-column-browse-results-renderer:not([page-subtype="subscriptions"]) ytd-grid-video-renderer {
			width: 207.25px !important;
		}
		#contents.ytd-section-list-renderer {
			padding-left: 10px !important;
		}
		[page-subtype="subscriptions"] #contents.ytd-section-list-renderer {
			margin-right: -16px !important;
		}
		[page-subtype="subscriptions"] #contents.ytd-rich-grid-renderer {
			padding-top: 0px !important;
			padding-left: 32px !important;
		}
		[page-subtype="home"] #contents.ytd-rich-grid-renderer,
		[page-subtype="subscriptions"] #contents.ytd-section-list-renderer,
		[page-subtype="channels"] #contents.ytd-section-list-renderer,
		[page-subtype="channels"] #contents.ytd-rich-grid-renderer {
			padding-top: 10px !important;
		}
		[page-subtype="channels"] ytd-channel-featured-content-renderer {
			padding-top: 0px !important;
			margin-top: -12px !important;
		}
		#contents.ytd-rich-grid-renderer, #contents.ytd-section-list-renderer {
			background: #fff !important;
			box-shadow: 0 1px 2px rgba(0,0,0,.1) !important;
		}
		[page-subtype="home"] #contents.ytd-rich-grid-renderer {
			margin-top: 12px !important;
			padding-left: 32px !important;
		}
		html[dark] #contents.ytd-rich-grid-renderer, html[dark] #contents.ytd-section-list-renderer {
			background: #222222 !important;
			box-shadow: 0 1px 2px rgba(255,255,255,.1) !important;
		}
		ytd-video-meta-block[rich-meta] #metadata-line.ytd-video-meta-block {
			line-height: 1.3em !important;
		}
		ytd-rich-shelf-renderer[is-show-more-hidden] #dismissable.ytd-rich-shelf-renderer {
			border-bottom: 1px solid var(--redux-spec-10-percent-layer) !important;
		}
		#avatar-link.ytd-rich-grid-media {
			display:none !important;
		}
		h3.ytd-rich-grid-media, h3.ytd-grid-video-renderer,
		ytd-rich-item-renderer yt-lockup-metadata-view-model a[href] {
			margin: 4px 0 1px 0 !important;
		}
		ytd-guide-entry-renderer[active] {
			background-color: #f00 !important;
		}
		ytd-guide-entry-renderer[active] .guide-icon.ytd-guide-entry-renderer {
			color: white !important;
		}
		ytd-guide-entry-renderer[active] .title.ytd-guide-entry-renderer {
			color: white !important;
		}
		[page-subtype="home"] ytd-rich-section-renderer:not(:nth-child(1)) {
			display:none !important;
		}
		[page-subtype="channels"] ytd-two-column-browse-results-renderer .flex-container.ytd-compact-station-renderer {
			background: none !important;
		}
		#player.ytd-watch-flexy {
			margin-bottom: 10px;
		}
		ytd-watch-next-secondary-results-renderer:not([player-move-autonav-toggle_]) #items.ytd-watch-next-secondary-results-renderer > yt-related-chip-cloud-renderer.ytd-watch-next-secondary-results-renderer {
			margin-top: calc(0% - 7px);
		}
		#chips-wrapper.ytd-feed-filter-chip-bar-renderer {
			width: calc(var(--ytd-rich-grid-chips-bar-width) - 33px);
		}
		ytd-feed-filter-chip-bar-renderer {
			justify-content: center;
		}
		ytd-expander.ytd-video-secondary-info-renderer {
			margin-left: 0px !important;
		}
		/*SKELETON*/
		#home-page-skeleton {
			margin-top: 50px;
		}
		#home-page-skeleton .rich-shelf-videos,
		#home-page-skeleton #home-container-media {
			margin-left: 8vw;
			margin-right: 8vw;
			transform: translate(20px, -2px);
		}
		#home-page-skeleton .rich-shelf-videos .rich-grid-media-skeleton.mini-mode,
		#home-page-skeleton #home-container-media .rich-grid-media-skeleton.mini-mode {
			flex-basis: calc(100%/${reduxSettings.gridItems} - 16px - 0.01px);
			min-width: calc(100%/${reduxSettings.gridItems} - 16px - 0.01px);
			max-width: calc(100%/${reduxSettings.gridItems} - 16px - 0.01px);
		}
		#home-page-skeleton .video-details {
			padding-bottom: 30px;
		}
		/*MISC*/
		.badge-style-type-verified > yt-icon {
			content: url(${browser.runtime.getURL('/images/verified1.png')});
			width: 12px !important;
			height: 9px !important;
			margin-bottom: 1px !important;
		}
		.badge-style-type-verified > yt-icon:hover {
			content: url(${browser.runtime.getURL('/images/verified2.png')});
			width: 12px !important;
			height: 9px !important;
			margin-bottom: 1px !important;
		}
		[page-subtype="channels"] #contents.ytd-section-list-renderer {
			margin-right: -4px !important;
		}
		/* Scrollbar */
		body::-webkit-scrollbar,
		tp-yt-app-drawer#guide #contentContainer #guide-inner-content::-webkit-scrollbar,
		ytd-product-list-renderer::-webkit-scrollbar,
		ytd-transcript-body-renderer::-webkit-scrollbar,
		ytd-macro-markers-list-renderer #contents.ytd-macro-markers-list-renderer::-webkit-scrollbar,
		ytd-playlist-sidebar-renderer::-webkit-scrollbar,
		ytd-playlist-panel-renderer .playlist-items.ytd-playlist-panel-renderer::-webkit-scrollbar,
		ytd-channel-switcher-renderer .menu-container.ytd-channel-switcher-renderer::-webkit-scrollbar {
			width: 8px !important;
		}
		body::-webkit-scrollbar-thumb,
		tp-yt-app-drawer#guide #contentContainer #guide-inner-content::-webkit-scrollbar-thumb,
		ytd-product-list-renderer::-webkit-scrollbar-thumb,
		ytd-transcript-body-renderer::-webkit-scrollbar-thumb,
		ytd-macro-markers-list-renderer #contents.ytd-macro-markers-list-renderer::-webkit-scrollbar-thumb,
		ytd-playlist-sidebar-renderer::-webkit-scrollbar-thumb,
		ytd-playlist-panel-renderer .playlist-items.ytd-playlist-panel-renderer::-webkit-scrollbar-thumb,
		ytd-channel-switcher-renderer .menu-container.ytd-channel-switcher-renderer::-webkit-scrollbar-thumb {
			height: 56px;
			border-radius: 0px !important;
			border: 0px solid transparent !important;
			background-clip: content-box;
			background-color: var(--redux-scrollbar-default) !important;
		}
		body::-webkit-scrollbar-thumb:hover,
		tp-yt-app-drawer#guide #contentContainer #guide-inner-content::-webkit-scrollbar-thumb:hover,
		ytd-product-list-renderer::-webkit-scrollbar-thumb:hover,
		ytd-transcript-body-renderer::-webkit-scrollbar-thumb:hover,
		ytd-macro-markers-list-renderer #contents.ytd-macro-markers-list-renderer::-webkit-scrollbar-thumb:hover,
		ytd-playlist-sidebar-renderer::-webkit-scrollbar-thumb:hover,
		ytd-playlist-panel-renderer .playlist-items.ytd-playlist-panel-renderer::-webkit-scrollbar-thumb:hover,
		ytd-channel-switcher-renderer .menu-container.ytd-channel-switcher-renderer::-webkit-scrollbar-thumb:hover {
			background-color: var(--redux-scrollbar-hover) !important;
		}
		/* SUB + MISC BUTTONS */
		#subscribe-button > ytd-subscribe-button-renderer > tp-yt-paper-button:not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button),
		#subscribe-button > ytd-button-renderer > a > tp-yt-paper-button:not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button),
		#subscribe-button > ytd-subscribe-button-renderer yt-button-shape > button:not([page-subtype="subscriptions"] #subscribe-button > ytd-subscribe-button-renderer > yt-button-shape > button),
		#notification-preference-button yt-button-shape > button,
		#sponsor-button > ytd-button-renderer > a > tp-yt-paper-button, 
		#analytics-button > ytd-button-renderer > a > tp-yt-paper-button,
		#sponsor-button yt-button-shape > button, 
		#analytics-button yt-button-shape > button,
		[page-subtype="channels"] #edit-buttons tp-yt-paper-button,
		[page-subtype="channels"] #edit-buttons yt-button-shape > button,
		yt-subscribe-button-view-model > yt-animated-action button {
			margin: 0;
			padding: 2px 8px 2px 8px !important;
			text-transform: none;
			font-weight: normal !important;
			font-size: 12px;
			max-height: 24px;
			height: 24px;
		}
		ytd-channel-renderer #subscribe-button > ytd-subscribe-button-renderer > tp-yt-paper-button,
		ytd-channel-renderer #subscribe-button > ytd-subscribe-button-renderer yt-button-shape > button {
			margin-right: 10px;
		}
		#subscribe-button > ytd-subscribe-button-renderer > tp-yt-paper-button > yt-formatted-string,
		#subscribe-button > ytd-button-renderer > a > tp-yt-paper-button > yt-formatted-string,
		#subscribe-button > ytd-subscribe-button-renderer yt-button-shape > button > yt-formatted-string {
			padding-top: 1px;
		}
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) > tp-yt-paper-button:not([subscribed]):not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button),
		#subscribe-button > ytd-button-renderer:not(.style-primary) > a > tp-yt-paper-button:not([subscribed]):not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button),
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) yt-button-shape > button:not(.ytSpecButtonShapeNextTonal):not([page-subtype="subscriptions"] #subscribe-button yt-button-shape > button),
		#subscribe-button > ytd-button-renderer:not(.style-primary) yt-button-shape > button:not(.ytSpecButtonShapeNextTonal):not([page-subtype="subscriptions"] #subscribe-button yt-button-shape > button),
		yt-subscribe-button-view-model button:not(.ytSpecButtonShapeNextTonal) {
			background-color: #f00 !important;
		}
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) > tp-yt-paper-button:not([subscribed]):not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button):hover,
		#subscribe-button > ytd-button-renderer:not(.style-primary) > a > tp-yt-paper-button:not([subscribed]):not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button):hover,
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) yt-button-shape > button:not(.ytSpecButtonShapeNextTonal):not([page-subtype="subscriptions"] #subscribe-button yt-button-shape > button):hover,
		#subscribe-button > ytd-button-renderer:not(.style-primary) yt-button-shape > button:not(.ytSpecButtonShapeNextTonal):not([page-subtype="subscriptions"] #subscribe-button yt-button-shape > button):hover,
		yt-subscribe-button-view-model button:not(.ytSpecButtonShapeNextTonal):hover {
			background-color: #d90a17 !important;
		}
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) > tp-yt-paper-button:not([subscribed]):not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button)::before,
		#subscribe-button > ytd-button-renderer:not(.style-primary) > a > tp-yt-paper-button:not([subscribed]):not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button)::before,
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) yt-button-shape > button:not(.ytSpecButtonShapeNextTonal):not([page-subtype="subscriptions"] #subscribe-button yt-button-shape > button)::before,
		#subscribe-button > ytd-button-renderer:not(.style-primary) yt-button-shape > button:not(.ytSpecButtonShapeNextTonal):not([page-subtype="subscriptions"] #subscribe-button yt-button-shape > button)::before,
		yt-subscribe-button-view-model button:not(.ytSpecButtonShapeNextTonal)::before {
				content: url('${browser.runtime.getURL('/images/sub-icon.png')}');
				background-size: auto !important;
				width: 16px !important;
				padding-top: 2px !important;
				margin-right: 6px !important;
		}
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) > tp-yt-paper-button[subscribed]::before,
		#subscribe-button > ytd-button-renderer:not(.style-primary) > a > tp-yt-paper-button[subscribed]::before,
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) yt-button-shape > button.ytSpecButtonShapeNextTonal::before,
		#notification-preference-button yt-button-shape > button.ytSpecButtonShapeNextTonal::before {
			content: "";
			border-right: 1px solid #909090;
			border-bottom: 1px solid #909090;
			height: 9px;
			width: 3px;
			transform: rotate(45deg);
			margin-left: 2px;
			margin-right: 4px;
			margin-bottom: 2px;
		}
		#sponsor-button.ytd-video-owner-renderer, #analytics-button.ytd-video-owner-renderer {
			margin-right: 0px;
		}
		#sponsor-button.ytd-video-owner-renderer > ytd-button-renderer, #analytics-button.ytd-video-owner-renderer > ytd-button-renderer {
			margin-right: 4px;
		}
		[page-subtype="channels"] #edit-buttons ytd-button-renderer:first-child {
			margin-right: 4px;
		}
		#notification-preference-button > ytd-subscription-notification-toggle-button-renderer > a > yt-icon-button {
			max-height: 22px; 
			max-width: 22px; 
			padding: 0; 
			margin-right: 5px;
		}
		#notification-preference-button > ytd-subscription-notification-toggle-button-renderer-next > yt-button-shape > button > div:last-of-type {
			display: none;
		}
		#notification-preference-button > ytd-subscription-notification-toggle-button-renderer-next > yt-button-shape > button > div:first-of-type {
			order: 2;
			margin: 0;
			transform: translateX(8px);
		}
		/* Sign in masthead button */
		#masthead #end ytd-button-renderer {
			align-items: center;
		}
		#end ytd-button-renderer:first-child button {
			background: none;
		}
		#masthead #end ytd-button-renderer a {
			border: none;
		}
		#masthead #end ytd-button-renderer a,
		#masthead #end ytd-button-renderer a[href*='accounts.google'] span {
			margin-left: 0;
			text-transform: none;
			color: var(--redux-paper-dialog-background-color);
			background-color: var(--redux-sign-in-button-background);
			font-size: 11px;
		}
		#masthead #end ytd-button-renderer yt-button-shape {
			padding: 0;
		}
		#masthead #end ytd-button-renderer a {
			background-color: var(--redux-sign-in-button-background);
			color: white;
			padding: 5px 10px;
			max-height: 25px;
			border-radius: 2px !important;
		}
		/* Misc */
		#search-form.ytd-searchbox,
		#search-icon-legacy.ytd-searchbox,
		yt-searchbox {
			height: 29px !important;
			width: 66px !important;
		}
		#search-icon-legacy > yt-icon,
		yt-searchbox yt-icon {
			height: 20px !important;
			width: 20px !important;
		}
		ytd-searchbox[has-focus] #container {
			padding: 2px 6px !important;
		}
		ytd-searchbox[has-focus] #container,
		#container.ytd-searchbox,
		body > iframe + div:last-of-type,
		yt-searchbox .ytSearchboxComponentInputBox {
			margin-left: 0 !important;
		}
		#container.ytd-searchbox,
		.ytSearchboxComponentInputBox {
			padding: 0 0 0 6px !important;
		}
		ytd-searchbox[has-focus] #search-icon.ytd-searchbox,
		.ytSearchboxComponentInputBoxHasFocus .ytSearchboxComponentInnerSearchIcon {
			display: none !important;
		}
		#container.ytd-masthead,
		#background.ytd-masthead {
			height: 50px !important;
		}
		#center.ytd-masthead { 
			margin-right: auto !important;
		}
		ytd-searchbox.ytd-masthead,
		yt-searchbox {
			margin: 0 0 0 51px !important;
		}
		#playlist-actions #top-level-buttons-computed yt-icon-button:not(.style-default-active) path {
			fill: #909090;
		}
		.ytVideoMetadataCarouselViewModelHost {
			background-color: unset !important;
		},
		ytd-search-header-renderer #chip-bar {
			padding: 0 18px !important;
		}
		`,
		rearrangeInfo2: `
        /*VID REARRANGE STYLES*/
        .ytd-video-primary-info-renderer > #top-level-buttons-computed > *:not(ytd-toggle-button-renderer, segmented-like-dislike-button-view-model):not([is-hidden]),
		.ytd-video-primary-info-renderer > #top-level-buttons-computed + #flexible-item-buttons {
            display: none;
        }
        #reduxSubDiv {
            display: flex !important;
            margin-top: 5px !important;
        }
		#reduxSubDiv [subscribed] #subscribe-button-shape {
			display: none;
		}
		html:not([dark]) ytd-subscription-notification-toggle-button-renderer-next lottie-component g > path {
			fill: #606060;
		}
        #info.ytd-video-primary-info-renderer > #menu-container {
            transform: translateY(40px) !important;
			flex-grow: 0;
        }
        #count.ytd-video-primary-info-renderer {
            width: 100% !important;
            display: flex !important;
            justify-content: flex-end !important;
        }
        #info > #menu-container > ytd-sentiment-bar-renderer {
            display: block !important;
            width:100% !important; 
            padding:0 !important;
        }
        #date > yt-formatted-string, .redux-moved-date {
            font-weight: 500 !important;
            color: var(--redux-double-inverse) !important;
        }
        #container > ytd-expander.ytd-video-secondary-info-renderer > #content > #description {
            margin-top: 5px !important;
        }
        #menu.ytd-video-primary-info-renderer {
            display: flex !important;
            justify-content: flex-end !important;
        }
        #primary-inner > #meta > #meta-contents > ytd-video-secondary-info-renderer > #container > ytd-expander {
            margin-left: 0 !important;
        }
        #top-row > ytd-video-owner-renderer > #upload-info > #owner-sub-count, 
		#reduxSubDiv > #owner-sub-count {
            padding-top: 4px;
            margin-left: 4px;
        }
		#above-the-fold #upload-info {
			margin-right: 0 !important;
		}
        #sponsor-button.ytd-video-owner-renderer, #analytics-button.ytd-video-owner-renderer {
            margin-right: 0px;
        }
        #sponsor-button.ytd-video-owner-renderer > ytd-button-renderer, #analytics-button.ytd-video-owner-renderer > ytd-button-renderer {
            margin-right: 4px;
        }
        #notification-preference-button > ytd-subscription-notification-toggle-button-renderer > a > yt-icon-button {
            max-height: 22px; 
            max-width: 22px; 
            padding: 0; 
            margin-right: 5px;
        }
        #meta-contents > ytd-video-secondary-info-renderer > #container > ytd-expander > #content {
            margin-top: 5px;
        }
        #meta ytd-expander[collapsed] > #content.ytd-expander {
            max-height: 65px;
        }
        #menu #top-level-buttons-computed > ytd-toggle-button-renderer > a > yt-icon-button > #button > yt-icon {
            height: 20px;
            width: 20px;
        }
		#info-strings > #dot {
			display: none;
		}
		ytd-video-primary-info-renderer > #container,
		#primary-inner ytd-watch-metadata #owner {
			border-bottom: 1px solid #e2e2e2 !important;
		}
		html[dark] ytd-video-primary-info-renderer > #container,
		html[dark] #primary-inner ytd-watch-metadata #owner {
			border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
		}
		#info ytd-button-renderer.style-default[is-icon-button] #text.ytd-button-renderer {
			font-size: 11px;
			text-transform: none;
		}
		#info ytd-button-renderer.style-default[is-icon-button] svg {
			transform: scale(0.9);
		}
		#subscribe-button > ytd-subscribe-button-renderer > tp-yt-paper-button,
		#subscribe-button > ytd-button-renderer > a > tp-yt-paper-button,
		#subscribe-button > ytd-subscribe-button-renderer yt-button-shape > button,
		#subscribe-button > ytd-button-renderer > yt-button-shape > button,
		#subscribe-button > ytd-button-renderer > yt-button-shape > a[href*="/edit"],
		#sponsor-button > ytd-button-renderer > a > tp-yt-paper-button, 
		#sponsor-button yt-button-shape > button,
		#sponsor-button > ytd-button-renderer > yt-button-shape > button,
		#analytics-button > ytd-button-renderer > a > tp-yt-paper-button,
		#analytics-button yt-button-shape > button,
		#analytics-button > ytd-button-renderer > yt-button-shape > a[href*="/analytics"] {
			margin: 0; 
			padding: 2px 8px 2px 8px; 
			text-transform: none; 
			font-weight: normal; 
			font-size: 12px;
			max-height: 24px;
			height: 24px;
		}
		html[dark] #subscribe-button > ytd-subscribe-button-renderer yt-button-shape > button span,
		html[dark] #subscribe-button > ytd-button-renderer > yt-button-shape > button span {
			color: var(--redux-dimmed-white);
		}
		#top-level-buttons-computed ytd-download-button-renderer yt-formatted-string {
			font-weight: normal;
		}
		#above-the-fold #description,
		#secondary-redux-div #description {
			cursor: initial;
			background-color: transparent;
		}
		#above-the-fold #description-inner,
		#secondary-redux-div #description-inner {
			margin: initial;
			font-size: 1.3rem;
		}
		#above-the-fold #description-inner #description-inline-expander,
		#secondary-redux-div #description-inner #description-inline-expander {
			font-size: 1.3rem;
			line-height: 15px;
		}
		#primary-inner ytd-watch-metadata,
		#secondary-redux-div {
			background-color: var(--redux-spec-brand-background-solid);
			box-shadow: 0 1px 2px var(--redux-box-shadow) !important;
			margin-top: 10px;
			margin-bottom: 8px;
			padding-top: 15px;
			padding-right: 15px;
			padding-left: 15px;
			padding-bottom: 8px;
		}
		#secondary-redux-div,
		#above-the-fold #description {
			padding-top: 10px;
			font-size: 13px;
			color: var(--redux-double-inverse);
			font-weight: 500;
		}
		#above-the-fold #snippet {
			-webkit-mask-image: none !important;
		}
		#secondary-redux-div span {
			display: block;
		}
		#description-inner ytd-watch-info-text,
		#description-inner > #info-container {
			display: none;
		}
		#primary-inner ytd-watch-metadata #title > h1 > yt-formatted-string {
			font-size: 20px;
		}
		#primary-inner ytd-watch-metadata #owner-and-teaser {
			margin-right: 15px;
			padding-bottom: 12px;
			border-bottom: 1px solid var(--redux-spec-10-percent-layer-inverted);
		}
		#primary-inner ytd-watch-metadata #owner {
			margin-top: 0px;
			margin-right: 0px;
			padding-bottom: 12px;
			padding-left: 0px;
			padding-right: 0px;
			border: none;
			justify-content: space-between;
			width: auto;
		}
		#primary-inner ytd-watch-metadata #avatar {
			width: 48px;
			height: 48px;
			margin-right: 16px;
		}
		#primary-inner ytd-watch-metadata #avatar img {
			width: auto;
		}
		#primary-inner ytd-watch-metadata #top-level-buttons-computed yt-formatted-string {
			font-size: 11px;
			font-weight: 500;
		}
		#primary-inner ytd-watch-metadata #comment-teaser {
			display: none;
		}
		#primary-inner ytd-watch-metadata #description-inline-expander {
			max-width: none;
		}
		#primary-inner ytd-watch-metadata #description {
			flex-direction: column !important;
		}
		#primary-inner ytd-watch-metadata #description #expand,
		#primary-inner ytd-watch-metadata #description #collapse {
			left: 0 !important;
			position: relative;
			padding-top: 7px;
		}
		#redux-video-stats {
			display: flex;
			flex-direction: column;
			font-size: 1.8rem !important;
			transform: translateY(27px);
			color: var(--redux-spec-text-secondary);
		}
		[is-theater-mode] #redux-video-stats {
			transform: translateY(26px);
		}
		#redux-views-count {
			font-size: 1.8rem !important;
		}
		segmented-like-dislike-button-view-model .ytSpecButtonShapeNextButtonTextContent,
		segmented-like-dislike-button-view-model dislike-button-view-model button {
			font-size: 1.2rem !important;
			color: var(--redux-spec-text-secondary) !important;
		}
		ytd-video-primary-info-renderer[flex-menu-enabled] #flex.ytd-video-primary-info-renderer,
		ytd-video-primary-info-renderer[flex-menu-enabled] #menu-container.ytd-video-primary-info-renderer {
			display: block !important;
		}
		/* TOP LEVEL ITEMS ORDER AND LOOK*/
		#above-the-fold ytd-menu-renderer {
			margin: 0;
			padding: 0;
		}
		#above-the-fold #top-row yt-icon,
		segmented-like-dislike-button-view-model ytd-lottie-player,
		segmented-like-dislike-button-view-model lottie-component,
		segmented-like-dislike-button-view-model dislike-button-view-model .ytIconWrapperHost {
			width: 17px !important;
			height: 17px !important;
		}
		segmented-like-dislike-button-view-model ytd-lottie-player {
			position: unset !important;
		}
		#above-the-fold #top-row button > div {
			display: flex;
			align-items: center;
			margin-right: 0px;
			padding-top: 1px;
		}
		#above-the-fold #actions {
			margin-top: 6px;
		}
		/* likes, dislikes and share button */
		/* moves likes to the right edge */
		#above-the-fold #actions-inner,
		#above-the-fold #actions-inner > *,
		#above-the-fold #actions-inner > * > * {
			flex: 1 1 auto;
			flex-direction: row;
			display: flex;
			justify-content: flex-start;
		}
		#above-the-fold #top-level-buttons-computed {
			flex: 1 1 auto;
		}
		#above-the-fold #actions-inner #top-level-buttons-computed {
			justify-content: space-between;
			/* FIXES BUTTONS ORDER BUT BREAKS RYD
			display: contents;
			*/
		}
		#above-the-fold segmented-like-dislike-button-view-model {
			order: 99;
			margin-left: auto;
		}
		#above-the-fold #top-level-buttons-computed {
			order: 2;
		}
		/* main buttons like save or clip */
		#above-the-fold #flexible-item-buttons {
			order: 1;
			display: flex;
		}
		#above-the-fold #flexible-item-buttons > * {
			margin: 0;
		}
		#above-the-fold #flexible-item-buttons > * button,
		#above-the-fold #top-level-buttons-computed button,
		#above-the-fold #button-shape button,
		segmented-like-dislike-button-view-model button {
			background-color: unset !important;
			font-size: 12px;
			font-weight: 400;
			padding: 0 10px;
		}
		#above-the-fold #top-level-buttons-computed button animated-rolling-character {
			background-color: unset !important;
			font-size: 12px;
			font-weight: 400;
		}
		segmented-like-dislike-button-view-model #segmented-like-button button::after {
			display: none;
		}
		#above-the-fold #flexible-item-buttons > *:last-child {
			padding-left: 0 !important;
		}
		/* misc button */
		#above-the-fold #button-shape {
			order: 1;
		}
		/* reverse the order within main buttons */
		#above-the-fold #flexible-item-buttons > *:nth-child(1) {
			order: 100;
		}
		#above-the-fold #flexible-item-buttons > *:nth-child(2) {
			order: 99;
		}
		#above-the-fold #flexible-item-buttons > *:nth-child(3) {
			order: 98;
		}
		#above-the-fold #flexible-item-buttons > *:nth-child(4) {
			order: 97;
		}
		#above-the-fold #flexible-item-buttons > *:nth-child(5) {
			order: 96;
		}
		#above-the-fold #flexible-item-buttons > *:nth-child(6) {
			order: 95;
		}
		#above-the-fold #flexible-item-buttons > *:nth-child(7) {
			order: 94;
		}
		#above-the-fold #flexible-item-buttons > *:nth-child(8) {
			order: 93;
		}
		#above-the-fold #flexible-item-buttons > *:nth-child(9) {
			order: 92;
		}
		#above-the-fold #flexible-item-buttons > *:nth-child(10) {
			order: 91;
		}
		#above-the-fold #actions {
			justify-content: flex-start !important;
			flex-direction: row !important;
		}
		#above-the-fold #top-row {
			border: none !important;
			padding: 0 !important;
		}
		`,
		darkerRed: `
		/*DARKER RED*/
		ytd-guide-entry-renderer[active] {
			background-color: #cc181e !important;
		}
		yt-formatted-string#guide-section-title.ytd-guide-section-renderer,
		yt-formatted-string#guide-section-title.ytd-guide-section-renderer a,
		ytd-guide-entry-renderer[is-header] .title.ytd-guide-entry-renderer {
			color: #cc181e !important;
		}
		ytd-mini-guide-entry-renderer[active] .guide-icon.ytd-mini-guide-entry-renderer, ytd-mini-guide-entry-renderer[active] .title.ytd-mini-guide-entry-renderer {
			color: #cc181e !important;
		}
		#progress.ytd-thumbnail-overlay-resume-playback-renderer {
			background-color: #cc181e !important;
		}
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) > tp-yt-paper-button:not([subscribed]):not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button),
		#subscribe-button > ytd-subscribe-button-renderer:not(.style-primary) yt-button-shape > button:not(.ytSpecButtonShapeNextTonal):not([page-subtype="subscriptions"] #subscribe-button yt-button-shape > button),
		#subscribe-button > ytd-button-renderer:not(.style-primary) > a > tp-yt-paper-button:not(.ytSpecButtonShapeNextTonal):not([page-subtype="subscriptions"] #subscribe-button tp-yt-paper-button) {
			background-color: #cc181e !important;
		}
		.badge-style-type-live-now.ytd-badge-supported-renderer {
			color: #cc181e !important;
			border: 1px solid #cc181e !important;
		}
		.ytp-swatch-background-color {
			background-color: #cc181e !important;
		}
		#logo-icon-container svg > g > g:first-child > path {
			fill: #cc181e !important;
		}
		.ytp-settings-button.ytp-hd-quality-badge:after {
			background-color: #cc181e !important;
		}
		.ytp-sb-subscribe {
			background-color: #cc181e !important;
		}
		#selectionBar.paper-tabs, 
		#selectionBar.tp-yt-paper-tabs {
			border-bottom: 2px solid #cc181e !important;
		}
		.yt-tab-group-shape-wiz__slider {
			background-color: #cc181e !important;
		}
		`,
		immersiveFullscreen: `
		[fullscreen] .ytp-overlays-container,
		[fullscreen] .ytp-progress-bar-container,
		[fullscreen] .ytp-left-controls,
		[fullscreen] .ytp-right-controls-left,
		[fullscreen] .ytp-right-controls-right > *:not(.ytp-fullscreen-button),
		[fullscreen] .ytp-fullscreen-grid {
			display: none !important;
		}
		[fullscreen] .ytp-fullscreen-button {
			position: absolute !important;
			right: 0 !important;
		}
		`,
		squareAvatar: `
		#masthead #avatar-btn > yt-img-shadow,
		ytd-popup-container #header yt-img-shadow#avatar { 
			border-radius: 0 !important;
		} 
		`,
		noHomeScalingRe: `
		#page-manager ytd-browse[page-subtype="home"]  {
			margin-left: 8vw !important;
			margin-right: 8vw !important;
		}
		`,
		squareSearch: `
		yt-img-shadow.ytd-video-renderer  {
			border-radius: 0 !important;
		}
		`,
		squareComments: `
		#author-thumbnail yt-img-shadow,
		ytd-creator-heart-renderer yt-img-shadow,
		#creator-thumbnail yt-img-shadow {
			border-radius: 0 !important;
		}
		`,
		extraSidebarStyles: `
		ytd-guide-renderer #sections {
			padding: 1px 22px !important;
		}
		tp-yt-paper-item.ytd-guide-entry-renderer {
			padding: 0px 10px !important;
		}
		#endpoint.yt-simple-endpoint.ytd-guide-entry-renderer,
		tp-yt-paper-item {
			min-height: calc( var(--paper-item-min-height) - 2px ) !important;
			height: calc( var(--paper-item-min-height) - 2px ) !important;
		}
		#guide-section-title.ytd-guide-section-renderer {
			padding: 7px 10px !important;
			font-size: 1.4rem !important;
		}
		ytd-guide-signin-promo-renderer {
			padding: 16px 16px !important;
		}
		ytd-guide-signin-promo-renderer #sign-in-button {
			background-color: var(--redux-sign-in-button-background);
			border-radius: 2px !important;
		}
		ytd-guide-signin-promo-renderer #sign-in-button a {
			color: var(--redux-spec-text-primary-inverse);
			border-radius: 2px !important;
		}
		ytd-guide-signin-promo-renderer #sign-in-button yt-button-shape {
			padding: 0 !important;
		}
		ytd-guide-signin-promo-renderer #sign-in-button yt-button-shape > a {
			padding: 5px 10px !important;
			height: 27px;
		}
		ytd-guide-signin-promo-renderer #sign-in-button div.ytSpecButtonShapeNextIcon,
		ytd-guide-signin-promo-renderer #sign-in-button yt-icon {
			display: none !important;
		}
		ytd-guide-signin-promo-renderer #sign-in-button a {
			margin-left: 0 !important;
			text-transform: none !important;
			font-size: 11px !important;
		}
		`,
		// altVideoLayout: `
		// #info-contents ytd-video-primary-info-renderer > yt-icon-button  {
		// 	transform: translateY(0px) !important;
		// }
		// #info.ytd-video-primary-info-renderer > #menu-container  {
		// 	transform: translateY(0px) !important;
		// 	margin-right: 15px !important;
		// }
		// ytd-video-primary-info-renderer > #container {
		// 	border-bottom: none !important;
		// }
		// #player.ytd-watch-flexy {
		// 	margin-bottom: 0px !important;
		// }
		// #redux-video-header {
		// 	background-color: white; 
		// 	padding: 8px 15px 2px 15px; 
		// 	box-shadow: 0 1px 2px rgb(0 0 0 / 10%) !important;
		// }
		// html[dark] #redux-video-header {
		// 	background-color: #222222;
		// }
		// ytd-video-primary-info-renderer {
		// 	padding: 8px 0px !important;
		// }
		// #top-row.ytd-video-secondary-info-renderer {
		// 	padding-top: 6px !important;
		// 	margin-bottom: 6px !important;
		// }
		// `,
		// altVideoLayoutExtra: `
		// #info.ytd-video-primary-info-renderer > #menu-container #menu {
		// 	color: var(--redux-spec-text-secondary); 
		// 	justify-content: normal !important; 
		// 	margin-top: 1px;
		// }
		// #info.ytd-video-primary-info-renderer > #top-level-buttons ytd-toggle-button-renderer yt-formatted-string {
		// 	display: none !important;
		// }
		// `,
		customTitleFont: `
		#above-the-fold #title yt-formatted-string {
			font-family: "${reduxSettings.titleFontValue}" !important;
		}
		`,
		hideVoiceSearch: `
		#voice-search-button {
			display: none !important;
		}
		`,
		subBorder: `
		#reduxSubDiv > yt-formatted-string,
		#reduxSubDiv > #redux-trim-span {
			border-radius: 0 2px 2px 0;
			padding-left: 7px;
			padding-right: 7px;
			padding-bottom: 1px;
			padding-top: 3px !important;
			margin-left: 0px !important;
			border-top: 1px solid #ccc;
			border-right: 1px solid #ccc;
			border-bottom: 1px solid #ccc;
			max-height: unset !important;
		}
		html[dark] #reduxSubDiv > yt-formatted-string,
		html[dark] #reduxSubDiv > #redux-trim-span {
			border-top: 1px solid var(--redux-spec-10-percent-layer);
			border-right: 1px solid var(--redux-spec-10-percent-layer);
			border-bottom: 1px solid var(--redux-spec-10-percent-layer);
		}
		#redux-trim-span,
		#reduxSubDiv > yt-formatted-string,
		#reduxSubDiv #notification-preference-button {
			background-color: #fafafa;
		}
		#reduxSubDiv #notification-preference-button yt-icon-button {
			margin-right: -7px !important;
		}
		html[dark] #reduxSubDiv > yt-formatted-string,
		html[dark] #reduxSubDiv #notification-preference-button {
			background: none;
		}
		#reduxSubDiv tp-yt-paper-button {
			border-top-right-radius: 0px !important;
			border-bottom-right-radius: 0px !important;
		}
		#reduxSubDiv tp-yt-paper-button[subscribed],
		#reduxSubDiv button.ytSpecButtonShapeNextTonal {
			border: 1px solid #ccc;
			color: var(--redux-spec-text-secondary);
		}
		html[dark] #reduxSubDiv tp-yt-paper-button[subscribed],
		html[dark] #reduxSubDiv button.ytSpecButtonShapeNextTonal {
			border: 1px solid var(--redux-spec-10-percent-layer);
		}
		#notification-preference-button yt-button-shape > button.ytSpecButtonShapeNextTonal::after {
			content: "";
			position: absolute;
			right: 0;
			height: 24px;
			width: 24px;
			border-left: 1px solid #ccc;
		}
		html[dark] #notification-preference-button yt-button-shape > button.ytSpecButtonShapeNextTonal::after {
			border-left: 1px solid var(--redux-spec-10-percent-layer);
		}
		`,
		blackBars: `
		.html5-video-container video {
			background-color: black;
		}
		`,
		classicLikesStyle: `
		#endpoint[href="/playlist?list=LL"] yt-icon:first-of-type {
			content: url('${browser.runtime.getURL('/images/like.png')}') !important;
			filter: contrast(0);
			opacity: 0.66;
			height: 17px !important;
			width: 17px !important;
			padding-left: 3px !important;
		}
		ytd-guide-entry-renderer[active] #endpoint[href="/playlist?list=LL"] yt-icon:first-of-type {
			filter: invert(1);
		}

		/* TOP BUTTONS - LIKE */
		ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:first-of-type > a > yt-icon-button > #button > yt-icon,
		#segmented-like-button yt-icon,
		like-button-view-model yt-icon {
			content: url('${browser.runtime.getURL('/images/like.png')}') !important;
			filter: contrast(0);
			opacity: 0.66;
			height: 17px !important;
			width: 17px !important;
		}

		/* TOP BUTTONS - DISLIKE */
		ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:last-of-type > a > yt-icon-button > #button > yt-icon,
		#segmented-dislike-button yt-icon,
		dislike-button-view-model yt-icon,
		dislike-button-view-model .ytIconWrapperHost {
			content: url('${browser.runtime.getURL('/images/dislike.png')}') !important;
			filter: contrast(0);
			opacity: 0.66;
			height: 17px !important;
			width: 17px !important;
		}

		/* TOP + COMMENTS BUTTONS HOVER EFFECT - LIKE + DISLIKE */
		#top-level-buttons-computed > ytd-toggle-button-renderer:first-of-type > a > yt-icon-button > #button > yt-icon:hover,
		#top-level-buttons-computed > ytd-toggle-button-renderer:last-of-type > a > yt-icon-button > #button > yt-icon:hover,
		like-button-view-model yt-icon:hover,
		dislike-button-view-model .ytIconWrapperHost:hover,
		ytd-comment-action-buttons-renderer #like-button yt-icon:hover,
		ytd-toggle-button-renderer#like-button .ytIconWrapperHost:hover,
		ytd-comment-action-buttons-renderer #dislike-button yt-icon:hover,
		ytd-toggle-button-renderer#dislike-button .ytIconWrapperHost:hover {
			filter: contrast(0.25);
		}

		/* COMMENTS BUTTONS - LIKE */
		ytd-comment-action-buttons-renderer #like-button yt-icon,
		ytd-toggle-button-renderer#like-button yt-icon,
		ytd-toggle-button-renderer#like-button .ytIconWrapperHost > span {
			content: url('${browser.runtime.getURL('/images/like.png')}') !important;
			filter: contrast(0);
			opacity: 0.66;
			height: 17px !important;
			width: 17px !important;
		}

		/* COMMENTS BUTTONS - DISLIKE */
		ytd-comment-action-buttons-renderer #dislike-button yt-icon,
		ytd-toggle-button-renderer#dislike-button yt-icon,
		ytd-toggle-button-renderer#dislike-button .ytIconWrapperHost > span {
			content: url('${browser.runtime.getURL('/images/dislike.png')}') !important;
			filter: contrast(0);
			opacity: 0.66;
			height: 17px !important;
			width: 17px !important;
		}

		/* TOP + COMMENTS BUTTONS - LIKE: PRESSED */
		ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:first-of-type > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
		ytd-comment-action-buttons-renderer #like-button #button[aria-pressed="true"] yt-icon,
		ytd-comment-action-buttons-renderer #like-button button[aria-pressed="true"] yt-icon,
		ytd-toggle-button-renderer#like-button button[aria-pressed="true"] yt-icon,
		ytd-toggle-button-renderer#like-button button[aria-pressed="true"] .ytIconWrapperHost > span,
		#segmented-like-button button[aria-pressed="true"] yt-icon,
		like-button-view-model button[aria-pressed="true"] yt-icon {
			content: url('${browser.runtime.getURL('/images/like-pressed.png')}') !important;
			filter: contrast(1);
			opacity: 1;
		}
			
		/* TOP + COMMENTS BUTTONS - DISLIKE: PRESSED */
		ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:last-of-type > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
		ytd-comment-action-buttons-renderer #dislike-button #button[aria-pressed="true"] yt-icon,
		ytd-comment-action-buttons-renderer #dislike-button button[aria-pressed="true"] yt-icon,
		ytd-toggle-button-renderer#dislike-button button[aria-pressed="true"] yt-icon,
		ytd-toggle-button-renderer#dislike-button button[aria-pressed="true"] .ytIconWrapperHost > span,
		#segmented-dislike-button button[aria-pressed="true"] yt-icon,
		dislike-button-view-model button[aria-pressed="true"] .ytIconWrapperHost {
			content: url('${browser.runtime.getURL('/images/dislike-pressed.png')}') !important;
			filter: contrast(1);
			opacity: 1;
		}
		`,
		classicLikesIconColors: `
		/* COMMENTS BUTTONS - LIKE: PRESSED */
		ytd-toggle-button-renderer#like-button button[aria-pressed="true"] .ytIconWrapperHost > span {
			filter: invert(19%) sepia(98%) saturate(4292%) hue-rotate(143deg) brightness(98%) contrast(103%);
		}

		/* COMMENTS BUTTONS - DISLIKE: PRESSED */
		ytd-toggle-button-renderer#dislike-button button[aria-pressed="true"] .ytIconWrapperHost > span {
			filter: brightness(0) saturate(100%) invert(10%) sepia(91%) saturate(5539%) hue-rotate(340deg) brightness(101%) contrast(108%);
		}

		/* TOP LIKES COUNT TEXT COLOR */
		#top-level-buttons-computed like-button-view-model button[aria-pressed="true"] > div:last-of-type {
			color: rgb(0 136 29) !important;
		}

		/* TOP DISLIKES COUNT TEXT COLOR */
		#top-level-buttons-computed dislike-button-view-model button[aria-pressed="true"] > div:last-of-type {
			color: rgb(222 0 17) !important;
		}
		`,
		classicLikesIconColorsExtra: `
		/* TOP BUTTONS - LIKE: PRESSED */
		like-button-view-model button[aria-pressed="true"] yt-icon {
			content: url('${browser.runtime.getURL('/images/like-pressed-old.png')}') !important;
			filter: contrast(1);
		}
		dislike-button-view-model button[aria-pressed="true"] .ytIconWrapperHost {
			content: url('${browser.runtime.getURL('/images/dislike-pressed-old.png')}') !important;
			filter: contrast(1);
		}
		`,
		hideJoinButton: `
		#sponsor-button.ytd-video-owner-renderer {
			display: none !important;
		}
		`,
		altStrings: `
		#date > yt-formatted-string::before, 
		#redux-moved-date::before {
			content: 'Published on ';
		}
		`,
		altUploadIcon: `
		#end ytd-button-renderer:first-child button {
			background: none;
			padding: 0;
		}
		#end ytd-button-renderer:first-child span[role="text"] {
			display: none;
		}
		#end ytd-button-renderer:first-child .ytSpecButtonShapeNextIcon {
			content: url('${browser.runtime.getURL('/images/old-upload.svg')}') !important;
			filter: contrast(0.25);
			height: 20px;
			width: 17px;
		}
		ytd-masthead[dark] #end ytd-button-renderer:first-child .ytSpecButtonShapeNextIcon {
			content: url('${browser.runtime.getURL('/images/old-upload-dark.svg')}') !important;
			filter: contrast(1);
			height: 20px;
			width: 17px;
		}
		`,
		extraChannel: `
		[page-subtype="channels"] #header.ytd-browse {
			max-width: var(--ytd-grid-max-width) !important;
		}
		ytd-c4-tabbed-header-renderer[has-channel-art][guide-persistent-and-visible] .banner-visible-area.ytd-c4-tabbed-header-renderer {
			max-height: 212px;
		}
		ytd-two-column-browse-results-renderer[page-subtype="channels"] {
			margin-top: 10px;
		}
		[page-subtype="channels"] #channel-header,
		[page-subtype="channels"] #tabsContainer,
		[page-subtype="channels"] #tabs-inner-container {
			background: white !important;
		}
		html[dark] [page-subtype="channels"] #channel-header,
		html[dark] [page-subtype="channels"] #tabsContainer,
		html[dark] [page-subtype="channels"] #tabs-inner-container {
			background: #222222 !important;
		}
		[page-subtype="channels"] #page-header,
		[page-subtype="channels"] #tabsContainer {
			padding-left: 10px !important;
    		padding-right: 10px !important;
		}
		[page-subtype="channels"] ytd-rich-grid-renderer {
			--ytd-rich-grid-items-per-row: ${reduxSettings.gridItems} !important;
		}
		`,
		noPlayerActionAnimations: `
		#ytd-player .ytp-bezel,
		#ytd-player .ytp-seek-overlay,
		.ytp-doubletap-ui,
		.ytp-doubletap-ui-legacy {
			display: none !important;
		}
		`,
		altLoader: `
		html {
			--redux-spinner-margin: max(-1.458vw, -28px);
			--redux-spinner-font: min(1.458vw, 28px);
		}
		.ytp-spinner-container {
			display: none !important;
		}
		.ytp-spinner {
			margin-top: var(--redux-spinner-margin, -28px);
			margin-left: -22px !important;
    		font-size: var(--redux-spinner-font, 28px);
			width: 2.604vw !important;
			height: 2.604vw !important;
			max-width: 50px !important;
    		max-height: 50px !important;
			border-radius: 50%;
			-webkit-animation: load5 0.7s infinite ease;
			animation: load5 0.7s infinite ease;
			-webkit-transform: translateZ(0);
			-ms-transform: translateZ(0);
			transform: translateZ(0);
		  }
		
		@-webkit-keyframes load5 {
			0%,
			100% {
			  box-shadow: 0em -2.6em 0em 0em #ffffff, 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.7), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.9);
			}
			12.5% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.9), 1.8em -1.8em 0 0em #ffffff, 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7);
			}
			25% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.7), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.9), 2.5em 0em 0 0em #ffffff, 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			37.5% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7), 2.5em 0em 0 0em rgba(255, 255, 255, 0.9), 1.75em 1.75em 0 0em #ffffff, 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			50% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.7), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.9), 0em 2.5em 0 0em #ffffff, -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			62.5% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.7), 0em 2.5em 0 0em rgba(255, 255, 255, 0.9), -1.8em 1.8em 0 0em #ffffff, -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			75% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.7), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.9), -2.6em 0em 0 0em #ffffff, -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			87.5% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.7), -2.6em 0em 0 0em rgba(255, 255, 255, 0.9), -1.8em -1.8em 0 0em #ffffff;
			}
		  }
		  @keyframes load5 {
			0%,
			100% {
			  box-shadow: 0em -2.6em 0em 0em #ffffff, 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.7), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.9);
			}
			12.5% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.9), 1.8em -1.8em 0 0em #ffffff, 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7);
			}
			25% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.7), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.9), 2.5em 0em 0 0em #ffffff, 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			37.5% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7), 2.5em 0em 0 0em rgba(255, 255, 255, 0.9), 1.75em 1.75em 0 0em #ffffff, 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			50% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.7), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.9), 0em 2.5em 0 0em #ffffff, -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.25), -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			62.5% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.7), 0em 2.5em 0 0em rgba(255, 255, 255, 0.9), -1.8em 1.8em 0 0em #ffffff, -2.6em 0em 0 0em rgba(255, 255, 255, 0.25), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			75% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.7), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.9), -2.6em 0em 0 0em #ffffff, -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25);
			}
			87.5% {
			  box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.25), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.25), 2.5em 0em 0 0em rgba(255, 255, 255, 0.25), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.25), 0em 2.5em 0 0em rgba(255, 255, 255, 0.25), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.7), -2.6em 0em 0 0em rgba(255, 255, 255, 0.9), -1.8em -1.8em 0 0em #ffffff;
			}
		  }
		`,
		altLoaderSmaller: `
		.ytp-spinner {
			margin-top: -10px;
			margin-left: -8px !important;
    		font-size: 10px;
			width: 1vw !important;
			height: 1vw !important;
			max-width: 18px !important;
    		max-height: 18px !important;
			border-radius: 50%;
			-webkit-animation: load5 0.7s infinite ease;
			animation: load5 0.7s infinite ease;
			-webkit-transform: translateZ(0);
			-ms-transform: translateZ(0);
			transform: translateZ(0);
		  }
		`,
		oldIcons: `
		/* Create */
		path[d="M14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2zm3-7H3v12h14v-6.39l4 1.83V8.56l-4 1.83V6m1-1v3.83L22 7v8l-4-1.83V19H2V5h16z"] {
			d: path("M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z") !important;
		}
		ytd-masthead#masthead:not([dark]) path[d="M14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2zm3-7H3v12h14v-6.39l4 1.83V8.56l-4 1.83V6m1-1v3.83L22 7v8l-4-1.83V19H2V5h16z"] {
			fill: #606060;
		}
		/* YouTube Apps */
		path[d="M16,4v4h4V4H16z M19,7h-2V5h2V7z M16,10v4h4v-4H16z M19,13h-2v-2h2V13z M10,4v4h4V4H10z M13,7h-2V5h2V7z M10,10v4h4v-4H10z M13,13h-2v-2h2V13z M16,16v4h4v-4H16z M19,19h-2v-2h2V19z M10,16v4h4v-4H10z M13,19h-2v-2h2V19z M4,4v4h4V4H4z M7,7H5V5h2V7z M4,10 v4h4v-4H4z M7,13H5v-2h2V13z M4,16v4h4v-4H4z M7,19H5v-2h2V19z"] {
			d: path("M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z") !important;
		}
		ytd-masthead#masthead:not([dark]) path[d="M16,4v4h4V4H16z M19,7h-2V5h2V7z M16,10v4h4v-4H16z M19,13h-2v-2h2V13z M10,4v4h4V4H10z M13,7h-2V5h2V7z M10,10v4h4v-4H10z M13,13h-2v-2h2V13z M16,16v4h4v-4H16z M19,19h-2v-2h2V19z M10,16v4h4v-4H10z M13,19h-2v-2h2V19z M4,4v4h4V4H4z M7,7H5V5h2V7z M4,10 v4h4v-4H4z M7,13H5v-2h2V13z M4,16v4h4v-4H4z M7,19H5v-2h2V19z"] {
			fill: #606060;
		}
		/* Notifications */
		ytd-masthead path[d="M16 19a4 4 0 11-8 0H4.765C3.21 19 2.25 17.304 3.05 15.97l1.806-3.01A1 1 0 005 12.446V8a7 7 0 0114 0v4.446c0 .181.05.36.142.515l1.807 3.01c.8 1.333-.161 3.029-1.716 3.029H16ZM12 3a5 5 0 00-5 5v4.446a3 3 0 01-.428 1.543L4.765 17h14.468l-1.805-3.01A3 3 0 0117 12.445V8a5 5 0 00-5-5Zm-2 16a2 2 0 104 0h-4Z"] {
			d: path("M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z") !important;
		}
		ytd-masthead#masthead:not([dark]) path[d="M16 19a4 4 0 11-8 0H4.765C3.21 19 2.25 17.304 3.05 15.97l1.806-3.01A1 1 0 005 12.446V8a7 7 0 0114 0v4.446c0 .181.05.36.142.515l1.807 3.01c.8 1.333-.161 3.029-1.716 3.029H16ZM12 3a5 5 0 00-5 5v4.446a3 3 0 01-.428 1.543L4.765 17h14.468l-1.805-3.01A3 3 0 0117 12.445V8a5 5 0 00-5-5Zm-2 16a2 2 0 104 0h-4Z"] {
			fill: #606060;
		}
		/* Hamburger menu */
		path[d="M20 5H4a1 1 0 000 2h16a1 1 0 100-2Zm0 6H4a1 1 0 000 2h16a1 1 0 000-2Zm0 6H4a1 1 0 000 2h16a1 1 0 000-2Z"] {
			d: path("M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z") !important;
		}
		/* Home */
		path[d="m11.485 2.143-8 4.8-2 1.2a1 1 0 001.03 1.714L3 9.567V20a2 2 0 002 2h5v-8h4v8h5a2 2 0 002-2V9.567l.485.29a1 1 0 001.03-1.714l-2-1.2-8-4.8a1 1 0 00-1.03 0Z"] {
			d: path("M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8") !important;
		}
		/* Home - inactive */
		path[d="m11.485 2.143-8 4.8-2 1.2a1 1 0 001.03 1.714L3 9.567V20a2 2 0 002 2h6v-7h2v7h6a2 2 0 002-2V9.567l.485.29a1 1 0 001.03-1.714l-2-1.2-8-4.8a1 1 0 00-1.03 0ZM5 8.366l7-4.2 7 4.2V20h-4v-5.5a1.5 1.5 0 00-1.5-1.5h-3A1.5 1.5 0 009 14.5V20H5V8.366Z"] {
			d: path("M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8") !important;
		}
		/* Explore */
		path[d="M9.8,9.8l-3.83,8.23l8.23-3.83l3.83-8.23L9.8,9.8z M13.08,12.77c-0.21,0.29-0.51,0.48-0.86,0.54 c-0.07,0.01-0.15,0.02-0.22,0.02c-0.28,0-0.54-0.08-0.77-0.25c-0.29-0.21-0.48-0.51-0.54-0.86c-0.06-0.35,0.02-0.71,0.23-0.99 c0.21-0.29,0.51-0.48,0.86-0.54c0.35-0.06,0.7,0.02,0.99,0.23c0.29,0.21,0.48,0.51,0.54,0.86C13.37,12.13,13.29,12.48,13.08,12.77z M12,3c4.96,0,9,4.04,9,9s-4.04,9-9,9s-9-4.04-9-9S7.04,3,12,3 M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2 L12,2z"] {
			d: path("M11.23 13.08c-.29-.21-.48-.51-.54-.86-.06-.35.02-.71.23-.99.21-.29.51-.48.86-.54.35-.06.7.02.99.23.29.21.48.51.54.86.06.35-.02.71-.23.99a1.327 1.327 0 01-1.08.56c-.28 0-.55-.08-.77-.25zM22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10zm-3.97-6.03L9.8 9.8l-3.83 8.23 8.23-3.83 3.83-8.23z") !important;
		}
		/* Subscriptions */
		path[d="M10 18v-6l5 3-5 3zm7-15H7v1h10V3zm3 3H4v1h16V6zm2 3H2v12h20V9zM3 10h18v10H3V10z"] {
			d: path("M18.7 8.7H5.3V7h13.4v1.7zm-1.7-5H7v1.6h10V3.7zm3.3 8.3v6.7c0 1-.7 1.6-1.6 1.6H5.3c-1 0-1.6-.7-1.6-1.6V12c0-1 .7-1.7 1.6-1.7h13.4c1 0 1.6.8 1.6 1.7zm-5 3.3l-5-2.7V18l5-2.7z") !important;
		}
		/* Library */
		path[d="M11,7l6,3.5L11,14V7L11,7z M18,20H4V6H3v15h15V20z M21,18H6V3h15V18z M7,17h13V4H7V17z"] {
			d: path("M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z") !important;
		}
		/* History */
		path[d="M8.76 1.487a11 11 0 11-7.54 12.706 1 1 0 011.96-.4 9 9 0 0014.254 5.38A9 9 0 0016.79 4.38 9 9 0 004.518 7H7a1 1 0 010 2H1V3a1 1 0 012 0v2.678a11 11 0 015.76-4.192ZM12 6a1 1 0 00-1 1v5.58l.504.288 3.5 2a1 1 0 10.992-1.736L13 11.42V7a1 1 0 00-1-1Z"] {
			d: path("M11.9 3.75c-4.55 0-8.23 3.7-8.23 8.25H.92l3.57 3.57.04.13 3.7-3.7H5.5c0-3.54 2.87-6.42 6.42-6.42 3.54 0 6.4 2.88 6.4 6.42s-2.86 6.42-6.4 6.42c-1.78 0-3.38-.73-4.54-1.9l-1.3 1.3c1.5 1.5 3.55 2.43 5.83 2.43 4.58 0 8.28-3.7 8.28-8.25 0-4.56-3.7-8.25-8.26-8.25zM11 8.33v4.6l3.92 2.3.66-1.1-3.2-1.9v-3.9H11z") !important;
		}
		/* History - active */
		path[d="M8.76 1.487a11 11 0 11-7.54 12.706 1 1 0 011.96-.4 9 9 0 0014.254 5.38A9 9 0 0016.79 4.38 9 9 0 004.518 7H7a1 1 0 010 2H1V3a1 1 0 012 0v2.678a11 11 0 015.76-4.192ZM12 6a1 1 0 00-1 1v5.58l.504.288 3.5 2a1 1 0 10.992-1.736L13 11.42V7a1 1 0 00-1-1Z"] {
			d: path("M11.9 3.75c-4.55 0-8.23 3.7-8.23 8.25H.92l3.57 3.57.04.13 3.7-3.7H5.5c0-3.54 2.87-6.42 6.42-6.42 3.54 0 6.4 2.88 6.4 6.42s-2.86 6.42-6.4 6.42c-1.78 0-3.38-.73-4.54-1.9l-1.3 1.3c1.5 1.5 3.55 2.43 5.83 2.43 4.58 0 8.28-3.7 8.28-8.25 0-4.56-3.7-8.25-8.26-8.25zM11 8.33v4.6l3.92 2.3.66-1.1-3.2-1.9v-3.9H11z") !important;
		}
		/* Your videos */
		path[d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2ZM3 19V5h18v14H3Zm13-7L9.5 8v8l6.5-4Z"] {
			d: path("M18.4 5.6v12.8H5.6V5.6h12.8zm0-1.8H5.6a1.8 1.8 0 0 0-1.8 1.8v12.8a1.8 1.8 0 0 0 1.8 1.9h12.8a1.8 1.8 0 0 0 1.9-1.9V5.6a1.8 1.8 0 0 0-1.9-1.8z M10.2 9v6.5l5-3.2-5-3.2z") !important;
		}
		/* Watch later */
		path[d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 110 18.001A9 9 0 0112 3Zm0 3a1 1 0 00-1 1v5.565l.485.292 3.33 2a1 1 0 001.03-1.714L13 11.435V7a1 1 0 00-1-1Z"] {
			d: path("M12 3.67c-4.58 0-8.33 3.75-8.33 8.33s3.75 8.33 8.33 8.33 8.33-3.75 8.33-8.33S16.58 3.67 12 3.67zm3.5 11.83l-4.33-2.67v-5h1.25v4.34l3.75 2.25-.67 1.08z") !important;
		}
		path[d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 110 18.001A9 9 0 0112 3Zm0 3a1 1 0 00-1 1v5.565l.485.292 3.33 2a1 1 0 001.03-1.714L13 11.435V7a1 1 0 00-1-1Z"]:not(#hover-overlays path[d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 110 18.001A9 9 0 0112 3Zm0 3a1 1 0 00-1 1v5.565l.485.292 3.33 2a1 1 0 001.03-1.714L13 11.435V7a1 1 0 00-1-1Z"]) {
			fill: #909090;
		}
		/* Like not pressed */
		path[d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6 C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z"] {
			d: path("M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z") !important;
			fill: #909090;
		}
		#segmented-like-button button[aria-pressed="false"] ytd-lottie-player,
		like-button-view-model button[aria-pressed="false"] ytd-lottie-player {
			display: flex;
			align-items: center;
			justify-content: center;
		}
		#segmented-like-button button[aria-pressed="false"] lottie-component,
		like-button-view-model button[aria-pressed="false"] lottie-component {
			content: url('${browser.runtime.getURL('/images/like-default-filled.svg')}') !important;
			filter: invert(62%) sepia(0%) saturate(655%) hue-rotate(171deg) brightness(92%) contrast(85%);
		}
		/* Like pressed */
		path[d="M3,11h3v10H3V11z M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11v10h10.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z"] {
			d: path("M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z") !important;
		}
		/* Like comment not pressed */
		path[d="M12.42,14A1.54,1.54,0,0,0,14,12.87l1-4.24C15.12,7.76,15,7,14,7H10l1.48-3.54A1.17,1.17,0,0,0,10.24,2a1.49,1.49,0,0,0-1.08.46L5,7H1v7ZM9.89,3.14A.48.48,0,0,1,10.24,3a.29.29,0,0,1,.23.09S9,6.61,9,6.61L8.46,8H14c0,.08-1,4.65-1,4.65a.58.58,0,0,1-.58.35H6V7.39ZM2,8H5v5H2Z"] {
			d: path("M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z") !important;
			/* transform: scale(0.4449484) translate(4px, 6px); */
		}
		html:not([dark]) path[d="M12.42,14A1.54,1.54,0,0,0,14,12.87l1-4.24C15.12,7.76,15,7,14,7H10l1.48-3.54A1.17,1.17,0,0,0,10.24,2a1.49,1.49,0,0,0-1.08.46L5,7H1v7ZM9.89,3.14A.48.48,0,0,1,10.24,3a.29.29,0,0,1,.23.09S9,6.61,9,6.61L8.46,8H14c0,.08-1,4.65-1,4.65a.58.58,0,0,1-.58.35H6V7.39ZM2,8H5v5H2Z"] {
			fill: #909090;
		}
		#like-button.ytd-comment-action-buttons-renderer button[aria-pressed="false"] svg {
		}
		/* Like comment pressed */
		#like-button.ytd-comment-action-buttons-renderer button[aria-pressed="true"] svg {
		}
		/* Dislike not pressed */
		path[d="M17 4H6.57c-1.07 0-1.98.67-2.19 1.61l-1.34 6C2.77 12.85 3.82 14 5.23 14h4.23l-1.52 4.94C7.62 19.97 8.46 21 9.62 21c.58 0 1.14-.24 1.52-.65L17 14h4V4h-4zm-6.6 15.67c-.19.21-.48.33-.78.33-.26 0-.5-.11-.63-.3-.07-.1-.15-.26-.09-.47l1.52-4.94.4-1.29H5.23c-.41 0-.8-.17-1.03-.46-.12-.15-.25-.4-.18-.72l1.34-6c.1-.47.61-.82 1.21-.82H16v8.61l-5.6 6.06zM20 13h-3V5h3v8z"] {
			d: path("M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z") !important;
			fill: #909090;
		}
		/* Dislike pressed */
		path[d="M18 4h3v10h-3V4zM5.23 14h4.23l-1.52 4.94C7.62 19.97 8.46 21 9.62 21c.58 0 1.14-.24 1.52-.65L17 14V4H6.57c-1.07 0-1.98.67-2.19 1.61l-1.34 6C2.77 12.85 3.82 14 5.23 14z"] {
			d: path("M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z") !important;
		}
		/* Dislike comment not pressed */
		path[d="M3.54,2A1.55,1.55,0,0,0,2,3.13L1,7.37C.83,8.24,1,9,2,9H6L4.52,12.54A1.17,1.17,0,0,0,5.71,14a1.49,1.49,0,0,0,1.09-.46L11,9h4V2ZM6.07,12.86a.51.51,0,0,1-.36.14.28.28,0,0,1-.22-.09l0-.05L6.92,9.39,7.5,8H2a1.5,1.5,0,0,1,0-.41L3,3.35A.58.58,0,0,1,3.54,3H10V8.61ZM14,8H11l0-5h3Z"] {
			d: path("M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z") !important;
			/* transform: scale(0.4449484) translate(4px, 6px); */
		}
		html:not([dark]) path[d="M3.54,2A1.55,1.55,0,0,0,2,3.13L1,7.37C.83,8.24,1,9,2,9H6L4.52,12.54A1.17,1.17,0,0,0,5.71,14a1.49,1.49,0,0,0,1.09-.46L11,9h4V2ZM6.07,12.86a.51.51,0,0,1-.36.14.28.28,0,0,1-.22-.09l0-.05L6.92,9.39,7.5,8H2a1.5,1.5,0,0,1,0-.41L3,3.35A.58.58,0,0,1,3.54,3H10V8.61ZM14,8H11l0-5h3Z"] {
			fill: #909090
		}
		#dislike-button.ytd-comment-action-buttons-renderer button[aria-pressed="false"] svg {
		}
		/* Dislike comment pressed */
		#dislike-button.ytd-comment-action-buttons-renderer button[aria-pressed="true"] svg {
		}
		/* Browse plus */
		path[d="M17,13h-4v4h-2v-4H7v-2h4V7h2v4h4V13z M12,3c-4.96,0-9,4.04-9,9s4.04,9,9,9c4.96,0,9-4.04,9-9S16.96,3,12,3 M12,2 c5.52,0,10,4.48,10,10s-4.48,10-10,10C6.48,22,2,17.52,2,12S6.48,2,12,2L12,2z"] {
			d: path("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z") !important;
		}
		/* Premium */
		path[d="M10,9.35,15,12l-5,2.65ZM12,6a54.36,54.36,0,0,0-7.56.38A1.53,1.53,0,0,0,3.38,7.44,24.63,24.63,0,0,0,3,12a24.63,24.63,0,0,0,.38,4.56,1.53,1.53,0,0,0,1.06,1.06A54.36,54.36,0,0,0,12,18a54.36,54.36,0,0,0,7.56-.38,1.53,1.53,0,0,0,1.06-1.06A24.63,24.63,0,0,0,21,12a24.63,24.63,0,0,0-.38-4.56,1.53,1.53,0,0,0-1.06-1.06A54.36,54.36,0,0,0,12,6h0m0-1s6.25,0,7.81.42a2.51,2.51,0,0,1,1.77,1.77A25.87,25.87,0,0,1,22,12a25.87,25.87,0,0,1-.42,4.81,2.51,2.51,0,0,1-1.77,1.77C18.25,19,12,19,12,19s-6.25,0-7.81-.42a2.51,2.51,0,0,1-1.77-1.77A25.87,25.87,0,0,1,2,12a25.87,25.87,0,0,1,.42-4.81A2.51,2.51,0,0,1,4.19,5.42C5.75,5,12,5,12,5Z"] {
			d: path("M21.78 8s-.2-1.37-.8-1.97c-.75-.8-1.6-.8-2-.85C16.2 4.98 12 5 12 5s-4.18-.02-6.97.18c-.4.05-1.24.05-2 .85-.6.6-.8 1.97-.8 1.97s-.2 1.63-.23 3.23v1.7c.03 1.6.23 3.2.23 3.2s.2 1.4.8 2c.76.8 1.75.76 2.2.85 1.57.15 6.6.18 6.77.18 0 0 4.2 0 7-.2.38-.04 1.23-.04 2-.84.6-.6.8-1.98.8-1.98s.2-1.6.2-3.22v-1.7c-.02-1.6-.22-3.22-.22-3.22zm-11.8 7V9.16l5.35 3.03L9.97 15z") !important;
		}
		/* Movies */
		path[d="M20 3H4a3 3 0 00-2.587 1.485l-.001.003-.01.015-.072.133-.037.077a3.046 3.046 0 00-.264.869l-.002.011-.011.1-.005.063-.005.06A3.004 3.004 0 001 6v12a3 3 0 003 3h16a3 3 0 003-3V6a3 3 0 00-3-3ZM4 5h1.986l2 2-2 2H3v-.686L4.313 7 3.04 5.725A1 1 0 014 5Zm13.315 2-2-2h3.67l2 2-2 2h-3.67l2-2Zm-6.5 0L8.814 5h3.672l2 2-2 2H8.815l2-2ZM3 18v-7h18v7a1 1 0 01-1 1H4a1 1 0 01-1-1Z"] {
			d: path("M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z") !important;
		}
		/* Gaming */
		path[d="M15.97 2.615 12 4.998 8.03 2.615a2 2 0 00-2.06 0l-5 3A2 2 0 000 7.33v7.34a2 2 0 00.97 1.715l10 6c.634.38 1.426.38 2.06 0l10-6A1.998 1.998 0 0024 14.67V7.33a2 2 0 00-.97-1.715l-5-3a2 2 0 00-2.06 0ZM12 7.33l5-3 5 3v7.34l-10 6-10-6V7.33l5-3 5 3ZM7 7.5a1 1 0 00-1 1v1.502H4.5a1 1 0 000 2H6V13.5a1 1 0 102 0v-1.498h1.5a1 1 0 000-2H8V8.5a1 1 0 00-1-1Zm11.5 1.502a1.5 1.5 0 100 3 1.5 1.5 0 000-3Zm-4 2a1.5 1.5 0 100 3 1.5 1.5 0 000-3Z"] {
			d: path("M22,13V8l-5-3l-5,3l0,0L7,5L2,8v5l10,6L22,13z M9,11H7v2H6v-2H4v-1h2V8h1v2h2V11z M15,13 c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S15.55,13,15,13z M18,11c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S18.55,11,18,11z") !important;
		}
		/* Live */
		path[d="M4.222 4.223a11 11 0 000 15.555 1 1 0 101.414-1.414 9 9 0 010-12.727 1 1 0 10-1.414-1.414Zm13.79.353a1 1 0 000 1.414 8.5 8.5 0 010 12.022 1 1 0 001.413 1.414 10.501 10.501 0 000-14.85 1 1 0 00-1.413 0Zm-2.83 2.827a1 1 0 000 1.414 4.501 4.501 0 010 6.365 1.001 1.001 0 001.414 1.414 6.5 6.5 0 000-9.193 1 1 0 00-1.415 0Zm-7.78 0a6.5 6.5 0 000 9.194 1 1 0 001.415-1.415 4.5 4.5 0 010-6.364 1.001 1.001 0 00-1.415-1.415ZM12 10a2 2 0 100 4 2 2 0 000-4Z"] {
			d: path("M16.94 6.91l-1.41 1.45c.9.94 1.46 2.22 1.46 3.64s-.56 2.71-1.46 3.64l1.41 1.45c1.27-1.31 2.05-3.11 2.05-5.09s-.78-3.79-2.05-5.09zM19.77 4l-1.41 1.45C19.98 7.13 21 9.44 21 12.01c0 2.57-1.01 4.88-2.64 6.54l1.4 1.45c2.01-2.04 3.24-4.87 3.24-7.99 0-3.13-1.23-5.96-3.23-8.01zM7.06 6.91c-1.27 1.3-2.05 3.1-2.05 5.09s.78 3.79 2.05 5.09l1.41-1.45c-.9-.94-1.46-2.22-1.46-3.64s.56-2.71 1.46-3.64L7.06 6.91zM5.64 5.45L4.24 4C2.23 6.04 1 8.87 1 11.99c0 3.13 1.23 5.96 3.23 8.01l1.41-1.45C4.02 16.87 3 14.56 3 11.99s1.01-4.88 2.64-6.54z M 9, 12a 3,3 0 1,1 6,0a 3,3 0 1,1 -6,0") !important;
		}
		/* Settings */
		path[d="M12.844 1h-1.687a2 2 0 00-1.962 1.616 3 3 0 01-3.92 2.263 2 2 0 00-2.38.891l-.842 1.46a2 2 0 00.417 2.507 3 3 0 010 4.525 2 2 0 00-.417 2.507l.843 1.46a2 2 0 002.38.892 3.001 3.001 0 013.918 2.263A2 2 0 0011.157 23h1.686a2 2 0 001.963-1.615 3.002 3.002 0 013.92-2.263 2 2 0 002.38-.892l.842-1.46a2 2 0 00-.418-2.507 3 3 0 010-4.526 2 2 0 00.418-2.508l-.843-1.46a2 2 0 00-2.38-.891 3 3 0 01-3.919-2.263A2 2 0 0012.844 1Zm-1.767 2.347a6 6 0 00.08-.347h1.687a4.98 4.98 0 002.407 3.37 4.98 4.98 0 004.122.4l.843 1.46A4.98 4.98 0 0018.5 12a4.98 4.98 0 001.716 3.77l-.843 1.46a4.98 4.98 0 00-4.123.4A4.979 4.979 0 0012.843 21h-1.686a4.98 4.98 0 00-2.408-3.371 4.999 4.999 0 00-4.12-.399l-.844-1.46A4.979 4.979 0 005.5 12a4.98 4.98 0 00-1.715-3.77l.842-1.459a4.98 4.98 0 004.123-.399 4.981 4.981 0 002.327-3.025ZM16 12a4 4 0 11-7.999 0 4 4 0 018 0Zm-4 2a2 2 0 100-4 2 2 0 000 4Z"] {
			d: path("M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.1-1.65c.2-.15.25-.42.13-.64l-2-3.46c-.12-.22-.4-.3-.6-.22l-2.5 1c-.52-.4-1.08-.73-1.7-.98l-.37-2.65c-.06-.24-.27-.42-.5-.42h-4c-.27 0-.48.18-.5.42l-.4 2.65c-.6.25-1.17.6-1.7.98l-2.48-1c-.23-.1-.5 0-.6.22l-2 3.46c-.14.22-.08.5.1.64l2.12 1.65c-.04.32-.07.65-.07.98s.02.66.06.98l-2.1 1.65c-.2.15-.25.42-.13.64l2 3.46c.12.22.4.3.6.22l2.5-1c.52.4 1.08.73 1.7.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.6-.25 1.17-.6 1.7-.98l2.48 1c.23.1.5 0 .6-.22l2-3.46c.13-.22.08-.5-.1-.64l-2.12-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z") !important;
		}
		/* Sports */
		path[d="M17.5 1h-11A1.5 1.5 0 005 2.5V4H2a1 1 0 00-1 1v3a5 5 0 004.669 4.987 7.01 7.01 0 004.72 3.826l-2.926 4.655A1 1 0 008.31 23h7.38a1 1 0 00.847-1.532l-2.927-4.657a7.01 7.01 0 004.72-3.824A5 5 0 0023 8V5a1 1 0 00-1-1h-3V2.5A1.5 1.5 0 0017.5 1ZM7 10V3h10v7a5 5 0 11-10 0ZM3 8V6h2v4c0 .283.017.565.052.845A3 3 0 013 8Zm16 2V6h2v2a3 3 0 01-2.053 2.845c.034-.277.052-.559.053-.845Zm-8.88 11L12 18.008 13.88 21h-3.76Z"] {
			d: path("M6.85 7.76V6.18H1v2.88c0 2.35 1.9 4.26 4.26 4.26h1.59v-1.59H5.4a2.81 2.81 0 01-2.81-2.8V7.75h4.26z M17.15 7.76V6.18H23v2.88c0 2.35-1.9 4.26-4.26 4.26h-1.59v-1.59h1.45a2.81 2.81 0 002.81-2.8V7.75h-4.26z M12 17.29a6.87 6.87 0 01-6.87-6.87V3h13.74v7.42c0 3.8-3.07 6.87-6.87 6.87z M12 17.29V3h6.87v7.42c0 3.8-3.07 6.87-6.87 6.87zM12 17.29l4.13 2.38H7.88L12 17.3zM16.13 19.67H7.88v2.38h8.25v-2.38z M6.85 7.76V6.18H1v2.88c0 2.35 1.9 4.26 4.26 4.26h1.59v-1.59H5.4a2.81 2.81 0 01-2.81-2.8V7.75h4.26z") !important
		}
		/* Sports - active */
		path[d="M17.5 1h-11A1.5 1.5 0 005 2.5V4H2a1 1 0 00-1 1v3a5 5 0 004.669 4.987 7.01 7.01 0 004.721 3.824l-2.927 4.657A1 1 0 008.31 23h7.38a1 1 0 00.847-1.532l-2.927-4.657a7 7 0 004.72-3.824A5 5 0 0023 8V5a1 1 0 00-1-1h-3V2.5A1.5 1.5 0 0017.5 1ZM3 8V6h2v4c0 .283.017.565.052.845A3 3 0 013 8Zm16 2V6h2v2a3 3 0 01-2.053 2.845c.034-.277.052-.559.053-.845Z"] {
			d: path("M6.85 7.76V6.18H1v2.88c0 2.35 1.9 4.26 4.26 4.26h1.59v-1.59H5.4a2.81 2.81 0 01-2.81-2.8V7.75h4.26z M17.15 7.76V6.18H23v2.88c0 2.35-1.9 4.26-4.26 4.26h-1.59v-1.59h1.45a2.81 2.81 0 002.81-2.8V7.75h-4.26z M12 17.29a6.87 6.87 0 01-6.87-6.87V3h13.74v7.42c0 3.8-3.07 6.87-6.87 6.87z M12 17.29V3h6.87v7.42c0 3.8-3.07 6.87-6.87 6.87zM12 17.29l4.13 2.38H7.88L12 17.3zM16.13 19.67H7.88v2.38h8.25v-2.38z M6.85 7.76V6.18H1v2.88c0 2.35 1.9 4.26 4.26 4.26h1.59v-1.59H5.4a2.81 2.81 0 01-2.81-2.8V7.75h4.26z") !important
		}
		/* Report history */
		path[d="m4 2.999-.146.073A1.55 1.55 0 003 4.454v16.545a1 1 0 102 0v-6.491a7.26 7.26 0 016.248.115l.752.376a8.94 8.94 0 008 0l.145-.073c.524-.262.855-.797.855-1.382V4.458a1.21 1.21 0 00-1.752-1.083 7.26 7.26 0 01-6.496 0L12 2.999a8.94 8.94 0 00-8 0Zm7.105 1.79v-.002l.752.376A9.26 9.26 0 0019 5.641v7.62a6.95 6.95 0 01-6.105-.052l-.752-.376A9.261 9.261 0 005 12.355v-7.62a6.94 6.94 0 016.105.054Z"] {
			d: path("M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z") !important;
			fill: #909090;
		}
		/* Help */
		path[d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 110 18.001A9 9 0 0112 3Zm.5 3h-.483a3.45 3.45 0 00-3.089 1.909l-.323.644a1 1 0 001.79.894l.322-.643a1.46 1.46 0 011.3-.804h.483a1.5 1.5 0 01.153 2.992l-.306.016A1.5 1.5 0 0011 12.5v1a1 1 0 002 0v-.535A3.5 3.5 0 0012.5 6Zm-.5 9.75a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5Z"] {
			d: path("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z") !important;
			fill: #909090;
		}
		/* Voice search icon */
		path[d="M18.063 14.5a1 1 0 111.73 1A8.998 8.998 0 0113 19.942V22a1 1 0 11-2 0v-2.058A8.999 8.999 0 014.206 15.5l.866-.5.865-.5a7.002 7.002 0 0012.125 0ZM12 1a5 5 0 015 5v5a5 5 0 01-10 0V6a5 5 0 015-5ZM4.572 14.134a1 1 0 011.365.366l-1.731 1a1 1 0 01.366-1.366ZM12 3a3 3 0 00-3 3v5a3 3 0 106 0V6a3 3 0 00-3-3Z"] {
			fill: #909090;
		}
		/* Send feedback */
		path[d="M19 2H5a4 4 0 00-4 4v10a4 4 0 004 4h2v1.604a1.41 1.41 0 002.095 1.232L14.2 20H19a4 4 0 004-4V6a4 4 0 00-4-4ZM5 4h14a2 2 0 012 2v10a2 2 0 01-2 2h-5.318l-.453.252L9 20.6V18H5a2 2 0 01-2-2V6a2 2 0 012-2Zm7 2a1 1 0 00-1 1v4.5a1 1 0 002 0V7a1 1 0 00-1-1Zm0 7.75a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5Z"] {
			d: path("M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z") !important;
			fill: #909090;
		}
		/* Account box */
		path[d="M3,3v18h18V3H3z M4.99,20c0.39-2.62,2.38-5.1,7.01-5.1s6.62,2.48,7.01,5.1H4.99z M9,10c0-1.65,1.35-3,3-3s3,1.35,3,3 c0,1.65-1.35,3-3,3S9,11.65,9,10z M12.72,13.93C14.58,13.59,16,11.96,16,10c0-2.21-1.79-4-4-4c-2.21,0-4,1.79-4,4 c0,1.96,1.42,3.59,3.28,3.93c-4.42,0.25-6.84,2.8-7.28,6V4h16v15.93C19.56,16.73,17.14,14.18,12.72,13.93z"] {
			d: path("M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z") !important;
			fill: #909090;
		}
		/* Studio */
		path[d="m13.75 1.456 6.505 3.756a3.5 3.5 0 011.75 3.03v7.511a3.5 3.5 0 01-1.75 3.031L13.75 22.54a3.5 3.5 0 01-3.5 0l-6.505-3.756a3.5 3.5 0 01-1.75-3.03V8.241a3.5 3.5 0 011.75-3.03l6.505-3.755a3.5 3.5 0 013.5 0Zm5.505 5.487L12.75 3.188a1.5 1.5 0 00-1.5 0L4.745 6.943a1.5 1.5 0 00-.75 1.3v7.51a1.5 1.5 0 00.75 1.3l6.505 3.755a1.5 1.5 0 001.5 0l6.505-3.755a1.5 1.5 0 00.75-1.3v-7.51a1.5 1.5 0 00-.75-1.3ZM12.5 5.365l4.996 2.885a1 1 0 01.5.866v5.768a1 1 0 01-.5.866L12.5 18.635a1 1 0 01-1 0L6.504 15.75a1 1 0 01-.5-.866V9.116a1 1 0 01.5-.866L11.5 5.365a1 1 0 011 0ZM12 6.81 7.504 9.404v5.192L12 17.19l4.496-2.595v-5.19L12 6.81ZM15 12l-5-3v6l5-3Z"] {
			d: path("M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM10 15V9l5 3-5 3z") !important;
			fill: #909090;
		}
		/* Google account */
		path[d="M12 13.9v-3.72h9.36c.14.63.25 1.22.25 2.05 0 5.71-3.83 9.77-9.6 9.77C6.48 22 2 17.52 2 12S6.48 2 12 2c2.7 0 4.96.99 6.69 2.61l-2.84 2.76c-.72-.68-1.97-1.49-3.85-1.49-3.31 0-6.01 2.75-6.01 6.12s2.7 6.12 6.01 6.12c3.83 0 5.24-2.65 5.5-4.22H12z"] {
			fill: #909090;
		}
		/* Limited access mode */
		path[d="M11 2a5 5 0 110 10 5 5 0 010-10ZM8 7a3 3 0 106 0 3 3 0 00-6 0Zm-1.243 9.757a6 6 0 017.185-.986 6 6 0 011.374-1.507A8 8 0 003 21a1 1 0 102 0 6 6 0 011.757-4.243ZM20 15h-2l-.07.554a1 1 0 01-1.38.797l-.514-.217-1 1.732.444.337a1 1 0 010 1.594l-.444.337 1 1.732.514-.217a1 1 0 011.38.797L18 23h2l.07-.553a1 1 0 011.38-.798l.514.217 1-1.732-.445-.337a1 1 0 010-1.594l.445-.337-1-1.732-.514.216a1 1 0 01-1.38-.797L20 15Zm.5 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0Z"] {
			fill: #909090;
		}
		/* Sign out */
		path[d="M19 2a2 2 0 012 2v16a2 2 0 01-2 2H9a1 1 0 010-2h10V4H9a1 1 0 010-2h10ZM9.293 7.293a1 1 0 000 1.414L11.586 11H4a1 1 0 000 2h7.586l-2.293 2.293a1 1 0 101.414 1.414L15.414 12l-4.707-4.707a1 1 0 00-1.414 0Z"] {
			d: path("M10.1 15.6l1.4 1.4 5-5-5-5-1.4 1.4 2.57 2.6H3v2h9.67l-2.58 2.6zM19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z") !important;
			fill: #909090;
		}
		/* Appearance */
		path[d="M21.861 14.006a8 8 0 01-10.87-10.87c.452-.816-.101-1.976-1-1.721C5.379 2.724 2 6.965 2 11.998c0 6.075 4.925 11 11 11 5.032 0 9.275-3.38 10.584-7.992.255-.9-.905-1.451-1.723-1Zm-1.137 2.616A9 9 0 118.376 4.275 10 10 0 008 6.998c0 5.522 4.477 10 10 10 .943 0 1.857-.131 2.724-.376Z"] {
			d: path("M280.485281,201.514719 L284,198 L287.514719,201.514719 L292.485281,201.514719 L292.485281,206.485281 L296,210 L292.485281,213.514719 L292.485281,218.485281 L287.514719,218.485281 L284,222 L280.485281,218.485281 L275.514719,218.485281 L275.514719,213.514719 L272,210 L275.514719,206.485281 L275.514719,201.514719 L280.485281,201.514719 Z M283.726536,215.86375 C287.116026,215.86375 289.86375,213.251451 289.86375,210.029016 C289.86375,206.806581 287.116026,204.194281 283.726536,204.194281 C283.073662,204.194281 282.164855,204.396254 281.000116,204.800201 C282.532112,206.378393 283.29811,208.121331 283.29811,210.029016 C283.29811,211.9367 282.444938,213.635948 280.738594,215.126758 C282.007413,215.618086 283.003393,215.86375 283.726536,215.86375 Z") !important;
			fill: #909090;
			transform: translate(-272px, -198px);
		}
		/* Purchases */
		path[d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 110 18.001A9 9 0 0112 3Zm0 2a1 1 0 00-1 1v1.104a3.5 3.5 0 00-1.435.656C8.886 8.3 8.5 9.09 8.5 10c0 .525.13 1.005.402 1.417.251.368.591.667.989.869.638.339 1.437.495 2.058.615l.109.022c.728.143 1.242.259 1.588.456.107.053.2.133.268.232.039.063.086.174.086.389 0 .2-.267 1-2 1-1.033 0-1.547-.303-1.788-.509a1.199 1.199 0 01-.274-.337 1 1 0 00-1.886.662L9 14.5l-.948.317.001.002.008.024c.055.143.123.281.203.413.175.283.394.537.648.753.478.41 1.156.765 2.088.915V18a1 1 0 002 0v-1.082c1.757-.299 3-1.394 3-2.918 0-.534-.125-1.022-.387-1.444a2.7 2.7 0 00-.978-.915c-.671-.383-1.512-.548-2.153-.673l-.04-.008c-.74-.145-1.258-.251-1.614-.439a.699.699 0 01-.258-.206c-.029-.045-.07-.13-.07-.315 0-.308.114-.518.31-.674C11.027 9.153 11.414 9 12 9c.463.006.917.133 1.316.368.167.095.323.206.468.331l.005.004.01.01a1 1 0 001.408-1.42L14.5 9l.706-.708-.011-.011-.017-.016-.054-.05A5 5 0 0013 7.115V6a1 1 0 00-1-1Z"] {
			d: path("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z") !important;
			fill: #909090;
		}
		/* Search */
		path[d="M11 2a9 9 0 105.641 16.01.966.966 0 00.152.197l3.5 3.5a1 1 0 101.414-1.414l-3.5-3.5a1 1 0 00-.197-.153A8.96 8.96 0 0020 11a9 9 0 00-9-9Zm0 2a7 7 0 110 14 7 7 0 010-14Z"] {
			d: path("M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z") !important;
		}
		#masthead:not([dark]) path[d="M11 2a9 9 0 105.641 16.01.966.966 0 00.152.197l3.5 3.5a1 1 0 101.414-1.414l-3.5-3.5a1 1 0 00-.197-.153A8.96 8.96 0 0020 11a9 9 0 00-9-9Zm0 2a7 7 0 110 14 7 7 0 010-14Z"] {
			fill: #858585;
		}
		/* Location */
		path[d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2.007c.048.021.153.081.315.248.302.313.667.872 1.016 1.725.611 1.494 1.053 3.597 1.149 6.02H9.519c.097-2.423.539-4.526 1.15-6.021.349-.852.714-1.411 1.016-1.724.162-.167.267-.228.315-.248Zm-2.835.45C8.248 5.277 7.632 7.96 7.52 11H3.057a9.01 9.01 0 016.108-7.543Zm5.669 0A9.01 9.01 0 0120.943 11H16.48c-.112-3.04-.729-5.723-1.646-7.543ZM9.52 13h4.961c-.097 2.423-.539 4.526-1.15 6.02-.349.853-.714 1.412-1.016 1.725-.162.167-.267.228-.315.248-.048-.021-.153-.081-.315-.248-.302-.313-.667-.872-1.016-1.725-.611-1.494-1.053-3.597-1.149-6.02Zm-6.463 0H7.52c.112 3.039.729 5.722 1.645 7.542A9 9 0 013.057 13Zm13.423 0h4.464a9.001 9.001 0 01-6.11 7.542c.916-1.82 1.534-4.502 1.646-7.542Z"] {
			d: path("M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z") !important;
			fill: #909090;
		}
		/* Keyboard shortcuts */
		path[d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2ZM3 18V6h18v12H3ZM6.5 8h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm3 0h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm3 0h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm3 0h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm3 0h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm-12 3h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm3 0h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm3 0h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm3 0h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm3 0h-1a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Zm-3 3h-7a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h7a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5Z"] {
			d: path("M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z") !important;
			fill: #909090;
		}
		/* Settings */
		path[d="M12.844 1h-1.687a2 2 0 00-1.962 1.616 3 3 0 01-3.92 2.263 2 2 0 00-2.38.891l-.842 1.46a2 2 0 00.417 2.507 3 3 0 010 4.525 2 2 0 00-.417 2.507l.843 1.46a2 2 0 002.38.892 3.001 3.001 0 013.918 2.263A2 2 0 0011.157 23h1.686a2 2 0 001.963-1.615 3.002 3.002 0 013.92-2.263 2 2 0 002.38-.892l.842-1.46a2 2 0 00-.418-2.507 3 3 0 010-4.526 2 2 0 00.418-2.508l-.843-1.46a2 2 0 00-2.38-.891 3 3 0 01-3.919-2.263A2 2 0 0012.844 1Zm-1.767 2.347a6 6 0 00.08-.347h1.687a4.98 4.98 0 002.407 3.37 4.98 4.98 0 004.122.4l.843 1.46A4.98 4.98 0 0018.5 12a4.98 4.98 0 001.716 3.77l-.843 1.46a4.98 4.98 0 00-4.123.4A4.979 4.979 0 0012.843 21h-1.686a4.98 4.98 0 00-2.408-3.371 4.999 4.999 0 00-4.12-.399l-.844-1.46A4.979 4.979 0 005.5 12a4.98 4.98 0 00-1.715-3.77l.842-1.459a4.98 4.98 0 004.123-.399 4.981 4.981 0 002.327-3.025ZM16 12a4 4 0 11-7.999 0 4 4 0 018 0Zm-4 2a2 2 0 100-4 2 2 0 000 4Z"] {
			d: path("M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.1-1.65c.2-.15.25-.42.13-.64l-2-3.46c-.12-.22-.4-.3-.6-.22l-2.5 1c-.52-.4-1.08-.73-1.7-.98l-.37-2.65c-.06-.24-.27-.42-.5-.42h-4c-.27 0-.48.18-.5.42l-.4 2.65c-.6.25-1.17.6-1.7.98l-2.48-1c-.23-.1-.5 0-.6.22l-2 3.46c-.14.22-.08.5.1.64l2.12 1.65c-.04.32-.07.65-.07.98s.02.66.06.98l-2.1 1.65c-.2.15-.25.42-.13.64l2 3.46c.12.22.4.3.6.22l2.5-1c.52.4 1.08.73 1.7.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.6-.25 1.17-.6 1.7-.98l2.48 1c.23.1.5 0 .6-.22l2-3.46c.13-.22.08-.5-.1-.64l-2.12-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z") !important;
			fill: #909090;
		}
		/* Switch account */
		path[d="M20 2H8a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2ZM8 16V4h12v12h-.365a.999.999 0 00-.059-.216 6 6 0 00-11.155.008 1 1 0 00-.058.208H8Zm6-11a3 3 0 100 6 3 3 0 000-6ZM4 20h15a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2v15ZM14 7a1 1 0 110 2 1 1 0 010-2Zm-.003 7a4 4 0 013.467 2h-6.927a4 4 0 013.46-2Z"] {
			d: path("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z") !important;
			fill: #909090;
		}
		/* Language */
		path[d="M10 2.5a1 1 0 00-2 0V4H2a1 1 0 000 2h9.925c-.204 1.334-.833 2.627-1.975 4.15-.287.382-.603.777-.95 1.184-.328-.385-.645-.78-.95-1.184C7.478 9.387 7.035 8.682 6.709 8h-2.17c.415 1.125 1.06 2.216 1.911 3.35.361.48.763.977 1.206 1.49-1.196 1.285-2.645 2.735-4.363 4.453a1 1 0 101.414 1.414l.057-.057C6.38 17.036 7.795 15.619 9 14.33c.748.8 1.577 1.65 2.485 2.565l.846-1.99a105.74 105.74 0 01-1.987-2.066c.443-.512.845-1.008 1.206-1.489 1.342-1.79 2.175-3.474 2.393-5.35H16a1 1 0 100-2h-6V2.5Zm6.33 8.109-4.25 10a1 1 0 101.84.782L14.937 19h5.126l1.017 2.391a1 1 0 101.84-.782l-4.25-10a1 1 0 00-.92-.609h-.5a1 1 0 00-.92.609Zm1.17 2.36L19.213 17h-3.426l1.713-4.031Z"] {
			d: path("M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z") !important;
			fill: #909090;
		}
		/* Your data */
		path[d="M21 4.3 12 1 3 4.3v10.555a6 6 0 003.364 5.39L12 23l5.636-2.755A6 6 0 0021 14.855V4.3ZM5 5.697l7-2.567 7 2.567v9.157a3.999 3.999 0 01-1.36 3.003 7 7 0 00-11.282-.001A4 4 0 015 14.854V5.697ZM12 6a4 4 0 100 8 4 4 0 000-8Zm0 2a2 2 0 110 4 2 2 0 010-4Zm0 9a5 5 0 013.896 1.868L12 20.772 8.104 18.87A5.001 5.001 0 0112 17Z"] {
			d: path("M12 1l9 4v6c0 5.5-3.8 10.7-9 12-5.2-1.3-9-6.5-9-12V5l9-4zM7.7 15.1A5.3 5.3 0 0 1 12 6.7a5.3 5.3 0 0 1 4.3 8.4c-.6-1.1-3-1.7-4.3-1.7-1.3 0-3.7.6-4.3 1.7zM12 8.3a2.2 2.2 0 0 0-2.2 2.2c0 1.2 1 2.2 2.2 2.2a2.2 2.2 0 0 0 2.2-2.2c0-1.2-1-2.2-2.2-2.2zm0-2.6A6.3 6.3 0 0 0 5.7 12a6.3 6.3 0 0 0 6.3 6.3 6.3 6.3 0 0 0 6.3-6.3A6.3 6.3 0 0 0 12 5.7z") !important;
			fill: #909090;
		}
		/* Share */
		path[d="M10 3.158V7.51c-5.428.223-8.27 3.75-8.875 11.199-.04.487-.07.975-.09 1.464l-.014.395c-.014.473.578.684.88.32.302-.368.61-.73.925-1.086l.244-.273c1.79-1.967 3-2.677 4.93-2.917a18.011 18.011 0 012-.112v4.346a1 1 0 001.646.763l9.805-8.297 1.55-1.31-1.55-1.31-9.805-8.297A1 1 0 0010 3.158Zm2 6.27v.002-4.116l7.904 6.688L12 18.689v-4.212l-2.023.024c-1.935.022-3.587.17-5.197 1.024a9 9 0 00-1.348.893c.355-1.947.916-3.39 1.63-4.425 1.062-1.541 2.607-2.385 5.02-2.485L12 9.428Z"] {
			d: path("M14 9V3L22 12L14 21V15C8.44 15 4.78 17.03 2 21C3.11 15.33 6.22 10.13 14 9Z") !important;
			fill: #909090;
		}
		/* Save */
		path[d="M19 2H5a2 2 0 00-2 2v16.887c0 1.266 1.382 2.048 2.469 1.399L12 18.366l6.531 3.919c1.087.652 2.469-.131 2.469-1.397V4a2 2 0 00-2-2ZM5 20.233V4h14v16.233l-6.485-3.89-.515-.309-.515.309L5 20.233Z"] {
			d: path("M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z") !important;
			fill: #909090;
		}
		/* Report */
		path[d="m4 2.999-.146.073A1.55 1.55 0 003 4.454v16.545a1 1 0 102 0v-6.491a7.26 7.26 0 016.248.115l.752.376a8.94 8.94 0 008 0l.145-.073c.524-.262.855-.797.855-1.382V4.458a1.21 1.21 0 00-1.752-1.083 7.26 7.26 0 01-6.496 0L12 2.999a8.94 8.94 0 00-8 0Zm7.105 1.79v-.002l.752.376A9.26 9.26 0 0019 5.641v7.62a6.95 6.95 0 01-6.105-.052l-.752-.376A9.261 9.261 0 005 12.355v-7.62a6.94 6.94 0 016.105.054Z"] {
			d: path("M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z") !important;
			fill: #909090;
		}
		/* Sort */
		path[d="M21,6H3V5h18V6z M15,11H3v1h12V11z M9,17H3v1h6V17z"] {
			d: path("M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z") !important;
		}
		/* Private */
		path[d="M13,5c0-2.21-1.79-4-4-4C6.79,1,5,2.79,5,5v1H3v11h12V6h-2V5z M6,5c0-1.65,1.35-3,3-3c1.65,0,3,1.35,3,3v1H6V5z M14,7v9H4 V7H14z M7,11c0-1.1,0.9-2,2-2s2,0.9,2,2c0,1.1-0.9,2-2,2S7,12.1,7,11z"] {
			d: path("M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z") !important;
			transform: scale(0.75);
			fill: #909090;
		}
		/* Unlisted */
		path[d="M17.78,16H13v-1h4.78c1.8,0,3.26-1.57,3.26-3.5S19.58,8,17.78,8H13V7h4.78c2.35,0,4.26,2.02,4.26,4.5S20.13,16,17.78,16z M11,15H6.19c-1.8,0-3.26-1.57-3.26-3.5S4.39,8,6.19,8H11V7H6.19c-2.35,0-4.26,2.02-4.26,4.5S3.84,16,6.19,16H11V15z M16,11H8v1h8 V11z"] {
			d: path("M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z") !important;
			transform: scale(0.75) translate(4px);
			fill: #909090;
		}
		/* Public */
		path[d="M9,1C4.58,1,1,4.58,1,9s3.58,8,8,8s8-3.58,8-8S13.42,1,9,1z M16,9c0,1.31-0.37,2.54-1,3.59V11h-2c-0.55,0-1-0.45-1-1   c0-1.1-0.9-2-2-2H8.73C8.9,7.71,9,7.36,9,7V5h1c1.1,0,2-0.9,2-2V2.69C14.36,3.81,16,6.21,16,9z M2.02,9.45L7,12.77V13   c0,1.1,0.9,2,2,2v1C5.29,16,2.26,13.1,2.02,9.45z M10,15.92V14H9c-0.55,0-1-0.45-1-1v-0.77L2.04,8.26C2.41,4.75,5.39,2,9,2   c0.7,0,1.37,0.11,2,0.29V3c0,0.55-0.45,1-1,1H8v3c0,0.55-0.45,1-1,1H5.5v1H10c0.55,0,1,0.45,1,1c0,1.1,0.9,2,2,2h1v1.89   C12.95,14.96,11.56,15.7,10,15.92z"] {
			d: path("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z") !important;
			transform: scale(0.75);
			fill: #909090;
		}
		tp-yt-paper-dialog #checkboxLabel yt-icon {
			height: 24px !important;
			width: 24px !important;
		}
		tp-yt-paper-dialog ytd-playlist-add-to-option-renderer svg path {
			transform: scale(0.75);
		}
		/* Mix */
		path[d="M10.5,14.41V9.6l4.17,2.4L10.5,14.41z M8.48,8.45L7.77,7.75C6.68,8.83,6,10.34,6,12s0.68,3.17,1.77,4.25l0.71-0.71 C7.57,14.64,7,13.39,7,12S7.57,9.36,8.48,8.45z M16.23,7.75l-0.71,0.71C16.43,9.36,17,10.61,17,12s-0.57,2.64-1.48,3.55l0.71,0.71 C17.32,15.17,18,13.66,18,12S17.32,8.83,16.23,7.75z M5.65,5.63L4.95,4.92C3.13,6.73,2,9.24,2,12s1.13,5.27,2.95,7.08l0.71-0.71 C4.02,16.74,3,14.49,3,12S4.02,7.26,5.65,5.63z M19.05,4.92l-0.71,0.71C19.98,7.26,21,9.51,21,12s-1.02,4.74-2.65,6.37l0.71,0.71 C20.87,17.27,22,14.76,22,12S20.87,6.73,19.05,4.92z"] {
			d: path("M20.3 11.95c0 2.46-.95 4.7-2.47 6.32l1.07 1.13c1.8-1.92 2.9-4.55 2.9-7.45 0-2.9-1.12-5.54-2.9-7.45l-1.07 1.13c1.52 1.62 2.46 3.86 2.46 6.32zm-17 0c0-2.46.93-4.7 2.45-6.32L4.7 4.5c-1.8 1.9-2.9 4.54-2.9 7.45 0 2.9 1.1 5.53 2.9 7.45l1.05-1.13C4.23 16.64 3.3 14.4 3.3 11.95zm3 0c0-1.6.6-3.03 1.57-4.08L6.8 6.75c-1.24 1.34-2 3.17-2 5.2 0 2.03.76 3.86 2 5.2l1.07-1.12c-.97-1.06-1.58-2.5-1.58-4.08zm10.47-5.2L15.7 7.87c1 1.05 1.6 2.5 1.6 4.08 0 1.6-.6 3.02-1.6 4.08l1.07 1.12c1.25-1.34 2.02-3.17 2.02-5.2 0-2.03-.8-3.86-2.05-5.2zm-6.64 2.93l4.16 2.3-4.2 2.3v-4.6z") !important;
		}
		/* Delete from playlist */
		path[d="M11,17H9V8h2V17z M15,8h-2v9h2V8z M19,4v1h-1v16H6V5H5V4h4V3h6v1H19z M17,5H7v15h10V5z"] {
			d: path("M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z") !important;
		}
		html:not([dark]) path[d="M11,17H9V8h2V17z M15,8h-2v9h2V8z M19,4v1h-1v16H6V5H5V4h4V3h6v1H19z M17,5H7v15h10V5z"] {
			fill: #909090;
		}
		/* Collapse playlist */
		html:not([dark]) path[d="M12.7,12l6.6,6.6l-0.7,0.7L12,12.7l-6.6,6.6l-0.7-0.7l6.6-6.6L4.6,5.4l0.7-0.7l6.6,6.6l6.6-6.6l0.7,0.7L12.7,12z"] {
			fill: #909090;
		}
		/* Expand playlist */
		html:not([dark]) path[d="M12,15.7L5.6,9.4l0.7-0.7l5.6,5.6l5.6-5.6l0.7,0.7L12,15.7z"] {
			fill: #909090;
		}
		/* More vert playlist */
		path[d="M12,16.5c0.83,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S11.17,16.5,12,16.5z M10.5,12 c0,0.83,0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5S10.5,11.17,10.5,12z M10.5,6c0,0.83,0.67,1.5,1.5,1.5 s1.5-0.67,1.5-1.5S12.83,4.5,12,4.5S10.5,5.17,10.5,6z"] {
			d: path("M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z") !important;
		}
		html:not([dark]) path[d="M12,16.5c0.83,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S11.17,16.5,12,16.5z M10.5,12 c0,0.83,0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5S10.5,11.17,10.5,12z M10.5,6c0,0.83,0.67,1.5,1.5,1.5 s1.5-0.67,1.5-1.5S12.83,4.5,12,4.5S10.5,5.17,10.5,6z"] {
			fill: #909090;
		}
		/* Play arrow */
		path[d="M7,5.87L16.2,12L7,18.13V5.87 M6,4v16l12-8L6,4L6,4z"] {
			d: path("M8 5v14l11-7z") !important;
		}
		/* Clip */
		path[d="M6 2.002a4 4 0 102.03 7.445L10.586 12l-2.554 2.555a4 4 0 101.414 1.414L12 13.416l7.07 7.071a2 2 0 002.829 0L9.446 8.032A4 4 0 006 2.002Zm8.826 8.588 7.073-7.074a2 2 0 00-2.828 0l-5.66 5.66 1.415 1.414ZM8 6a2 2 0 11-4 0 2 2 0 014 0Zm0 12a2 2 0 11-4 0 2 2 0 014 0Z"] {
			d: path("M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z") !important;
			fill: #909090;
		}
		/* Download */
		path[d="M12 2a1 1 0 00-1 1v11.586l-4.293-4.293a1 1 0 10-1.414 1.414L12 18.414l6.707-6.707a1 1 0 10-1.414-1.414L13 14.586V3a1 1 0 00-1-1Zm7 18H5a1 1 0 000 2h14a1 1 0 000-2Z"] {
			fill: #909090;
		}
		/* Misc ellipsis */
		path[d="M6 10a2 2 0 100 4 2 2 0 000-4Zm6 0a2 2 0 100 4 2 2 0 000-4Zm6 0a2 2 0 100 4 2 2 0 000-4Z"] {
			d: path("M3,12a2,2 0 1,0 4,0a2,2 0 1,0 -4,0 M10,12a2,2 0 1,0 4,0a2,2 0 1,0 -4,0 M17,12a2,2 0 1,0 4,0a2,2 0 1,0 -4,0") !important;
			fill: #909090;
		}
		/* List icon */
		path[d="M20,9H9V7h11V9z M20,11H9v2h11V11z M20,15H9v2h11V15z M7,7H4v2h3V7z M7,11H4v2h3V11z M7,15H4v2h3V15z"] {
			d: path("M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z") !important;
			fill: var(--redux-spec-call-to-action);
		}
		path[d="M20,8H9V7h11V8z M20,11H9v1h11V11z M20,15H9v1h11V15z M7,7H4v1h3V7z M7,11H4v1h3V11z M7,15H4v1h3V15z"] {
			d: path("M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z") !important;
			fill: #909090;
		}
		/* Grid icon */
		path[d="M2,4h6v7H2V4z M2,20h6v-7H2V20z M9,11h6V4H9V11z M9,20h6v-7H9V20z M16,4v7h6V4H16z M16,20h6v-7h-6V20z"] {
			d: path("M2,4h6v7H2V4z M2,20h6v-7H2V20z M9,11h6V4H9V11z M9,20h6v-7H9V20z M16,4v7h6V4H16z M16,20h6v-7h-6V20z") !important;
			fill: var(--redux-spec-call-to-action);
		}
		path[d="M8,11H2V4h6V11z M3,10h4V5H3V10z M8,20H2v-7h6V20z M3,19h4v-5H3V19z M15,11H9V4h6V11z M10,10h4V5h-4V10z M15,20H9v-7h6V20z M10,19h4v-5h-4V19z M22,11h-6V4h6V11z M17,10h4V5h-4V10z M22,20h-6v-7h6V20z M17,19h4v-5h-4V19z"] {
			d: path("M2,4h6v7H2V4z M2,20h6v-7H2V20z M9,11h6V4H9V11z M9,20h6v-7H9V20z M16,4v7h6V4H16z M16,20h6v-7h-6V20z") !important;
			fill: #909090;
		}
		/* Likes colors */
		#top-level-buttons-computed > ytd-toggle-button-renderer > a > yt-icon-button > #button[aria-pressed="false"] > yt-icon {
			fill: #909090;
		}
		#top-level-buttons-computed > ytd-toggle-button-renderer > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon {
			fill: var(--redux-spec-call-to-action);
		}
		ytd-toggle-button-renderer.style-default-active[is-icon-button] {
			color: #065FD4 !important;
		}
		/* Add to queue */
		path[d="M21,16h-7v-1h7V16z M21,11H9v1h12V11z M21,7H3v1h18V7z M10,15l-7-4v8L10,15z"] {
			d: path("M9,10 L18,10 L18,12 L9,12 L9,10 Z M6,6 L18,6 L18,8 L6,8 L6,6 Z M12,14 L18,14 L18,16 L12,16 L12,14 Z M6,12 L6,18 L10,15 L6,12 Z") !important;
		}
		path[d="M21,16h-7v-1h7V16z M21,11H9v1h12V11z M21,7H3v1h18V7z M10,15l-7-4v8L10,15z"]:not(#hover-overlays path[d="M21,16h-7v-1h7V16z M21,11H9v1h12V11z M21,7H3v1h18V7z M10,15l-7-4v8L10,15z"]) {
			fill: #909090;
		}
		/* Hide */
		path[d="M7.21 18.21L5.8 16.8L16.8 5.8L18.21 7.21L7.21 18.21ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 21C7.04 21 3 16.96 3 12C3 7.04 7.04 3 12 3C16.96 3 21 7.04 21 12C21 16.96 16.96 21 12 21Z"] {
			d: path("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z") !important;
			fill: #909090;
		}
		/* Don't recommend */
		path[d="M12,3c-4.96,0-9,4.04-9,9s4.04,9,9,9s9-4.04,9-9S16.96,3,12,3 M12,2c5.52,0,10,4.48,10,10s-4.48,10-10,10S2,17.52,2,12 S6.48,2,12,2L12,2z M19,13H5v-2h14V13z"] {
			d: path("M7 11v2h10v-2H7zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z") !important;
			fill: #909090;
		}
		/* Thanks */
		path[d="M16.25 2A6.7 6.7 0 0012 3.509 6.75 6.75 0 001 8.75c0 4.497 2.784 7.818 5.207 9.87a23.498 23.498 0 004.839 3.143l.096.044.03.013.01.005.003.002.002.001c.273-.609.544-1.218.813-1.828 0 0-9-4-9-11.25a4.75 4.75 0 018.932-2.247A1 1 0 0011 7.5v.638c-.357.1-.689.26-.979.49A2.35 2.35 0 009.13 10.5c-.007.424.112.84.342 1.197.21.31.497.563.831.734.546.29 1.23.411 1.693.502.557.109.899.19 1.117.315.086.048.109.082.114.09.004.006.028.045.028.162 0 .024-.008.118-.165.235-.162.122-.5.27-1.09.27-.721 0-1.049-.21-1.181-.323a.6.6 0 01-.142-.168l.005.013.006.014.002.009a.996.996 0 00-1.884.64l.947-.316-.003.001c-.875.292-.939.314-.943.317l.001.003.003.006.004.015.012.032c.045.111.1.218.162.321.146.236.324.444.535.624.357.306.841.566 1.476.702v.605a1 1 0 002 0v-.614c1.29-.289 2.245-1.144 2.245-2.386 0-.44-.103-.852-.327-1.212-.22-.355-.52-.6-.82-.77-.555-.316-1.244-.445-1.719-.539-.567-.111-.915-.185-1.143-.305a.5.5 0 01-.1-.07l-.004-.003-.003-.009a.4.4 0 01-.009-.092c0-.158.053-.244.14-.314.109-.086.341-.19.74-.19.373-.001.73.144.997.404a.996.996 0 001.518-1.286l-.699.58.698-.582v-.001l-.002-.001-.002-.003-.006-.006-.016-.018a2.984 2.984 0 00-.178-.182A3.45 3.45 0 0013 8.154V7.5a1 1 0 00-.933-.997A4.75 4.75 0 0121 8.75C21 16 12 20 12 20l.813 1.827.002-.001.003-.001.01-.005.029-.013.097-.045c.081-.037.191-.09.33-.16a23.5 23.5 0 004.509-2.982C20.216 16.568 23 13.248 23 8.75A6.75 6.75 0 0016.25 2Zm-3.437 19.827L12 20l-.813 1.828.813.36.813-.361Z"] {
			d: path("M21.8,6.9c-0.2-0.7-0.5-1.4-1.1-2c-0.5-0.6-1.2-1.1-2-1.4C18,3.2,17.2,3,16.3,3c-0.8,0-1.7,0.2-2.4,0.6C13.2,3.9,12.5,4.4,12,5c-0.5-0.6-1.2-1.1-1.9-1.5C9.3,3.2,8.5,3,7.7,3C6.8,3,6,3.2,5.2,3.5c-0.8,0.3-1.4,0.8-2,1.4c-0.5,0.5-0.9,1.2-1.1,2C0.8,11.9,5.5,18,12,22C18.5,18,23.2,11.9,21.8,6.9z M15,10h-4.5v1.5H14c0.5,0,1,0.5,1,1V15c0,0.5-0.5,1-1,1h-1v1.5h-2V16h-1c-0.5,0-1-0.5-1-1v-0.5h4.5V13H10c-0.5,0-1-0.5-1-1V9.5c0-0.5,0.5-1,1-1h1V7h2v1.5h1c0.5,0,1,0.5,1,1V10z") !important;
			fill: #909090;
		}
		/* Transcript */
		path[d="M5,11h2v2H5V11z M15,15H5v2h10V15z M19,15h-2v2h2V15z M19,11H9v2h10V11z M22,6H2v14h20V6z M3,7h18v12H3V7z"] {
			d: path("M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z") !important;
			fill: #909090;
		}
		/* Sub alert all */
		path[d="M21.5 8.99992H19.5V8.80992C19.5 6.89992 18.39 5.18991 16.6 4.32991L17.47 2.52991C19.96 3.71991 21.5 6.12992 21.5 8.80992V8.99992ZM4.5 8.80992C4.5 6.89992 5.61 5.18991 7.4 4.32991L6.53 2.52991C4.04 3.71991 2.5 6.12992 2.5 8.80992V8.99992H4.5V8.80992ZM12 21.9999C13.1 21.9999 14 21.0999 14 19.9999H10C10 21.0999 10.9 21.9999 12 21.9999ZM20 17.3499V18.9999H4V17.3499L6 15.4699V10.3199C6 7.39991 7.56 5.09992 10 4.33992V3.95991C10 2.53991 11.49 1.45991 12.99 2.19991C13.64 2.51991 14 3.22991 14 3.95991V4.34991C16.44 5.09991 18 7.40991 18 10.3299V15.4799L20 17.3499Z"],
		path[d="M7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42zM18 11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2v-5zm-6 11c.14 0 .27-.01.4-.04.65-.14 1.18-.58 1.44-1.18.1-.24.15-.5.15-.78h-4c.01 1.1.9 2 2.01 2z"] {
			d: path("M7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42zM18 11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2v-5zm-6 11c.14 0 .27-.01.4-.04.65-.14 1.18-.58 1.44-1.18.1-.24.15-.5.15-.78h-4c.01 1.1.9 2 2.01 2z") !important;
			fill: #909090;
		}
		/* Sub personalized */
		ytd-video-primary-info-renderer path[d="M10,20h4c0,1.1-0.9,2-2,2S10,21.1,10,20z M20,17.35V19H4v-1.65l2-1.88v-5.15c0-2.92,1.56-5.22,4-5.98V3.96 c0-1.42,1.49-2.5,2.99-1.76C13.64,2.52,14,3.23,14,3.96l0,0.39c2.44,0.75,4,3.06,4,5.98v5.15L20,17.35z M19,17.77l-2-1.88v-5.47 c0-2.47-1.19-4.36-3.13-5.1c-1.26-0.53-2.64-0.5-3.84,0.03C8.15,6.11,7,7.99,7,10.42v5.47l-2,1.88V18h14V17.77z"],
		ytd-menu-popup-renderer path[d="M10,20h4c0,1.1-0.9,2-2,2S10,21.1,10,20z M20,17.35V19H4v-1.65l2-1.88v-5.15c0-2.92,1.56-5.22,4-5.98V3.96 c0-1.42,1.49-2.5,2.99-1.76C13.64,2.52,14,3.23,14,3.96l0,0.39c2.44,0.75,4,3.06,4,5.98v5.15L20,17.35z M19,17.77l-2-1.88v-5.47 c0-2.47-1.19-4.36-3.13-5.1c-1.26-0.53-2.64-0.5-3.84,0.03C8.15,6.11,7,7.99,7,10.42v5.47l-2,1.88V18h14V17.77z"],
		path[d="M10,20h4c0,1.1-0.9,2-2,2S10,21.1,10,20z M20,17.35V19H4v-1.65l2-1.88v-5.15c0-2.92,1.56-5.22,4-5.98V3.96 c0-1.42,1.49-2.5,2.99-1.76C13.64,2.52,14,3.23,14,3.96l0,0.39c2.44,0.75,4,3.06,4,5.98v5.15L20,17.35z M19,17.77l-2-1.88v-5.47 c0-2.47-1.19-4.36-3.13-5.1c-1.26-0.53-2.64-0.5-3.84,0.03C8.15,6.11,7,7.99,7,10.42v5.47l-2,1.88V18h14V17.77z"],
		ytd-video-primary-info-renderer path[d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"] {
			d: path("M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z") !important;
			fill: #909090;
		}
		/* Sub alert none */
		path[d="M3.85,3.15L3.15,3.85l3.48,3.48C6.22,8.21,6,9.22,6,10.32v5.15l-2,1.88V19h14.29l1.85,1.85l0.71-0.71L3.85,3.15z M5,18 v-0.23l2-1.88v-5.47c0-0.85,0.15-1.62,0.41-2.3L17.29,18H5z M10,20h4c0,1.1-0.9,2-2,2S10,21.1,10,20z M9.28,5.75l-0.7-0.7 c0.43-0.29,0.9-0.54,1.42-0.7V3.96c0-1.42,1.49-2.5,2.99-1.76C13.64,2.52,14,3.23,14,3.96v0.39c2.44,0.75,4,3.06,4,5.98v4.14l-1-1 v-3.05c0-2.47-1.19-4.36-3.13-5.1c-1.26-0.53-2.64-0.5-3.84,0.03C9.76,5.46,9.52,5.59,9.28,5.75z"],
		path[d="M12.1,21.5 C11,21.5 10.1,20.6 10.1,19.5 L14.1,19.5 C14.1,20.6 13.2,21.5 12.1,21.5 Z M17.8493827,18.5 L4.1,18.5 L4.1,17.5 L6.1,15.5 L6.1,10.5 C6.1,9.28787069 6.34383266,8.14803693 6.80191317,7.17284768 L4,4.3 L5.3,3 L8.39345122,6.17176644 C8.80987992,6.58774655 9.3,7.1 9.3,7.1 L21.1,19.2 L19.8,20.5 L17.8493827,18.5 Z M8.37723023,8.78804618 C8.20156515,9.32818052 8.1,9.91409026 8.1,10.5 L8.1,16.5 L15.8987654,16.5 L8.37723023,8.78804618 Z M18.1,13.7 L16.1,11.6 L16.1,10.5 C16.1,8 14.6,6 12.1,6 C11.6,6 11.2,6.1 10.8,6.2 L9.3,4.7 C9.7,4.5 10.1,4.3 10.6,4.2 L10.6,3.5 C10.6,2.7 11.3,2 12.1,2 C12.9,2 13.6,2.7 13.6,3.5 L13.6,4.2 C16.5,4.9 18.1,7.4 18.1,10.5 L18.1,13.7 Z"] {
			d: path("M12.1,21.5 C11,21.5 10.1,20.6 10.1,19.5 L14.1,19.5 C14.1,20.6 13.2,21.5 12.1,21.5 Z M17.8493827,18.5 L4.1,18.5 L4.1,17.5 L6.1,15.5 L6.1,10.5 C6.1,9.28787069 6.34383266,8.14803693 6.80191317,7.17284768 L4,4.3 L5.3,3 L8.39345122,6.17176644 C8.80987992,6.58774655 9.3,7.1 9.3,7.1 L21.1,19.2 L19.8,20.5 L17.8493827,18.5 Z M8.37723023,8.78804618 C8.20156515,9.32818052 8.1,9.91409026 8.1,10.5 L8.1,16.5 L15.8987654,16.5 L8.37723023,8.78804618 Z M18.1,13.7 L16.1,11.6 L16.1,10.5 C16.1,8 14.6,6 12.1,6 C11.6,6 11.2,6.1 10.8,6.2 L9.3,4.7 C9.7,4.5 10.1,4.3 10.6,4.2 L10.6,3.5 C10.6,2.7 11.3,2 12.1,2 C12.9,2 13.6,2.7 13.6,3.5 L13.6,4.2 C16.5,4.9 18.1,7.4 18.1,10.5 L18.1,13.7 Z") !important;
			fill: #909090;
		}
		/* Love comment */
		path[d="M16.5,3C19.02,3,21,5.19,21,7.99c0,3.7-3.28,6.94-8.25,11.86L12,20.59l-0.74-0.73l-0.04-0.04C6.27,14.92,3,11.69,3,7.99 C3,5.19,4.98,3,7.5,3c1.4,0,2.79,0.71,3.71,1.89L12,5.9l0.79-1.01C13.71,3.71,15.1,3,16.5,3 M16.5,2c-1.74,0-3.41,0.88-4.5,2.28 C10.91,2.88,9.24,2,7.5,2C4.42,2,2,4.64,2,7.99c0,4.12,3.4,7.48,8.55,12.58L12,22l1.45-1.44C18.6,15.47,22,12.11,22,7.99 C22,4.64,19.58,2,16.5,2L16.5,2z"] {
			d: path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z") !important;
			fill: #909090;
		}
		/* Pin comment */
		path[d="M16,11V3h1V2H7v1h1v8l-2,2v2h5v6l1,1l1-1v-6h5v-2L16,11z M17,14h-4h-1h-1H7v-0.59l1.71-1.71L9,11.41V11V3h6v8v0.41 l0.29,0.29L17,13.41V14z"] {
			d: path("M16 5h.99L17 3H7v2h1v7l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2V5z") !important;
			fill: #909090;
		}
		/* Edit comment */
		path[d="M14.06,7.6l2.34,2.34L6.34,20H4v-2.34L14.06,7.6 M14.06,6.19L3,17.25V21h3.75L17.81,9.94L14.06,6.19L14.06,6.19z M17.61,4.05l2.37,2.37l-1.14,1.14l-2.37-2.37L17.61,4.05 M17.61,2.63l-2.55,2.55l3.79,3.79l2.55-2.55L17.61,2.63L17.61,2.63z"] {
			d: path("M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z") !important;
			fill: #909090;
		}
		/* Audiotrack */
		path[d="M12,4v9.38C11.27,12.54,10.2,12,9,12c-2.21,0-4,1.79-4,4c0,2.21,1.79,4,4,4s4-1.79,4-4V8h6V4H12z M9,19c-1.66,0-3-1.34-3-3 s1.34-3,3-3s3,1.34,3,3S10.66,19,9,19z M18,7h-5V5h5V7z"] {
			d: path("M12,4v9.38C11.27,12.54,10.2,12,9,12c-2.21,0-4,1.79-4,4c0,2.21,1.79,4,4,4s4-1.79,4-4V8h6V4H12z") !important;
		}
		/* Chat - timestamps */
		path[d="M14.97,16.95L10,13.87V7h2v5.76l4.03,2.49L14.97,16.95z M12,3c-4.96,0-9,4.04-9,9s4.04,9,9,9s9-4.04,9-9S16.96,3,12,3 M12,2c5.52,0,10,4.48,10,10s-4.48,10-10,10S2,17.52,2,12S6.48,2,12,2L12,2z"] {
			d: path("M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z") !important;
		}
		/* Chat - send feedback */
		path[d="M13,14h-2v-2h2V14z M13,5h-2v6h2V5z M19,3H5v16.59l3.29-3.29L8.59,16H9h10V3 M20,2v15H9l-5,5V2H20L20,2z"] {
			d: path("M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z") !important;
		}
		/* Chat - report */
		path[d="M13.18,4l0.24,1.2L13.58,6h0.82H19v7h-5.18l-0.24-1.2L13.42,11H12.6H6V4H13.18 M14,3H5v18h1v-9h6.6l0.4,2h7V5h-5.6L14,3 L14,3z"] {
			d: path("M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z") !important;
		}
		/* Chat - block */
		path[d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"] {
			d: path("M7 11v2h10v-2H7zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z") !important;
		}
		/* Playlist shuffle inactive */
		path[d="M18.15,13.65l3.85,3.85l-3.85,3.85l-0.71-0.71L20.09,18H19c-2.84,0-5.53-1.23-7.39-3.38l0.76-0.65 C14.03,15.89,16.45,17,19,17h1.09l-2.65-2.65L18.15,13.65z M19,7h1.09l-2.65,2.65l0.71,0.71l3.85-3.85l-3.85-3.85l-0.71,0.71 L20.09,6H19c-3.58,0-6.86,1.95-8.57,5.09l-0.73,1.34C8.16,15.25,5.21,17,2,17v1c3.58,0,6.86-1.95,8.57-5.09l0.73-1.34 C12.84,8.75,15.79,7,19,7z M8.59,9.98l0.75-0.66C7.49,7.21,4.81,6,2,6v1C4.52,7,6.92,8.09,8.59,9.98z"] {
			d: path("M16.808 4.655l2.069 1.978h-.527c-1.656 0-3.312.68-4.458 1.814L12.797 9.75l1.179 1.246 1.317-1.527c.764-.794 1.91-1.247 3.057-1.247h.55l-2.07 2.014 1.178 1.179 4.005-3.993-4.026-3.945-1.178 1.179zm1.974 10.998l-1.974-1.888 1.18-1.179 4.024 3.945-4.004 3.993-1.178-1.179 1.954-1.901h-.434c-1.656 0-3.312-.625-4.458-1.667L8.242 9.8C7.35 9.071 6.204 8.55 4.93 8.55H2l.006-1.794 2.965.003c1.784 0 3.312.521 4.459 1.563l5.904 6.185c.765.73 1.911 1.146 3.058 1.146h.39zm-9.02-2.092l-1.52 1.394c-.892.793-2.038 1.36-3.312 1.36H2v1.588h2.93c1.783 0 3.312-.567 4.459-1.701l1.537-1.396-1.164-1.245z") !important;
			fill: #909090;
		}
		/* Playlist shuffle active */
		path[d="M18.51,13.29l4.21,4.21l-4.21,4.21l-1.41-1.41l1.8-1.8c-2.95-0.03-5.73-1.32-7.66-3.55l1.51-1.31 c1.54,1.79,3.77,2.82,6.13,2.85l-1.79-1.79L18.51,13.29z M18.88,7.51l-1.78,1.78l1.41,1.41l4.21-4.21l-4.21-4.21l-1.41,1.41l1.8,1.8 c-3.72,0.04-7.12,2.07-8.9,5.34l-0.73,1.34C7.81,14.85,5.03,17,2,17v2c3.76,0,7.21-2.55,9.01-5.85l0.73-1.34 C13.17,9.19,15.9,7.55,18.88,7.51z M8.21,10.31l1.5-1.32C7.77,6.77,4.95,5,2,5v2C4.38,7,6.64,8.53,8.21,10.31z"] {
			d: path("M16.808 4.655l2.069 1.978h-.527c-1.656 0-3.312.68-4.458 1.814L12.797 9.75l1.179 1.246 1.317-1.527c.764-.794 1.91-1.247 3.057-1.247h.55l-2.07 2.014 1.178 1.179 4.005-3.993-4.026-3.945-1.178 1.179zm1.974 10.998l-1.974-1.888 1.18-1.179 4.024 3.945-4.004 3.993-1.178-1.179 1.954-1.901h-.434c-1.656 0-3.312-.625-4.458-1.667L8.242 9.8C7.35 9.071 6.204 8.55 4.93 8.55H2l.006-1.794 2.965.003c1.784 0 3.312.521 4.459 1.563l5.904 6.185c.765.73 1.911 1.146 3.058 1.146h.39zm-9.02-2.092l-1.52 1.394c-.892.793-2.038 1.36-3.312 1.36H2v1.588h2.93c1.783 0 3.312-.567 4.459-1.701l1.537-1.396-1.164-1.245z") !important;
		}
		/* Playlist repeat all inactive */
		path[d="M21,13h1v5L3.93,18.03l2.62,2.62l-0.71,0.71L1.99,17.5l3.85-3.85l0.71,0.71l-2.67,2.67L21,17V13z M3,7l17.12-0.03 l-2.67,2.67l0.71,0.71l3.85-3.85l-3.85-3.85l-0.71,0.71l2.62,2.62L2,6v5h1V7z"] {
			fill: #909090;
		}
		/* Playlist add vids */
		path[d="M20,12h-8v8h-1v-8H3v-1h8V3h1v8h8V12z"] {
			d: path("M7,0h3V7h7v3H10v7H7V10H0V7H7V0Z") !important;
			fill: #909090;
		}
		/* Playlist icon */
		path[d="M22,7H2v1h20V7z M13,12H2v-1h11V12z M13,16H2v-1h11V16z M15,19v-8l7,4L15,19z"] {
			d: path("M3.67 8.67h14V11h-14V8.67zm0-4.67h14v2.33h-14V4zm0 9.33H13v2.34H3.67v-2.34zm11.66 0v7l5.84-3.5-5.84-3.5z") !important;
		}
		/* Playlist icon active */
		path[d="M15,19v-8l7,4L15,19z M22,7H2v2h20V7z M13,13H2v-2h11V13z M13,17H2v-2h11V17z"] {
			d: path("M3.67 8.67h14V11h-14V8.67zm0-4.67h14v2.33h-14V4zm0 9.33H13v2.34H3.67v-2.34zm11.66 0v7l5.84-3.5-5.84-3.5z") !important;
		}
		/* Hide notifications */
		path[d="M3.85,3.15L3.15,3.85L6.19,6.9C4.31,8.11,2.83,9.89,2,12c1.57,3.99,5.45,6.82,10,6.82c1.77,0,3.44-0.43,4.92-1.2l3.23,3.23 l0.71-0.71L3.85,3.15z M13.8,14.5c-0.51,0.37-1.13,0.59-1.8,0.59c-1.7,0-3.09-1.39-3.09-3.09c0-0.67,0.22-1.29,0.59-1.8L13.8,14.5z M12,17.82c-3.9,0-7.35-2.27-8.92-5.82c0.82-1.87,2.18-3.36,3.83-4.38L8.79,9.5c-0.54,0.69-0.88,1.56-0.88,2.5 c0,2.25,1.84,4.09,4.09,4.09c0.95,0,1.81-0.34,2.5-0.88l1.67,1.67C14.9,17.49,13.48,17.82,12,17.82z M11.49,7.95 c0.17-0.02,0.34-0.05,0.51-0.05c2.25,0,4.09,1.84,4.09,4.09c0,0.17-0.02,0.34-0.05,0.51l-1.01-1.01c-0.21-1.31-1.24-2.33-2.55-2.55 L11.49,7.95z M9.12,5.59C10.04,5.33,11,5.18,12,5.18c4.55,0,8.43,2.83,10,6.82c-0.58,1.47-1.48,2.78-2.61,3.85l-0.72-0.72 c0.93-0.87,1.71-1.92,2.25-3.13C19.35,8.45,15.9,6.18,12,6.18c-0.7,0-1.39,0.08-2.06,0.22L9.12,5.59z"] {
			d: path("M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z") !important;
			fill: #909090;
		}
		/* Collab */
		path[d="M14 20C14 17.79 15.79 16 18 16C20.21 16 22 17.79 22 20H14ZM18 16C16.9 16 16 15.1 16 14C16 12.9 16.9 12 18 12C19.1 12 20 12.9 20 14C20 15.1 19.1 16 18 16ZM15 8C15 5.79 13.21 4 11 4C8.79 4 7 5.79 7 8C7 9.96 8.42 11.59 10.28 11.93C4.77 12.21 2 15.76 2 20H12.02L12 19H3.06C3.44 15.89 5.67 12.9 11 12.9C11.62 12.9 12.19 12.95 12.73 13.03L13.57 12.19C12.99 12.06 12.38 11.96 11.72 11.93C13.58 11.59 15 9.96 15 8ZM11 11C9.35 11 8 9.65 8 8C8 6.35 9.35 5 11 5C12.65 5 14 6.35 14 8C14 9.65 12.65 11 11 11Z"] {
			d: path("M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z") !important;
			fill: #909090;
		}
		/* Show unavailable vids */
		path[d="M12,8.91c1.7,0,3.09,1.39,3.09,3.09S13.7,15.09,12,15.09S8.91,13.7,8.91,12S10.3,8.91,12,8.91 M12,7.91 c-2.25,0-4.09,1.84-4.09,4.09s1.84,4.09,4.09,4.09s4.09-1.84,4.09-4.09S14.25,7.91,12,7.91L12,7.91z M12,6.18 c3.9,0,7.35,2.27,8.92,5.82c-1.56,3.55-5.02,5.82-8.92,5.82c-3.9,0-7.35-2.27-8.92-5.82C4.65,8.45,8.1,6.18,12,6.18 M12,5.18 C7.45,5.18,3.57,8.01,2,12c1.57,3.99,5.45,6.82,10,6.82s8.43-2.83,10-6.82C20.43,8.01,16.55,5.18,12,5.18L12,5.18z"] {
			d: path("M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z") !important;
			fill: #909090;
		}
		/* Playlist move top */
		path[d="M7 5L7 4L18 4L18 5L7 5ZM7.5 11.6L8.2 12.3L12 8.6L12 19L13 19L13 8.6L16.8 12.4L17.5 11.7L12.5 6.7L7.5 11.6Z"] {
			d: path("M8 11h3v10h2V11h3l-4-4-4 4zM4 3v2h16V3H4z") !important;
			fill: #909090;
		}
		/* Playlist move bottom */
		path[d="M17 18V19H6V18H17ZM16.5 11.4L15.8 10.7L12 14.4V4H11V14.4L7.2 10.6L6.5 11.3L11.5 16.3L16.5 11.4Z"] {
			d: path("M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z") !important;
			fill: #909090;
		}
		/* Playlist set as thumbnail */
		path[d="M19.08,18H5.06l4.01-5.16l2.14,2.59l3.02-3.89L19.08,18z M11.26,17h5.82l-2.87-3.82L11.26,17z M7.1,17h4.11l-2.12-2.56 L7.1,17z M20,4v16H4V4H20 M21,3H3v18h18V3L21,3z"] {
			d: path("M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z") !important;
			fill: #909090;
		}
		/* Pause watch history */
		path[d="M11,16H9V8h2V16z M15,8h-2v8h2V8z M12,3c4.96,0,9,4.04,9,9s-4.04,9-9,9s-9-4.04-9-9S7.04,3,12,3 M12,2C6.48,2,2,6.48,2,12 s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2L12,2z"] {
			d: path("M9 16h2V8H9v8zm3-14C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-4h2V8h-2v8z") !important;
			fill: #909090;
		}
		/* Popup checkbox */
		tp-yt-paper-checkbox #checkbox {
			border-color: #909090 !important;
		}
		/* FF additional color restoration */
		ytd-watch-flexy #info.ytd-watch-flexy yt-icon.ytd-button-renderer,
		tp-yt-paper-item #content-icon > yt-icon,
		yt-icon.ytd-toggle-theme-compact-link-renderer,
		#secondary-text.ytd-compact-link-renderer, 
		#right-icon.ytd-compact-link-renderer,
		.ytd-menu-renderer[button-renderer].ytd-menu-renderer:hover yt-icon.ytd-menu-renderer, 
		#button.ytd-menu-renderer:hover yt-icon.ytd-menu-renderer,
		html:not([dark]) #like-button.ytd-comment-action-buttons-renderer button[aria-pressed="false"] svg,
		html:not([dark]) #dislike-button.ytd-comment-action-buttons-renderer button[aria-pressed="false"] svg,
		#info ytd-subscription-notification-toggle-button-renderer yt-icon,
		#info-contents yt-icon.ytd-menu-renderer svg,
		tp-yt-paper-listbox svg,
		#checkbox-container svg {
			fill: #909090;
		}
		tp-yt-paper-checkbox #checkbox {
			border-color: #909090 !important;
		}
		#masthead:not([dark]) #button yt-icon-button yt-icon {
			fill: #606060;
		}
		`,
		squareSubs: `
		yt-img-shadow.ytd-guide-entry-renderer {
			border-radius: 0% !important;
		}
		`,
		extraComments: `
		ytd-comment-view-model #content-text {
			line-height: 17px !important;
		}
		#placeholder-area.ytd-comment-simplebox-renderer {
			border: 1px solid #909090 !important;
			min-height: 30px;
		}
		#placeholder-area.ytd-comment-simplebox-renderer,
		#commentbox #creation-box {
			margin-right: 40px;
			border-radius: 0 4px 4px 4px;
			padding: 10px 10px;
			transform: translate(0);
		}
		#placeholder-area.ytd-comment-simplebox-renderer::before {
			content: url('${browser.runtime.getURL('/images/comment-corner-placeholder.svg')}');
			position: absolute;
			left: -12px;
			top: -1px;
			z-index: 1;
		}
		#commentbox #creation-box::before {
			content: url('${browser.runtime.getURL('/images/comment-corner.svg')}');
			position: absolute;
			left: -12px;
			top: -1px;
			z-index: 1;
		}
		html[dark] #placeholder-area.ytd-comment-simplebox-renderer::before {
			content: url('${browser.runtime.getURL('/images/comment-corner-placeholder-dark.svg')}');
			position: absolute;
			left: -12px;
			top: -1px;
			z-index: 1;
		}
		html[dark] #commentbox #creation-box::before {
			content: url('${browser.runtime.getURL('/images/comment-corner-dark.svg')}');
			position: absolute;
			left: -12px;
			top: -1px;
			z-index: 1;
		}
		#commentbox #creation-box {
			min-height: 50px;
			margin-bottom: 10px;
			border: 1px solid #1b7fcc !important;
		}
		#commentbox #footer {
			margin-right: 40px;
		}
		#commentbox .underline {
			display: none;
		}
		#commentbox #cancel-button yt-button-shape > button,
		#commentbox #submit-button yt-button-shape > button {
			max-height: 30px;
			padding: 10px 10px;
			border-radius: 2px;
			text-transform: capitalize;
			font-size: 12px;
		}
		#commentbox #cancel-button yt-button-shape {
			background-color: #fafafa;
			border: 1px solid #d3d3d3;
		}
		#commentbox #cancel-button yt-button-shape:hover {
			background-color: #eaeaea;
		}
		html[dark] #commentbox #cancel-button yt-button-shape {
			background-color: #909090;
			border: 1px solid #909090;
			color: white !important;
		}
		html[dark] #commentbox #cancel-button yt-button-shape:hover {
			background-color: #999999;
			border: 1px solid #999999;
		}
		#commentbox #submit-button yt-button-shape {
			background-color: #88bce2;
			border: 1px solid #97beda;
		}
		#commentbox #submit-button yt-button-shape > button,
		html[dark] #commentbox #submit-button yt-button-shape > button {
			color: white !important;  
		}
		html[dark] #commentbox #submit-button yt-button-shape {
			background-color: #909090;
			border: 1px solid #909090;
		}
		#commentbox #submit-button yt-button-shape > button:hover {
			background-color: #72a6cc;
			cursor: pointer;
		}
		html[dark] #commentbox #submit-button yt-button-shape:hover {
			background-color: #999999;
		}
		#count.ytd-comments-header-renderer yt-formatted-string {
			display: flex;
			flex-direction: row-reverse;
			font-size: 14px;
			text-transform: uppercase;
		}
		#count.ytd-comments-header-renderer yt-formatted-string span:last-child::after {
			content: '•';
			margin: 0 5px;
		}
		#vote-count-middle {
			order: 2;
			margin-top: 0px !important;
			margin-right: 0px !important;
		}
		#like-button {
			order: 3;
			margin-left: 0px !important;
		}
		#dislike-button {
			order: 4;
		}
		.ytSubThreadSubThreadContent {
			margin-top: 0 !important;
		}
		#reply-button-end yt-button-shape > button {
			padding-left: 0;
			justify-content: left;
			padding-right: 4px !important;
			min-width: fit-content !important;
		}
		html:not([dark]) #reply-button-end yt-button-shape > button {
			color: #909090;
		}
		#reply-button-end yt-button-shape span {
			text-transform: capitalize;
			font-weight: normal;
		}
		#reply-button-end yt-button-shape span::after {
			content: '•';
			margin: 0 5px;
		}
		#comments #sort-menu #label.yt-dropdown-menu {
			box-sizing: border-box;
			background: #f8f8f8;
			color: #333;
			height: 28px;
			border: solid 1px transparent;
			border-color: #d3d3d3;
			padding: 0 10px;
			outline: 0;
			font-weight: 500;
			font-size: 11px;
			border-radius: 2px;
			box-shadow: 0 1px 0 rgb(0 0 0 / 5%);
			display: flex;
   			align-items: center;
		}
		#comments #sort-menu #label.yt-dropdown-menu:hover {
			background-color: #f0f0f0;
		}
		html[dark] #comments #sort-menu #label.yt-dropdown-menu {
			border-color: #909090 !important;
    		background: #222222 !important;
    		color: white !important;
		}
		html[dark] #comments #sort-menu #label.yt-dropdown-menu:hover {
			background-color: #505050 !important;
		}
		#comments #sort-menu yt-sort-filter-sub-menu-renderer #icon-label {
			text-transform: none;
			font-weight: normal;
			display: flex;
			align-items: center;
			font-size: 13px;
		}
		#comments #sort-menu yt-sort-filter-sub-menu-renderer #icon-label::after {
			content: '';
			margin-top: -3px;
			margin-left: 5px;
			border: 1px solid transparent;
			border-top-color: #333;
			border-width: 4px 4px 0;
			width: 0;
			height: 0;
		}
		html[dark] #comments #sort-menu yt-sort-filter-sub-menu-renderer #icon-label::after {
			border-top-color: white;
		}
		#comments #sort-menu yt-sort-filter-sub-menu-renderer #label-icon {
			display: none;
		}
		#comments #title #count {
			margin: 0 16px 0 0 !important;
		}
		`,
		trimSubs: `
		#info #owner-sub-count,
		#reduxSubDiv > #owner-sub-count {
			display: none !important;
		}
		`,
		collapseSidebar: `
		ytd-mini-guide-renderer[mini-guide-visible] {
			display: none !important;
		}
		ytd-mini-guide-renderer[mini-guide-visible] + ytd-page-manager {
			margin-left: 0 !important;
		}
		`,
		hideRelatedVideoAge: `
		#related yt-content-metadata-view-model [role="group"]:nth-child(2) > span:not(:first-child) {
			display: none !important;
		}
		`,
		hideVideoCategory: `
		#description .videoAttributesSectionViewModelHost,
		#description ytd-horizontal-card-list-renderer:not([modern-chapters]) {
			display: none !important;
		}
		`,
		hideDescriptionExtras: `
		#description [slot="extra-content"] {
			display: none !important;
		}
		`,
		moveAutoplay: `
		.redux-autoplay-checkbox-toggle {
			position: relative;
			display: inline-block;
			width: 35px;
			height: 15px;
			padding-right: 2px;
			overflow: hidden;
			vertical-align: middle;
			cursor: pointer;
		}
		#redux-autoplay-checkbox {
			position: absolute;
			margin: 0;
			width: 37px;
			height: 15px;
			opacity: 0;
		}
		#redux-autoplay-checkbox-label {
			display: flex;
			border: 1px solid transparent;
			height: 13px;
			width: 100%;
			background: #b8b8b8;
			border-radius: 20px;
		}
		#redux-autoplay-checkbox-label .toggle {
			background: #fbfbfb;
			width: 13px;
			border-radius: 13px;
		}
		.redux-autoplay-checkbox-toggle label>* {
			display: inline-flex;
			height: 100%;
			vertical-align: top;
			transition: .1s;
		}
		#redux-autoplay-checkbox + label > .checked {
			overflow: hidden;
			justify-content: center;
		}
		#redux-autoplay-checkbox:not(:checked) + label > .checked {
			width: 0px;
		}
		#redux-autoplay-checkbox:checked + label {
			background-color: #167ac6;
		}
		#redux-autoplay-checkbox:checked + label > .checked {
			width: 22px;
		}
		#redux-autoplay-checkbox + label > .checked::before {
			content: '';
			display: inline-block;
			vertical-align: middle;
			border-bottom: 1px solid white;
			border-right: 1px solid white;
			width: 3px;
			height: 9px;
			transform: rotate(45deg);
		}
		#redux-autoplay-checkbox:not(:checked) + label > .unchecked {
			width: 22px;
		}
		#redux-autoplay-label {
			font-family: Roboto, Arial, sans-serif;
			font-size: 13px;
			color: #767676;
			margin-right: 5px;
		}
		ytd-item-section-renderer > #redux-autoplay {
			margin-bottom: 8px;
		}
		[data-tooltip-target-id="ytp-autonav-toggle-button"] {
			display: none !important;
		} 
		/* disabled due to YT no longer exposing next autoplayed item in the related column
		#secondary-inner.ytd-watch-flexy #related #items ytd-item-section-renderer #contents > :first-child, 
		#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-video-renderer:first-child,
		#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-radio-renderer:first-child,
		#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-playlist-renderer:first-child {
			margin-bottom: 32px;
		} 
		#secondary-inner.ytd-watch-flexy #related #items ytd-item-section-renderer #contents > :first-child::after, 
		#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-video-renderer:first-child::after,
		#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-radio-renderer:first-child::after,
		#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-playlist-renderer:first-child::after {
			content: '';
			margin-bottom: 16px;
			margin-top: 16px;
			border-bottom: 1px solid #e2e2e2;
			width: calc(100% - 25px);
			height: 0px;
			position: absolute;
			bottom: -32px;
		}
		html[dark] #secondary-inner.ytd-watch-flexy #related #items ytd-item-section-renderer #contents > :first-child::after, 
		html[dark] #secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-video-renderer:first-child::after,
		html[dark] #secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-radio-renderer:first-child::after,
		html[dark] #secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-playlist-renderer:first-child::after {
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		}
		*/
		#redux-autoplay-upnext {
			font-family: Roboto, Arial, sans-serif;
			color: #222222;
			font-size: 13px;
			font-weight: 500;
		}
		html[dark] #redux-autoplay-upnext {
			color: white;
		}
		.redux-auto-left, .redux-auto-right {
			display: flex;
		}
		`,
		disableMiniplayer: `
		button.ytp-miniplayer-button {
			display: none !important;
		}
		ytd-app > ytd-miniplayer {
			display: none !important;
		}
		[page-subtype="home"] ytd-thumbnail #hover-overlays ytd-thumbnail-overlay-toggle-button-renderer:nth-of-type(2) {
			display: none !important;
		}
		`,
		hideCountryCode: `
		#country-code.ytd-topbar-logo-renderer {
			display: none !important;
		}
		`,
		disableVideoPreview: `
		#thumbnail > #mouseover-overlay,
		ytd-thumbnail #hover-overlays,
		ytd-video-preview[mini-mode],
		ytd-video-preview {
			display: none !important;
		}
		`,
		autoExpandSidebarSections: `
		#guide-renderer #collapser-item {
			display: none !important;
		}
		`,
		compatibleDislikesRe: `
		.ryd-tooltip {
			display: none !important;
		}
		#info ytd-menu-renderer[has-flexible-items] {
			overflow-y: unset;
		}
		`,
		hideDislikes: `
		segmented-like-dislike-button-view-model dislike-button-view-model {
			display: none !important;
		}
		`,
		hideDownload: `
		#above-the-fold ytd-download-button-renderer {
			display: none !important;
		}
		`,
		hideShorts: `
		#endpoint[title="Shorts"],
		ytd-search ytd-reel-shelf-renderer,
		ytd-two-column-search-results-renderer grid-shelf-view-model,
		#related ytd-reel-shelf-renderer,
		[slot="extra-content"] ytd-reel-shelf-renderer {
			display: none !important;
		}
		`,
		hideChaptersInSearch: `
		ytd-search ytd-expandable-metadata-renderer {
			display: none !important;
		}
		`,
		hideChaptersInDescription: `
		#description ytd-horizontal-card-list-renderer[modern-chapters] {
			display: none !important;
		}
		`,
		hideHeatmap: `
		.ytp-heat-map-chapter {
			display: none !important;
		}
		`,
		hideSurveys: `
		#attached-survey,
		ytd-feed-nudge-renderer {
			display: none !important;
		}
		`,
		hideHomeChannelAvatars: `
		#avatar-link.ytd-rich-grid-media,
		#details.ytd-rich-grid-media > #avatar-container,
		[page-subtype="home"] .yt-lockup-metadata-view-model-wiz__avatar,
		[page-subtype="home"] .yt-lockup-metadata-view-model__avatar,
		[page-subtype="home"] .ytLockupMetadataViewModelAvatar {
			display: none !important;
		}
		`,
		hideMixTopStack: `
		yt-collections-stack *[class*='ytCollectionsStackCollectionStack'] {
			display: none !important;
		}
		`,
		hideClickAnimations: `
		.fill.yt-interaction,
		.stroke.yt-interaction {
			opacity: 0 !important;
			border: unset !important;
		}
		paper-ripple {
			display: none !important;
		}
		`,
		hideHashtags: `
		a[href^="/hashtag/"] {
			display: none !important;
		}
		`,
		hideTicketShelf: `
		#ticket-shelf {
			display: none !important;
		}
		`,
		hideAISummary: `
		#primary-inner #video-summary {
			display: none !important;
		}
		`,
		hideEndScreen: `
		#ytd-player .ytp-ce-element {
			display: none !important;
		}
		`,
		hideExtraSearchCategories: `
		ytd-two-column-search-results-renderer ytd-shelf-renderer {
			display: none !important;
		}
		`
	};

	let compatStyles = `
	#video-title.ytd-rich-grid-media {
		font-size: 14px !important;
		line-height: 20px !important;
	}
	[page-subtype="home"] #text-container.ytd-channel-name,
	[page-subtype="subscriptions"] #text-container.ytd-channel-name {
		font-size: 11px !important;
	}
	#metadata-line.ytd-video-meta-block {
		font-size: 11px !important;
	}
	#video-title.ytd-compact-video-renderer,
	a > #video-title.ytd-rich-grid-media,
	#video-title.yt-simple-endpoint.ytd-grid-video-renderer {
		line-height: 20px !important;
	}
	`;
	let compatLogo = `
	ytd-masthead ytd-topbar-logo-renderer > #logo #logo-icon {
		background: url('${browser.runtime.getURL(`/images/${reduxSettings.classicLogoChoice}logo.${logoExtension}`)}') !important;
		height: 0px !important;
		width: 0px !important;
		background-size: contain !important;
		background-repeat: no-repeat !important;
		padding: 31px 72px 0px 0px !important;
	}
	ytd-masthead[dark] ytd-topbar-logo-renderer > #logo #logo-icon {
		background: url('${browser.runtime.getURL(`/images/${reduxSettings.classicLogoChoice}logo-dark.${logoExtension}`)}') !important;
		height: 0px !important;
		width: 0px !important;
		background-size: contain !important;
		background-repeat: no-repeat !important;
		padding: 31px 72px 0px 0px !important;
	}
	`;
	let compatAltUploadIcon = `
	ytd-topbar-menu-button-renderer:first-of-type yt-icon-button yt-icon {
		background: url('${browser.runtime.getURL('/images/old-upload.svg')}') !important;
		filter: contrast(0);
		height: 0px !important;
		width: 0px !important;
		background-size: contain !important;
		background-repeat: no-repeat !important;
		padding: 20px 17px 0px 0px !important;

	}
	ytd-masthead[dark] ytd-topbar-menu-button-renderer:first-of-type yt-icon-button yt-icon {
		background: url('${browser.runtime.getURL('/images/old-upload-dark.svg')}') !important;
		filter: contrast(1);
		height: 0px !important;
		width: 0px !important;
		background-size: contain !important;
		background-repeat: no-repeat !important;
		padding: 20px 17px 0px 0px !important;
	}
	`;
	let compatClassicLikesStyle = `
	#endpoint[href="/playlist?list=LL"] yt-icon:first-of-type {
		background: url('${browser.runtime.getURL('/images/like.png')}') !important;
		filter: contrast(0);
		height: 0px !important;
		width: 0px !important;
		background-repeat: no-repeat !important;
		margin-top: 28px !important;
	}
	ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:first-of-type > a > yt-icon-button > #button > yt-icon {
		background: url('${browser.runtime.getURL('/images/like.png')}') !important;
		filter: contrast(0);
		height: 0px !important;
		width: 0px !important;
		margin: 3px 0px 0px 3px !important;
		background-repeat: no-repeat !important;
		padding: 17px 17px !important;
	}
	ytd-comment-action-buttons-renderer #like-button yt-icon {
		background: url('${browser.runtime.getURL('/images/like.png')}') !important;
		filter: contrast(0);
		height: 0px !important;
		width: 0px !important;
		background-repeat: no-repeat !important;
		padding: 17px 17px !important;
	}
	ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:first-of-type > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
	ytd-comment-action-buttons-renderer #like-button #button[aria-pressed="true"] yt-icon {
		background: url('${browser.runtime.getURL('/images/like-pressed.png')}') !important;
		background-repeat: no-repeat !important;
		filter: contrast(1);
	}
	ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:last-of-type > a > yt-icon-button > #button > yt-icon {
		background: url('${browser.runtime.getURL('/images/dislike.png')}') !important;
		filter: contrast(0);
		height: 0px !important;
		width: 0px !important;
		margin: 3px 0px 0px 3px !important;
		background-repeat: no-repeat !important;
		padding: 17px 17px !important;
	}
	ytd-comment-action-buttons-renderer #dislike-button yt-icon {
		background: url('${browser.runtime.getURL('/images/dislike.png')}') !important;
		filter: contrast(0);
		height: 0px !important;
		width: 0px !important;
		background-repeat: no-repeat !important;
		padding: 17px 17px !important;
	}
	ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:last-of-type > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
	ytd-comment-action-buttons-renderer #dislike-button #button[aria-pressed="true"] yt-icon {
		background: url('${browser.runtime.getURL('/images/dislike-pressed.png')}') !important;
		background-repeat: no-repeat !important;
		filter: contrast(1);
	}
	`;
	let compatClassicLikesIconColorsExtra = `
	ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:first-of-type > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
	ytd-comment-action-buttons-renderer #like-button #button[aria-pressed="true"] yt-icon {
		background: url('${browser.runtime.getURL('/images/like-pressed-old.png')}') !important;
		background-repeat: no-repeat !important;
	}
	ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:last-of-type > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
	ytd-comment-action-buttons-renderer #dislike-button #button[aria-pressed="true"] yt-icon {
		background: url('${browser.runtime.getURL('/images/dislike-pressed-old.png')}') !important;
		background-repeat: no-repeat !important;
	}
	`;

	function mergeOptions() {
		let mergedOptions = '';
		for (let i = 0; i < Object.keys(allStyles).length; i++) {
			const currentKey = Object.keys(allStyles)[i];
			if (currentKey === 'classicLogoChoice' && reduxSettings[currentKey] == '2017') continue;
			if (reduxSettings[currentKey]) {
				mergedOptions += Object.values(allStyles)[i];
			}
			if (currentKey === 'classicLogoChoice' && reduxSettings[currentKey] == '2005alt') {
				mergedOptions += `ytd-masthead #logo-icon-container, 
				#contentContainer #logo-icon-container, 
				ytd-topbar-logo-renderer > #logo,
				#start > #masthead-logo, 
				#masthead > #masthead-logo { 
					height: 40px !important; 
				}`;
			}
		}

		if (browserVersion < 75) {
			mergedOptions += compatStyles;
			if (reduxSettings['classicLogoChoice'] != '2017') {
				mergedOptions += compatLogo;
			}
			if (reduxSettings['altUploadIcon']) {
				mergedOptions += compatAltUploadIcon;
			}
			if (reduxSettings['classicLikesStyle']) {
				mergedOptions += compatClassicLikesStyle;
			}
		}

		if (reduxSettings.classicLikesStyle && reduxSettings.classicLikesIconColors) {
			mergedOptions += allStyles.classicLikesIconColorsExtra;
			if (browserVersion < 75) {
				mergedOptions += compatClassicLikesIconColorsExtra;
			}
		}
		return mergedOptions;
	}
	let customStyle = document.createElement("style");
	customStyle.id = 'redux-style';
	let customStyleInner = mergeOptions();
	customStyle.appendChild(document.createTextNode(customStyleInner));
	document.documentElement.append(customStyle);

	if (reduxSettings.favicon != "3") changeFavicon(reduxSettings.favicon);
	if (reduxSettings.oldIcons) changeIcons();

	function changeIcons() {

		function doStuff() {
			let changeFlags = setInterval(() => {
				if (yt) {
					yt.config_.EXPERIMENT_FLAGS.kevlar_system_icons = false;
					clearInterval(changeFlags);
				}
			}, 10);
		}

		const script = document.createElement("script");
		script.id = 'redux-old-icons';
		script.text = `(${doStuff.toString()})();`;
		document.documentElement.appendChild(script);
	}

	function changeFavicon(iconNumber) {
		if (document.querySelector('link[rel="shortcut icon"]') == null) {
			setTimeout(changeFavicon, 250);
			return;
		}

		let iconExtension = 'png';
		if (iconNumber == "1") iconExtension = 'ico';
		const iconUrl = browser.runtime.getURL(`/images/favicon${iconNumber}.${iconExtension}`);
		const linkElement = document.createElement('link');
		linkElement.rel = 'icon';
		linkElement.href = iconUrl;
		document.head.prepend(linkElement);
		document.querySelector('link[rel="shortcut icon"]').href = iconUrl;
		document.querySelectorAll('link[rel="icon"]').forEach(element => element.href = iconUrl);
	}
}