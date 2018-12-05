import request from '../utils/request';
import { serverwebapi } from '../utils/constant';

export async function list(params) {
  return request(`${serverwebapi}/webLog/list`, {
    method: 'POST',
    body: {
      ...params,
    method: 'post',
  },
});
}
