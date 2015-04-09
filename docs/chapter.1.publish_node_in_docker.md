#通过Docker快速发布Node.js应用
##前言
本章将主要介绍如何利用`Docker`容器快速发布一个`Nginx`+`Express`+`Redis`的项目，然后使用`Jenkins`进行简单的持续集成发布工作。本章将介绍`Docker`的基础概念、用法和`Jenkins`的安装配置，`Node.js`配合`Docker`和`Jenkins`，可以更加方便地管理我们的应用。

在学习本章之前，读者需要对`Linux`基本命令行操作、`Nginx`简单配置、`Express`框架、`redis`有所了解。

##什么是Docker
`Docker`在2013年首次进入业界眼帘，受到广泛关注则是在2014下半年。`Docker1.0`自2014年6月公布后短短的几个月内，人气便一路飙升。红帽在新的`RHEL 7`版本中增添了支持`Docker`的功能，`IBM`公开拥抱`Docker`和容器，亚马逊推出了`EC2`容器服务，就连公认的竞争对手`VMware`也宣布支持`Docker`。

2014年8月份，于美国芝加哥举办的`CloudOpen`大会上，`Linux.com`和`The New Stack`公布了一项由550名从业者参与的调查结果。在最受欢迎的开源云项目评选上，`Docker`位于第二，第一位是`Openstack`。

对于2015年的到来，业界人士认为，`Docker`技术将不会停留于“热度”层面，而会深入地走向部署和应用。因此也将会进一步激发不同开源技术与平台间的碰撞和整合，最终推动开源及容器技术的向前发展。在中国，将会有更多的云厂商宣布对`Docker`容器的支持。

那么`Docker`到底是什么？我们怎么定义这个开源界的新宠呢？

在`Docker`官网的定义如下。

`Docker`是一个为开发者和运维管理员搭建的开放平台软件，可以在这个平台上创建、管理和运行生产应用。`Docker Hub`是一个云端的服务，可以用它共享应用或自动化工作流。`Docker`能够从组件快速的开发应用，并且可以轻松地创建开发环境、测试环境和生产环境。

通俗点说，`Docker`是一个开源的应用容器引擎，可以让开发者打包自己的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的`Linux`机器上，也可以实现虚拟化。`Docker`容器完全使用沙箱机制，独立于硬件、语言、框架、打包系统，相互之间不会有任何接口。几乎没有任何性能开销，便可以很容易的在机器和数据中心中运行。最重要的是,他们不依赖于任何语言、框架或包括系统。

比如，作为一名开发者，在自己电脑上开发应用程序时，一切都运行正常，但如果将其部署到其他环境中就可能不能正常工作了。由于开发者使用了自己喜欢的栈、开发语言和版本，所以当把它们部署到新的环境，如测试环境或生产环境时就会出现问题。这时，运维工程师和开发者需要花费大量时间、精力、财力，通过进行大量沟通才能达成一致。但如果使用`Docker`进行开发，则可以将所有一切封装到一个或者几个可相互通讯的容器中，而这个容器自身就可以完成所有工作。之后，开发者只需将该容器部署到其它环境中即可。

其次，相对于虚拟机，由于`Docker`容器不必运行操作系统，所以其体积更小。底层的`Linux`容器已经被包含在内核当中。这意味着镜像体积非常小、非常快。虚拟机的体积以GB为单位，需要一到两分钟的启动时间，而容器就只以MB为单位，并且可以在几毫秒内启动。这可以帮助加速开发进度，允许开发者可以轻松地移动容器。

此外，由于容器体积小，可以快速部署，所以有助于开发者进行超大规模部署。相对于虚拟机，开发者可以使用更少的存储空间、内存和CPU，因为其在性能方面基本上不需要系统开销。

##Nginx作为Node.js前端WebServer的作用
在开始`Docker`之旅前，我想先说明一下，把`Nginx`放置在`Node.js`前端的作用，因为后面的章节联系性都比较强，我实在想不到有更好的地方插入本节。

`Nginx`想必大家都不会陌生，不过在这里我还是要不厌其烦地再介绍一下。

`Nginx`（发音同engine x）是一款由俄罗斯程序员`Igor Sysoev`开发的轻量级网页服务器、反向代理服务器以及电子邮件（`IMAP/POP3`）代理服务器。起初是供俄国大型的门户网站及搜索引擎`Rambler`（俄语：Рамблер）使用。因它的稳定性、丰富的功能集、示例配置文件和低系统资源的消耗而闻名。此软件`BSD-like`协议下发行，可以在`UNIX`、`GNU/Linux`、`BSD`、`Mac OS X`、`Solaris`，以及`Microsoft Windows`等操作系统中运行。

我们在这里正是看重了`Nginx`出色的`Http`反向代理能力，所以才把它放置在`Node.js`前端，用来处理我们的各种需求。可能有读者不理解反向代理这个名词，我在这里稍作解释。

有反向代理就肯定有正向代理，正向代理我们接触的很多，比如我们想访问一些国外的网站，可是又由于某些原因无法正常打开或者打开缓慢，这时候我们通过香港的`Http`代理就可以正常的访问一些国外网站了，在此香港的这个`Http`代理就是正向代理。反向代理的情况正好相反，比如我们有一个对外的api服务`api.nodeInAction.com`，初期我们启动一台服务器，一个`Node.js`进程就可以完成负载，但是后期随着访问量的加大，发现一个进程，一台服务器已经不能满足我们的需要了。这时候`Nginx`就可以发挥自己反向代理的能力，可以在`Nginx`后端添加多个服务器或启动多个进程来分担访问压力。在这里，`Nginx`的作用就是反向代理了。

理解了`Nginx`的反向代理，我就要说明为什么把它放在`Node.js`的应用之前，大致有如下几个好处。

1、静态文件性能

