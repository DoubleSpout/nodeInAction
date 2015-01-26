#通过Docker快速发布Node.js应用
##前言
本章将主要介绍如何利用`Docker`容器快速发布一个`Nginx`+`Express`+`Mongodb`的项目，然后使用`Jenkins`进行简单的持续集成发布的工作。本章会介绍`Docker`的基础概念和用法和`Jenkins`的安装配置，`Node.js`配合`Docker`和`Jenkins`可以更加方便的管理我们的应用。

在学习本章之前，读者需要对`Linux`基本命令行操作、`Nginx`简单配置、`Express`框架、`Mongodb`和`Mongoose`模块有所了解。

##什么是Docker
Docker自2013年首次进入业界眼帘，受到广泛关注则是在2014年下半年。Docker 1.0自2014年6月份首次公布后，人气在短短几个月内便一路飙升。红帽在新的RHEL 7版本中增添了支持Docker的功能，IBM公开拥抱Docker和容器，亚马逊推出了EC2容器服务，就连公认的竞争对手VMware也宣布支持Docker。

去年8月份，于美国芝加哥举办的 CloudOpen 大会上，Linux.com 和 The New Stack 公布了一项由550名从业者参与的调查结果。在最受欢迎的开源云项目评选上，Docker居于第二位置，第一位是Openstack。

对于2015年的到来，业界人士认为，Docker技术将不会停留于“热度”层面，而将会深入的走向部署和应用。而此也将会进一步激发不同开源技术与平台间的碰撞和整合，最终推动开源及容器技术的向前发展。在中国，则会有更多的云厂商宣布对Docker容器的支持。

那么Docker到底是什么？我们怎么定义这个开源界的新宠呢？

在Docker官网的定义为：

Docker是一个为开发者和运维管理员搭建的一个开放平台，可以在这个平台上创建，管理和运行生产应用。Docker引擎是一个便携式的，轻量级运行时和打包工具，Docker Hub是一个云端的服务，可以用它共享应用或自动化工作流。Docker能够从组件快速的开发应用，并且可以轻松的创建开发环境、测试环境和生产环境。

通俗点说，Docker 是一个开源的应用容器引擎，可以让开发者打包自己的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。Docker容器完全使用沙箱机制，独立于硬件、语言、框架、打包系统，相互之间不会有任何接口。几乎没有性能开销,可以很容易地在机器和数据中心中运行。最重要的是,他们不依赖于任何语言、框架或包括系统。

Docker的主要优势包括几个方面。比如作为一名开发者，在自己电脑上开发应用程序时一切都运行正常，但如果将其部署到其他环境中就不能正常工作。由于开发者使用了自己喜欢的栈、开发语言和版本，当把它们部署到新的环境如测试环境或生产环境时就会出现问题。这时，运维工程师和开发者之间需要花费大量时间、精力、财力通过进行大量沟通才能达成一致。但如果使用Docker进行开发，则可以将所有一切封装到一个或者几个可相互通讯的容器中，而这个容器自身就可以完成所有工作。之后开发者只需将该容器部署到其它环境中即可。

其次，相对于虚拟机，由于Docker容器不必运行操作系统，所以其体积更小。底层的Linux容器已经被包含在内核当中。这意味着镜像体积非常小，非常快。如果虚拟机的体积以GB为单位，需要一到两分钟的启动时间，那么容器就只需以MB为单位，并且可以在几毫秒内启动。这可以帮助加速开发进度，允许开发者可以轻松地移动容器。

此外，由于容器体积小，可以快速部署，所以有助于开发者进行超大规模部署。相对于虚拟机，开发者可以使用更少的存储空间、内存和CPU，因为其在性能方面基本上不需要系统开销。


##Nginx作为Node.js前端WebServer的作用
在开始`Docker`之旅前，我们想先说明一下，把Nginx放置在Node.js前端的作用，因为后面的章节联系性都比较强，我实在想不到有更好的地方插入本节。Nginx想必大家都不会陌生，不过在这里我还是不厌其烦的再为大家介绍一下它。

