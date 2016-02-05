function check_messages(after_check_fnc) {
	save_check_nexttime(false);

	Queue.set_after_function(after_check_fnc);

	retrieve_mail();

	retrieve_announcements();

	// Get the new aulas
	var args = {
		perfil : 'estudiant',
		setLng : get_lang(),
		format: 'json'
	};
	Queue.request('/app/guaita/calendari', args, "GET", true, function(data) {
		save_idp(data.idp);
		for (var x in data.classrooms) {
			parse_classroom(data.classrooms[x]);
		}
		keep_checking();
	}, keep_checking);
}

function keep_checking() {
	Classes.purge_old();

	retrieve_old_classrooms();

	retrieve_gradeinfo();

	retrieve_agenda();

	var classrooms = Classes.get_notified();
	for(var i in classrooms) {
		retrieve_final_grades(classrooms[i]);
		retrieve_stats(classrooms[i]);
	}

	retrieve_final_exams_event();
}

function retrieve_final_grades(classroom) {
	if (!classroom.exped || !classroom.subject_code || classroom.final_grades || !classroom.all_events_completed(true)) {
		return;
	}

	// Stop retrieving this when exams are not done
	if (classroom.exams && classroom.exams.date && !isBeforeToday(classroom.exams.date) && !isToday(classroom.exams.date)) {
		Debug.print('Exam not done, not retrieving final grades for '+classroom.acronym);
		return;
	}

	var args = {
		"F": "edu.uoc.gat.cexped.AppFactory",
		"I": [{
			"O": 'Od9l_GxbvdWUtIsyoEt2IWynnbk=',
			"P": [classroom.subject_code, parseInt(classroom.exped)]
		}]
	};
	// Always GAT_EXP, not dependant on UOCi
	Queue.request( '/tren/trenacc/webapp/GAT_EXP.CEXPEDWEB/gwtRequest', args, 'json', false, function(resp) {
		try {
			var grades = false;
			var numConvoc = 0;
			if (classroom.any) {
				for (var x in resp.O) {
					if (resp.O[x].P.anyAcademico == classroom.any) {
						grades = resp.O[x].P;
					} else {
						numConvoc = Math.max(numConvoc, resp.O[x].P.numConvocatoriaActual);
					}
				}
			}

			if (!grades) {
				grades = resp.O.shift().P;
			}
			Debug.print("Grades found!");
			Debug.print(grades);

			var prov = grades.numConvocatoriaActual <= numConvoc;
			var types = ['C', 'P', 'FC', 'PS', 'PV', 'EX', 'PF',  'FE', 'FA'];

			for(var i in types) {
				var type = types[i];
				var lettername = "codCalif"+type;
				var numbername = "numCalif"+type;
				var letter = grades[lettername];
				if (letter != undefined && letter != '' && letter != 'N') {
					var nota = letter;
					var number = grades[numbername];
					if (number != undefined && number != '') {
						nota += " " + number;
					}
					var grade = classroom.add_grade(type, nota, prov);
					if (grade) {
						grade.notify(classroom.get_acronym());
					}
				}
			}

			if (!prov) {
				classroom.final_grades = true;
			}
		} catch(err) {
			Debug.error(err);
		}
	});

}

function retrieve_final_exams_event() {
	var idp = get_idp();
	if (!idp) {
		return;
	}

	// Stop retrieving this when exams are over
	var classrooms = Classes.get_notified();
	var exams = false;
	for(var x in classrooms) {
		var classroom = classrooms[x];
		if (classroom.exams && classroom.exams.date) {
			exams = compareDates(exams, classroom.exams.date) > 0 ? exams : classroom.exams.date;
		}
	}
	if (exams && isBeforeToday(exams)) {
		return;
	}

	var any = Classes.get_max_any();
	var args = {
		"F": "edu.uoc.gepaf.fullpersonalpaf.AppFactory",
		"I": [{
			"O": 'xUK0l32plsYSkUc00vYpZ2oukRM=',
			"P": ['' + any, "1", '' + idp, "ESTUDIANT"]
		}]
	};
	// Always GAT_EXP, not dependant on UOCi
	Queue.request('/tren/trenacc/webapp/GEPAF.FULLPERSONAL/gwtRequest', args, 'json', false, function(resp) {
		try {
			var objects = resp.O;
			for (var x in objects) {
				var object = objects[x].P;
				if (object.veureAula) {
					var code = object.codAssignatura;
					var classroom = Classes.search_subject_code(code);
					if (classroom) {
						var exam = {};
						if (object.indExam == 'S') {
							exam.date = getDate_slash(object.dataExamenFormatada);
							exam.seu =  object.descSeu;
							exam.timeEX =  getTimeFromNumber(object.horaIniciExamen) + ' - ' + getTimeFromNumber(object.horaFiExamen);
							exam.placeEX =  object.llocExam;
						}
						if (object.indProva == 'S') {
							exam.date = getDate_slash(object.dataExamenFormatada);
							exam.seu = object.descSeu;
							exam.timePS =  getTimeFromNumber(object.horaIniciProva) + ' - ' + getTimeFromNumber(object.horaFiProva);
							exam.placePS = object.llocProva;
						}
						classroom.exams = exam;
					}
				}
			}

		} catch(err) {
			Debug.error(err);
		}
	});

}

