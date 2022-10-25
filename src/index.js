"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const https = __importStar(require("https"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const oneapi_cli_1 = require("oneapi-cli");
exports.default = (api) => {
    const { cwd, absTmpPath } = api.paths;
    // 临时目录
    let tempDir = (0, path_1.join)(absTmpPath, 'oneapi');
    if (!api.env) {
        // 未运行的情况下创建临时目录
        tempDir = (0, path_1.join)(cwd, 'src/.umi/oneapi');
        fs_extra_1.default.ensureDirSync(tempDir);
    }
    // oneapi.json 文件保存路径
    let oneApiSchemaPath = undefined;
    api.describe({
        key: 'oneapi',
        config: {
            schema(joi) {
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
            return Object.assign({ oneApiDoc: {
                    id: 'oneApiDoc',
                    path: '/umi/plugin/oneapi',
                    file: (0, path_1.join)(tempDir, './index.tsx'),
                } }, memo);
        });
    }
    // 返回 OneAPI Schema
    const getOneAPISchema = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!oneApiSchemaPath) {
            const { schemaPath } = api.config.oneapi;
            if (schemaPath.startsWith('http')) {
                try {
                    const data = yield (0, node_fetch_1.default)(schemaPath, {
                        agent: schemaPath.startsWith('https://') ? new https.Agent({ rejectUnauthorized: false }) : undefined,
                    }).then((res) => res.text());
                    // 保存 json 文件到本地
                    (0, fs_1.writeFileSync)((0, path_1.join)(tempDir, 'oneapi.json'), data.toString());
                }
                catch (e) {
                    api.logger.error(`load oneapi schema from ${schemaPath} failed.`);
                }
            }
            else {
                (0, fs_1.copyFileSync)((0, path_1.join)(cwd, schemaPath), (0, path_1.join)(tempDir, 'oneapi.json'));
            }
            oneApiSchemaPath = (0, path_1.join)(tempDir, 'oneapi.json');
        }
    });
    api.onGenerateFiles(() => __awaiter(void 0, void 0, void 0, function* () {
        if (api.isPluginEnable('oneapi')) {
            // 临时目录下增加 oneapi 文件夹
            if (!(0, fs_1.existsSync)(tempDir)) {
                (0, fs_1.mkdirSync)(tempDir);
                yield getOneAPISchema();
                // 复制 doc.tsx、style.less 到临时目录
                (0, fs_1.copyFileSync)((0, path_1.join)(__dirname, './doc/index.tsx'), (0, path_1.join)(tempDir, 'index.tsx'));
                (0, fs_1.copyFileSync)((0, path_1.join)(__dirname, './doc/doc.tsx'), (0, path_1.join)(tempDir, 'doc.tsx'));
                (0, fs_1.copyFileSync)((0, path_1.join)(__dirname, './doc/style.less'), (0, path_1.join)(tempDir, 'style.less'));
            }
        }
    }));
    // 注册 umijs oneapi 命令
    api.registerCommand({
        name: 'oneapi',
        fn: () => __awaiter(void 0, void 0, void 0, function* () {
            const { requestLibPath } = api.config.oneapi;
            yield getOneAPISchema();
            // 生成 service
            (0, oneapi_cli_1.generateService)({
                schema: oneApiSchemaPath,
                requestStr: requestLibPath,
                output: (0, path_1.join)(cwd, 'src/services'),
            });
        }),
    });
};
//# sourceMappingURL=index.js.map