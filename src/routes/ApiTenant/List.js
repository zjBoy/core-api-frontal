import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Row, Col, Card, Form, Input, Select,Button, Modal, message, Badge, Divider,Popconfirm  } from 'antd';
import StandardTable from 'components/StandardTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './List.less';

const { TextArea } = Input;
const FormItem = Form.Item;
const { Option } = Select;
const getValue = obj => Object.keys(obj).map(key => obj[key]).join(',');
const statusText = ["禁用", "启用"];
const status = ["error","success"];

//导入model/tenant
@connect(({ tenant, loading }) => ({
  tenant,
  loading: loading.models.tenant,
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
      type: 'tenant/fetch',
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
      type: 'tenant/fetch',
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
    this.props.tenant.currentItem = {};
    form.resetFields();
    this.setState({
      formValues: {},
      searchForm:{},
    });
    dispatch({
      type: 'tenant/fetch',
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
      type: 'tenant/fetch',
      payload: {
        ...this.state.searchForm ,
      }
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeTenantCode = (e) =>{
    e.preventDefault();
    const tenantCode = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, tenantCode },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeTenantName = (e) =>{
    e.preventDefault();
    const tenantName = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, tenantName },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeTenantStatus = (value) =>{
    const tenantStatus = value;
    this.setState({
      searchForm: { ...this.state.searchForm, tenantStatus },
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
      type: 'tenant/edit',
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
      this.handleAdd({...this.props.tenant.currentItem,...fieldsValue});
    });
  };
  //模态框确定按钮事件请求路由
  handleAdd = (fields) => {
    this.props.dispatch({
      type: 'tenant/submit',
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
        type: 'tenant/fetch',
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
    const tenantCodes = selectedRows.map(row => row.tenantCode).join(',');

    this.setState({
      selectedRows: [],
    });
    dispatch({
      type: 'tenant/del',
      payload: {
        _id: _ids,
        tenantCode: tenantCodes,
      },
      callback:this.handleDbCallback,
    });
  }
  //列删除按钮事件
  handleDel = (_id,tenantCode) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'tenant/del',
      payload: {
        _id: _id,
        tenantCode: tenantCode,
      },
      callback:this.handleDbCallback,
    });
  }

  //渲染查询条件表单
  renderForm() {
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="商户Code">
              <Input placeholder="请输入" onChange={this.handleChangeTenantCode} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="商户名称">
              <Input placeholder="请输入" onChange={this.handleChangeTenantName} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="状态">
              <Select placeholder="请选择" style={{ width: '100%' }} onChange={this.handleChangeTenantStatus}>
                <Option value="" defaultValue="">全部</Option>
                <Option value="1" >禁用</Option>
                <Option value="2">启用</Option>
              </Select>
            </FormItem>
          </Col>
        </Row>
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={24} sm={48} >
          <span className={styles.submitButtons}style={{ float: "right" }}>
            <Button type="primary" htmlType="submit">查询</Button>
            <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>重置</Button>
          </span>
          </Col>
        </Row>
      </Form>
    );
  }
  //渲染列和模态框
  render() {
    const { tenant: { data }, loading,form } = this.props;
    const { selectedRows } = this.state;
    const { currentItem={}, modalType,modalVisible } = this.props.tenant;

    const columns = [
      {
        title: '商户Code',
        dataIndex: 'tenantCode',
        sorter: true,
        key:"tenantCode",
      },
      {
        title: '商户名称',
        dataIndex: 'tenantName',
        sorter: true,
      },
      {
        title: '数据源',
        dataIndex: 'mongoTpl',
        sorter: true,
      },
      {
        title: '状态',
        dataIndex: 'tenantStatus',
        sorter: true,
        render(val) {
          return <Badge status={status[val-1]} text={statusText[val-1]} />;
        },
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
            <Popconfirm title="确定要删除?" onConfirm={() => this.handleDel(record._id,record.tenantCode)} okText="是" cancelText="否">
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
          title={`${modalType === 'add' ? '新建' : '修改'}商户`}
          visible={modalVisible}
          onOk={() => this.okHandle()}
          onCancel={() => this.handleModalVisible()}
        >
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="商户Code"
            help="商户Code唯一，不能重复"
          >
            {form.getFieldDecorator('tenantCode', {
              initialValue: currentItem.tenantCode,
              rules: [{ required: true,whitespace:true}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="商户名称"
            help="商户名称唯一，不能重复"
          >
            {form.getFieldDecorator('tenantName', {
              initialValue: currentItem.tenantName,
              rules: [{ required: true,whitespace:true}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled} />
            )}
          </FormItem>

          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="数据源"
          >
            {form.getFieldDecorator('mongoTpl', {
              initialValue: currentItem.mongoTpl,
              rules: [{ required: true,whitespace:true,}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="状态"
          >{form.getFieldDecorator('tenantStatus', {
            initialValue: currentItem.tenantStatus,
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
