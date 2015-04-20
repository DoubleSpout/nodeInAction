#基于RabbitMQ搭建消息队列
##前言
本章主要介绍如何利用消息队列软件`RabbitMQ`解决web服务器或应用服务器间的通信。通常我们对处理大并发而带来的CPU或I/O密集型问题最好的控制方法就是使用消息队列，对于服务器间跨语言通信，以前我们一般使用`XMLRPC`，现在比较流行`http`协议的`restful`方式，而使用`RabbitMQ`也能够很灵活来的处理这部分事情。

在学习本章之前，读者需要对`Linux`基本命令行操作、`Express`框架、`python`语言有简单了解。

##什么是消息队列，消息队列的优势
大家对队列肯定都不陌生，例如去`KFC`排队就餐、去银行排队取号办理业务等等，都是我们在现实生活中遇到当人流过多时，用队列的方式解决抢占资源的办法，其实这个方式同样适用于我们互联网领域。

设想下，如果同时上千个客户端要求处理某件事情，没有队列，我们的CPU就会像`KFC`服务员那样，给A配了一个汉堡，接着切换到B，给B再配一杯可乐……，然后CPU就因为频繁切换任务而导致执行效率低下，前面的客户端还没来得及处理，后面的又上来了，最终将会造成大量的连接出现超时错误。

理解了队列的概念后，我们就要解释下消息了，“消息”是在两台计算机间传送的数据单位。消息可以非常简单，例如只包含文本字符串；也可以更复杂，可能包含嵌入对象（比如`xml`或`json`）。消息大家可以理解为去`KFC`点餐的菜单，告诉服务员你想要什么东西。

那么消息队列应用在我们的服务器通信中，它有什么优势呢？我们为什么要选择消息队列呢？

1、应用解耦

在项目启动之初来预测将来项目会碰到什么需求，是极其困难的。消息队列在处理过程的中间插入了一个隐含的、基于数据的接口层，两边的处理过程都要实现这一接口。这允许你独立地扩展或修改两边的处理过程，只要确保它们遵守同样的接口约束。

2、冗余存储

有时在处理数据的时候操作会失败。除非数据被持久化，否则将永远丢失。消息队列把数据进行持久化直到它们已经被完全处理，通过这一方式规避了数据丢失风险。在被许多消息队列所采用的“插入-获取-删除”范式中，在把一个消息从队列中删除之前，需要你的处理过程明确指出该消息已经被处理完毕，确保你的数据被安全地保存直到你使用完毕。

3、可扩展性

因为消息队列解耦了你的处理过程，所以增大消息入队和处理的频率是很容易的；只要另外增加处理过程即可。不需要改变代码，不需要调节参数，扩展就像调大风扇按钮一样简单。

4、灵活性&峰值处理能力

当你的应用访问流量攀升到一个不同寻常的水平。在访问量剧增的情况下，你的应用仍然需要继续发挥作用，但是这样的突发流量并不常见；如果为以能处理这类峰值访问为标准来投入资源随时待命无疑是巨大的浪费。使用消息队列能够使关键组件顶住增长的访问压力，而不是因为超出负荷的请求而完全崩溃。

5、可恢复性

当体系的一部分组件失效，不会影响到整个系统。消息队列降低了进程间的耦合度，所以即使一个处理消息的进程挂掉，加入队列中的消息仍然可以在系统恢复后被处理。而这种允许重试或者延后处理请求的能力通常是造就一个略感不便的用户和一个沮丧透顶的用户之间的关键要素。

6、送达保证

消息队列提供的冗余机制保证了消息能被实际地处理，只要一个进程读取了该队列即可。获取一个消息只是"预定"了这个消息，暂时把它移出了队列。除非客户端明确表示已经处理完了这个消息，否则这个消息会被放回到队列中去，经过一段时间之后再次被处理。

7、排序保证

在许多情况下，数据处理的顺序都很重要。消息队列本来就是排序的，并且能保证数据会按照特定的顺序来处理。`RabbitMQ`保证消息通过`FIFO`（先进先出）的顺序来处理，因此消息在队列中的位置就是从队列中检索他们的位置。

8、缓冲

在任何重要的系统中，都会有需要不同处理时间的元素。例如,加载一张图片比应用过滤器花费更少的时间。消息队列通过一个缓冲层来帮助任务最高效率的执行，写入队列的处理尽可能的快速，它不受从队列另一端消费者的处理速度的约束，这样有助于提升整体系统的性能，不至于由于消费速度慢导致流程部顺畅。

9、理解数据流

在一个分布式系统里，要得到一个关于用户操作会用多长时间及其原因的总体印象，是个巨大的挑战。消息队列通过消息被处理的频率，来方便地辅助确定那些表现不佳的处理过程或领域。

10、异步通信

很多时候，你不想也不需要立即处理消息。消息队列提供了异步处理机制，允许你把一个消息放入队列，但并不立即处理它。你想向队列中放入多少消息就放多少，然后在你乐意的时候再去处理它们。

相信上述十个原因，使得消息队列成为在进程或应用之间进行通信的较好形式，队列是创建强大的分布式应用的关键。

##安装和启动RabbitMQ
`RabbitMQ`就是诸多消息队列产品中的一款，虽然它不是速度性能最快的，但它却是应用广泛、相当稳定的产品，而且由于`RabbitMQ`是由`erlang`语言开发的，所以具有天生的分布式优势，这些都是我推荐`RabbitMQ`部署在生产环境的原因，官网对`RabbitMQ`的定义非常简单。

1、为应用而生的强大的消息队列

2、使用简单

3、跨平台支持

4、支持大量的开发平台和语言

5、开源和社区支持（言下之意就是免费哦~）