function retrieve_announcements() {
	var args = {
		'app:mobile': true,
		'app:cache': false,
		'app:only' : 'avisos'
	};
	Queue.request('/rb/inici/grid.rss', args, 'GET', false, function(resp) {
		$(resp).find('item').each(function() {
			var title = $(this).find('title').first().text();
    		var description = $(this).find('description').first().text();
    		var link = $(this).find('link').first().text();
    		var date = new Date($(this).find('pubDate').first().text());

    		var y = date.getFullYear() - 2000;
		    var m = date.getMonth() + 1;
		    var d = date.getDate();
		    var h = date.getHours();
		    var mm = date.getMinutes();
    		var date = addZero(d)+'/'+addZero(m)+'/'+addZero(y) + ' - '+h+':'+addZero(mm);

    		save_announcements(title, description, link, date);
		});
	});
}

function retrieve_mail() {
	if (get_check_mail()) {
		var args = {
			'app:mobile': true,
			'app:cache': false,
			'app:only' : 'bustia'
		};
		Queue.request('/rb/inici/grid.rss', args, 'GET', false, function(resp) {
			$(resp).find('item').each(function() {
	    		var description = $(this).find('description').first().text();
	    		var matches = description.match(/:([0-9]+):([0-9]+)$/);
				if (matches && matches[1]) {
					save_mail(matches[1]);
				}
			});

		});
	}
}

function save_mail(mails) {
	var old_mails = get_mails_unread();
	save_mails_unread(mails);
	Debug.print("Check mails: "+mails);
	if (mails > 0 && old_mails < mails && mails >= get_critical()) {
		notify(_('__NOTIFICATION_MAIL__', [mails]));
	}
}

function set_messages() {
	var old_messages = get_icon();
	var messages = Classes.notified_messages;
	save_icon(messages);

	var color = undefined;

	// Set icon
	if (messages > 0) {
		if (messages > old_messages && messages >= get_critical()) {
			notify(_('__NOTIFICATION_UNREAD__', [messages]));
		}
		color = messages >= get_critical() ? '#AA0000' : '#EB9316';
	}

	Debug.print("Check messages: Old "+old_messages+" New "+messages);

	var news = get_news();
	if (news) {
		color = '#9E5A9E';
	} else if (messages <= 0) {
		messages = "";
	}

	setBadge(messages, color);
}

function show_PAC_notifications() {
	var classrooms = Classes.get_notified();
	for(var i in classrooms) {
		for(var x in classrooms[i].events) {
			var ev = classrooms[i].events[x];
			if (ev.is_assignment()) {
				if (ev.ends_today()) {
					notify(_('__PRACT_END__', [ev.name, classrooms[i].get_acronym()]));
				} else if (ev.starts_today()) {
					notify(_('__PRACT_START__', [ev.name, classrooms[i].get_acronym()]));
				}
			}
		}
	}
}

function notify(str, time) {
	save_news(true);
	if (get_notification() && str.length > 0) {
		if (time == undefined) {
			time = 3000;
		}
		Debug.print(str);
		popup_notification("", "/img/logo128.png", str, time);
	}
}

