function setBadge(number, color) {
    chrome.browserAction.setBadgeText({text: ""+number});
    if (color) {
        chrome.browserAction.setBadgeBackgroundColor({color: color});
    }
    //chrome.browserAction.setIcon({path:"logo.png"});
}

function popup_notification(title, icon, body, timeout) {
    var notification = new Notification(title, { icon: window.location.origin +icon, body: body });
    if (timeout) {
        setTimeout(notification.close.bind(notification), timeout);
    }
}

function open_new_tab(url) {
    chrome.tabs.create({url : url});
}

function translate(str, params){
    return chrome.i18n.getMessage(str, params);
}

function get_version() {
    var manifest = chrome.runtime.getManifest();
    return manifest.version;
}