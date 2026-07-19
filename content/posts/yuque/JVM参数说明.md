---
title: 'JVM参数说明'
urlname: 'chbkb8ky7lwudhpx'
date: '2023-04-18 14:17:43'
updated: '2023-04-18 18:06:00'
tags:
  - Java
  - JVM
description: 'JVM参数说明'
---
```java
-Xms30720m -Xmx30720m -XX:MaxDirectMemorySize=1024m -XX:+PrintGC -XX:+PrintGCDateStamps -Xloggc:/home/admin/edas_logs/logs -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=10 -XX:GCLogFileSize=100m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/home/admin/edas_logs/logs -XX:+UseG1GC -XX:PermSize=512m -XX:MaxPermSize=512m -Xmn5G -XX:SurvivorRatio=8 -XX:-UseAdaptiveSizePolicy  -Dspring.cloud.alicloud.acm.group=hsa-mbs-local-prd -Dspring.application.name=hsa-mbs-local      


-XX:+UseG1GC -XX:PermSize=512m -XX:MaxPermSize=512m -Xmn5G -XX:SurvivorRatio=8 -XX:-UseAdaptiveSizePolicy  -Dspring.cloud.alicloud.acm.group=hsa-mbs-local-prd -Dspring.application.name=hsa-mbs-local     

```





```bash
JAVA_HOME="/home/admin/jdk1.8.0_261"
JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true -Xms4096m -Xmx4096m -Xmn2g - XX:PermSize=512m -XX:MaxPermSize=512m -XX:+DisableExplicitGC - XX:+UseConcMarkSweepGC -XX:+CMSParallelRemarkEnabled -XX:+UseFastAccessorMethods -XX:+UseCMSInitiatingOccupancyOnly"

```

```bash
JAVA_HOME="/home/admin/jdk1.8.0_261"
JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true -Xmsm8192m -Xmx8192m -Xmn4g -XX:PermSize=1024m -XX:MaxPermSize=1024m -XX:+DisableExplicitGC -XX:+UseConcMarkSweepGC -XX:+CMSParallelRemarkEnabled -XX:+UseFastAccessorMethods -XX:+UseCMSInitiatingOccupancyOnly"

```



参数说明



1.JVM(Java Virtual Machine)



1.-Xms    初始堆大小



2.-Xmx    最大堆大小



3.-Xmn    青年代大小



4.-Xss    每个线程的堆栈大小



5.-XX:+UseParNewGC    青年代垃圾收集方式为并行收集



6.-XX:+UseParallelOldGC   老年代垃圾收集方式为并行收集



7.-XX:ParallelGCThreads    并行收集器的线程数(最好与处理器数目相等)



8.-XX:MaxGCPauseMillis    每次青年代垃圾回收的最长时间(最大暂停时间)



9.-XX:+UseAdaptiveSizePolicy    自动选择青年代区大小和相应的Survivor区比例



10.-XX:GCTimeRatio    设置垃圾回收时间占程序运行时间的百分比



11.-XX:+ScavengeBeforeFullGC    Full GC前调用YGC



21.-XX:NewSize    青年代大小(for 1.3/1.4)



22.-XX:MaxNewSize    青年代最大值(for 1.3/1.4)



23.-XX:PermSize    设置持久代(perm gen)初始值



24.-XX:MaxPermSize    持久代最大值



2.CMS(Concurrent Mark-Sweep)



以牺牲吞吐量为代价来获得最短回收停顿时间的垃圾回收器。对于要求服务器响应速度的应用上，这种垃圾回收器非常适合。在启动JVM参数加上-XX:+UseConcMarkSweepGC ，这个参数表示对于老年代的回收采用CMS。CMS采用的基础算法是：标记—清除。



1.-XX:+UseConcMarkSweepGC    使用CMS内存收集



2.-XX:CMSFullGCsBeforeCompaction    多少次后进行内存压缩



3.-XX:+CMSParallelRemarkEnabled    降低标记停顿



4.-XX+UseCMSCompactAtFullCollection    在FULL GC的时候， 对年老代的压缩



5.-XX:+UseCMSInitiatingOccupancyOnly    使用手动定义初始化定义开始CMS收集



6.-XX:CMSInitiatingOccupancyFraction=70    使用cms作为垃圾回收，使用70％后开始CMS收集



7.-XX:CMSInitiatingPermOccupancyFraction    设置Perm Gen使用到达多少比率时触发



8.-XX:+CMSIncrementalMode    设置为增量模式





JVM初始分配的内存由-Xms指定，默认是物理内存的1/64

JVM最大分配的内存由-Xmx指定，默认是物理内存的1/4

默认空余堆内存小于40%时，JVM就会增大堆直到-Xmx的最大限制；空余堆内存大于70%时，JVM会减少堆直到 -Xms的最小限制。

因此服务器一般设置-Xms、-Xmx相等以避免在每次GC 后调整堆的大小。对象的堆内存由称为垃圾回收器的自动内存管理系统回收。

非堆内存分配：

JVM使用-XX:PermSize设置非堆内存初始值，默认是物理内存的1/64；

由XX:MaxPermSize设置最大非堆内存的大小，默认是物理内存的1/4。

-Xmn2G：设置年轻代大小为2G。

-XX:SurvivorRatio，设置年轻代中Eden区与Survivor区的比值。



