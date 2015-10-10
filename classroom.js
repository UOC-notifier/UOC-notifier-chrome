var Classes = new function(){
	var classes = [];
	this.messages = 0;
	this.notified_messages = 0;

	this.add = function(classr){
		var idx = this.get_index(classr.code);
		if(idx !== false){
			classr.notify = classes[idx].notify;
			classes[idx] = classr;
		} else {
			classes.push(classr);
		}
	};

	this.save = function(){
		this.count_messages();
		set_messages();
		Debug.print(classes);
		classes.sort(function(a, b) {
			if (a.notify != b.notify) {
				return b.notify - a.notify;
			}
			if (a.type != b.type) {
				if (a.type == 'TUTORIA') {
					return 1;
				}
				if (b.type == 'TUTORIA') {
					return -1;
				}
			}
			if(a.title < b.title) return -1;
		    if(a.title > b.title) return 1;
		    return 0;
		});

		for(var i in classes){
			if (classes[i].notify) {
				classes[i].sort_resources();
			}
		}

		for(var i in classes){
			if (classes[i].notify) {
				classes[i].clean_events();
			}
		}

		Storage.set_option("classes", JSON.stringify(classes));
	};

	this.search_code = function(code){
		for(var i in classes){
			if(classes[i].code == code){
				return classes[i];
			}
		}
		return false;
	};

	this.get_class_by_event = function(eventid) {
		for(var i in classes) {
			if (classes[i].notify) {
				if (classes[i].get_event_idx(eventid) >= 0) {
					return classes[i];
				}
			}
		}
		return false;
	}

	this.purge_old = function() {
		var max_any = this.get_max_any();
		if (max_any > 0) {
			for(var x in classes) {
				if (classes[x].any && parseInt(classes[x].any) < max_any) {
					classes.splice(x, 1);
				}
			}
		}
	}

	this.get_max_any = function() {
		var max_any = 0;
		for(var x in classes) {
			if (classes[x].any && parseInt(classes[x].any) > max_any) {
				max_any = parseInt(classes[x].any);
			}
		}
		return max_any;
	}

	this.purge_all = function() {
		classes = [];
		this.messages = 0;
		this.notified_messages = 0;
		this.save();
	}

	this.get_index = function(code){
		for(var i in classes){
			if(classes[i].code == code){
				return i;
			}
		}
		return false;
	};

	this.get_notify = function (code){
		var idx = this.get_index(code);
		if (idx === false) {
			// New Classrooms won\'t be notified
			return false;
		}
		return classes[idx].notify;
	}

	this.search_domain = function(domain){
		for(var i in classes){
			if(classes[i].domain == domain){
				return classes[i];
			}
		}
		return false;
	};

	this.search_domainassig = function(domain){
		for(var i in classes){
			if(classes[i].domainassig == domain){
				return classes[i];
			}
		}
		return false;
	};

	this.load = function (){
		var classroom = Storage.get_option("classes", false);
		if (classroom) {
			classes = [];
			this.messages = 0;
			this.notified_messages = 0;
			var classesl = JSON.parse(classroom);
			for(var i in classesl){
				var classl = classesl[i];
				var classr = new Classroom(classl.title, classl.code, classl.domain, classl.type, classl.template);
				classr.domainassig = classl.domainassig;
				classr.set_color(classl.color);
				classr.any = classl.any;
				classr.aula = classl.aula;
				classr.consultor = classl.consultor;
				classr.consultormail = classl.consultormail;
				classr.consultorlastviewed = classl.consultorlastviewed;
				classr.set_notify(classl.notify);
				if(classl.notify) {
					for(var j in classl.resources){
						var resourcel = classl.resources[j];
						var resource = new Resource(resourcel.title, resourcel.code);
						resource.set_messages(resourcel.messages, resourcel.all_messages);
						resource.set_pos(resourcel.pos);
						resource.set_link(resourcel.link);
						classr.add_resource(resource);
					}
					for(var j in classl.events){
						var evl = classl.events[j];
						var ev = new Event(evl.name, evl.eventId);
						ev.start = evl.start;
						ev.end = evl.end;
						ev.grading = evl.grading;
						ev.solution = evl.solution;
						ev.link = evl.link;
						ev.graded = evl.graded;
						ev.committed = evl.committed;
						classr.add_event(ev);
					}
				}
				this.add(classr);
			}
			this.count_messages();
		}
	};

	this.get_all = function (){
		return classes;
	};

	this.get_notified = function (){
		var classrooms = [];
		for(var i in classes){
			if(classes[i].notify){
				classrooms.push(classes[i]);
			}
		}
		return classrooms;
	};

	this.count_messages = function(){
		var classrooms = this.get_all();
		this.notified_messages = 0;
		this.messages = 0;
		for(var i in classrooms){
			if(classrooms[i].notify){
				this.notified_messages += classrooms[i].messages;
			}
			this.messages += classrooms[i].messages;
			this.all_messages += classrooms[i].all_messages;
		}
	};

	this.load();
}

