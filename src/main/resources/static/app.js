var stompClient = null;

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    }
    else {
        $("#conversation").hide();
    }
    $("#greetings").html("");
}

function connect() {
//    var socket = new SockJS('http://localhost:8080/stomp-endpoint');
    var socket = new SockJS('https://sgtasec.herokuapp.com/stomp-endpoint');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        setConnected(true);
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/greetings', function (greeting) {
            showGreeting(JSON.parse(greeting.body));
        });
    });
}

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}

function sendName() {
    stompClient.send("/app/hello", {}, JSON.stringify({'email': $("#email").val()}));
}

function showGreeting(message) {
	console.log(message);
	
	let alertas = [];
	alertas = message.alertas;	
	
    $("#greetings").append("<tr><td>" + message.emailRecibido + "</td></tr>");
    $("#greetings").append("<tr><td>" + message.tiempoEstimadoParaAtencion + "</td></tr>");
    $("#greetings").append("<tr><td>" + message.atencion.turno.turnoAtencion + "</td></tr>");
    $("#greetings").append("<tr><td>" + message.atencion.cliente.nombre + "</td></tr>");
    $("#greetings").append("<tr><td>" + message.atencion.tipoAtencion.nombre + "</td></tr>");
    $("#greetings").append("<tr><td>" + message.atencion.fechaCreacion + "</td></tr>");

	alertas.forEach(function(elemento, indice, array) {
  	  console.log(elemento, indice);
    $("#alertas").append("<tr><td>" + elemento.color + "</td><td>" + elemento.colorHtml + "</td><td>" + elemento.duracionDesde + 
		"</td><td>" + elemento.duracionHasta + "</td><td>" + elemento.descripcion + "</td></tr>");
	})
	
}

$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $( "#connect" ).click(function() { connect(); });
    $( "#disconnect" ).click(function() { disconnect(); });
    $( "#send" ).click(function() { sendName(); });
});