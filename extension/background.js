function onAlarm(alarm) {
	if (alarm && alarm.name == 'uocnotifier') {
		chrome.idle.queryState(300 ,function(state) {
			if (state == 'active') {
				check_messages();
			} else {
				console.log(state + ',check it later');
				save_check_nexttime(true);
			}
		});
	}
}

var Start = new function() {
	var started = false;

	this.onStart = function(alarm) {
		if (started) return;
		startup();
	};

	this.onInstall = function(alarm) {
		if (started) return;
		if (!startup()) {
			chrome.tabs.create({ url: "options.html" });
		}
	};

	function startup() {
		console.log('Startup');
		started = true;
		reset_session();
		if (has_username_password()) {
			check_messages(show_PAC_notifications);
			return true;
		}
		return false;
	}
};

if (chrome.runtime) {
	if (chrome.runtime.onStartup) {
		chrome.runtime.onStartup.addListener(Start.onStart);
	}
	if (chrome.runtime.onInstalled) {
		chrome.runtime.onInstalled.addListener(Start.onInstall);
	}
}

chrome.alarms.onAlarm.addListener(onAlarm);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.uoctheme )
      console.log( "theme ");
      console.log( "theme "+get_theme());
      sendResponse({
        active: get_theme()
      });
  });

