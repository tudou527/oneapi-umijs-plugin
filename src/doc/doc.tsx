import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

import style from './style.less';

interface IProps {
  schema: any[];
}
interface IUseSchemaState {
  apiList: any[];
  modelList: any[];
  selectApi: string;
  selectModel: string;
  activeTab: 'api' | 'model';
}

let timer: number = null as unknown as number;
const SearchIcon = () => <svg width="1em" height="1em" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path fill="#1890ff" d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6c3.2 3.2 8.4 3.2 11.6 0l43.6-43.5c3.2-3.2 3.2-8.4 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z" /></svg>;
const TagIcon = () => <svg width="1em" height="1em" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path fill="#1890ff" d="M938 458.8l-29.6-312.6c-1.5-16.2-14.4-29-30.6-30.6L565.2 86h-0.4c-3.2 0-5.7 1-7.6 2.9L88.9 557.2c-3.9 3.9-3.9 10.2 0 14.1l363.8 363.8c1.9 1.9 4.4 2.9 7.1 2.9s5.2-1 7.1-2.9l468.3-468.3c2-2.1 3-5 2.8-8zM459.7 834.7L189.3 564.3 589 164.6 836 188l23.4 247-399.7 399.7zM680 256c-48.5 0-88 39.5-88 88s39.5 88 88 88 88-39.5 88-88-39.5-88-88-88z m0 120c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z" /></svg>;
const FileIcon = () => <svg width="1em" height="1em" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path fill="#1890ff" d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326z m1.8 562H232V136h302v216c0 23.2 18.8 42 42 42h216v494zM504 618H320c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM312 490v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H320c-4.4 0-8 3.6-8 8z" /></svg>;

const javaTypeMap: { [key: string]: string } = {
  // 数字
  byte: 'number',
  integer: 'number',
  int: 'number',
  long: 'number',
  double: 'number',
  float: 'number',
  short: 'number',
  bigdecimal: 'number',
  biginteger: 'number',
  // 字符串
  character: 'string',
  char: 'string',
  string: 'string',
  // 布尔
  boolean: 'boolean',
  void: 'void',
};

// 获取具体的引用类型
function getTypeReference(type: any, oneApiSchema: any[]) {
  let nodes: { link: null | string; text: string }[] = [];
  const { name, classPath, items } = type;
  const targetModel = oneApiSchema.find((schema) => schema.classPath === classPath);

  if (targetModel) {
    const { className, classPath } = targetModel;
    nodes.push({
      link: classPath,
      text: className,
    });
  } else {
    nodes.push({
      link: null,
      text: name === 'List' ? 'Array' : javaTypeMap[name.toLowerCase()] || name,
    });
  }

  if (items) {
    const childNodes = items?.map((item: any) => getTypeReference(item, oneApiSchema));
    nodes = nodes.concat(childNodes).flat();
  }

  return nodes;
}

function useSchema(props: IProps) {
  const { schema } = props;
  const [state, setState] = useState<IUseSchemaState>({
    apiList: [],
    modelList: [],
    selectApi: '',
    selectModel: '',
    activeTab: 'api',
  });

  // 搜索
  const handleSearch = (e: any) => {
    clearTimeout(timer);
    
    timer = window.setTimeout(() => {
      const keyword = e.target.value;
      const newSchema = schema.slice().filter((s: any) => {
        const { description, classPath, services } = s;

        const descMatch = description?.description?.includes(keyword);
        const urlMatch = services?.some((s: any) => {
          return s.url.includes(keyword) || s.description?.description.includes(keyword)
        });

        return classPath.includes(keyword) || descMatch || urlMatch;
      });
      
      const { apiList, modelList } = getApiAndModel(newSchema);
      setState({
        ...state,
        apiList,
        modelList,
      });
    }, 160);
  }

  const getApiAndModel = (oneApiSchema: any[]) => {
    const apiList: any[] = [];
    const modelList: any[] = [];

    oneApiSchema.forEach((s: any) => {
      const { classPath, fileType, className } = s;
      let clsName = className;
  
      if (fileType === 'ENTRY') {
        apiList.push({
          title: clsName,
          desc: s.description?.description,
          classPath,
        });
      }
  
      if (fileType === 'RESOURCE') {
        modelList.push({
          title: clsName,
          desc: s.description?.description,
          classPath,
        });
      }
    });

    return { apiList, modelList };
  }

  const updateActive = (type: 'api' | 'model', key?: string) => {
    const newState: { [key: string]: string } = {
      activeTab: type,
    };

    if (key) {
      if (type === 'api') {
        newState.selectApi = key;
      } else {
        newState.selectModel = key;
      }
    }

    setState({ ...state, ...newState });
  }

  useEffect(() => {
    const { hash } = window.location;
    const { apiList, modelList } = getApiAndModel(schema);

    let newState = {
      apiList,
      modelList,
      selectApi: apiList[0].classPath,
      selectModel: modelList[0].classPath,
    } as unknown as IUseSchemaState;

    if (hash) {
      const matchSchema = schema.find((s: any) => s.classPath === hash.slice(1));
      if (matchSchema) {
        if (matchSchema.fileType === 'ENTRY') {
          newState.activeTab = 'api',
          newState.selectApi = matchSchema.classPath;
        } else {
          newState.activeTab = 'model',
          newState.selectModel = matchSchema.classPath;
        }
      }
    }

    setState({ ...state, ...newState });
  }, []);

  return {
    apiList: state.apiList,
    modelList: state.modelList,
    selectApi: state.selectApi,
    selectModel: state.selectModel,
    activeTab: state.activeTab,
    updateActive,
    searchDoc: handleSearch,
  };
}

