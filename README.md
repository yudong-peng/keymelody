# 键间 KeyMelody · 公开版 v0.6.2

键间是面向游戏弹琴爱好者的网页练习工具，支持多种琴盘、琴谱导入、动态按键提示、等待练习、节奏练习和自动演奏，帮助使用者熟悉键位、检查曲谱并练习节奏。

纯HTML/CSS/JavaScript，音色与网站同源，无后端、登录或构建依赖。

## 使用

- dist/：可直接部署的完整静态网站。
- docs/CLOUDBASE_UPDATE.md：上传腾讯云与更新现有应用的操作说明。
- RELEASE_NOTES.md：本次公开版相对v0.5.0的累计更新。
- THIRD_PARTY_NOTICES.md、dist/audio/licenses/：CC0音色来源与授权。
- docs/DEVELOPMENT_HISTORY.md：历史开发记录。

本地预览可运行：

```bash
python -m http.server 8000 --directory dist
```

然后访问http://localhost:8000/。Node.js仅用于检查，安装后在根目录运行npm test即可，不需要npm install。

CloudBase部署专用ZIP已去除外层文件夹，根目录直接是index.html。源码包采用dist目录，若从源码部署应将输出目录设置为dist。

用户曲谱、琴盘和设置保存在当前浏览器，重要内容请导出备份。自动演奏不向游戏发送键盘输入。Document PiP依赖浏览器支持，不提供系统鼠标穿透。六种真实采样采用CC0；音色授权不等于网站代码的开源许可，本次未新增项目代码许可证。
