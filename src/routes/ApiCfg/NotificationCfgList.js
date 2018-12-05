import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Row, Col, Card, Form, Input, InputNumber ,Select, Radio,Button, Modal, Icon,message, Badge, Divider,Popconfirm  } from 'antd';
import StandardTable from 'components/StandardTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './NotificationCfgList.less';
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

//导入model/notificationCfg
@connect(({ notificationCfg, loading }) => ({
  notificationCfg,
  loading: loading.models.notificationCfg,
}))

//含查询条件Card，查询结果TableList,模态框Modal
@Form.create()
export default class TableList extends PureComponent {

  interfaceTypeList = [];
  state = {
    selectedRows: [],
    formValues: {},
    searchForm: {},
    expandForm: false,
    errmsg:{},
    disabled: false,
    jsonErrCfg:"",
    jsonErrRetry:"",
  };

  componentDidMount() {
    axios.get(`${serverwebapi}/interfaceType/queryListForSelect`)
      .then(res => {
        this.interfaceTypeList = res.data;

      });
    const { dispatch } = this.props;
    dispatch({
      type: 'notificationCfg/fetch',
    });
  }

  getInterfaceTypeList = () => {
    return this.interfaceTypeList;
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
      type: 'notificationCfg/fetch',
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
    this.props.notificationCfg.currentItem = {};
    form.resetFields();
    this.setState({
      formValues: {},
      searchForm:{},
    });
    dispatch({
      type: 'notificationCfg/fetch',
      payload: {},
    });
  }
  //查询按钮事件
  handleSearch = (e) => {
    e.preventDefault();
    const { dispatch } = this.props;
    dispatch({
      type: 'notificationCfg/fetch',
      payload: {
        ...this.state.searchForm ,
      }
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeInterfaceId = (e) =>{
    e.preventDefault();
    const interfaceId = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, interfaceId },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeChannel = (e) =>{
    e.preventDefault();
    const channel = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, channel },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeDesc = (e) =>{
    e.preventDefault();
    const desc = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, desc },
    });
  }

  //新增/修改时模态框控制
  handleModalVisible = (flag,modalType,currentItem) => {
    const { form } = this.props;
    form.resetFields();
    this.state.jsonErrCfg = "";
    this.state.jsonErrRetry = "";
    if (modalType === 'add') {
      const { form } = this.props;
      form.resetFields();
      this.setState({
        disabled: false,
      });
    }else if (modalType === 'edit') {
      currentItem.tenantStatus = currentItem.tenantStatus+''||'';
      this.setState({
        disabled: true,
      });
    }
    this.props.dispatch({
      type: 'notificationCfg/edit',
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
      const checkCfg = this.checkJsonCfg(form.getFieldValue("cfgDetail"));
      const checkRetry = this.checkJsonRetry(form.getFieldValue("retryCfg"));
      if (!checkCfg||!checkRetry) return;
      if (err) return;
      this.handleAdd({...this.props.notificationCfg.currentItem,...fieldsValue});
    });
  };

