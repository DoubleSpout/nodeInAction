var express = require('express');
var reidsPool = require('redis-connection-pool')
var app = express();
//从环境变量里读取redis服务器的ip地址
var redisHost = process.env['REDIS_PORT_6379_TCP_ADDR'] || '127.0.0.1'
var redisPort = process.env['REDIS_PORT_6379_TCP_PORT']	|| 6379

var reidsClient = reidsPool('myRedisPool', {PORT:redisPort, HOST:redisHost, MAX_CLIENTS:100})

app.get('/', function(req, res){
	  reidsClient.get('access_count', function(err, countNum){
	  		if(err){
	  			return res.send('get access count error')
	  		}
	  		if(!countNum){
	  			countNum = 1
	  		}
	  		else{
	  			countNum = parseInt(countNum) + 1
	  		}
	  		reidsClient.set('access_count', countNum, function(err){
	  			if(err){
		  			return res.send('set access count error')
		  		}
		  		res.send('total visited: '+countNum.toString())
	  		})
	  })
});

app.listen(8000);