`Node.js`的静态文件处理性能受制于它的单线程异步`I/O`模型，注定了静态文件性能不会很好（所以某些情况下，单线程异步`I/O`并不是性能的代名词）。在一台普通的4CPU服务器上，使用`Nginx`处理静态文件的性能基本上是纯`Node.js`的2倍以上，所以我们应该避免在生产环境下，直接使用`Node.js`来处理静态文件。关于`Node.js`处理静态文件的更多内容，在我撰写的另一本`《Node.js实战》`书中有详细对比和介绍，欢迎读者购买阅读。

2、反向代理规则

有时会存在反向代理服务器配置规则多样化的情况，有时我们希望配置较好的机器能够分担更多的压力，有时又因为`session`的关系，我们需要将同一来源IP的客户端总是转发到同一个进程上，诸如此类这些规则，使用`Nginx`的配置文件，就可以很简单地去实现。

3、扩展性

`Nginx`可以加入许多扩展，帮助我们处理业务。最典型的就是加入`Lua`语言的扩展，通过胶水语言`Lua`，对`Nginx`赋予了复杂逻辑判断的能力，并且保持着一贯的高效。例如我们有一个`api`服务，对访问会进行`md5`签名或对同一客户端来源有访问频率限制，这部分代码是后端业务处理前必须通过的验证，具有卡口作用。利用`Lua`扩展，我们就可以高效、简单地完成这个卡口。

4、稳定性和转发性能

`Nginx`的稳定性有目共睹，同样负载下，相比`Node.js`占用的CPU和内存资源更少，同时高效地转发新能，方便地转发配置都是我们选择它作为反向代理的原因之一，比如我们可以根据不同的`url`请求路径转发到不同的后端机器上，也可以设定超时时间等，方便管理。

5、安全性

`Nginx`已经被各大互联网公司广泛应用，经过一些配置可以有效抵挡类似`slowloris`等的`DoS`攻击，而`Node.js`在这方面做的还不够，关于`Node.js`开发安全方面的更多内容，可以参考我的另一本`《Node.js实战》`一书，专门有一个章节来讨论如何更安全地开发`Node.js`的`web`应用。

6、运维管理

可能我们目前限于资金的原因，只有一台`web`服务器，同时有多个站点需要占用`80`端口，这时我们只需要让`Node.js`服务监听本地的特殊端口，例如`3000`，通过`Nginx`的反向代理配置，就可以完成多个站点域名指向一台机器的需求了。当然，如果公司配置了专门的运维部门来管理服务器，相信他们对`Nginx`的熟悉程度一定远远大于`Node.js`，他们自己就可以轻松地修改一些配置，而不用来麻烦我们。

所以，一个好习惯就是，在生产环境中，永远把`Nginx`放置在`Node.js`的前端，对性能、安全性和将来的扩展性都有益处。

