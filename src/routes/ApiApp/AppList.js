import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Row, Col, Card, Form, Input, Select, Radio,Button, Modal,InputNumber, message, Badge, Divider,Popconfirm,Icon  } from 'antd';
import StandardTable from 'components/StandardTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './AppList.less';
import axios from 'axios';
import {serverwebapi} from '../../utils/constant';

const { TextArea } = Input;
const FormItem = Form.Item;
const { Option } = Select;
const getValue = obj => Object.keys(obj).map(key => obj[key]).join(',');
const statusText = ["禁用", "启用"];
const status = ["error","success"];

//导入model/tenantapp
@connect(({ tenantapp, loading }) => ({
  tenantapp,
  loading: loading.models.tenantapp,
}))

//含查询条件Card，查询结果TableList,模态框Modal
@Form.create()
export default class TableList extends PureComponent {
  tenantList = [];
  callBackRetryCfgList = [];

  state = {
    selectedRows: [],
    formValues: {},
    searchForm: {},
    expandForm: false,
    errmsg:{},
    disabled: false,
  };

  componentDidMount() {
    axios.get(`${serverwebapi}/tenant/queryTenantListForSelect`)
      .then(res => {
        this.tenantList = res.data;

      });
    axios.get(`${serverwebapi}/retryCfg/queryCBListForSelect`)
      .then(res => {
        this.callBackRetryCfgList = res.data;

      });
    const {dispatch} = this.props;
    dispatch({
      type: 'tenantapp/fetch',
    });
  }
  getTenantList = () => {
    return this.tenantList;
  }
  getCallBackRetryCfgList = () => {
    return this.callBackRetryCfgList;
  }


  //列表分页检索排序
  handleStandardTableChange = (pagination, filtersArg, sorter) => {
    const { dispatch } = this.props;
    const { searchForm } = this.state;

    const filters = Object.keys(filtersArg).reduce((obj, key) => {
      const newObj = { ...obj };
      newObj[key] = getValue(filtersArg[key]);
      return newObj;
    }, {});
    const params = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      ...searchForm,
      ...filters,
    };
    if (sorter.field) {
      params.sorter = `${sorter.field}_${sorter.order}`;
    }

