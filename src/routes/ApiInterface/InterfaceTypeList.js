import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Row, Col, Card, Form, Input, Select, Icon, Radio,Button, Menu, InputNumber, DatePicker, Modal, message, Badge, Divider,Popconfirm  } from 'antd';
import StandardTable from 'components/StandardTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './InterfaceTypeList.less';
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

//导入model/interfaceType
@connect(({ interfaceType, loading }) => ({
  interfaceType,
  loading: loading.models.interfaceType,
}))

//含查询条件Card，查询结果TableList,模态框Modal
@Form.create()
export default class TableList extends PureComponent {

  retryCfgList = [];
  rstCfgList = [];

  state = {
    selectedRows: [],
    formValues: {},
    searchForm: {},
    expandForm: false,
    errmsg:{},
    disabled: false,
    jsonErr:"",
  };

  componentDidMount() {
    axios.get(`${serverwebapi}/retryCfg/queryRetryListForSelect`)
      .then(res => {
        this.retryCfgList = res.data;

      });
    axios.get(`${serverwebapi}/resultCacheCfg/queryListForSelect`)
      .then(res => {
        this.rstCfgList = res.data;

      });
    const { dispatch } = this.props;
    dispatch({
      type: 'interfaceType/fetch',
    });
  }

  getRetryCfgList = () => {
    return this.retryCfgList;
  }
  getRstCfgList = () => {
    return this.rstCfgList;
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
      type: 'interfaceType/fetch',
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
    this.props.interfaceType.currentItem = {};
    form.resetFields();
    this.setState({
      formValues: {},
      searchForm:{},
    });
    dispatch({
      type: 'interfaceType/fetch',
      payload: {},
    });
  }
  //查询按钮事件
  handleSearch = (e) => {
    e.preventDefault();
    const { dispatch } = this.props;
    dispatch({
      type: 'interfaceType/fetch',
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
  handleChangeInterfaceStatus = (value) =>{
    const interfaceTypeStatus = value;
    this.setState({
      searchForm: { ...this.state.searchForm, interfaceTypeStatus },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeInterfaceDesc = (e) =>{
    e.preventDefault();
    const interfaceDesc = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, interfaceDesc },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeDirection = (value) =>{
    const direction = value;
    this.setState({
      searchForm: { ...this.state.searchForm, direction },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeRetryCfgId = (value) =>{
    const retryCfgId = value;
    this.setState({
      searchForm: { ...this.state.searchForm, retryCfgId },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeTargets = (value) =>{
    const targets = value;
    this.setState({
      searchForm: { ...this.state.searchForm, targets },
    });
  }
  //新增/修改时模态框控制
  handleModalVisible = (flag,modalType,currentItem) => {
    const { form } = this.props;
    form.resetFields();
    this.state.jsonErr = "";
    if (modalType === 'add') {
      this.setState({
        disabled: false,
      });
    }else if (modalType === 'edit') {
      currentItem.retryCfgId = currentItem.retryCfgId+'';
      debugger
      currentItem.rstCfgId = currentItem.rstCfgId+'';
      this.setState({
        disabled: true,
      });
    }
    this.props.dispatch({
      type: 'interfaceType/edit',
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
      if (!this.checkJson(form.getFieldValue("targets"))) return;
      if (err) return;
      this.handleAdd({...this.props.interfaceType.currentItem,...fieldsValue});
    });
  };
  //校验字段是否是json格式字符串
  checkJson = (value) =>{
    try{
      const obj = JSON.parse(value);
      if(!(typeof obj == 'object' && obj)){
        this.state.jsonErr = "不是json格式，或字段不完整";
        return false;
      }
    }catch {
      this.state.jsonErr = "不是json格式，或字段不完整";
    return false;
  }
    this.state.jsonErr = "";
    return true;
  }
  //模态框确定按钮事件请求路由
  handleAdd = (fields) => {
    fields.targets = JSON.parse(fields.targets);
    this.props.dispatch({
      type: 'interfaceType/submit',
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
        type: 'interfaceType/fetch',
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
      type: 'interfaceType/del',
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
      type: 'interfaceType/del',
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
            <FormItem label="状态">
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeInterfaceStatus}>
                <Option value="" defaultValue="">全部</Option>
                <Option value="1" >禁用</Option>
                <Option value="2">启用</Option>
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
              <Input placeholder="请输入" onChange={this.handleChangeInterfaceId} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="状态">
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeInterfaceStatus}>
                <Option value="" defaultValue="">全部</Option>
                <Option value="1" >禁用</Option>
                <Option value="2">启用</Option>
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="接口描述">
              <Input placeholder="请输入" onChange={this.handleChangeInterfaceDesc} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="方向">
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeDirection}>
                <Option value="" defaultValue="">全部</Option>
                <Option value="1">外部->xdt</Option>
                <Option value="0">xdt->外部</Option>
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="重试配置">
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeRetryCfgId}>
                <Option value="" defaultValue="">全部</Option>
                {
                  this.getRetryCfgList().map((cfg, index) => {
                    return (<Option key = {index} value={cfg.value}>{cfg.label}[{cfg.value}]</Option>)
                  })
                }
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="targets">
              <Input placeholder="请输入" onChange={this.handleChangeTargets} />
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
    const { interfaceType: { data }, loading,form } = this.props;
    const { selectedRows } = this.state;
    const { currentItem={}, modalType,modalVisible } = this.props.interfaceType;

    const columns = [
      {
        title: '接口Id',
        dataIndex: 'interfaceId',
        sorter: true,
        key:"interfaceId",
      },
      {
        title: '方向',
        dataIndex: 'direction',
        sorter: true,
        render:text=>text==='1'?'外部->xdt':'xdt->外部',
      },
      {
        title: '描述',
        dataIndex: 'interfaceDesc',
        sorter: true,
      },
      {
        title: '请求地址',
        dataIndex: 'targets',
        sorter: true,
        width:"200px",
        render:targets=>JSON.stringify(targets),
      },
      {
        title: '重试id',
        dataIndex: 'retryCfgId',
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
        fixed:"right",
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
              scroll={{ y: 240 }}
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
            label="接口Id"
            extra="接口Id唯一，不能重复"
          >
            {form.getFieldDecorator('interfaceId', {
              initialValue: currentItem.interfaceId,
              rules: [{ required: true,whitespace:true}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled}/>
            )}
          </FormItem>

          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="接口名称"
          >
            {form.getFieldDecorator('interfaceName', {
              initialValue: currentItem.interfaceName,
              rules: [{ required: true,whitespace:true}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled}/>
            )}
          </FormItem>

          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="方向"
          >
            {form.getFieldDecorator('direction', {
              initialValue: currentItem.direction,
              rules: [{ required: true,whitespace:true,}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled} >
                <Option value="1">外部->xdt</Option>
                <Option value="0">xdt->外部</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="请求地址"
            extra="json格式"
          >
            {form.getFieldDecorator('targets', {
              initialValue: JSON.stringify(currentItem.targets),
              rules: [{ required: true,whitespace:true}],
            })(
              <TextArea rows={5} />
            )}
            <span style={{color:"red",}}>{this.state.jsonErr}</span>
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="接口描述"
          >
            {form.getFieldDecorator('interfaceDesc', {
              initialValue: currentItem.interfaceDesc,
              rules: [{ required: true,whitespace:true}],
            })(
              <TextArea rows={2} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="数据转换类"
          >
            {form.getFieldDecorator('dataConvertor', {
              initialValue: currentItem.dataConvertor,
              rules: [{ required: true,whitespace:true}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
                <Option value="qlDataConvertor">qlDataConvertor(xdt->理财)</Option>
                <Option value="ql2EsbDataConvertor">ql2EsbDataConvertor(xdt->借款)</Option>
                <Option value="crmDataConvertor">crmDataConvertor(理财->xdt)</Option>
                <Option value="esbDataConvertor">esbDataConvertor(借款->xdt)</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="结果解析类"
          >
            {form.getFieldDecorator('dataHandle', {
              initialValue: currentItem.dataHandle,
              rules: [{ required: true,whitespace:true}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
                <Option value="ql2crmResultHandle">ql2crmResultHandle(xdt->理财)</Option>
                <Option value="ql2esbResultHandle">ql2esbResultHandle(xdt->借款)</Option>
                <Option value="crm2qlResultHandle">crm2qlResultHandle(理财->xdt)</Option>
                <Option value="esb2qlResultHandle">esb2qlResultHandle(借款->xdt)</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="重试service"
          >
            {form.getFieldDecorator('retryService', {
              initialValue: currentItem.retryService,
              rules: [{ required: true,whitespace:true}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
                <Option value="qlInvokeCrmService">qlInvokeCrmService(xdt->理财)</Option>
                <Option value="qlInvokeEsbService">qlInvokeEsbService(xdt->借款)</Option>
                <Option value="crmInvokeQLService">crmInvokeQLService(理财->xdt)</Option>
                <Option value="esbInvokeQLService">esbInvokeQLService(借款->xdt)</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="重试配置"
          >
            {form.getFieldDecorator('retryCfgId', {
              initialValue: currentItem.retryCfgId,
              rules: [{ required: true,whitespace:true}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled}>
                {
                  this.getRetryCfgList().map((cfg, index) => {
                    return (<Option key = {index} value={cfg.value}>{cfg.label}[{cfg.value}]</Option>)
                  })
                }
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="结果缓存配置"
          >
            {form.getFieldDecorator('rstCfgId', {
              initialValue: currentItem.rstCfgId,
              rules: [{ required: false}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} >
                <Option value="" defaultValue="">-</Option>
                {
                  this.getRstCfgList().map((cfg, index) => {
                    return (<Option key = {index} value={cfg.value}>{cfg.label}[{cfg.value}]</Option>)
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