function parse_classroom(classr) {
	var title = classr.shortTitle ? classr.shortTitle : classr.title;
	var classroom = Classes.search_domainassig(classr.domainFatherId);
	if (!classroom) {
		var aul = title.lastIndexOf(" aula " + classr.numeralAula);
		if (aul > 0) {
			title = title.substr(0, aul);
		}

		classroom = new Classroom(title, classr.domainCode, classr.domainId, classr.domainTypeId, classr.ptTemplate);
		classroom.domainassig = classr.domainFatherId;
	} else {
		classroom.code = classr.domainCode;
		classroom.domain = classr.domainId;
		classroom.type = classr.domainTypeId;
		classroom.template = classr.ptTemplate;
	}
	classroom.set_color(classr.color);
	classroom.any = classr.anyAcademic;
	classroom.aula = classr.numeralAula;

	var consultor = false;
	if (classr.widget.consultor != undefined && classr.widget.consultor.nomComplert != undefined) {
		consultor = classr.widget.consultor.nomComplert;
	}
	for (var x in classr.widget.referenceUsers) {
		if (!consultor || classr.widget.referenceUsers[x].fullName == consultor) {
			classroom.consultor = classr.widget.referenceUsers[x].fullName;
			classroom.consultormail = classr.widget.referenceUsers[x].email;
			classroom.consultorlastviewed = classr.widget.referenceUsers[x].lastLoginTime;
			break;
		}
	}
	Classes.add(classroom);

	if (!Classes.get_notify(classroom.code)) {
		return;
	}

	// Parse resources
	if (classr.widget.eines.length > 0) {
		for(var j in classr.widget.eines) {
			var resourcel = classr.widget.eines[j];
			if (resourcel.nom) {
				var resource = new Resource(resourcel.nom, resourcel.resourceId, resourcel.idTipoLink);
				resource.set_link(resourcel.viewItemsUrl);
				classroom.add_resource(resource);
				retrieve_resource(classroom, resource);
			}
		}
	}

	// Parse events
	if (classr.activitats.length > 0) {
		for (var y in classr.activitats) {
			var act = classr.activitats[y];
			var evnt = new CalEvent(act.name, act.eventId, 'ASSIGNMENT');

			var args = {};
			var urlbase;
			if (classr.presentation == "AULACA") {
				urlbase = '/webapps/aulaca/classroom/Classroom.action';
				args.classroomId = act.classroomId;
				args.subjectId = act.subjectId;
				args.activityId = act.eventId;
				args.javascriptDisabled = false;
			} else {
				urlbase = '/webapps/classroom/081_common/jsp/eventFS.jsp';
				args.domainId = act.domainId;
				var aux = classr.domainCode.split('_');
				args.domainTemplate = 'uoc_'+aux[0]+'_'+classr.codi;
				args.idLang =  get_lang_code();
				args.eventsId = act.eventId;
				args.opId = 'view';
				args.userTypeId = 'ESTUDIANT';
				args.canCreateEvent = false;
			}

			evnt.link = urlbase+'?'+uri_data(args)+'&s=';
			evnt.start = act.startDateStr;
			evnt.end = act.deliveryDateStr;
			evnt.solution = act.solutionDateStr;
			evnt.grading = act.qualificationDateStr;
			classroom.add_event(evnt);
		}
	}
}

function retrieve_old_classrooms() {
	var args = {
		newStartingPage:0,
		language: get_lang_code()
	};
	Queue.request('/UOC2000/b/cgi-bin/hola', args, 'GET', false, function(resp) {
		var index = resp.indexOf("aulas = ");
		if (index != -1) {
			var lastPage = resp.substring(index + 8);
			var last = lastPage.indexOf(";");
			lastPage = lastPage.substring(0,last);
			var classrooms = eval(lastPage);
			for (var i in classrooms) {
				parse_classroom_old(classrooms[i]);
			}
		}
	});
}

function parse_classroom_old(classr) {
	if (classr.title) {
		var title = classr.shortname ? classr.shortname : classr.title;
		var classroom;
		switch (classr.domaintypeid) {
			case 'TUTORIA':
				classroom = Classes.search_domainassig(classr.domainid);
				var sp = title.split(classr.codi_tercers);
				title = sp[0].trim();
				if (!classroom) {
					classroom = new Classroom(title, classr.code, classr.domainid, classr.domaintypeid, classr.pt_template);
				} else {
					classroom.title = title;
					classroom.code = classr.code;
					classroom.domain = classr.domainid;
					classroom.domainassig = classr.domainid;
					classroom.type = classr.domaintypeid;
					classroom.template = classr.pt_template
				}
				classroom.aula = classr.codi_tercers;

				if (classroom.notify) {
					retrieve_consultor(classroom);

					for (var j in classr.resources) {
						var resourcel = classr.resources[j];
						if (resourcel.title) {
							var resource = new Resource(resourcel.title, resourcel.code, "OLD");
							resource.set_messages(resourcel.numMesPend, resourcel.numMesTot);
							classroom.add_resource(resource);
						}
					}
				}
				Classes.add(classroom);

				break;
			case 'ASSIGNATURA':
				// Override title
				classroom = Classes.search_domainassig(classr.domainid);
				if (classroom) {
					classroom.title = title;
				}
				break;
			case 'AULA':
				break;
		}
	}
}

