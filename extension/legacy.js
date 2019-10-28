// Classroom events now are parsed in other places.
// Legacy code ahead. Not used.
function parse_agenda_event(json) {
    var id = json.guid.split('_');
    var classroom = Classes.get_class_by_event(id[0]);
    if (classroom) {
        // Already parsed
        return;
    }

    Debug.error('Unknown event ' + json.title);
    var acronym = get_acronym(json.description);
    classroom = Classes.get_class_by_acronym(acronym);
    if (!classroom) {
        Debug.error('Classroom not found');
        Debug.print(json);
        return;
    }

    evnt = classroom.get_event(id[0]);
    if (evnt && evnt.is_assignment() && classroom.any) {
        // The Assignments are processed in other parts.
        return;
    }

    if (!classroom.any && json.EVENT_COLOR){
        classroom.color = json.EVENT_COLOR;
    }

    if (!evnt) {
        title = json.title.split('[');
        title = get_html_realtext(title[0].trim());
        title = title.replace("\\'", "'");
        evnt = new CalEvent(title, id[0], 'MODULE');
    }
    var date =  getDate_hyphen(json.pubDate);
    switch (parseInt(json.EVENT_TYPE)) {
        case 22:
        case 26:
            evnt.start = date;
            break;
        case 23:
            evnt.type = 'STUDY_GUIDE';
            evnt.start = date;
            break;
        case 27:
            evnt.solution = date;
            break;
        case 19:
            evnt.type = 'ASSIGNMENT';
            evnt.grading = date;
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
}

function retrieve_old_classrooms() {
    var args = {
        newStartingPage:0,
        language: get_lang_code()
    };
    Queue.request('/cgibin/hola', args, 'GET', false, function(resp) {
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
                    classroom = new Classroom(title, classr.code, classr.domainid, classr.domaintypeid);
                } else {
                    classroom.title = title;
                    classroom.code = classr.code;
                    classroom.domain = classr.domainid;
                    classroom.domainassig = classr.domainid;
                    classroom.type = classr.domaintypeid;
                }
                classroom.aula = classr.codi_tercers;

                retrieve_consultor(classroom);
                break;
            case 'ASSIGNATURA':
                // Override title
                classroom = Classes.search_domainassig(classr.domainid);
                if (classroom) {
                    classroom.title = title;
                }
                return;
            case 'AULA':
                classroom = Classes.search_domainassig(classr.domainfatherid);
                if (classroom && classroom.any) {
                    return;
                }
                var aul = title.lastIndexOf(" aula ");
                var aulanum = false;
                if (aul > 0) {
                    aulanum = title.substr(aul + 6);
                    title = title.substr(0, aul);
                }
                if (!classroom) {
                    classroom = new Classroom(title, classr.code, classr.domainid, classr.domaintypeid);
                } else {
                    classroom.code = classr.code;
                    classroom.domain = classr.domainid;
                    classroom.type = classr.domaintypeid;
                }
                if (aulanum) {
                    classroom.aula = aulanum;
                }
                classroom.domainassig = classr.domainfatherid;

                break;
        }

        if (classroom.notify && !classroom.any) {
            for (var j in classr.resources) {
                var resourcel = classr.resources[j];
                if (resourcel.title) {
                    var resource = new Resource(resourcel.title, resourcel.code);
                    resource.type = "old";
                    resource.set_messages(resourcel.numMesPend, resourcel.numMesTot);
                    classroom.add_resource(resource);
                }
            }
        }
        Classes.add(classroom);
    }
}

function get_url_base(url) {
    //prefer to use l.search if you have a location/link object
    url = get_real_url(url);
    var urlparts= url.split('?');
    if (urlparts.length >= 2) {
        return urlparts[0];
    } else {
        return url;
    }
}

function get_url_with_data(url, data) {
    return get_real_url(url) + '?' + uri_data(data);
}
