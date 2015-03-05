var express = require('express');
var request = require('request');
var amqp = require('amqplib/callback_api');
var uuid = require('node-uuid');

var correlationId = uuid();
var app = express();
var channel;
var q = 'fib'

app.get('/', function(req, res){
  res.send('hello world');
});

//定义路由
app.param('num', /^\d+$/);
app.get('/fib/:num', function(req, res){
	var num = req.params.num
	var answer = function(msg){
		res.send(msg.content.toString())
	}
	ch.consume(q, answer, {noAck:true});
	ch.sendToQueue(
		q, 
		new Buffer(num.toString()), 
		{replyTo:q, correlationId:correlationId}
	);
})


var bail = function(err, conn) {
  console.error(err);
  if (conn) conn.close(function() { process.exit(1); });
}

var on_connect = function(err, conn) {
  if (err !== null) return bail(err);

  var on_channel_open = function(err, ch) {
    if (err !== null) return bail(err, conn);
    ch.assertQueue(q, {durable: false}, function(err, ok) {
	      if (err !== null) return bail(err, conn);
	      channel = ch
    });
  }
  conn.createChannel(on_channel_open);
}

amqp.connect('urlurlurlurlurl', {'noDelay':true}, on_connect);


app.listen(3000);