# OneAPI UmiJS 插件

> 🐝 [OneAPI](https://github.com/tudou527/OneAPI) 是一个用于替代 Swagger/SpringFox 的 API 工具，不需要修改后端代码，也不需要启动应用

此插件的作用是根据 OneAPI Schema 生成 services 及文档（参考了 `@umijs/plugin-openapi` 插件）

## 安装

```bash
npm i oneapi-umijs-plugin --save
```

## 配置
`config/config.ts` 或 `.umirc.ts` 中增加配置

```
plugins: [
  // 开启插件
  'oneapi-umijs-plugin',
],

oneapi: {
  // services 中导入的 request 配置
  requestLibPath: "import { request } from 'umi';",
  // 使用相对路径或在线地址
  // schemaPath: "https://oneapi.app/docs/oneapi.json",
  schemaPath: "../oneapi-site/docs/oneapi.json",
}
```

run dev 时插件会自动添加文档路由，路径固定为：`/umi/plugin/oneapi`

![](https://github.com/tudou527/oneapi-umijs-plugin/blob/master/demo/demo.png?raw=true)

## 添加命令
`package.json` 中增加命令

```
"scripts": {
  "oneapi": "umi oneapi"
}
```

然后执行 `npm run oneapi` 即可生成 `src/services` 下生成对应的 services 文件
