---
title: '前端el-date-picker标签异常排查小记'
urlname: 'bz3quw85fq0e088v'
date: '2023-05-09 19:19:38'
updated: '2023-05-09 20:15:53'
tags:
  - 前端
  - ElementUI
  - 踩坑
  - 排查
description: 'ElementUI el-date-picker 更新时数据为空的排查：用 this.$forceUpdate() 强制刷新视图。'
---
```javascript
<el-col layout-size="medium">
<el-form-item
  label="使用起止日期"
  prop="daterangeBeginAndEndTime"
>
  <el-date-picker
    v-model="dataAppyDetlLedFormEdit.daterangeBeginAndEndTime"
    :picker-options="pickerOptionsEidte"
    type="daterange"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    value-format="timestamp"
    :clearable="false"
    @blur="
      changePackageTime(
        dataAppyDetlLedFormEdit.daterangeBeginAndEndTime
      )
    "
  >
  </el-date-picker>
</el-form-item>
</el-col>

```

上述前端标签在update更新的时候使用起止日期显示内容一直为空，通常使用this.$forceUpdate()强制更新视图模型可以解决数据显示问题

看网上解释是说：数据层次太多导致render函数没有自动更新，需要调用this.$forceUpdate()强制刷新，触发updated生命周期。



this.$forceUpdate()的作用：迫使VUE实例重新渲染。注意此方法只影响实例本身和插入插槽内容的子组件，并非所有的子组件。



若使用本文方法还未解决，建议参考 vue双向绑定失效，视图不更新，$set()失效解决办法，使用时间戳加强制更新的方式解决此类问题。

但该处不是此原因。

```javascript
    showEditDialog(row) {
      this.dataAppyDetlLedFormEdit = Object.assign({}, row)
      this.operateType = 'update'
      this.dataAppyDetlLedFormEdit.daterangeBeginAndEndTime = new Array(2)

      this.dataAppyDetlLedFormEdit.daterangeBeginAndEndTime[0] = this.dataAppyDetlLedFormEdit.begntime
      this.dataAppyDetlLedFormEdit.daterangeBeginAndEndTime[1] = this.dataAppyDetlLedFormEdit.endtime
      this.editDialogVisible = true
      this.dataAppyDetlLedFormNoBegntimeEndtimeUpdate = true
      this.dataAppyDetlLedFormBegntimeEndtimeAdd = false

      this.$forceUpdate()
      console.log(
        'daterangeBeginAndEndTime' +
          this.dataAppyDetlLedFormEdit.daterangeBeginAndEndTime
      )
      console.log('begntime' + this.dataAppyDetlLedFormEdit.begntime)
      console.log('endtime' + this.dataAppyDetlLedFormEdit.endtime)
    },
    changePackageTime(daterangeBeginAndEndTime) {
      this.dataAppyDetlLedFormEdit.begntime = daterangeBeginAndEndTime[0]
      this.dataAppyDetlLedFormEdit.endtime = daterangeBeginAndEndTime[1]
      this.$forceUpdate()
    },
```





通过console.log观察测试环境为 时间戳

daterangeBeginAndEndTime1683625453000,1691401453000

而生产环境为

daterangeBeginAndEndTime <font style="color:rgb(56, 58, 66);background-color:rgb(250, 250, 250);">Thu Jan </font><font style="color:rgb(152, 104, 1);background-color:rgb(250, 250, 250);">0108</font><font style="color:rgb(56, 58, 66);background-color:rgb(250, 250, 250);">:</font><font style="color:rgb(152, 104, 1);background-color:rgb(250, 250, 250);">00</font><font style="color:rgb(56, 58, 66);background-color:rgb(250, 250, 250);">:</font><font style="color:rgb(152, 104, 1);background-color:rgb(250, 250, 250);">00</font><font style="color:rgb(56, 58, 66);background-color:rgb(250, 250, 250);"> CST </font><font style="color:rgb(152, 104, 1);background-color:rgb(250, 250, 250);">1970</font>,<font style="color:rgb(56, 58, 66);background-color:rgb(250, 250, 250);">Thu Jan </font><font style="color:rgb(152, 104, 1);background-color:rgb(250, 250, 250);">0108</font><font style="color:rgb(56, 58, 66);background-color:rgb(250, 250, 250);">:</font><font style="color:rgb(152, 104, 1);background-color:rgb(250, 250, 250);">00</font><font style="color:rgb(56, 58, 66);background-color:rgb(250, 250, 250);">:</font><font style="color:rgb(152, 104, 1);background-color:rgb(250, 250, 250);">00</font><font style="color:rgb(56, 58, 66);background-color:rgb(250, 250, 250);"> CST </font><font style="color:rgb(152, 104, 1);background-color:rgb(250, 250, 250);">1970</font>

该参数格式不对el-date-picker无法读取值导致无法显示内容

<font style="color:rgb(51, 51, 51);">对应java.util.Date，配置统一返回时间戳就比较容易了。 直接在yml配置即可。</font>

```yaml
spring:
  jackson:
    time-zone: Asia/Shanghai
    serialization:
      # Date返回前端转时间戳 但不能解决LocalDateTime转时间戳（JacksonCustomizerConfig类解决）
      write-dates-as-timestamps: true

```