function retrieve_gradeinfo() {
	if (Classes.is_all_graded()) {
		return;
	}

	Queue.request('/rb/inici/api/enrollment/rac.xml', {}, 'GET', false, function(data) {
		$(data).find('files>file').each(function() {
			var exped = $(this).children('id').first().text().trim();

			$(this).find('listaAsignaturas asignatura').each(function() {
				// If has a children of same type
				if ($(this).has('asignatura').length > 0) {
					return;
				}

				var subject_code = $(this).find('codigo').first().text().trim();
				var classroom = Classes.search_subject_code(subject_code);
				if (classroom && !classroom.notify) {
					return;
				}

				$(this).find('listaActividades actividad').each(function() {
					// If has a children of same type
					if ($(this).has('actividad').length > 0) {
						return;
					}

					var eventid = $(this).find('pacId').text().trim();
					if (eventid) {
						if (!classroom) {
							classroom = Classes.get_class_by_event(eventid);
							if (!classroom) {
								return;
							}

							// Save the real subject code
							if (subject_code.length > 0) {
								classroom.subject_code = subject_code;
							}
						}

						if (!classroom.notify) {
							return;
						}
						classroom.exped = exped;

						var evnt = classroom.get_event(eventid);
						if (evnt && evnt.is_assignment()) {
							var changed = false;

							var committed = $(this).find('listaEntregas>entrega').length > 0;
							if (committed) {
								evnt.committed = true;
								var viewed = $(this).find('listaEntregas>entrega').last().find('fechaDescargaConsultor').html();
								evnt.viewed = viewed && viewed.length ? viewed: false;
								changed = true;
							}

							var comments = $(this).find('listaComentarios>comentario').length > 0;
							if (comments) {
								var lastcomment = $(this).find('listaComentarios>comentario').last();
								evnt.commenttext = lastcomment.find('texto').html();
								evnt.commentdate= lastcomment.find('fechaComentario').html();
								changed = true;
							}

							var grade = $(this).find('nota').text().trim();
							if (grade.length > 0 && grade != '-') {
								if (evnt.graded != grade) {
									evnt.graded = grade;
									changed = true;
									evnt.notify(classroom.get_acronym());
								}
							}
							if (changed) {
								classroom.add_event(evnt);
							}
						}
					} else if(classroom) {
						if (!classroom.notify) {
							return;
						}
						classroom.exped = exped;

						var nota = $(this).find('nota').text().trim();
						if (nota.length > 0 && nota != '-') {
							var name = $(this).find('descripcion').text().trim();
							var grade = classroom.add_grade(name, nota, false);
							if (grade) {
								grade.notify(classroom.get_acronym());
							}
						}
					}
				});

				if (classroom) {
					var nota = $(this).find('notaFinal').text().trim();
					if (nota.length > 0 && nota != '-') {
						var grade = classroom.add_grade('FA', nota, true);
						if (grade) {
							grade.notify(classroom.get_acronym());
						}
					}

					nota = $(this).find('notaFinalContinuada').text().trim();
					if (nota.length > 0 && nota != '-') {
						var grade = classroom.add_grade('FC', nota, false);
						if (grade) {
							grade.notify(classroom.get_acronym());
						}
					}
				}
			});
		});
	});
}

function retrieve_stats(classroom) {
	if (!classroom.subject_code || classroom.stats || !classroom.all_events_completed(true)) {
		return;
	}

	// Stop retrieving this when exams are not done
	if (classroom.exams && classroom.exams.date && !isBeforeToday(classroom.exams.date) && !isToday(classroom.exams.date)) {
		Debug.print('Exam not done, not retrieving stats for '+classroom.acronym);
		return;
	}

	var args = {modul: get_gat()+'.ESTADNOTES/estadis.assignatures',
				assig: classroom.subject_code,
				pAnyAcademic: classroom.any
			};
	Queue.request('/tren/trenacc', args, 'GET', false, function(data) {
		var index = data.indexOf("addRow");
		if (index != -1) {
			notify(_('__NOT_STATS__', [classroom.get_acronym()]));
			classroom.stats = true;
		}
	});
}

