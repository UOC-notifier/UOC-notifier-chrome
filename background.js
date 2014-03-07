function refresh_alarm() {
	chrome.alarms.get('refresh', function(alarm) {
		if (!alarm) {
			setup_alarm();
		}
	});

	check_messages(false);
}

function onAlarm(alarm) {
	if (alarm && alarm.name == 'refresh') {
		refresh_alarm();
	}
}

function onStartup(alarm){
	reset_session();
	refresh_alarm();
}

if (chrome.runtime && chrome.runtime.onStartup) {
	chrome.runtime.onStartup.addListener(onStartup);
}

chrome.runtime.onInstalled.addListener(refresh_alarm);
chrome.alarms.onAlarm.addListener(onAlarm);
