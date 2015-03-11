var express = require('express');
var request = require('request');
var util = require('util');
var app = express();
//模拟的用户Id号
var globalUserId = 1;

app.get('/', function(req, res){
  res.send('hello world');
});


//定义路由
var uri = 'http://127.0.0.1:8000/buy/%d';//定义请求到后端的url地址
var timeOut = 30*1000;//超时时间为30秒

app.get('/buy/', function(req, res){
	var num = globalUserId++;
	//利用request库发送http请求
	request({
		method:'GET',
		timeout:timeOut,
		uri:util.format(uri, num)
	}, function(error, req_res, body){
		if(error){
			res.status(500).send(error)
		}
		else if(req_res.statusCode != 200){
			res.status(500).send(req_res.statusCode)
		}
		else{
			res.send(body);
		}
	});
});
app.listen(5000);
console.log('server listen on  5000');
