const express = require('express');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 9999;
const DATA_FILE = 'data.xlsx';

// 格式化日期时间为指定格式
const formatDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，需要+1
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
};

// 中文表头
const HEADER = [
  '项目名称',
  '甲方',
  '完成情况',
  '剩余工作',
  '影响',
  '开始日期',
  '结束日期',
  '状态',
  '备注'
];

// 用户列表
const USERS = ['zhengyu', 'lifan', 'houhanhan', 'lixiansheng'];

// 创建Excel表格（如果不存在）
const createExcelIfNotExists = () => {
  if (!fs.existsSync(DATA_FILE)) {
    const workbook = xlsx.utils.book_new();
    // const worksheet = xlsx.utils.json_to_sheet([], { header: HEADER });
    USERS.forEach(user => {
      const worksheet = xlsx.utils.json_to_sheet([], { header: HEADER });
      xlsx.utils.book_append_sheet(workbook, worksheet, user);
    });
    // xlsx.utils.book_append_sheet(workbook, worksheet, 'data');
    xlsx.writeFile(workbook, DATA_FILE);
  }
};

// 读取数据
const readData = () => {
  const workbook = xlsx.readFile(DATA_FILE);
  const worksheet = workbook.Sheets['data'];
  return xlsx.utils.sheet_to_json(worksheet, { header: 1 });
};

// 写入数据
/*const writeData = (jsonData) => {
  // console.log(jsonData);
  const workbook = xlsx.readFile(DATA_FILE);
  const worksheet = workbook.Sheets['data'];
  const newData = [...readData(), ...jsonData.map(entry => Object.values(entry))];
  xlsx.utils.sheet_add_json(worksheet, jsonData, { skipHeader: true, origin: -1 });
  xlsx.writeFile(workbook, DATA_FILE);
};*/
// 写入数据
const writeData = (userName, jsonData, ip) => {
  const workbook = xlsx.readFile(DATA_FILE);
  const worksheet = workbook.Sheets[userName];
  if (!worksheet) {
    return console.error(`Worksheet ${userName} does not exist.`);
  }
  const currentData = readData(userName);
  const newData = [...currentData, ...jsonData.map(entry => {
    const values = Object.values(entry)
    values.push(formatDate())
    values.push(ip);
    return values;
  })];
  xlsx.utils.sheet_add_json(worksheet, newData, { skipHeader: true, origin: -1 });
  xlsx.writeFile(workbook, DATA_FILE);
};

// 中间件
app.use(bodyParser.json());

// 创建Excel文件
createExcelIfNotExists();

// 接收JSON数据并存储到Excel表中
app.post('/api/projects', (req, res) => {
  const jsonData = req.body.data;
  const userName = req.body.userName;
  // 如果提交的用户名不存在，则返回405
  if (!USERS.includes(userName)) {
    res.status(405).json({ message: 'Invalid user name.' });
    // res.json({ message: 'No user.' });
  } else {
    // 提交的用户名存在，则存入excel
    writeData(userName, jsonData, req.ip);
    res.json({ message: 'Projects received and stored successfully.' });
  }
});

// 获取存储的项目数据
app.get('/api/projects', (req, res) => {
  const data = readData();
  res.json(data);
});

// 根据时间戳查询记录
app.get('/api/projects/:timestamp', (req, res) => {
  // const timestamp = req.params.timestamp;
  // const data = readData();
  // const filteredData = data.filter(entry => entry[2] <= timestamp && entry[3] >= timestamp);
  // res.json(filteredData);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
  // res.sendFile(`../../${__dirname}/client/dist/index.html`);
});