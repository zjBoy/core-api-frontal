import { list, del, save } from '../services/webLog';

export default {
  namespace: 'webLog',

  state: {
    data: {
      list: [],
      pagination: {},
    },
  },

  effects: {
    *fetch({ payload }, { call, put }) {//后台查询
      const response = yield call(list, payload);
      yield put({
        type: 'reload',
        payload: response,
      });
    },
  },

  reducers: {
    reload(state, action) {//重新加载整个页面
      return {
        ...state,
        data: action.payload,
      };
    },
  },
};
