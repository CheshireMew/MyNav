# MyNav - 简约高效的私人导航站

<p align="center">
  <img src="image.png" alt="MyNav首页" width="600">
</p>

> 一个现代化的个人导航网站,支持自动抓取网站元数据、分类管理、暗黑模式,助您打造个性化的上网入口。

## ✨ 特性

- 🚀 **自动抓取元数据** - 输入URL自动获取网站标题、描述和图标
- 📁 **分类管理** - 支持多级分类,拖拽排序
- 🔍 **全局搜索** - 快速查找已保存的链接
- 🌓 **暗黑模式** - 自动适应系统主题
- 🔐 **安全加固** - JWT认证 + bcrypt密码加密
- 📱 **响应式设计** - 完美适配桌面和移动端
- 🎨 **渐变图标** - 失效图标自动显示彩色渐变背景
- 🗂️ **数据导入导出** - 支持JSON格式批量导入导出 (测试文件: `test-bookmarks.json`)
- 🔗 **自定义菜单** - 顶部快捷链接
- 🗺️ **SEO优化** - 自动生成sitemap.xml

---

## 📚 文档

- 🚀 [VPS部署完整指南](docs/VPS_DEPLOYMENT.md) - 从零开始部署到生产环境
- 🔐 [安全特性说明](#🔒-安全特性)
- 📦 [数据导入导出](#导入浏览器书签)

---

## 🛠️ 技术栈

### 前端
- **React** - UI框架
- **Vite** - 构建工具
- Vanilla CSS

### 后端
- **Node.js** + **Express** - 服务端框架
- **SQLite** - 轻量级数据库
- **JWT** - 身份认证
- **bcrypt** - 密码加密
- **Cheerio** - 网页元数据抓取

---

## 📦 快速开始

### 前置要求

- Node.js >= 16
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/mynav.git
cd mynav
```

2. **安装后端依赖**
```bash
cd server
npm install
```

3. **配置环境变量**
```bash
cd server
cp .env.example .env
```

**修改JWT密钥** (重要!):

打开 `.env` 文件,替换 `JWT_SECRET` 的值:

```bash
# 方法1: 在线工具生成
# 访问 https://randomkeygen.com/ 复制一个"Fort Knox Passwords"

# 方法2: PowerShell生成 (Windows)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# 方法3: Linux/Mac生成
openssl rand -base64 32
```

4. **启动后端服务**
```bash
npm start
# 或使用PM2
pm2 start src/index.js --name mynav-server
```

5. **安装前端依赖**
```bash
cd ../frontend
npm install
```

6. **启动前端开发服务器**
```bash
npm run dev
```

7. **打开浏览器**
访问 `http://localhost:5173/#login` (默认登录入口)

默认账号: `admin` / `admin123`

---

## 🚀 生产部署

### 方法一: 传统部署

1. **构建前端**
```bash
cd frontend
npm run build
```

2. **配置Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/mynav/frontend/dist;
        try_files $uri /index.html;
    }
    
    # 后端API代理
    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

3. **使用PM2守护后端进程**
```bash
pm2 start server/src/index.js --name mynav
pm2 save
pm2 startup
```

### 方法二: Docker部署

```bash
# 即将支持...
docker-compose up -d
```

---

## 📖 使用说明

### 登录
- 访问 `http://your-domain/#login` (默认登录路径)
- 可在管理员设置中自定义登录路径

### 添加链接
1. 点击侧边栏"➕ 添加链接"
2. 输入URL,系统自动抓取信息
3. 选择分类并保存

### 管理分类
- 点击侧边栏"📂 管理分类"
- 支持添加、编辑、删除分类
- 支持子分类和拖拽排序

### 修改设置
- 点击侧边栏"⚙️"打开管理员设置
- 可修改用户名、密码、登录路径

### 导入浏览器书签

**查找浏览器书签文件** (隐藏文件):

**Windows**:
- Chrome: `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Bookmarks`
- Edge: `%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Bookmarks`

**macOS**:
- Chrome: `~/Library/Application Support/Google/Chrome/Default/Bookmarks`
- Edge: `~/Library/Application Support/Microsoft Edge/Default/Bookmarks`

**Linux**:
- Chrome: `~/.config/google-chrome/Default/Bookmarks`

复制书签文件到项目目录,然后在"数据导入导出"中导入即可。

> 💡 **提示**: 也可以使用项目自带的 `test-bookmarks.json` 作为示例

---

## 🔒 安全特性

-  JWT Token认证 (24小时有效期)
- ✅ bcrypt密码加密 (自动迁移明文密码)
- ✅ 登录速率限制 (15分钟最多5次尝试)
- ✅ 隐藏登录入口 (自定义hash路径)
- ⚠️ 部署时请配置HTTPS

---

## 📁 项目结构

```
MyNav/
├── server/              # 后端
│   ├── src/
│   │   ├── index.js    # 主入口
│   │   ├── db.js       # 数据库初始化
│   │   └── scraper.js  # 元数据抓取
│   ├── .env.example
│   └── package.json
├── frontend/            # 前端
│   ├── src/
│   │   ├── App.jsx     # 主组件
│   │   └── index.css   # 样式
│   └── package.json
└── README.md
```

---

## 🤝 贡献

欢迎提交Issue和Pull Request!

---

## 📄 License

[MIT](LICENSE)

---

## 🙏 致谢

灵感来源于各类导航站项目,感谢开源社区!

---

**⭐ 如果这个项目对你有帮助,请给个Star!**
