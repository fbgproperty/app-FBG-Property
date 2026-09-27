# Giỏ hàng dự án — FBG Property

Trang công khai **giohangduan.fbgproperty.vn**: xem quỹ căn (giỏ hàng) của từng dự án, bảng hàng theo toà/tầng, giá và tình trạng từng căn, tài liệu bán hàng cho đại lý, gửi yêu cầu báo giá hoặc giữ căn.

## Độc lập hoàn toàn với app

- Đây là một **trang tĩnh riêng**, viết bằng HTML + CSS + JavaScript thuần. Không có framework, không có bước build, không dùng Tailwind.
- **Không dùng chung mã nguồn** với app React/Vite và **không nằm trong bản build Vite** của app. Không file nào trong app import thư mục này, và thư mục này cũng không import gì từ app.
- Chỉ **đồng bộ về giao diện**: font Inter, nền slate/gray-50, thẻ trắng bo 16–24px, màu chính indigo-600 `#4f46e5`, gradient thương hiệu indigo → fuchsia (`#6366f1 → #d946ef` cho logo; `#4f46e5 → #c026d3` cho hero và nút chính, như `from-indigo-600 to-fuchsia-600` của app). Màu trạng thái căn giống `UNIT_STATUS_META` của app; riêng chữ trong badge đậm hơn một bậc (-700) để đạt tương phản WCAG AA.
- Tài nguyên ngoài duy nhất là font Google Inter. Nếu không tải được font, trang dùng `system-ui`.

## Cấu trúc thư mục

```
giohangduan/
├── index.html    # Khung trang, biểu tượng SVG (kiểu lucide), các mục
├── styles.css    # Toàn bộ giao diện (biến CSS ở :root)
├── projects.js   # Danh mục dự án tuyển chọn và tài liệu bán hàng (sửa tay)
├── app.js        # Logic: gọi API, lọc/sắp xếp, bảng hàng, drawer, form
├── icon.svg      # Logo (bản sao từ public/icon.svg của app)
└── README.md
```

`projects.js` được nạp **trước** `app.js`.

## Cấu hình (`CONFIG` ở đầu `app.js`)

| Khoá | Mặc định | Ý nghĩa |
|---|---|---|
| `API_BASE` | `https://appapi.fbgproperty.vn` | Địa chỉ backend |
| `BRIDGE_KEY` | `fbgbridge_…` | Gửi trong header `X-Bridge-Key` (khoá công khai, giống app) |
| `HOTLINE` | `''` | Số hotline. Để trống thì ẩn nút gọi |
| `ZALO` | `''` | Số Zalo hoặc link `https://zalo.me/...`. Để trống thì ẩn nút Zalo |
| `EMAIL` | `info@fbgproperty.vn` | Email liên hệ ở phần liên hệ và footer |
| `PAGE_SIZE` | `30` | Số căn mỗi lần bấm "Xem thêm" |
| `TIMEOUT_MS` | `15000` | Thời gian chờ tối đa mỗi request |

## Tham số URL

| Tham số | Ví dụ | Tác dụng |
|---|---|---|
| `?project=` | `?project=Aurora Riverside` | Chọn dự án (khớp không phân biệt dấu/hoa thường, theo tên, key hoặc `aliases`). Nếu không có tham số này, trang chọn dự án đầu danh sách (dự án Hot đứng đầu) |
| `?du-an=` | `?du-an=aurora-riverside` | Tên gọi khác của `?project=` |
| `?unit=` | `?project=…&unit=A-12.03` | Mở sẵn chi tiết một căn. Nút "Chia sẻ" tạo đúng link này |
| `?can=` | `&can=A-12.03` | Tên gọi khác của `?unit=` |
| `?ref=` | `?ref=ctv123` | Mã giới thiệu, được gửi kèm form (trường `ref`) |
| `?demo=1` | | Dùng dữ liệu minh hoạ có sẵn (3 dự án, 120/108/60 căn) và hiện banner "Đang xem dữ liệu minh hoạ". Chỉ bật khi đúng `demo=1` |

**Neo mục (hash):** `#tong-quan` (tổng quan + KPI), `#tai-lieu` (tài liệu bán hàng), `#gio-hang` (danh sách căn), `#bang-hang` (bảng hàng theo toà/tầng), `#chinh-sach`, `#tien-do`, `#mat-bang`, `#lien-he`.
Khi mở link có hash, trang tự cuộn lại đúng mục sau khi dữ liệu tải xong. Ví dụ: `?project=Đà Nẵng Times Square#tai-lieu`.
Các mục chính sách, tiến độ, mặt bằng và tài liệu chỉ hiện khi có dữ liệu.

## Nguồn dữ liệu (API)

Mọi request đều gửi header `X-Bridge-Key`.

- `GET /inventory/summary` trả về `{ items: [{ key, project, count }], totalUnits, totalProjects }`. Đây là danh sách dự án.
- `GET /inventory?project=<tên>` trả về `{ units: [{ code, block, floor, area, type, direction, price, status }], total }`.
- Làm giàu thông tin (không bắt buộc; lỗi thì ẩn mục, không ảnh hưởng trang):
  - `GET /web/projects?page=1&pageSize=100&q=<tên>`: tìm dự án web theo tên đã chuẩn hoá.
  - `GET /web/projects/<id>`: vị trí, chủ đầu tư, ảnh, khoảng giá…
  - `GET /web/project-content/<id>`: giới thiệu, chính sách, tiến độ, mặt bằng, tài liệu, tin tức.
- `POST /lp/lead` với JSON `{ project, code?, name, phone, ref?, note? }` trả về `{ ok }`. Đây là form "Nhận báo giá & giữ căn". Trường `project` luôn là tên dự án đúng như trong `/inventory/summary` (kể cả khi dự án tuyển chọn hiển thị bằng tên khác qua `aliases`).

