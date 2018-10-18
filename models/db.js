// 这个模块里面封装所有对数据库的常用操作
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const url = 'mongodb://localhost:27017';
const dbname = 'shuoshuo';
// 连接数据库封装成内部函数
function _connect(callback) {
	MongoClient.connect(url,(err,client) => {
		if(err) {
			callback(err,null);
			return;
		}
		callback(err,client);
	})
}

// 数据库建立一个索引,能够提高数据库查找速度
function init() {
	_connect((err,client) => {
		if(err) {
			console.log(err);
			return;
		}
		client.db(dbname).collection('users').createIndex({"username":1},null,(err,result) => {
			if(err) {
				console.log(err);
				return;
			}
			console.log('索引建立成功');
		})
	})
}
init();

// 向外暴露插入一条数据的方法
// 参数 （collectionName 要操作的数据集合名）（json插入的数据）
exports.insertOne = function (collectionName,json,callback) {
	_connect((err,client) => {
		client.db(dbname).collection(collectionName).insertOne(json,(err,result) => {
			callback(err,result);
			client.close();
		})
	})
}

// 查找数据方法
// 参数 （collectionName 要操作的数据集合名）（json查询条件）（paging分页条件，可以不传，不传时不需要分页） 
exports.find = function (collectionName,json,paging,callback) {
	_connect((err,client) => {
		// 三个参数时，回调函数就是paging，并把一页数量设置为0(即为不需要分页)
		if(arguments.length == 3) {
			var limitCount = 0;
			callback = paging;
		}else if(arguments.length == 4) {
			// 给默认值是防止没传对应的参数报错
			var limitCount = paging.pageCount || 0;
			var sort = paging.sort || {};
		}else {
			throw new Error('参数错误');
		}
		var skipCount = limitCount * paging.page
		// limit 一页数量     skip 忽略的数量  配合使用实现分页  sort排序
		let cursor = client.db(dbname).collection(collectionName).find(json).limit(limitCount).skip(skipCount).sort(sort);
		// 读取到的数据以数组形式返回
		cursor.toArray((err,result) => {
			if(err) {
				callback(err,null);
				client.close();
				return;
			}
			callback(null,result);
			client.close();
		})
	})
}

// 删除
// 参数 （collectionName 要操作的数据集合名）（json删除的条件）
exports.deleteMany = function(collectionName,json,callback) {
	_connect((err,client) => {
		client.db(dbname).collection(collectionName).deleteMany(json,(err,result) => {
			callback(err,result);
			client.close();
		})
	})
}

// 修改
// 参数 （collectionName 要操作的数据集合名）（json1要修改的条件）（json2修改成什么）
exports.updateMany = function(collectionName,json1,json2,callback) {
	_connect((err,client) => {
		client.db(dbname).collection(collectionName).updateMany(json1,json2,(err,result) => {
			callback(err,result);
			client.close();
		})
	})
}

// 获取数据数量
exports.getAllCount = function (collectionName,callback) {
	_connect((err,client) => {
		client.db(dbname).collection(collectionName).count({}).then((count) => {
			callback(count);
			client.close();
		})
	})
}