#基于RabbitMQ搭建跨语言通信队列
##前言
本章将主要介绍利用高性能队列软件`RabbitMQ`，解决web服务器或应用服务器间跨语言通信。通常我们对处理大并发，随之带来的CPU或I/O密集型问题最好的控制就是使用消息队列，对于服务器间跨语言通信以前我们一般使用`XMLRPC`，现在比较流行走`http`协议的`restful`方式，本章将介绍使用`RabbitMQ`来处理这部分事情，看它是如何高效、简单的完成任务的。

在学习本章之前，读者需要对`Linux`基本命令行操作、`Express`框架、`python`语言有简单了解。

##什么是消息队列，消息队列的优势
队列大家肯定都不会陌生，去`KFC`排队就餐，去银行取号排队办理业务，等等这些都是我们在现实生活中遇到的当并发人流过多时，用队列的方式解决抢占资源的办法，其实这个方式同样适用于我们互联网领域。

设想下，如果同时上千个客户端要求处理某件事情，没有队列，我们的CPU就会像`KFC`服务员那样，给A配了一个汉堡，接着切换到B，给B再配一杯可乐……，然后CPU就因为频繁的这样切换任务导致执行效率低下，前面的客户端还没来得及处理，后面的又上来了，最终将会造成大量的连接出现超时错误。

大家理解了队列的概念后，我们就要解释下消息了，“消息”是在两台计算机间传送的数据单位。消息可以非常简单，例如只包含文本字符串；也可以更复杂，可能包含嵌入对象（比如`xml`或`json`）。消息大家可以理解为去`KFC`点餐的菜单，告诉服务员你想要什么东西。

那么消息队列应用在我们的服务器通信中，它有什么优势呢？我们为什么要选择消息队列呢？

1、应用解耦

在项目启动之初来预测将来项目会碰到什么需求，是极其困难的。消息队列在处理过程中间插入了一个隐含的、基于数据的接口层，两边的处理过程都要实现这一接口。这允许你独立的扩展或修改两边的处理过程，只要确保它们遵守同样的接口约束。

2、冗余存储

有时在处理数据的时候处理过程会失败。除非数据被持久化，否则将永远丢失。消息队列把数据进行持久化直到它们已经被完全处理，通过这一方式规避了数据丢失风险。在被许多消息队列所采用的"插入-获取-删除"范式中，在把一个消息从队列中删除之前，需要你的处理过程明确的指出该消息已经被处理完毕，确保你的数据被安全的保存直到你使用完毕。

3、可扩展性

因为消息队列解耦了你的处理过程，所以增大消息入队和处理的频率是很容易的；只要另外增加处理过程即可。不需要改变代码、不需要调节参数。扩展就像调大电力按钮一样简单。

4、灵活性 & 峰值处理能力

当你的应用上了Hacker News的首页，你将发现访问流量攀升到一个不同寻常的水平。在访问量剧增的情况下，你的应用仍然需要继续发挥作用，但是这样的突发流量并不常见；如果为以能处理这类峰值访问为标准来投入资源随时待命无疑是巨大的浪费。使用消息队列能够使关键组件顶住增长的访问压力，而不是因为超出负荷的请求而完全崩溃。请查看我们关于峰值处理能力的博客文章了解更多此方面的信息。

5、可恢复性

当体系的一部分组件失效，不会影响到整个系统。消息队列降低了进程间的耦合度，所以即使一个处理消息的进程挂掉，加入队列中的消息仍然可以在系统恢复后被处理。而这种允许重试或者延后处理请求的能力通常是造就一个略感不便的用户和一个沮丧透顶的用户之间的区别。

6、送达保证

消息队列提供的冗余机制保证了消息能被实际的处理，只要一个进程读取了该队列即可。在此基础上，IronMQ提供了一个"只送达一次"保证。无论有多少进程在从队列中领取数据，每一个消息只能被处理一次。这之所以成为可能，是因为获取一个消息只是"预定"了这个消息，暂时把它移出了队列。除非客户端明确的表示已经处理完了这个消息，否则这个消息会被放回队列中去，在一段可配置的时间之后可再次被处理。

7、排序保证

在许多情况下，数据处理的顺序都很重要。消息队列本来就是排序的，并且能保证数据会按照特定的顺序来处理。IronMO保证消息浆糊通过FIFO（先进先出）的顺序来处理，因此消息在队列中的位置就是从队列中检索他们的位置。

8、缓冲

在任何重要的系统中，都会有需要不同的处理时间的元素。例如,加载一张图片比应用过滤器花费更少的时间。消息队列通过一个缓冲层来帮助任务最高效率的执行--写入队列的处理会尽可能的快速，而不受从队列读的预备处理的约束。该缓冲有助于控制和优化数据流经过系统的速度。

9、理解数据流

在一个分布式系统里，要得到一个关于用户操作会用多长时间及其原因的总体印象，是个巨大的挑战。消息系列通过消息被处理的频率，来方便的辅助确定那些表现不佳的处理过程或领域，这些地方的数据流都不够优化。

10、异步通信

很多时候，你不想也不需要立即处理消息。消息队列提供了异步处理机制，允许你把一个消息放入队列，但并不立即处理它。你想向队列中放入多少消息就放多少，然后在你乐意的时候再去处理它们。

我们相信上述十个原因，使得消息队列成为在进程或应用之间进行通信的最好形式。我们已经花费了一年时间来创建和学习IronMQ，我们的客户也通过消息队列完成了许多不可思议的事情。队列是创建强大的分布式应用的关键，它可以利用云技术所提供的所有强大能量。

