const crypto = require('crypto');
module.exports = function(str){
	//md5加密方法
	var obj = crypto.createHash('md5');
	obj.update(str);
	return obj.digest('base64');
}