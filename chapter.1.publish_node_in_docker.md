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

上面我们执行了2个`docker run`的任务，其实也就创建了2个独立的`Container`，我们通过命令`docker ps -a`就可以列出所有我们创建过的`Container`了，因为版面显示的原因，我做了部分修改，把`COMMAND`改短了。

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

我们可能有这样的需求，应用程序跑在`Container`里，但是日志我们不想记录在里面，因为万一`Image`升级，我们就必须重新执行`docker run`命令，这样日志文件处理就比较麻烦了，而且记录在`Container`文件系统里的日志也不方便我们查看。这时候就需要将主机的文件卷标挂载到`Container`中去了，在`Container`中写入和读取的某个文件目录，其实就是主机的文件，我们通过参数`-v`把主机文件映射到`Container`中。
	
	$ docker run --rm=true -i -t --name=ls-volume -v /etc/:/opt/etc/ centos ls /opt/etc
	boot2docker  hostname     ld.so.conf     passwd-      securetty  sysconfig
	default      hosts        mke2fs.conf    pcmcia       services   sysctl.conf
	fstab        hosts.allow  modprobe.conf  profile      shadow     udev
	group        hosts.deny   motd           profile.d    shadow-    version
	group-       init.d       mtab           protocols    shells
	gshadow      inittab      netconfig      rc.d         skel
	gshadow-     issue        nsswitch.conf  resolv.conf  ssl
	host.conf    ld.so.cache  passwd         rpc          sudoers

参数`-v`后面的冒号左侧部分是本地主机路径，冒号右侧是对应`Container`中的路径，`--rm=true`表示这个`Container`运行结束后自动删除。

如果想要挂载后的文件是只读，需要在这样挂载。

	-v /etc/:/opt/etc/:ro #read only

我们也可以挂载一个已经存在的`Container`中的文件系统，需要用到`--volumes-from`参数，我们先创建一个`Container`，它共享`/etc/`目录给其他`Container`。

	$ sudo docker run -i -t -p 1337:1337 --name=etc_share -v /etc/ centos mkdir /etc/my_share && /bin/sh -c "while true; do echo hello world; sleep 1; done"

参数`-p`表示端口映射，上面的命令将`Container`的1337端口映射到主机的1337端口，对外共享`/etc/`目录，给这个`Conatiner`取名字为`etc_share`。

然后我们启动一个`ls_etc`的`Container`来挂载并打印`etc_share`共享的目录。
	
	$ sudo docker run --rm=true -i -t --volumes-from etc_share --name=ls_etc centos ls /etc
	...	
	my_share       pki             rc0.d           rpc        shells              tmpfiles.d
	...

我们可以看到，这个`ls_etc`这个`Container`打印出来的`/etc`目录是包含我们之前在`etc_share`这个`Container`中创建的目录`my_share`的。	

##将多个Container盒子连接起来
上一节我们学习了如何将主机或者`Container`的文件系统挂载起来，本节我们将学习把各个`Container`连接在一起，发挥`Docker`的魅力。

我现在先下载一个`redis`数据库`Image`，这是使用`Docker`的常规做法，数据库单独用一个`Image`，程序一个`Image`，利用`Docker`的`link`属性将他们连接起来，配合使用。

	$ sudo docker pull redis #下载官方的redis镜像，耐心等待一段时间

接着我们执行命令，启动`redis`镜像的`Container`，开启`redis-server`持久化服务。

	docker run --name redis-server -d redis redis-server --appendonly yes

然后我们再启动一个`redis`镜像的`Container`作为客户端连接我们刚才启动的`redis-server`

	docker run --rm=true -it --link redis-server:redis redis /bin/bash

执行上面的命令后，我们就进入了`Container`内部的`bash`，可以直接在里面执行一些`linux`的命令。

	redis@7441b8880e4e:/data$ env

