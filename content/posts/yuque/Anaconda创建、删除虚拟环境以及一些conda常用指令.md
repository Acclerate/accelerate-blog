---
title: Anaconda创建、删除虚拟环境以及一些conda常用指令
urlname: xwscgerd41zcbll4
date: '2023-06-14 11:48:02'
updated: '2023-06-16 15:26:07'
---
## <font style="color:rgb(79, 79, 79);">一、Anaconda创建、删除和复制环境</font>
### **<font style="color:rgb(79, 79, 79);">1. 创建虚拟环境</font>**
```sql
 conda create -n your_env_name python=x.x
# 在创建环境的同时安装必要的包
conda create -n your_env_name numpy matplotlib python=x.x
# 在指定的虚拟环境中安装额外的包
conda install -n your_env_name package_name
#例子
conda create -n name python=3.9
#创建一个环境并且在创建时自动安装yml文件中的库
conda env create -n name -f environment.yml
```

**<font style="color:rgb(254, 44, 36);">查看已经安装的环境</font>**<font style="color:rgb(77, 77, 77);">(以下两条输出相同)</font>

```sql
conda-env list

base                  *  D:\tools\anaconda3
evn_dqs                  D:\tools\anaconda3\envs\evn_dqs
py3716                   D:\tools\anaconda3\envs\py3716


conda info --envs
```

### **<font style="color:rgb(79, 79, 79);">2. 激活虚拟环境</font>**
```sql
conda activate py3716
conda activate evn_dqs
conda activate base

# 退出当前环境
deactivate py3716
```

### **<font style="color:rgb(79, 79, 79);">3. 删除虚拟环境</font>**
```sql
conda remove -n py3716 --all
# 删除虚拟环境中的某个包：
conda remove --name your_env_name package_name
```

  
 	

## <font style="color:rgb(79, 79, 79);">二、conda常用指令</font>
  
   
 

