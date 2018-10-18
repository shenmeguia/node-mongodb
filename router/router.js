const formidable = require('formidable');
const db = require('../models/db.js');
const md5 = require('../models/md5.js');
const path = require('path');
const fs = require('fs');
const gm = require('gm');
// 首页
exports.showIndex = function (req,res,next) {
	if(req.session.login === 1) {
		var username = req.session.username;
		var login = true;
	}else {
		var username = null;
		var login = false;
	}
	db.find('users',{"username":username},(err,result) => {
		if(result.length === 0) {
			var avatar = "moren.jpg";
		}else {
			var avatar = result[0].avatar;
		}
		res.render('index',{
			"login": login,
			"username" : req.session.username,
			"active" : "index",
			"avatar" : avatar
		});
	})
}
// 注册页
exports.showRegister = function (req,res,next) {
	res.render('register',{
		"login": req.session.login === 1 ? true : false,
		"username" : req.session.username,
		"active" : "register"
	});
}
// 登陆
exports.showLogin = function (req,res,next) {
	res.render('login',{
		"login": req.session.login === 1 ? true : false,
		"username" : req.session.username,
		"active" : "login"
	});
}
// 上传头像
exports.showSethead = function (req,res) {
	// 没登录直接跳转回首页
	if(req.session.login !== 1) {
		res.redirect('/');
		return;
	}
	res.render('sethead',{
		"login": true,
		"username" : req.session.username,
		"active" : "login"
	});
}
// 头像裁剪
exports.showCut = function(req,res) {
	// 没登录直接跳转回首页
	if(req.session.login !== 1) {
		res.redirect('/');
		return;
	}
	res.render('cut',{
		"avatar": req.session.avatar
	});
}
// 注册业务
exports.doRegister = function (req,res,next) {
	var form = new formidable.IncomingForm();
	form.parse(req,function(err,fields,files,next) {
		var username = fields.username;
		var password = fields.password;
		db.find('users',{"username":username},(err,result) => {
			// 服务器错误
			if(err) {
				res.send({"code":-2});
				return;
			}
			// 用户名已存在
			if(result.length !== 0) {
				res.send({"code":-1});
				return;
			}
			password = md5(md5(password) + '这是一串防止解密的文字');
			db.insertOne('users',{"username":username,"password":password,"avatar":"moren.jpg"},(err,result) => {
				if(err) {
					res.send({"code":-2});
					return;
				}
				// 注册成功 并设置session
				req.session.login = 1;
				req.session.username = username;
				res.send({"code":1});
			})
		})
	})
}

// 登陆业务
exports.doLogin = function (req,res,next) {
	var form = new formidable.IncomingForm();
	form .parse(req,function(err,fields,files,next) {
		var username = fields.username;
		var password = fields.password;
		db.find('users',{"username":username},(err,result) => {
			if(err) {
				res.send({"code":-2});
				return;
			}
			password = md5(md5(password) + '这是一串防止解密的文字');
			if(result.length === 0) {
				res.send({"code":-1});
				return;
			}
			if(result[0].password != password) {
				res.send({"code":-3});
				return;
			}
			// 登陆成功 并设置session
			req.session.login = 1;
			req.session.username = username;
			res.send({"code":1});
		})
	})
}

// 上传头像业务
exports.doSethead = function (req,res) {
	var form = new formidable.IncomingForm();
	// 上传路径(暂时的地址) 下面通过改名替换位置
	form.uploadDir = path.normalize(__dirname + "/../avatar/");
	form .parse(req,function(err,fields,files,next) {
		// 图片扩展名
    var extname = path.extname(files.file.name);
		var oldPath = files.file.path;
		var newPath = path.normalize(__dirname + "/../avatar/" + req.session.username + extname);
		fs.rename(oldPath,newPath,(err) => {
			if(err) {
				res.send('上传失败');
			}
			// 上传成功，并把图片名称缓存在session中，便于头像裁剪页面拿到图片
			req.session.avatar = req.session.username + extname;
			res.redirect('/cut');
		})
	})
}

exports.doCut = function (req,res) {
	// 没登录直接跳转回首页
	if(req.session.login !== 1) {
		res.redirect('/');
		return;
	}
	//这个页面接收几个GET请求参数
  //w、h、x、y
  var filename = req.session.avatar;
  var w = req.query.w;
  var h = req.query.h;
  var x = req.query.x;
  var y = req.query.y;
  // 第一个resize是将图片宽度限制在400px，高度自适应
  // 第二个resize是将裁切过后的图片宽高都限制在100px
  gm("./avatar/" + filename).resize(400).crop(w, h, x, y).resize(100, 100, "!").write("./avatar/" + filename, function (err) {
    if (err) {
        res.send({"code":-1});
        return;
    }
    //更改数据库当前用户的avatar这个值
    db.updateMany("users", {"username": req.session.username}, {
        $set: {"avatar": req.session.avatar}
    }, function (err, results) {
        res.send({"code":1});
    });
  });
}
// 发表说说
exports.doPost = function (req,res) {
	// 没登录直接跳转回首页
	if(req.session.login !== 1) {
		res.redirect('/');
		return;
	}
	var username = req.session.username;
	var form = new formidable.IncomingForm();
	form.parse(req,function(err,fields,files,next) {
		if(err) {
			res.send({"code":-3});
		}
		var content = fields.content;
		db.insertOne('post',{"username":username,"content":content,"time":new Date()},(err,result) => {
			if(err) {
				res.send({"code":-1});
			}
			res.send({"code":1});
		})
	})
}

// 获取所有说说，有分页，并按时间排序
exports.getAllPost = function (req,res) {
	var page = req.query.page;
	db.find('post',{},{"pageCount":6,"page":page,"sort":{"time":-1}},(err,result) => {
		if(err) {
			res.send({"data":null});
		}
		res.send({"data":result});
	})
}
// 获取用户信息，密码除外
exports.getUserInfo = function (req,res) {
	var username = req.query.username;
	db.find('users',{"username":username},(err,result) => {
		if(err) {
			res.send({"data":null});
		}
		var data = {
			"username":result[0].username,
			"avatar":result[0].avatar,
			"_id":result[0]._id
		}
		res.send({"data":data});
	})
}
// 获取所有说说数量
exports.getAllCount = function (req,res) {
	db.getAllCount('post',(count) => {
		res.send({"count":count});
	})
}

// 获取用户的所有说说信息，对应用户的主页
exports.showUser = function (req,res) {
	if(req.session.login !== 1) {
		res.redirect('/login');
		return;
	}
	var user = req.params["username"];
	db.find('post',{"username":user},(err,result) => {
		db.find('users',{"username":user},(err,result2) => {
			res.render('user',{
				"login": req.session.login === 1 ? true : false,
				"username" : req.session.username,
				"user" : user,
				"active" : "myself",
				"result" : result,
				"avatar" : result2[0].avatar
			})
		})
	})
}
// 获取所有用户
exports.showUserList = function (req,res) {
	db.find('users',{},(err,result) => {
		res.render('userlist',{
			"login": req.session.login === 1 ? true : false,
			"username" : req.session.username,
			"active" : "userlist",
			"result" : result,
		})
	})
}

// 退出登录
exports.doQuit = function (req,res) {
	req.session.login = -1;
	req.session.username = '';
	res.redirect('/');
}