当前命令行在主机中还是在`Container`中，主要根据`$`符号左侧的用户名来区分，上面的命令将打印系统的环境变量，输出如下。

	REDIS_PORT_6379_TCP_PROTO=tcp
	REDIS_ENV_REDIS_DOWNLOAD_URL=http://download.redis.io/releases/redis-2.8.19.tar.gz
	HOSTNAME=7ff5092b69fa
	REDIS_ENV_REDIS_DOWNLOAD_SHA1=3e362f4770ac2fdbdce58a5aa951c1967e0facc8
	TERM=xterm
	REDIS_DOWNLOAD_URL=http://download.redis.io/releases/redis-2.8.19.tar.gz
	REDIS_NAME=/trusting_mayer/redis
	REDIS_PORT_6379_TCP_ADDR=172.17.0.16
	REDIS_PORT_6379_TCP_PORT=6379
	PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
	PWD=/data
	REDIS_PORT_6379_TCP=tcp://172.17.0.16:6379
	REDIS_PORT=tcp://172.17.0.16:6379
	HOME=/root
	SHLVL=1
	REDIS_VERSION=2.8.19
	REDIS_DOWNLOAD_SHA1=3e362f4770ac2fdbdce58a5aa951c1967e0facc8
	REDIS_ENV_REDIS_VERSION=2.8.19
	_=/usr/bin/env

	$ redis-cli -h "$REDIS_PORT_6379_TCP_ADDR" -p "$REDIS_PORT_6379_TCP_PORT"
	$ 172.17.0.34:6379> set a 1 #成功连入redis数据库服务器
	OK
	$ 172.17.0.34:6379> get a
	"1"

我们成功的利用环境变量连接上了一台给我们提供服务的`redis`数据库`Container`，用同样的方法，我们可以在程序里连接其他数据库，比如`mysql`或者`mongodb`等。

##不要用ssh连接到你的Container盒子
学习了前面几个章节，相信读者已经不算是一个`Docker`新手了，越来越多的情况，会让你想到：“怎么进入到我的`Container`中去呢？”，其他人会告诉他：“ 在你的`Container`里面装一个`ssh server`，这样你就可以连入你的`Container`了。” 但是这是一种糟糕的做法，下面我将告诉大家为什么这么做是错误的，万不得已，我们能用什么方式来替代它。

在`Container`里安装一个`ssh server`是非常诱人的，因为这样我们就可以直接连接`Container`，并且进入它的内部，我们可以使用前面几节学到的端口映射方式，让本地的`ssh`客户端连入`Container`。

所以也不奇怪，人们会建议，在`Container`中创建一个`ssh server`，但是我们在这么做之前需要考虑以下问题。

1、你需要`ssh`来干什么？

大部分需求是，你要检查日志，做备份，或者重启进程，调整配置，查看服务器情况，下面将介绍如果不使用ssh来做到以上这些事情。

2、你如何来管理密钥和密码？

大部分的可能是，你将你的密钥和密码一起装进你的`Image`中，或者将他们放在文件卷中，想一想如果你要更新你的密钥或者密码，你应该怎么做呢？

如果你把它们装载进`Image`中，那你每次更新都需要重新创建`Image`，重新发布`Image`，然后重启`Container`。这样做不是很优雅。

一个更好的办法是将这些东西放在一个文件卷标中，它能工作，但是也有显著的缺点，你必须保证你的`Container`没有对这个文件卷标有写的权限，否则可能会污染你的密钥和密码，从而造成你无法登录这个`Containe`r。而且事情可能因为你为多个`Container`共享这些东西而变的更加难以管理。

3、你如何管理你的密码升级
`SSH server`是非常安全的，但是一旦你的密钥或密码泄漏，你不得不升级所有使用`SSH`的`Container`，并且重启他们。这也可能让`memcache`这样的内存缓存服务器的缓存将全部丢失，你不得不重建缓存。

4、你是否需要加入`SSH server`就能工作？
不是的，你还需要加入进程管理软件，`Monit`或`Supervisor`等监控软件，让应用开启多个进程运行。换而言之，你把一个简单的`Container`转变为一个复杂的东西了。如果你的应用停止了，你不得不从你的进程管理软件那里获得信息，因为`Docker`只能管理单进程。

但是不使用`ssh`，我们改如何做以下事情呢？

