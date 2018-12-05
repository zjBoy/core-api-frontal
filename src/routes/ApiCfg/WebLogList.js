import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Row, Col, Card, Form, Input, Select, Radio,Button, Modal, message, Badge, Divider,Popconfirm  } from 'antd';
import StandardTable from 'components/StandardTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './NotificationCfgList.less';

const { TextArea } = Input;
const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Option } = Select;
const getValue = obj => Object.keys(obj).map(key => obj[key]).join(',');
const statusText = ["禁用", "启用"];
const status = ["error","success"];

//导入model/webLog
@connect(({ webLog, loading }) => ({
  webLog,
  loading: loading.models.webLog,
}))

//含查询条件Card，查询结果TableList,模态框Modal
@Form.create()
export default class TableList extends PureComponent {

  state = {
    modalVisible:false,
    selectedRows: [],
    formValues: {},
    searchForm: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'webLog/fetch',
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
      type: 'webLog/fetch',
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
    this.props.webLog.currentItem = {};
    form.resetFields();
    this.setState({
      formValues: {},
      searchForm:{},
    });
    dispatch({
      type: 'webLog/fetch',
      payload: {},
    });
  }
  //查询按钮事件
  handleSearch = (e) => {
    e.preventDefault();
    const { dispatch } = this.props;
    dispatch({
      type: 'webLog/fetch',
      payload: {
        ...this.state.searchForm ,
      }
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeServiceType = (e) =>{
    e.preventDefault();
    const serviceType = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, serviceType },
    });
  }
  //将查询框条件赋值给变量searchForm
  handleChangeOpType = (e) =>{
    e.preventDefault();
    const opType = e.target.value;
    this.setState({
      searchForm: { ...this.state.searchForm, opType },
    });
  }

  //渲染查询条件表单
  renderForm() {
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="服务类型" extra="如商户、应用、接口等">
              <Input placeholder="" onChange={this.handleChangeServiceType} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="操作类型" extra="可选项：新增、修改、删除">
              <Input placeholder="" onChange={this.handleChangeOpType} />
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
          <span className={styles.submitButtons}>
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
    const { webLog: { data }, loading,form } = this.props;
    const { selectedRows } = this.state;
    const { currentItem={}, modalType } = this.props.webLog;

    const columns = [
      {
        title: 'ip',
        dataIndex: 'ipAddr',
        sorter: true,
        key:"ipAddr",
      },
      {
        title: '服务类型',
        dataIndex: 'serviceType',
        sorter: true,
      },
      {
        title: '操作类型',
        dataIndex: 'opType',
        sorter: true,
        key:"opType",
      },
      {
        title: '操作内容',
        dataIndex: 'content',
        sorter: true,
        width:"400px"
      },{
        title: '操作时间',
        dataIndex: 'lastModifyTime',
        sorter: true,
        render: val => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: '操作人',
        dataIndex: 'lastModifyUser',
      }
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
      </PageHeaderLayout>
    );
  }
}
