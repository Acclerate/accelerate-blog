---
title: 'Nginx 配置'
urlname: 'ad6kdk9vg1yulfz0'
date: '2026-07-11 15:12:43'
updated: '2026-07-15 10:20:31'
tags:
  - Nginx
description: '常用 Nginx 配置片段合集：SSL 证书、动静分离、直接返回文本、location 重写等。'
---
# 
## SSL证书
```plain
server {
    listen              443 ssl;
    server_name         web.guosen.com.cn;
    ssl_certificate     /usr/local/sdata/nginx/ssl/web.guosen.com.cn.cer;
    ssl_certificate_key /usr/local/sdata/nginx/ssl/web.guosen.com.cn.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:1m;
    ssl_session_timeout 5m;
    ssl_prefer_server_ciphers on;
}
```

## 直接返回内容
```plain
  location = /abc/.wel-know {
        default_type text/plain;
        return 200 'testbbbbbbbbbbbbbbbbbbbbbbbb';
    }
```

这样在访问 `/abc/.wel-know` 的时候就会直接返回 `testbbbbbbbbbbbbbbbbbbbbbbbb`了, 可以用来SSL验证

+ [nginx配置返回文本或json](https://www.cnblogs.com/freeweb/p/5944894.html)

## Nginx动静分离配置
```plain
server {
    listen       80;
    # 监听的域名
    server_name  local.momas.cc;
    # /index.html -> /
    if ($request_uri ~* "^(.*/)index\.html$") {
        return 301 $1;
    }
    # 首页
    location = / {
        root html/local.momas.cc;
    }
    # 静态资源文件夹
    location ^~ /static {
        root html/static;
    }
    # 拦截静态资源文件
    location ~ .*\.(html|htm|gif|jpg|jpeg|bmp|png|ico|js|css)$ {
    root html/local.momas.cc;
    }
    # 虚拟主机1,使用指定url匹配
    location /vhost1 {
        proxy_pass http://localhost:8080;
    }
    # 虚拟主机2,使用指定url匹配
    location /vhost2 {
        proxy_pass http://localhost:7070;
    }
}
# 拒绝所有异常地址访问,例如ip地址直接访问
server {
    listen       80 default_server;
    server_name  _;
    location / {
        return 404;
    }
}
```

可能有用的配置

```plain
try_files $uri $uri/ /index.html /index.html?$query_string;
```

示例

```plain
    server {
        listen         9527;
        server_name    localhost 127.0.0.1;

        location / {
            root        html/dist;
            index       index.html index.htm;

            add_header 'Access-Control-Allow-Origin' 10.1.18.8:8080;
            # 允许携带cookie请求
            add_header 'Access-Control-Allow-Credentials' 'true';
            # 允许跨域请求的方法：GET,POST,OPTIONS,PUT
            add_header 'Access-Control-Allow-Methods' 'GET,POST,OPTIONS,PUT';
            # 允许请求时携带的头部信息，*表示所有
            add_header 'Access-Control-Allow-Headers' *;
            # 允许发送按段获取资源的请求
            add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
            # 一定要有！！！否则Post请求无法进行跨域！
            # 在发送Post跨域请求前，会以Options方式发送预检请求，服务器接受时才会正式请求
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                # 对于Options方式的请求返回204，表示接受跨域请求
                return 204;
            }
        }

        # backend
        location /ops {
           proxy_pass http://10.1.18.8:8080;
           # CORS config start
           add_header Access-Control-Allow-Origin  *;
           add_header Access-Control-Allow-Methods '*';
           add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
           if ($request_method = 'OPTIONS') {
               return 204;
           }
           # CORS config end
        }
    }


```

参考资料

+ [Nginx实现动静分离](https://juejin.im/post/5c278bfd6fb9a049d81befd5)
+ [nginx 禁止ip直接访问](https://blog.csdn.net/u013372487/article/details/79380511)
+ [nginx redirect loop, remove index.php from url](https://stackoverflow.com/questions/21687288/nginx-redirect-loop-remove-index-php-from-url)
+ [Syntax:	location](http://nginx.org/en/docs/http/ngx_http_core_module.html#location)

## WebSocket
```plain
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

upstream websocket {
    server 127.0.0.1:8086;
}

server {
    listen       80;
    server_name  _;

    location / {
        proxy_pass http://websocket;
        
        proxy_redirect    off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
```

 参考

+ [Nginx反向代理websocket配置实例](https://www.cnblogs.com/zzw1986/p/5906592.html)
+ [Tengine](http://tengine.taobao.org/)
+ [Nginx 作为 WebSockets 代理](https://www.oschina.net/translate/websocket-nginx)
+ [NGINX as a WebSocket Proxy](https://www.nginx.com/blog/websocket-nginx/)
+ [nginx 命令行参数](https://www.jianshu.com/p/1b1b7ae2a44f)



## http跳https
```plain
server {
    # 监听的端口
    listen       80 default_server;
    # 监听的域名, _表示所有域名
    server_name  _;
    
    # 把所有请求重写到https
    rewrite ^(.*)$ https://$host$1 permanent;
    # 当服务器只支持https的时候, 就会返回497, 这个时候可以重定向到https
    error_page  497  https://$server_name$request_uri;
    # 所有访问80端口的请求都返回497
    location / {
        return 497;
    }
}
```

技术思路

1. 使用Nginx的rewrite
2. 使用301状态码重定向
3. 使用497状态码抛出错误并重定向
4. 返回一个带meta标签的html, 使用meta刷新功能指向https域名

参考资料

+ [Nginx 配置 HTTP 跳转 HTTPS](https://www.centos.bz/2018/02/nginx-%E9%85%8D%E7%BD%AE-http-%E8%B7%B3%E8%BD%AC-https/)
+ [http怎么做自动跳转https](https://blog.csdn.net/taiyang1987912/article/details/78898027)

## 负载均衡
```plain
# 代办点后端,要配置在server节点外
upstream hospital_agent_service {
   server 172.16.254.149:9003 weight=1;
   server 10.81.244.131:9003  weight=1;
}

server {

   # 代办点导入药品接口
   location = /hospital-agent-service/drug-agent-import/upload2 {
      # CORS start
      add_header Access-Control-Allow-Origin  *;
      add_header Access-Control-Allow-Methods '*';
      add_header Access-Control-Allow-Headers '*';
      if ($request_method = 'OPTIONS') {
         return 204;
      }
      # CORS end
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_pass http://hospital_agent_service/drug-agent-import/upload2;
   }
}
```

## 反向代理转发
```plain
# /xhapi/addRp -> http://172.16.218.36:9001/hospital-xinghao-service/prescription/add
location  ^~ /xhapi/addRp {
   proxy_pass http://172.16.218.36:9001/hospital-xinghao-service/prescription/add;
   proxy_set_header   Host            $host;
   proxy_set_header   X-Real-IP       $remote_addr;
   proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## jenkins
```plain
server {
    server_name     jenkins.medtpa.me;
    listen          80;
    listen          443;
    location  / {
        proxy_pass          http://localhost:10000;
        proxy_read_timeout  90;
        proxy_set_header    X-Forwarded-Host   $host:$server_port;
        proxy_set_header    X-Forwarded-Server $host;
        proxy_set_header    X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto  $scheme;
        proxy_set_header    X-Real-IP          $remote_addr;
    }  
}
```

```plain
# Jenkins
server {
    listen      80;
    server_name jenkins.gzch120.com;

    location / {
      proxy_set_header  Host              $host:$server_port;
      proxy_set_header  X-Real-IP         $remote_addr;
      proxy_set_header  X-Forwarded-For   $proxy_add_x_forwarded_for;
      proxy_set_header  X-Forwarded-Proto $scheme;

      # Fix the It appears that your reverse proxy set up is broken error.
      proxy_pass          http://127.0.0.1:2001;
      proxy_read_timeout  90;
      # proxy_redirect      http://127.0.0.1:2001 https://jenkins.gzch120.com;

      # Required for new HTTP-based CLI
      proxy_http_version 1.1;
      proxy_request_buffering off;
      # workaround for https://issues.jenkins-ci.org/browse/JENKINS-45651
      add_header 'X-SSH-Endpoint' 'jenkins.gzch120.com:50022' always;
    }
}
```

## 静态资源
```nginx
server {
    listen 80;
    listen 443;
    server_name sw-ui.medtpa.me;
    location / {
        root  html/sw-ui.medtpa.me;
        index index.html;
    }
    # suffix 指定后缀
    location ~* \.(mp4)$ {
        root /kingseok/data/media-163;
    }
}

```

## CORS
```nginx
server {
    listen 80;
    server_name open.medtpa.me;
    location ^ /open/file/ {
        alias      /kingseok/data/pdf/;
        add_header Access-Control-Allow-Origin  *;
        add_header Access-Control-Allow-Methods '*';
        add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

## SSL
```nginx
server {
    listen              443 ssl;
    server_name         api.agentpc.medtpa.me;
    ssl_certificate     /etc/nginx/ssl/api.agentpc.medtpa.me.pem;
    ssl_certificate_key /etc/nginx/ssl/api.agentpc.medtpa.me.key;
    location / {
        proxy_pass http://localhost:7071;
        # upload file size 上传文件体积最大6M
        client_max_body_size 6M;
    }
}
```

ssl 证书验证

> 建议把证书放到nginx配置文件目录下 `./ssl` 文件夹内
>

```plain
# crp 药师审方系统
server {
    listen              80;
    listen              443 ssl http2;
    listen              [::]:443 ssl http2;
    server_name         test.crp.gzch120.com;

    ssl_certificate     ssl/test.crp.gzch120.com.pem;
    ssl_certificate_key ssl/test.crp.gzch120.com.key;
    ssl_session_cache   shared:SSL:1m;
    ssl_session_timeout 1m;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

   location ^~ /.well-known/pki-validation/ {
        return 200 'abcdxxxxxxx';
   }
    
    location / {
        root /usr/share/nginx/html/test.crp.gzch120.com;
    }
}

```

+ [Configuring HTTPS servers](http://nginx.org/en/docs/http/configuring_https_servers.html)
+ [配置https时，no "ssl_certificate" is defined in server listening on SSL port while SSL handshaking](https://blog.csdn.net/Q378870458/article/details/79083487)
+ ssl的匹配先于server的匹配[Nginx 单IP下 配置多个server https 启示录](https://blog.csdn.net/liaosiqian/article/details/72730099)

## 重写URL
```plain
server {
    listen       80 default_server;
    listen       443 ssl;
    server_name  _;
    
    ssl_certificate      ssl/momas.cc.crt;
    ssl_certificate_key  ssl/momas.cc.key; 
    rewrite ^(.*)$   https://$host$1 permanent;
    error_page  497  https://$server_name$request_uri;
    location / {
        return 444;
    }
}
```

## 防盗链配置
```plain
location /download {
    # 加入至指定location 即可实现
    valid_referers none blocked *.momas.cc;
    
    if ($invalid_referer) {
           return 403;
    }
}
```

## 下载限速：
```plain
location /download {
    # 限制每S下载速度
    limit_rate 1m; 
    # 超过30 之 后在下载
    limit_rate_after 30m; 
}
```

## 创建IP黑名单
> 该配置不可直接复制使用
>

```plain
#封禁指定IP
deny 192.168.0.1;
allow 192.168.0.1;
#开放指定IP 段
allow 192.168.0.0/24;
#封禁所有
deny    all;
#开放所有
allow    all;
# 创建黑名单文件
echo 'deny 192.168.0.132;' >> balck.ip
#http 配置块中引入 黑名单文件
include       black.ip;
```

## 传递真实ip
```plain
set_real_ip_from  192.168.1.0/24;
set_real_ip_from  192.168.2.1;
set_real_ip_from  2001:0db8::/32;
real_ip_header    X-Forwarded-For;
real_ip_recursive on;
```

+ [nginx中获取真实ip](https://www.cnblogs.com/grimm/p/5841883.html)
+ [Module ngx_http_realip_module](https://nginx.org/en/docs/http/ngx_http_realip_module.html)

## 支持PHP
> 先安装并启动php-fpm服务,然后让nginx把所有请求都转发给php-fpm服务, php-fpm默认运行端口为9000
>

```plain
#surpport php
server {
    listen    80;
    server_name   blog.momas.cc;
    root /usr/local/webContent/blog.momas.cc;
    location ~* \.(js|css|svg)?$ { expires 12h;	}
    location ~* \.(gif|jpg|jpeg|png|ico|bmp|swf)$ { expires 30d; }

    location / {
        # root /usr/local/webContent/blog.momas.cc; #point to php root
        fastcgi_pass 127.0.0.1:9000; #php-fpm default 9000
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME /usr/local/webContent/blog.momas.cc/$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 自定义错误页
> 在server节点中添加` error_page 404 = /404.html` , 可以把web根目录下的404.html文件设置为404错误页面
>

```plain
server {
    listen       80;
    server_name  momas.cc;

    error_page 404 = /404.html;
    error_page 500 502 503 504 = /50x.html;

    location / {
        root   /usr/local/webContent/momas.cc;
        index  index.html index.htm;
    }
}
```

## 错误日志的设置
+ 语法：error_log /path/file level;
+ 默认：error_log logs/error.log error;
+ level是日志的输出级别，取值范围是debug、info、notice、warn、error、crit、alert、emerg，