##安装Docker和下载Images镜像
在介绍完`Nginx`之后，我们继续`Docker`之旅，在Docker官网有详细的各个系统安装流程，这里我就介绍下`CentOS`下的安装，其他系统安装地址详见：[https://docs.docker.com/](https://docs.docker.com/)

对于在`CentOS 7`下的用户，安装非常简单，直接运行如下命令，就可以安装最新版本的`Docker`。

	$ sudo yum install docker

对于在`CentOS 6.5`下的用户稍微麻烦点，先获取`epel`源，并导入。

	$ wget -c http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
	$ rpm -ivh epel-release-6-8.noarch.rpm
	$ rpm –import /etc/pki/rpm-gpg/RPM-GPG-KEY-EPEL-6

接着通过`yum`安装`Docker`。

	$ yum install docker-io --enablerepo=epel

启动`Docker`服务，并且把`Docker`服务开机启动。

	$ sudo service docker start
	$ sudo chkconfig docker on

我们可以输入如下命令，检查`Dcoker`进程是否已经启动。

	$ ps -ef|grep docker

如果发现`Docker`进程未成功启动，就需要进入`/var/log/`目录下，查看`Docker`日志文件的信息了，可能`CentOS 6.5`用户会报出如下错误。

	/usr/bin/docker: relocation error: /usr/bin/docker: symbol dm_task_get_info_with_deferred_remove, version Base not defined in file libdevmapper.so.1.02 with link time reference

执行如下命令可以修复，然后再重新启动`Docker`服务。

	$ yum-config-manager --enable public_ol6_latest
	$ yum install -y device-mapper-event-libs
	$ yum update -y device-mapper-libs

现在`Docker`服务已经安装并启动，我们需要下载`Image`镜像，镜像就是我们应用运行的环境，比如我们可以自己装好`Node.js`和`npm`然后发布到`Docker Hub`上，供自己或者别人下载，我们也可以下载安装一些官方的镜像，把它作为自己镜像的基础，下面我们先下载`CentOS`镜像。

	$ sudo docker pull centos:7

等待片刻后，就能下载完毕，执行命令查看镜像是否安装成功。

	$ sudo docker images centos
	REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
	centos              centos7             8efe422e6104        2 weeks ago         224 MB
	centos              latest              8efe422e6104        2 weeks ago         224 MB
	centos              7                   8efe422e6104        2 weeks ago         224 MB

我们可以去`Docker`官网搜索一些我们需要的镜像，根据下载次数、推荐次数来排序搜索结果，访问地址：[https://registry.hub.docker.com/](https://registry.hub.docker.com/)

![](http://7u2pwi.com1.z0.glb.clouddn.com/dockerBrowser.png)

上图是在`Docker`官网里进行搜索`Node.js`关键字的结果列表，我们看到被人赞星星的次数和下载次数，两者分数越高，说明这个镜像越值得信赖。
	
##Docker常用命令
在我们深入`Docker`学习之前，先罗列一些`Docker`的常用命令，一时半会看不懂没关系，随着我们深入学习，常用命令很容易掌握。关于详细命令的相关说明，输入如下命令，能获取帮助。

	$ docker -h

1、获取镜像。
	
	$ sudo docker pull NAME[:TAG]

命令示例：

	$ sudo docker pull centos:latest 

2、启动`Container`盒子。
	
	$ sudo docker run [OPTIONS] IMAGE [COMMAND] [ARG...] 

一个简单的启动`Container`盒子的示例：
	
	$ sudo docker run -t -i centos /bin/bash

启动`Container`盒子是非常重要的命令，我们会在下一节详细介绍`Container`盒子及启动命令

3、查看镜像列表，会把本地所有的`images`列出。

	$ sudo docker images [OPTIONS] [NAME]

命令示例：

	$ sudo docker images centos

4、查看容器列表，可以看到所有我们创建过的`Container`。

	$ sudo docker ps [OPTIONS] 

命令示例，查看所有运行中或者停止运行的盒子：
	
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
	
基本上常用的命令就是这些，读者第一次阅读只需对它们有初略的了解，随着对`Docker`的不断使用，很容易就能熟练的运用上面的这些命令了。下一节我们将详细介绍关于`Docker`的精髓，那就是`Container`。

##启动Container盒子
看了上一节那些眼花缭乱的命令，再加上`Image`、`Container`，大家是不是觉得很头晕，既然下载了`Image`，为什么又会多一个`Container`了呢？在`Docker`世界里，它们之间的关系又是怎样的呢？

接下来，我简单说明一下`Image`和`Container`的关系。`Image`顾名思义就是镜像的意思，我们可以把它理解为一个执行环境（env），当我们执行了`docker run`命令之后，`Dock`就会根据当前的`Image`创建一个新的`Container`，`Container`是一个程序运行的沙箱，它们互相独立，但都是运行在`Image`创建的执行环境之上。

然后启动一段小程序，基于我们刚才下载的`CentOS`镜像，启动一个`Container`，让控制台输出一行`hello world`。
	
	$ sudo docker run b15 /bin/echo 'Hello world'
	Hello world

其中`b15`是我们之前下载的镜像的`id`，在`Docker`中`id`不必输全，只要保证输入的`id`前几位能让`Docker`找到唯一的`Image`或`Container`即可，这同样适用于删除操作。

现在我们尝试启动一个稍复杂的`Container`，每秒钟打印一个`Hello World`。

	$ sudo docker run -i -t b15 /bin/sh -c "while true; do echo hello world; sleep 1; done" 
	Hello world
	Hello world
	Hello world
	Hello world
	Hello world
	...

命令中的参数`-i`表示同步`Container`的`stdin`，`-t`表示分配一个伪终端。

上面我们执行了2个`docker run`的任务，其实也就创建了2个独立的`Container`，我们通过命令`docker ps -a`就可以列出所有我们创建过的`Container`了，因为版面显示的原因，我做了部分修改，把`COMMAND`改短了。

	CONTAINER ID   IMAGE     COMMAND  CREATED     STATUS        PORTS        NAMES
	026ec6c8802c   centos:7  ...      4 minutes   Up 4 minutes               focused_bartik 
	cc5105d4e6f5   centos:7  ...      4 minutes   Exited (0) 10 minutes ago  determined_pare    

我们看到`026ec6c8802c`这个每隔一秒打印`Hello World`的`Container`4分钟前创建，并且一直在运行，已经运行了4分钟。另外一个`cc5105d4e6f5`，就是一次性打印`Hello World`的`Container`已经退出了。
	
由于那个每隔一秒执行的`Container`永远不会停止，我们现在需要手动把它删除，删除运行中的`Container`，需要加上参数`-f`。

	$ sudo docker rm -f 026
	026

对于`Container`的停止、重启和启动的操作命令，读者请参考上一节的内容。
	
##文件卷标加载
上一节我们学习了`Container`的基本概念，并启动了几个输出`Hello World`的例子，初步理解`Container`的读者可能会把`Docker`的`Container`理解为一个虚拟机，虽然这并不完全正确，但是在本节我不会去纠正他，这样的理解对我们深入学习`Docker`会有所帮助。接下来的一节，会针对这个问题进行讨论。

我们可能有这样的需求，应用程序跑在`Container`里，但我们不想在里面记录日志，因为万一`Image`升级，我们就必须重新执行`docker run`命令，这样日志文件处理就比较麻烦，而且记录在`Container`文件系统里的日志也不方便我们查看。这时候就需要将主机的文件卷标挂载到`Container`中去，在`Container`中写入和读取的某个文件目录，其实就是挂载进去的主机目录，我们通过参数`-v`把主机文件映射到`Container`中。

下面的命令就是把本机的`/etc`目录挂载到`Container`里的`/opt/etc`下面，并且打印`Container`的`/opt/etc`目录。
	
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

如果想要挂载后的文件是只读，需要这样挂载。

	-v /etc/:/opt/etc/:ro #read only

我们也可以挂载一个已经存在的`Container`中的文件系统，需要用到`--volumes-from`参数，我们先创建一个`Container`，它共享`/etc/`目录给其他`Container`。

	$ sudo docker run -i -t -p 1337:1337 --name=etc_share -v /etc/ centos mkdir /etc/my_share && /bin/sh -c "while true; do echo hello world; sleep 1; done"

参数`-p`表示端口映射，上面的命令将`Container`的1337端口映射到主机的1337端口，对外共享`/etc/`目录，给这个`Conatiner`取名字为`etc_share`。

然后我们启动一个`ls_etc`的`Container`来挂载并打印`etc_share`共享的目录。
	
	$ sudo docker run --rm=true -i -t --volumes-from etc_share --name=ls_etc centos ls /etc
	...	
	my_share       pki             rc0.d           rpc        shells              tmpfiles.d
	...

我们看到，`ls_etc`这个`Container`打印出来的`/etc`目录是包含我们之前在`etc_share`这个`Container`中创建的`my_share`目录的。	

##将多个Container盒子连接起来
上一节我们学习了如何将主机或者`Container`的文件系统挂载起来，本节我们将学习把各个`Container`连接在一起。

先下载一个`redis`数据库的镜像，这是使用`Docker`的常规做法，数据库单独用一个`Image`，程序一个`Image`，利用`Docker`的`link`属性将他们连接起来，配合使用。

	$ sudo docker pull redis:latest #下载官方的redis最新镜像，耐心等待一段时间

一般我们使用`docker pull`命令后面都会跟着版本号（例如：`2.8.19`是截稿时`redis`的最新版）或者`latest`，这样不用重复地去下载这个镜像的老版本，可以加快速度。接着我们执行命令，启动`redis`镜像的`Container`，开启`redis-server`持久化服务。

	$ sudo docker run --name redis-server -d redis redis-server --appendonly yes

然后我们再启动一个`redis`镜像的`Container`作为客户端，连接我们刚才启动的`redis-server`

	$ sudo docker run --rm=true -it --link redis-server:redis redis /bin/bash

执行上面的命令后，我们就进入了`Container`内部的`bash`，可以直接在里面执行一些`linux`的命令。

	redis@7441b8880e4e:/data$ env

`ssh`当前控制台是在主机中还是在`Container`中，主要根据`$`符号左侧的用户名来区分，上面的命令将打印`Container`里系统的环境变量，输出如下。

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

我们成功地利用环境变量连接上了一台给我们提供数据库服务的`redis`的`Container`，用同样的方法，我们可以在程序里连接其他数据库，比如`mysql`或者`mongodb`等。

##不要用ssh连接到你的Container盒子
学习了前面几个章节，相信大家已经不算是一个`Docker`新手了，越来越多的情况，会让你想到：“怎么进入到我的`Container`中去呢？”，其他人会告诉他：“ 在你的`Container`里面装一个`ssh server`，这样你就可以连入你的`Container`了。” 但是这是一种糟糕的做法，下面我将告诉大家为什么这么做是错误的，如果实在万不得已，我们又能用什么方式来替代它。

在`Container`里安装一个`ssh server`是非常诱人的，因为这样我们就可以直接连接到`Container`，并且进入它的内部，我们可以使用前面几节学到的端口映射方式，让本地的`ssh`客户端连入`Container`。

所以也不奇怪，人们会建议，在`Container`中创建一个`ssh server`，但是，我们在这么做之前需要考虑以下几个问题：

1、你需要`ssh`来干什么？

大部分需求是，你要检查日志、做备份、重启进程、调整配置或者查看服务器情况，下面将介绍如何不使用ssh来做到以上这些事情。

2、你如何来管理密钥和密码？

大部分的可能是，你将你的密钥和密码一起装进你的`Image`中，或者将他们放在文件卷中。想一想如果你要更新你的密钥或者密码，你应该怎么做呢？

如果你把它们装载进`Image`中，那你每次更新都需要重新创建`Image`，重新发布`Image`，然后重启`Container`。这样做不是很优雅。

一个更好的办法是将这些东西放在一个文件卷标中，它能工作，但是也有显著的缺点，你必须保证你的`Container`没有对这个文件卷标有写的权限，否则可能会污染你的密钥和密码，从而造成你无法登录这个`Container`。而且可能因为多个`Container`共享这些东西而变得更加难以管理。

3、你如何管理你的密码升级

`SSH server`是非常安全的，但是一旦你的密钥或密码泄漏，你不得不升级所有使用`SSH`的`Container`，并且重启他们。这也可能让`memcache`这样的内存缓存服务器的缓存全部丢失，你不得不重建缓存。

4、你是否需要加入`SSH server`就能工作？

不是的，你还需要加入进程管理软件，`Monit`或`Supervisor`等监控软件，让应用开启多个进程运行。换而言之，你把一个简单的`Container`转变为一个复杂的东西了。如果你的应用停止了，你不得不从你的进程管理软件那里获得信息，因为`Docker`只能管理单进程。

但是不使用`ssh`，我们该如何做以下事情呢？

1、备份我的数据
你的数据必须是一个`volumn`，这样你可以启动另外一个`Container`，并且通过`--volumes-from`来共享你的应用的`Container`的数据，这个新的`Container`会来处理数据备份的事情。额外的好处是，如果只对你的数据文件（比如：日志）进行压缩长久保存，那完全可以在一个新的`Container`中处理，这样你的应用`Container`就是干净的。

2、检查日志
使用文件`volumn`，和之前一样的方法，重新启动一个日志分析的`Container`，让它来处理日志和检查日志。

3、重启我的应用服务
这个问题更容易，我们只需要重启`Container`即可。

4、修改我的配置文件
如果你正在执行一个持久的配置变更，那么你最好把这个变更放在`Image`中，如果你又启动一个`Container`，那么服务还是使用老的配置，你的配置变更将丢失。“但是我需要在应用存活期间，改变我的配置，例如增加一个新的虚拟站点”
这样的话还是需要使用`volumn`来处理，这样所有的应用`Container`都可以快速地临时变更配置。

5、调试我的应用
这可能是唯一需要进入`Container`的场景了，这样你就需要`nsenter`软件

下面我就利用类似机器猫的任意门软件`nsenter`，带你进入到`Container`中去。`nsenter`是一个小的工具，用来进入现有的命名空间。命名空间是什么？他们是`Container`的重要组成部分。简单点说，通过使用`nsenter`可以进入一个已经存在的`Container`中，尽管这个`Container`没有安装`ssh server`或者其他类似软件。

`nsenter`项目地址：[https://github.com/jpetazzo/nsenter](https://github.com/jpetazzo/nsenter)

我们可以通过命令来安装`nsenter`，这个命令会自己去下载`nsenter`镜像，并且会把`nsenter`命令安装到主机的`/usr/bin`中，我们就可以很方便地使用它了。

	$ sudo docker run -v /usr/local/bin:/target jpetazzo/nsenter

我们先要找出需要进入的`Container`的`pid`。

	PID=$(docker inspect --format {{.State.Pid}} <container_name_or_ID>)

命令实例：
	
	$ sudo docker inspect --format {{.State.Pid}} 9479
	7026

这里我们得到了`id`为`9479`的`Container`的`pid`号为7026，这句话有点拗口，其实我们只需关心7026这个`pid`号就可以了。我们根据刚才获得的`pid`就能顺利进入到`Container`的内部了。

	$ sudo nsenter --target $PID --mount --uts --ipc --net --pid

这里我们把`$PID`替换为7026即可，命令如下：

	$ sudo nsenter --target 7026 --mount --uts --ipc --net --pid

如果你想要远程访问这个`Container`，可以通过`ssh`链接到你的主机，并且使用`nsenter`连接进入到`Container`，所以大家是不是觉得完全没有必要在`Container`里安装一个`SSH server`了吧。

如果在`pull`镜像`nsenter`出现错误，那估计是`CentoOS`内核的版本，所以尽量使用较新的内核版本来启动`Docker`，出现下面的错误可能就是内核版本过低。
	
	Error pulling image (latest) from jpetazzo/nsenter, Unknown filesystem type on /dev/mapper/...

或者无法进入`Container`的错误，也是因为内核过低，没有正确安装镜像所致。

	nsenter: cannot open /proc/27797/ns/ipc: No such file or directory

如果运行安装`nsenter`时，出现如下错误：

	$ sudo docker run -v /usr/local/bin:/target jpetazzo/nsenter
	Installing nsenter to /target
	cp: cannot create regular file '/target/nsenter': Permission denied
	Installing docker-enter to /target
	cp: cannot create regular file '/target/docker-enter': Permission denied

那就需要手动将`Container`里的`nsenter`命令拷贝到`/usr/local/bin`目录下了，先把`jpetazzo/nsenter`运行起来，然后手动进入文件系统，将命令拷贝出来，下面的`<containid>`就是我们使用`docker ps`查到的`id`，目录`devicemapper`是`centos`下的路径名，在`windows`下则是`aufs`。

	$ cp /var/lib/docker/devicemapper/mnt/<containid>/rootfs/nsenter /usr/local/bin/
	$ cp /var/lib/docker/devicemapper/mnt/<containid>/rootfs/docker-enter /usr/local/bin/

##配置我的DockerImages镜像和发布应用
我们已经学习了很多关于`Docker`的知识，`Docker`之旅也渐渐接近尾声，本节我们就要简单制作一个`Node.js`包含`Express.js`环境的镜像，通过`pm2`来启动`web`应用，然后发布到`Docker`云上；我们还会使用`redis`数据库来暂存用户的访问次数；在`Node.js`应用前端，我们需要放置一个`Nginx`作为反向代理，现在让我们开始吧。

第一步，我们把需要用到的`Image`镜像统统都下载到本地，执行如下命令，等待片刻就能下载成功。为了加快下载速度和本书代码的兼容性，我们指定了下载各个镜像的版本，读者可以根据当时的最新版本进行下载。

	$ sudo docker pull redis:2.8.19
	$ sudo docker pull node:0.10.36

执行`docker images`检查一下这些镜像是否都安装完毕，正常会打印出各个镜像列表。

	node                0.10.36             20fbb0b572a2        5 hours ago         705.4 MB
	node                latest              20fbb0b572a2        5 hours ago         705.4 MB
	redis               latest              5e0586116d76        5 days ago          110.8 MB
	redis               2.8.19              5e0586116d76        5 days ago          110.8 MB
	jpetazzo/nsenter    latest              6ed3da1d7fa6        9 weeks ago         367.7 MB

我们先在本地创建一个部署`Node.js`应用的目录，然后写上`package.json`

	$ mkdir /var/node/
	$ mkdir /var/node/docker_node

在创建我们的应用之前，我们从`node 0.10.36`这个镜像基础上，开始制作自己的镜像，这个镜像只是比`node 0.10.36`镜像多了一个`pm2`的命令。运行如下命令，进入到`Container`的命令行，然后我们安装`pm2`软件。如果读者对`Node.js`比较熟悉，相信对`pm2`不会陌生，它是`Node.js`进程管理软件，可以方便地重启进程和查看`Node.js`日志。

	$ sudo docker run -i -t node /bin/bash
	#进入Container的bash	
	$ npm install pm2 -g
	$ pm2 -v
	0.12.3
	#考虑国内的网络，再装下cnpm更靠谱些
	$ npm install cnpm -g --registry=https://registry.npm.taobao.org
	#从Container的bash退出
	$ exit

这样我们就成功地在`node 0.10.36`这个镜像的基础上安装了`pm2`，然后我们要把这个新的`Container`保存为镜像，这样以后我们要用到带`pm2`的`Node.js`镜像，只需下载它即可。执行命令，进行登录，然后把镜像`push`到云上，非官方不允许直接提交根目录镜像，所以必须以<用户名>/<镜像名>这样的方式提交，比如`doublespout/node_pm2`这样
	
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
	
等待片刻后，我们新的镜像就保存到了`Docker`云上，然后我们把本地的`doublespout/node_pm2`删除，试着从云上下载这个镜像。

	$ sudo docker rmi doublespout/node_pm2
	$ sudo docker images doublespout/node_pm2
	REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
	#发现是空的，然后我们从云上pull

	$ sudo docker pull doublespout/node_pm2
	#稍等片刻即可下载完毕

接下来我们将通过`redis`镜像，启动一个`redis`的`Container`，命令如下：

	docker run --name redis-server -d redis redis-server --appendonly yes

然后我们要准备编写`Node.js`代码，实现这个计数访问应用的功能，在`/var/node/docker_node`目录下创建如下的`package.json`文件，这里对依赖包写上版本号是比较稳妥的方式，可以免去因为依赖包升级而造成应用不稳定的情况，实在有必要升级，可以单独升级某几个依赖测试。

	{
	  "name": "docker_node",
	  "version": "0.0.1",
	  "main": "app.js",
	  "dependencies": {
	       "express":"4.10.2",
	       "redis":"0.12.1",
	   },
	  "engines": {
	    "node": ">=0.10.0"
	  }
	}

然后我们创建`app.js`，启动并监听8000端口，同时通过`redis`记录访问次数。

	var express = require('express');
	var redis = require("redis");
	var app = express();
	//从环境变量里读取redis服务器的ip地址
	var redisHost = process.env['REDIS_PORT_6379_TCP_ADDR'];
	var redisPort = process.env['REDIS_PORT_6379_TCP_PORT'];
	
	var reidsClient = redis.createClient(redisPort, redisHost);
	
	app.get('/', function(req, res){
		  console.log('get request')
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

我们先启动一个`Container`把依赖包装一下，命令如下：

	$ sudo docker run --rm -i -t -v /var/node/docker_node:/var/node/docker_node -w /var/node/docker_node/ doublespout/node_pm2 cnpm install

`-w`参数表示命令执行的当前工作目录，屏幕会打印依赖包的安装过程，等所有`Node.js`的包安装完成后，这个`Container`会自动退出，然后我们进入`/var/node/docker_node/`目录，就可以看到`node_modules`文件夹，说明我们的依赖包安装完毕了。

如果出现`EACCESS`的权限错误，可以执行如下命令，许可`SELinux`的工作状态，不过这只是临时修改，重启系统后会恢复。

	su -c "setenforce 0"

代码开发完毕，基于刚才我们提交的`doublespout/node_pm2`镜像，我们要启动一个运行这个程序的`Container`，要求这个`Container`有端口映射、文件挂载，并同时加载`redis`的那个`Container`，命令如下：
	
	#挂载pm2的日志输出
	$ mkdir /var/log/pm2
	#使用pm2启动app应用，但是会有问题
	$ sudo docker run -d --name "nodeCountAccess" -p 8000:8000 -v /var/node/docker_node:/var/node/docker_node -v /var/log/pm2:/root/.pm2/logs/ --link redis-server:redis -w /var/node/docker_node/  doublespout/node_pm2 pm2 start app.js

但是当我们执行`docker ps`后发现这个`Container`并没有启动，这是什么原因呢？因为我们利用`pm2`的守护进程方式启动了应用，所以`Container`会认为进程已经运行结束，所以自己退出了，这时候我们需要让`pm2`以非守护进程的方式运行在`Container`里即可，我们的命令要做一些更改。

	$ sudo docker run -d --name "nodeCountAccess" -p 8000:8000 -v /var/node/docker_node:/var/node/docker_node -v /var/log/pm2:/root/.pm2/logs/ --link redis-server:redis -w /var/node/docker_node/  doublespout/node_pm2 pm2 start --no-daemon app.js

这时候我们再执行`docker ps`，就可以看到`nodeCountAccess`这个名字的`Container`在运行了，使用浏览器打开主机的8000端口，也能看到访问的计数次数。

接下来就轮到作为反向代理的`Nginx`出场了。
	
由于使用`Docker`的`Container`它的ip地址是动态变化的，所以我们想要使用`Nginx`容器来做反向代理，配置写起来比较困难，这里我们就暂不使用`Docker`容器来管理`Nginx`了，而是直接编译安装`Nginx`。

我们使用`Nginx`的分支版本`openresty`来做反向代理，`openresty`比`Nginx`内置了`ngx-lua`模块，让`Nginx`具有逻辑处理能力，我们用`yum`安装依赖包，然后编译安装`openresty`。

	yum install -y gcc gcc-c++ kernel-devel
	yum install -y readline-devel pcre-devel openssl-devel openssl zlib zlib-devel pcre-devel
	wget http://openresty.org/download/ngx_openresty-1.7.2.1.tar.gz
	tar -zxvf ngx_openresty-1.7.2.1.tar.gz
	cd ngx_openresty-1.7.2.1
	./configure --prefix=/opt/openresty \
            --with-pcre-jit \
            --with-ipv6 \
            --without-http_redis2_module \
            --with-http_iconv_module \
            -j2
	make && make install
	ln -s /opt/openresty/nginx/sbin/nginx /usr/sbin/

修改`openresty`的默认配置文件，配置文件在`/opt/openresty/nginx/conf/nginx.conf`，我们修改为如下内容，出于篇幅的考虑，此配置文件是精简的配置，不要用于生产环境，大家主要就看`server`那段配置的内容。

	worker_processes 1;
	events {
	    worker_connections  1024;
	}
	http {
	    include       mime.types;
	    default_type  application/octet-stream;
	    server_names_hash_bucket_size 64;
		access_log off;
	
	    sendfile        on;
	    keepalive_timeout  65;
	
	    server {
	        listen 3001;
	        location / {
	          proxy_pass http://127.0.0.1:8000;
	          proxy_redirect default;
	          proxy_http_version 1.1;
	          proxy_set_header Upgrade $http_upgrade;
	          proxy_set_header Connection $http_connection;
	          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	          proxy_set_header Host $http_host;
	        }
	    }
	}

执行命令`nginx`就可以将`openresty`运行起来，然后打开浏览器，输入`主机IP:3001`就可以正常访问我们之前启动的`Node.js`访问计数应用。

另外如果遇到在`Container`里无法解析域名，则需要手动增加`dns`服务器，方法如下：

	DOCKER_OPTS=" --dns 8.8.8.8"
	service docker restart

##什么是Jenkins
`Jeknins`是一款由`java`开发的开源软件项目，旨在提供一个开放易用的软件平台，使持续集成变成可能，它的前身就是大名鼎鼎的`Hundson`。`Hudson`是收费的商用版本，`Jenkins`是它的一个免费开源的分支，所以我们选择使用`Jenkins`，毕竟能省则省。

那什么叫做持续集成呢？以下这些概念摘自`IBM`团队的定义。

随着软件开发复杂度的不断提高，团队开发成员间如何更好地协同工作以确保软件开发的质量已经慢慢成为开发过程中不可回避的问题，持续集成正是针对这一类问题的一种软件开发实践。它倡导团队开发成员必须经常集成他们的工作，甚至每天都可能发生多次集成。而每次的集成都是通过自动化的构建来验证，包括自动编译、发布和测试，从而尽快地发现集成错误，让团队能够更快地开发内聚的软件。

持续集成的核心价值在于：

1、持续集成中的任何一个环节都是自动完成的，无需太多的人工干预，有利于减少重复过程以节省时间、费用和工作量；

2、持续集成保障了每个时间点上团队成员提交的代码是能成功集成的。换言之，任何时间点都能第一时间发现软件的集成问题，使任意时间发布可部署的软件成为了可能；

3、持续集成还能利于软件本身的发展趋势，这点在需求不明确或是频繁性变更的情景中尤其重要，持续集成的质量能帮助团队进行有效决策，同时建立团队对开发产品的信心。

估计大家看完这些定义，对`Jenkins`到底能做什么依然没什么概念，简而言之，我们利用`Jenkins`持续集成`Node.js`项目之后，就不用每次都登录到服务器，执行`pm2 restart xxx`或者更原始一点的`kill xx`然后`node xxx`。下面是一张已经配置好的某个项目在`Jenkins`中的截图，我们只需要点击立即构建，就可以自动的从`git`仓库获取代码，然后远程部署到目标服务器，执行一些安装依赖包和测试的命令，最后启动应用。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex1.png)

可能有朋友会说，每次我通过`ssh`登录服务器执行上面的命令也挺方便的，但是当我们的`Node.js`程序不止在一台服务器上，每次部署的重复劳动让人觉得就是一场灾难；当有一些用其他语言的项目，例如`Python`或`C++`的程序需要管理，重启的方式和编译的选项我们都要烂熟于心，否则就会出错，为什么不把这一切都自动化呢？

本章接下来的几个小节，就会介绍如何从零开始，搭建一个`Jenkins`的持续集成软件，自动化部署我们之前开发的那个记录访问次数的`Node.js`应用。

##通过Docker安装和启动Jenkins
有了`Docker`这个利器，我们省去了安装`java`环境的麻烦，所以安装`Jenkins`异常简单，只需要执行如下一行命令即可。
	
	#截稿时，docker中最新版本的jenkins是1.554.1
	docker pull jenkins:1.554.1

拉取好镜像之后，我们先创建目录，然后就可以启动`Jenkins`的`Container`了，我们要把`Jenkins`的文件存储地址挂载到主机上，万一以后`Jenkins`的服务器重装或者迁移，我们都可以很方便地把之前的项目配置保留，否则就只能进入`Container`的文件系统里去拷贝了。另外`Jenkins`会搭建在内网的服务器上，而非生产服务器，如果外网能直接访问，可能会造成一定的风险。
	
	#创建本地的Jenkins配置文件目录
	$ mkdir /var/jenkins_home
	$ sudo docker run -d --name myjenkins -p 49001:8080 -v /var/jenkins_home:/var/jenkins_home jenkins

这样我们就顺利启动了`Jenkins`的服务，8080端口是`Jenkins`的默认监听端口，我们把它映射到了本地主机的49001端口，注意把搭建`Jenkins`服务器的`iptables`关闭。一切顺利我们就可以看到`Jeknins`的欢迎页面了，建议去`系统管理`->`管理用户`栏目中创建几个用户和权限，方便多人协同操作。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex2.png)

##配置Jenkins，自动化部署Node.js项目
我们需要对`Jenkins`进行一些简单的配置，才能让它自动化的部署应用，由于我们的代码是部署在`github`仓库的，所以我们先要对`Jeknins`安装几个插件，让它可以从`github`获取代码，并远程部署到我们生产的服务器上。

进入`系统管理`->`管理插件`->`可选插件`，在右上侧的筛选框中输入`git`，并安装`Git Plugin (This plugin integrates GIT with Jenkins.)`这个插件；然后再安装插件`Publish Over SSH (Send build artifacts over SSH)`插件，检查网络这一步骤可能时间较长，请耐心等待。

插件安装完成后，我们需要重新启动`Jenkins`，一般安装完毕后会自动重启，如果自动重启失败，可以进入`Jeknins`的目录`/restart`手动重启。

	#进入目录手动重启
	http://192.168.1.116:49001/restart

如果`可选插件`列表为空，那么进入`高级`，点击`立即获取`，就可以去获取`可选插件`列表了。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex11.png)

重启完成之后，我们进入`系统管理`->`系统设置`来对插件进行一下简单的设置，增加远程的服务器配置。如下图，填入我们待发布的生产服务器的Ip地址，`ssh`端口以及用户名密码等信息。如果远程服务器是通过`key`来登录的，那么还需要把`key`的存放路径写上。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex3.png)

可以点击`Test Configuration`按钮来测试服务器是否能连接成功，服务器添加完毕之后，我们现在开始创建一个新的项目。

回到`Jenkins`主页，点击左上角`新建`就可以开启一个新项目，给项目起名`node_access_count`，选择`创建一个自由风格的软件项目`，点击`ok`，就进入了此项目的配置页面。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex4.png)

在配置页，我们找到`源码管理`然后填入在`github`上的源码地址之。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex5.png)

