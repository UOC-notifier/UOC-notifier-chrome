
var strings = {
    //Options
    'Usuario' : {
        ca : 'Usuari',
        es : 'Usuario'
    },
    'Password' : {
        ca : 'Contrasenya',
        es : 'Contraseña'
    },
    'Universidad' : {
        ca : 'Universitat',
        es : 'Universidad'
    },
    'Intervalo de comprovación' : {
        ca : 'Interval de comprovació',
        es : 'Intervalo de comprovación'
    },
    'Mínimo de mensajes para considerar crítico y notificar' : {
        ca : 'Mínim de missatges per considerar crític i notificar',
        es : 'Mínimo de mensajes para considerar crítico y notificar'
    },
    'Mensajes emergentes' : {
        ca : 'Missatges emergents',
        es : 'Mensajes emergentes'
    },
    'Mensajes' : {
        ca : 'Missatges',
        es : 'Mensajes'
    },
    'Guardar' : {
        ca : 'Desa',
        es : 'Guardar'
    },
    'Notificar aulas' : {
        ca : 'Notifica aules',
        es : 'Notificar aulas'
    },
    'Eliminar aulas antiguas' : {
        ca : 'Elimina les aules antigues',
        es : 'Eliminar aulas antiguas'
    },
    'minutos' : {
        ca: 'minuts',
        es: 'minutos'
    },

    //Popup
    'Resumen de notas' : {
        ca: 'Resum de notes',
        es: 'Resumen de notas'
    },
    'Rev. de exámen' : {
        ca: 'Rev. exàmen',
        es: 'Rev. de exámen'
    },
    'Notas finales' : {
        ca: 'Notes finals',
        es: 'Notas finales'
    },
    'Estadísticas' : {
        ca: 'Estadístiques',
        es: 'Estadísticas'
    },
    'Prop. Matric' : {
        ca: 'Prop. Matric',
        es: 'Prop. Matric'
    },
    'Matrícula' : {
        ca: 'Matrícula',
        es: 'Matrícula'
    },
    'Notas por SMS' : {
        ca: 'Notes per SMS',
        es: 'Notas por SMS'
    },
    'Expediente' : {
        ca: 'Expedient',
        es: 'Expediente'
    },
    'Agenda antigua' : {
        ca: 'Agenda antiga',
        es: 'Agenda antigua'
    },
    'Agenda nueva' : {
        ca: 'Agenda nova',
        es: 'Agenda nueva'
    },
    'Entregado' : {
        ca: 'Entregat',
        es: 'Entregado'
    },
    'Materiales' : {
        ca: 'Materials',
        es: 'Materiales'
    },
    'Plan Docente' : {
        ca: 'Pla Docent',
        es: 'Plan Docente'
    },
    'Ir al campus' : {
        ca: 'Vés al campus',
        es: 'Ir al campus'
    },
    'Ir al aula' : {
        ca: 'Vés a l\'aula',
        es: 'Ir al aula'
    },
    'Ir al recurso' : {
        ca: 'Vés al recurs',
        es: 'Ir al recurso'
    },
    'Inicio' : {
        ca: 'Inici',
        es: 'Inicio'
    },
    'Fin' : {
        ca: 'Fi',
        es: 'Fin'
    },
    'Solución' : {
        ca: 'Solució',
        es: 'Solución'
    },
    'Nota' : {
        ca: 'Nota',
        es: 'Nota'
    },
    'Notas' : {
        ca: 'Notes',
        es: 'Notas'
    },
    'Noticias' : {
        ca: 'Notícies',
        es: 'Noticias'
    },
    'Agenda' : {
        ca: 'Agenda',
        es: 'Agenda'
    },
    'Enlaces del campus' : {
        ca: 'Enllaços del campus',
        es: 'Enlaces del campus'
    },
    'Actualizar' : {
        ca: 'Actualitzar',
        es: 'Actualizar'
    },
    'Tienes ' : {
        ca: 'Tens ',
        es: 'Tienes '
    },
    ' mensajes por leer' : {
        ca: ' missatges per llegir',
        es: ' mensajes por leer'
    },
    'Hoy acaba la ' : {
        ca: 'Avui acaba la ',
        es: 'Hoy acaba la '
    },
    'Hoy empieza la ' : {
        ca: 'Avui comença la ',
        es: 'Hoy empieza la '
    },
    ' de ' : {
        ca: ' de ',
        es: ' de '
    },
    'El usuario/password no es correcto' : {
        ca: 'L\'usuari/contrasenya no és correcte',
        es: 'El usuario/password no es correcto'
    },
    'Opciones guardadas. Espera a que se actualizen las aulas...' : {
        ca: 'Opcions desades. Espera a que s\'actualitzin las aules...',
        es: 'Opciones guardadas. Espera a que se actualizen las aulas...'
    },
    'No hay usuario y password...' : {
        ca: 'No hi ha usuari i password...',
        es: 'No hay usuario y password...'
    },
    'Esperando a entrar... Si el mensaje no desaparece puede que el usuari y password sean incorrectos.' : {
        ca: 'Esperant per entrar... Si el missatge no desapareix, pot ser que l\'usuari i contrasenya no siguin correctes.',
        es: 'Esperando a entrar... Si el mensaje no desaparece puede que el usuari y password sean incorrectos.'
    },
    'Atención' : {
        ca: 'Atenció',
        es: 'Atención'
    },
    'No hay aulas visibles. Confirma en la configuración las aulas que quieres visualizar' : {
        ca: 'No hi ha aules visibles. Confirma a la configuració les aules que vols veure',
        es: 'No hay aulas visibles. Confirma en la configuración las aulas que quieres visualizar'
    },
    'Has sacado una ' : {
        ca: 'Has tret una ',
        es: 'Has sacado una '
    },
    ' en la ' : {
        ca: ' a la ',
        es: ' en la '
    },
}

var language = navigator.language || navigator.userLanguage;

function _(str) {
    if (strings.hasOwnProperty(str)) {
        var st = strings[str];
        if (st.hasOwnProperty(language)) {
            return st[language];
        }
    }
    console.log(str);
    return str;
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