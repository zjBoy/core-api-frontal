import request from '../utils/request';
import { serverwebapi } from '../utils/constant';

export async function list(params) {
  return request(`${serverwebapi}/tenant/list`, {
    method: 'POST',
    body: {
      ...params,
    method: 'post',
  },
});
}

export async function del(params) {
  return request(`${serverwebapi}/tenant/del`, {
    method: 'POST',
    body: {
      ...params,
    method: 'delete',
  },
});
}

export async function save(params) {
  return request(`${serverwebapi}/tenant/save`, {
    method: 'POST',
    body: {
      ...params,
    method: 'post',
  },
});
}