  //校验字段是否是json格式字符串
  checkJsonCfg = (value) =>{
    try{
      const obj = JSON.parse(value);
      debugger
      if(!(typeof obj == 'object' && obj && obj.address && obj.username && obj.password
        && obj.virtualHost && obj.channelCacheSize && obj.exchange && obj.routingKey)){
        this.state.jsonErrCfg = "不是json格式，或字段不完整";
        return false;
      }
    }catch {
      this.state.jsonErrCfg = "不是json格式，或字段不完整";
      return false;
    }
    this.state.jsonErrCfg = "";
    return true;
  }
  //校验字段是否是json格式字符串
  checkJsonRetry = (value) =>{
    try{
      const obj = JSON.parse(value);
      debugger
      if(!(typeof obj == 'object' && obj && obj.other && obj.countTimeMap && (typeof obj.countTimeMap == 'object') && obj.limits)){
        this.state.jsonErrRetry = "不是json格式，或字段不完整";
        return false;
      }
    }catch {
      this.state.jsonErrRetry = "不是json格式，或字段不完整";
      return false;
    }
    this.state.jsonErrRetry = "";
    return true;
  }
  //模态框确定按钮事件请求路由
  handleAdd = (fields) => {
    this.props.dispatch({
      type: 'notificationCfg/submit',
      payload: fields,
      callback:this.handleDbCallback,
    });
  };
  //服务器处理结果回调。成功则关闭并刷新列表。失败则弹窗
  handleDbCallback = (result) => {
    if(result.msg=="OK"){
      message.success('操作成功');
      this.props.form.resetFields();
      this.props.dispatch({
        type: 'notificationCfg/fetch',
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
      type: 'notificationCfg/del',
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
      type: 'notificationCfg/del',
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
            <FormItem label="接口Id">
              <Input placeholder="请输入" onChange={this.handleChangeInterfaceId} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="通知平台">
              <Input placeholder="如nxd,esb,qyj" onChange={this.handleChangeChannel} />
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
              <Input placeholder="请输入" onChange={this.handleChangeInterfaceId} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="通知平台">
              <Input placeholder="如nxd,esb,qyj" onChange={this.handleChangeChannel} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="备注">
              <Input placeholder="如出款,还款,大数据" onChange={this.handleChangeDesc} />
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
    const { notificationCfg: { data }, loading,form } = this.props;
    const { selectedRows } = this.state;
    const { currentItem={}, modalType,modalVisible } = this.props.notificationCfg;

    const columns = [
      {
        title: 'id',
        dataIndex: 'id',
        sorter: true,
        key:"id",
      },
      {
        title: '接口Id',
        dataIndex: 'interfaceId',
        sorter: true,
        key:"interfaceId",
      },
      {
        title: '通知平台',
        dataIndex: 'channel',
        sorter: true,
        width:"100px"
      },
      {
        title: '配置内容',
        dataIndex: 'cfgDetail',
        sorter: true,
        width:"250px",
      },
      {
        title: '备注',
        dataIndex: 'desc',
        width:"250px",
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
          title={`${modalType === 'add' ? '新建' : '修改'}接口`}
          visible={modalVisible}
          onOk={() => this.okHandle()}
          onCancel={() => this.handleModalVisible()}
        >
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="id"
            extra="1~100。唯一，不能重复"
          >
            {form.getFieldDecorator('id', {
              initialValue: currentItem.id,
              rules: [{ required: true}],
            })(
              <InputNumber min={1} max={100} disabled={this.state.disabled} style={{ width: '100%' }}/>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="接口Id"
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
            label="通知平台"
            extra="如nxd,esb,qyj"
          >
            {form.getFieldDecorator('channel', {
              initialValue: currentItem.channel,
              rules: [{ required: true,whitespace:true,}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="配置内容"
            extra="json格式"
          >
            {form.getFieldDecorator('cfgDetail', {
              initialValue: currentItem.cfgDetail,
              rules: [{ required: true,whitespace:true}],
            })(
              <TextArea rows={4} />
            )}
            <span style={{color:"red",}}>{this.state.jsonErrCfg}</span>
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="重试机制"
            extra="json格式"
          >
            {form.getFieldDecorator('retryCfg', {
              initialValue: currentItem.retryCfg,
              rules: [{ required: true,whitespace:true}],
            })(
              <TextArea rows={3} />
            )}
            <span style={{color:"red",}}>{this.state.jsonErrRetry}</span>
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="notifier"
          >
            {form.getFieldDecorator('notifier', {
              initialValue: "RabbitNotifier",
              rules: [{ required: true,whitespace:true,}],
            })(
              <Input disabled={true} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="pointCut"
          >
            {form.getFieldDecorator('pointCut', {
              initialValue: "SAMEAS_REQUEST",
              rules: [{ required: true,whitespace:true,}],
            })(
              <Input disabled={true} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="备注"
          >
            {form.getFieldDecorator('desc', {
              initialValue: currentItem.desc,
              rules: [{ required: true,whitespace:true}],
            })(
              <TextArea rows={2} />
            )}
          </FormItem>
        </Modal>
      </PageHeaderLayout>
    );
  }
}
