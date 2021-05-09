var donateButton = document.querySelector('#donate');
var globalURL;
var currentSettings;

donateButton.onclick = function() {
  window.open("https://www.paypal.com/donate?hosted_button_id=MD9WRXSTLB49W");
};

browser.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
  globalURL = tabs[0].url;
  var fields = document.querySelectorAll('fieldset');
  if (!globalURL.includes("www.youtube.com")){
    for (var i = 0; i < fields.length; i++){
      document.querySelectorAll('fieldset')[i].setAttribute("disabled", "")
    }
    document.querySelector('.outer-warning').style.display = "table";
  }
});

var settingsElements = document.querySelectorAll('.settings:not(.slider-control)');
for (var i = 0; i < settingsElements.length; i++){
  settingsElements[i].addEventListener('change', function(){
    if (this.parentElement.nextElementSibling != null && this.parentElement.nextElementSibling.classList.contains('subsettings-container')) {
      var subsettings = this.parentElement.nextElementSibling.querySelectorAll('.subsetting input[type="checkbox"]');
      console.log(subsettings)
      if (this.checked) {
        subsettings.forEach(element => {
          element.removeAttribute('disabled');
        });
      } else {
        subsettings.forEach(element => {
          element.setAttribute('disabled', '');
          element.checked = false;
        });
      }
    }
    saveSettings();
  })
}

document.querySelector('input[type="range"]').addEventListener('change', function(){
  var inputControl = document.querySelector('.slider-control');
  inputControl.value = this.value;
  saveSettings();
  changeGridWidth(this.value);
})

document.querySelector('.slider-control').addEventListener('change', function(){
  var slider = document.querySelector('input[type="range"]');
  slider.value = this.value;
  saveSettings();
  changeGridWidth(this.value);
})

//navigation buttons
document.querySelector('#right-arrow').addEventListener('click', function() {
  if (this.hasAttribute('disabled')) return;
  document.querySelector('#left-arrow').removeAttribute('disabled');
  document.querySelector('#right-arrow').setAttribute('disabled', '');
  document.querySelector('#all-pages').style = 'transform: translateX(-100%)';
})

document.querySelector('#left-arrow').addEventListener('click', function() {
  if (this.hasAttribute('disabled')) return;
  document.querySelector('#right-arrow').removeAttribute('disabled');
  document.querySelector('#left-arrow').setAttribute('disabled', '');
  document.querySelector('#all-pages').style = 'transform: translateX(0%)';
})

//font selection
document.querySelector('select[name="titleFontValue"]').addEventListener('change', function() {
  if (this.querySelector('option:last-child').selected) {
    let fontChoice = prompt('Enter your custom font name:', 'E.g.: \'Webdings\' or \'Times New Roman\'');
    if (fontChoice != null) {
      this.querySelector('option:last-child').value = fontChoice;
      saveSettings();
    }
  }
});

//custom small player size
document.querySelector('select[name="smallPlayerWidth"]').addEventListener('change', function() {
  if (this.querySelector('option:last-child').selected) {
    let sizeChoice = prompt('Enter your custom player height in pixels (width will be automatically adjusted).\nTo reset it change to another value and then back to custom.', '900');
    if (sizeChoice != null) {
      this.querySelector('option:last-child').value = sizeChoice;
      saveSettings();
    }
  }
});

function saveSettings(){
  var newSettings = {};
  //save slider
  newSettings[document.querySelector('input[type="range"]').name] = document.querySelector('input[type="range"]').value;

  //save checkboxes
  var itemsCheck = document.querySelectorAll('input[type="checkbox"]');
  for (var i = 0; i < itemsCheck.length; i++){
    newSettings[itemsCheck[i].name] = itemsCheck[i].checked;
  }

    //save selects
    var selects = document.querySelectorAll('select');
    selects.forEach(element => {
      newSettings[element.name] = element.value;
    });

    //save favicon radio buttons
  var radio = document.querySelectorAll('input[type="radio"][name="favicon"]');
  for (var i = 0; i < radio.length; i++){
    if (radio[i].checked){
      newSettings[radio[i].name] = radio[i].value;
    }
  }
  
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var storageSettings = JSON.stringify(newSettings);
    browser.tabs.executeScript(
        tabs[0].id,
        {code: `localStorage.setItem("reduxSettings", ${JSON.stringify(storageSettings)})`});
    });
}

function changeGridWidth(numberOfItems){
  if (globalURL == "https://www.youtube.com/" || globalURL == "http://www.youtube.com/"){
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      browser.tabs.executeScript(
          tabs[0].id,
          {code: `var styleItem = document.querySelector("#primary > ytd-rich-grid-renderer");
          styleItem.style.setProperty("--ytd-rich-grid-items-per-row", ${numberOfItems}, "important")
          `
          });
      });
    }
  }

  function getSettings(){
    if (currentSettings == null){return};
    var itemsCheck = document.querySelectorAll('input[type="checkbox"]');

    //set slider
    document.querySelector('input[type="range"]').value = currentSettings.gridItems;
    document.querySelector('.slider-control').value = currentSettings.gridItems;
    //set checkboxes
    for (var i = 0; i < itemsCheck.length; i++){
      for (var j = 0; j < Object.keys(currentSettings).length; j++){
        if (itemsCheck[i].name == Object.keys(currentSettings)[j]){
          itemsCheck[i].checked = Object.values(currentSettings)[j];
        }
      }
    }
    //set selects
    document.querySelector('select[name="smallPlayerWidth"]').value = currentSettings.smallPlayerWidth == undefined ? 853 : currentSettings.smallPlayerWidth;
    document.querySelector('select[name="titleFontValue"]').value = currentSettings.titleFontValue == undefined ? "Arial" : currentSettings.titleFontValue;
    if (document.querySelector('select[name="titleFontValue"]').value == "") document.querySelector('select[name="titleFontValue"]').value = "Custom";
    //set radio buttons
    document.querySelector(`input[type="radio"][value="${currentSettings.favicon}"]`).checked = true;
    //uncheck subsettings
    var settingsElements = document.querySelectorAll('.settings:not(.slider-control)');
    for (var i = 0; i < settingsElements.length; i++) {
      if (settingsElements[i].parentElement.nextElementSibling != null && settingsElements[i].parentElement.nextElementSibling.classList.contains('subsettings-container')) {
        var subsettings = settingsElements[i].parentElement.nextElementSibling.querySelectorAll('.subsetting input[type="checkbox"]');
        if (settingsElements[i].checked) {
          subsettings.forEach(element => {
            element.removeAttribute('disabled');
          });
        }
      }
    }
  }

  function calculateSizeOptions(){
    var options = document.querySelectorAll('select[name="smallPlayerWidth"] option');
    options.forEach(element => {
      if (element.value == 'Custom') {
        element.innerText = `Custom...`; //fixed at 16:9
      } else {
        element.innerText = `${element.value}x${Math.ceil(element.value / 1.78)}px`; //fixed at 16:9
      }
    });
  }

  //main
  browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var key = "reduxSettings";
      browser.tabs.executeScript(
        tabs[0].id,
        {
          code:`localStorage["${key}"];`
        }, function(result){
          if (result == null || result == undefined){return};
          currentSettings = JSON.parse(result[0]);
          calculateSizeOptions();
          getSettings();
        }
      )
  });