点击`ADD`按钮，如图添加`github`帐号，我们就是通过这个帐号来拉取源代码。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex6.png)

把配置页往下滚动，在`构建`一栏处，下拉菜单点击展开，如下图选择`Execute shell`。`构建`表示我们如何向生产服务器去发布一个应用，简单来说，就是把原来手动要做的操作和要输入的命令，通过配置来自动执行。发布一个`Node.js`的程序由于不需要编译，所以大致的流程如下：

1、`Jenkins`从代码库(`svn`或`git`)获取最新代码；

2、本地将所需的代码打包，需要排除一些文件，比如`.git`文件等等；

3、把代码包通过`ssh`发送到远程的服务器上

4、停止远程服务器的服务，删除远程服务器上的代码，解压新的代码包

5、通过新的`package.json`安装依赖包，然后重新启动服务

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex7.png)

从代码库获取最新代码是`Jenkins`自动执行的，每次构建都会去做，所以我们不必去配置，接着我们开始第一步，打包最新代码。我们在文本框中输入如下命令，先删除之前的`tar`包，然后重新打包代码。

	rm -rf /var/jenkins_home/jobs/node_access_count/node_access_count.tar.gz
	tar -zcvf /tmp/node_access_count.tar.gz  -C /var/jenkins_home/jobs/node_access_count/workspace/docker_node . --exclude="*.git"
	mv /tmp/node_access_count.tar.gz /var/jenkins_home/jobs/node_access_count/workspace/

