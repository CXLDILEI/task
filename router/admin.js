const express = require('express'),
      {user,task} =require('../model/sch'),
      crypto = require('crypto'),
      router = express.Router();

router.use(function (req,res,next) {
    if( req.session.login ){
        if( req.session.user.level>=10 ){
            return next()
        }
        return res.send('没有权限')
    }
    return res.send('没有登录')
});
//用户管理
router.get('/user', function (req, res) {
    user.find(function (err, data) {
        res.render('admin/user',{user:req.session.user,title:'用户管理'})
    })

}).post('/user', function (req, res) {
    // 从第几个开始查找 查找多少个
        Promise.all([
        user.find().skip((req.body.page - 1) * req.body.limit).limit(Number(req.body.limit)),
        user.countDocuments(), // 总共有多少条数据
    ]).then(function (data) {
            // console.log(data[0], data[1]);
        // code 成不成功  data 数据  count 总共数据的条数
        res.send({code: 0, data: data[0], count: data[1]})
    })

    // 总共多少条 / 当前显示多少条
    // 第一页  1   每页显示10
    // (当前页数 - 1) * 每页显示多少条
    // 从第几个开始查找计算方式  (3 - 1) * 10
    // 1.   0 9
    // 2.   10 19
    // 3.   20 29
});
//用户是否可用
router.post('/user/reused', function (req, res) {
    if( !req.body.user_id ){
        res.send({code:1,msg:'参数错误'})
    }
    user.findOne({_id:req.body.user_id},function (err,data) {
        //如果想要修改的用户权限大于当前用户权限
        if( data.level>=999 ){
            return res.send({code:1,data:'不能修改超级管理员'})
        }
        if( data.level>=req.session.user.level){
            return res.send({code:1,data:'权限不足'});
        }
        user.updateOne({_id: req.body.user_id}, {$set: {used: req.body.used}}, function () {
            res.send({code: 0, data: '修改成功'})
        })
    })
});
// 不管删除 update更新 添加 查找
router.post('/user/del', function (req, res) {
    if( !req.body._id ){
        res.send({code:1,msg:'参数错误'})
    }
    user.findOne({_id:req.body._id},function (err,data) {
        if( req.body._id===req.session.user._id ){
            res.send({code:1,msg:'不能删除自己'});
            return;
        }
        if( data.level>=999){
            res.send({code:1,msg:'不能删除超级管理员'});
            return;
        }
        if( req.session.user.level<999 && data.level>=10 ){
            return res.send({code:1,msg:'不能删除其他管理员'});
        }
        Promise.all([
            user.deleteOne({_id: req.body._id}),//删除用户数据
            task.deleteMany({author:req.body._id}),//删除用户发布文章
            task.updateMany({'receiver.user':req.body._id},{$pull:{'receiver':{user:req.body._id}}})//删除用户接取任务
        ]).then(function (data) {
            res.send({code:0});
        })
    })

});
//设置等级
router.post('/user/relevel', function (req, res) {
    if( !req.body._id ){
        res.send({code:1,msg:'参数错误'})
    }
    if( req.body.level>=999 ){
        res.send({code:1,msg:'不能添加超级管理员'});
        return;
    }
    if( req.body.level>req.session.user.level ){
        res.send({code:1,msg:'权限不足'});
        return;
    }
    user.findOne({_id:req.body._id},function (err,data) {
        if( data.level>=req.session.user.level ){
            res.send({code:1,msg:'权限不足'});
            return;
        }
        user.updateOne({_id: req.body._id},{$set:{level:req.body.level}}, function (err,data) {
            if( err ){
                return res.send("数据库错误")
            }
            return res.send({code:0,msg:'修改成功'})
        })
    })
});

//任务添加
router.get('/task/add',function (req,res) {
    res.render('admin/addtask',{
        title:'任务发布',
        user:req.session.user
    });
}).post('/task/add',function (req,res) {
    if( !req.body ){
        res.send({code:1,msg:'参数错误'})
    }
    const data = req.body;
    data.author = req.session.user._id;
    task.create(data,function (err,data) {
        if( err ){
            return res.send({code:1,data:"数据库错误"})
        }
        user.updateOne({_id:req.session.user._id},{$push:{'task.publish':data._id}},function (err,data) {
            res.send({code:0,data:'保存成功'})
        })
    });

});
router.get('/task/all',function (req,res) {
    res.render('admin/taskall',{title:'任务管理',user:req.session.user})
});
//删除文章
router.post('/task/del',function (req,res) {
    if( !req.body._id ){
        res.send({code:1,msg:'参数错误'})
    }
    task.findOne({_id:req.body._id}).populate('author').exec(function (err,data) {
        if( data.author.level>=999 && req.session.user.level<999){
            return res.send({code:1,msg:'不能删除超级管理员发布的任务'})
        }
        if( !(data.author._id == req.session.user._id)&& req.session.user.level<999){
            return res.send({code:1,msg:'不能删除其他管理员发布的任务'})
        }
        Promise.all([
            task.deleteOne({_id:req.body._id}),
            user.updateMany(
                {$or:[{'task.publish':req.body._id},{'task.receive':req.body._id},{'task.accomplish':req.body._id}]},
                {$pull:{'task.publish':req.body._id,'task.receive':req.body._id,'task.accomplish':req.body._id}}
            )
        ]).then(function (data) {
            res.send({code:0,msg:'删除成功'})
        })
    })

});
//修改密码
router.get('/resetpassword',function (req,res) {
    res.render('admin/resetpassword',{user:req.session.user,title:'修改密码'})
}).post('/resetpassword',function (req,res) {
    if( !req.body ){
        return res.send({code:1,msg:'参数错误'})
    };
    user.findOne({_id:req.session.user._id},function (err,data) {
        const b = crypto.createHash('sha256');
        // 2. 加密
        const beforepassword = b.update(req.body.beforepassword).digest('hex');
        const c = crypto.createHash('sha256');
        const password= c.update(req.body.password).digest('hex');
        if( !(data.password === beforepassword)  ){
            return res.send({code:1,msg:'旧密码输入错误'});
        }
        if(  password===beforepassword ){
            return res.send({code:1,msg:'新密码不能与旧密码相同'});
        }
        if( data.password === beforepassword ){
            user.updateOne({_id:req.session.user._id},{$set:{password:password}},function (err,data) {
            });
            return res.send({code:0,msg:'修改成功请重新登录'})
        }
    })
})

module.exports = router;














