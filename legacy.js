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