export default function ApiDoc(props: IProps) {
  const { schema = [] } = props;
  const modelRef = useRef<any>();
  const apiRef = useRef<any>();
  const {
    apiList,
    modelList,
    activeTab,
    selectApi,
    selectModel,
    updateActive,
    searchDoc,
  } = useSchema({ schema });

  // 转换类型
  const convertType = (type: any) => {
    const resData = getTypeReference(type, schema);

    return (
      <>
        {resData.map((data, index: number) => (
          <span key={index}>
            {data.link ? (
              <a href={`#${data.link}`} onClick={() => handleSwitchModel(data.link)}>
                {data.text}
              </a>
            ) : (
              <span>{data.text}</span>
            )}
            {index + 1 < resData.length ? <>&lt;</> : null}
          </span>
        ))}
        {new Array(resData.length - 1).fill('').map((_: any, index: number) => (
          <span key={index}>&gt;</span>
        ))}
      </>
    );
  };

  // 切换 API
  const handleSwitchApi = (classPath: string | null) => {
    const activeApi = schema.find((m: any) => m.classPath === classPath);

    if (activeApi) {
      updateActive('api', activeApi.classPath);
    }
  };

  // 切换到模型
  const handleSwitchModel = (classPath: string | null) => {
    const activeModel = schema.find((m: any) => m.classPath === classPath);

    if (activeModel) {
      updateActive('model', activeModel.classPath);
    }
  };

  // 渲染表格
  const renderTable = (args: { columns: any[], dataSource: any[] }) => {
    if (args.dataSource.length === 0) {
      return (
        <div className={style.empty}>无数据</div>
      );
    }

    return (
      <table>
        <thead>
          <tr>
            {args.columns.map((column: any, index: number) => {
              return (
                <th
                  width={column.width}
                  key={index.toString()}
                >{column.title}</th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {args.dataSource.map((data: any) => {
            return (
              <tr key={data.key}>
                {args.columns.map((column) => {
                  const { dataIndex, render } = column;
                  return (
                    <td key={dataIndex}>
                      {render ? render(data[dataIndex], data) : data[dataIndex]}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  // 文档
  const renderApiDoc = () => {
    const apiSchema = schema.find((s: any) => s.classPath === selectApi);

    if (!apiSchema) {
      return null;
    }

    const columns = [
      {
        title: '参数',
        dataIndex: 'name',
      },
      {
        title: '参数来源',
        dataIndex: 'in',
        render: (_val: boolean, rec: any) => {
          if (rec.method === 'POST') {
            return 'Body';
          }
          if (rec.isPathVariable) {
            return 'UrlParams';
          }

          return 'QueryParams';
        },
      },
      {
        title: '是否必须',
        width: 150,
        dataIndex: 'isRequired',
        render: (val: boolean) => (val ? '是' : '否'),
      },
      {
        title: '类型',
        dataIndex: 'jsType',
        render: (_val: boolean, rec: { type: any }) => {
          return convertType(rec.type);
        },
      },
    ];

    return (
      <>
        {apiSchema.services?.map((service: any, index: number) => {
          const { type, url, operationId, description, parameter, response } = service;
          return (
            <div key={index} className={style.docCard}>
              <div className={style.apiTitle}>
                <div className={type === 'GET' ? style.getApi : style.postApi}>{type}</div>
                {url}
              </div>
              {description.description ? (
                <div className={style.desc}>{description.description}</div>
              ) : null}
              <div className={style.contentItem}>
                <h4>Class</h4>
                <pre>{apiSchema.classPath}</pre>
              </div>
              <div className={style.contentItem}>
                <h4>返回值</h4>
                <pre>{convertType(response.type)}</pre>
              </div>
              <div className={style.contentItem}>
                <h4>OperationId</h4>
                <pre>{operationId}</pre>
              </div>
              <div className={style.contentItem}>
                <h4>参数</h4>
                {renderTable({
                  columns,
                  dataSource: parameter.map((p: any, index: number) => ({
                    ...p,
                    method: type,
                    key: index,
                  })),
                })}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // 模型
  const renderModelDoc = () => {
    const modelSchema = schema.find((s: any) => s.classPath === selectModel);

    if (!modelSchema) {
      return null;
    }

    const columns = [
      {
        title: '名称',
        dataIndex: 'name',
      },
      {
        title: '类型',
        dataIndex: 'jsType',
        render: (_val: boolean, rec: { type: any }) => {
          return convertType(rec.type);
        },
      },
      {
        title: '名称',
        dataIndex: 'description',
        render: (desc: any) => {
          return desc.description;
        },
      },
    ];
    const { classPath, description, fields } = modelSchema;

    return (
      <div className={style.docCard}>
        <div className={style.apiTitle}>
          <span className={style.titleIcon}>
            <TagIcon />
          </span>
          {classPath}
        </div>
        {description.description && <div className={style.desc}>{description.description}</div>}
        <div className={style.contentItem}>
          <h4>Class</h4>
          <pre>{classPath}</pre>
        </div>
        <div className={style.contentItem}>
          <h4>字段列表</h4>
          {renderTable({
            columns,
            dataSource: (fields || []).map((f: any, index: number) => ({ ...f, key: index })),
          })}
        </div>
      </div>
    );
  };

  useLayoutEffect(() => {
    const container = activeTab === 'api' ? apiRef.current : modelRef.current;
    const activeNode = container?.querySelector(`.${style.activeTitle}`);
    if (activeNode) {
      const rect = activeNode.getBoundingClientRect();
      const parent = activeNode.parentNode.getBoundingClientRect();

      if (rect.top > parent.top + parent.height || rect.top < parent.top) {
        activeNode.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [selectApi, selectModel]);

  return (
    <div className={style.apiDoc}>
      <div className={style.menu}>
        <div className={style.apiTab}>
          <div className={style.tabHead}>
            <span
              onClick={() => updateActive('api')}
              className={activeTab === 'api' ? style.activeTab : ''}
            >
              API
            </span>
            <span
              onClick={() => updateActive('model')}
              className={activeTab === 'model' ? style.activeTab : ''}
            >
              Model
            </span>
          </div>
          <div className={style.search}>
            <input onKeyUp={searchDoc} placeholder="搜索 API/Model" />
            <div className={style.searchIcon}><SearchIcon /></div>
          </div>
          <div className={style.tabBody}>
            <div
              ref={apiRef}
              className={`${style.tabContent} ${activeTab === 'api' ? style.activeContent : ''}`}
            >
              {apiList.map((data) => (
                <a
                  key={data.classPath}
                  href={`#${data.classPath}`}
                  onClick={() => handleSwitchApi(data.classPath)}
                  className={`${style.apiTitle} ${
                    selectApi === data.classPath ? style.activeTitle : ''
                  }`}
                >
                  <div className={style.titleIcon}>
                    <FileIcon />
                  </div>
                  <h3>{data.title}</h3>
                  {data.desc ? <p>{data.desc}</p> : null}
                </a>
              ))}
            </div>
            <div
              ref={modelRef}
              className={`${style.tabContent} ${activeTab === 'model' ? style.activeContent : ''}`}
            >
              {modelList.map((data) => (
                <a
                  key={data.classPath}
                  href={`#${data.classPath}`}
                  onClick={() => handleSwitchModel(data.classPath)}
                  className={`${style.apiTitle} ${
                    selectModel === data.classPath ? style.activeTitle : ''
                  }`}
                >
                  <div className={style.titleIcon}>
                    <TagIcon />
                  </div>
                  <h3>{data.title}</h3>
                  {data.desc ? <p>{data.desc}</p> : null}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={style.main}>
        {activeTab === 'api' ? renderApiDoc() : renderModelDoc()}
      </div>
    </div>
  );
}