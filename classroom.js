var Classes = new function() {
	var classes = [];
	this.messages = 0;
	this.notified_messages = 0;
	var events = [];

	this.add = function(classr) {
		var idx = this.get_index(classr.code);
		if (idx !== false) {
			classr.notify = classes[idx].notify;
			classes[idx] = classr;
		} else {
			classes.push(classr);
		}
	};

	this.add_event = function(evnt) {
		// Do not add past events
		if (isBeforeToday(evnt.start) || evnt.eventId == undefined) {
			return;
		}
		for (var idx in events) {
			if(events[idx].eventId == evnt.eventId) {
				events[idx].name = evnt.name;
				events[idx].eventId = evnt.eventId;
				if (evnt.type)  events[idx].type = evnt.type;
				if (evnt.start) events[idx].start = evnt.start;
				return;
			}
		}
		events.push(evnt);
	};

	this.get_general_events = function() {
		return events;
	};

	this.save = function() {
		this.count_messages();
		set_messages();
		Debug.print(classes);
		Debug.print(events);
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

		for (var i in classes) {
			if (classes[i].notify) {
				classes[i].sort_things();
			}
		}

		Storage.set_option("classes", JSON.stringify(classes));
		Storage.set_option("events", JSON.stringify(events));
	};

	this.search_code = function(code) {
		for (var i in classes) {
			if (classes[i].code == code) {
				return classes[i];
			}
		}
		return false;
	};

	this.search_subject_code = function(subject_code) {
		for (var i in classes) {
			if (classes[i].subject_code == subject_code) {
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
	};

	this.get_class_by_acronym = function(acronym) {
		for(var i in classes) {
			if (classes[i].notify) {
				if (classes[i].get_acronym() == acronym) {
					return classes[i];
				}
			}
		}
		return false;
	};

	this.purge_old = function() {
		var max_any = this.get_max_any();
		if (max_any > 0) {
			for(var x in classes) {
				if (classes[x].any && parseInt(classes[x].any) < max_any) {
					classes.splice(x, 1);
				}
			}
		}
	};

	this.get_max_any = function() {
		var max_any = 0;
		for(var x in classes) {
			if (classes[x].any && parseInt(classes[x].any) > max_any) {
				max_any = parseInt(classes[x].any);
			}
		}
		return max_any;
	};

	this.purge_all = function() {
		classes = [];
		this.messages = 0;
		this.notified_messages = 0;
		this.save();
	};

	this.get_index = function(code) {
		for (var i in classes) {
			if (classes[i].code == code) {
				return i;
			}
		}
		return false;
	};

	this.get_notify = function (code) {
		var idx = this.get_index(code);
		if (idx === false) {
			// New Classrooms won\'t be notified
			return false;
		}
		return classes[idx].notify;
	};

	this.search_domainassig = function(domain) {
		for (var i in classes) {
			if (classes[i].domainassig == domain) {
				return classes[i];
			}
		}
		return false;
	};

	this.load = function () {
		var classroom = Storage.get_option("classes", false);
		if (classroom) {
			classes = [];
			this.messages = 0;
			this.notified_messages = 0;
			var classesl = JSON.parse(classroom);
			for (var i in classesl) {
				var classl = classesl[i];
				var classr = new Classroom(classl.title, classl.code, classl.domain, classl.type, classl.template);
				classr.domainassig = classl.domainassig;
				classr.set_color(classl.color);
				classr.any = classl.any;
				classr.aula = classl.aula;
				classr.subject_code = classl.subject_code;
				classr.exped = classl.exped;
				classr.stats = classl.stats;
				classr.final_grades = classl.final_grades;
				classr.exams = classl.exams;
				classr.consultor = classl.consultor;
				classr.consultormail = classl.consultormail;
				classr.consultorlastviewed = classl.consultorlastviewed;
				classr.set_notify(classl.notify);
				if (classl.notify) {
					for (var j in classl.resources) {
						var resourcel = classl.resources[j];
						var resource = new Resource(resourcel.title, resourcel.code, resourcel.type);
						resource.set_messages(resourcel.messages, resourcel.all_messages);
						resource.set_pos(resourcel.pos);
						resource.set_link(resourcel.link);
						classr.add_resource(resource);
					}
					for (var k in classl.events) {
						var evl = classl.events[k];
						var ev = new CalEvent(evl.name, evl.eventId, evl.type);
						ev.start = evl.start;
						ev.end = evl.end;
						ev.grading = evl.grading;
						ev.solution = evl.solution;
						ev.link = evl.link;
						ev.graded = evl.graded;
						ev.committed = evl.committed;
						ev.viewed = evl.viewed;
						ev.commenttext = evl.commenttext;
						ev.commentdate = evl.commentdate;
						classr.add_event(ev);
					}
					for (var l in classl.grades) {
						var g = classl.grades[l];
						classr.add_grade(g.name, g.grade, g.prov);
					}
				}
				this.add(classr);
			}
			this.count_messages();
		}

		var evnts = Storage.get_option("events", false);
		if (evnts) {
			events = [];
			evnts = JSON.parse(evnts);
			for (var m in evnts) {
				var evnt = evnts[m];
				var cevnt = new CalEvent(evnt.name, evnt.eventId, evnt.type);
				cevnt.start = evnt.start;
				this.add_event(cevnt);
			}
		}
	};

	this.get_all = function () {
		return classes;
	};

	this.get_notified = function () {
		var classrooms = [];
		for (var i in classes) {
			if (classes[i].notify) {
				classrooms.push(classes[i]);
			}
		}
		return classrooms;
	};

	this.count_messages = function() {
		var classrooms = this.get_all();
		this.notified_messages = 0;
		this.messages = 0;
		for (var i in classrooms) {
			if (classrooms[i].notify) {
				this.notified_messages += classrooms[i].messages;
			}
			this.messages += classrooms[i].messages;
			this.all_messages += classrooms[i].all_messages;
		}
	};

	this.load();
};

function Classroom(title, code, domain, type, template) {
	this.title = title;
	this.code = code;
	this.domain = domain;
	this.domainassig = domain;
	this.type = type;
	this.template = template;
	this.subject_code = false;
	this.exped = false;
	this.color = false;
	this.any = false;
	this.aula = false;
	this.stats = false;
	this.final_grades = false;
	this.consultor = false;
	this.consultormail = false;
	this.consultorlastviewed = false;
	this.acronym = false;

	this.notify = true;
	this.messages = 0;
	this.resources = [];
	this.events = [];
	this.grades = [];
	this.exams = false;

	this.set_color = function(color) {
		if(color && color != 'undefined' && color != 'false') {
			this.color = color;
		}
	};

	this.get_acronym = function() {
		if (this.acronym == false) {
			this.set_acronym();
		}
		return this.acronym;
	};

	this.set_acronym = function() {
		this.acronym =  this.type == 'TUTORIA' ? 'TUT'+this.aula : get_acronym(this.title);
	};

	this.set_notify = function(notify) {
		this.notify = notify;
	};

	// Adds a final grade returning if it changed
	this.add_grade = function(name, grade, prov) {
		var g = new Grade(name, grade, prov);

		// Stop notifying warning FE grades if EX is not present
		if (g.grade == 'D 2' && g.name == 'FE' && g.prov) {
			var exfound = this.get_grade_index('EX');
			if (exfound === false) {
				Debug.print('Provisional Grade D 2 of FE detected without EX');
				return false;
			}
		}

		var i = this.get_grade_index(g.name);
		if (i === false) {
			this.grades.push(g);
			return g;
		}

		if (!this.grades[i].prov && prov) {
			// Change to not provisional not allowed
			return false;
		}

		if (this.grades[i].grade != g.grade || (!prov && this.grades[i].prov)) {
			this.grades[i].grade = g.grade;
			if (!prov) {
				// Only change when it becomes def
				this.grades[i].prov = false;
			}
			return this.grades[i];
		}
		return false;
	};

	this.get_grade_index = function(name) {
		for (var i in this.grades) {
			if (this.grades[i].name == name) {
				return i;
			}
		}
		return false;
	}

	this.add_resource = function(resource) {
		if(!this.notify) return;

		var idx = this.get_index(resource.code);
		if (idx >= 0) {
			this.resource_merge(idx, resource);
		} else {
			this.resources.push(resource);
			if (resource.messages != '-') {
				this.messages += resource.messages;
			}
		}
	};

	this.sort_things = function() {
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

		this.grades.sort(function(a, b) {
			if(a.pos < b.pos) return -1;
		    if(a.pos > b.pos) return 1;

			if(a.name < b.name) return -1;
		    if(a.name > b.name) return 1;
		    return 0;
		});

		this.events.sort(function(a, b) {
			var comp = compareDates(a.start, b.start);
			if (comp == 0) {
				return compareDates(a.end, b.end);
			}
			return comp;
		});
	};

	this.get_index = function(code) {
		for (var i in this.resources) {
			if(this.resources[i].code == code) {
				return i;
			}
		}
		return -1;
	};

	this.resource_merge = function(idx, resource) {
		if (this.resources[idx].messages != '-') {
			this.messages -= this.resources[idx].messages;
		}
		this.resources[idx].set_messages(resource.messages, resource.all_messages);
		this.resources[idx].set_pos(resource.pos);
		this.resources[idx].link = resource.link;
		this.resources[idx].code = resource.code;
		this.resources[idx].title = resource.title;
		this.resources[idx].type = resource.type;
		if (this.resources[idx].messages != '-') {
			this.messages += this.resources[idx].messages;
		}
	};

	this.add_event = function(ev) {
		if (ev.eventId == undefined) {
			return;
		}
		var idx = this.get_event_idx(ev.eventId);
		if (idx >= 0) {
			this.event_merge(idx, ev);
		} else {
			this.events.push(ev);
		}
	};

	this.get_event = function(id) {
		var idx = this.get_event_idx(id);
		if (idx >= 0) {
			return this.events[idx];
		}
		return false;
	};

	this.get_event_idx = function(id) {
		for (var i in this.events) {
			if(this.events[i].eventId == id) {
				return i;
			}
		}
		return -1;
	};

	this.has_events = function() {
		return this.events.length > 0;
	};

	this.all_events_completed = function(only_assignments) {
		for (var i in this.events) {
			if (!only_assignments || this.events[i].is_assignment()) {
				if (!this.events[i].is_completed()) {
					return false;
				}
			}
		}
		return true;
	};

	this.event_merge = function(idx, ev) {
		this.events[idx].name = ev.name;
		this.events[idx].eventId = ev.eventId;
		if (ev.type)  this.events[idx].type = ev.type;
		if (ev.link) this.events[idx].link = ev.link;
		if (ev.start) this.events[idx].start = ev.start;
		if (ev.end) this.events[idx].end = ev.end;
		if (ev.grading) this.events[idx].grading = ev.grading;
		if (ev.solution) this.events[idx].solution = ev.solution;
		if (ev.graded) this.events[idx].graded = ev.graded;
		if (ev.committed) this.events[idx].committed = ev.committed;
		if (ev.viewed) this.events[idx].viewed = ev.viewed;
		if (ev.commenttext) this.events[idx].commenttext = ev.commenttext;
		if (ev.commentdate) this.events[idx].commentdate = ev.commentdate;
	};
}

function Resource(title, code, type) {
	this.title = title;
	this.code = code;
	this.type = type;
	this.messages =  '-';
	this.all_messages =  '-';
	this.link =  "";
	this.pos = false;

	this.has_message_count = function() {
		return !isNaN(this.all_messages);
	};

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

		if (!isNaN(this.messages) && isNaN(this.all_messages)) {
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

	this.set_link = function(link) {
		var url = get_url_attr(link, 'redirectUrl');
		if (url) {
			link = decodeURIComponent(url);
		}

		var session = get_url_attr(link, 's');
		if (session) {
			link = get_url_withoutattr(link,'s');
			link += '&s=';
		} else {
			session = get_url_attr(link, 'sessionId');
			if (session) {
				link = get_url_withoutattr(link,'sessionId');
				link += '&sessionId=';
			}
		}
		this.link = link;
	};
}

function Grade(title, grade, prov) {
	this.grade = grade.replace('.', ',');
	this.prov = prov;

	title = title.trim();
	var code = get_code(title);
	if (!code) {
		this.name = title;
		this.pos = 10;
		Debug.error('Grade name not recognized: '+this.name);
	} else {
		this.name = code;
		switch (code) {
			case 'C':
				this.pos = 1;
				break;
			case 'P':
				this.pos = 2;
				break;
			case 'FC':
				this.pos = 3;
				break;
			case 'PS':
				this.pos = 4;
				break;
			case 'PV':
				this.pos = 5;
				break;
			case 'EX':
				this.pos = 6;
				break;
			case 'PF':
				this.pos = 7;
				break;
			case 'FE':
				this.pos = 8;
				break;
			case 'FA':
				this.pos = 9;
				break;
			default:
				this.pos = 10;
				Debug.error('Grade code not recognized: '+this.name);
		}
	}

	this.get_title = function() {
		// POS 10 is the only not translatable grade name
		if (this.pos < 10) {
			return _('__'+this.name+'__') + ' ('+this.name+')';
		}
		return this.name;
	};

	this.notify = function(acronym) {
		if (this.prov) {
			notify(_('__FINAL_GRADE_PROV__', [this.grade, this.get_title(), acronym]), 0);
		} else {
			notify(_('__FINAL_GRADE__', [this.grade, this.get_title(), acronym]), 0);
		}
	};

	function get_code(title) {
		if (title.length <= 2 ) {
			return title.toUpperCase();
		}

		title = get_html_realtext(title);
		title = title.toLowerCase();
		title = title.replace(/[^\w\s]/gi, '');

		switch (title) {
			case 'qualificaci davaluaci continuada':
			case 'calificacin de evaluacin continuada': // Not used
			case 'calificacin final':
				return 'C';
			case 'nota final activitats prctiques':
			case 'nota final de actividades prcticas':
			case 'qualificaci final dactivitats prctiques': // Not used
			case 'calificacin final de actividades prcticas':  // Not used
				return 'P';
		}
		Debug.error("Grade title not found: "+title);
		return false;
	}
}

function CalEvent(name, id, type) {
	this.name = name;
	this.start = false;
	this.end = false;
	this.grading = false;
	this.solution = false;
	this.graded = false;
	this.committed = false;
	this.viewed = false;
	this.commenttext = false;
	this.commentdate = false;
	this.link = "";
	this.eventId = id;
	this.type = type;

	this.has_started = function() {
		if (!this.start) {
			return true;
		}
		return isBeforeToday(this.start) || isToday(this.start);
	};

	this.has_ended = function() {
		if (!this.end) {
			return isBeforeToday(this.start);
		}
		return isBeforeToday(this.end);
	};

	this.starts_today = function() {
		if (!this.end || !this.start) {
			return false;
		}
		return isToday(this.start);
	};

	this.ends_today = function() {
		if (!this.end) {
			return isToday(this.start);
		}
		return isToday(this.end);
	};

	this.is_near = function(near) {
		return (this.has_started() && !this.has_ended()) || isNearDate(this.start, near) || isNearDate(this.grading, near) || isNearDate(this.solution, near);
	};

	this.is_assignment = function() {
		return (this.type == 'ASSIGNMENT' || this.type == undefined);
	};

	this.is_uoc = function() {
		return this.type == 'UOC';
	};

	this.is_completed = function() {
		return isBeforeToday(this.start) && isBeforeToday(this.end) && isBeforeToday(this.solution) && isBeforeToday(this.grading);
	};

	this.notify = function(acronym) {
		notify(_('__PRACT_GRADE__', [this.graded, this.name, acronym]), 0);
	};
}