function Classroom(title, code, domain, type, template){
	this.title = title;
	this.code = code;
	this.domain = domain;
	this.domainassig = domain;
	this.type = type;
	this.template = template;
	this.color = false;
	this.any = false;
	this.aula = false;
	this.consultor = false;
	this.consultormail = false;
	this.consultorlastviewed = false;

	this.notify = true;
	this.messages = 0;
	this.resources = [];
	this.events = [];

	this.set_color = function(color){
		if(color && color != 'undefined' && color != 'false'){
			this.color = color;
		}
	};

	this.get_acronym = function() {
		if(this.type == 'TUTORIA'){
			return 'TUT'+this.aula;
		}
		var words = this.title.split(/[\s, ':\(\)\-]+/);
    	var acronym = "";
    	var nowords = new Array('de', 'a', 'per', 'para', 'en', 'la', 'el', 'y', 'i', 'les', 'las', 'l', 'd');
    	for (var x in words) {
    		if (nowords.indexOf(words[x].toLowerCase()) < 0) {
    			if (words[x] == words[x].toUpperCase()) {
					acronym += words[x];
    			} else {
            		acronym += words[x].charAt(0);
            	}
            }
	    }
    	return acronym.toUpperCase();
	}

	this.get_subject_code = function(){
		if(this.type != 'TUTORIA'){
			var temp = code.split("_");
			return temp[1]+'.'+temp[2];
		}
		return false;
	}

	this.set_notify = function(notify){
		this.notify = notify;
	};

	this.reset_messages = function(){
		this.messages = 0;
	};

	this.add_resource = function(resource){
		if(!this.notify) return;

		var idx = this.get_index(resource.code, resource.lcode);
		if(idx >= 0){
			this.resource_merge(idx, resource);
		} else {
			this.resources.push(resource);
			if(resource.messages != '-'){
				this.messages += resource.messages;
			}
		}
	};

	this.sort_resources = function() {
		this.resources.sort(function(a, b) {
			if(a.has_message_count() != b.has_message_count()) {
				if (a.has_message_count()) {
					return -1;
				}
				return 1;
			}

			if (isNaN(b.pos)) {
				return -1;
			}
			if(a.pos < b.pos) return -1;
		    if(a.pos > b.pos) return 1;

			if(a.title < b.title) return -1;
		    if(a.title > b.title) return 1;
		    return 0;
		});
	}

	this.get_index = function(code, lcode){
		for(var i in this.resources){
			if(this.resources[i].code == code) {
				return i;
			}
			if(this.resources[i].lcode == lcode) {
				return i;
			}
			if(this.resources[i].lcode == code) {
				return i;
			}
			if(this.resources[i].code == lcode) {
				return i;
			}
		}
		return -1;
	};

	this.get_resources = function(){
		return resources;
	};

	this.resource_merge = function(idx, resource) {
		if(this.resources[idx].messages != '-'){
			this.messages -= this.resources[idx].messages;
		}
		this.resources[idx].set_messages(resource.messages, resource.all_messages);
		this.resources[idx].set_pos(resource.pos);
		this.resources[idx].link = resource.link;
		this.resources[idx].code = resource.code;
		this.resources[idx].lcode = resource.lcode;
		this.resources[idx].title = resource.title;
		if(this.resources[idx].messages != '-'){
			this.messages += this.resources[idx].messages;
		}
	};


	this.add_event = function(ev){
		var idx = this.get_event_idx(ev.eventId);
		if(idx >= 0){
			this.event_merge(idx, ev);
		} else {
			this.events.push(ev);
		}
	};

	this.get_event = function(id){
		var idx = this.get_event_idx(id);
		if (idx >= 0) {
			return this.events[idx];
		}
		return false;
	};

	this.get_event_idx = function(id){
		for(var i in this.events){
			if(this.events[i].eventId == id) {
				return i;
			}
		}
		return -1;
	};

	this.all_events_graded = function(name){
		for(var i in this.events){
			if (!this.events[i].graded) {
				return false;
			}
		}
		return true;
	};

	this.event_merge = function(idx, ev) {
		this.events[idx].name = ev.name;
		this.events[idx].eventId = ev.eventId;
		if (ev.link) this.events[idx].link = ev.link;
		if (ev.start) this.events[idx].start = ev.start;
		if (ev.end) this.events[idx].end = ev.end;
		if (ev.grading) this.events[idx].grading = ev.grading;
		if (ev.solution) this.events[idx].solution = ev.solution;
		if (ev.graded) this.events[idx].graded = ev.graded;
		if (ev.committed) this.events[idx].committed = ev.committed;
	};

	this.clean_events = function() {
		for(var i in this.events){
			if (this.events[i].eventId == undefined) {
				this.events.splice(i, 1);
			}
		}
	}
}

function Resource(title, code){
	this.title = title;
	this.code = code;
	this.lcode = code;
	this.messages =  '-';
	this.all_messages =  '-';
	this.link =  "";
	this.pos = false;

	this.has_message_count = function() {
		return !isNaN(this.all_messages);
	}

	this.set_messages = function(messages, all_messages) {
		messages = parseInt(messages);
		all_messages = parseInt(all_messages);

		if (!isNaN(all_messages) && all_messages >= 0) {
			this.all_messages = all_messages;
		}
		if (!isNaN(messages) &&  messages >= 0) {
			this.messages = Math.max(messages, 0);
		}
		if (this.all_messages == 0) {
			this.messages = '-';
			this.all_messages = '-';
			return 0;
		}

		if(!isNaN(this.messages) && isNaN(this.all_messages)){
			this.messages = 0;
			this.all_messages = 0;
		}
	};

	this.set_pos = function(pos) {
		if (pos) {
			this.pos = parseInt(pos);
		} else {
			this.pos = false;
		}
	};


	this.set_link = function(link){
		var url = get_url_attr(link, 'redirectUrl');
		if(url){
			link = decodeURIComponent(url);
			/*var url = get_url_attr(link, 'url');
			if(url){
				link = root_url + '/' + decodeURIComponent(url);
			}*/
		}

		code = get_url_attr(link, 'l');
		if(code){
			this.lcode = code;
		}

		session = get_url_attr(link, 's');
		if(session){
			link = get_url_withoutattr(link,'s');
			link += '&s=';
		} else {
			session = get_url_attr(link, 'sessionId');
			if(session){
				link = get_url_withoutattr(link,'sessionId');
				link += '&sessionId=';
			}
		}
		this.link = link;
	};
}

function Event(name, id) {
	this.name = name;
	this.start = false;
	this.end = false;
	this.grading = false;
	this.solution = false;
	this.graded = false;
	this.committed = false;
	this.link = "";
	this.eventId = id;

	this.has_started = function(){
		return isBeforeToday(this.start) || isToday(this.start);
	}

	this.has_ended = function(){
		return isBeforeToday(this.end);
	}

	this.starts_today = function(){
		return isToday(this.start);
	}

	this.ends_today = function(){
		return isToday(this.end);
	}
}