##安装和启动RabbitMQ
`RabbitMQ`就是诸多消息队列产品中的一款，虽然它不是速度性能最快的，但它却是应用广泛，相当稳定的一款消息队列产品，而且由于`RabbitMQ`是由`erlang`语言开发的，所以具有天生的分布式优势，这些都是我推荐`RabbitMQ`部署在生产环境的原因，官网对`RabbitMQ`的定义非常简单。

1、为应用而生的强大的消息队列

2、使用简单

3、跨平台支持

4、支持大量的开发平台和语言

5、开源和社区支持（言下之意就是免费哦~）

关于各操作系统下载和启动的方式，官网有比较详细的文档，我这里就不再累述了，访问地址：[http://www.rabbitmq.com/download.html](http://www.rabbitmq.com/download.html "http://www.rabbitmq.com/download.html")，这里我主要介绍下使用上一章的`Docker`来安装和启动它，手握利器也要加以善用。
	
	#到截稿时，最新版本是3.4.3
	$ sudo docker pull rabbitmq
	#启动rabbitmq服务
	$ docker run -d -e RABBITMQ_NODENAME=my-rabbit --name some-rabbit -p 5672:5672 rabbitmq:3

是不是用了`Docker`我们就可以更加专心和专注的开发业务代码了，而不用为了装环境而浪费一天。下面几个小节，我们将学习`RabbitMQ`的各种队列，对我们的日常开发很有帮助。

##RabbitMQ的Hello World
要连接`RabbitMQ`我们需要安装连接包，我们依次执行命令，创建环境，这里我没使用官方推荐的`npm`包`amqp.node`。
	
	$ mkdir /var/node
	$ mkdir /var/node/rabbit_hello
	$ cd /var/node
	$ npm install amqplib

然我们写一个`hello world`的示例的服务器不分，并把它保存在`/var/node/rabbit_hello/server.js`。

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

下面我们来解释下这些代码的流程。在解释上述代码之前，我们需要简单解释一下`then`方法，它是`Node.js`用来处理异步回调的方法之一，一般我们处理`Node.js`异步回调嵌套的方法有两种，`Promise`和`async`，我们这次用的`amqplib`包处理异步就是使用的`Promise`方式。

那`Promise`究竟是什么呢？`Promise`是对异步编程的一种抽象。它是一个代理对象，代表一个必须进行异步处理的函数返回的值或抛出的异常。`callback`是编写`Node.js`异步代码最最最简单的机制。可用这种原始的`callback`必须以牺牲控制流、异常处理和函数语义为代价，而我们在同步代码中已经习惯了它们的存在，不适应！`Promises`能带它们回来。

`Promises`对象的核心部件是它的`then`方法。我们可以用这个方法从异步操作中得到返回值（传说中的履约值），或抛出的异常（传说中的拒绝的理由）。`then`方法有两个可选的参数，都是`callback`函数，分别是`onFulfilled`和`onRejected`，用代码说话。

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

使用`Promise`最显著的特性就是我们不必对嵌套的所有异常都做显式的处理，我们看下面的为代码。

	doThisAsync()
  	.then(doThatAsync)
	.then(doanotherAsync)
  	.then(null, console.error)

上述`doThisAsync`，`doThatAsync`或`doanotherAsync`异步中的任何一个错误，都回被最后的`then`语句捕获，并作处理。

现在我们回到代码，代码(1)处表示我们连接本地`127.0.0.1`的`RabbitMQ`队列，并返回一个`Promise`对象。

代码(2)，表示接受`CTRL+C`的退出信号时我们关闭和`RabbitMQ`的链接`conn.close();`。

代码(3)，`conn.createChannel()`表示创建一个通道，然后代码(4)，我们通过`ch.assertQueue`在这个通道上监听`hello`这个队列，并设置队列持久化为`false`，最后返回一个`Promise`对象。

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

代码(2)，用`when(x)`包装一个`Promise`对象，任然返回一个`Promise`对象，这边我们创建一个通道。

代码(3)，同样我们把通道绑定到`hello`队列，并且持久化设定为`false`。

代码(4)，我们向这个队列发送`Buffer`，内容为`'Hello World!'`，发送完毕之后关闭通道。

代码(5)，在通道关闭之后，我们把整个链接也关闭，`ensure`就类似执行扫尾工作的函数，是`promise.finally`的别名。

接着我们进入命令行，执行如下命令启动消息队列服务器。

	$ node server.js
	[*] Waiting for messages. To exit press CTRL+C

然后我们启动客户端，发送消息给服务器。

	$ node client.js
	[x] Sent 'Hello World!'

客户端消息发送完毕后，自动退出了，这时候切换到服务器的`ssh`窗口，我们看到服务器这边也打印出了客户端发送过来的数据。

	[*] Waiting for messages. To exit press CTRL+C
	[x] Received 'Hello World!'

一个简单的`RabbitMQ`的例子我们就跑起来了，接下来我们要分别学习下几种不一样的队列样式，这些队列在日常开发中都非常有用。

##RabbitMQ的工作队列


##RabbitMQ的PUB/SUB队列


##RabbitMQ的队列路由


##RabbitMQ的RPC远程过程调用

	
##基于RabbitMQ的Node.js和Python通信实例


##RabbitMQ方案和Http方案的对比


##小结


#参考文献
- <http://blog.iron.io/2012/12/top-10-uses-for-message-queue.html?spref=tw> Top 10 Uses For A Message Queue
- <https://github.com/squaremo/rabbit.js> rabbit.js
- <http://www.ituring.com.cn/article/54547> 在Node.js 中用 Q 实现Promise – Callbacks之外的另一种选择 