1、备份我的数据
你的数据必须是一个`volumn`，这样你可以启动另外一个`Container`，并且通过`--volumes-from`来共享你的应用的`Container`的数据，这个新的`Container`会来处理数据备份的事情。额外的好处，如果只对你的数据文件（比如：日志）进行压缩长久保存，那完全可以在一个新的`Container`中处理，这样你的应用`Container`就是干净的。

2、检查日志
使用文件`volumn`，和之前一样的方法，重新启动一个日志分析的`Container`，让它来处理日志和检查日志。

3、重启我的应用服务
这个问题更容易，我们只需要重启`Container`即可。

4、修改我的配置文件
如果你正在执行一个持久的配置变更，你最好把他的改变放在`Image`中，如果你又启动一个`Container`，那么服务还是使用的老的配置，你的配置变更将丢失。“但是我需要在应用存活期间，改变我的配置，例如增加一个新的虚拟站点”
这样的话还是需要使用`volumn`来处理，这样所有的应用`Container`都可以快速的临时变更配置。

5、调试我的应用
这可能是唯一需要进入`Container`的场景了，这样你就需要`nsenter`软件

下面我就利用类似机器猫的任意门软件`nsenter`,进入到`Container`中去。`nsenter`是一个小的工具，用来进入现有的命名空间，命名空间是什么？他们是container的重要组成部分。简单点说，通过使用`nsenter`你可以进入一个已经存在的`Container`中，尽管这个`Container`没有安装`ssh server`或者其他类似软件。

