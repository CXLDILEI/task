const express = require('express'),
      router = express.Router(),
      crypto = require('crypto');
const {user,task} = require('../model/sch.js')

/*
  0 成功
  1 失败
  2 服务网错误
  4 ......
* */
router.get('/', function (req, res) {
    res.render('index', {
        login: req.session.login,
        user: req.session.user,
        title:'首页'
    })
});
//注册
router.get('/reg',function (req,res) {
    res.render('reg',{title:'注册'});
}).post('/reg',function (req,res) {
    // console.log(req.body);
    user.findOne({username: req.body.username}).then(function (data) {
        if( data ){
            return res.send({code:2,msg:'用户已存在'});
        }
        // 1. 指定用什么方式加密
        const c = crypto.createHash('sha256');
        // 2. 加密
        const password = c.update(req.body.password).digest('hex');
        user.create({
            username:req.body.username,
            password:password
        }).then(function (data) {
            return res.send({code:0,msg:'注册成功'});
        }).catch(function (err) {
            console.log(err);
        })
    }).catch(function (err) {
        console.log(err);
    })
});
//登录
router.get('/login',function (req,res) {
    res.render('login',{
        login:req.session.login,
        title:'登录'
    });
}).post('/login',function (req,res) {
    // console.log(req.body);
    user.findOne({username:req.body.username},function (err,data) {
        if( data ){
            if( data.used ){
                const c = crypto.createHash('sha256');
                // 2. 加密
                const password = c.update(req.body.password).digest('hex');
                if( password === data.password ){
                    req.session.login = true;
                    req.session.user = data;
                    return res.send({code:0,msg:"登录成功"})
                }
                return res.send({code:1, msg:'密码错误'})
            }
            return res.send({code:1,msg:'账户不可用,请联系管理员'})
        }
        return res.send({code:1, msg:'用户不存在'})
    }).catch(function (err) {
        console.log(err);
    })
});
//注销
router.get('/logout',function (req,res) {
    req.session.destroy();
    res.redirect('/')
});
//任务详情
router.get('/xq/:id',function (req,res) {
    task.findOne({_id:req.params.id}).populate('author receiver.user').exec(function (err,data) {
        //判断是否已经接取了
        if( req.session.user&& req.session.user._id ){
            var a;
            var str=[];
            for (var i = 0; i < data.receiver.length; i++) {
                str.push(String(data.receiver[i].user._id))
            }
            a =str.indexOf(req.session.user._id);
            //判断是否是自己发布的任务
            if( data.author._id == req.session.user._id ){
                var m = -1
            }
        }
        res.render('xq',{
                login: req.session.login,
                user: req.session.user,
                title:'详情-'+data.title,
                data:data,
                a,
                m
            })
    })
});
//接取任务
router.post('/xq/:id',function (req,res) {
    task.findOne({_id:req.params.id}).populate('author receiver.user').exec(function (err,data) {
        if( err ){
            console.log(err);
        }
        var str=[];
        //判断是否已经接取,接取过了不能再接取
        if( data.receiver.length ){
            for (var i = 0; i < data.receiver.length; i++) {
                str.push(String(data.receiver[i].user._id))
            }
            const a =str.indexOf(req.session.user._id);
            if( !(a==-1) )return;
        }
        //作者是本人，不能接取
        if( data.author._id == req.session.user._id ){
            var m = -1;
        }
        if( m ==-1 )return;
        Promise.all([
            task.updateOne({_id:req.params.id}, {$push:{receiver:{user:req.session.user._id}}}
                ),
            user.updateOne({_id:req.session.user._id},{$push:{'task.receive':req.params.id}})
        ]).then(function (data) {
            return res.send({code:0})
        })
    });
});
//提交评论
router.post('/task/finmsg',function (req,res) {
    var taskid = req.body.taskid;
    var str = taskid.split('/');
    task.findOne({_id:str[2]},function (err,data) {
        if( data.num === data.receiver.length ){
            task.updateOne({_id:str[2]},{$set:{finish:true}},function (err,data) {
            })
        }
    })
    Promise.all([
        task.updateOne({_id:str[2]},
            {$set:{
                    ['receiver.'+req.body.index+'.msg']:req.body.msg},
                    ['receiver.'+req.body.index+'.finmsg']:true,
            }),
        user.updateOne({_id:req.session.user._id},{$push:{'task.accomplish':str[2]}})
    ]).then(function (data) {
        res.send({code:0})
    })
})
module.exports=router;

