然后我们需要把代码包发送到远程的生产服务器上，这时候我们需要选择`Send files ...`这一个选项了。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex8.png)

在`SSH SERVER`的下拉菜单中，选择我们刚刚添加的服务器。

在`Source files`一行中，填写我们要发送到远程服务器的文件，我们把刚才打包的文件名`node_access_count.tar.gz`填入，这里的工作路径是本项目下的`workspace`，在这里就是`/var/jenkins_home/jobs/node_access_count/workspace/`。

在`Remote directory`一行中，填写发送代码包的远程保存地址，我们这里写入`var/`，还记得我们创建这台服务器时，填入的远程默认地址是`/`，所以我们发送到这台服务器上的代码包`node_access_count.tar.gz`会被保存在`/var/node_access_count.tar.gz`此路径下。

接下来就是先把老的代码删除，然后解压缩新的代码，并安装依赖包和重启服务，还记得我们之前启动的`Container`叫什么名字吗？我们在`Exec command`一栏中填入如下命令。
	
	docker rm -f nodeCountAccess
	
	mkdir /var/node
	mkdir /var/node/docker_node
	mkdir /var/log/pm2
	
	rm -rf /var/node/docker_node/app.js
	rm -rf /var/node/docker_node/package.json
	
	tar -xvf /var/node_access_count.tar.gz -C /var/node/docker_node
	
	docker run --rm -v /var/node/docker_node:/var/node/docker_node -w /var/node/docker_node/ doublespout/node_pm2 cnpm install
		
	docker run -d --name "nodeCountAccess" -p 8000:8000 -v /var/node/docker_node:/var/node/docker_node -v /var/log/pm2:/root/.pm2/logs/ --link redis-server:redis -w /var/node/docker_node/  doublespout/node_pm2 pm2 start --no-daemon app.js
	
	rm -rf /var/node_access_count.tar.gz
	
