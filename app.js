const express = require('express');
const router = require('./router/router.js');
const session = require('express-session');
const app = express();
app.use(session({
	secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine','ejs');
// 静态服务
app.use(express.static(__dirname + '/public'));
app.use("/avatar",express.static(__dirname + '/avatar'));
// 对应路由
app.get('/',router.showIndex);
app.get('/register',router.showRegister);
app.get('/login',router.showLogin);
app.get('/sethead',router.showSethead);
app.get('/cut',router.showCut);
app.get('/docut',router.doCut);
app.get('/getallpost',router.getAllPost);//获取所有说说
app.get('/getuserinfo',router.getUserInfo);//获取用的基本信息
app.get('/getallcount',router.getAllCount);//获取所有说说的数量
app.get('/quit',router.doQuit);//退出登录
app.get('/user/:username',router.showUser);//获取用户的所有说说信息
app.get('/userlist',router.showUserList);//获取所有用户
// 注册业务路由
app.post('/doregister',router.doRegister);
// 登陆业务路由
app.post('/dologin',router.doLogin);
// 上传头像业务
app.post('/dosethead',router.doSethead);
// 发表说说
app.post('/post',router.doPost);
app.listen(3000);