Nginx（发音同engine x）是一款由俄罗斯程序员Igor Sysoev所开发轻量级的网页服务器、反向代理服务器以及电子邮件（IMAP/POP3）代理服务器。起初是供俄国大型的门户网站及搜索引擎Rambler（俄语：Рамблер）使用。其将源代码以类BSD许可证的形式发布，因它的稳定性、丰富的功能集、示例配置文件和低系统资源的消耗而闻名。此软件BSD-like协议下发行，可以在UNIX、GNU/Linux、BSD、Mac OS X、Solaris，以及Microsoft Windows等操作系统中运行。

我们在这里正是看重了Nginx出色的`Http`反向代理能力，所以才把它放置在Node.js前端，用来处理我们的各种需求。可能有读者不理解反向代理这个名词，我们在这里稍作解释。有反向代理就肯定有正向代理，正向代理我们接触的很多，比如我们想访问一些国外的网站，可是又由于某些原因无法正常打开或者打开缓慢，这时候我们通过香港的`Http`代理就可以正常的访问一些国外的网站了，在这里香港的这个`Http`代理就是正向代理。反向代理的情况正好相反，比如我们有一个对外的api服务`api.nodeAction.com`，初期我们启动一台服务器一个`Node.js`进程就可以完成负载，但是后期可能访问量的加大，发现一个进程，一台服务器已经不能满足我们的需要了，而且我们对外的地址以及路径又不能改变，毕竟已经很多用户在使用了，这时候`Nginx`就可以发挥自己反向代理的能力，可以在`Nginx`后端添加多个服务器或启动多个进程来分担访问压力了。在这里，`Nginx`的作用就是反向代理了。

理解了`Nginx`的反向代理，我们就要说明为什么把它放在`Node.js`的应用之前了，大致有如下几个好处：

1、静态文件性能

`Node.js`的静态文件处理性能受制于它的单线程异步`I/O`的模型，注定了静态文件性能不会很好（所以某些情况下，单线程异步`I/O`并不是性能的代名词）。在一台普通的4CPU服务器上，使用Nginx处理静态文件的性能基本上是纯`Node.js`的2倍以上，所以我们避免在生产环境下，直接使用`Node.js`来处理静态文件。关于`Node.js`处理静态文件更多内容，在我另一本`《Node.js实战》`书中有详细对比和介绍，欢迎读者购买阅读。

2、反向代理规则

有时候会存在方向代理的服务器配置不同的情况，我们希望配置较好的机器能够分担更多的压力；有时因为session的关系，我们需要将同一来源IP的客户端总是转发到同一个进程上，等等这些规则，使用`Nginx`通过配置文件，就可以很简单的去实现这些。

3、扩展性

`Nginx`可以加入许多扩展，帮助我们处理业务。最典型的就是加入`Lua`语言的扩展，通过胶水语言`Lua`，对`Nginx`赋予了复杂逻辑判断的能力，同时还保持着一贯的高效。比如我们的api服务，对访问会进行`md5`签名或对同一客户端来源有访问频率限制，这部分代码是后端业务处理前必须通过的验证，具有卡口作用。利用`Lua`扩展，我们就可以高效的，简单的完成这个卡口。

4、稳定性和转发性能

`Nginx`的稳定性有目共睹，同样负载下，相比`Node.js`占用的CPU和内存资源更少，同时高效的转发新能，方便的转发配置都是我们选择它作为反向代理的原因之一，比如我们可以根据不同的`url`请求路径转发到不同的后端机器上，也可以设定超时时间，`keepalive`等，方便管理。

5、安全性

`Nginx`已经被各大互联网公司广泛应用，经过一些配置就可以有效抵挡类似`slowloris`等的`DoS`，而`Node.js`在这方面做的还不够，关于`Node.js`开发安全方面的更多内容，可以参考我的另一本`《Node.js实战》`一书，专门有一个章节来讨论如何更安全的开发`Node.js`的`web`应用。

6、运维管理

可能我们目前限于资金或者资源的原因，只有一台`web`服务器，同时有多个站点需要占用`80`端口，这时我们只需要让`Node.js`服务监听本地的特殊端口，例如`3000`,通过`Nginx`的反向代理配置，就可以完成多个站点域名指向一台机器的需求了。当然，如果公司配置了专门的运维部门来管理服务器，相信他们对`Nginx`的熟悉程度肯定远远大于`Node.js`，修改一些配置他们自己就可以轻松搞定了，而不用来麻烦我们。

