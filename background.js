function setup_alarm() {
	chrome.alarms.get('refresh', function(alarm) {
		if (!alarm) {
			var delay = get_interval();
			chrome.alarms.create('refresh', {periodInMinutes: delay});
		}
	});
}

function reset_alarm() {
	chrome.alarms.clear('refresh');
	setup_alarm();
}

function onAlarm(alarm) {
	if (alarm && alarm.name == 'refresh') {
		check_messages();
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
		started = true;
		reset_session();
		if (has_username_password()) {
			check_messages(show_PAC_notifications);
			setup_alarm();
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
