import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Row, Col, Card, Form, Input, Button, Modal, Table, Icon, Checkbox  } from 'antd';

import styles from './TableList.less';


const FormItem = Form.Item;


@connect(({ test, loading }) => ({
  test,
  loading: loading.models.test,
}))
@Form.create()
export default class TableList extends PureComponent {
  constructor(props) {
    super(props);
    this.state =  {
      visible:false,
    }
  }

  handleOnclick = () => {
    this.setState({
      visible:true
    });
  }

  handleCancel = () => {
    this.setState({
      visible:false
    });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
      }
    });
  }

  render() {
    const { getFieldDecorator } = this.props.form;

   return(<div>
     <Button type="primary" onClick={this.handleOnclick}>Open</Button>
     <Modal
       title="Basic Modal"
       visible={this.state.visible}
       onOk={this.handleSubmit}
       onCancel={this.handleCancel}
     >
       <Form className="login-form">
         <FormItem>
           {getFieldDecorator('userName', {
             rules: [{ required: true, message: 'Please input your username!' }],
           })(
             <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" />
           )}
         </FormItem>
         <FormItem>
           {getFieldDecorator('password', {
             rules: [{ required: true, message: 'Please input your Password!' }],
           })(
             <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
           )}
         </FormItem>
         <FormItem>
           {getFieldDecorator('remember', {
             valuePropName: 'checked',
             initialValue: true,
           })(
             <Checkbox>Remember me</Checkbox>
           )}
         </FormItem>
       </Form>
     </Modal>
   </div>)
  }
}
