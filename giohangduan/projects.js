/*
 * Danh mục dự án & tài liệu bán hàng — chỉnh sửa trực tiếp file này để thêm/cập nhật dự án.
 * Mỗi dự án xuất hiện trong thanh chọn dự án kể cả khi chưa có bảng hàng trên hệ thống.
 * Khớp với dữ liệu quỹ căn (API) theo tên hoặc một trong các `aliases` (không phân biệt dấu/hoa thường).
 */
window.FBG_PROJECTS = [
  {
    id: 'da-nang-times-square',
    name: 'Đà Nẵng Times Square',
    aliases: ['Times Square', 'Times Squares', 'Danang Times Square', 'Da Nang Times Square'],
    location: 'Đà Nẵng',
    distributor: 'FUTALand',
    blocks: ['CT7'],
    hot: true,
    notice: 'FUTALand gửi đến Quý Anh Chị Đại Lý thông tin dự án Đà Nẵng Times Square phục vụ cho công tác bán hàng sắp đến. Tài liệu sẽ được cập nhật liên tục, Quý Anh Chị Đại Lý vui lòng theo dõi.',
    slogan: 'Cùng nhau bứt phá doanh số – Chạm đỉnh thành công',
    docs: [
      { type: 'all', label: 'Link tổng', desc: 'Toàn bộ tài liệu dự án', url: 'https://drive.google.com/drive/folders/1yZPv9GAGj1Fl0kT72WuPuwTsqZlOUGLT' },
      { type: 'floorplan', label: 'Mặt bằng CT7', desc: 'Mặt bằng toà CT7', url: 'https://drive.google.com/drive/folders/138JaUwECcG-gzgK8qKFqwDZhDJ-atmdJ' },
      { type: 'marketing', label: 'Marketing', desc: 'Hình ảnh, video, ấn phẩm truyền thông', url: 'https://drive.google.com/drive/folders/1FYnZ5Utte-fO7qgnBmf_JLWaFBewOiR1' },
      { type: 'legal', label: 'Pháp lý', desc: 'Hồ sơ pháp lý dự án', url: 'https://drive.google.com/drive/folders/1TvQui-iMSVD6RHeKU3cEjalMuiwBr-R4' },
      { type: 'qa', label: 'Q&A', desc: 'Bộ câu hỏi thường gặp', url: 'https://drive.google.com/drive/folders/13AMcqz6G5dAfvvO0RxYsnLkw789cs7LM' },
      { type: 'training', label: 'Tài liệu đào tạo', desc: 'Tài liệu đào tạo đại lý', url: 'https://drive.google.com/drive/folders/1O9OP81vBVIWc7eLyGSVgGzMAq6Ba4_wX' },
    ],
  },
];
