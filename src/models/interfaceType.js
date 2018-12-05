import { list, del, save } from '../services/interfaceType';

export default {
  namespace: 'interfaceType',

  state: {
    currentItem: {},//当前选中行，给编辑模态框传值用
    modalType: 'add',//模态框新增/修改标识
    modalVisible:false,//模态框显示/隐藏标识
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
    *submit({ payload,callback }, { call, put }) {//后台新增/修改
      const response = yield call(save, payload);
      callback(response);
    },
    *del({ payload,callback }, { call, put }) {//后台删除
      const response = yield call(del, payload);
      callback(response);
    },
  },

  reducers: {
    edit(state, action) {//渲染模态框为编辑模式
      return {
        ...state, ...action.payload
      };
    },
    reload(state, action) {//重新加载整个页面
      return {
        ...state,
        modalVisible:false,
        data: action.payload,
      };
    },
  },
};
