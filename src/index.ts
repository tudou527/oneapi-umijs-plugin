import { mkdirSync, existsSync, copyFileSync, writeFileSync } from 'fs';
import fsExtra from 'fs-extra';
import { join } from 'path';
import * as https from 'https';
import { IApi, IRoute } from 'umi';
import fetch from 'node-fetch';
import { generateService } from 'oneapi-cli';
 
export default (api: IApi) => {
  const { cwd, absTmpPath } = api.paths;
  // 临时目录
  let tempDir = join(absTmpPath, 'oneapi');

  if (!api.env) {
    // 未运行的情况下创建临时目录
    tempDir = join(cwd, 'src/.umi/oneapi');
    fsExtra.ensureDirSync(tempDir);
  }
  
  // oneapi.json 文件保存路径
  let oneApiSchemaPath: string = undefined as unknown as string;

  api.describe({
    key: 'oneapi',
    config: {
      schema(joi: any) {
        return joi.object({
          requestLibPath: joi.string(),
          schemaPath: joi.string(),
        });
      },
    },
    enableBy: api.EnableBy.config,
  });

  // 日常环境下，增加文档链接
  if (api.env === 'development') {
    // 增加文档路由
    api.modifyRoutes((memo) => {
      return {
        oneApiDoc: {
          id: 'oneApiDoc',
          path: '/umi/plugin/oneapi',
          file: join(tempDir, './index.tsx'),
        } as IRoute,
        ...memo,
      };
    });

    api.logger.info('add OneAPI document route for dev: /umi/plugin/oneapi');
  }
  
  // 返回 OneAPI Schema
  const getOneAPISchema = async () => {
    if (!oneApiSchemaPath) {
      const { schemaPath } = api.config.oneapi;

      if (schemaPath.startsWith('http')) {
        try {
          const data = await fetch(schemaPath, {
            agent: schemaPath.startsWith('https://') ? new https.Agent({ rejectUnauthorized:false }) : undefined,
          }).then((res: any) => res.text());

          // 保存 json 文件到本地
          writeFileSync(join(tempDir, 'oneapi.json'), data.toString());
        } catch (e) {
          api.logger.error(`load oneapi schema from ${schemaPath} failed.`);
        }
      } else {
        copyFileSync(join(cwd, schemaPath), join(tempDir, 'oneapi.json'));
      }

      oneApiSchemaPath = join(tempDir, 'oneapi.json');
    }
  };

  api.onGenerateFiles(async () => {
    if (api.isPluginEnable('oneapi')) {
      // 临时目录下增加 oneapi 文件夹
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir);

        await getOneAPISchema();

        // 复制 doc.tsx、style.less 到临时目录
        copyFileSync(join(__dirname, './doc/index.tsx'), join(tempDir, 'index.tsx'));
        copyFileSync(join(__dirname, './doc/doc.tsx'), join(tempDir, 'doc.tsx'));
        copyFileSync(join(__dirname, './doc/style.less'), join(tempDir, 'style.less'));
      }
    }
  });

  // 注册 umijs oneapi 命令
  api.registerCommand({
    name: 'oneapi',
    fn: async () => {
      const { requestLibPath } = api.config.oneapi;

      await getOneAPISchema();

      // 生成 service
      generateService({
        schema: oneApiSchemaPath,
        requestStr: requestLibPath,
        output: join(cwd, 'src/services'),
      });
    },
  });
};