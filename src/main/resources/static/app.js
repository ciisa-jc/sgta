var stompClient = null;
var interval = null;
var alertas = [];

function setConnected(connected) {
    $("#connect").prop("disabled", connected);	
    $("#disconnect").prop("disabled", !connected);
    $("#send").prop("disabled", !connected);

    if (connected) {
        $("#conversation").show();
        $("#alertas").show();
		$("#connect").removeClass( "btn-light" ).addClass( "btn-success" );
    }
    else {
        $("#conversation").hide();
        $("#alertas").hide(); 
		$("#connect").removeClass( "btn btn-success" ).addClass( "btn btn-light" );
		$("#email").val("") 			
    }
    $("#greetings").html("");
}

function connect() {
	
//    var socket = new SockJS('http://localhost:8080/stomp-endpoint');
    var socket = new SockJS('https://sgtasec.herokuapp.com/stomp-endpoint');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        setConnected(true);
        stompClient.subscribe('/topic/greetings', function (greeting) {		
		// test send meesage to server	
		if (greeting.body == 'email_vacio') {			
			sendName();			
		} else {		
            showGreeting(JSON.parse(greeting.body));
		}	
        });
    });
}

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
		clearInterval(interval);
		sessionStorage.clear();		
		//limpiar datos mostrados
		limpiarDatos();
    }
    setConnected(false);
}

function sendName() {
    stompClient.send("/app/atencion", {}, JSON.stringify({'email': $("#email").val()}));
}

function showGreeting(message) {
	if (message.emailRecibido == $("#email").val()) {		
		// Muestra si pudo recuperar un turno
		if (message.atencion != null) {
			$("#turno").text('Turno ' + message.atencion.turno.turnoAtencion); 
			let contLlamados = message.atencion.contadorLlamados;
			$("#contadorLlamados").text('Usted ha sido llamado(a) ' + ((contLlamados > 0) && (contLlamados < 2))? contLlamados + " Vez" : contLlamados + " Veces");
			clearInterval(interval);
	
			if (message.tiempoEstimadoParaAtencion != null) {
											
				if (sessionStorage.getItem('seg') === null) {
					sessionStorage.setItem('seg', minutesToSeconds(message.tiempoEstimadoParaAtencion));
				
				} else if (sessionStorage.getItem('seg') > minutesToSeconds(message.tiempoEstimadoParaAtencion)) {
					sessionStorage.setItem('seg', minutesToSeconds(message.tiempoEstimadoParaAtencion));			
				}		
				//Alertas
				alertas = message.alertas;
				//Activar conteo regresivo		
				interval = setInterval(descontarSegundos, 1000);
				
			} else {
				// Tiempo de espera completado
				$("#tiempoEstimadoParaAtencion").css("background-color", "yellow");
				$("#tiempoEstimadoParaAtencion").text('Su tiempo de espera ha finalizado.');
			}

		} else {
			$("#turno").text('Su correo no registra un turno, pendiente de atenci\u00F3n.');
		}	
	}		
}

$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $( "#connect" ).click(function() { connect(); });
    $( "#disconnect" ).click(function() { disconnect(); });
    $( "#send" ).click(function() { sendName(); });
    $("#conversation").hide();
    $("#alertas").hide();
});

function limpiarDatos() {
	$("#email").val('');
	$("#turno").text('');
	$("#tiempoEstimadoParaAtencion").text('');
	$("#conteoRegresivo").text('');
	$("#seccion-alerta").css("background-color", "#fff");	
	$("#alerta").text('');
	$("#contadorLlamados").text('');
	
}

function descontarSegundos() {
	var seconds = sessionStorage.getItem('seg');
	sessionStorage.setItem('seg', seconds - 1);	
	$("#tiempoEstimadoParaAtencion").text('Su tiempo estimado de espera es de ' + secondsToHourAndMinutes(sessionStorage.getItem('seg'))); 
	//sección superior, conteo regresivo
	$("#conteoRegresivo").text(secondsToHourAndMinutes(sessionStorage.getItem('seg'))); 
	//Buscar alertas
	manejoAlertas();
	
	if (sessionStorage.getItem('seg') <= 0) {
		clearInterval(interval);
		sessionStorage.clear();
	}
}

function manejoAlertas() {
	let alerta = [];	
	// Manejo de Alertas, duracionDesde y duracionHasta expresados en minutos
	alerta = alertas.filter(function (el) {
		return ((Math.floor(sessionStorage.getItem('seg') / 60) >= el.duracionDesde) && (Math.floor(sessionStorage.getItem('seg') / 60) <= el.duracionHasta));
	});
	
	if (alerta.length == 1) {
		$("#seccion-alerta").css("background-color", alerta[0].colorHtml);
		$("#alerta").text(alerta[0].descripcion);
	}
}		

function minuteToHourAndMinutes(minutes) {
	var respuesta = '';
    var total = minutes;    
    var hrs = Math.floor(total / 60); // Horas.
    var min = total % 60; // Minutos.
	if (hrs > 0) {
		respuesta += hrs;			
		respuesta += ((hrs > 1) ? ' Horas' : ' Hora'); 				
		if (min > 0) {
			respuesta += " y ";
		}
	}
	
	if (min > 0) { 
		respuesta += min;
		respuesta += ((min > 1) ? ' Minutos' : ' Minuto');
	}
    return  respuesta;
}

function secondsToHourAndMinutes(seconds) {
	var respuesta = '';
	var minutes = Math.floor(seconds / 60);
	var total = minutes;   
	var hrs = Math.floor(total / 60); // Horas.
	var min = total % 60; // Minutos.
	var sec = seconds % 60; //Segundos 
	
	if (hrs > 0) {	
		respuesta += hrs +' '+  ((hrs > 1) ? ' Horas' : ' Hora'); 				
		if (min > 0) {respuesta += " y ";}
	}
	
	if (min > 0) { 
		respuesta += min +' '+ ((min > 1) ? ' Minutos ' : ' Minuto ');
	}
	
	if (sec > 0) { 
		respuesta += sec +' '+  ((sec > 1) ? ' Segundos' : ' Segundo');
	}
	return  respuesta;
}

function minutesToSeconds(minutes) {		
	var min = parseInt(minutes, 10);
    min = (min > 0)? min : 0;   
    var segundos = Math.floor(min * 60); // Segundos.
	return segundos;
}