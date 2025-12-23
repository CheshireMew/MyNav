# VPS部署完整指南

部署示例: `https://nav.yourdomain.com`

---

## 📋 部署前检查清单

**你需要准备**:
- ✅ VPS服务器
- ✅ 域名和DNS管理权限
- ✅ SSH连接能力

---

## 第一步: 配置域名DNS解析

### 1.1 添加A记录
在域名服务商添加DNS记录:
- **类型**: A
- **主机记录**: `nav` (或你想要的子域名)
- **记录值**: 你的VPS IP地址
- **TTL**: 默认(或600)

### 1.2 验证DNS生效
本地PowerShell执行:
```powershell
nslookup nav.yourdomain.com
```

---

## 第二步: 连接VPS并准备环境

### 2.1 SSH连接
```bash
ssh root@你的VPS_IP
```

### 2.2 更新系统
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 安装Node.js (v20 LTS)
```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装Node.js
nvm install 20
nvm use 20

# 验证
node -v && npm -v
```

### 2.4 安装依赖
```bash
# Git
sudo apt install git -y

# PM2 (进程管理)
npm install -g pm2

# Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 第三步: 部署项目

### 3.1 克隆代码
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/你的用户名/MyNav.git
cd MyNav
sudo chown -R $USER:$USER /var/www/MyNav
```

### 3.2 后端配置
```bash
cd /var/www/MyNav/server
npm install

# 配置环境变量
cp .env.example .env
nano .env
```

**生成JWT密钥**(在本地PowerShell):
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

编辑`.env`:
```env
JWT_SECRET=你生成的随机密钥
NODE_ENV=production
PORT=3001
```

**启动后端**:
```bash
pm2 start src/index.js --name mynav-server
pm2 save
pm2 startup
```

### 3.3 前端构建
```bash
cd /var/www/MyNav/frontend
npm install
npm run build
```

---

## 第四步: 配置Nginx

### 4.1 创建配置文件
```bash
sudo nano /etc/nginx/sites-available/mynav
```

**重要提示**: 如果你已有其他网站在运行,需要确保配置不冲突。

粘贴以下内容:
```nginx
server {
    listen 80;
    server_name nav.yourdomain.com;
    
    root /var/www/MyNav/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /sitemap.xml {
        proxy_pass http://localhost:3001/sitemap.xml;
    }
}
```

### 4.2 启用配置

**选项A: 独立配置文件**(推荐)
```bash
sudo ln -s /etc/nginx/sites-available/mynav /etc/nginx/sites-enabled/
```

**选项B: 合并到default**
如果选项A有冲突,可以直接编辑default:
```bash
sudo nano /etc/nginx/sites-available/default
```
在文件末尾添加上面的server块。

**测试并重启**:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### ⚠️ 常见问题: 与已有网站冲突

如果你已经有其他网站(如博客),可能遇到以下问题:

**问题1**: `default_server`优先级
- 移除 `/etc/nginx/sites-available/default` 中的 `default_server` 标记
- 或确保mynav配置在default之前加载

**问题2**: 端口80被占用
- 检查: `sudo netstat -tlnp | grep :80`
- 确保只有Nginx监听80端口

**解决方案**: 将mynav配置添加到default文件中,作为独立的server块。

---

## 第五步: 配置HTTPS (Let's Encrypt)

### 5.1 安装Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 获取SSL证书
```bash
sudo certbot --nginx -d nav.yourdomain.com
```

按提示操作:
1. 输入邮箱
2. 同意服务条款 (`Y`)
3. 是否重定向HTTP到HTTPS: 选 `2` (推荐)

**Certbot会自动**:
- ✅ 申请SSL证书
- ✅ 修改Nginx配置添加443端口
- ✅ 配置自动重定向

### 5.3 测试续期
```bash
sudo certbot renew --dry-run
```

---

## 第六步: 配置防火墙

```bash
# 允许SSH (重要!)
sudo ufw allow OpenSSH

# 允许HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

---

## 第七步: 验证部署

1. **访问网站**: `https://nav.yourdomain.com/#login`
2. **默认登录**: `admin` / `admin123`
3. **立即修改**: 密码和登录路径

---

## 🔧 常用维护命令

### 后端管理
```bash
pm2 status              # 查看状态
pm2 logs mynav-server   # 查看日志
pm2 restart mynav-server # 重启
```

### 更新代码
```bash
cd /var/www/MyNav
git pull

# 更新后端
cd server
npm install
pm2 restart mynav-server

# 更新前端
cd ../frontend
npm install
npm run build

# 重启Nginx
sudo systemctl reload nginx
```

### Nginx日志
```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## ❌ 常见问题排查

### 1. 网站显示其他网站内容
**原因**: Nginx配置优先级问题

**解决**:
```bash
# 检查配置顺序
ls -la /etc/nginx/sites-enabled/

# 将mynav配置移到default文件中
sudo nano /etc/nginx/sites-available/default
# 添加mynav的server块

sudo nginx -t && sudo systemctl reload nginx
```

### 2. API调用失败 (CORS错误)
**原因**: 前端API基础路径配置错误

**解决**:
前端代码应使用相对路径:
```javascript
const API_BASE = '/api'  // ✅ 正确
// 不要用: const API_BASE = 'http://localhost:3001/api'
```

### 3. 502 Bad Gateway
**原因**: 后端未启动

**解决**:
```bash
pm2 status
pm2 restart mynav-server
pm2 logs mynav-server
```

### 4. 登录后跳转循环
**原因**: 登录路径配置不一致

**检查**:
```bash
# 后端数据库
sqlite3 /var/www/MyNav/server/database.sqlite
SELECT login_path FROM users;
```

---

## 📦 数据备份

```bash
# 备份数据库
cp /var/www/MyNav/server/database.sqlite \
   ~/mynav_backup_$(date +%Y%m%d).sqlite

# 定期备份(可选)
crontab -e
# 添加: 0 2 * * * cp /var/www/MyNav/server/database.sqlite ~/backups/mynav_$(date +\%Y\%m\%d).sqlite
```

---

## 🎉 部署完成!

现在你的MyNav已成功部署,记得:
1. ✅ 修改默认密码
2. ✅ 自定义登录路径
3. ✅ 定期备份数据库
4. ✅ 关注PM2进程状态

**享受你的私人导航站!** 🚀
