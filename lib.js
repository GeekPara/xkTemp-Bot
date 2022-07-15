const axios = require('axios');
const qs = require('querystring');

const XkApis = {
	getUserInfo: 'https://usr.xinkaoyun.com/api/HSCPC/Login',
	getToken: 'https://usr.xinkaoyun.com/api/HSCApp/NewLogin_jiami',
	sendReport: 'https://twsb.xinkaoyun.com:8099/temp/report/studentSaveTemp',
};

// 主干
export async function main({
	// 解构入参对象
	mobile,
	password,
	childnum,
	dorm,
	address,
	headteacher,
}) {
	// 调用userInfo以及判断是否出错
	let userInfo = await getUserInfo(mobile, password, childnum);
	if (userInfo.resultCode !== 0)
		return {
			code: -3,
			msg: userInfo.data,
		};
	userInfo = userInfo.data;

	// 调用getToken以及判断是否出错
	let token = await getToken(mobile, password);
	if (token.resultCode !== 0)
		return {
			code: -4,
			msg: '鑫考云App登录失败',
		};
	token = token.token;

	// 调用sendReport以及返回响应
	let res = await sendReport(
		{ mobile, address, headteacher, dorm },
		userInfo,
		token
	);
	console.log(res);
	return res;
}

// 获取用户信息，对应鑫考电脑端登录API
async function getUserInfo(mobile, password, childnum) {
	// 发送POST请求
	let res = await axios.post(
		XkApis.getUserInfo,
		qs.stringify({
			// JS对象转表单body
			userName: mobile,
			password,
		})
	);

	// 非零错误码
	if (res.data.resultCode != 0) {
		return res.data;
	}

	// 正常状态码
	return {
		resultCode: 0,
		data: res.data.data.pardt[childnum],
	};
}

// 获取Token，对应鑫考手机端登录API
async function getToken(mobile, password) {
	// POST登录API
	let res = await axios.post(
		XkApis.getToken,
		qs.stringify({
			phone: Buffer.from(mobile).toString('base64'),
			password: Buffer.from(password).toString('base64'),
		})
	);
	if (res.data.resultCode != 0) {
		return res.data;
	}
	return {
		resultCode: 0,
		token: res.data.data.token,
	};
}

// 上报体温
async function sendReport(
	{ mobile, address, headteacher, dorm }, // 第一个入参，解构提供的基本信息
	{
		// 第二个入参，解构第一步获取的信息
		SchoolId: schoolId,
		GradeId: grade_id,
		GradeName: grade,
		JiBuId: jibu_id,
		JiBuName: jibu,
		ClassId: clazz_id,
		ClassName: clazz,
		StuName: student_name,
		StuSex: sex,
		UserId: userId,
		StudyCode: student_id,
	},
	token // 第三个入参，第二步获取的Token
) {
	let temperature = (35.8 + Math.random()).toFixed(1); // 随机体温35.8-36.8保留一位小数
	let data = {
		// 拼接请求体
		// 常量部分
		iscontact_patients: 0,
		hasto_riskareas: 0,
		iscontact_foreigner: 0,
		isfever_family: 0,

		// 第一步获取的学生信息
		sex,
		grade_id,
		jibu_id,
		schoolId,
		grade,
		jibu,
		clazz,
		student_name,
		userId,
		clazz_id,
		student_id,

		// 入参学生提供的信息
		mobile,
		teacher_header: headteacher,
		dormitory: dorm,
		address,

		temperature, // 体温
		userToken: token, // 第二步获取的Token
	};
	//    console.log(data)
	let res = await axios.post(XkApis.sendReport, qs.stringify(data)); // 发送请求

	// 处理异常
	if (res.data.state === 'fail') return { code: -5, msg: res.data.msg };

	// 正常返回
	return {
		code: 0,
		temperature,
	};
}

