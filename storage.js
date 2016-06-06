// USER
function get_user(){
	var user_save = {};
	user_save.username = Storage.get_option("user_username", "");
	user_save.password = Storage.get_option("user_password", "");
	if (user_save.password != "") {
		user_save.password = b64_to_utf8(user_save.password);
	}
	return user_save;
}

function save_user(username, password) {
	var oldusername = Storage.get_option("user_username", "");
	var oldpassword = Storage.get_option("user_password", "");
	Storage.set_option("user_username", username);
	password = utf8_to_b64(password);
	Storage.set_option("user_password",password);

	// Username or password changed
	if (oldusername != username || oldpassword != password) {
		// Username changed
		if (oldusername != username) {
			Classes.purge_all();
		}
		reset_session();
		reset_alarm();
	}
}

function has_username_password(){
	var username = Storage.get_option("user_username", false);
	var password = Storage.get_option("user_password", false);
	return username && password;
}

function get_idp(){
	return Storage.get_option_int("idp", false);
}

function save_idp(idp){
	Storage.set_option("idp", idp);
}

// OPTIONS - UNIVERSITY
function get_uni(){
	return Storage.get_option("uni", 'UOCc');
}

function get_gat(){
	var uni =  get_uni();
    if(uni == 'UOCi'){
        return 'GAT_EXPIB';
    }
    return 'GAT_EXP';
}

function save_uni(uni){
	Storage.set_option("uni",uni);
}

function get_lang() {
	var uni =  get_uni();
    if(uni == 'UOCi'){
        return 'es';
    }
    return 'ca';
}

function get_lang_code() {
	var uni =  get_uni();
    if(uni == 'UOCi'){
        return 'b';
    }
    return 'a';
}

// OPTIONS - TODAY TAB
function get_today_limit(){
	var limit = get_today();
	if (limit >= 0) {
		return new Date().getTime() + limit * 24 * 60 * 60 * 1000;
	}
	return false;
}

function get_today(){
	return Storage.get_option_int("today", 6);
}

function save_today(today){
	if (today < 0) {
		today = 0;
	}
	Storage.set_option("today", today);
}


// OPTIONS - CHECK INTERVAL
function get_interval(){
	return Storage.get_option_int("check_interval", 20);
}

function save_interval(minutes){
	// Do not allow < 5 intervals to not saturate
	if (minutes < 5 && minutes != 0) {
		minutes = 5;
	}
	Storage.set_option("check_interval", minutes);
}

//OPTIONS - CRITICAL
function get_critical(){
	return Storage.get_option_int("critical", 10);
}

function save_critical(messages){
	// Do not allow < 0 messages
	if (messages < 0) {
		messages = 0;
	}
	Storage.set_option("critical", messages);
}

//OPTIONS - NOTIFICACIONS
function get_notification(){
	return Storage.get_option_bool("notification", true);
}

function save_notification(notify){
	Storage.set_option("notification", notify);
}

//OPTIONS - SHOW AGENDA
function get_show_agenda(){
	return Storage.get_option_bool("show_agenda", true);
}

function save_show_agenda(show){
	Storage.set_option("show_agenda", show);
}

//OPTIONS - SHOW MODULE DATES
function get_show_module_dates(){
	return Storage.get_option_bool("show_module_dates", true);
}

function save_show_module_dates(show){
	Storage.set_option("show_module_dates", show);
}

// OPTIONS  - SHOW CLASSROOMS
function save_notify_classroom(code, notify){
	var classroom = Classes.search_code(code);
	if(classroom){
		classroom.set_notify(notify);
		Classes.save();
	}
}

// RUNNING OPTIONS - SORTING
function get_sorting(){
	return Storage.get_option("sorting", 'start');
}

function save_sorting(sorting){
	Storage.set_option("sorting", sorting);
}

// RUNNING - SESSION
function get_session() {
	var session = Storage.get_option("session", false);
	if (!session) {
		return false;
	}
	return session;
}

function save_session(session){
	Storage.set_option("session", session);
	Storage.set_option("working", true);
}

function reset_session(){
	Debug.print('Session resetted');
	Storage.unset_option("session");
	Session.reset_retrieve();
}

function reset_classes(){
	Storage.unset_option("classes");
}

function get_working() {
	return Storage.get_option_bool("working", false);
}

function not_working() {
	Storage.get_option_bool("working", false);
}

// RUNNING - TOTAL MESSAGES
function get_icon(){
	return Storage.get_option_int("messages_icon", 0);
}

function save_icon(number){
	Storage.set_option("messages_icon", number);
}

function has_news(){
	return Storage.get_option_bool("hasnews", false);
}

function save_has_news(news){
	Storage.set_option("hasnews", news);
}

function get_news(){
	return Storage.get_option("news", false);
}

function save_news(news){
	Storage.set_option("news", news);
}

function reset_news(){
	Storage.unset_option("news");
}

function get_announcements(){
	var announcements = Storage.get_option("announcements", false);
	announcements = JSON.parse(announcements);
	return announcements;
}

function save_announcements(title, description, link, date){
	if (title != "" && description != "") {
		var announcements = {
			title : title,
			description : description,
			link: link,
			date: date
		};
		announcements = JSON.stringify(announcements);
		Storage.set_option("announcements", announcements);
	} else {
		Storage.unset_option("announcements");
	}
}

// RUNNING - UNREAD MAILS
function get_mails_unread() {
	return Storage.get_option_int("mails_unread", 0);
}

function save_mails_unread(number){
	Storage.set_option("mails_unread", number);
}

function get_check_mail() {
	return get_mails_unread() >= 0;
}

function save_check_mail(save){
	if (save) {
		save_mails_unread(0);
	} else {
		save_mails_unread(-1);
	}
}

function get_check_nexttime(){
	return Storage.get_option_bool("check_nexttime", false);
}

function save_check_nexttime(check_nexttime){
	Storage.set_option("check_nexttime", check_nexttime);
	reset_alarm();
}

// RUNNING - LOG
function get_debug() {
	return Storage.get_option_bool("debug", false);
}

// Storage manager
var Storage = new function(){

	this.get_option = function(option_name, default_value) {
		return localStorage.getItem(option_name) || default_value;
	};

	this.get_option_bool = function(option_name, default_value) {
		var value = localStorage.getItem(option_name);
		if (value == undefined) {
			return default_value;
		}
		return value == "true";
	};

	this.get_option_int = function(option_name, default_value) {
		var value = this.get_option(option_name, default_value);
		value = parseInt(value);
		if (isNaN(value)) {
			return default_value;
		}
		return value;
	};

	this.set_option = function(option_name, value) {
		localStorage.setItem(option_name, value);
	};

	this.unset_option = function(option_name) {
		localStorage.removeItem(option_name);
	};
};