下面我们简单说明一下这些命令的含义。

1、`docker rm -f nodeCountAccess`命令，我们会强制删除之前的一个运行的`Container`，如果是第一次发布会触发一个错误，没有这个`Container`，无需理会。

2、两个`rm`操作则是删除原来项目的源代码，但是保留`node_modules`文件夹，免去了我们只改代码，重复去获取依赖包而导致发布程序时间过长的问题。

3、`mkdir /var/node/docker_node`，第一次启动会自动创建目录，如果已经存在无需理会

4、`tar`命令，表示把源码解压缩到指定目录

5、两个`docker run ...`则先是执行`cnpm install`安装依赖包，然后将整个应用启动起来，注意这里我们启动的这个命令不要带上`-i -t`参数，否则`Jenkins`的命令是无法退出的，一直会到超时报错。

6、最后执行删除发送过来的代码包的操作。

如果服务器在国内，那我们需要将`Exec timeout (ms)`设置得长一些，这样在`git`操作和`cnpm`操作的时候不会因为超时而报错。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex12.png)

至此，我们的项目配置完毕，点击页面底部的保存按钮将会返回到工程的首页，这时候我们可以点击左侧的`立即构建`，就可以看到构建历史中小球在闪烁和构建进度条。如果构建出错，构建历史中就会有红色小球，成功的话就是蓝色小球，黄色小球表示构建时虽然有错误，但最终还是成功的，不过这时我们也是要注意的。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex9.png)

