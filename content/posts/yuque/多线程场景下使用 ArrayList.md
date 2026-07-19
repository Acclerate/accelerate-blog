---
title: 多线程场景下使用 ArrayList
urlname: yct9c3cgbdkb3afl
date: '2023-04-15 15:04:46'
updated: '2023-06-02 11:57:32'
---
ArrayList应该是我们比较常用的集合了,在一般场景下使用是没有问题的，

但是如果在多线程场景下，应该怎么使用呢？

主要有两种方式，如下：



# 方式一：使用Collections.synchronizedList()
ArrayList 不是线程安全的，如果遇到多线程场景，

可以通过 Collections 的 synchronizedList 方法将其转换成线程安全的容器后再使用。

案例：

```java
public void testSynchronizedArrayList(){
	ArrayList<String> arrayList = new ArrayList<String>();
	arrayList.add("a");
	List<String> synchronizedList = Collections.synchronizedList(arrayList);
	synchronizedList.add("a");
}

```



#### <font style="color:rgb(79, 79, 79);"></font>
```java
//Collections.synchronizedList源码
public static <T> List<T> synchronizedList(List<T> list) {
	//判断数组是否实现了RandomAccess,如果是选择创建SynchronizedRandomAccessList对象
	//否则则创建SynchronizedList对象
	return (list instanceof RandomAccess ?
					new SynchronizedRandomAccessList<>(list) :
					new SynchronizedList<>(list));
}
//SynchronizedRandomAccessList源码
SynchronizedRandomAccessList(List<E> list) {
	super(list);
}
// SynchronizedList源码
SynchronizedList(List<E> list) {
	super(list);
	this.list = list;
}
// SynchronizedCollection源码
final Object mutex;     
// Object on which to synchronize
SynchronizedCollection(Collection<E> c) {
	this.c = Objects.requireNonNull(c);
	mutex = this;
}
// 然后其对应的add方法
final Object mutex;   //对mutex对象进行加锁，而不是对整个方法进行加锁，锁的粒度下降，效率提高
final Collection<E> c;

public boolean add(E e) {
	synchronized (mutex) {return c.add(e);}
}


```

# <font style="color:rgb(79, 79, 79);">方式二：使用CopyOnWriteArrayList</font>
<font style="color:rgb(77, 77, 77);">copyOnWriteArrayList相当于每次使用都会复制一份新的ArrayList</font>  
<font style="color:rgb(77, 77, 77);">保证隔离，这样子线程使用就安全了，但是有个缺点，就是比较费内存，而且如果是增删改场景较多的时候，数组复制会浪费较多的时间</font>  


```java
public void testCopyOnWrite(){
	CopyOnWriteArrayList<String> copyOnWriteArrayList = new CopyOnWriteArrayList<>();
	copyOnWriteArrayList.add("a");
}
```

#### <font style="color:rgb(79, 79, 79);">CopyOnWriteArrayList.add源码</font>
```java
final transient ReentrantLock lock = new ReentrantLock(); //可冲入锁

public boolean add(E e) {
    final ReentrantLock lock = this.lock;
//加锁
lock.lock();
try {
    //获取数组
    Object[] elements = getArray();
    //数组长度
    int len = elements.length;
    //复制数组
    Object[] newElements = Arrays.copyOf(elements, len + 1);
    //赋值，最后一个下标赋值为e
    newElements[len] = e;
    //重新设置数组元素
    setArray(newElements);
    return true;
} finally {
    //解锁
    lock.unlock();
}
}
//getArray
private transient volatile Object[] array; //使用了volatile 保证可见性和防止指令重排

final Object[] getArray() {
        return array;
    }
// setArray
final void setArray(Object[] a) {
    array = a;
}

```

