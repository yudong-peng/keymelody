# GitHub上传与CloudBase部署指南

适用版本：键间公开版v0.5.0。核对日期：2026-10-20。

## 先认识两个压缩包

| 文件 | 用途 | 使用方式 |
| --- | --- | --- |
| keymelody-v0.5.0-source.zip | GitHub保存源码 | 解压，进入keymelody-v0.5.0-source文件夹，上传其中的内容 |
| keymelody-v0.5.0-cloudbase.zip | CloudBase网站部署 | 解压后根目录直接为index.html、脚本和audio目录 |

GPT私密版继续开发；公开版只在选定稳定版本后手动更新。此次交付只准备上传文件，没有代你创建GitHub仓库或上传腾讯云。

## 一、上传GitHub源码

1. 登录GitHub，点击右上角“+”→“New repository”。
2. 仓库名建议 `keymelody`，说明可填“键间：游戏弹琴练习室”。
3. 初次建议选Private。源码仓库私有不影响CloudBase网站公开访问。
4. 不勾选自动创建README、.gitignore或许可证，避免与包内文件重复。创建空仓库。
5. 解压source.zip，进入内部的keymelody-v0.5.0-source文件夹。
6. 在空仓库首页选择“uploading an existing file”；已有文件的仓库则选“Add file → Upload files”。
7. 把该文件夹里面的文件和子文件夹拖入上传区，保留dist、docs、scripts目录结构。不要把ZIP作为唯一源码文件上传，也不要多套一层源码目录。Windows资源管理器如未显示.gitignore，可单独确认其已上传；本次包中其余文件没有依赖隐藏配置。
8. 提交消息可填：`发布键间公开版 v0.5.0 源码`。点击Commit changes。
9. 仓库首页应能直接看到README.md、package.json、dist、docs、scripts及4个检查脚本。

GitHub网页一次最多上传100个文件、单文件不超过25MiB。本包在这一范围内；若网页网络不稳定，可分批上传，或使用GitHub Desktop。

## 二、创建GitHub Release

1. 进入仓库的Releases，选择“Create a new release”或“Draft a new release”。
2. 新建标签 `v0.5.0`，目标分支选择保存本次源码的main。
3. 标题填写 `键间 KeyMelody v0.5.0`。
4. 将包内RELEASE_NOTES.md的内容复制到说明区。
5. 附加 `keymelody-v0.5.0-cloudbase.zip`；可同时附加源码ZIP和SHA256SUMS.txt。
6. 发布Release。私有仓库中的Release仍受仓库访问权限限制。

GitHub自动生成的Source code.zip包含整个仓库；它不是“首页在ZIP根目录”的CloudBase部署包。首次请使用专门提供的cloudbase.zip。

## 三、准备CloudBase环境与域名

1. 登录腾讯云并完成实名认证，进入CloudBase控制台。
2. 创建公开版环境，名称可设为 `keymelody-public`。当前网站只需静态托管，不必配置数据库、登录或云函数。
3. 计划中国内地正式上线时，先准备域名并办理ICP备案。
4. CloudBase官方当前说明：环境可作为备案资源，需个人版及以上、剩余有效期在6个月以上、开启云托管固定IP。以控制台“备案管理”的实际校验为准；无需仅为备案另买服务器。
5. 在CloudBase“备案管理”按引导办理，备案通过后再正式开通访问。若已有其他服务商备案，按要求办理腾讯云接入。

## 四、上传静态网站

1. 进入目标环境的“静态网站托管”。
2. 选择本地上传／文件管理上传静态资源。此项目为纯静态，无需npm install或npm run build；若出现强制构建模板，返回选择纯静态资源上传入口。
3. 解压cloudbase.zip，上传其中的全部文件和audio子文件夹到网站根目录。控制台若支持纯静态ZIP导入，也可以选择这个ZIP。
4. 确认网站根目录直接是 `/index.html`，而不是 `/dist/index.html` 或 `/keymelody-v0.5.0-cloudbase/index.html`。
5. 默认首页设置为 `index.html`。本网站没有服务器端路由，初次保持其他路由设置默认即可。
6. 平台默认域名只用于开发测试；正式公开使用绑定自己的域名。

## 五、绑定域名与HTTPS

1. 准备覆盖目标域名的SSL证书。
2. 在静态托管实例详情页找到自定义域名，或进入HTTP网关添加域名。
3. 使用应用模式，将整个静态托管映射到域名根路径。
4. 根据控制台提示完成TXT归属权校验、证书配置、CNAME解析。CNAME值复制实际控制台返回值，不能使用示例值。
5. 等待状态生效，用自己的HTTPS网址验证网站。
6. 添加实际备案号及平台要求的底部展示信息；按腾讯云指引在网站开通后30日内办理公安联网备案。本包未预填备案号，不能填写虚构编号。

## 六、验证公开版

- 用无痕窗口访问，不登录GPT也能打开。
- 页面标识为“公开版 · v0.5.0”。
- 标准21键、15键及吉他模拟琴盘可以切换。
- 六种采样均可加载试听；确认audio目录未漏传。
- 导入一小段曲谱，保存、自动演奏并拖动时间轴。
- 刷新后测试曲谱仍在当前浏览器中；换设备不会自动同步。
- 导出测试曲谱，确认备份功能正常。

## 七、以后的版本更新

1. GPT私密版继续开发，不自动改动本次发布ZIP或CloudBase。
2. 选定新公开版后，生成新的源码包、部署包、版本号和发布说明。
3. 更新GitHub源码，创建对应标签与Release。
4. 保存旧版部署包，从Release下载新包上传CloudBase。优先先上传音色与脚本等资源，最后更新index.html。
5. 按控制台说明刷新缓存，并用无痕窗口复查。当前文件使用版本查询参数；修改已发布音色时需同时更换manifest版本，避免旧缓存。
6. 出现问题时重新部署上一版完整包；程序回退不会恢复或跨域迁移浏览器数据。

暂时不配置Git自动部署，便于保持开发版与公开版更新节奏独立。以后接Git部署时，应使用专门的公开发布分支。

## 官方参考

- GitHub上传文件：https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- GitHub管理Release：https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository
- CloudBase静态托管：https://cloud.tencent.com/document/product/876/46900
- 纯静态项目部署：https://docs.cloudbase.net/hosting/web-hosting-static
- CloudBase备案要求：https://cloud.tencent.com/document/product/876/128405
- 自定义域名：https://docs.cloudbase.net/service/custom-domain
- 备案及上线后事项：https://cloud.tencent.com/document/product/243/39038
