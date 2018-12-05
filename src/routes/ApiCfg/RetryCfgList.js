import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Row, Col, Form, Input, Select,Button, Card,Modal, message, InputNumber ,Icon , Divider,Popconfirm  } from 'antd';
import StandardTable from 'components/StandardTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './NotificationCfgList.less';

const { TextArea } = Input;
const FormItem = Form.Item;
const { Option } = Select;
const getValue = obj => Object.keys(obj).map(key => obj[key]).join(',');
const statusText = ["禁用", "启用"];
const status = ["error","success"];

//导入model/retryCfg
@connect(({ retryCfg, loading }) => ({
  retryCfg,
  loading: loading.models.retryCfg,
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
    jsonErr:"",
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'retryCfg/fetch',
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
      type: 'retryCfg/fetch',
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
    this.props.retryCfg.currentItem = {};
    form.resetFields();
    this.setState({
      formValues: {},
      searchForm:{},
    });
    dispatch({
      type: 'retryCfg/fetch',
      payload: {},
    });
  }
  //查询按钮事件
  handleSearch = (e) => {
    e.preventDefault();
    const { dispatch } = this.props;
    dispatch({
      type: 'retryCfg/fetch',
      payload: {
        ...this.state.searchForm ,
      }
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeId = (e) =>{
    e.preventDefault();
    const id = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, id },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeName = (e) =>{
    e.preventDefault();
    const name = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, name },
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
  //将查询框条件赋值给变量searchForm
  handleChangeContent = (e) =>{
    e.preventDefault();
    const content = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, content },
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
      currentItem.tenantStatus = currentItem.tenantStatus+''||'';
      this.setState({
        disabled: true,
      });
    }
    this.props.dispatch({
      type: 'retryCfg/edit',
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
      if (!this.checkJson(form.getFieldValue("content"))) return;
      if (err) return;
      this.handleAdd({...this.props.retryCfg.currentItem,...fieldsValue});
    });
  };
  //校验字段是否是json格式字符串
  checkJson = (value) =>{
    try{
      const obj = JSON.parse(value);
      if(!(typeof obj == 'object' && obj && obj.max_count  && obj.other)){
        this.state.jsonErr = "不是json格式，或字段不完整";
        return false;
      }
    }catch{
      this.state.jsonErr = "不是json格式，或字段不完整";
      return false;
    }
    this.state.jsonErr = "";
    return true;
  }

  //模态框确定按钮事件请求路由
  handleAdd = (fields) => {
    this.props.dispatch({
      type: 'retryCfg/submit',
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
        type: 'retryCfg/fetch',
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
    const ids = selectedRows.map(row => row.id).join(',');

    this.setState({
      selectedRows: [],
    });
    dispatch({
      type: 'retryCfg/del',
      payload: {
        _id: _ids,
        id: ids,
      },
      callback:this.handleDbCallback,
    });
  }
  //列删除按钮事件
  handleDel = (_id,id) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'retryCfg/del',
      payload: {
        _id: _id,
        id: id,
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
            <FormItem label="id">
              <Input placeholder="请输入" onChange={this.handleChangeId} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="名称">
              <Input placeholder="请输入" onChange={this.handleChangeName} />
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
            <FormItem label="id">
              <Input placeholder="请输入" onChange={this.handleChangeId} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="名称">
              <Input placeholder="请输入" onChange={this.handleChangeName} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="内容">
              <Input placeholder="请输入" onChange={this.handleChangeContent} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="备注">
              <Input placeholder="请输入" onChange={this.handleChangeDesc} />
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
    const { retryCfg: { data }, loading,form } = this.props;
    const { selectedRows } = this.state;
    const { currentItem={}, modalType,modalVisible } = this.props.retryCfg;

    const columns = [
      {
        title: 'id',
        dataIndex: 'id',
        sorter: true,
        key:"id",
      },
      {
        title: '名称',
        dataIndex: 'name',
        sorter: true,
      },
      {
        title: '配置内容',
        dataIndex: 'content',
        sorter: true,
        width:"300px"
      },
      {
        title: '备注',
        dataIndex: 'desc',
        sorter: true,
        width:"300px"
      },{
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
            <Popconfirm title="确定要删除?" onConfirm={() => this.handleDel(record._id,record.id)} okText="是" cancelText="否">
              <a href="#">删除</a>
            </Popconfirm>
          </span>
        ),
      },
    ];

    return (
      <PageHeaderLayout >
        <Card  bordered={false}>
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
          title={`${modalType === 'add' ? '新建' : '修改'}重试配置`}
          visible={modalVisible}
          onOk={() => this.okHandle()}
          onCancel={() => this.handleModalVisible(false,"",currentItem)}
        >
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="id"
            extra="1~100。唯一，不能重复。"
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
            label="名称"
          >
            {form.getFieldDecorator('name', {
              initialValue: currentItem.name,
              rules: [{ required: true,whitespace:true}],
            })(
              <Input placeholder="请输入" disabled={this.state.disabled} />
            )}
          </FormItem>
          <FormItem
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label="配置内容"
            extra="请输入json形式配置内容。如{'max_count':'6','1':'120000',  '2':'300000',  '3':'780000', 'other':'10800000'} . 注意将单引号替换为双引号"
          >
            {form.getFieldDecorator('content', {
              initialValue: currentItem.content,
              rules: [{ required: true,whitespace:true,}],
            })(
              <TextArea rows={3} placeholder="请输入json形式配置内容" />
            )}
            <span style={{color:"red",}}>{this.state.jsonErr}</span>
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
              <TextArea rows={3} />
            )}
          </FormItem>
        </Modal>
      </PageHeaderLayout>
    );
  }
}
