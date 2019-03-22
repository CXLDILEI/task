const express = require('express'),
      router = express.Router(),
      path = require('path'),
      {user,task} =require('../model/sch'),
      multer = require('multer');

const storage =  multer.diskStorage({
    //__dirname 当前文件所在目录
    //process.cwd()  node工作目录
    destination:path.join(process.cwd(),'/public/upload'),
    filename:function (req,file,callback) {
        const h = file.originalname.split('.');
        const filename= `${Date.now()}.${h[h.length-1]}`
        callback(null,filename);
    }
});
//上传照片
const upload = multer({
    storage:storage,

})
router.post('/upload',function (req,res) {
    //指定保存到哪个目录
    upload.single('file')(req,res,function (err) {
        if( err ){
            return res.send({code:1,msg:'上传错误'})
        }
        return res.send({code:0,data:{
            src:`/upload/${req.file.filename}`
            }
        })
    })
});
//所有任务
router.post('/task/all',function (req,res) {
    if( !req.body ){
        res.send({code:1,msg:'参数错误'})
    }
    //超出截止日期任务结束
    task.find({finish:false}).then(
        function (data) {
            for (var i = 0; i < data.length; i++) {
                var nowDate = new Date(new Date().toLocaleDateString());
                var expDate = new Date(data[i].expiration);
                if( nowDate.getTime() > expDate.getTime()){
                    task.updateOne({_id:data[i]._id},{$set:{finish:true}},function (err,data) {
                    });
                }
            }
        }
    )
    Promise.all([
        task.find().populate('author receiver.user')
            .sort({_id:-1})
            .skip((req.body.page-1)*req.body.limit)
            .limit(Number(req.body.limit)),
        task.countDocuments()
    ]).then(function (data) {
        res.send({code:0,data:data[0],count:data[1]})
    })
});
//可接取任务
router.post('/task/can',function (req,res) {
    if( !req.body ){
        res.send({code:1,msg:'参数错误'})
    }
    if( req.session.user&&req.session.user._id ){
        Promise.all([
            task.find({finish:false,author:{$ne:req.session.user._id},'receiver.user':{$ne:req.session.user._id}}).populate('author')
                .sort({_id:-1})
                .skip((req.body.page-1)*req.body.limit)
                .limit(Number(req.body.limit)),
            task.countDocuments({finish:false})
        ]).then(function (data) {
            res.send({code:0,data:data[0],count:data[1]})
        });
    }else {
        Promise.all([
            task.find({finish:false}).populate('author')
                .sort({_id:-1})
                .skip((req.body.page-1)*req.body.limit)
                .limit(Number(req.body.limit)),
            task.countDocuments({finish:false})
        ]).then(function (data) {
            res.send({code:0,data:data[0],count:data[1]})
        });
    }
})

//不可接取任务
router.post('/task/cant',function (req,res) {
    if( !req.body ){
        res.send({code:1,msg:'参数错误'})
    }
    if( req.session.user&&req.session.user._id ){
        Promise.all([
            task.find({$or:[{finish:true},{author:req.session.user._id},{'receiver.user':req.session.user._id}]})
                .populate('author')
                .sort({_id:-1})
                .skip((req.body.page-1)*req.body.limit)
                .limit(Number(req.body.limit)),
            task.countDocuments({finish:true})
        ]).then(function (data) {
            res.send({code:0,data:data[0],count:data[1]})
        })
    }else{
        Promise.all([
            task.find({finish:true})
                .populate('author')
                .sort({_id:-1})
                .skip((req.body.page-1)*req.body.limit)
                .limit(Number(req.body.limit)),
            task.countDocuments({finish:true})
        ]).then(function (data) {
            res.send({code:0,data:data[0],count:data[1]})
        })
    }
})
//我发布的
router.post('/task/publish',function (req,res) {
    user.findOne({_id:req.session.user._id}).populate({
        path:'task.publish',
        opstion:{
            sort:{_id:-1},
            skip:(req.body.page-1)*req.body.limit,
            limit:(Number(req.body.limit))
        },
        populate: {
            path: 'author',
            select: 'username'
        }
    }).exec(function (err,data) {
        return res.send({code:0,data:data.task.publish,count:data.task.publish.length,})
    })
})
//我接取的
router.post('/task/receive',function (req,res) {
    user.findOne({_id:req.session.user._id}).populate({
        path:'task.receive',
        opstion:{
            sort:{_id:-1},
            skip:(req.body.page-1)*req.body.limit,
            limit:(Number(req.body.limit))
        },
        populate: {
            path: 'author',
            select: 'username'
        }
    }).exec(function (err,data) {
        return res.send({code:0,data:data.task.receive,count:data.task.receive.length,})
    })
})
//已完成的
router.post('/task/accomplish',function (req,res) {
    user.findOne({_id:req.session.user._id}).populate({
        path:'task.accomplish',
        opstion:{
            sort:{_id:-1},
            skip:(req.body.page-1)*req.body.limit,
            limit:(Number(req.body.limit))
        },
        populate: {
            path: 'author',
            select: 'username'
        }
    }).exec(function (err,data) {
        return res.send({code:0,data:data.task.accomplish,count:data.task.accomplish.length,})
    })
})
module.exports = router;
















