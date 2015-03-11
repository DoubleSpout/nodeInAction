var express = require('express');
var request = require('request');
var amqp = require('amqplib/callback_api');
var uuid = require('node-uuid');

var correlationId = uuid();
var app = express();
var q = 'fibq';
var q2 = 'ackq'

var bail = function(err, conn) {
	  console.error(err);
	  if (conn) conn.close(function() { 
	  	process.exit(1); 
	  });
}
var conn;
//模拟的用户Id号
var globalUserId = 1;

app.get('/', function(req, res){
  res.send('hello world');
});

//定义路由
app.get('/buy/', function(req, res){
	var num = globalUserId++;
		
	//创建channel
	conn.createChannel(function(err, ch){
		if (err !== null) return bail(err, conn);
		ch.assertQueue(q2, {durable: false}, function(err, ok) {
			  if (err !== null) return bail(err, conn);
			  //定义消费函数
			  ch.consume(q2, function(msg){
					//将返回值设置和http方式相同
					//避免因为返回值的大小造成的测试数据偏差
					res.send(msg.content.toString());
					//这里为了提升性能，我们不关闭链接，而是关闭channel，链接可以重用
					ch.close();
				}, {noAck:true});
			  //发送数据到消费者
			  ch.sendToQueue(
					q, 
					new Buffer(num.toString()), 
					{
						replyTo:q2, 
						correlationId:correlationId
					}
				);  
		});
	});	
})

var on_connect = function(err, rabbit_conn) {
	if (err !== null) return bail(err);
	conn = rabbit_conn;
}

//建立连接
amqp.connect('amqp://127.0.0.1', {'noDelay':true}, on_connect);

app.listen(5001);
console.log('server listen on 5001');