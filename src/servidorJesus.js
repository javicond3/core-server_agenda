var net = require('net');
var fs = require('fs');
var port = 9000;

if(process.argv.length !== 3){
   console.log("Parámetros mal. Sintax -> node servidor.fs filename");
   process.end();
}

function Agenda(){
   var agenda = {};

   return{

       añadir: function(nombre,telf){
           if(nombre !== undefined){
               agenda[nombre] = telf;
               return "OK\n";
           } else {
               return "KO\n";
           }
       },

       extraTelf: function(nombre){
           var telefono = agenda[nombre];
           if(telefono === undefined){
               return "KO\n";
           } else {
               return  telefono;
           }
       },

       toString: function(){
           var cadena = "";
           for(var p in agenda){
               cadena += p + ", " + agenda[p] + "\n";
           }
           return cadena;
       }
   }
}


var server = net.createServer(function(socket){
   socket.setEncoding('utf-8'); //Definimos la codificación de la conexión
   var agenda = Agenda(); //creamos la agenda, en principio vacia
   //Leemos el fichero
   var fichero = process.argv[2];
   fs.readFile(fichero,'utf-8',function(err,data){
       if(data !== undefined){
           var entradas = data.split("\n");
           for(var i=0;i<entradas.length;i++){
               var dato = entradas[i].split(", "); //dato[0] = nombre y dato[1] = telefono
               agenda.añadir(dato[0],dato[1]);
           }
       }
   });

   //Con la agenda inicializada, ponemos el servidor a esperar a que el cliente envie algo
   socket.on('data',function(data){
       var mensaje = data.toString().trim().split(" ");
       if(mensaje[0] === "setTel"){
           try{
               var separado = data.trim().split("\"");
               for(var j=0;j<separado.length;j++){
                   separado[j] = separado[j].trim();
               }
               if(separado.length !== 3){
                   socket.write("KO\n");
               } else {
                   if(!separado[2].match(/[0-9]{9}/)){
                       socket.write("KO\n");
                   } else {
                       agenda.añadir(separado[1],separado[2]);
                       socket.write(agenda.añadir(separado[1],separado[2]));
                       fs.writeFile(fichero,agenda.toString(),function(err){
                           if(err){
                               socket.write("Error en la escritura\n");
                           }
                       });
                   }
               }
           } catch(err){
               socket.write("Excepcion -> KO\n");
           }
       } else if (mensaje[0] === "getTel"){
           var separado = data.trim().split("\"");
           for(var j=0;j<separado.length;j++){
               separado[j] = separado[j].trim();
           }
           socket.write(agenda.extraTelf(separado[1]));
           socket.write("\n");
       } else if(mensaje[0] === "quit"){
           socket.end();
       } else {
           socket.write("Comando invalido\n");
       }
   });

});

server.listen(port); 