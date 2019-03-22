const express = require('express');
const app = express();
const session = require('express-session');
const Mongosession = require('connect-mongo')(session);
const mongoose = require('mongoose');
//连接数据库
mongoose.connect('mongodb://localhost/a',{ useNewUrlParser: true });

// 使用方式  req.session.xxx = xxx
app.use(session({
    secret: 'tyfcxl', // 密钥
    rolling: true, // 每次操作(刷新页面  点击a标签  ajax) 重新设定时间
    resave: false, // 是否每次请求都重新保存数据
    saveUninitialized: false, // 初始值
    cookie: {maxAge: 1000 * 60 * 60},//存储时间
    store: new Mongosession({
        url: 'mongodb://localhost/a'
    })
}));

//获取post请求
app.use(express.json());
app.use(express.urlencoded({extended:false}));
//获取静态资源库
app.use(express.static(__dirname+'/public'));
//设置模板引擎
app.set('views',__dirname+'/view');
app.set('view engine','ejs');

app.use('/',require('./router/index.js'));
app.use('/api',require('./router/api.js'));
app.use('/admin',require('./router/admin.js'));


app.listen(6677);














