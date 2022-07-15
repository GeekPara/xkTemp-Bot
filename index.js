/**
 * Xinkao Temperature Daily Upload
 * QQBot Server
 * Copyright (c) GeekPara 2022.
 * Author: gbCzz
 */

import { createClient, segment } from 'oicq';
import fs from 'fs';
import SignUpStatus from './status.js';

const account = 2945673565;
const client = createClient(account);

let status = {};
let userData = JSON.parse(fs.readFileSync('./user.json'));

//登录
client.on('system.online', () => {
	console.log('Logged in!');
});

//监听扫码验证
client
	.on('system.login.qrcode', function (e) {
		//扫码后按回车登录
		process.stdin.once('data', () => {
			this.login();
		});
	})
	.login();

//监听新好友
client.on('request.friend', async (data) => {
	await data.approve();
	client.sendPrivateMsg(
		data.user_id,
		'欢迎使用鑫考体温自动打卡系统！\n发送“注册”以进行注册\n发送“关于”查看项目相关信息\n发送“赞助”以打赏作者'
	);
});

//监听私信
client.on('message.private', (data) => {
	if (data.raw_message == '关于') {
		client.sendPrivateMsg(
			data.sender.user_id,
			'本项目隶属于技术组织 GeekPara，创始于 2020 年，由 GeekPara CEO Juncial 发起，现转交 Czz 进行开发维护\n本项目开源于 https://github.com/GeekPara/xkTemp-Bot。\n关于 GeekPara，请访问 https://mdev.geekpara.com/about。'
		);
	} else if (data.raw_message == '赞助') {
		client.sendPrivateMsg(data.sender.user_id, [
			'打赏现任项目总监 Czz',
			segment.image('./img/supportByAliPay.jpg'),
			segment.image('./img/supportByWeChat.png'),
		]);
	} else if (data.raw_message == '注册') {
		status[data.sender.user_id] = {};
		status[data.sender.user_id].mode = SignUpStatus.INITING;
		userData[data.sender.user_id].user_id = data.sender.user_id;
		client.sendPrivateMsg(
			data.sender.user_id,
			'请按照提示进行注册，在任意时刻发送“取消”以终止注册流程'
		);
		client.sendPrivateMsg(data.sender.user_id, '请发送学生姓名：');

		status[data.sender.user_id].input = SignUpStatus.WAITING_FOR_NAME;

		userData[data.sender.user_id] = {};
	} else if (data.raw_message == '取消') {
		client.sendPrivateMsg(data.sender.user_id, '已终止注册流程');

		delete userData[data.sender.user_id];
	} else if (
		status[data.sender.user_id].input == SignUpStatus.WAITING_FOR_NAME
	) {
		userData[data.sender.user_id].name = data.raw_message;

		if (status[data.sender.user_id].mode == SignUpStatus.INITING) {
			client.sendPrivateMsg(
				data.sender.user_id,
				'请发送用于注册鑫考云校园的手机号：'
			);
			status[data.sender.user_id].input = SignUpStatus.WAITING_FOR_MOBILE;
		} else {
			status[data.sender.user_id].input = SignUpStatus.CHECKING;
		}
	} else if (
		status[data.sender.user_id].input == SignUpStatus.WAITING_FOR_MOBILE
	) {
		if (/1\d{10}/g.test(data.raw_message) == false) {
			client.sendPrivateMsg(
				data.sender.user_id,
				'手机号不符合格式，请检查修改后重新发送！'
			);
		} else {
			userData[data.sender.user_id].mobile = data.raw_message;

			if (status[data.sender.user_id].mode == SignUpStatus.INITING) {
				client.sendPrivateMsg(data.sender.user_id, '请输入密码：');
				status[data.sender.user_id].input =
					SignUpStatus.WAITING_FOR_PASSWORD;
			} else {
				status[data.sender.user_id].input = SignUpStatus.CHECKING;
			}
		}
	} else if (
		status[data.sender.user_id].input == SignUpStatus.WAITING_FOR_PASSWORD
	) {
		userData[data.sender.user_id].password = data.raw_message;

		if (status[data.sender.user_id].mode == SignUpStatus.INITING) {
			client.sendPrivateMsg(
				data.sender.user_id,
				'请发送您体温打卡时要填报的家庭住址：'
			);
			status[data.sender.user_id].input =
				SignUpStatus.WAITING_FOR_ADDRESS;
		} else {
			status[data.sender.user_id].input = SignUpStatus.CHECKING;
		}
	} else if (
		status[data.sender.user_id].input == SignUpStatus.WAITING_FOR_ADDRESS
	) {
		userData[data.sender.user_id].address = data.raw_message;

		if (status[data.sender.user_id].mode == SignUpStatus.INITING) {
			client.sendPrivateMsg(
				data.sender.user_id,
				'请发送您班主任的姓名：'
			);
			status[data.sender.user_id].input =
				SignUpStatus.WAITING_FOR_HEADTEACHER;
		} else {
			status[data.sender.user_id].input = SignUpStatus.CHECKING;
		}
	} else if (
		status[data.sender.user_id].input ==
		SignUpStatus.WAITING_FOR_HEADTEACHER
	) {
		userData[data.sender.user_id].headTeacher = data.raw_message;

		if (status[data.sender.user_id].mode == SignUpStatus.INITING) {
			client.sendPrivateMsg(data.sender.user_id, '请发送您的宿舍号：');
			status[data.sender.user_id].input = SignUpStatus.WAITING_FOR_DORM;
		} else {
			status[data.sender.user_id].input = SignUpStatus.CHECKING;
		}
	} else if (
		status[data.sender.user_id].input == SignUpStatus.WAITING_FOR_DORM
	) {
		if (
			data.raw_message.length != 4 ||
			/\d{4}/g.test(data.raw_message) == false
		) {
			client.sendPrivateMsg(
				data.sender.user_id,
				'宿舍号不符合格式，请检查修改后重新发送！'
			);
		} else {
			userData[data.sender.user_id].dorm = data.raw_message;
			status[data.sender.user_id].input = SignUpStatus.CHECKING;
		}
	}

	if (status[data.sender.user_id].input == SignUpStatus.CHECKING) {
		client.sendPrivateMsg(
			data.sender.user_id,
			`以下是您的体温打卡填报信息，请确认是否正确。如正确，请发送“确认”以完成注册。如不正确，请发送 修改xx 以修改相应信息（例：如要修改家庭住址，请发送 修改家庭住址 ）。\n姓名：${
				userData[data.sender.user_id].name
			}\n账号：${userData[data.sender.user_id].mobile}\n密码：${
				userData[data.sender.user_id].password
			}\n家庭住址：${
				userData[data.sender.user_id].address
			}\n班主任姓名：${
				userData[data.sender.user_id].headTeacher
			}\n宿舍号：${userData[data.sender.user_id].dorm}`
		);
		status[data.sender.user_id].input = SignUpStatus.WAITING_FOR_ACCEPT;
	} else if (
		status[data.sender.user_id].input == SignUpStatus.WAITING_FOR_ACCEPT
	) {
		status[data.sender.user_id].mode = SignUpStatus.EDITING;

		if (data.raw_message == '确认') {
			fs.writeFileSync(
				'./user.json',
				JSON.stringify(userData, null, '  ')
			);
			client.sendPrivateMsg(
				data.sender.user_id,
				'注册成功，将自动为您订阅每日打卡情况推送。\n欢迎加入用户反馈群，群号：418755490。\n如需注销服务请联系群主。'
			);
		} else if (data.raw_message == '修改姓名') {
			client.sendPrivateMsg(data.sender.user_id, '请发送学生姓名：');
			status[data.sender.user_id].input = SignUpStatus.WAITING_FOR_NAME;
		} else if (data.raw_message == '修改账号') {
			client.sendPrivateMsg(
				data.sender.user_id,
				'请发送用于注册鑫考云校园的手机号：'
			);
			status[data.sender.user_id].input = SignUpStatus.WAITING_FOR_MOBILE;
		} else if (data.raw_message == '修改密码') {
			client.sendPrivateMsg(data.sender.user_id, '请输入密码：');
			status[data.sender.user_id].input =
				SignUpStatus.WAITING_FOR_PASSWORD;
		} else if (data.raw_message == '修改家庭住址') {
			client.sendPrivateMsg(
				data.sender.user_id,
				'请发送您体温打卡时要填报的家庭住址：'
			);
			status[data.sender.user_id].input =
				SignUpStatus.WAITING_FOR_ADDRESS;
		} else if (data.raw_message == '修改班主任姓名') {
			client.sendPrivateMsg(
				data.sender.user_id,
				'请发送您班主任的姓名：'
			);
			status[data.sender.user_id].input =
				SignUpStatus.WAITING_FOR_HEADTEACHER;
		} else if (data.raw_message == '修改宿舍号') {
			client.sendPrivateMsg(data.sender.user_id, '请发送您的宿舍编号：');
			status[data.sender.user_id].input = SignUpStatus.WAITING_FOR_DORM;
		}
	}
});