所以，一个好习惯就是，在生产环境中，永远把`Nginx`放置在`Node.js`的前端，对性能，安全性和将来的扩展性都有益处。

##安装Docker和下载Images镜像
`Nginx`插曲之后，继续我们的`Docker`之旅，在Docker官网有详细的各个系统安装流程，我们这里就介绍下`CentOS`下的安装，其他系统安装地址详见：[https://docs.docker.com/](https://docs.docker.com/)

对于在`CentOS 7`下的用户，我们就非常简单，直接运行如下命令，就可以安装最新版本的`Docker`

	$ sudo yum install docker

对于在`CentOS 6.5`下的用户就稍微麻烦点，先获取`epel`源，并导入。

	$ wget -c http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
	$ rpm -ivh epel-release-6-8.noarch.rpm
	$ rpm –import /etc/pki/rpm-gpg/RPM-GPG-KEY-EPEL-6

通过`yum`安装`Docker`。

	$ yum install docker-io --enablerepo=epel

启动`Docker`服务，并且把`Docker`服务开机启动。

	$ sudo service docker start
	$ sudo chkconfig docker on

`Docker`服务已经安装并启动了，我们需要下载`Image`镜像，镜像就是我们应用运行的环境，比如我们可以自己装好`Node.js`和`npm`然后发布到`Docker Hub`上，供自己或者别人下载，我们也可以下载安装一些官方的镜像，把它作为自己镜像的基础，下面我们先下载`CentOS`镜像。

	$ sudo docker pull centos

等待片刻后，就可以下载完毕了，执行命令查看镜像是否安装成功。

	$ sudo docker images centos
	REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
	centos              centos7             8efe422e6104        2 weeks ago         224 MB
	centos              latest              8efe422e6104        2 weeks ago         224 MB
	centos              7                   8efe422e6104        2 weeks ago         224 MB

我们可以去`Docker`官网搜索我们需要的一些镜像，可以根据下载次数，推荐的次数来排序搜索结果，访问地址：[https://registry.hub.docker.com/](https://registry.hub.docker.com/)

![](http://7u2pwi.com1.z0.glb.clouddn.com/dockerBrowser.png)

上图是在`Docker`官网里进行搜索`Node.js`关键字的结果列表，我们可以看到被人赞星星的次数和下载次数，两者分数越高，说明这个镜像越值得信赖。
	
##Docker常用命令
在我们深入`Docker`学习之前，先罗列一些`Docker`的常用命令，我们将在本节中进行简单的说明介绍，详细的命令相关说明执行如下命令，就可以获取帮助。

	$ docker -h

1、获取镜像。
	
	$ sudo docker pull NAME[:TAG]

命令示例：

	$ sudo docker pull centos:latest 

2、启动`Container`盒子。
	
	$ sudo docker run [OPTIONS] IMAGE [COMMAND] [ARG...] 

一个简单的启动`Container`盒子的示例：
	
	$ sudo docker run -t -i centos:latest /bin/bash

启动`Container`盒子非常重要的命令，我们会在下一节详细介绍`Container`盒子及启动命令

3、查看镜像列表，会把本地所有的`images`列出。

	$ sudo docker images [OPTIONS] [NAME]

命令示例：

	$ sudo docker images centos

4、查看容器列表，可以看到所有我们创建过的`Container`。

	$ sudo docker ps [OPTIONS] 

命令示例：
	
	$ sudo docker ps -a

5、删除镜像，从本地删除一个已经下载的镜像。

	$ sudo docker rmi IMAGE [IMAGE...] 

命令示例：

	$ sudo docker rmi centos:latest

6、移除一个或多个容器实例。

	$ sudo docker rm [OPTIONS] CONTAINER [CONTAINER...]

命令示例，移除所有未运行的容器: 

	$ sudo docker rm sudo docker ps -aq

7、停止一个正在运行的容器。

	$ sudo docker kill [OPTIONS] CONTAINER [CONTAINER...]

命令示例：
	
	$ sudo docker kill 026e

8、重启一个正在运行的容器。

	$ sudo docker restart [OPTIONS] CONTAINER [CONTAINER...]

命令示例：
	
	$ sudo docker restart 026e

9、启动一个已经停止的容器。

	$ sudo docker start [OPTIONS] CONTAINER [CONTAINER...]

命令示例：
	
	$ sudo docker start 026e
	
基本上常用的命令就是这些，读者第一次阅读可以对它们有初略的了解，下面几节会对以上命令做一些详细的介绍。

一般我们会去`Docker`官网上搜索我们需要的镜像，然后通过`docker pull`命令下载到本地，执行`docker run`启动一个容器。下一节我们将详细介绍关于`Docker`的精髓，`Container`。

##启动Container盒子
看了上一节那些眼花缭乱的命令，再加上又是`Image`又是`Container`的，读者们是不是觉得很头晕，既然下载了`Image`为什么又会多一个`Container`了呢？在`Docker`世界里，它们之间的关系又是什么样子的呢？

接下来我们简单说明一下`Image`和`Container`的关系，`Image`顾名思义就是镜像的意思，我们可以把它理解为一个执行环境（env），当我们执行了`docker run`命令之后，`Dock`就会根据当前的`Image`创建一个新的`Container`，`Container`更像是一个程序运行的沙箱，它们互相独立，但是都是运行在`Image`创建的执行环境之上。

接下来我们就启动一段小程序，基于我们刚才下载的`CentOS`镜像，我们启动一个`Container`，让控制输出一个`hello world`。
	
	$ sudo docker run b15 /bin/echo 'Hello world'
	Hello world

其中`b15`是我们之前下载的镜像的`id`，在`Docker`中`id`不必输全，只要保证输入的`id`号前几位能让`Docker`找到唯一的`Image`或`Container`就可以了，这同样适用于删除操作。

现在我们尝试启动一个稍微复杂一点的`Container`，每秒钟打印一个`Hello World`。

	$ sudo docker run  -i -t b15 /bin/sh -c "while true; do echo hello world; sleep 1; done" 
	Hello world
	Hello world
	Hello world
	Hello world
	Hello world
	...

命令中的参数，其中`-i`表示同步`Container`的`stdin`，`-t`表示同步`Container`的输出。

上面我们执行了2个`docker run`的任务，其实也就创建了2个独立的`Container`，我们通过命令`docker ps -a`就可以列出所有我们创建过的`Container`了，显示因为版面的原因，做了些修改

	CONTAINER ID   IMAGE     COMMAND  CREATED     STATUS        PORTS        NAMES
	026ec6c8802c   centos:7  ...      4 minutes   Up 4 minutes               focused_bartik 
	cc5105d4e6f5   centos:7  ...      4 minutes   Exited (0) 10 minutes ago  determined_pare    

我们看到`026ec6c8802c`这个每隔一秒打印`Hello World`的`Container`4分钟前创建，并且一直在运行，已经运行了4分钟了，另外一个`cc5105d4e6f5`就是一次性打印`Hello World`的`Container`已经退出了。
	
由于那个每隔一秒执行的`Container`永远不会停止，我们现在需要手动把它删除，只需要在删除`Container`时加上强行的参数`-f`即可。

	$ sudo docker rm -f 026
	026

对于`Container`的其他停止，重启和启动的操作命令，读者请参考上一节的内容。
	
##文件卷标加载
上一节我们学习了`Container`的基本概念，并启动了几个输出`Hello World`的例子，初步理解了`Container`的朋友，可能会把`Docker`的`Container`理解为已给虚拟机，虽然这并不完全正确，但是在本节我不会去纠正他，这样理解对我们深入学习`Docker`是有所帮助的，在接下来的一节，会专门针对这个问题进行讨论。







##将多个Container盒子连接起来


##不要用ssh连接到你的Container盒子


##配置我的DockerImages镜像和发布


##什么是Jenkins


##通过Docker安装和启动Jenkins


##配置Jenkins，自动化部署Node.js项目


##小结


#参考文献
- <https://www.docker.com/whatisdocker> what is docker
- <http://www.cbinews.com/software/news/2015-01-20/228094.htm> 2015：Docker将走向深入应用
