const mongoose = require('mongoose');

//创建表单规则，类似一个表单的正则
const userSchema = new mongoose.Schema({
    username:{type:String,required:true},
    password:{type:String,required:true},
    used:{type:Boolean,required:true,default:false},//账号是否可用
    // 普通用户 1    管理员 10  超级管理员 999
    level: {type: Number, required: true, default: 1},
    task:{
        //发布的任务
        publish:{type:[{type:mongoose.Schema.Types.ObjectId,ref:'task'}]},
        //接取的任务
        receive: {type: [ {type: mongoose.Schema.Types.ObjectId, ref: 'task'} ]},
        // 已经完成的
        accomplish: {type: [ {type: mongoose.Schema.Types.ObjectId, ref: 'task'} ]}
    }
});
//任务
const taskSchema = new mongoose.Schema({
    title:{type:String},//标题
    content:{type:String},//内容
    author:{type:mongoose.Schema.Types.ObjectId, ref:'user'},//作者
    receiver: {type: [ {
        user:{type: mongoose.Schema.Types.ObjectId, ref: 'user'},
        msg:{type:String},
        finmsg:{type:Boolean,default:false}//是否评论过
        }]}, // 接取人
    time: {type: String,default:new Date()}, // 发布时间
    expiration:{type:String},//截至日期
    num: {type: Number},// 接取人数限制
    reward:{type:String},//奖励
    difficulty:{type:String},//难度
    finish:{type:Boolean,default:false}, //是否完成

});

const user  = mongoose.model('user',userSchema);
const task = mongoose.model('task', taskSchema);

module.exports={
    user,
    task
}















