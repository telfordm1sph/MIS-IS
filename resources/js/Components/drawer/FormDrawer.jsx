import React, { useEffect } from "react";
import {
    Drawer,
    Form,
    Input,
    InputNumber,
    Button,
    Space,
    Select,
    Row,
    Col,
} from "antd";

const FormDrawer = ({
    open,
    onClose,
    onSubmit,
    title,
    mode = "create",
    initialValues = {},
    fields = [],
    loading = false,
    columns = 2, // 👈 default columns
}) => {
    const [form] = Form.useForm();
    const span = 24 / columns;

    useEffect(() => {
        if (open) {
            form.resetFields();
            form.setFieldsValue(initialValues);
        }
    }, [open, initialValues]);

    const handleFinish = (values) => {
        onSubmit(values);
    };

    return (
        <Drawer title={title} size={850} onClose={onClose} open={open}>
            <Form layout="vertical" form={form} onFinish={handleFinish}>
                <Row gutter={16}>
                    {fields.map((field) => {
                        if (field.hidden) {
                            return (
                                <Form.Item
                                    key={field.name}
                                    name={field.name}
                                    hidden
                                >
                                    <Input />
                                </Form.Item>
                            );
                        }

                        let Component = Input;
                        if (field.type === "number") Component = InputNumber;

                        const colSpan = field.col || span;

                        return (
                            <Col span={colSpan} key={field.name}>
                                <Form.Item
                                    label={field.label}
                                    name={field.name}
                                    rules={field.rules || []}
                                >
                                    {field.type === "select" ? (
                                        <Select
                                            placeholder={field.placeholder}
                                            options={field.options}
                                            allowClear
                                            disabled={field.disabled}
                                        />
                                    ) : (
                                        <Component
                                            style={{ width: "100%" }}
                                            placeholder={field.placeholder}
                                            disabled={field.disabled}
                                            {...(field.type !== "number"
                                                ? { allowClear: true }
                                                : {})}
                                        />
                                    )}
                                </Form.Item>
                            </Col>
                        );
                    })}
                </Row>

                <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {mode === "create" ? "Create" : "Update"}
                    </Button>
                </Space>
            </Form>
        </Drawer>
    );
};

export default FormDrawer;
