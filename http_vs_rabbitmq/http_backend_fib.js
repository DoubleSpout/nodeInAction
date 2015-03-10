var express = require('express');
var app = express();
//根据启动命令的第3个参数，监听不同的端口
var listenPort = parseInt(process.argv[2] || 3000);

function fibo(n) {//定义斐波那契数组计算函数
    return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
}

app.get('/', function(req, res){
  res.send('hello world, listenPort: '+listenPort);
});

//定义路由，计算斐波那契
app.get('/fibcal/:num([0-9]+)', function(req, res){
	var num = req.params.num
	var calResult = {
		'listenPort':listenPort,
		'result':fibo(num)
	}
	res.send(calResult)
})

app.listen(listenPort);
console.log('server listen on  '+listenPort);