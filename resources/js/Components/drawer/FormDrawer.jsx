import React, { useEffect } from "react";
import { Drawer, Form, Input, InputNumber, Button, Space, Select } from "antd";

const FormDrawer = ({
    open,
    onClose,
    onSubmit,
    title,
    mode = "create",
    initialValues = {},
    fields = [],
    loading = false,
}) => {
    const [form] = Form.useForm();

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
        <Drawer title={title} size={550} onClose={onClose} open={open}>
            <Form layout="vertical" form={form} onFinish={handleFinish}>
                {fields.map((field) => {
                    let Component = Input;

                    if (field.type === "number") {
                        Component = InputNumber;
                    }

                    if (field.type === "select") {
                        return (
                            <Form.Item
                                key={field.name}
                                label={field.label}
                                name={field.name}
                                rules={field.rules || []}
                            >
                                <Select
                                    placeholder={field.placeholder}
                                    options={field.options}
                                    allowClear
                                    disabled={field.disabled}
                                />
                            </Form.Item>
                        );
                    }

                    return (
                        <Form.Item
                            key={field.name}
                            label={field.label}
                            name={field.name}
                            rules={field.rules || []}
                        >
                            <Component
                                style={{ width: "100%" }}
                                placeholder={field.placeholder}
                                disabled={field.disabled}
                                {...(field.type !== "number"
                                    ? { allowClear: true }
                                    : {})}
                            />
                        </Form.Item>
                    );
                })}

                <Space style={{ display: "flex", justifyContent: "end" }}>
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
