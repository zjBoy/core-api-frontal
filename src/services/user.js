import request from '../utils/request';
import {server} from '../utils/constant';

export async function query() {
  return request('/api/users');
}

export async function queryCurrent() {
  return request(`${server}/api/currentUser`);
}


