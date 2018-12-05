import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Row, Col, Card, Form, Input, Select, Icon, Radio,Button, Menu, InputNumber, DatePicker, Modal, message, Badge, Divider,Popconfirm  } from 'antd';
import StandardTable from 'components/StandardTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './InterfaceTypeList.less';

const { TextArea } = Input;
const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Option } = Select;
const getValue = obj => Object.keys(obj).map(key => obj[key]).join(',');
const statusText = ["禁用", "启用"];
const status = ["error","success"];

//导入model/enumConvert
@connect(({ enumConvert, loading }) => ({
  enumConvert,
  loading: loading.models.enumConvert,
}))

//含查询条件Card，查询结果TableList,模态框Modal
@Form.create()
export default class TableList extends PureComponent {

  state = {
    selectedRows: [],
    formValues: {},
    searchForm: {},
    expandForm: false,
    errmsg:{},
    disabled: false,
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'enumConvert/fetch',
    });
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
      type: 'enumConvert/fetch',
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
    this.props.enumConvert.currentItem = {};
    form.resetFields();
    this.setState({
      formValues: {},
      searchForm:{},
    });
    dispatch({
      type: 'enumConvert/fetch',
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
      type: 'enumConvert/fetch',
      payload: {
        ...this.state.searchForm ,
      }
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
  handleChangeQuarkloanValue = (e) =>{
    e.preventDefault();
    const quarkloanValue = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, quarkloanValue },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeTransferValue = (e) =>{
    e.preventDefault();
    const transferValue = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, transferValue },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeFieldDesc = (e) =>{
    e.preventDefault();
    const fieldDesc = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, fieldDesc },
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
      type: 'enumConvert/edit',
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
      this.handleAdd({...this.props.enumConvert.currentItem,...fieldsValue});
    });
  };
  //模态框确定按钮事件请求路由
  handleAdd = (fields) => {
    this.props.dispatch({
      type: 'enumConvert/submit',
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
        type: 'enumConvert/fetch',
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
      type: 'enumConvert/del',
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
      type: 'enumConvert/del',
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
            <FormItem label="转换字段名">
              <Input placeholder="请输入" onChange={this.handleChangeFieldName} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="小贷字段值">
              <Input placeholder="请输入" onChange={this.handleChangeQuarkloanValue} />
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
            <FormItem label="转换字段名">
              <Input placeholder="请输入" onChange={this.handleChangeFieldName} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="小贷字段值">
              <Input placeholder="请输入" onChange={this.handleChangeQuarkloanValue} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="转换字段值">
              <Input placeholder="请输入" onChange={this.handleChangeTransferValue} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="备注">
              <Input placeholder="请输入" onChange={this.handleChangeFieldDesc} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <div style={{ overflow: 'hidden' ,float:"left"}}>
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
    const { enumConvert: { data }, loading,form } = this.props;
    const { selectedRows } = this.state;
    const { currentItem={}, modalType,modalVisible } = this.props.enumConvert;

    const columns = [
      {
        title: 'id',
        dataIndex: 'id',
        sorter: true,
        key:"id",
      },
      {
        title: '转换字段名',
        dataIndex: 'fieldName',
        sorter: true,
        key:"fieldName",
      },
      {
        title: '小贷字段值',
        dataIndex: 'quarkloanValue',
        sorter: true,
        key:"quarkloanValue",
      },
      {
        title: '转换字段值',
        dataIndex: 'transferValue',
        sorter: true,
        key:"transferValue",
      },
      {
        title: '描述',
        dataIndex: 'fieldDesc',
        sorter: true,
        key:"fieldDesc",
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
          title={`${modalType === 'add' ? '新建' : '修改'}枚举值`}
          visible={modalVisible}
          onOk={() => this.okHandle()}
          onCancel={() => this.handleModalVisible()}
        >
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="id"
          >
            {form.getFieldDecorator('id', {
              initialValue: currentItem.id,
              rules: [{ required: true,whitespace:true}],
            })(
              <Input placeholder="请输入"disabled={this.state.disabled} />
            )}
          </FormItem>

          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="转换字段名"
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
            label="小贷字段名"
          >
            {form.getFieldDecorator('quarkloanValue', {
              initialValue: currentItem.quarkloanValue,
              rules: [{ required: true,whitespace:true,}],
            })(
              <Input placeholder="请输入" />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="转换字段名"
          >
            {form.getFieldDecorator('transferValue', {
              initialValue: currentItem.transferValue,
              rules: [{ required: true,whitespace:true,}],
            })(
              <Input placeholder="请输入" />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="备注"
          >
            {form.getFieldDecorator('remark', {
              initialValue: currentItem.remark,
              rules: [{ required: false,whitespace:true}],
            })(
              <TextArea rows={5} />
            )}
          </FormItem>
        </Modal>
      </PageHeaderLayout>
    );
  }
}