    dispatch({
      type: 'tenantapp/fetch',
      payload: params,
    });
  }
  handleSelectRows = (rows) => {
    this.setState({
      selectedRows: rows,
    });
  }
  handleFormReset = () => {
    const { form, dispatch } = this.props;
    this.props.tenantapp.currentItem = {};
    form.resetFields();
    this.setState({
      formValues: {},
      searchForm:{},
    });
    dispatch({
      type: 'tenantapp/fetch',
      payload: {},
    });
  }

  toggleForm = () => {
    this.setState({
      expandForm: !this.state.expandForm,
    });
  }

  //查询按钮事件
  handleSearch = (e) => {
    e.preventDefault();
    const { dispatch } = this.props;
    dispatch({
      type: 'tenantapp/fetch',
      payload: {
        ...this.state.searchForm ,
      }
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeTenantCode = (value) =>{
    const tenantCode = value;
    this.setState({
      searchForm: { ...this.state.searchForm, tenantCode },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeAppCode = (e) =>{
    e.preventDefault();
    const appCode = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, appCode },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeAppName = (e) =>{
    e.preventDefault();
    const appName = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, appName },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeAppStatus = (value) =>{
    const appStatus = value;
    this.setState({
      searchForm: { ...this.state.searchForm, appStatus },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeAppSecret = (e) =>{
    e.preventDefault();
    const appSecret = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, appSecret },
    });
  }
  //新增/修改时模态框控制
  handleModalVisible = (flag,modalType,currentItem) => {
    if (modalType === 'add') {
      const { form } = this.props;
      form.resetFields();
      this.setState({
        disabled: false,
      });
    }else if (modalType === 'edit') {
      currentItem.appStatus = currentItem.appStatus+'';
      currentItem.callbackRetryCfgId = currentItem.callbackRetryCfgId+'';
      this.setState({
        disabled: true,
      });
    }
    this.props.dispatch({
      type: 'tenantapp/edit',
      payload: {
        modalType: modalType,
        modalVisible: flag,
        currentItem: currentItem || {},
      }
    });
  };
  //模态框确定按钮事件
  okHandle = () => {
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.handleAdd({...this.props.tenantapp.currentItem,...fieldsValue});
    });
  };
  //模态框确定按钮事件请求路由
  handleAdd = (fields) => {
    this.props.dispatch({
      type: 'tenantapp/submit',
      payload: fields,
      callback:this.handleDbCallback,
    });
  }
  //服务器处理结果回调。成功则关闭并刷新列表。失败则弹窗
  handleDbCallback = (result) => {
    if(result.msg=="OK"){
      message.success('操作成功');
      this.props.form.resetFields();
      this.props.dispatch({
        type: 'tenantapp/fetch',
        payload: {
          modalVisible: false,
          currentItem:{},//清空缓存的选中行
          data:{pagination: {}}
        }
      });
    }else{
      message.config({
        top: 300,
        duration: 2,
      });
      message.error(result.msg);
    }
  };

  //批量删除按钮事件
  handleBatchDel = () => {
    const {dispatch} = this.props;
    const {selectedRows} = this.state;

    if (!selectedRows) return;

    const _ids = selectedRows.map(row => row._id).join(',');
    const appCodes = selectedRows.map(row => row.appCode).join(',');

    this.setState({
      selectedRows: [],
    });
    dispatch({
      type: 'tenantapp/del',
      payload: {
        _id: _ids,
        appCode: appCodes,
      },
      callback:this.handleDbCallback,
    });
  }
  //列删除按钮事件
  handleDel = (_id,appCode) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'tenantapp/del',
      payload: {
        _id: _id,
        appCode: appCode,
      },
      callback:this.handleDbCallback,
    });
  }

  //渲染查询条件表单
  renderSimpleForm() {
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="所属租户">
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeTenantCode}>
                {
                  this.getTenantList().map((tenant, index) => {
                    return (<Option key = {index} value={tenant.value}>{tenant.value}[{tenant.label}]</Option>)
                  })
                }
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="应用Code">
              <Input placeholder="请输入" onChange={this.handleChangeAppCode} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
          <span className={styles.submitButtons}>
            <Button type="primary" htmlType="submit">查询</Button>
            <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>重置</Button>
            <a style={{ marginLeft: 8 }} onClick={this.toggleForm}>
                展开 <Icon type="down" />
            </a>
          </span>
          </Col>
        </Row>
      </Form>
    );
  }

  //渲染查询条件表单
  renderAdvancedForm() {
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="所属租户">
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeTenantCode}>
                {
                  this.getTenantList().map((tenant, index) => {
                    return (<Option key = {index} value={tenant.value}>{tenant.value}[{tenant.label}]</Option>)
                  })
                }
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="应用Code">
              <Input placeholder="请输入" onChange={this.handleChangeAppCode} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="应用名称">
              <Input placeholder="请输入" onChange={this.handleChangeAppName} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="状态">
              <Select placeholder="请选择"  onChange={this.handleChangeAppStatus}>
                <Option value="" defaultValue="">全部</Option>
                <Option value="1" >禁用</Option>
                <Option value="2">启用</Option>
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <div style={{ overflow: 'hidden',float:"left" }}>
          <span style={{ float: 'right', marginBottom: 24 }}>
            <Button type="primary" htmlType="submit">查询</Button>
            <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>重置</Button>
            <a style={{ marginLeft: 8 }} onClick={this.toggleForm}>
              收起 <Icon type="up" />
            </a>
          </span>
            </div>
          </Col>
        </Row>
      </Form>
    );
  }

  renderForm() {
    return this.state.expandForm ? this.renderAdvancedForm() : this.renderSimpleForm();
  }

  //渲染列和模态框
  render() {
    const { tenantapp: { data }, loading,form } = this.props;
    const { selectedRows } = this.state;
    const { currentItem={}, modalType,modalVisible } = this.props.tenantapp;

    const columns = [
      {
        title: '租户',
        dataIndex: 'tenantCode',
        sorter: true,
        key:"tenantCode",
      },
      {
        title: '应用Code',
        dataIndex: 'appCode',
        sorter: true,
        key:"appCode",
      },
      {
        title: '应用名称',
        dataIndex: 'appName',
        sorter: true,
      },
      {
        title: '限流次数',
        dataIndex: 'callCount',
        sorter: true,
      },
      {
        title: '限流时间(s)',
        dataIndex: 'callCountUnit',
        sorter: true,
      },
      {
        title: '状态',
        dataIndex: 'appStatus',
        key:"appStatus",
        sorter: true,
        render(val) {
          return <Badge status={status[val-1]} text={statusText[val-1]} />;
        },
      },
      {
        title: '回调方式',
        dataIndex: 'callbackMethod',
        key:"callbackMethod",
        sorter: true,
      },
      {
        title: '更新时间',
        dataIndex: 'lastModifyTime',
        sorter: true,
        render: val => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: '更新人',
        dataIndex: 'lastModifyUser',
        sorter: true,
      },
      {
        title: '操作',
        render: (record) => (
          <span>
            <a href="javascript:void(0)" onClick={() => this.handleModalVisible(true, 'edit', record)}>修改</a>
            <Divider type="vertical" />
            <Popconfirm title="确定要删除?" onConfirm={() => this.handleDel(record._id,record.appCode)} okText="是" cancelText="否">
              <a href="#">删除</a>
            </Popconfirm>
          </span>
        ),
      },
    ];

    return (
      <PageHeaderLayout >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>
              {this.renderForm()}
            </div>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true,'add',{})}>
                新增
              </Button>
              {
                selectedRows.length > 0 && (
                  <span>
                    <Popconfirm title="确定要删除?" onConfirm={() => this.handleBatchDel()} okText="是" cancelText="否">
                      <a href="#">批量删除</a>
                    </Popconfirm>
                  </span>
                )
              }
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={loading}
              data={data}
              columns={columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleStandardTableChange}
            />
          </div>
        </Card>
        <Modal
          title={`${modalType === 'add' ? '新建' : '修改'}应用`}
          visible={modalVisible}
          onOk={() => this.okHandle()}
          onCancel={() => this.handleModalVisible()}
        >
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="所属租户">
            {form.getFieldDecorator('tenantCode', {
              initialValue: currentItem.tenantCode,
              rules: [{ required: true}],
            })(
            <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
              {
                this.getTenantList().map((tenant, index) => {
                  return (<Option key = {index} value={tenant.value}>{tenant.value}[{tenant.label}]</Option>)
                })
              }
            </Select>
            )}
          </FormItem>

          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="应用Code"
            extra="应用Code唯一，不能重复"
          >
            {form.getFieldDecorator('appCode', {
              initialValue: currentItem.appCode,
              rules: [{ required: true,whitespace:true}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled} />
            )}
          </FormItem>

          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="应用名称"
            extra="应用名称唯一，不能重复"
          >
            {form.getFieldDecorator('appName', {
              initialValue: currentItem.appName,
              rules: [{ required: true,whitespace:true}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="秘钥"
          >
            {form.getFieldDecorator('appSecret', {
              initialValue: currentItem.appSecret,
              rules: [{ required: false,whitespace:true,}],
            })(
              <Input placeholder="请输入" />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="限流次数"
            extra="大于等于0。0表示不限制"
          >
            {form.getFieldDecorator('callCount', {
              initialValue: currentItem.callCount,
              rules: [{ required: true}],
            })(
              <InputNumber defaultValue={0} min={0} style={{ width: '100%' }} placeholder="0表示不限制." />
            )}
          </FormItem>

          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="限流单位(s)"
            extra="大于等于0。0表示不限制"
          >
            {form.getFieldDecorator('callCountUnit', {
              initialValue: currentItem.callCountUnit,
              rules: [{ required: true}],
            })(
              <InputNumber defaultValue={0} min={0} style={{ width: '100%' }} placeholder="0表示不限制." />
            )}
          </FormItem>
          <FormItem labelCol={{ span: 5 }}
                    wrapperCol={{ span: 15 }}
                    label="状态">
            {form.getFieldDecorator('appStatus', {
              initialValue: currentItem.appStatus,
              rules: [{ required: true}],
            })(
            <Select placeholder="请选择" style={{ width: '100%' }}>
              <Option value="1">禁用</Option>
              <Option value="2">启用</Option>
            </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="回调方式"
            extra="理财端需填"
          >{form.getFieldDecorator('callbackMethod', {
            initialValue: currentItem.callbackMethod,
          })(
            <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
              <Option value="" defaultValue="">-</Option>
              <Option value="post">post</Option>
              <Option value="dubbo">dubbo</Option>
            </Select>
          )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="回调地址"
            extra="理财端需填。回调方式是dubbo时,回调地址只能是crmCallBackFinDubboImpl"
          >
            {form.getFieldDecorator('callbackAddress', {
              initialValue: currentItem.callbackAddress,
              rules: [{ whitespace:true,}],
            })(
              <Input placeholder="请输入" />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="回调重试service"
            extra="理财端需填"
          >
            {form.getFieldDecorator('callbackRetryService', {
              initialValue: currentItem.callbackRetryService,
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
                <Option value="" defaultValue="">-</Option>
                <Option value="qlNotifyCrmService">qlNotifyCrmService(回调理财)</Option>
                <Option value="crmNotifyQLService">crmNotifyQLService(回调xdt)</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="回调重试id"
            extra="理财端需填"
          >
            {form.getFieldDecorator('callbackRetryCfgId', {
              initialValue: currentItem.callbackRetryCfgId,
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
                <Option value="" defaultValue="">-</Option>
                {
                  this.getCallBackRetryCfgList().map((cfg, index) => {
                    return (<Option key = {index} value={cfg.value}>{cfg.value}[{cfg.label}]</Option>)
                  })
                }
              </Select>
            )}
          </FormItem>
        </Modal>
      </PageHeaderLayout>
    );
  }
}
