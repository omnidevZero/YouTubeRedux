let reduxSettings;
let playerSize = {};
let aspectRatio = (window.screen.width / window.screen.height).toFixed(2);
let logoExtension;
const defaultSettings = {
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
	"blackBars": false, 
	"rearrangeInfo": false, 
	"classicLogoChoice": 2017, 
	"filterMain": false, 
	"filterVideo": false, 
	"filterMini": false, 
	"extraLayout": true, 
	"darkerRed": false, 
	"trueFullscreen": false, 
	"favicon": 3, 
	"channelListView": false, 
	"searchAlignLeft": true, 
	"squareAvatar": true, 
	"hideHomeAvatars": false, 
	"noHomeScaling": false, 
	"squareSearch": false, 
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
	"hideApps": false,
	"classicLikesIconColors": false,
	"hideJoinButton": false,
	"trimSubs": false,
	"altStrings": false
};

initiate();

function initiate() {
	chrome.storage.sync.get(['reduxSettings'], function(result) {
		if (Object.keys(result).length == 0) {
			chrome.storage.sync.set({reduxSettings: defaultSettings});
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
					console.log('Missing setting ' + i + ' was added.');
					result.reduxSettings[i] = defaultSettings[i];
					chrome.storage.sync.set({reduxSettings: result.reduxSettings});
				}
			}
			reduxSettings = result.reduxSettings; //reassign in case missing settings were added
			playerSize.width = reduxSettings.smallPlayerWidth == undefined ? 853 : reduxSettings.smallPlayerWidth;
			playerSize.height = Math.ceil(playerSize.width / aspectRatio);
		}

		logoExtension = reduxSettings.classicLogoChoice === 'XL' ? 'png' : 'svg';
		addCustomStyles();
	});
}

