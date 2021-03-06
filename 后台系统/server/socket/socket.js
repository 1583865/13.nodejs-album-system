// 引入socket
var socket_io = require("socket.io");
// 引入http模块
var http = require("http");

// 记录报道的用户
var arr = [];

function set(app) {
	// 转换成原生对象
	var server = http.Server(app);
	var io = socket_io(server);
	// 监听connection事件
	io.on("connection", function(socket) {
		console.log(socket.id);
		var username = ""
		// 这里的socket就是本次建立起来的持久连接在后端的对象
		// 后端监听某一个事件
		socket.on("baodao", function(obj) {
			// 将报道的用户的信息放入数组
			arr.push(obj);
			obj.id = socket.id;
			console.log(arr);
			username = obj.username;
			// 通知所有人 让他们更新自己的页面上的显示内容 也就是用户列表内容
			io.sockets.emit("updateUserNameList", arr);
		});
		// 监听离开事件
		socket.on("disconnect", function() {
		  arr.forEach(function(value, index) {	
		  	if (value.username === username) {
		  		arr.splice(index, 1); 
		  	}
		  });
		});

		// 监听用户发言事件
		socket.on("someonespeak", function(obj) {
			console.log(obj, "有人发言了");
			// 预处理一下 将里面的所有的表情处理掉
			var content = obj.content;
			// 通过正则表达式 匹配到所有的[\]之间的内容 并将[]与\ 去掉 剩余的替换成img标签
			var newContent = content.replace(/\[\\([a-zA-Z]+)\]/g, function(match, $1) {
				console.log(match, $1);
				return "<img src=/web/face/" + $1 + ".gif  />"
			});
			obj.content = newContent;
			// 根据不同的目标发送给不同的人
			if (obj.mode === "public") {
				io.sockets.emit("newMsg", obj);
			} else {
				// 此时要确定发送给谁
				var target = obj.target;
				// 寻找数组中与target相同的名称对象的id
				var id = "";
				arr.forEach(function(value) {
					if (value.username === target) {
						id = value.id;
					}
				});

				// 假如确定下来目标用户了我们要发送给他信息
				io.to(id).emit("privateChat", obj);
			}
		});
	});

	return server;
}

module.exports = set;