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
    if (typeof params == 'object') {
        var params_arr = [];
        for (var x in params) {
            params_arr.push(params[x]);
        }
        params = params_arr;
    }
    return chrome.i18n.getMessage(str, params);
}

function get_ui_lang() {
    return chrome.i18n.getUILanguage();
}

function get_version() {
    var manifest = chrome.runtime.getManifest();
    return manifest.version;
}

function reset_alarm() {
    chrome.alarms.clear('uocnotifier');

    chrome.alarms.get('uocnotifier', function(alarm) {
        if (!alarm) {
            var delay = get_interval();
            if (get_check_nexttime()) {
                delay = 1;
            }
            chrome.alarms.create('uocnotifier', {periodInMinutes: delay});
        }
    });
}

$( document ).ready(function() {
    $('.translate').each(function() {
        var text = $(this).text();
        $(this).text(_(text));
    });
    $('.translateph').each(function() {
        var text = $(this).attr('placeholder');
        $(this).attr('placeholder', _(text));
    });
    $('.translatetit').each(function() {
        var text = $(this).attr('title');
        $(this).attr('title', _(text));
    });
    $('.translateal').each(function() {
        var text = $(this).attr('aria-label');
        $(this).attr('aria-label', _(text));
    });
});