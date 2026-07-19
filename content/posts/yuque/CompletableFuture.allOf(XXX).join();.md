---
title: 'CompletableFuture.allOf(XXX).join();'
urlname: 'hfk7qpxr11mg9k42'
date: '2023-04-15 14:05:37'
updated: '2023-06-29 09:25:49'
tags:
  - Java
  - 并发
description: '使用 CompletableFuture.allOf 等待多个异步任务全部完成后继续执行的代码示例。'
---
```java
public class Demo5 {
    public static void main(String[] args) {
        long time = System.currentTimeMillis();

        Map<String,Object> map = new ConcurrentHashMap<>();
        CompletableFuture.allOf(
                CompletableFuture.runAsync(() -> {
                    ThreadTool.printTimeAndThread("业务1开始执行了");
                    ThreadTool.sleepMillis(200);
                    map.put("1","执行完成");
                }),
                CompletableFuture.runAsync(() -> {
                    ThreadTool.printTimeAndThread("业务2开始执行了");
                    ThreadTool.sleepMillis(200);
                    map.put("2","执行完成");
                }),
                CompletableFuture.runAsync(() -> {
                    ThreadTool.printTimeAndThread("业务3开始执行了");
                    ThreadTool.sleepMillis(200);
                    map.put("3","执行完成");
                })
        ).join();

        long ms = System.currentTimeMillis() - time;
        System.out.println("办法总消耗时:" + ms + " ms");
        System.out.println(map.toString());

    }
}
```

```java
    @Override
    public List<Map<String, Object>> analysisSum(String bizDate) {
        List<Map<String, Object>> all= new CopyOnWriteArrayList<>();
        CompletableFuture.allOf(
                CompletableFuture.supplyAsync(() -> 
											  dirtyDataGroupDAO.queryDirtyDataAnalysisSumA(bizDate), 
											  commonThreadPool).thenApply(data -> all.addAll(data)),
                CompletableFuture.supplyAsync(() -> dirtyDataGroupDAO.queryDirtyDataAnalysisSumB(bizDate),
											  commonThreadPool).thenApply(data -> all.addAll(data)),
                CompletableFuture.supplyAsync(() -> dirtyDataGroupDAO.queryDirtyDataAnalysisSumC(bizDate),
											  commonThreadPool).thenApply(data -> all.addAll(data)),
                CompletableFuture.supplyAsync(() ->{map
                    Map<String, Object> map=new HashMap<>();
                    map.put("id","1");
                    map.put("label","现存脏数据总量");
                    map.put("pic","./assets/zlsjl.svg");
                    map.put("num",num);
                    map.put("unit","");
                    return map;
                },commonThreadPool).
                        thenApply(data -> all.add(data))
        ).join();
        return all;
    }
```

```java
List<CompletableFuture> futureAll = allSumEvtCdOs.stream().map(cdoList ->
 CompletableFuture.supplyAsync(() -> 
		 monSetlTcsNoclrSetldService.deleteNoclrSetlAndFund(cdoList.stream().map(data -> {
	 String strValue = data.getFixmedinsCode() + "-" + data.getFeeClrId() + "-" + data.getEvtsn();
	 boolean locking = AsyncLockTcsUtil.
		 islocking(TcsCacheConst.ASYNC_LOCK_ASYNC_INSERTLIQUIDATIONINFO_PRODUCER + timeStrKey, strValue);
	 if (locking) {
		 throw new RuntimeException("locking");
	 }
	 AsyncLockTcsUtil.lockMin(TcsCacheConst.ASYNC_LOCK_ASYNC_INSERTLIQUIDATIONINFO_PRODUCER + timeStrKey, strValue);
	 LiquNedUIDTO lieuNeedDTO = new LiquNedUIDTO();
	 lieuNeedDTO.setSemaphore(semaphore);
	 BeanUtils.copyProperties(data, lieuNeedDTO, LiquNedUIDTO.class);
	 return lieuNeedDTO;
 }).collect(Collectors.toList()), timeStrKey), commonThreadPool)).collect(Collectors.toList());
CompletableFuture.allOf(futureAll.toArray(new CompletableFuture[0])).join();
```

```java
@PostMapping("/executeMethod")
  private String executeMethod(){
    String bizDate = DateUtil.getCurrentDate_String("yyyy-MM-dd");
    List<String> synchronizedList = Collections.synchronizedList(new ArrayList<>());
    List<Map<String, Object>> mapList = dirtyDataGroupService.analysisSort(bizDate);
    mapList.forEach(data->synchronizedList.add(String.valueOf(data.get("SUBSYS_CODG"))));
    List<CompletableFuture> futureAll = synchronizedList.stream().map(subsysCodg ->
    CompletableFuture.supplyAsync(() -> dirtyDataGroupService.analysisBar(bizDate, subsysCodg)
    , commonThreadPool)).collect(Collectors.toList());
    CompletableFuture.allOf(futureAll.toArray(new CompletableFuture[0])).join();
    return "SUCCESS";
  }
```

