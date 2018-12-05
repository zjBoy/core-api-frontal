import { isUrl } from '../utils/utils';

const menuData = [
  {
    name: '租户',
    icon: 'shop',
    path: 'ApiTenant',
    children: [{
      name: '租户列表',
      path: 'tenant-list'
    }]
  },
  {
    name: '应用',
    icon: 'appstore',
    path: 'ApiApp',
    children: [{
      name: '应用列表',
      path: 'app-list'
    },{
      name: '应用接口关系',
      path: 'appInterface-list'
    },{
      name: '应用接口配置',
      path: 'appInterfaceCfg-list'
    }]
  },
  {
    name: '接口',
    icon: 'api',
    path: 'ApiInterface',
    children: [{
      name: '接口配置',
      path: 'interfaceType-list'
    }, {
      name: '接口Head',
      path: 'interfaceHead-List'
    }, {
      name: '接口参数',
      authority: 'admin',
      path: 'interfaceValidation-list'
    }, {
      name: '枚举转换',
      authority: 'admin',
      path: 'enumConvert-list'
    }]
  },
  {
    name: '配置',
    icon: 'tool',
    path: 'ApiCfg',
    children: [{
      name: '重试',
      path: 'retryCfg-list'
    }, {
      name: '通知MQ',
      path: 'notificationCfg-list'
    }, {
      name: '结果缓存配置',
      path: 'resultCacheCfg-list'
    }]
  },
  {
    name: '日志',
    icon: 'safety',
    path: 'ApiCfg/webLog-list',
  },{
  name: '账户',
  icon: 'user',
  path: 'user',
  authority: 'guest',
  children: [{
    name: '登录',
    path: 'login',
  }, {
    name: '注册',
    path: 'register',
  }, {
    name: '注册结果',
    path: 'register-result',
  }],
}];

function formatter(data, parentPath = '/', parentAuthority) {
  return data.map((item) => {
    let { path } = item;
    if (!isUrl(path)) {
      path = parentPath + item.path;
    }
    const result = {
      ...item,
      path,
      authority: item.authority || parentAuthority,
    };
    if (item.children) {
      result.children = formatter(item.children, `${parentPath}${item.path}/`, item.authority);
    }
    return result;
  });
}

export const getMenuData = () => formatter(menuData);
