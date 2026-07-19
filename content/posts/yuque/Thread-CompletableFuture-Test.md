---
title: 'Thread-CompletableFuture-Test'
urlname: 'ppb2lr'
date: '2022-07-16 18:23:10'
updated: '2023-04-17 15:36:57'
tags:
  - Java
  - 并发
description: 'Thread-CompletableFuture-Test'
---
Thread



```java
public class CompletableFutureDemo {
  long st = System.currentTimeMillis();

  /**
* 全流式处理转换成CompletableFuture[]+allOf组装成一个无返回值CompletableFuture，join等待执行完毕。返回结果whenComplete获取
*/
  @Test
  public void CompletableFutureTest() {
    // 结果集
    List<String> result = new ArrayList<>();
    // 需要处理的数据集 10个线程，每个线程处理一个str
    List<String> lists = Arrays.asList("a", "b", "c", "d", "e", "f", "g", "h", "i", "j");
    //定长10线程池
    ExecutorService exs = Executors.newFixedThreadPool(10);
    CompletableFuture[] cfs = lists.stream().map(str -> CompletableFuture.supplyAsync(() -> calc(str), exs)
                         //thenAccept只接受不返回不影响结果
                         .thenApply("final-"::concat)
                         //获取任务完成先后顺序
                         .whenComplete((v, e) -> {
                          System.out.println("任务" + v + "完成!result=" + v + "，异常 e=" + e + "," + new Date());
                                                   result.add(v);
                                                 })).toArray(CompletableFuture[]::new);
    //等待总任务完成，但是封装后无返回值，必须自己whenComplete()获取
    CompletableFuture.allOf(cfs).join();
    System.out.println("任务完成先后顺序，结果list2=" + result + ",耗时=" + (System.currentTimeMillis() - st));
    exs.shutdown();
    Assert.assertTrue(CollUtil.isNotEmpty(result));
  }

  /**
* 循环创建CompletableFuture list,组装返回一个有返回值的CompletableFuture，返回结果get()获取
*/
  @Test
  public void CompletableFutureTest2() {
    // 结果集
    List<String> result;
    // 需要处理的数据集 10个线程，每个线程处理一个str
    List<String> lists = Arrays.asList("a", "b", "c", "d", "e", "f", "g", "h", "i", "j");
    //定长10线程池
    ExecutorService exs = Executors.newFixedThreadPool(10);
    List<CompletableFuture<String>> futureList = new ArrayList<>();
    try {
      for (String str : lists) {
        //异步执行
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> calc(str), exs)
          //thenAccept只接受不返回不影响结果
          .thenApply("final-"::concat)
          //如需获取任务完成先后顺序，此处代码即可
          .whenComplete((v, e) ->
                        System.out.println("任务" + v + "完成!result=" + v + "，异常 e=" + e + "," + new Date()));
        futureList.add(future);
      }
      //1.构造一个空CompletableFuture，子任务数为入参任务list size
      CompletableFuture<Void> allDoneFuture = CompletableFuture
        .allOf(futureList.toArray(new CompletableFuture[futureList.size()]));
      //2.流式（总任务完成后，每个子任务join取结果，后转换为list）
      result = allDoneFuture.thenApply(v -> futureList.stream().map(CompletableFuture::join)
                                       .collect(Collectors.toList())).get();
      System.out.println("任务完成先后顺序，结果list2=" + result + ",耗时=" + (System.currentTimeMillis() - st));
      Assert.assertTrue(CollUtil.isNotEmpty(result));
    } catch (InterruptedException | ExecutionException e) {
      e.printStackTrace();
    } finally {
      exs.shutdown();
    }

  }

  private String calc(String str) {
    try {
      if (str.equals("a")) {
        Thread.sleep(3000);
      } else if (str.equals("b")) {
        Thread.sleep(5000);
      } else {
        Thread.sleep(1000);
      }
      str = str.concat("_").concat(Thread.currentThread().getName());
    } catch (InterruptedException e) {
      e.printStackTrace();
    }
    return str;
  }
}
```