点击这条构建历史，然后进入`Console Output`还能看到当前的构建进度，如果构建出错也可以从这里找到错误原因，修改构建配置。所以真正部署到生产服务器，由于权限、路径等，在执行命令上可能有所差异，我们编写部署脚本的时候需要多尝试几次，仔细查看打印出错的信息，相应地去修改脚本。

![](http://7u2pwi.com1.z0.glb.clouddn.com/jenkins_ex10.png)

耐心等待一会，构建成功之后，我们再打开浏览器，访问之前的`Node.js`访问计数路径，修改后的代码就被成功地发布了。以后每次有代码改动，就再也不需要使用`ssh`登录到远程服务器，执行重复劳动的操作了，只需要进入`jenkins`，然后在项目主页点击`立即构建`，另外如果需要同时部署多台机器，只需要在构建的时候添加多台机器的配置脚本就可以了。

如果在最后一步构建失败，那么请大家自行在`Jenkins`的控制台查看出错的原因，然后相应地修改配置脚本。

##小结
本章节我们初步学习了`Docker`的使用方法，基本上算是入门了`Docker`。对于`Docker`构建应用还有一个比较好的办法就是使用`Dockerfile`，`Dockerfile`更加清晰、简单，我们在使用`Dockerfile`之前还需要学习一下它的基本语法，这个就留给大家自行研究了。

`Docker`的魅力就是没有局限，如果我们偷懒，完全可以把整个运行环境，包括`db`、`Nginx`、`Node.js`运行环境等打包成一个镜像，这样每次部署只需要启动一个`Container`就可以了，不过这不是`Docker`推荐的做法。总之我们可以充分发挥想象，尽情体验`Docker`带给我们的乐趣。

本章最后介绍了利用`Jenkins`来管理发布我们的`Node.js`应用，其实`Jenkins`不仅可以用来管理`Node.js`的应用，其他一些项目我们都可以使用它来做，包括测试环境发布，包括需要远程执行的一系列`shell`脚本等等，`Jenkins`可以解放我们的双手，自动化的操作可以避免人为的失误造成的损失。

#参考文献
- <https://www.docker.com/whatisdocker> what is docker
- <http://www.cbinews.com/software/news/2015-01-20/228094.htm> 2015：Docker将走向深入应用
- <http://blog.docker.com/2014/06/why-you-dont-need-to-run-sshd-in-docker/> why you dont need to run sshd in docker
- <http://jpetazzo.github.io/2014/06/23/docker-ssh-considered-evil/> docker ssh considered evil
- <http://www.ibm.com/developerworks/cn/java/j-lo-jenkins/> 基于 Jenkins 快速搭建持续集成环境