Trang chuẩn hoá tình trạng căn giống app (Còn hàng / Giữ chỗ / Đã bán / Khoá). Nhãn hiển thị giữ nguyên chữ gốc. Căn có chữ "độc quyền" được gắn thêm tag "Độc quyền". Giá định dạng giống `fmtVnd` của app. Nếu giá là chữ (ví dụ "Liên hệ") thì hiển thị nguyên văn.
Mọi chuỗi từ API đều được escape. Link từ API chỉ dùng khi bắt đầu bằng `http://` hoặc `https://`.

## Dự án tuyển chọn & tài liệu bán hàng (`projects.js`)

`window.FBG_PROJECTS` là danh sách dự án do FBG tự khai báo. Các dự án này:

- **Luôn có trong thanh chọn dự án**, kể cả khi `/inventory/summary` không có dự án đó hoặc API lỗi. Dự án có `hot: true` đứng đầu, kèm nhãn 🔥 Hot.
- Được ghép với dữ liệu quỹ căn theo tên hoặc `aliases` (không phân biệt dấu/hoa thường). Khi đã có bảng hàng trên hệ thống, dự án hiển thị đầy đủ giỏ hàng.
- Khi chưa có bảng hàng, mục giỏ hàng hiện "Giỏ hàng đang được cập nhật". Tổng quan chỉ hiện thông tin đã khai báo: tên, vị trí, đơn vị phân phối, toà. **Trang không tự tạo giá, số căn hay bất kỳ số liệu nào khác.**
- Có mục **#tai-lieu "Tài liệu bán hàng"** gồm: thông báo gửi "Kính gửi Quý Anh Chị Đại Lý", đơn vị phân phối, lưới thẻ tài liệu (mở trong thẻ mới, mỗi thẻ có nút "Sao chép link", thẻ "Link tổng" nổi bật), nút **"Sao chép toàn bộ"** (tạo sẵn tin nhắn để dán vào Zalo) và băng slogan ở cuối.
- Vẫn hiện trong chế độ `?demo=1`, cạnh các dự án minh hoạ.

`type` của tài liệu quyết định biểu tượng: `all` (link tổng), `floorplan`, `marketing`, `legal`, `qa`, `training`. Giá trị khác được coi là tài liệu chung. Link phải bắt đầu bằng `https://`.

Ví dụ thêm một dự án mới (chép vào mảng trong `projects.js`):

```js
{
  id: 'ten-du-an',
  name: 'Tên dự án',
  aliases: ['Tên gọi khác'],
  location: 'Đà Nẵng',
  distributor: 'FUTALand',
  blocks: ['CS1', 'CS2'],
  hot: false,
  notice: 'Nội dung thông báo gửi đại lý…',
  slogan: 'Câu slogan hiển thị ở cuối mục tài liệu',
  docs: [
    { type: 'all', label: 'Link tổng', desc: 'Toàn bộ tài liệu dự án', url: 'https://drive.google.com/drive/folders/…' },
    { type: 'floorplan', label: 'Mặt bằng CS1', desc: 'Mặt bằng toà CS1', url: 'https://drive.google.com/drive/folders/…' },
    { type: 'legal', label: 'Pháp lý', desc: 'Hồ sơ pháp lý dự án', url: 'https://drive.google.com/drive/folders/…' },
  ],
},
```

Các trường giới thiệu (không bắt buộc) hiện ở phần Tổng quan khi hệ thống chưa có dữ liệu tương ứng: `investor` (chủ đầu tư), `type` (loại hình), `scale` (quy mô, dạng chữ), `legal` (pháp lý), `overview` (đoạn giới thiệu). Xem mục Capital Square trong `projects.js` làm mẫu.

Mọi trường đều không bắt buộc, trừ `name`. Muốn trang tự ghép với bảng hàng trên hệ thống, hãy để `name` hoặc một phần tử `aliases` trùng với tên dự án trong `/inventory/summary`.

## Xem thử trên máy

```bash
# từ thư mục gốc repo
npx serve giohangduan
# hoặc
cd giohangduan && python3 -m http.server 8080
```

Sau đó mở `http://localhost:8080/?demo=1` để xem dữ liệu minh hoạ, hoặc `http://localhost:8080/` để gọi API thật (backend cần cho phép CORS, xem bên dưới). Trang cũng mở được trực tiếp bằng `file://…/index.html?demo=1`.

## Triển khai

- Đây là site tĩnh: upload nguyên 5 file (`index.html`, `styles.css`, `projects.js`, `app.js`, `icon.svg`) lên host tĩnh của **giohangduan.fbgproperty.vn** (Nginx, Cloudflare Pages, Netlify, S3 + CDN…). Không cần build.
- Backend `appapi.fbgproperty.vn` phải **cho phép CORS** từ origin `https://giohangduan.fbgproperty.vn` với các điều kiện sau:
  - `Access-Control-Allow-Origin: https://giohangduan.fbgproperty.vn`
  - `Access-Control-Allow-Headers: X-Bridge-Key, Content-Type`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`, và trả lời request preflight `OPTIONS`.
- Khi cập nhật `projects.js` hoặc `app.js`, nên xoá cache CDN, hoặc thêm hậu tố phiên bản như `app.js?v=2` trong `index.html`.
- Nếu API lỗi, trang vẫn hiện các dự án tuyển chọn cùng tài liệu bán hàng, kèm thông báo "Chưa kết nối được giỏ hàng trực tuyến" và nút "Thử lại". Nếu không có dự án tuyển chọn nào, trang hiện thẻ lỗi có nút "Thử lại".
