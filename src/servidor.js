/*
Titulo: Practica 6 
Autor: Ignacio Barrios Palacios
Descripcion: servidor de agenda usando node
Fecha: 17/03/2016
*/

var net = require('net');
var fs = require('fs');
var port =(8000);


if (process.argv.length !==3){
	console.log('sintax: "node servidor.js filename"');
	process.exit();
}

function agenda(datos){
	var info = datos;

	return{

		get: function(name){
			if(name !== undefined && datos[name] !== undefined){
				return info[name];
			}
			else{
				return "KO";
			}
		},


		set: function(name, number){
			info[name]=number;
		},


		toString: function(){
			var contacto = "";
			for (var name in info){
				if(name !== undefined && datos[name] !== undefined){
					contacto += name + ", " + info[name] + "\n";
				}
			}
			return contacto;
		}
	}
}

var server = net.createServer(function(socket){	//creamos el servidor 'server'
	socket.setEncoding('utf-8');
	var info = {};	//variable info vacia

	fs.readFile(process.argv[2], 'utf-8', function(err, data){	//leemos el fichero
		if(data !== undefined){		//si el fichero no es undefined 
			contactos = data.split("\n");	//guardamos en contactos la informacion del fichero
			for (var i=0; i<contactos.length; i++){		//recorremos los contactos por filas
				var cada_contacto = contactos[i].split(", ");	//guardamos cada contacto en una variable
				info[cada_contacto[0]] = cada_contacto[1];
			}
		}
	});

	nuevaAgenda = agenda(info);	//crea nueva agenda con la informacion de fs (fichero)

	socket.on('data', function(d){

		var string = d.toString().trim();
		var mensaje = string.split(" ");

		if(mensaje[0] === "setTel") {	//si en lo escrito exite setTel
			try{
				var separado = d.trim().split(/"/);	//almacena en separado lo escrito en bloques
				if (separado.length !== 3){	//si esos bloques no son 3
					socket.write("KO\n");	//KO
				}
				else{
					if(!separado[2].match(/[0-9]+/)){	//si el ultimo bloque (tlfno) no son 9 numeros
						socket.write("KO\n");	//KO
					}
					else{
						var sep2 = separado[2].trim();	//almacena en sep2 el nº tlf
						nuevaAgenda.set(separado[1], sep2);	//set de la agenda con el nombre y el tlf
						fs.writeFile(process.argv[2], nuevaAgenda.toString(socket), 'utf-8', function(err){	//escribe en el fichero
							if(err){
								throw new Error("Error al escribir en el archivo");
								socket.write("KO\n");
							}
						});
						socket.write("OK\n");	//OK, se ha guardado o sobreescrito el tlf
					}
				}
			}
			catch (e){
				socket.write("KO\n")	//sino se puede añadir o sobreescribir lanza KO
			}
			return;
		}

		else if(mensaje[0] === "getTel") {	//mira si en lo escrito existe getTel
			var separado = d.trim().split(/"/);	//almacena en separado lo escrito en bloques
			if(separado.length !== 3){	//si esos bloques no son 3
				socket.write("KO\n");	//KO
			}
			else{
				var getname = nuevaAgenda.get(separado[1]);	//sino almacena en getname la informacion del nombre
				socket.write(getname + "\n");	//nos lo escribe por pantalla
			}
			return;
		}

		else if(mensaje[0] === "quit") {	//mira si en lo escrito hay un quit
			socket.end();	//si lo hay, finaliza el servidor
		}
		else{
			socket.write('ERROR DE COMANDO' + "\n");	//sino lanza KO
		}
	});
});

server.listen(port);