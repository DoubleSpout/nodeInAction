var amqp = require('amqplib/callback_api');
		
function fibo(n) {//定义斐波那契数组计算函数
    return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
}

function bail(err, conn) {
  console.error(err);
  if (conn) conn.close(function() { process.exit(1); });
}

function on_connect(err, conn) {
  if (err !== null) return bail(err);

  process.once('SIGINT', function() { conn.close(); });

  var q = 'fibq';													

  conn.createChannel(function(err, ch) {
	ch.assertQueue(q, {durable: false});								
	ch.prefetch(1);														
	ch.consume(q, reply, {noAck:false}, function(err) {					
	  if (err !== null) return bail(err, conn);
	  console.log(' [x] Awaiting RPC requests');
	});

	function reply(msg) {												
	  var n = parseInt(msg.content.toString());
	  ch.sendToQueue(msg.properties.replyTo,							
					 new Buffer(fibo(n).toString()),
					 {correlationId: msg.properties.correlationId});
	  ch.ack(msg);														
	}
  });
}

amqp.connect('amqp://127.0.0.1',on_connect);