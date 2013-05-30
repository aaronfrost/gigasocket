
var express = require('express'),
    sockjs = require('sockjs'),
    http = require('http'), 
    app = express();


    // 1. Echo sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};
var sockjs_echo = sockjs.createServer(sockjs_opts);



var votingOn = false;
var masters = [];
var votes = {
  um :  0, 
  so:   0,
  like: 0,
  uh:   0
};

sockjs_echo.on('connection', function(conn) {
    conn.on('data', function(message) {
      var m = JSON.parse(message);

      switch (m.type){
        case 'vote':
          console.log(1);
          if(votingOn){
            console.log(2, conn.wait3);
            if(!conn.wait3){
              console.log('VOTING', m);
              votes[m.data.word] +=1;
              sendVoteToMasters(m.data);
              conn.wait3 = true;
              setTimeout(function(){
                conn.wait3 = false;
                conn.write(JSON.stringify({type:'vote_timeout_over'}));
              }, 3000);
              conn.write(JSON.stringify({type:'vote_sent'}));
            }else{
              conn.write(JSON.stringify({type:'vote_limit_reached'}));
            }  
          } else {
            conn.write(JSON.stringify({type:'voting_not_enabled'}));
          }
          break;
        case 'master':
          masters.push(conn);
          conn.on('close', function(){
            masters.forEach(function(val, idx){
              if(val === conn){
                masters.splice(idx, 1);
              }
            });
          });
          conn.write(JSON.stringify({type:'master_init',data: votes, votingOn:votingOn}));
          break;
        case 'voting_on':
          console.log(m.data.on, typeof m.data.on);
          if(m.data.on == true){
            votingOn = true;
          }else{
            votingOn = false;
          }
          break;
        default:
          console.log('unknown message type', message);
          break;
      }
    });
});

function sendVoteToMasters(data){
  if(masters.length){
    masters.forEach(function(master){
      master.write(JSON.stringify({type:'update_votes',data:votes}));
    });
  }
}


var app = express(); /* express.createServer will not work here */
var server = http.createServer(app);

sockjs_echo.installHandlers(server, {prefix:'/echo'});

console.log(' [*] Listening on 0.0.0.0:9999' );
var port = process.env.PORT || 5000; // Use the port that Heroku provides or default to 5000
server.listen(port);

// var masters = [];
// var votes = {
//   um :  0, 
//   so:   0,
//   like: 0,
//   uh:   0
// };
// var votingOn = false;

// io.sockets.on('connection', function (socket) {
//   socket.on('vote', function (data) {
//     if(votingOn){
//       if(!socket.wait3){
//         votes[data.word] +=1;
//         sendVoteToMasters(data);
//         socket.wait3 = true;
//         setTimeout(function(){
//           socket.wait3 = false;
//           socket.emit('vote_timeout_over');
//         }, 3000);
//         socket.emit('vote_sent');
//       }else{
//         socket.emit('vote_limit_reached');
//       }  
//     }
    
//   });

//   socket.on('master', function(){
//     masters.push(socket);
//     socket.on('disconnect', function(){
//       master.forEach(function(val, idx){
//         if(val === socket){
//           masters.splice(idx, 1);
//         }
//       });
//     });
//     socket.emit('master_init', votes);
//   });

//   socket.on('voting_on', function(message){
//     console.log(message.on, typeof message.on);
//     if(message.on == true){
//       votingOn = true;
//     }else{
//       votingOn = false;
//     }
//   });

// });

// function sendVoteToMaster(data){
//   if(masters.length){
//     masters.forEach(function(master){
//       master.emit('update_votes',votes);
//     });
//   }
// }

// Configuration

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/index.html');
// });