关于各操作系统下载和启动的方式，官网有比较详细的文档，我这里就不再累述了，访问地址：[http://www.rabbitmq.com/download.html](http://www.rabbitmq.com/download.html "http://www.rabbitmq.com/download.html")，我主要介绍下使用上一章的`Docker`来安装和启动它，手握利器也要加以善用。
	
	#到截稿时，最新版本是3.4.3
	$ sudo docker pull rabbitmq
	#启动rabbitmq服务
	$ docker run -d -e RABBITMQ_NODENAME=my-rabbit --name some-rabbit -p 5672:5672 rabbitmq:3

用了`Docker`我们就可以更加专心和专注地开发业务代码了，不用为装环境而浪费一天。下面几个小节，我们将学习`RabbitMQ`的各种队列，对日常开发会很有帮助。

##RabbitMQ的Hello World
要连接`RabbitMQ`我们需要安装连接包，我们依次执行命令，创建环境并安装依赖，这里我使用官方推荐的`npm`包`amqplib`。
	
	$ mkdir /var/node
	$ mkdir /var/node/rabbit_hello
	$ cd /var/node
	$ npm install amqplib

现在我们打算建立这样一个队列，一个生产者往队列中填充数据，一个消费者对队列的数据进行消费，如下图所示。

![](http://7u2pwi.com1.z0.glb.clouddn.com/rabbit_1.png)

然后我们写一个`hello world`的示例的服务器部分，并把它保存在`/var/node/rabbit_hello/server.js`。

	var amqp = require('amqplib');
	amqp.connect('amqp://127.0.0.1').then(function(conn) { 	   (1)
	  process.once('SIGINT', function() { conn.close(); });	   (2)
	  return conn.createChannel().then(function(ch) {		   (3)
    
	    var ok = ch.assertQueue('hello', {durable: false});    (4)

	    ok = ok.then(function(_qok) {
	      return ch.consume('hello', function(msg) {		  （5）
	        console.log(" [x] Received '%s'", msg.content.toString());
	      }, {noAck: true});
	    });
	    
	    return ok.then(function(_consumeOk) {                 （6）
	      console.log(' [*] Waiting for messages. To exit press CTRL+C');
	    });
	  });
	}).then(null, console.warn);							   (7)

在解释上述代码之前，我们需要简单解释一下`then`，它是`Node.js`用来处理异步回调的方法之一。一般我们处理`Node.js`异步回调嵌套的方法有两种，`Promise`和`async`，我们这次用的`amqplib`包处理异步就推荐使用`Promise`方式。

那`Promise`究竟是什么呢？

`Promise`是对异步编程的一种抽象的实现。它是一个代理对象，代表一个必须进行异步处理的函数返回的值或抛出的异常。`callback`是编写`Node.js`异步代码最简单的机制。可是用这种原始的`callback`必须以牺牲控制流、异常处理和函数语义为代价，而我们在同步代码中已经习惯了它们的存在，`Promises`能带它们回来。

`Promises`对象的核心部件是它的`then`方法。

我们可以用这个方法从异步操作中得到返回值（传说中的履约值），或抛出的异常（传说中的拒绝的理由）。`then`方法有两个可选的参数，都是`callback`函数，分别是`onFulfilled`和`onRejected`，用代码说话。

	var promise = doSomethingAync()
	promise.then(onFulfilled, onRejected)

`Promises`被解决时（异步处理已经完成）会调用`onFulfilled`和`onRejected`。因为只会有一种结果，所以这两个函数中仅有一个会被触发。

下面是一个`readfile`返回`Promises`的例子，同时`then`之后返回的任然是那个`Promises`对象，也就是说我们可以像下面那样链式调用。

	var promise = readFile()
	
	var promise2 = promise.then(function (data) {
	  //如果读取文件成功，那开始读取另外一个文件，readAnotherFile
	  return readAnotherFile()
	}, function (err) {
	  //如果读取出错，那打印错误信息，并且任然继续读取另外一个文件，readAnotherFile
	  console.error(err)
	  return readAnotherFile()
	})
	//将读取的另外一个文件（readAnotherFile）异步的处理结果打印出来
	.then(console.log, console.error)

使用`Promise`最显著的特性就是我们不必对嵌套的所有异常都做显式的处理，我们看下面的伪代码。

	doThisAsync()
  	.then(doThatAsync)
	.then(doanotherAsync)
  	.then(null, console.error)

上述`doThisAsync`，`doThatAsync`或`doanotherAsync`异步中的任何一个错误，都会被最后的`then`语句捕获，并作处理。

现在我们回到代码，代码(1)处表示我们连接本地`127.0.0.1`的`RabbitMQ`队列，并返回一个`Promise`对象。

代码(2)，表示接受`CTRL+C`的退出信号时，我们关闭和`RabbitMQ`的链接`conn.close();`。

代码(3)，`conn.createChannel()`表示创建一个通道，

代码(4)，我们通过`ch.assertQueue`在这个通道上监听`hello`这个队列，并设置`durable`队列持久化为`false`，表示队列保存在内存中，最后返回一个`Promise`对象。

代码(5)，接下来的代码就是让通道消费`hello`这个队列，并写上处理函数，打印消息数据，同时返回一个`Promise`。

代码(6)，在设置监听消费成功之后，我们打印一行文本，表示服务器正常工作，等待客户端的数据。

代码(7)，当操作过程中有错误时，执行`console.warn`打印错误。

解读完服务器的代码后，我们创建`client.js`用来发送消息`。

	var amqp = require('amqplib');
	var when = require('when');	
	
	amqp.connect('amqp://localhost').then(function(conn) {		(1)
	  return when(conn.createChannel().then(function(ch) {	    (2)
	    var q = 'hello';
	    var msg = 'Hello World!';
	
	    var ok = ch.assertQueue(q, {durable: false});           (3)
	    
	    return ok.then(function(_qok) {                         (4)
	      ch.sendToQueue(q, new Buffer(msg));
	      console.log(" [x] Sent '%s'", msg);
	      return ch.close();
	    });
	  })).ensure(function() { conn.close(); });                 (5)
	}).then(null, console.warn);

我们还需要安装一下`when`这个模块才能让`client.js`工作，执行`npm install when`。`when`模块是一个高性能稳定的实现`Promise`的`Node.js`异步处理包，接着我们还是解释下客户端代码的运行流程。

代码(1)，连接本地的`RabbitMQ`队列，这个和服务器代码一样。

代码(2)，用`when(x)`包装一个`Promise`对象，仍然返回一个`Promise`对象，这边我们创建一个通道。

代码(3)，同样我们把通道绑定到`hello`队列，并且持久化设定为`false`。

代码(4)，我们向这个队列发送`Buffer`，内容为`'Hello World!'`，发送完毕之后关闭通道。

代码(5)，在通道关闭之后，我们把整个链接也关闭，`ensure`就类似执行扫尾工作的函数，是`promise.finally`的别名。

接着我们进入命令行，执行如下命令启动消息队列服务器。

	$ node server.js
	[*] Waiting for messages. To exit press CTRL+C

然后我们启动客户端，发送消息给服务器。

	$ node client.js
	[x] Sent 'Hello World!'

客户端消息发送完毕后，就自动退出了，这时切换到服务器的`ssh`窗口，我们看到服务器这边打印出了客户端发送过来的数据。

	[*] Waiting for messages. To exit press CTRL+C
	[x] Received 'Hello World!'

一个简单的`RabbitMQ`的例子就跑起来了。接下来我们要分别学习几种不一样的队列样式，这些队列在日常开发中都非常有用。

##RabbitMQ的工作队列
现在我们来看一个稍微复杂点的队列，一个生产者配合多个消费者的队列，这样的队列场景可能日常生产环境中使用的比较多，将一个复杂的任务负载均衡到各个节点，相比只有一个消费者的队列，这样不至于队列堆积过长，同时也能保证队列的响应时间，如下图所示，这条队列拥有两个消费者。

![](http://7u2pwi.com1.z0.glb.clouddn.com/rabbit_2.png)

下面的所有示例，我们将不再使用`Promise`风格的代码，使用更加普遍的`callback`方式来展现，上一节的`Promise`示例主要是想让读者了解`Node.js`处理异步回调的另一种方式。

首先是`server`的代码，保存为`receive.js`。

	var amqp = require('amqplib/callback_api');								(1)
	
	function bail(err, conn) {												(2)
	  console.error(err);
	  if (conn) conn.close(function() { process.exit(1); });
	}
	
	function on_connect(err, conn) {										(3)
	  if (err !== null) return bail(err);
	  process.once('SIGINT', function() { conn.close(); });					(4)
	  
	  var q = 'task_queue';
	
	  conn.createChannel(function(err, ch) {								(5)
	    if (err !== null) return bail(err, conn);
	    ch.assertQueue(q, {durable: true}, function(err, _ok) {				(6)
	      ch.consume(q, doWork, {noAck: false});							(7)
	      console.log(" [*] Waiting for messages. To exit press CTRL+C");
	    });
	
	    function doWork(msg) {												(8)
	      var body = msg.content.toString();
	      console.log(" [x] Received '%s'", body);
	      var secs = body.split('.').length - 1;							(9)
	      setTimeout(function() {
	        console.log(" [x] Done");
	        ch.ack(msg);
	      }, secs * 1000);
	    }
	  });
	}
	
	amqp.connect('amqp://localhost', on_connect);
	
针对上述代码我们简单做一下解释：

(1)表示引入回调函数的`api`对象来处理`RabbitMQ`队列。

(2)定义了出错的函数，当出现错误后，会打印错误并且关闭连接，退出进程。

(3)定义了当程序成功启动，并且成功连入`RabbitMQ`后执行的回调函数，包括接收数据、处理异常等操作。

(4)监听进程信号，当进程接收到`SIGINT`信号后，将关闭连接，`SIGINT`信号就是我们熟知的`CTRL+C`。

(5)对连接`conn`对象执行创建`channel`的操作，创建成功后将做监听动作。

(6)断言监听队列`q`，也就是名为`task_queue`的队列

(7)在收到`q`队列消息后，执行`ch.consume()`方法来把这部分数据丢到`doWork`方法中去消费，并且将`noAck`设置为`false`，表示对消费的结果做出响应。

(8)定义`doWork`函数，用来消费数据，接受到数据后，将数据`toString()`转为字符串，然后打印数据

(9)根据数据字符串中的`.`的个数，模拟处理这个数据所要消耗的描述，在等待`secs*1000`秒之后，将`msg`响应回客户端。

下面我们来看下将数据发送到队列的客户端的代码，保存为`new_task.js`

	var amqp = require('amqplib/callback_api');						
	
	function bail(err, conn) {										
	  console.error(err);
	  if (conn) conn.close(function() { process.exit(1); });
	}
	
	function on_connect(err, conn) {								
	  if (err !== null) return bail(err);
	
	  var q = 'task_queue';												(1)
	  
	  conn.createChannel(function(err, ch) {
	    if (err !== null) return bail(err, conn);						(2)
	    ch.assertQueue(q, {durable: true}, function(err, _ok) {			(3)
	      if (err !== null) return bail(err, conn);
	      var msg = process.argv.slice(2).join(' ') || "Hello World!";	(4)
	      ch.sendToQueue(q, new Buffer(msg), {persistent: true});		(5)
	      console.log(" [x] Sent '%s'", msg);
	      ch.close(function() { conn.close(); });
	    });
	  });
	}
	
	amqp.connect('amqp://localhost', on_connect);

客户端代码同服务器代码雷同，解释如下。

(1)定义队列名`task_queue`，这里要和服务器那边的名字相同

(2)当创建`channel`出错后执行关闭连接和退出进程操作。

(3)连入队列`q`，然后传入回调函数

(4)接收进程启动参数，如果没有参数就使用`Hello World!`字符串

(5)将消息`msg`发送到队列中

我们在命令分别执行2次如下命令，启动2个`receive.js`来处理任务。
	
	$ node receive.js
	[*] Waiting for messages. To exit press CTRL+C

	$ node receive.js
	[*] Waiting for messages. To exit press CTRL+C

然后我们执行多次客户端来发送消息，查看2个`receive.js`的打印数据。

	$ node new_task.js First message.
	$ node new_task.js Second message..
	$ node new_task.js Third message...
	$ node new_task.js Fourth message....
	$ node new_task.js Fifth message.....

第一个`receive.js`打印的数据。

	[*] Waiting for messages. To exit press CTRL+C
	[x] Received 'First message.'
	[x] Done
	[x] Received 'Third message...'
	[x] Done
	[x] Received 'Fifth message.....'
	[x] Done

第二个`receive.js`打印的数据。
	
	[*] Waiting for messages. To exit press CTRL+C
	[x] Received 'Second message..'
	[x] Done
	[x] Received 'Fourth message....'
	[x] Done

这样就将任务平均分给了2个消费者来处理了，随着我们的任务量增大，可以逐步地增加消费者来增强队列的计算能力。

##RabbitMQ的PUB/SUB队列
上一节我们将一个比较复杂的任务平均分配给了多个消费者来处理，这样有助于减轻整个系统的负载，但也可能同样一个消息有多个消费者订阅，这样的情境我们就需要使用到`PUB/SUB`了，队列如下图所示。

![](http://7u2pwi.com1.z0.glb.clouddn.com/rabbit_3.png)

上图中的两个消费者，`C1`将会记录日志，而`C2`将会打印日志，每一个消费者都将接收到数据包。在`RabbitMQ`中的核心思想就是每一个生产者都不直接将消息丢入到队列中，甚至于生产者根本就不知道这个消息将会被送到哪个或哪几个消费者手中，这样解耦的思想有利于我们整个系统。

所以在这个系统中，生产者只是把消息传递给`exchange`。`exchange`是一个非常简单的东西，一边连接着生产者，接收生产者发送过来的数据，另一边连接着队列，负责把数据推送到队列中去。`exchange`必须知道它将对接受到的数据做什么处理，例如将数据推送到指定的队列，又或者推送到多条队列中等等，这样类似的行为，我们称之为`exchange`类型。这些类型是预设好的，有如下几个类型供我们选择：`direct`, `topic`, `headers`和`fanout`。

本节我们将使用`fanout`类型的`exchange`来为整个系统服务，`fanout`中文直译就是扇出，表示将消息多播出去。

我们先看生产者的代码，保存为`emit_log.js`。

	var amqp = require('amqplib/callback_api');
	
	function bail(err, conn) {
	  console.error(err);
	  if (conn) conn.close(function() { process.exit(1); });
	}
	
	function on_connect(err, conn) {
	  if (err !== null) return bail(err);
	
	  var ex = 'logs';											(1)
	
	  function on_channel_open(err, ch) {
	    if (err !== null) return bail(err, conn);
	    ch.assertExchange(ex, 'fanout', {durable: false});		(2)
	    var msg = process.argv.slice(2).join(' ') ||			
	      'info: Hello World!';
	    ch.publish(ex, '', new Buffer(msg));					(3)
	    console.log(" [x] Sent '%s'", msg);
	    ch.close(function() { conn.close(); });
	  }
	
	  conn.createChannel(on_channel_open);
	}
	
	amqp.connect('amqp://localhost', on_connect);

生产者的代码较之前没有什么大的变化，主要的区别就是生产者不直接把数据推送给队列了，而是推送给`exchange`。

(1)命名`exchange`为`logs`。

(2)定义`exchange`，命名为`logs`，类型为`fanout`,`durable`持久化队列为`false`。

(3)将消息`msg`推送给`exchange`节点，其中`publish`函数第二个参数为路由配置，我们在下一节会详细说明。

当消息推送给`exchange`后，消费者就需要从队列中获取消息并做处理，我们保存消费者代码为`receive_logs.js`。

	var amqp = require('amqplib/callback_api');
	
	function bail(err, conn) {
	  console.error(err);
	  if (conn) conn.close(function() { process.exit(1); });
	}
	
	function on_connect(err, conn) {
	  if (err !== null) return bail(err);
	  process.once('SIGINT', function() { conn.close(); });
	
	  var ex = 'logs';
	  
	  function on_channel_open(err, ch) {
	    if (err !== null) return bail(err, conn);
		ch.assertExchange(ex, 'fanout', {durable: false}, function(err){			(1)
			if (err !== null) return bail(err, conn);
		    ch.assertQueue('', {exclusive: true}, function(err, ok) {				(2)
		      var q = ok.queue;														(3)
		      ch.bindQueue(q, ex, '');												(4)
		      ch.consume(q, logMessage, {noAck: true}, function(err, ok) {			(5)
		        if (err !== null) return bail(err, conn);
		        console.log(" [*] Waiting for logs. To exit press CTRL+C.");
		      });
		    });
		})
	  }
	
	  function logMessage(msg) {													(6)
	    if (msg)
	      console.log(" [x] '%s'", msg.content.toString());
	  }
	
	  conn.createChannel(on_channel_open);
	}
	
	amqp.connect('amqp://localhost', on_connect);

我们之前消费的队列都是命名过的，这里我们不需要对队列命名，而是让`RabbitMQ`随机给队列命名即可，我们只需要在声明队列时不传入名称就可以生成一个随机名称的队列。

(1)声明`fanout`类型的`exchange`，命名为`logs`。

(2)声明随机名称队列，`exclusive`参数为`true`表示，当消费者断开队列连接，此队列就会删除。

(3)通过`ok.queue`获取队列对象。

(4)将队列和`exchange`绑定在一起，第三个参数是路由配置，我们暂时留空，下一节会有说明。

(5)开始消费队列中的数据，这里我们还定义了消费完成后的回调函数。

(6)定义了如何消费这些数据的`logMessage`函数。

我们先启动两个`receive_logs.js`，等待消费队列数据。

	$ node receive_logs.js
	[*] Waiting for logs. To exit press CTRL+C.

	$ node receive_logs.js
	[*] Waiting for logs. To exit press CTRL+C.

然后启动生产者，向这2个消费者广播数据，我们分别抛出3条`Hello World`的消息。

	$ node emit_log.js 
	[x] Sent 'info: Hello World!'
	$ node emit_log.js 
	[x] Sent 'info: Hello World!'
	$ node emit_log.js 
	[x] Sent 'info: Hello World!'

2个消费者的打印信息分别如下，我们成功将消息广播出去了。

第一个`receive_logs`进程打印的信息。

	[x] 'info: Hello World!'
	[x] 'info: Hello World!'
	[x] 'info: Hello World!'

第二个`receive_logs`进程打印的信息。

	[x] 'info: Hello World!'
	[x] 'info: Hello World!'
	[x] 'info: Hello World!'

##RabbitMQ的队列路由
上一节我们实现了生产者对多个消费者的广播消息，但实际上很多情况，我们的消费者是多种多样的，比如我们有对日志`error`专门分析的消费者，有对日志消息纯打印的消费者等等，这些消费者要根据自己的需要去获取队列里的数据，这样我们就要用到`exchange`的路由功能了，模型图如下。

![](http://7u2pwi.com1.z0.glb.clouddn.com/rabbit_4.png)

要使用`exchange`的路由功能，我们就需要在定义`exchange`时修改它的类型了，上一节的`fanout`类型在这里已经不适用，它只能无脑地广播，所以我们需要将`exchange`修改为`direct`类型。`direct`类型的`exchange`算法很简单，它会把消息推送到绑定这个路由`key`的队列中去。简单点说，就是生产者将消息和路由的`key`推送给`exchange`，`exchange`则根据哪个或哪几个消费队列绑定了这个路由`key`，从而把消息再推送到这些队列中，供消费者消费。

我们先看生产者的代码，保存为`emit_log_direct.js`。

	var amqp = require('amqplib/callback_api');
	
	var args = process.argv.slice(2);
	var severity = (args.length > 0) ? args[0] : 'info';				(1)
	var message = args.slice(1).join(' ') || 'Hello World!';			
	
	function bail(err, conn) {
	  console.error(err);
	  if (conn) conn.close(function() { process.exit(1); });
	}
	
	function on_connect(err, conn) {
	  if (err !== null) return bail(err);
	
	  var ex = 'direct_logs';											(2)
	  var exopts = {durable: false};
	  
	  function on_channel_open(err, ch) {
	    if (err !== null) return bail(err, conn);
	    ch.assertExchange(ex, 'direct', exopts, function(err, ok) {		(3)
	      ch.publish(ex, severity, new Buffer(message));				(4)
	      ch.close(function() { conn.close(); });
	    });
	  }
	  conn.createChannel(on_channel_open);
	}
	
	amqp.connect('amqp://localhost', on_connect);

(1)我们根据启动参数，定义了路由`key`变量`severity`，默认值为`info`。

(2)我们为`exchange`节点命名为`direct_logs`。

(3)声明`exchange`，类型为`direct`。

(4)向名为`direct_logs`的`exchange`节点推送数据，并且带上路由`key`变量`severity`。

然后我们来看看，消费者是如何绑定路由`key`，从而来消费这些数据的，保存代码为`receive_logs_direct.js`。

	var amqp = require('amqplib/callback_api');
	
	var basename = require('path').basename;
	
	var severities = process.argv.slice(2);									(1)
	if (severities.length < 1) {
	  console.log('Usage %s [info] [warning] [error]',
	              basename(process.argv[1]));
	  process.exit(1);
	}
	
	function bail(err, conn) {
	  console.error(err);
	  if (conn) conn.close(function() { process.exit(1); });
	}
	
	function on_connect(err, conn) {
	  if (err !== null) return bail(err);
	  process.once('SIGINT', function() { conn.close(); });
	
	  conn.createChannel(function(err, ch) {
	    if (err !== null) return bail(err, conn);
	    var ex = 'direct_logs', exopts = {durable: false};					(2)
	
	    ch.assertExchange(ex, 'direct', exopts);							(3)
	    ch.assertQueue('', {exclusive: true}, function(err, ok) {			(4)
	      if (err !== null) return bail(err, conn);
	
	      var queue = ok.queue, i = 0;										(5)
	
	      function sub(err) {												(6)
	        if (err !== null) return bail(err, conn);
	        else if (i < severities.length) {								
	          ch.bindQueue(queue, ex, severities[i], {}, sub);
	          i++;
	        }
	      }
	
	      ch.consume(queue, logMessage, {noAck: true}, function(err) {		(7)
	        if (err !== null) return bail(err, conn);
	        console.log(' [*] Waiting for logs. To exit press CTRL+C.');
	        sub(null);														
	      });
	    });
	  });
	}
	
	function logMessage(msg) {												(8)
	  console.log(" [x] %s:'%s'",
	              msg.fields.routingKey,
	              msg.content.toString());
	}
	
	amqp.connect('amqp://localhost', on_connect);

消费者的代码稍微有点长，不过我们对大部分代码还是比较熟悉的，所以理解起来也不难。

(1)我们从启动命令中获取一个需要绑定路由`key`的数组，比如我们的启动命令`node receive_logs_direct.js error info`，这样变量`severities`就保存了`["error", "info"]`。如果没有任何路由`key`，程序将打印提示信息并退出。

(2)这里和生产者一样，我们定义了`exchange`的名字为`direct_logs`。

(3)声明`exchange`，这里需要和生产者声明的一样。

(4)声明队列，在队列声明成功之后，我们要定义消费函数。

(5)获得已经声明的队列对象`queue`。

(6)定义`sub`函数，用来绑定`exchange`和队列，如果`i`的小于`severities`数组长度，则绑定队列并且完成绑定后再调用`sub`继续绑定队列。

(7)定义消费函数`logMessage`，在定义完消费函数之后，执行`sub()`函数开始第(6)步的绑定操作

(8)`logMessage`是消费队列数据函数，操作就是打印路由`key`和消息内容。

同样，我们还是先启动消费者，启动一个绑定路由`key`为`error`的消费者，再启动一个绑定路由`key`为`erro, warning, info`的消费者。

	$ node receive_logs_direct.js info warning error
	[*] Waiting for logs. To exit press CTRL+C

	$ node receive_logs_direct.js error
	[*] Waiting for logs. To exit press CTRL+C

然后我们分别执行，发送`error`级别的消息和`info`级别的消息，在发送`error`级别的消息时，两个消费者都打印出了信息，但是当发送`info`级别的消息时，就只有其中一个打印消息了。

	$ node emit_log_direct.js error "Run. Run. Or it will explode."
	[x] Sent 'error':'Run. Run. Or it will explode.'

	$ node emit_log_direct.js info "Run. Run. Or it will explode."
	[x] Sent 'info':'Run. Run. Or it will explode.'

消费`info warning error`日志的消费者打印信息如下。

	[*] Waiting for logs. To exit press CTRL+C.

	[x] error:'Run. Run. Or it will explode.'
	[x] info:'Run. Run. Or it will explode.

消费`error`日志的消费者，只会打印`error`的消息了。

	[*] Waiting for logs. To exit press CTRL+C.
	[x] error:'Run. Run. Or it will explode.'

##RabbitMQ的RPC远程过程调用
`RabbitMQ`还有另外一项功能，那就是提供类似`RPC`的服务，`RPC`服务英文全称为`Remote Procedure Call`，直接翻译就是`远程过程调用`。通过`RPC`服务	

先建立提供`RPC`服务的`server`端代码，保存为`rpc_server.js`。

	var amqp = require('amqplib/callback_api');
	
	function fib(n) {														(1)
	  var a = 0, b = 1;
	  for (var i=0; i < n; i++) {
	    var c = a + b;
	    a = b; b = c;
	  }
	  return a;
	}
	
	function bail(err, conn) {
	  console.error(err);
	  if (conn) conn.close(function() { process.exit(1); });
	}
	
	function on_connect(err, conn) {
	  if (err !== null) return bail(err);
	
	  process.once('SIGINT', function() { conn.close(); });
	
	  var q = 'rpc_queue';													(2)
	
	  conn.createChannel(function(err, ch) {
	    ch.assertQueue(q, {durable: false});								(3)
	    ch.prefetch(1);														(4)
	    ch.consume(q, reply, {noAck:false}, function(err) {					(5)
	      if (err !== null) return bail(err, conn);
	      console.log(' [x] Awaiting RPC requests');
	    });
	
	    function reply(msg) {												(6)
	      var n = parseInt(msg.content.toString());							(7)
	      console.log(' [.] fib(%d)', n);
	      ch.sendToQueue(msg.properties.replyTo,							(8)
	                     new Buffer(fib(n).toString()),
	                     {correlationId: msg.properties.correlationId});
	      ch.ack(msg);														(9)
	    }
	  });
	}
	
	amqp.connect('amqp://localhost', on_connect);

服务端代码较之前几节还是有明显区别，这里的服务器代码将计算之后的结果返回给了客户端，之前都是未有返回值的。

(1)定义了一个`斐波那契数组`求和的函数，主要靠这个函数来模拟耗时的计算。

(2)定义了队列的名字为`rpc_queue`。

(3)绑定队列`q`，就是绑定了`rpc_queue`队列。

(4)设置公平的调度，因为`RabbitMQ`只会简单的调度。例如一共有2个消费者，`RabbitMQ`只会将奇数的消息推送到消费者A去处理，偶数的消息推送到B去处理，如果万一奇数的消息耗时非常大，那么可能会出现消费者A忙的处理不过来，而消费者B就非常空闲，这显然不符合我们负载均衡的思想。所以执行`ch.prefetch(1)`，这就表示`RabbitMQ`不会往一个繁忙的消费者再推送超过1条新的消息，从生产者推送来的新消息将有空闲的消费者去处理。

(5)定义消费这些数据的方式，注意这里的`{noAck:false}`，我们将无响应设置为`false`，表示这条消息在处理之后将会响应给生产者。

(6)定义`reply`函数，这个函数是说明如何处理收到的消息的。

(7)将接受到的字符串数据转为整数，方便计算`斐波那契数组`的和。

(8)把计算的结果发送会队列，关联`id`就是之前消息的属性`correlationId`。

(9)响应队列，告知消息已经处理完毕。注意这里的`ch.ack(msg)`，如果遗漏了响应队列操作，那么后果可能比较严重，当客户端退出后，消息还是会重复推送给消费者，这样就会造成内存泄漏。我们可以通过如下命令，检查是否存在此问题。

	$ sudo rabbitmqctl list_queues name messages_ready messages_unacknowledged

下面是发起调用`RPC`的客户端代码，保存为`rpc_client.js`。

	var amqp = require('amqplib/callback_api');
	var basename = require('path').basename;
	var uuid = require('node-uuid');											(1)
	
	var n;
	try {																	(2)
	  if (process.argv.length < 3) throw Error('Too few args');
	  n = parseInt(process.argv[2]);
	}
	catch (e) {
	  console.error(e);
	  console.warn('Usage: %s number', basename(process.argv[1]));
	  process.exit(1);
	}
	
	function bail(err, conn) {
	  console.error(err);
	  if (conn) conn.close(function() { process.exit(1); });
	}
	
	function on_connect(err, conn) {
	  if (err !== null) return bail(err);
	  conn.createChannel(function(err, ch) {
	    if (err !== null) return bail(err, conn);
	
	    var correlationId = uuid();											(3)
	    function maybeAnswer(msg) {
	      if (msg.properties.correlationId === correlationId) {				(4)
	        console.log(' [.] Got %d', msg.content.toString());
	      }
	      else return bail(new Error('Unexpected message'), conn);
	      ch.close(function() { conn.close(); });
	    }
	
	    ch.assertQueue('', {exclusive: true}, function(err, ok) {			(5)
	      if (err !== null) return bail(err, conn);
	      var queue = ok.queue;	
	      ch.consume(queue, maybeAnswer, {noAck:true});						(6)
	      console.log(' [x] Requesting fib(%d)', n);
	      ch.sendToQueue('rpc_queue', new Buffer(n.toString()), {			(7)
	        replyTo: queue, correlationId: correlationId
	      });
	    });
	  });
	}
	
	amqp.connect('amqp://localhost', on_connect);

客户端代码较之前多了不少，我们来简单分析一下这些代码。

(1)加载`uuid`包，用来生成一个唯一的不重复字符串用

(2)如果启动参数少于3个，或者第三个启动参数不是数字都会报错，第三个参数就是丢给消费者计算`斐波那契数组`和的数字。

(3)获取`uuid`，并赋值给变量`correlationId`，用来做消息的关联id。

(4)定义`maybeAnswer`函数用作接受消费者的计算结果的响应，如果关联id匹配，则打印结果，如果不匹配就抛出错误。

(5)声明队列操作。

(6)监听并接收这个队列的消费者回复的数据。

(7)往队列中发送数据，并传入关联id和回复队列对象。

同样我们还是先启动消费者，等待消息的推送。

	$ node rpc_server.js
	[*] Waiting for logs. To exit press CTRL+C

	$ node rpc_server.js
	[*] Waiting for logs. To exit press CTRL+C

然后启动生产者，发送几个数字让消费者计算`斐波那契数组`的和。

	$ node rpc_client.js 30
	[x] Requesting fib(30)
	[.] Got 832040

	$ node rpc_client.js 35
	[x] Requesting fib(35)
	[.] Got 9227465

	$ node rpc_client.js 40
	[x] Requesting fib(40)
	[.] Got 102334155

如果发现消费者计算不过来了，可以启动多个进程来增加整个系统的性能，扩展起来非常方便，下面是两个消费者打印的信息。

第一个`rpc_server`打印的信息如下：

	[x] Awaiting RPC requests
	[.] fib(30)
	[.] fib(40)

第二个`rpc_server`打印的信息如下：

	[x] Awaiting RPC requests
	[.] fib(35)

##基于RabbitMQ的Node.js和Python通信实例
如今我们构建整个互联网后端架构，跨语言通信需求非常多，比如原有的系统是用`java`开发的，但是有一些非常适合`Node.js`发挥场景的地方我们又要使用`Node.js`来开发，而这两者之间的通信方法也有多种方法，目前跨语言最流行和轻量级的通信方式就是用`http`的`restful`，数据包的格式协议使用`json`，也可以选择性能更好的`thrift`。

对于`http`协议通信的优点和缺点，本节不做阐述，下一节将会对它进行详细的分析，本节主要介绍如何通过`RabbitMQ`这个媒介，让`Node.js`和`Python`建立起通信的桥梁。

我们还是从最简单的入手，`Node.js`端作为生产者，通过`RabbitMQ`消息队列，发送一个`Hello World`，然后`Python`端作为消费者，打印出这个`Hello World`字符串。

把`Python`作为跨语言通信实例的语言，有几方面考虑。

其一，`Python`是各个`Linux`发行版本都自带的语言，一般`CentOs`或`Ubuntu`都会在系统中预装入`Python`语言，大部分是`2.6.x`或`2.7.x`，所以在`Linux`上运行这个实例就非常简单，不需要安装其他语言环境。

其二，`Python`语言以简洁闻名，就算你没有任何`Python`的基础，凭借其他语言的开发经验，仍然能够很轻松地读懂`Python`，所以如果读者以前没有接触过`Python`也没关系，照着代码大致是能够看懂流程的。

其三，`RabbitMQ`官方提供的示例，默认就是`Python`语言，所以拿`Python`作为实例更贴切不过。

我们先看生产者`Node.js`的代码，套用第一个例子，保存为`send.js`。

	var amqp = require('amqplib/callback_api');
	
	function bail(err, conn) {
	  console.error(err);
	  if (conn) conn.close(function() { process.exit(1); });
	}
	
	function on_connect(err, conn) {
	  if (err !== null) return bail(err);
	
	  var q = 'hello';
	  var msg = 'Hello World!';
	
	  function on_channel_open(err, ch) {
	    if (err !== null) return bail(err, conn);
	    ch.assertQueue(q, {durable: false}, function(err, ok) {
	      if (err !== null) return bail(err, conn);
	      ch.sendToQueue(q, new Buffer(msg));
	      console.log(" [x] Sent '%s'", msg);
	      ch.close(function() { conn.close(); });
	    });
	  }
	
	  conn.createChannel(on_channel_open);
	}
	
	amqp.connect('amqp://localhost', on_connect);

代码再熟悉不过了，接下来看看消费者`Python`的代码，在跑`Python`之前，需要安装`Python`的`RabbitMQ`连接客户端`pika`。我们分别执行如下命令，安装`Python`的`pip`（和`Node.js`中的`Npm`一样是，包管理软件），然后通过`pip`安装`pika`。

	$ wget https://bootstrap.pypa.io/get-pip.py
	$ python get-pip.py
	$ pip install pika
	$ pip list
	iniparse (0.3.1)
	**pika (0.9.14)**
	pip (6.0.8)
	pycurl (7.19.0)
	pygpgme (0.1)
	setuptools (14.0)
	urlgrabber (3.9.1)
	yum-metadata-parser (1.1.2)

现在贴上`Python`端的代码，保存为`receive.py`，然后把它运行起来。

	import pika																(1)

	connection = pika.BlockingConnection(pika.ConnectionParameters(			(2)
	        host='localhost'))
	channel = connection.channel()											(3)
	
	channel.queue_declare(queue='hello')									(4)
	
	print ' [*] Waiting for messages. To exit press CTRL+C'
	
	def callback(ch, method, properties, body):								(5)
	    print " [x] Received %r" % (body,)
	
	channel.basic_consume(callback,											(6)
	                      queue='hello',
	                      no_ack=True)
	
	channel.start_consuming()												(7)

	print 'never print me!'													(8)

(1)引入`pika`包，这个和`Node.js`的`require`功能相同

(2)建立连接，然后返回连接对象。

(3)声明一个频道`channel`，这`Node.js`用法相同。

(4)对这个频道声明队列，对名字和`Node.js`声明的相同，都是`hello`

(5)定义消费的回调函数，这点和`Node.js`定义回调函数也是相似的，只不过`Python`不支持像`Node.js`那样的匿名函数写法，需要定义一个变量。

(6)声明消费。

(7)开始执行消费，这里也是类似事件循环的机制，当有消息推送到达，就会触发消费事件，执行`callback`函数了。

(8)因为第7步进入了事件循环，所以第8步的打印信息永远不会被输出出来。
	
运行脚本和`Node.js`也一样，直接输入如下命令。

	$ python receive.py

启动`Node.js`，向`Python`发送消息。

	$ node send.js
	[x] Sent 'Hello World!'

这时候`Python`端就会收到信息，然后打印出这条消息的内容。

	[*] Waiting for messages. To exit press CTRL+C
	[x] Received 'Hello World!'

通过这个简单的实例，我们可以扩散出很多利用`RabbitMQ`跨语言通信的消息队列，比如带路由的、带消费者响应的队列等等，总之有了`RabbitMQ`跨语言异步通信问题将不再是问题了。

##RabbitMQ方案和Http方案的对比
对于整个后端架构系统，使用`http`协议和`json`格式进行多进程或多服务器通信是非常常用的方式，它最突出的优点就是简单，我将从以下几个方面来说明。

1、通信协议简单。双方开发者都非常熟悉`http`协议，所以对于通信协议方面的事情几乎没有任何障碍，只需要商量和约定数据包`json`格式就可以了。

2、不依赖第三方软件或者库。现在几乎每个热门语言都会把`http`库集成进去，所以使用`http`协议就无需费神找第三方库，也没有因为第三方库的兼容性等问题导致的通信问题。

3、不错的性能。利用`http`协议的`keepalive`可以免去多次重复创建和断开连接的开销，相比传统的`xml`数据协议，`json`包格式更小更紧凑，数据包的大小当然直接影响到整个后端系统的通信性能。

4、`json`格式和`http`协议一样，每个热门语言也都内置了对`json`字符串互转成语言对象的库，这些库通常也都经过严格测试和广泛使用，这比自己商量一种新的数据格式更简单，不易出错。

但是，`http`协议有一个特点，它无法控制请求的频率，比如有这样的场景，通过`http`协议就可能会有问题了。

我们现在有一个抢购活动，每小时只有前100名用户可以拿到某个诱人奖品，这时系统就会在每个整点遭受到大量类似`ddos`攻击的用户请求。我们的前端`web`服务器性能杠杠的，非常出色，但是要保证每小时仅能100个人获得奖品，所以必须保证数据库的操作是原子性的，同时不能有多个插入操作，否则就可能会超出100个人获奖。

这样的需求对于`http`方案可能无法顺利完成任务，就好比千军万马争先抢后地去过独木桥。在这个过程中，可能有人从独木桥上掉下去，也可能一下子好几个人都跑过了独木桥。

这样`RabbitMQ`消息队列就派上用场了，把千军万马排个队，这样大家依次通过这个独木桥，开销和错误就更少。

接下来我们拿数据说话，分别模拟`http`的处理场景和`RabbitMQ`的场景，然后利用压力测试软件查看在各个并发和持续请求的情况下，两种处理方案的性能和稳定性。

我们先看第一种情况，`http`的`restful`方式来处理抢购的场景，出于简单，我们规定只有前`100`名用户才能抢购秒杀到某一种商品。

这里数据库利用`Mongodb`，链接库使用`Mongoose`。`Mongodb`也是大家利用`Node.js`很常用的数据库，因为它的查询语句和返回结果都是`JSON`格式的，对`Node.js`非常友好。程序设计流程如下：

1、利用`count`操作获取订单集合`order`中的记录条数；如果`count`结果小于`100`，则执行`2`，否则执行`3`。

2、当`count`结果小于`100`，那么我们就往`order`集合中插入一条记录，并返回秒杀成功。

3、当`count`结果大于等于`100`，我们就返回用户秒杀失败。

注意：下面的代码并不是秒杀活动的最佳解决方案，也不是性能最优代码，只是为了说明`http`通信方案和`RabbitMQ`通信方案的区别，生产例子中的秒杀服务的设计是根据实际的业务需求而架构的，并没有万能方案。

`Http`方式，设计的各个系统节点的结构如下图：

![](http://7u2pwi.com1.z0.glb.clouddn.com/http_vs_rabbitmq_1.png)	
	
我们先编写使用`http`方式，`web`服务器的代码，保存为`http_web_server.js`。测试时，我们使用的`express`版本为`4.12.2`，`request`版本为`2.53.0`，`mongoose`版本为`3.8.24`，`Node.js`版本为`0.10.32`。

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

执行如下命令，启动`http_web_server.js`。

	$ node http_web_server.js

在`192.168.1.110`服务器上安装`Nginx`，然后配置如下，相关`Nginx`的配置文件如下，在前一章中我们已经对`Nginx`作为`Node.js`的反向代理进行过介绍，如果忘记可以翻回去看下，这里我们重温一下关于`Nginx`反向代理的设置。
	
	#定义启动2个Nginx进程
	worker_processes 2;
	events {
		use epoll;
		#设置最大连接数2048个
	    worker_connections  2048;
	}
	http {
	    include       mime.types;
	    default_type  application/octet-stream;
	    server_names_hash_bucket_size 64;
		access_log off;
	
	    sendfile        on;
	    keepalive_timeout  65;
		
		#定义后台地址，Node.js计算斐波那契数组的服务器监听3000-3002端口
		upstream backend  {
		  server 127.0.0.1:3000;
		}
		
		#反向代理配置
	    server {
	        listen 8000;
	        location / {
	          proxy_pass http://backend;
	          proxy_redirect default;
	          proxy_http_version 1.1;
	          proxy_set_header Upgrade $http_upgrade;
	          proxy_set_header Connection $http_connection;
	          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	          proxy_set_header Host $http_host;
	        }
	    }
	}

启动好`Nginx`之后，我们设计了一个公用的`Mongodb`的数据模型，代码如下，保存为`orderModel.js`。
	
	var mongoose = require('mongoose');
	//定义Mongodb连接字符串
	var connstr = 'mongodb://:@127.0.0.1:27017/http_vs_rabbit';
	//连接池大小
	var poolsize = 50;
	//建立db的连接
	mongoose.connect(connstr,{server:{poolSize:poolsize}});
	
	var Schema = mongoose.Schema;
	
	var obj = { //定义结构
		  userId:{ type:Number, required:true},
		  writeTime: { type: Date, default: function(){return Date.now()} },    //写入时间
	}
	var objSchema = new Schema(obj);
	//count函数
	objSchema.statics.countAll = function (obj,cb) {
	       return this.count(obj||{}, cb);
	}
	//insert函数
	objSchema.statics.insertOneByObj = function (obj,cb) {
	 	   return this.create(obj||{},cb)
	}
	module.exports = mongoose.model('orders', objSchema);

接着，开始编写判断订单数量和生成订单的代码，保存为`http_backend.js`。

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

通过下面命令启动`backend`的`Node.js`服务。

	$ node http_backend.js

我们可以直接访问`Nginx`那台服务器的`8000`端口，查看相应情况，检查`Nginx`的反向代理是否正常工作，正常情况下会出现`hello world, listenPort:3000`的字符串响应。

接下来我们就要对这个`http`的系统架构进行压力测试了，这里我们使用轻量级的压力测试软件`siege`。下载和安装`siege`命令如下，本书编写的时候最新的版本为`3.0.9`，如果下面的地址无法提供下载，大家可以通过`google`自行搜索最新版本的`siege`软件下载地址。

	$ wget http://download.joedog.org/siege/siege-latest.tar.gz
	$ tar -zxvf siege-latest.tar.gz
	$ cd siege-3.0.9/
	$ ./configure
	$ make && make install

Siege命令常用参数

	-c 200 指定并发数200
	-r 5 指定测试的次数5
	-f urls.txt 制定url的文件
	-i internet系统，随机发送url
	-b 请求无需等待 delay=0
	-t 5 持续测试5分钟
	# -r和-t一般不同时使用

现在分别模拟`100`个并发、`300`个并发和`500`个并发发送`Http`请求，并循环发送`10`次，看看在这样的压力负载情况下，系统的处理能力和数据的准确性。

	$ siege -c 100 -r 10 -q http://192.168.1.150:5000/buy

如果在压力测试的时候出现如下错误，执行下面的命令即可：

	$ [fatal] Unable to allocate additional memory.: Cannot allocate memory
	$ ulimit -s unlimited

下表是压力测试的结果，供大家参考，成功率都是100%。`trans/sec`表示系统每秒处理的事物数量，`longest(sec)`表示最长的返回请求时间，单位是秒。测试的服务器3台都是`2cpu`，`4G`内存的`linux x64`云服务器。其中`nginx`和`http_backend_fib.js`在一台服务器上，`http_web_server.js`在一台服务器上，压力测试服务器是另外一台，网络环境都是内网的`1G`交换机。

				trans/sec		longest(sec)		orderCount
	------------------------------------------------------------
	c 100		97.18			3.16				101

	c 300		221				3.99				101

	c 500		212.68			4.8					103


为什么在秒杀订单会有大于`100`个订单呢？我们先暂时把这个疑问搁置一边，开始设计如何利用`RabbitMQ`来处理同样的问题和同样的负荷，系统结构图如下：

![](http://7u2pwi.com1.z0.glb.clouddn.com/http_vs_rabbitmq_2.png)

我们把`RabbitMQ`安装在`backend`服务器上，然后开始编写`web`服务器的代码，保存为`rabbit_web_server.js`。

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

执行如下命令，启动`rabbit_mq_server.js`服务。

	$ node rabbit_mq_server.js

接着编写消费者的代码，同样会去加载公共`orderModel`数据模型文件，保存为`rabbit_backend.js`，代码如下：

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

输入下面的命令，启动消费者实例。

	$ node rabbit_backend.js

然后用同样的压力负荷来测试利用`RabbitMQ`的表现，看看有没有什么特别的发现。把`rabbit_mq_server.js`放在一台服务器上，`RabbitMQ`和`rabbit_backend.js`放在一台服务器，压力测试单独一台服务器，结果如下：

				trans/sec		longest(sec)		orderCount
	------------------------------------------------------------
	c 100		50.95			4.55				100

	c 300		31.05			11.73				100

	c 500		25.72			17.95				100


对比一下`Http`的压力测试结果，我们发现每秒事务处理能力上，`RabbitMQ`是落后于`Http`方案的，也就是说整体系统的吞吐率`RabbitMQ`是不如`Http`的。好吧，我承认确实对`RabbitMQ`的测试结果有点意外，但是考虑到`RabbitMQ`方案，需要先使用队列获取数据再创建队列返回这些数据，所以比无序的`Http`请求性能差许多，也是意料之中。

但是在`orderCount`这一项上，`RabbitMQ`做到了没有偏差，`Http`方案会有所误差，这在某些特殊情况下是不被允许的，所以如果我们的业务是有严格的先后顺序需求，利用`RabbitMQ`消息队列是一个靠谱的选择，虽然牺牲了些性能，但是换来了业务的稳定，而且我们还可以很方便地增加`RabbitMQ`的消费进程，来提高整体系统的吞吐率，同时多种多样的消费者配合路由实用性很高，加上广播、多播或单播让我们在使用上非常灵活。

最后我们来看一下，为什么`Http`方案会出现并发量大，多插入记录的问题。

首先需要明确的是，`Node.js`的所有`I/O`操作都是异步的，也就是说，两次数据库操作是不会阻塞整个进程的。

1、`http_backend.js`在运行时，A请求运行到了`count`检查订单数量处，就向数据库发送一条`count`订单集合记录条数的命令。由于命令是异步的，所以`Node.js`进程发完这条指令，就开始继续接收其他请求，并等待A请求指令的返回。

2、这时B请求被`Node.js`接收了，然后也向数据库发送了一条`count`订单集合记录条数的命令，因为也是异步操作，所以`Node.js`此时就在等待A、B两个请求的回调函数执行。

3、A请求的回调函数执行了，返回结果是`99`，表示还有`1`个库存，于是A请求就像数据库发出了一条插入数据的指令。插入操作同样是异步的，`Node.js`进程继续等待回调。

4、B请求的回调函数紧接着也执行了，由于A请求的插入指令在B请求的`count`指令之后发出的，所以B请求的`count`回调函数返回的结果也是`99`。通过程序判断，B请求也发了一个插入记录的指令给数据库。

5、最后，原本`99`条记录的数据集合，执行了连续A、B两个请求发出的插入指令，最终就变为了`101`条，我们的秒杀就多卖出了一件商品。


##小结
本节介绍了`Node.js`如何使用成熟的消息队列方案`RabbitMQ`，并提供了一个简单的利用消息队列跨语言通信的例子。最后我们对比了`http`通信方式和`RabbitMQ`通信方式的区别和应用场景，可以帮助我们以后开发系统应用，考虑什么时候使用简单的`http`通信，什么时候需要架上`RabbitMQ`了，另外`RabbitMQ`也是可以搭建集群来提供它的稳定性和处理性能的，我们可以在它的官方文档中找到详细搭建集群的方式。

`RabbitMQ`是目前消息队列解决方案中比较成熟稳定的方案，虽然它的性能并不是最好的，但是可靠性已经被大家所认可，所以我们在有合适的使用消息队列的场景情况下，优先还是考虑`RabbitMQ`。

本节最后的一个秒杀示例并不是很好的处理秒杀的方案，因为利用`RabbitMQ`来一条条插入数据库，实际上就是对数据库的表级别的锁，不利于性能。所以我们应该在设计秒杀、抢购这类系统时，利用数据库的行级锁，这样就可以大大地提高处理抢购业务时每秒的下单量。

#参考文献
- <http://blog.iron.io/2012/12/top-10-uses-for-message-queue.html?spref=tw> Top 10 Uses For A Message Queue
- <https://github.com/squaremo/rabbit.js> rabbit.js
- <http://www.ituring.com.cn/article/54547> 在Node.js 中用 Q 实现Promise – Callbacks之外的另一种选择 