function addCustomStyles() {
	let allStyles = {
		hideCastButton: `/*PLAY ON TV BUTTON*/[class="ytp-button"]:not([data-tooltip-target-id="ytp-autonav-toggle-button"]) {display:none !important;}`,
		hideAutoplayButton: `/*AUTOPLAY BUTTON*/[class="ytp-button"][data-tooltip-target-id="ytp-autonav-toggle-button"] {display:none !important;}`,
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
		}
		/*[class="ytp-chrome-bottom"] {
		width: calc(100% - 12px) !important;
		}*/
		`,
		darkPlaylist: `
		/*DARK PLAYLIST*/
		#playlist.ytd-watch-flexy {
		transform: translate(-12px, -1px) !important;
		}
		.header.ytd-playlist-panel-renderer {
		background-color: #1a1a1a !important;
		}
		ytd-playlist-panel-renderer[collapsible] .title.ytd-playlist-panel-renderer {
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
		.publisher.ytd-playlist-panel-renderer {
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
		margin-right: -12px !important;
		}
		`,
		classicLogoChoice: `
		ytd-masthead #logo-icon-container, 
		#contentContainer #logo-icon-container, 
		ytd-topbar-logo-renderer > #logo,
		#start > #masthead-logo,
		#masthead > #masthead-logo {
			content: url('${chrome.extension.getURL(`/images/${reduxSettings.classicLogoChoice}logo.${logoExtension}`)}') !important;
			width: 72px !important;
			padding: 18px 14px 18px 16px !important;
		}
		ytd-masthead[dark] #logo-icon-container, 
		html[dark] #contentContainer #logo-icon-container, 
		ytd-masthead[dark] ytd-topbar-logo-renderer > #logo, 
		html[dark] ytd-topbar-logo-renderer > #logo,
		html[dark] #start > #masthead-logo,
		html[dark] #masthead > #masthead-logo {
			content: url('${chrome.extension.getURL(`/images/${reduxSettings.classicLogoChoice}logo-dark.${logoExtension}`)}') !important;
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
		filterMain: `
		[page-subtype="home"] > #primary > ytd-rich-grid-renderer > #header > ytd-feed-filter-chip-bar-renderer {
			display: none !important;
		}
		`,
		filterVideo: `
		#items > yt-related-chip-cloud-renderer.ytd-watch-next-secondary-results-renderer {
			display: none !important;
		}
		#items.ytd-watch-next-secondary-results-renderer ytd-compact-autoplay-renderer:first-child > #contents ytd-compact-video-renderer {
			padding-bottom: 0 !important;
		}
		`,
		filterMini: `
		[page-subtype="home"] > #primary > ytd-rich-grid-renderer > #header > ytd-feed-filter-chip-bar-renderer > #chips-wrapper #scroll-container #chips yt-chip-cloud-chip-renderer:not(:first-child):not(:nth-last-child(2)) {
			display: none !important;
		}
		[page-subtype="home"] > #primary > ytd-rich-grid-renderer > #header > ytd-feed-filter-chip-bar-renderer > #chips-wrapper #scroll-container #chips yt-chip-cloud-chip-renderer {
			height: 20px !important;
		}
		yt-chip-cloud-chip-renderer.ytd-feed-filter-chip-bar-renderer {
			margin-top: 5px !important;
			margin-bottom: 5px !important;
		}
		ytd-feed-filter-chip-bar-renderer {
			height: 30px !important;
		}
		[page-subtype="home"] > #primary > ytd-rich-grid-renderer > #header > ytd-feed-filter-chip-bar-renderer > #chips-wrapper > #right-arrow {
			display: none !important;
		}
		`,
		extraLayout: `
		/*EXTRA LAYOUT 1 - VIDEO*/
		ytd-app {
			background-color: #f1f1f1 !important;
		}
		html[dark] ytd-app {
			background-color: var(--yt-spec-general-background-a) !important;
		}
		ytd-video-primary-info-renderer, ytd-video-secondary-info-renderer {
			background-color: white !important;
			padding-left: 15px !important;
			box-shadow: 0 1px 2px rgba(0,0,0,.1) !important;
			border-bottom: 0 !important;
			margin-bottom: 10px !important;
		}
		html[dark] ytd-video-primary-info-renderer, html[dark] ytd-video-secondary-info-renderer {
			background-color: #222222 !important;
			padding-left: 15px !important;
			box-shadow: 0 1px 2px rgba(255,255,255,.1) !important;
			border-bottom: 0 !important;
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
			background-color: white !important;
			padding-left: 15px !important;
			padding-top: 1px !important;
			box-shadow: 0 1px 2px rgba(0,0,0,.1) !important;
		}
		html[dark] ytd-comments#comments {
			background-color: #222222 !important;
			padding-left: 15px !important;
			padding-top: 1px !important;
			box-shadow: 0 1px 2px rgba(255,255,255,.1) !important;
		}
		#meta-contents > ytd-video-secondary-info-renderer > #container > ytd-expander > #content {
			padding-top: 10px !important;
		}
		#meta.ytd-watch-flexy paper-button#more,
		#meta.ytd-watch-flexy tp-yt-paper-button#more,
		#meta.ytd-watch-flexy paper-button#less,
		#meta.ytd-watch-flexy tp-yt-paper-button#less {
			width: calc(100% - 15px) !important;
			border-top: 1px solid #e2e2e2 !important;
			margin-top: 10px !important;
		}
		html[dark] #meta.ytd-watch-flexy paper-button#more, 
		html[dark] #meta.ytd-watch-flexy tp-yt-paper-button#more,
		html[dark] #meta.ytd-watch-flexy paper-button#less,
		html[dark] #meta.ytd-watch-flexy tp-yt-paper-button#less {
			border-top: 1px solid var(--yt-spec-10-percent-layer) !important;
		}
		#secondary-inner.ytd-watch-flexy #related {
			background-color: white !important;
			box-shadow: 0 1px 2px rgba(0,0,0,.1) !important;
			padding-left: 15px !important;
			padding-top: 7px !important;
			margin-left: -13px !important;
		}
		html[dark] #secondary-inner.ytd-watch-flexy #related {
			background-color: #222222 !important;
			box-shadow: 0 1px 2px rgba(255,255,255,.1) !important;
			padding-left: 15px !important;
			padding-top: 7px !important;
			margin-left: -13px !important;
		}
		#secondary-inner.ytd-watch-flexy #playlist + #related:not(#secondary-inner.ytd-watch-flexy #playlist[hidden="true"] + #related) {
			padding-top: 7px !important;
		}
		#secondary-inner.ytd-watch-flexy #playlist[hidden="true"] + #related {
			padding-top: 15px !important;
		}
		#always-shown ytd-rich-metadata-renderer {
			background: none !important;
		}
		#secondary-inner.ytd-watch-flexy ytd-playlist-panel-renderer:not([hidden="true"]) + #related #items > ytd-compact-video-renderer:first-child {
			padding-top: 8px !important;
		}
		yt-chip-cloud-renderer,
		#left-arrow-button.yt-chip-cloud-renderer, 
		#right-arrow-button.yt-chip-cloud-renderer {
			background-color: white !important;
		}
		html[dark] yt-chip-cloud-renderer,
		html[dark] #left-arrow-button.yt-chip-cloud-renderer, 
		html[dark] #right-arrow-button.yt-chip-cloud-renderer {
			background-color: #222222 !important;
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
		/*EXTRA LAYOUT 2 - HOME*/
		app-drawer#guide[position="left"] {
			border-right: 1px solid #e8e8e8 !important;
		}
		html[dark] app-drawer#guide[position="left"] {
			border-right: 1px solid var(--yt-spec-10-percent-layer) !important;
		}
		#masthead-container.ytd-app #masthead:not([dark]) {
			border-bottom: 1px solid #e8e8e8 !important;
		}
		html[dark] #masthead-container.ytd-app {
			border-bottom: 1px solid var(--yt-spec-10-percent-layer) !important;
		}
		@media (max-width: 2000px) {
			#page-manager ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer,
			#page-manager ytd-browse[page-subtype="subscriptions"] ytd-two-column-browse-results-renderer {
				max-width: 1356.81px !important;  
			}
		}
		@media (min-width: 2001px) {
			#page-manager ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer,
			#page-manager ytd-browse[page-subtype="subscriptions"] ytd-two-column-browse-results-renderer {
			  max-width: 2713.62px !important;
			} 
		}
		#header.ytd-rich-grid-renderer {
			display: none !important;
		}
		ytd-rich-shelf-renderer {
			border-top: 1px solid var(--yt-spec-10-percent-layer) !important;
		}
		#video-title.ytd-rich-grid-media, 
		#video-title.yt-simple-endpoint.ytd-grid-video-renderer {
			font-size: min(13px, calc((90 / var(--ytd-rich-grid-items-per-row)) * 1px)) !important;
			line-height: 1.3em !important;
		}
		#contents.ytd-rich-grid-renderer #text.ytd-channel-name, 
		[page-subtype="subscriptions"] #text.ytd-channel-name, 
		[page-subtype="subscriptions"] #metadata-line.ytd-grid-video-renderer, 
		[page-subtype="channels"] #text.complex-string.ytd-channel-name, 
		[page-subtype="channels"] #metadata-line.ytd-grid-video-renderer {
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
			width: 10.83vw !important;
		}
		#contents.ytd-section-list-renderer {
			padding-left: 10px !important;
		}
		[page-subtype="subscriptions"] #contents.ytd-section-list-renderer {
			margin-right: -16px !important;
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
		#contents.ytd-rich-grid-renderer {
			margin-top: 12px !important;
		}
		html[dark] #contents.ytd-rich-grid-renderer, html[dark] #contents.ytd-section-list-renderer {
			background: #222222 !important;
			box-shadow: 0 1px 2px rgba(255,255,255,.1) !important;
		}
		ytd-video-meta-block[rich-meta] #metadata-line.ytd-video-meta-block {
			line-height: 1.3em !important;
		}
		ytd-rich-shelf-renderer[is-show-more-hidden] #dismissable.ytd-rich-shelf-renderer {
			border-bottom: 1px solid var(--yt-spec-10-percent-layer) !important;
		}
		#avatar-link.ytd-rich-grid-media {
			display:none !important;
		}
		h3.ytd-rich-grid-media, h3.ytd-grid-video-renderer {
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
		ytd-rich-section-renderer {
			display:none !important;
		}
		[page-subtype="channels"] ytd-two-column-browse-results-renderer .flex-container.ytd-compact-station-renderer {
			background: none !important;
		}
		#player.ytd-watch-flexy {
			margin-bottom: 10px !important;
		}
		/*SKELETON*/
		#home-page-skeleton .rich-shelf-videos,
		#home-page-skeleton #home-container-media {
			margin-left: 8vw !important;
			margin-right: 8vw !important;
			transform: translate(20px, -2px);
		}
		#home-page-skeleton .rich-shelf-videos .rich-grid-media-skeleton.mini-mode,
		#home-page-skeleton #home-container-media .rich-grid-media-skeleton.mini-mode {
			flex-basis: 205px !important;
			min-width: 205px !important;
			max-width: 205px !important;
		}
		#home-page-skeleton .video-details {
			padding-bottom: 30px !important;
		}
		/*MISC*/
		.badge-style-type-verified > yt-icon {
			content: url(${chrome.extension.getURL('/images/verified1.png')});
			width: 12px !important;
			height: 9px !important;
			margin-bottom: 1px !important;
		}
		.badge-style-type-verified > yt-icon:hover {
			content: url(${chrome.extension.getURL('/images/verified2.png')});
			width: 12px !important;
			height: 9px !important;
			margin-bottom: 1px !important;
		}
		[page-subtype="channels"] #contents.ytd-section-list-renderer {
			margin-right: -4px !important;
		}
		/* Scrollbar */
		body:not(.style-scope)[standardized-themed-scrollbar]:not(.style-scope):not([no-y-overflow]):not(.style-scope)::-webkit-scrollbar {
			width: 8px !important;
		}
		body:not(.style-scope)[standardized-themed-scrollbar]:not(.style-scope):not([no-y-overflow]):not(.style-scope)::-webkit-scrollbar-thumb {
			height: 56px;
			border-radius: 0px !important;
			border: 0px solid transparent !important;
			background-clip: content-box;
			background-color: var(--yt-spec-icon-disabled) !important;
		}
		body:not(.style-scope)[standardized-themed-scrollbar]:not(.style-scope):not([no-y-overflow]):not(.style-scope)::-webkit-scrollbar-thumb:hover {
			background-color: var(--yt-spec-icon-inactive) !important;
		}
		ytd-product-list-renderer[standardized-themed-scrollbar]::-webkit-scrollbar {
			width: 8px !important;
		}
		ytd-product-list-renderer[standardized-themed-scrollbar]::-webkit-scrollbar-thumb {
			height: 56px;
			border-radius: 0px !important;
			border: 0px solid transparent !important;
			background-clip: content-box;
			background-color: var(--yt-spec-icon-disabled) !important;
		}
		ytd-product-list-renderer[standardized-themed-scrollbar]::-webkit-scrollbar-thumb:hover {
			background-color: var(--yt-spec-icon-inactive) !important;
		}
		ytd-transcript-body-renderer[standardized-themed-scrollbar]::-webkit-scrollbar {
			width: 8px !important;
		}
		ytd-transcript-body-renderer[standardized-themed-scrollbar]::-webkit-scrollbar-thumb {
			height: 56px;
			border-radius: 0px !important;
			border: 0px solid transparent !important;
			background-clip: content-box;
			background-color: var(--yt-spec-icon-disabled) !important;
		}
		ytd-transcript-body-renderer[standardized-themed-scrollbar]::-webkit-scrollbar-thumb:hover {
			background-color: var(--yt-spec-icon-inactive) !important;
		}
		ytd-macro-markers-list-renderer[standardized-themed-scrollbar] #contents.ytd-macro-markers-list-renderer::-webkit-scrollbar {
			width: 8px !important;
		}
		ytd-macro-markers-list-renderer[standardized-themed-scrollbar] #contents.ytd-macro-markers-list-renderer::-webkit-scrollbar-thumb {
			height: 56px;
			border-radius: 0px !important;
			border: 0px solid transparent !important;
			background-clip: content-box;
			background-color: var(--yt-spec-icon-disabled) !important;
		}
		ytd-macro-markers-list-renderer[standardized-themed-scrollbar] #contents.ytd-macro-markers-list-renderer::-webkit-scrollbar-thumb:hover {
			background-color: var(--yt-spec-icon-inactive) !important;
		}
		ytd-playlist-sidebar-renderer[standardized-themed-scrollbar]::-webkit-scrollbar {
			width: 8px !important;
		}
		ytd-playlist-sidebar-renderer[standardized-themed-scrollbar]::-webkit-scrollbar-thumb {
			height: 56px;
			border-radius: 0px !important;
			border: 0px solid transparent !important;
			background-clip: content-box;
			background-color: var(--yt-spec-icon-disabled) !important;
		}
		ytd-playlist-sidebar-renderer[standardized-themed-scrollbar]::-webkit-scrollbar-thumb:hover {
			background-color: var(--yt-spec-icon-inactive) !important;
		}
		ytd-playlist-panel-renderer[standardized-themed-scrollbar] .playlist-items.ytd-playlist-panel-renderer::-webkit-scrollbar {
			width: 8px !important;
		}
		ytd-playlist-panel-renderer[standardized-themed-scrollbar] .playlist-items.ytd-playlist-panel-renderer::-webkit-scrollbar-thumb {
			height: 56px;
			border-radius: 0px !important;
			border: 0px solid transparent !important;
			background-clip: content-box;
			background-color: var(--yt-spec-icon-disabled) !important;
		}
		ytd-playlist-panel-renderer[standardized-themed-scrollbar] .playlist-items.ytd-playlist-panel-renderer::-webkit-scrollbar-thumb:hover {
			background-color: var(--yt-spec-icon-inactive) !important;
		}
		ytd-channel-switcher-renderer[standardized-themed-scrollbar] .menu-container.ytd-channel-switcher-renderer::-webkit-scrollbar {
			width: 8px !important;
		}
		ytd-channel-switcher-renderer[standardized-themed-scrollbar] .menu-container.ytd-channel-switcher-renderer::-webkit-scrollbar-thumb {
			height: 56px;
			border-radius: 0px !important;
			border: 0px solid transparent !important;
			background-clip: content-box;
			background-color: var(--yt-spec-icon-disabled) !important;
		}
		ytd-channel-switcher-renderer[standardized-themed-scrollbar] .menu-container.ytd-channel-switcher-renderer::-webkit-scrollbar-thumb:hover {
			background-color: var(--yt-spec-icon-inactive) !important;
		}
		ytd-app[standardized-themed-scrollbar] #guide-inner-content.ytd-app::-webkit-scrollbar {
			background: transparent;
			width: 8px !important;
		}
		ytd-app[standardized-themed-scrollbar] #guide-inner-content.ytd-app::-webkit-scrollbar-thumb {
			height: 56px;
			border-radius: 0px !important;
			border: 0px solid transparent !important;
			background-clip: content-box;
			background-color: transparent;
		}
		ytd-app[standardized-themed-scrollbar] #guide-inner-content.ytd-app:hover::-webkit-scrollbar-thumb {
			background-color: var(--yt-spec-icon-disabled) !important;
		}
		/* SUB + MISC BUTTONS */
		#subscribe-button > ytd-subscribe-button-renderer > tp-yt-paper-button,
		#sponsor-button > ytd-button-renderer > a > tp-yt-paper-button, 
		#analytics-button > ytd-button-renderer > a > tp-yt-paper-button {
			margin: 0 !important; 
			padding: 2px 8px 2px 8px !important; 
			text-transform: none !important; 
			font-weight: normal !important; 
			font-size: 12px !important;
			max-height: 24px !important;
			height: 24px !important;
		}
		ytd-channel-renderer #subscribe-button > ytd-subscribe-button-renderer > tp-yt-paper-button {
			margin-right: 10px !important;
		}
		#subscribe-button > ytd-subscribe-button-renderer > tp-yt-paper-button > yt-formatted-string {
			padding-top: 1px !important;
		}
		#subscribe-button > ytd-subscribe-button-renderer > tp-yt-paper-button:not([subscribed])::before {
				content: url('${chrome.extension.getURL('/images/sub-icon.png')}') !important;
				background-size: auto !important;
				width: 16px !important;
				height: 12px !important;
				margin-right: 6px !important;
		}
		#sponsor-button.ytd-video-owner-renderer, #analytics-button.ytd-video-owner-renderer {
			margin-right: 0px !important;
		}
		#sponsor-button.ytd-video-owner-renderer > ytd-button-renderer, #analytics-button.ytd-video-owner-renderer > ytd-button-renderer {
			margin-right: 4px !important;
		}
		#notification-preference-button > ytd-subscription-notification-toggle-button-renderer > a > yt-icon-button {
			max-height: 21px !important; 
			max-width: 21px !important; 
			padding: 0 !important; 
			margin-right: 5px !important;
		}
		`,
		darkerRed: `
		/*DARKER RED*/
		ytd-guide-entry-renderer[active] {
			background-color: #cc181e !important;
		}
		#guide-section-title.ytd-guide-section-renderer,
		#guide-section-title.ytd-guide-section-renderer a {
			color: #cc181e !important;
		}
		ytd-mini-guide-entry-renderer[active] .guide-icon.ytd-mini-guide-entry-renderer, ytd-mini-guide-entry-renderer[active] .title.ytd-mini-guide-entry-renderer {
			color: #cc181e !important;
		}
		#progress.ytd-thumbnail-overlay-resume-playback-renderer {
			background-color: #cc181e !important;
		}
		#reduxSubDiv > #subscribe-button > ytd-subscribe-button-renderer > paper-button:not([subscribed]),
		#reduxSubDiv > #subscribe-button > ytd-subscribe-button-renderer > tp-yt-paper-button:not([subscribed]) {
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
		`,
		channelListView: `
		[page-subtype="channels"] #contents > ytd-item-section-renderer > #contents > ytd-grid-renderer > #items {
			counter-reset: video;
		}
		[page-subtype="channels"] #contents > ytd-item-section-renderer > #contents > ytd-grid-renderer > #items > ytd-grid-video-renderer {
			width: 100% !important;
			margin-bottom: 0 !important;
			counter-increment: video;
		}
		[page-subtype="channels"] #contents > ytd-item-section-renderer > #contents > ytd-grid-renderer > #items > ytd-grid-video-renderer #dismissible::before {
			content: counter(video);
			top: -36px;
			position: relative;
			margin-right: 10px;
			color: var(--yt-spec-text-secondary) !important;
			display: inline-block;
			min-width: 3ch;
			text-align: center;
		}
		[page-subtype="channels"] #contents > ytd-item-section-renderer > #contents > ytd-grid-renderer > #items > ytd-grid-video-renderer #dismissible {
			position: relative !important;
		}
		[page-subtype="channels"] #contents > ytd-item-section-renderer > #contents > ytd-grid-renderer > #items > ytd-grid-video-renderer ytd-thumbnail {
			display: inline-block !important;
			max-width: 150px !important;
			max-height: 84px !important;
		}
		[page-subtype="channels"] #contents > ytd-item-section-renderer > #contents > ytd-grid-renderer > #items > ytd-grid-video-renderer #details.ytd-grid-video-renderer {
			position: absolute !important;
			top: 0 !important;
			display: inline-block !important;
			margin-left: 10px !important;
			transform: translateY(-50%) !important;
			top: 50% !important;
		}
		[page-subtype="channels"] #contents > ytd-item-section-renderer > #contents > ytd-grid-renderer > #items > ytd-grid-video-renderer #details.ytd-grid-video-renderer > #meta > h3.ytd-grid-video-renderer {
			margin: 0px 0 1px 0 !important;
		}
		`,
		searchAlignLeft: `
		#center.ytd-masthead { 
			margin-right: auto !important;
		}
		ytd-searchbox.ytd-masthead {
			margin: 0 0 0 51px !important;
		} 
		`,
		squareAvatar: `
		#masthead #avatar-btn > yt-img-shadow,
		ytd-popup-container #header yt-img-shadow#avatar { 
			border-radius: 0 !important;
		} 
		`,
		hideHomeAvatars: `
		#avatar-link.ytd-rich-grid-media {
			display:none !important;
		}
		`,
		noHomeScaling: `
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
			font-size: calc(var(--ytd-tab-system_-_font-size) - 0.2rem) !important;
		}
		ytd-guide-signin-promo-renderer {
			padding: 16px 16px !important;
		}
		ytd-guide-signin-promo-renderer #sign-in-button {
			background-color: var(--yt-spec-call-to-action);
			color: var(--yt-spec-text-primary-inverse);
		}
		ytd-guide-signin-promo-renderer #sign-in-button #button {
			padding: 5px 10px !important;
		}
		ytd-guide-signin-promo-renderer #sign-in-button yt-icon {
			display: none !important;
		}
		ytd-guide-signin-promo-renderer #sign-in-button yt-formatted-string {
			margin-left: 0 !important;
			text-transform: none !important;
			font-size: 11px !important;
		}
		`,
		altVideoLayout: `
		#info-contents ytd-video-primary-info-renderer > yt-icon-button  {
			transform: translateY(0px) !important;
		}
		#player.ytd-watch-flexy {
			margin-bottom: 0px !important;
		}
		#redux-video-header {
			background-color: white; 
			padding: 8px 15px 2px 15px; 
			box-shadow: 0 1px 2px rgb(0 0 0 / 10%) !important;
		}
		html[dark] #redux-video-header {
			background-color: #222222;
		}
		ytd-video-primary-info-renderer {
			padding: 8px 0px !important;
		}
		#top-row.ytd-video-secondary-info-renderer {
			padding-top: 6px !important;
			margin-bottom: 6px !important;
		}
		`,
		altVideoLayoutExtra: `
		#info.ytd-video-primary-info-renderer > #menu-container  {
			transform: translateY(0px) !important;
		}
		#info.ytd-video-primary-info-renderer > #menu-container #menu {
			color: var(--yt-spec-text-secondary); 
			justify-content: normal !important; 
			margin-top: 1px;
		}
		#info.ytd-video-primary-info-renderer > #top-level-buttons ytd-toggle-button-renderer yt-formatted-string {
			display: none !important;
		}
		`,
		customTitleFont: `
		.title.style-scope.ytd-video-primary-info-renderer yt-formatted-string.ytd-video-primary-info-renderer {
			font-family: "${reduxSettings.titleFontValue}" !important;
		}
		`,
		hideVoiceSearch: `
		#voice-search-button {
			display: none !important;
		}
		`,
		subBorder: `
		#reduxSubDiv > yt-formatted-string {
			border-left: 0px !important;
			border-radius: 0 2px 2px 0;
			padding-left: 7px;
			padding-right: 7px;
			padding-bottom: 1px;
			padding-top: 3px !important;
			margin-left: 0px !important;
		}
		#reduxSubDiv > yt-formatted-string,
		#reduxSubDiv #notification-preference-button {
			border: 1px solid #ccc;
			background-color: #fafafa;
		}
		#reduxSubDiv #notification-preference-button {
			border-right: none !important;
			border-left: none !important;
		}
		#reduxSubDiv #notification-preference-button yt-icon-button {
			margin-right: -7px !important;
		}
		html[dark] #reduxSubDiv > yt-formatted-string,
		html[dark] #reduxSubDiv #notification-preference-button {
			border: 1px solid var(--yt-spec-10-percent-layer);
			background: none;
		}
		#reduxSubDiv tp-yt-paper-button {
			border-top-right-radius: 0px !important;
			border-bottom-right-radius: 0px !important;
		}
		#reduxSubDiv tp-yt-paper-button[subscribed] {
			border: 1px solid #ccc;
		}
		html[dark] #reduxSubDiv tp-yt-paper-button[subscribed] {
			border: none;
		}
		`,
		blackBars: `
		.html5-video-container video {
			background-color: black;
		}
		`,
		classicLikesStyle: `
		#top-level-buttons-computed > ytd-toggle-button-renderer:first-child > a > yt-icon-button > #button > yt-icon {
			content: url('${chrome.extension.getURL('/images/like.png')}') !important;
			filter: contrast(0);
			height: 17px !important;
			width: 17px !important;
		}
		#top-level-buttons-computed > ytd-toggle-button-renderer:first-child > a > yt-icon-button > #button > yt-icon:hover,
		#top-level-buttons-computed > ytd-toggle-button-renderer:last-child > a > yt-icon-button > #button > yt-icon:hover,
		ytd-comment-action-buttons-renderer #like-button yt-icon:hover,
		ytd-comment-action-buttons-renderer #dislike-button yt-icon:hover {
			filter: contrast(0.25);
		}
		ytd-comment-action-buttons-renderer #like-button yt-icon {
			content: url('${chrome.extension.getURL('/images/like.png')}') !important;
			filter: contrast(0);
			height: 17px !important;
			width: 17px !important;
		}
		#top-level-buttons-computed > ytd-toggle-button-renderer:first-child > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
		ytd-comment-action-buttons-renderer #like-button #button[aria-pressed="true"] yt-icon {
			content: url('${chrome.extension.getURL('/images/like-pressed.png')}') !important;
			filter: contrast(1);
		}
		#top-level-buttons-computed > ytd-toggle-button-renderer:last-child > a > yt-icon-button > #button > yt-icon {
			content: url('${chrome.extension.getURL('/images/dislike.png')}') !important;
			filter: contrast(0);
			height: 17px !important;
			width: 17px !important;
		}
		ytd-comment-action-buttons-renderer #dislike-button yt-icon {
			content: url('${chrome.extension.getURL('/images/dislike.png')}') !important;
			filter: contrast(0);
			height: 17px !important;
			width: 17px !important;
		}
		#top-level-buttons-computed > ytd-toggle-button-renderer:last-child > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
		ytd-comment-action-buttons-renderer #dislike-button #button[aria-pressed="true"] yt-icon {
			content: url('${chrome.extension.getURL('/images/dislike-pressed.png')}') !important;
			filter: contrast(1);
		}
		#vote-count-middle.ytd-comment-action-buttons-renderer {
			margin-top: 2px;
		}
		`,
		hideApps: `
		ytd-masthead #buttons > ytd-topbar-menu-button-renderer:nth-child(2) {
			display: none !important;
		}
		`,
		classicLikesIconColors: `
		#top-level-buttons-computed > ytd-toggle-button-renderer:first-child > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon > svg,
		ytd-comment-action-buttons-renderer #like-button #button[aria-pressed="true"] yt-icon > svg {
			fill: rgb(0 136 29) !important;
		}
		#top-level-buttons-computed > ytd-toggle-button-renderer.style-default-active:first-child > a yt-formatted-string {
			color: rgb(0 136 29) !important;
		}
		#top-level-buttons-computed > ytd-toggle-button-renderer:last-child > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon > svg,
		ytd-comment-action-buttons-renderer #dislike-button #button[aria-pressed="true"] yt-icon > svg {
			fill: rgb(222 0 17) !important;
		}
		#top-level-buttons-computed > ytd-toggle-button-renderer.style-default-active:last-child > a yt-formatted-string {
			color: rgb(222 0 17) !important;
		}
		`,
		classicLikesIconColorsExtra: `
		#top-level-buttons-computed > ytd-toggle-button-renderer:first-child > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
		ytd-comment-action-buttons-renderer #like-button #button[aria-pressed="true"] yt-icon {
			content: url('${chrome.extension.getURL('/images/like-pressed-old.png')}') !important;
		}
		#top-level-buttons-computed > ytd-toggle-button-renderer:last-child > a > yt-icon-button > #button[aria-pressed="true"] > yt-icon,
		ytd-comment-action-buttons-renderer #dislike-button #button[aria-pressed="true"] yt-icon {
			content: url('${chrome.extension.getURL('/images/dislike-pressed-old.png')}') !important;
		}
		`,
		hideJoinButton: `
		#sponsor-button.ytd-video-owner-renderer {
			display: none !important;
		}
		`,
		altStrings: `
		#date > yt-formatted-string::before, 
		.redux-moved-date::before {
			content: 'Published on ';
		}
		`,
		altUploadIcon: `
		ytd-topbar-menu-button-renderer:first-of-type yt-icon-button yt-icon {
			content: url('${chrome.extension.getURL('/images/old-upload.svg')}') !important;
			filter: contrast(0.25);
			height: 20px;
			width: 17px;
		}
		ytd-masthead[dark] ytd-topbar-menu-button-renderer:first-of-type yt-icon-button yt-icon {
			content: url('${chrome.extension.getURL('/images/old-upload-dark.svg')}') !important;
			filter: contrast(1);
			height: 20px;
			width: 17px;
		}
		`
	};

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
		if (reduxSettings.classicLikesStyle && reduxSettings.classicLikesIconColors) {
			mergedOptions += allStyles.classicLikesIconColorsExtra;
		}
		return mergedOptions;
	}
	let customStyle = document.createElement("style");
	customStyle.id = 'redux-style';
	let customStyleInner = mergeOptions();
	customStyle.appendChild(document.createTextNode(customStyleInner));
	document.documentElement.append(customStyle);

	if (reduxSettings.favicon != "3") changeFavicon();

	function changeFavicon() {
		switch (reduxSettings.favicon) {
		case "1":
			if (document.querySelector('link[rel="shortcut icon"]') == null) {
				setTimeout(changeFavicon, 250);
				return;
			}
			document.querySelector('link[rel="shortcut icon"]').href = chrome.extension.getURL('/images/favicon1.ico');
			document.querySelectorAll('link[rel="icon"]').forEach(element => element.href = chrome.extension.getURL('/images/favicon1.ico'));
			break;
		case "2":
			if (document.querySelector('link[rel="shortcut icon"]') == null) {
				setTimeout(changeFavicon, 250);
				return;
			}
			document.querySelector('link[rel="shortcut icon"]').href = chrome.extension.getURL('/images/favicon2.png');
			document.querySelectorAll('link[rel="icon"]').forEach(element => element.href = chrome.extension.getURL('/images/favicon2.png'));
			break;
    
		default:
			break;
		}
	}
}