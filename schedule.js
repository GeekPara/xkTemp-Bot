/**
 * 每日定时任务
 * @param {*} config 定时设置
 * @param {function} task 需要定时执行的函数
 */
export function dailyTask(config, task) {
	
	//获取执行时间的时间戳
	let recent = new Date().setHours(config.hour, config.minute); 

	//获取下次要执行的时间，如果执行时间已经过了今天，就让把执行时间设到明天的按时执行的时间
	let nowTime = new Date().getTime();
	if (recent <= nowTime) {
		recent += 24 * 60 * 60 * 1000;
	}

	//未来程序执行的时间减去现在的时间，就是程序要多少秒之后执行
	let doRunTime = recent - nowTime;
	setTimeout(function () {
		task();
		//隔多少天再次执行
		let intTime = 24 * 60 * 60 * 1000;
		setInterval(function () {
			task();
		}, intTime);
	}, doRunTime);
}
