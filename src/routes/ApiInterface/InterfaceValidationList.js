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

//导入model/interfaceValidation
@connect(({ interfaceValidation, loading }) => ({
  interfaceValidation,
  loading: loading.models.interfaceValidation,
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
  };

  componentDidMount() {
    axios.get(`${serverwebapi}/interfaceType/queryListForSelect`)
      .then(res => {
        this.interfaceTypeList = res.data;

      });
    const { dispatch } = this.props;
    dispatch({
      type: 'interfaceValidation/fetch',
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
      type: 'interfaceValidation/fetch',
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
    this.props.interfaceValidation.currentItem = {};
    form.resetFields();
    this.setState({
      formValues: {},
      searchForm:{},
    });
    dispatch({
      type: 'interfaceValidation/fetch',
      payload: {},
    });
  }
  //查询按钮事件
  handleSearch = (e) => {
    e.preventDefault();
    const { dispatch } = this.props;
    dispatch({
      type: 'interfaceValidation/fetch',
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
  handleChangeFieldName = (e) =>{
    e.preventDefault();
    const fieldName = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, fieldName },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeId = (e) =>{
    const id = e;
    this.setState({
      searchForm: { ...this.state.searchForm, id },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeIsRequired = (e) =>{
    const isRequired = e;
    this.setState({
      searchForm: { ...this.state.searchForm, isRequired },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeParentId = (e) =>{
    const parentId = e;
    this.setState({
      searchForm: { ...this.state.searchForm, parentId },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeFieldType = (e) =>{
    const fieldType = e;
    this.setState({
      searchForm: { ...this.state.searchForm, fieldType },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeConvertName = (e) =>{
    e.preventDefault();
    const convertName = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, convertName },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeFormat = (e) =>{
    e.preventDefault();
    const format = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, format },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeFieldLength = (e) =>{
    const fieldLength = e;
    this.setState({
      searchForm: { ...this.state.searchForm, fieldLength },
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
      currentItem.tenantStatus = currentItem.tenantStatus+''||'';
      this.setState({
        disabled: true,
      });
    }
    this.props.dispatch({
      type: 'interfaceValidation/edit',
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
      this.handleAdd({...this.props.interfaceValidation.currentItem,...fieldsValue});
    });
  };
  //模态框确定按钮事件请求路由
  handleAdd = (fields) => {
    this.props.dispatch({
      type: 'interfaceValidation/submit',
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
        type: 'interfaceValidation/fetch',
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
      type: 'interfaceValidation/del',
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
      type: 'interfaceValidation/del',
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
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeInterfaceId}>
                <Option value="">全部</Option>
                {
                  this.getInterfaceTypeList().map((interfaceType, index) => {
                    return (<Option key = {index} value={interfaceType.value}>{interfaceType.value}</Option>)
                  })
                }
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="字段名称">
              <Input placeholder="请输入" onChange={this.handleChangeFieldName} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="字段Id">
              <InputNumber placeholder="请输入" style={{ width: '100%' }} onChange={this.handleChangeId} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="字段父Id">
              <InputNumber placeholder="请输入"style={{ width: '100%' }} onChange={this.handleChangeParentId} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="是否必填">
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeIsRequired}>
                <Option value="">全部</Option>
                <Option value="1"defaultValue="1" >是</Option>
                <Option value="0">否</Option>
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
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeInterfaceId}>
                {
                  this.getInterfaceTypeList().map((interfaceType, index) => {
                    return (<Option key = {index} value={interfaceType.value}>{interfaceType.value}</Option>)
                  })
                }
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="字段名称">
              <Input placeholder="请输入" onChange={this.handleChangeFieldName} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="字段Id">
              <InputNumber placeholder="请输入" style={{ width: '100%' }}onChange={this.handleChangeId} />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="是否必填">
              <Select placeholder="请选择" onChange={this.handleChangeIsRequired}>
                <Option value="">全部</Option>
                <Option value="1"defaultValue="1" >是</Option>
                <Option value="0">否</Option>
              </Select>
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="字段父Id">
              <InputNumber placeholder="请输入"style={{ width: '100%' }} onChange={this.handleChangeParentId} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="字段类型">
              <Select placeholder="请选择" onChange={this.handleChangeFieldType}>
                <Option value="">全部</Option>
                <Option value="string"defaultValue="string">string</Option>
                <Option value="map">map</Option>
                <Option value="list">list</Option>
                <Option value="date">date</Option>
                <Option value="number">number</Option>
                <Option value="decimal">decimal</Option>
              </Select>
            </FormItem>
          </Col>
        </Row>

        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="转换字段">
              <Input placeholder="请输入" onChange={this.handleChangeConvertName} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="format">
              <Input placeholder="请输入" onChange={this.handleChangeFormat} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="长度">
              <InputNumber placeholder="请输入"style={{ width: '100%' }} onChange={this.handleChangeFieldLength} />
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
    const { interfaceValidation: { data }, loading,form } = this.props;
    const { selectedRows } = this.state;
    const { currentItem={}, modalType,modalVisible } = this.props.interfaceValidation;

    const columns = [
      {
        title: '接口Id',
        dataIndex: 'interfaceId',
        sorter: true,
        key:"interfaceId",
      },
      {
        title: 'id',
        dataIndex: 'id',
        sorter: true,
        key:"id",
      },
      {
        title: '父Id',
        dataIndex: 'parentId',
        sorter: true,
        key:"parentId",
      },
      {
        title: '字段名',
        dataIndex: 'fieldName',
        sorter: true,
        key:"fieldName",
      },
      {
        title: '长度',
        dataIndex: 'fieldLength',
        sorter: true,
        key:"fieldLength",
      },
      {
        title: '必填',
        dataIndex: 'isRequired',
        sorter: true,
        key:"isRequired",
        render:text=>text==='1'?'必填':'非必填',
      }
      ,
      {
        title: '类型',
        dataIndex: 'fieldType',
        sorter: true,
        key:"fieldType",
      },
      {
        title: '转换字段',
        dataIndex: 'convertName',
        sorter: true,
        key:"convertName",
      },
      {
        title: 'format',
        dataIndex: 'format',
        sorter: true,
        key:"format",
      },
      {
        title: '默认值',
        dataIndex: 'defaultValue',
        sorter: true,
        key:"defaultValue",
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
          title={`${modalType === 'add' ? '新建' : '修改'}接口参数值`}
          visible={modalVisible}
          onOk={() => this.okHandle()}
          onCancel={() => this.handleModalVisible()}
        >
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="接口id"
          >
            {form.getFieldDecorator('interfaceId', {
              initialValue: currentItem.interfaceId,
              rules: [{ required: true,whitespace:true}],
            })(
              <Select placeholder="请选择" disabled={this.state.disabled} style={{ width: '100%' }}>
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
            label="id"
            extra="唯一，不能重复。"
          >
            {form.getFieldDecorator('id', {
              initialValue: currentItem.id,
              rules: [{ required: true}],
            })(
              <InputNumber placeholder="请输入" min={1} disabled={this.state.disabled} style={{ width: '100%' }} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="父id"
          >
            {form.getFieldDecorator('parentId', {
              initialValue: currentItem.parentId,
              rules: [{ required: true}],
            })(
              <InputNumber placeholder="请输入" min={1} disabled={this.state.disabled} style={{ width: '100%' }} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="字段名"
          >
            {form.getFieldDecorator('fieldName', {
              initialValue: currentItem.fieldName,
              rules: [{ required: true,whitespace:true}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="是否必填"
          >
            {form.getFieldDecorator('isRequired', {
              initialValue: currentItem.isRequired,
              rules: [{ required: true,whitespace:true}],
            })(
              <Select style={{ width: '100%' }}>
                <Option value="1"defaultValue="1" >是</Option>
                <Option value="0">否</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="长度"
          >
            {form.getFieldDecorator('fieldLength', {
              initialValue: currentItem.fieldLength,
              rules: [{ required: true}],
            })(
              <InputNumber MIN={1} MAX={10000} placeholder="请输入" style={{ width: '100%' }}/>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="类型"
          >
            {form.getFieldDecorator('fieldType', {
              initialValue: currentItem.fieldType,
              rules: [{ required: true,whitespace:true}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }} disabled={this.state.disabled} >
                <Option value="string"defaultValue="string">string</Option>
                <Option value="map">map</Option>
                <Option value="list">list</Option>
                <Option value="date">date</Option>
                <Option value="number">number</Option>
                <Option value="decimal">decimal</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="是否转换"
          >
            {form.getFieldDecorator('isConvert', {
              initialValue: currentItem.isConvert,
              rules: [{ required: true,whitespace:true}],
            })(
              <Select placeholder="请选择" style={{ width: '100%' }}>
                <Option value="1" >是</Option>
                <Option value="0" defaultValue="0">否</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="转换字段名"
          >
            {form.getFieldDecorator('convertName', {
              initialValue: currentItem.convertName,
              rules: [{ whitespace:true}],
            })(
              <Input placeholder="请输入" />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="format"
          >
            {form.getFieldDecorator('format', {
              initialValue: currentItem.format,
              rules: [{ whitespace:true}],
            })(
              <Input placeholder="请输入" />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="默认值"
          >
            {form.getFieldDecorator('defaultValue', {
              initialValue: currentItem.defaultValue,
              rules: [{ whitespace:true}],
            })(
              <Input placeholder="请输入" />
            )}
          </FormItem>
        </Modal>
      </PageHeaderLayout>
    );
  }
}