function retrieve_resource(classroom, resource) {
	if (resource.type == "URL") {
		return;
	}
	var args = {
		sectionId : '-1',
		pageSize : 0,
		pageCount: 0,
		classroomId: classroom.domain,
		subjectId: classroom.domainassig,
		resourceId: resource.code
	};
	Queue.request('/webapps/aulaca/classroom/LoadResource.action', args, 'GET', false, function(data) {
		try {
			var num_msg_pendents = data.resource.newItems;
	        var num_msg_totals = data.resource.totalItems;
	        /*if (num_msg_pendents == 0 && num_msg_totals == 0 && data.resource.missatgesNousBlog) {
				num_msg_pendents = num_msg_totals = 1;
	        }*/
			resource.set_messages(num_msg_pendents, num_msg_totals);
			resource.set_pos(data.resource.pos);
		} catch(err) {
    		Debug.error(err);
		}
		classroom.add_resource(resource);
    });
}

function retrieve_consultor(classroom) {
	var args = {
		classroomId : classroom.domain,
		subjectId : classroom.domainassig
	};
	Queue.request('/webapps/aulaca/classroom/UsersList.action', args, 'GET', false, function(data) {
		var user;
		try {
			if (data.tutorUsers[0]) {
				user = data.tutorUsers[0];
				classroom.consultor = user.fullName;
				classroom.consultormail = user.email;
				classroom.consultorlastviewed = user.lastLoginTime;
				return;
			}
			if (data.referenceUsers[0]) {
				user = data.referenceUsers[0];
				classroom.consultor = user.fullName;
				classroom.consultormail = user.email;
				classroom.consultorlastviewed = user.lastLoginTime;
			}
		} catch(err) {
    		Debug.error(err);
		}
    });
}

function retrieve_users(classroom, button) {
	var args = {
		classroomId : classroom.domain,
		subjectId : classroom.domainassig
	};
	Queue.set_after_function('nosave');
	Queue.request('/webapps/aulaca/classroom/UsersList.action', args, 'GET', false, function(data) {
		UI.fill_users(classroom, data);
		$(button).removeClass('spin');
    });
}

function retrieve_materials(classroom, button) {
	var args = {
		codAssig : classroom.subject_code
	};
	Queue.set_after_function('nosave');
	Queue.request('/webapps/mymat/listMaterialsAjax.action', args, 'GET', false, function(data) {
		UI.fill_materials(classroom, data);
		$(button).removeClass('spin');
    });
}

function retrieve_pac_stats(classroom, button) {
	var args = {
		codiTercers : classroom.subject_code,
		anyAcademic : classroom.any,
		numAula: classroom.aula,
		type: 't' // If not present only shows the current classroom
	};

	Queue.set_after_function('nosave');
	Queue.request('/webapps/rac/getEstadisticasAsignaturaAjax.action', args, 'GET', false, function(data) {
		Debug.print(data);
		//UI.fill_pac_stats(classroom, data);
		$(button).removeClass('spin');
    });
}

function retrieve_agenda() {
	var args = {
		'app:mobile': true,
		'app:cache': false,
		'app:only' : 'agenda',
		'app:Delta' : 365
	};
	Queue.request('/rb/inici/grid.rss', args, 'GET', false, function(resp) {
		var items = $(resp).find('item category:contains(\'CALENDAR\')').parents('item');
		if (items.length > 0) {
			items.each(function() {
				var json = rssitem_to_json(this);

				var title, evnt;
				// General events
				if (parseInt(json.EVENT_TYPE) == 16) {
					title = json.title + ' ' + json.description;
					evnt = new CalEvent(title, json.guid, 'UOC');
					evnt.start =  getDate_hyphen(json.pubDate);
					Classes.add_event(evnt);
					return;
				}

				var id = json.guid.split('_');
				var classroom = Classes.get_class_by_event(id[0]);
				if (!classroom) {
					var acronym = get_acronym(json.description);
					classroom = Classes.get_class_by_acronym(acronym);
				}
				if (!classroom) {
					Debug.log('Classroom not found');
					Debug.log(json);
					return;
				}

				evnt = classroom.get_event(id[0]);
				if (evnt && evnt.is_assignment()) {
					// The Assignments are processed in other parts
					return;
				}

				title = json.title.split('[');
				title = title[0].trim();
				if (!evnt) {
					evnt = new CalEvent(title, id[0], 'MODULE');
				}
				var date =  getDate_hyphen(json.pubDate);
				switch (parseInt(json.EVENT_TYPE)) {
					case 22:
					case 26:
						evnt.type = 'MODULE';
						evnt.start = date;
						break;
					case 23:
						evnt.type = 'STUDY_GUIDE';
						evnt.start = date;
						break;
					case 27:
						evnt.solution = date;
						break;
					case 29:
						evnt.end = date;
						break;
					default:
						Debug.print('Unknown event type ' + json.EVENT_TYPE);
						Debug.print(json);
						return;
				}
				evnt.link = json.link+'&s=';
				classroom.add_event(evnt);
			});
		}
	});
}


