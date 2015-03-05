var express = require('express');
var request = require('request');
var app = express();

app.get('/', function(req, res){
  res.send('hello world');
});

//定义路由
var uri = 'http://192.168.1.110:8000/fibcal/%d';//定义请求到后端的url地址
var timeOut = 30*1000;//超时时间为30秒
app.param('num', /^\d+$/);
app.get('/fib/:num', function(req, res){
	var num = req.params.num
	//利用request库发送http请求
	request({
	    method:'GET',
	    timeout:timeOut,
	    uri:util.format(uri, num)
	}, function(error, req_res, body){
		if(error){
			res.send(500, error);
		}
		else if(req_res.statusCode != 200){
			res.send(500, req_res.statusCode);
		}
		else{
			res.send(body);
		}
		
	})
})
app.listen(3000);