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