function retrieve_news() {
	var args = {
		up_isNoticiesInstitucionals : false,
		up_maxDestacades : 2,
		up_showImages : 0,
		up_sortable : true,
		up_maxAltres: 5,
		up_rssUrlServiceProvider : '%252Festudiant%252F_resources%252Fjs%252Fopencms_estudiant.js',
		up_target : 'noticies.jsp',
		fromCampus : true
		//up_title : 'Novetats%2520i%2520noticies',
		//up_maximized: true,
		//up_ck : 'nee',
		//libs : '/rb/inici/javascripts/prototype.js,/rb/inici/javascripts/effects.js,/rb/inici/javascripts/application.js,/rb/inici/javascripts/prefs.js,%2Frb%2Finici%2Fuser_modul%2Flibrary%2F944751.js%3Ffeatures%3Dlibrary%3Asetprefs%3Adynamic-height',
		//lang: get_lang(),
		//country: 'ES',
		//color: '',
		//userType: 'UOC-ESTUDIANT-gr06-a',
		//hp_theme: 'false'
	};
	Queue.set_after_function('nosave');
	Queue.request('/webapps/widgetsUOC/widgetsNovetatsExternesWithProviderServlet', args, 'GET', false, function(resp) {
		resp = resp.replace(/<img/gi, '<noload');
		resp = resp.replace(/\[\+\]/gi, '');
		var news = $('<div />').append(resp).find('#divMaximizedPart>ul').html();
		if (news != undefined) {
			$('#detail_news').html(news);
			$('#button_news').removeClass('spin');
		}
	});
}

var Session = new function() {
	var retrieving = false;
	var session = false;

	this.get = function() {
		if (!session) {
			session = get_session();
		}
		return session;
	};

	this.reset_retrieve = function() {
		session = false;
		this.retrieve();
	};

	this.retrieve = function() {
		var user_save = get_user();
		if (user_save.username && user_save.password) {
			if (!retrieving) {
				Debug.print('Retrieving session...');
				retrieving = true;

				var url = '/webapps/cas/login';
				var s = this.get();
				if (!s || s.length <= 0) {
					url += '?renew=true';
				}

				$.ajax({
					type: 'GET',
					url: root_url_ssl + url
				})
				.done(function(resp) {
					if (resp.match(/name="lt" value="([^"]+)"/)) {
						var lt = resp.match(/name="lt" value="([^"]+)"/)[1];
						var execution = resp.match(/name="execution" value="([^"]+)"/)[1];
						Debug.print('No session, logging in');

						var data = {
							username: user_save.username,
							password: user_save.password,
							lt: lt,
							execution: execution,
							_eventId: 'submit'
						};
					    url = root_url_ssl + "/webapps/cas/login";
					    $.ajax({
					        type: 'POST',
					        beforeSend: function (request) {
					            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
					        },
					        xhrFields: {
					            withCredentials: true
					        },
					        url: url,
					        data: uri_data(data),
					        processData: false
					    })
					    .done(function(resp) {
					    	parse_session(resp);
					    })
					    .fail(function() {
					        Debug.error('ERROR: Cannot login');
					    })
					    .always(function() {
					        retrieving = false;
					    });
					} else {
						parse_session(resp);
					}
				})
				.fail(function() {
			        Debug.error('ERROR: Cannot renew session');
			        not_working();
			    })
			    .always(function() {
			        retrieving = false;
			    });
			}
		}
	}

	function parse_session(resp) {
		Debug.log(resp);
		var matchs = resp.match(/campusSessionId = ([^\n]*)/);
		if (matchs) {
			var session = matchs[1];
			if (!get_working()) {
				notify(_('__UOC_WORKING__'));
			}
			save_session(session);
			Debug.print('Session! '+session);
			Queue.run();
			if (typeof login_success == 'function') {
				login_success();
			}
		} else {
			Debug.error('ERROR: Cannot fetch session');
			if (typeof login_failed == 'function') {
				login_failed();
			}
			not_working();
		}
	}
};