`nsenter`项目地址：[https://github.com/jpetazzo/nsenter](https://github.com/jpetazzo/nsenter)

我们可以通过命令来安装`nsenter`，这个命令会自己去下载`nsenter`镜像，并且这条命令会把`nsenter`命令安装到主机的`/usr/bin`中，我们就可以很方便的使用它了。

	$ sudo docker run -v /usr/local/bin:/target jpetazzo/nsenter

我们先要找出需要进入的`Container`的`pid`。

	PID=$(docker inspect --format {{.State.Pid}} <container_name_or_ID>)

命令实例：
	
	$ sudo docker inspect --format {{.State.Pid}} 9479
	7026

这里我们得到了`id`为`9479`的`Container`它的`pid`号为7026，这句话有点拗口，其实我们只需关心7026这个`pid`号就可以了。接着我们根据刚才获得的`pid`就能顺利进入到`Container`的内部了。

	$ sudo nsenter --target $PID --mount --uts --ipc --net --pid

这里我们把`$PID`替换为7026即可，命令如下：

	$ sudo nsenter --target 7026 --mount --uts --ipc --net --pid

如果你想要远程访问这个`Container`，可以通过`ssh`链接到你的主机，并且使用`nsenter`连接进入到`Container`，所以大家是不是觉得完全没有必要在`Container`里

如果在`pull`镜像``出现错误，那估计是`CentoOS`内核的版本，所以尽量使用较新的内核版本来启动`Docker`，如出现下面的错误可能就是内核版本过低。
	
	Error pulling image (latest) from jpetazzo/nsenter, Unknown filesystem type on /dev/mapper/...

或者无法进入`Container`的错误，也是因为内核过低，没有正确安装镜像所致。

	nsenter: cannot open /proc/27797/ns/ipc: No such file or directory

如果运行安装`nsenter`时，出现如下错误：

	$ sudo docker run -v /usr/local/bin:/target jpetazzo/nsenter
	Installing nsenter to /target
	cp: cannot create regular file '/target/nsenter': Permission denied
	Installing docker-enter to /target
	cp: cannot create regular file '/target/docker-enter': Permission denied

那就需要手动将`Container`里的`nsenter`命令拷贝到`/usr/local/bin`目录下了，先把`jpetazzo/nsenter`运行起来，然后手动进入文件系统，将命令拷贝出来，其中`containid`就是我们使用`docker ps`查到的`id`，目录`devicemapper`是`centos`下的路径名，在`windows`下是`aufs`。

	cp /var/lib/docker/devicemapper/mnt/<containid>/rootfs/nsenter /usr/local/bin/
	cp /var/lib/docker/devicemapper/mnt/<containid>/rootfs/docker-enter /usr/local/bin/

##配置我的DockerImages镜像和发布应用
我们已经学习到了很多关于`Docker`的知识了，`Docker`之旅也渐渐接近尾声了，本节我们就要简单制作一个`Node.js`的`Express.js`环境的镜像，通过`pm2`来启动我们的`web`应用，然后发布到`Docker`云上；我们还会使用`redis`数据库来暂存用户的访问次数；在`Node.js`应用前端，我们需要放置一个`Nginx`作为反向代理，现在让我们开始吧。

第一步，我们把需要用到的`Image`镜像统统的都下载到本地，执行如下命令，等待片刻就能下载成功了。

	docker pull redis
	docker pull node
	docker pull nginx

执行`docker images`检查一下这些镜像是否都安装完毕，正常会打印出各个镜像列表。

	node                0                   20fbb0b572a2        5 hours ago         705.4 MB
	node                0.10                20fbb0b572a2        5 hours ago         705.4 MB
	node                0.10.36             20fbb0b572a2        5 hours ago         705.4 MB
	node                latest              20fbb0b572a2        5 hours ago         705.4 MB
	redis               latest              5e0586116d76        5 days ago          110.8 MB
	redis               2.8.19              5e0586116d76        5 days ago          110.8 MB
	redis               2                   5e0586116d76        5 days ago          110.8 MB
	redis               2.8                 5e0586116d76        5 days ago          110.8 MB
	nginx               1.7                 90081fa15a0c        5 days ago          91.73 MB
	nginx               1.7.9               90081fa15a0c        5 days ago          91.73 MB
	nginx               latest              90081fa15a0c        5 days ago          91.73 MB
	nginx               1                   90081fa15a0c        5 days ago          91.73 MB
	jpetazzo/nsenter    latest              6ed3da1d7fa6        9 weeks ago         367.7 MB

我们现在本地创建一个一会部署`Node.js`应用的目录，然后写上`package.json`

	$ mkdir /var/node/
	$ mkdir /var/node/docker_node

在创建我们的应用之前，我们从`node 0.10.36`这个镜像上面开始制作自己的镜像，这个镜像只不过比`node 0.10.36`镜像多了一个`pm2`的命令。运行如下命令，进入到`Container`的命令行，然后我们安装`pm2`软件。如果读者对`Node.js`比较熟悉，相信对`pm2`不会陌生，它是`Node.js`进程管理软件，可以方便的重启进程和查看`Node.js`日志。

	$ sudo docker run -i -t node /bin/bash
	#进入Container的bash	
	$ npm install pm2 -g
	$ pm2 -v
	0.12.3
	#从Container的bash退出
	$ exit

这样我们就成功的在`node 0.10.36`这个镜像的基础上安装了`pm2`，然后我们要把这个新的`Container`保存为镜像，这样以后我们要用到带`pm2`的`Node.js`镜像，只需要下载它就可以了。执行命令，进行登录，然后把镜像`push`到云上，非官方不允许直接提交根目录镜像，所以必须以<用户名>/<镜像名>这样的方式提交，比如`doublespout/node_pm2`这样
	
	#查看所有Container，找到刚才的id
	$ sudo docker ps -a
	CONTAINER ID  IMAGE   COMMAND       CREATED         STATUS           PORTS      NAMES
	...
	7a3e85bfaddf  node:0  "/bin/bash"   5 minutes ago   Exited (130)...             goofy_fermi
	...

	#使用docker官网注册的用户名和密码进行登录
	$ sudo docker login
	Username: <Your Docker Account>
	Password: 
	Email:  <Your Email>
	Login Succeeded
	
	#登录成功之后，把Container提交为Images
	$ sudo docker commit 7a3e doublespout/node_pm2
	#然后查看Images列表
	$ sudo docker images node_pm2
	REPOSITORY          TAG                 IMAGE ID            CREATED              VIRTUAL SIZE
	node_pm2            latest              9a418757ae2b        About a minute ago   714.8 MB

	#把镜像提交到云上
	$ sudo docker push doublespout/node_pm2
	
等待片刻后，我们的新的镜像就保存到了`Docker`云上，然后我们把本地的`doublespout/node_pm2`删除，试着从云上下载这个镜像。

	$ sudo docker rmi doublespout/node_pm2
	$ sudo docker images doublespout/node_pm2
	REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
	#发现是空的，然后我们从云上pull

	$ sudo docker pull doublespout/node_pm2
	#稍等片刻即可下载完毕

接下来我们将通过`redis`镜像，启动一个`redis`的`Container`，命令如下：

	docker run --name redis-server -d redis redis-server --appendonly yes

然后我们要准备编写`Node.js`代码，实现这个计数访问应用的功能，在`/var/node/docker_node`目录下创建如下的`package.json`文件，这里对自己的依赖写上版本号是比较稳妥的方式，可以免去因为依赖模块升级，造成应用不稳定的情况，实在有必要升级，可以单独升级某几个依赖测试。

	{
	  "name": "docker_node",
	  "version": "0.0.1",
	  "main": "app.js",
	  "dependencies": {
	       "express":"4.10.2",
	       "redis":"0.12.1",
	       "redis-connection-pool":"0.0.5"
	   },
	  "engines": {
	    "node": ">=0.10.0"
	  }
	}

然后我们创建`app.js`，启动并监听8000端口，同时通过`redis`记录访问次数。

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
			  		res.send(countNum.toString())
		  		})
		  })
	});
	
	app.listen(8000);

