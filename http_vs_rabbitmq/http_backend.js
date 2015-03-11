var express = require('express');
//加载order订单集合的model
var orderModel = require('./orderModel.js');
var app = express();
var listenPort = 3000;

app.get('/', function(req, res){
  res.send('hello world, listenPort: '+listenPort);
});

//定义路由，执行订单操作
app.get('/buy/:userid([0-9]+)', function(req, res){
	var userid = req.params.userid;
	orderModel.countAll({}, function(err, orderCount){
		if(err) return res.status(500).send(err);
		if(orderCount >= 100){//表示已经卖完了
			return res.send('sold out!');
		}
		else{
			//说明还有库存，没卖完，这时候就要往数据库插入一条带这个userid的订单记录了
			orderModel.insertOneByObj({
				'userId':userid,
				'writeTime':new Date()
			}, function(err, obj){
				//创建订单成功，响应成功
				if(err) return res.status(500).send(err);
				return res.send('buy success, orderid: '+obj._id.toString());
			});
		}
	});

});

app.listen(listenPort);
console.log('server listen on  '+listenPort);