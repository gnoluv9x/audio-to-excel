'use client';
import { Button, Form, message, notification, Upload } from 'antd';
import React, { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface UploadFormProps {}

const UPLOAD_IMAGE_SIZE = 5; // Mib

const UploadForm: React.FC<UploadFormProps> = () => {
  const [form] = Form.useForm();
  const [listUploadFiles, setListUploadFiles] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (values: any) => {
    if (!values?.file) {
      message.error('Vui lòng chọn file trước khi gửi');
      return;
    }

    const formData = new FormData();
    formData.append('file', values['file'][0]['originFileObj']);

    try {
      setLoading(true);
      const resp = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      }).then((resp) => resp.json());

      console.log('Debug_here resp: ', resp);

      if (resp.text) {
        handleSaveToExcel(resp.text.trim());
      } else {
        throw new Error('Không nhận dạng được file');
      }
    } catch (error: any) {
      console.error('Debug_here error: ', error);
      message.error(error?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToExcel = (str: string) => {
    // Tách chuỗi thành mảng
    const rows = str.split(', ').map((item) => [item]);

    // Tạo một workbook mới
    const wb = XLSX.utils.book_new();

    // Tạo một worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Tạo buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Chuyển đổi buffer thành Blob
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Tải xuống file
    saveAs(blob, 'data.xlsx');
  };

  const handleBeforeUpload = (file: any) => {
    console.log('Debug_here file: ', file);
    // validate file type
    const isImage = file.type.startsWith('audio/');
    if (!isImage) {
      notification.error({ message: 'Chỉ có thể upload file mp3', duration: 5 });
      return Upload.LIST_IGNORE;
    }

    // validate file size
    const isLessThanFiveMb = file.size < UPLOAD_IMAGE_SIZE * 1024 * 1024;
    if (!isLessThanFiveMb) {
      notification.error({
        message: `Dung lượng file nhỏ hơn ${UPLOAD_IMAGE_SIZE}Mb`,
        duration: 5,
      });
      return Upload.LIST_IGNORE;
    }

    setListUploadFiles((prevFileList: any) => [...prevFileList, file]);

    return false;
  };

  const handleRemove = (file: any) => {
    setListUploadFiles((prevFileList: any) =>
      prevFileList.filter((item: any) => item.uid !== file.uid),
    );
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item
        label="Ảnh"
        name="file"
        labelAlign="left"
        valuePropName="fileList"
        getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
      >
        <Upload
          maxCount={1}
          listType="picture-card"
          accept=".mp3"
          beforeUpload={handleBeforeUpload}
          onRemove={handleRemove}
        >
          {listUploadFiles?.length < 1 && (
            <button style={{ border: 0, background: 'none' }} type="button">
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </button>
          )}
        </Upload>
      </Form.Item>
      <Button loading={loading} type="primary" htmlType="submit">
        Submit
      </Button>
    </Form>
  );
};

export default UploadForm;