我们先启动一个`Container`把依赖装一下，命令如下：

	$ sudo docker run --rm -i -t -v /var/node/docker_node:/var/node/docker_node -w /var/node/docker_node/ doublespout/node_pm2 npm install

屏幕会打印依赖安装的过程，等所有`Node.js`的包安装完成后，这个`Container`会自动退出，然后我们进入`/var/node/docker_node/`目录，就可以看到`node_modules`文件夹，说明我们的依赖包安装完毕了。

代码开发完毕，基于刚才我们提交的`doublespout/node_pm2`镜像，我们要启动一个运行这个程序的`Container`，要求这个`Container`有端口映射，文件挂载，并同时加载`redis`的那个`Container`，命令如下：
	
	#挂载pm2的日志输出
	$ mkdir /var/log/pm2
	#使用pm2启动app应用，但是会有问题哦
	$ sudo docker run -d --name "nodeCountAccess" -p 8000:8000 -v /var/node/docker_node:/var/node/docker_node -v /var/log/pm2:/root/.pm2/logs/ --link redis-server:redis -w /var/node/docker_node/  doublespout/node_pm2 pm2 start app.js

但是当我们执行`docker ps`后发现这个`Container`并没有启动，这是什么原因呢？因为我们利用`pm2`的守护进程方式启动了应用，所以`Container`会认为进程已经运行结束了，所以自己退出了，这时候我们需要让`pm2`以非守护进程的方式运行在`Container`里就可以了，我们的命令要做一些更改。

	$ sudo docker run -d --name "nodeCountAccess" -p 8000:8000 -v /var/node/docker_node:/var/node/docker_node -v /var/log/pm2:/root/.pm2/logs/ --link redis-server:redis -w /var/node/docker_node/  doublespout/node_pm2 pm2 start --no-daemon app.js

这时候我们再执行`docker ps`，就可以看到`nodeCountAccess`这个名字的`Container`在运行了，使用浏览器打开主机的8000端口，也能看到访问的计数次数，接下来就轮到作为反向代理的`Nginx`出场了。

	





如果遇到在`Container`里无法解析域名，则需要手动增加`dns`服务器，方法如下：

	DOCKER_OPTS=" --dns 8.8.8.8"
	service docker restart




##什么是Jenkins


##通过Docker安装和启动Jenkins


##配置Jenkins，自动化部署Node.js项目


##小结


#参考文献
- <https://www.docker.com/whatisdocker> what is docker
- <http://www.cbinews.com/software/news/2015-01-20/228094.htm> 2015：Docker将走向深入应用
- <http://blog.docker.com/2014/06/why-you-dont-need-to-run-sshd-in-docker/> why you dont need to run sshd in docker
- <http://jpetazzo.github.io/2014/06/23/docker-ssh-considered-evil/> docker ssh considered evil
