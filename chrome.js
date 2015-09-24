function setBadge(number, color) {
    chrome.browserAction.setBadgeText({text: ""+number});
    chrome.browserAction.setBadgeBackgroundColor({color: color});
    //chrome.browserAction.setIcon({path:"logo.png"});
}

function popup_notification(title, icon, body, timeout) {
    var notification = new Notification(title, { icon: window.location.origin +icon, body: body });
    if (timeout) {
        notification.onshow = function() {setTimeout(function(){
            notification.close();
        }, 3000)};
    }
}

function open_new_tab(url) {
    chrome.tabs.create({url : url});
}