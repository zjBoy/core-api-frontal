import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Row, Col, Card, Form, Input, Select, Icon, Radio,Button, Menu, InputNumber, DatePicker, Modal, message, Badge, Divider,Popconfirm  } from 'antd';
import StandardTable from 'components/StandardTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './AppList.less';
import axios from 'axios';
import {serverwebapi} from '../../utils/constant';

const { TextArea } = Input;
const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Option } = Select;
const getValue = obj => Object.keys(obj).map(key => obj[key]).join(',');
const statusText = ["禁用", "启用"];
const status = ["error","success"];

//导入model/appInterface
@connect(({ appInterface, loading }) => ({
  appInterface,
  loading: loading.models.appInterface,
}))

//含查询条件Card，查询结果TableList,模态框Modal
@Form.create()
export default class TableList extends PureComponent {

  appList = [];
  interfaceTypeList = [];
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
    axios.get(`${serverwebapi}/app/queryListForSelect`)
      .then(res => {
        this.appList = res.data;

      });
    axios.get(`${serverwebapi}/retryCfg/queryCBListForSelect`)
      .then(res => {
        this.callBackRetryCfgList = res.data;

      });
    axios.get(`${serverwebapi}/interfaceType/queryListForSelect`)
      .then(res => {
        this.interfaceTypeList = res.data;

      });
    const { dispatch } = this.props;
    dispatch({
      type: 'appInterface/fetch',
    });
  }
  getAppList = () => {
    return this.appList;
  }
  getInterfaceTypeList = () => {
    return this.interfaceTypeList;
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
      type: 'appInterface/fetch',
      payload: params,
    });
  }
  handleSelectRows = (rows) => {
    this.setState({
      selectedRows: rows,
    });
  }
  toggleForm = () => {
    this.setState({
      expandForm: !this.state.expandForm,
    });
  }
  handleFormReset = () => {
    const { form, dispatch } = this.props;
    this.props.appInterface.currentItem = {};
    form.resetFields();
    this.setState({
      formValues: {},
      searchForm:{},
    });
    dispatch({
      type: 'appInterface/fetch',
      payload: {},
    });
  }
  //查询按钮事件
  handleSearch = (e) => {
    e.preventDefault();
    const { dispatch } = this.props;
    dispatch({
      type: 'appInterface/fetch',
      payload: {
        ...this.state.searchForm ,
      }
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeInterfaceId = (e) =>{
    const interfaceId = e;
    this.setState({
      searchForm: { ...this.state.searchForm, interfaceId },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeAppCode = (e) =>{
    const appCode = e;
    this.setState({
      searchForm: { ...this.state.searchForm, appCode },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeCallPermit = (value) =>{
    const callPermit = value;
    this.setState({
      searchForm: { ...this.state.searchForm, callPermit },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeTargetName = (e) =>{
    e.preventDefault();
    const targetName = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, targetName },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeCacheResult = (e) =>{
    const cacheResult = e;
    this.setState({
      searchForm: { ...this.state.searchForm, cacheResult },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeCallbackMethod = (e) =>{
    const callbackMethod = e;
    this.setState({
      searchForm: { ...this.state.searchForm, callbackMethod },
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
      currentItem.callPermit = currentItem.callPermit+'';
      currentItem.cacheResult = currentItem.cacheResult+'';
      this.setState({
        disabled: true,
      });
    }
    this.props.dispatch({
      type: 'appInterface/edit',
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
      this.handleAdd({...this.props.appInterface.currentItem,...fieldsValue});
    });
  };
  //模态框确定按钮事件请求路由
  handleAdd = (fields) => {
    this.props.dispatch({
      type: 'appInterface/submit',
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
        type: 'appInterface/fetch',
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
    const interfaceIds = selectedRows.map(row => row.interfaceId).join(',');

    this.setState({
      selectedRows: [],
    });
    dispatch({
      type: 'appInterface/del',
      payload: {
        _id: _ids,
        interfaceId: interfaceIds,
      },
      callback:this.handleDbCallback,
    });
  }
  //列删除按钮事件
  handleDel = (_id,interfaceId) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appInterface/del',
      payload: {
        _id: _id,
        interfaceId: interfaceId,
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
            <FormItem label="应用">
              <Select placeholder="请选择" onChange={this.handleChangeAppCode}>
                <Option value="" defaultValue="">全部</Option>
                {
                  this.getAppList().map((app, index) => {
                    return (<Option key = {index} value={app.value}>{app.label}[{app.value}]</Option>)
                  })
                }
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="接口">
              <Select placeholder="请选择" onChange={this.handleChangeInterfaceId}>
                <Option value="" defaultValue="">全部</Option>
                {
                  this.getInterfaceTypeList().map((interfaceType, index) => {
                    return (<Option key = {index} value={interfaceType.value}>{interfaceType.value}</Option>)
                  })
                }
              </Select>
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
  renderAdvancedForm() {
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="接口Id">
              <Select placeholder="请选择" onChange={this.handleChangeInterfaceId}>
                <Option value="" defaultValue="">全部</Option>
                {
                  this.getInterfaceTypeList().map((interfaceType, index) => {
                    return (<Option key = {index} value={interfaceType.value}>{interfaceType.value}</Option>)
                  })
                }
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="应用">
              <Select placeholder="请选择" onChange={this.handleChangeAppCode}>
                <Option value="" defaultValue="">全部</Option>
                {
                  this.getAppList().map((app, index) => {
                    return (<Option key = {index} value={app.value}>{app.label}[{app.value}]</Option>)
                  })
                }
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="状态">
              <Select placeholder="请选择"  onChange={this.handleChangeCallPermit}>
                <Option value="" defaultValue="">全部</Option>
                <Option value="1" >禁用</Option>
                <Option value="2">启用</Option>
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="目标系统" extra="如CRM、ESB、REPAYMENT">
              <Input placeholder="请输入" onChange={this.handleChangeTargetName} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="缓存结果">
              <Select placeholder="请选择" onChange={this.handleChangeCacheResult}>
                <Option value="" defaultValue="">全部</Option>
                <Option value="1">不需要</Option>
                <Option value="2">需要</Option>
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="回调方式">
              <Select placeholder="请选择" onChange={this.handleChangeCallbackMethod}>
                <Option value="" defaultValue="">全部</Option>
                <Option value="post">post</Option>
                <Option value="dubbo">dubbo</Option>
              </Select>
            </FormItem>
          </Col>
        </Row>
        <div style={{ overflow: 'hidden' }}>
          <span style={{ float: 'right', marginBottom: 24 }}>
            <Button type="primary" htmlType="submit">查询</Button>
            <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>重置</Button>
            <a style={{ marginLeft: 8 }} onClick={this.toggleForm}>
              收起 <Icon type="up" />
            </a>
          </span>
        </div>
      </Form>
    );
  }
  renderForm() {
    return this.state.expandForm ? this.renderAdvancedForm() : this.renderSimpleForm();
  }
  //渲染列和模态框
  render() {
    const { appInterface: { data }, loading,form } = this.props;
    const { selectedRows} = this.state;
    const { currentItem={}, modalType,modalVisible } = this.props.appInterface;

    const columns = [
      {
        title: '应用Code',
        dataIndex: 'appCode',
        sorter: true,
        key:"appCode",
        width:"95px"
      },
      {
        title: '接口ID',
        dataIndex: 'interfaceId',
        sorter: true,
        width:"190px",
      },
      {
        title: '目标系统',
        dataIndex: 'targetName',
        sorter: true,
        width:"90px",
      },
      {
        title: '缓存结果',
        dataIndex: 'cacheResult',
        sorter: true,
        render:text=>text==1?'不需要':'需要',
      },
      {
        title: '限流次数',
        dataIndex: 'callCount',
        sorter: true,
        width:"90px",
      },
      {
        title: '限流时间(s)',
        dataIndex: 'callCountUnit',
        sorter: true,
      },
      {
        title: '状态',
        dataIndex: 'callPermit',
        key:"callPermit",
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
        width:"90px",
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
            <Popconfirm title="确定要删除?" onConfirm={() => this.handleDel(record._id,record.interfaceId)} okText="是" cancelText="否">
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
          title={`${modalType === 'add' ? '新建' : '修改'}应用接口关系`}
          visible={modalVisible}
          onOk={() => this.okHandle()}
          onCancel={() => this.handleModalVisible()}
        >
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="应用"
            extra="应用和接口Id是联合主键，不能重复"
          >
            {form.getFieldDecorator('appCode', {
              initialValue: currentItem.appCode,
              rules: [{ required: true}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
                {
                  this.getAppList().map((app, index) => {
                    return (<Option key = {index} value={app.value}>{app.label}[{app.value}]</Option>)
                  })
                }
              </Select>
            )}
          </FormItem>

          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="接口Id"
            extra="应用和接口Id是联合主键，不能重复"
          >
            {form.getFieldDecorator('interfaceId', {
              initialValue: currentItem.interfaceId,
              rules: [{ required: true,whitespace:true}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
                {
                  this.getInterfaceTypeList().map((interfaceType, index) => {
                    return (<Option key = {index} value={interfaceType.value}>{interfaceType.value}</Option>)
                  })
                }
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="是否启用"
          >{form.getFieldDecorator('callPermit', {
            initialValue: currentItem.callPermit,
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
            label="目标系统"
            extra="如CRM、ESB、REPAYMENT。仅用于系统显示"
          >
            {form.getFieldDecorator('targetName', {
              initialValue: currentItem.targetName,
              rules: [{ whitespace:true,}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="缓存结果"
          >{form.getFieldDecorator('cacheResult', {
            initialValue: currentItem.cacheResult,
            rules: [{ required: true}],
          })(
            <Select placeholder="请选择" style={{ width: '100%' }}>
              <Option value="1">不需要</Option>
              <Option value="2">需要</Option>
            </Select>
          )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="限流次数"
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
          >
            {form.getFieldDecorator('callCountUnit', {
              initialValue: currentItem.callCountUnit,
              rules: [{ required: true}],
            })(
              <InputNumber defaultValue={0} min={0} style={{ width: '100%' }} placeholder="0表示不限制." />
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
            <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled} >
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
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled} >
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
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled} >
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
