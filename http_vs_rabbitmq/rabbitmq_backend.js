var amqp = require('amqplib/callback_api');
//加载order订单集合的model
var orderModel = require('./orderModel.js');
		
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
	
	var ackSend = function(msg, content){
		ch.sendToQueue(msg.properties.replyTo,							
					 new Buffer(content.toString()),
					 {correlationId: msg.properties.correlationId});
	  	ch.ack(msg);	
	}

	var reply = function(msg) {											
		    var userid = parseInt(msg.content.toString());
		    orderModel.countAll({}, function(err, orderCount){
				if(err) return ackSend(msg, err);
				if(orderCount >= 100){//表示已经卖完了
					return ackSend(msg, 'sold out!');
				}
				else{
					//说明还有库存，没卖完，这时候就要往数据库插入一条带这个userid的订单记录了
					orderModel.insertOneByObj({
						'userId':userid,
						'writeTime':new Date()
					}, function(err, obj){
						//创建订单成功，响应成功 
						if(err) return ackSend(msg,err);
						return ackSend(msg, 'buy success, orderid: '+obj._id.toString());
					});
				}
		    });  													
		}

		ch.consume(q, reply, {noAck:false}, function(err) {					
		  if (err !== null) return bail(err, conn);
		  console.log(' [x] Awaiting RPC requests');
		});
  });

}

amqp.connect('amqp://127.0.0.1',on_connect);