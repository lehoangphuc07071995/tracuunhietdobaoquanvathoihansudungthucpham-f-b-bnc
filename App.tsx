import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, LayoutGrid, List, Copy, Check, Clock3, Thermometer, Snowflake, Home, ChevronRight, ChevronDown, Flame, PackageSearch, AlertTriangle, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import appIconUrl from 'container:///mnt/data/src/assets/f607abb135050e38-image_70D56EB4-2160-4774-BBB0-8008B40A9514.jpeg';

type Item = { a:'PL1'|'PL2'|'PL3'; g:string; n:number; name:string; room:string; cool:string; freeze:string; note:string; flag?:string; enName?:string; weight?:string; displayCool?:string; displayHot?:string };
const code=(it:Item)=>`${it.a}-${String(it.n).padStart(2,'0')}`;
const RAW_DATA: Item[] = [
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:1,name:'Các loại bánh ngọt ăn sáng Đã nướng',room:'Sử dụng trong ngày',cool:'—',freeze:'—',note:'Cất trong tủ lạnh (1-4 độ C) từ 3-5 ngày --> làm bread butter pudding',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:2,name:'Các loại bánh ngọt',room:'Sử dụng trong ngày',cool:'2 ngày',freeze:'30 ngày',note:'Không dùng lại khi đã bày trên buffet',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:3,name:'Các loại bánh mỳ',room:'Sử dụng trong ngày',cool:'2 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:4,name:'Sô cô la décor',room:'15 ngày',cool:'—',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:5,name:'Bánh mỳ bơ tỏi',room:'Sử dụng trong ngày',cool:'—',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:6,name:'Đế bánh Pizza',room:'—',cool:'3 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:7,name:'Macaron',room:'—',cool:'7 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:8,name:'Các loại bánh bích quy đã nướng',room:'5 ngày',cool:'—',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:9,name:'Chè các loại đã nấu',room:'Sử dụng trong ngày',cool:'2 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:10,name:'Các nguyên liệu sơ chế để nấu chè',room:'—',cool:'2 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:11,name:'Bánh mỳ crouton',room:'3 ngày',cool:'7 ngày',freeze:'—',note:'- Để trong hộp kín',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:12,name:'Nước đường sau khi nấu và để nguội',room:'—',cool:'30 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:13,name:'Bơ (đã mở/cắt); phomát (đã mở/cắt)',room:'5 ngày',cool:'30 ngày',freeze:'—',note:'- Theo khuyến cáo của Nhà sản xuất nếu trên bao bì có ghi.',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:14,name:'Các loại bột đã mở bao bì',room:'30 ngày',cool:'—',freeze:'—',note:'- Theo khuyến cáo của nhà sản xuất (nếu có);',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:15,name:'Sữa tươi (đã mở hộp)',room:'—',cool:'3 ngày',freeze:'—',note:'- Khi bảo quản, cần bao gói hoặc đóng kín nắp để hơi nước không vào sản phẩm.',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:16,name:'Bột bánh waffle pancake',room:'—',cool:'1 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:17,name:'Bánh phở, bún, bánh hỏi, bánh chưng, bánh ít, bánh gai.',room:'—',cool:'2 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:18,name:'Các loại bạt Croissant, Puff Pastry',room:'—',cool:'—',freeze:'15 ngày',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:19,name:'Các loại hoa quả hộp đã mở nắp',room:'—',cool:'5 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:20,name:'Các loại kem đốt (Cream brulle\'), Kem caramel',room:'—',cool:'5 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'I. Bánh, chè, bơ sữa',n:21,name:'Các loại kem: topping, whipping cream (đã mở hộp)',room:'—',cool:'3 ngày',freeze:'—',note:'- Ưu tiên theo hướng dẫn của nhà sản xuất ghi trên bao bì trước.',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:22,name:'Pesto sauce',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:23,name:'Ceasar',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:24,name:'Balsamico dressing',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:25,name:'Italian dressing',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:26,name:'Mustard sauce',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:27,name:'Sốt đậu hầm',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:28,name:'Thousand sauce',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:29,name:'Sốt cà hải sản',room:'—',cool:'3 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:30,name:'Sốt cà chua',room:'—',cool:'3 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:31,name:'Sốt BBQ',room:'—',cool:'3 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:32,name:'Sốt thịt bò băm',room:'—',cool:'3 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'II. Sốt (Tự chế biến)',n:33,name:'Nước mắm (đã pha)',room:'—',cool:'7 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'III. Thịt gia súc tươi',n:34,name:'Thịt bò tươi, bê, heo',room:'—',cool:'3 ngày',freeze:'60 ngày',note:'—',flag:''},
{a:'PL1',g:'III. Thịt gia súc tươi',n:35,name:'Các loại xương ống',room:'—',cool:'3 ngày',freeze:'60 ngày',note:'—',flag:''},
{a:'PL1',g:'IV. Thịt gia súc đã chế biến',n:36,name:'Đồ hộp thịt đã mở nắp',room:'—',cool:'2 ngày',freeze:'—',note:'- Theo khuyến cáo của nhà sản xuất nếu có ghi trên bao bì. Lưu ý: Cho ra các dụng cụ chứa đựng khác khi bảo quản, không để nguyên trong hộp kim loại.',flag:''},
{a:'PL1',g:'IV. Thịt gia súc đã chế biến',n:37,name:'Các món thịt đã nấu chín',room:'—',cool:'3 ngày',freeze:'30 ngày',note:'- Phải làm nguội trước khi cho vào kho đông.',flag:''},
{a:'PL1',g:'IV. Thịt gia súc đã chế biến',n:38,name:'Các loại nước dùng',room:'—',cool:'2 ngày',freeze:'30 ngày',note:'- Phải làm nguội trước khi cho vào bảo quản lạnh. Chia thành các đơn vị nhỏ khi bảo quản để đảm bảo nhiệt độ.',flag:''},
{a:'PL1',g:'V. Thịt gia cầm tươi',n:39,name:'Gà, vịt nguyên con đã cắt miếng',room:'—',cool:'2 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'V. Thịt gia cầm tươi',n:40,name:'Món hầm, kho',room:'—',cool:'3 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'V. Thịt gia cầm tươi',n:41,name:'Các loại thịt xông khói, gà, ức vịt',room:'—',cool:'3 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'VI. Thủy sản tươi',n:42,name:'Các loại thủy sản tươi đã ướp gia vị',room:'—',cool:'2 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'VI. Thủy sản tươi',n:43,name:'Các loại thủy sản tươi',room:'—',cool:'3 ngày',freeze:'30 ngày',note:'—',flag:''},
{a:'PL1',g:'VII. Sản phẩm chế biến từ thủy sản',n:44,name:'Cá hộp, đã mở nắp',room:'—',cool:'3 Ngày',freeze:'—',note:'Hoặc theo hướng dẫn của NSX / Bảo quản lạnh trong tủ lạnh',flag:''},
{a:'PL1',g:'VII. Sản phẩm chế biến từ thủy sản',n:45,name:'Các loại nhuyễn thể 2 mảnh (sò, vẹm...) đã nấu chín',room:'Sử dụng trong ngày',cool:'—',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VII. Sản phẩm chế biến từ thủy sản',n:46,name:'Cua, ghẹ, tôm, cá: đã hấp, luộc, nấu chín',room:'—',cool:'3 ngày',freeze:'20 ngày',note:'Đối với trường hợp nướng chỉ sử dụng trong ngày.',flag:''},
{a:'PL1',g:'VII. Sản phẩm chế biến từ thủy sản',n:47,name:'Các loại hải sản xông khói (Cá hồi, cá thu, lươn...) đã cắt miếng (đã cắt miệng bao hút chân không).',room:'—',cool:'2 ngày',freeze:'30 ngày',note:'Theo hướng dẫn của NSX. Nếu không có khuyến cáo thì hạn được tuân thủ là 2 ngày / Bảo quản lạnh trong tủ lạnh',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:48,name:'Bột gạo ướt',room:'—',cool:'1 ngày',freeze:'—',note:'Hàng ngày yêu cầu thay nước để đảm bảo gạo không bị chua',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:49,name:'Các loại hạt rang (đậu phộng, điều, hạnh nhân, mè...)',room:'7 ngày',cool:'—',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:50,name:'Đậu phụ miếng (đậu hũ) mua từ nhà cung cấp',room:'—',cool:'3 ngày',freeze:'—',note:'Yêu cầu ngâm trong nước sạch và thay nước hằng ngày. Bảo quản trong tủ lạnh',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:51,name:'Các loại đậu hũ tự làm (nhà hàng hoa)',room:'—',cool:'2 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:52,name:'Các loại đồ khô (đậu xanh, mì, miến...) sau khi mở bao bì',room:'1/2 hạn sử dụng còn lại của sản phẩm và tối đa là 30 ngày.',cool:'—',freeze:'—',note:'Bảo quản nơi khô ráo thoáng mát',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:53,name:'Trứng đã tách vỏ',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:54,name:'Trứng luộc chín',room:'—',cool:'2 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:55,name:'Các loại màu thực phẩm sau khi mở',room:'1/2 hạn sử dụng còn lại',cool:'—',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:56,name:'Các loại Syrup mở bao bì',room:'—',cool:'1/4 hạn sử dụng còn lại và tối đa là 30 ngày.',freeze:'—',note:'Ưu tiên ghi hạn theo khuyến cáo trên bao bì sản phẩm trước',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:57,name:'Sashimi cá hồi, cá ngừ... đã cắt lát chờ phục vụ',room:'—',cool:'1 ngày',freeze:'—',note:'Bảo quản lạnh (không sử dụng lại đồ đã set up ngoài quầy buffet để ăn sashimi)',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:58,name:'Đồ nguội đã cắt lát',room:'—',cool:'1 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:59,name:'Đồ nguội sau khi mở bao bì',room:'—',cool:'2 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:60,name:'Rau củ sau khi sơ chế',room:'—',cool:'2 ngày',freeze:'10 ngày',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:61,name:'Rau củ sau khi nấu chín',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:62,name:'Sốt mayonnaise và các sốt khác sau mở bao bì',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:63,name:'Phô mai mềm cắt lát, phô mai cứng cắt lát, Butter cắt lát',room:'—',cool:'3 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:64,name:'Mứt và bơ đậu phộng sau khi mở bao bì',room:'—',cool:'7 ngày',freeze:'—',note:'—',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:65,name:'Các loại rượu đã mở nắp',room:'Nhiệt độ phòng',cool:'—',freeze:'—',note:'1/2 thời gian ghi trên bao bì',flag:'MÂU THUẪN TRONG FILE GỐC - CẦN XÁC NHẬN QA: Cột Phòng ghi chữ Nhiệt độ phòng, không phải số ngày. Giữ nguyên văn, không tự sửa.'},
{a:'PL1',g:'VIII. Các món khác',n:66,name:'Tương cà, tương ớt đã mở nắp',room:'15 ngày',cool:'—',freeze:'—',note:'Bảo quản trong tủ mát. Ưu tiên ghi hạn theo khuyến cáo trên bao bì sản phẩm trước',flag:'MÂU THUẪN TRONG FILE GỐC - CẦN XÁC NHẬN QA: Cột Phòng ghi 15 ngày nhưng Ghi chú ghi bảo quản trong tủ mát. Giữ nguyên văn.'},
{a:'PL1',g:'VIII. Các món khác',n:67,name:'Mù tạt đã mở nắp',room:'7 ngày',cool:'—',freeze:'—',note:'Bảo quản trong tủ mát. Ưu tiên ghi hạn theo khuyến cáo trên bao bì sản phẩm trước',flag:'MÂU THUẪN TRONG FILE GỐC - CẦN XÁC NHẬN QA: Cột Phòng ghi 7 ngày nhưng Ghi chú ghi bảo quản trong tủ mát. Giữ nguyên văn.'},
{a:'PL1',g:'VIII. Các món khác',n:68,name:'Các loại dưa muối chua (Dưa cải, cà pháo, củ kiệu)',room:'—',cool:'3-5 ngày',freeze:'—',note:'Bảo quản trong hộp kín',flag:''},
{a:'PL1',g:'VIII. Các món khác',n:69,name:'Các loại gia vị nấu ăn như muối, đường, bột ngọt, hạt nêm... đã mở bao bì',room:'30 ngày',cool:'—',freeze:'—',note:'- HSD, điều kiện bảo quản sau khi mở bao sẽ ưu tiên kiến nghị NSX',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:1,name:'Đồ uống pha sẵn (trà sữa, trà đen, trà bí đao, sữa hạt, cà phê phin, thạch tự nấu, trân châu...)',room:'Sử dụng trong ngày',cool:'2 ngày',freeze:'—',note:'Ghi đầy đủ thông tin giờ, ngày pha chế và HSD trên dụng cụ bảo quản và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:2,name:'Các loại nước trái cây tự ép',room:'Sử dụng trong ngày',cool:'2 ngày',freeze:'—',note:'Hết ca cần thừa (định lượng ít), dùng vào công cụ bảo quản, cho vào bảo quản trong tủ. Ghi đầy đủ thông tin ngày pha chế và HSD trên dụng cụ bảo quản và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:3,name:'Trái cây tươi',room:'Sử dụng trong ngày',cool:'7 ngày',freeze:'30 ngày',note:'Không để dập nát, kiểm tra hàng ngày. Ghi đầy đủ thông tin vào sổ checklist. Không cấp đông trái cây khi rã đông',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:4,name:'Trái cây đã qua sơ chế cắt thái',room:'Sử dụng trong ngày',cool:'2 ngày',freeze:'30 ngày',note:'Trái cây cấp đông phục vụ cho smoothie',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:5,name:'Nguyên liệu đông lạnh, đông hộp (Cốt dừa, cherry, đậu gà, nước cốt chanh, nước cốt cam...)',room:'Sử dụng trong ngày',cool:'3 ngày',freeze:'—',note:'Sau khi mở bao quản nguyên hộp tại tủ mát. Ghi đầy đủ thông tin ngày mở nắp và HSD trên dụng cụ bảo quản và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:6,name:'Syrup đóng chai, nước trái cây cô đặc các loại (morin, sunquick...)',room:'30 ngày',cool:'—',freeze:'—',note:'Bảo quản nguyên chai nhiệt độ phòng. Ghi đầy đủ thông tin ngày mở và HSD trên dụng cụ bảo quản và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:7,name:'Syrup tự nấu',room:'2 ngày',cool:'7 ngày',freeze:'—',note:'Đường được nấu thành syrup để bảo quản. Cho vào công cụ bảo quản. Bảo quản trong tủ mát. Ghi đầy đủ thông tin ngày pha chế và HSD trên dụng cụ bảo quản và sổ checklist. Với trường hợp các điểm dùng sữa đặc thường xuyên trong ngày có thể san chiết qua chai nhỏ, bảo quản nhiệt độ phòng trong ngày, cuối ngày rửa chai, bỏ phần thừa',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:8,name:'Sữa đặc',room:'Sử dụng trong ngày',cool:'7 ngày',freeze:'—',note:'Ghi đầy đủ thông tin ngày pha chế và HSD trên dụng cụ bảo quản và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:9,name:'Sữa tươi, sữa béo, kem tươi...',room:'Sử dụng trong ngày',cool:'3 ngày',freeze:'—',note:'Ưu tiên HSD theo nhận của nhà sản xuất trước. Nếu NSX không khuyến cáo thì HSD theo quy định nội bộ. Sau khi mở bao nguyên hộp tại tủ mát. Ghi đầy đủ thông tin ngày pha chế và HSD trên dụng cụ bảo quản và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:10,name:'Sun Kraftbeer (Kegs)',room:'Sử dụng trong ngày',cool:'07 ngày',freeze:'—',note:'Beer tươi sau khi mở kegs. Bảo quản ở tủ mát và ghi đầy đủ thông tin ngày mở kegs và HSD trên dụng cụ bảo quản và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:11,name:'Sun Kraftbeer (Cans)',room:'Sử dụng trong ngày',cool:'06 tháng',freeze:'—',note:'—',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:12,name:'Rượu mạnh',room:'—',cool:'—',freeze:'—',note:'Rượu mạnh không có hạn sử dụng. Sau khi mở bảo quản trong chai tại nhiệt độ phòng. Ghi đầy đủ thông tin ngày mở vào tem trên chai và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:13,name:'Rượu mùi',room:'30 ngày',cool:'—',freeze:'—',note:'Rượu mùi sau khi mở. Bảo quản trong chai tại nhiệt độ phòng. Ghi đầy đủ thông tin ngày pha chế và HSD trên dụng cụ bảo quản và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:14,name:'Rượu Vang Đỏ',room:'05 ngày',cool:'—',freeze:'—',note:'Rượu Vang đỏ sau khi mở cần được hút chân không. Bảo quản trong chai trong tủ bảo quản. Ghi đầy đủ thông tin ngày mở và HSD trên tem trên chai và sổ checklist.',flag:''},
{a:'PL2',g:'I. Thức uống pha sẵn và nguyên vật liệu',n:15,name:'Rượu Vang Trắng',room:'Sử dụng trong ngày',cool:'3 ngày',freeze:'—',note:'Rượu Vang trắng sau khi mở cần được hút chân không. Bảo quản trong chai trong tủ lạnh. Ghi đầy đủ thông tin ngày mở và HSD trên tem phụ và sổ checklist.',flag:''},
{a:'PL2',g:'II. Nguyên vật liệu khô',n:16,name:'Trà & Thảo mộc khô (Trà đen, trà xanh, ô long, trà túi lọc, trà thảo mộc, matcha...)',room:'- San chiết nhỏ qua chai/lọ bảo quản không quá 30 ngày. - Phần còn lại trong bao gốc, phải buộc kín miệng túi, bảo quản trong kho, bảo quản nơi khô ráo thoáng mát',cool:'—',freeze:'—',note:'Ưu tiên hướng dẫn sau khi mở trên nhãn của nhà sản xuất trước. Nếu NSX không khuyến cáo thì HSD theo quy định nội bộ. Ghi đầy đủ thông tin ngày mở và HSD trên tem phụ và sổ checklist.',flag:''},
{a:'PL2',g:'II. Nguyên vật liệu khô',n:17,name:'Cà phê và ca cao, sô cô la (Cà phê hạt, cà phê bột, bột ca cao, bột sô cô la...)',room:'- San chiết nhỏ qua chai/lọ bảo quản không quá 30 ngày. - Phần còn lại trong bao gốc, phải buộc kín miệng túi, bảo quản trong kho, bảo quản nơi khô ráo thoáng mát',cool:'—',freeze:'—',note:'Ưu tiên hướng dẫn sau khi mở trên nhãn của nhà sản xuất trước. Nếu NSX không khuyến cáo thì HSD theo quy định nội bộ. Ghi đầy đủ thông tin ngày mở và HSD trên tem phụ và sổ checklist.',flag:''},
{a:'PL2',g:'II. Nguyên vật liệu khô',n:18,name:'Nguyên vật liệu tạo topping khô, sữa bột, bột béo, chất tạo ngọt, bột whipping cream, bột rau câu, gelatin, agar, đường, bột...',room:'1/2 hạn sử dụng còn lại của sản phẩm',cool:'—',freeze:'—',note:'Ưu tiên hướng dẫn sau khi mở trên nhãn của nhà sản xuất trước. Nếu NSX không khuyến cáo thì HSD theo quy định nội bộ. Ghi đầy đủ thông tin ngày mở và HSD trên tem phụ và sổ checklist.',flag:''},
{a:'PL2',g:'II. Nguyên vật liệu khô',n:19,name:'Trái cây sấy khô, ngũ cốc và hạt khô (Cam, chanh, táo, dâu sấy, hạnh nhân, óc chó, yến mạch, gạo lứt rang...)',room:'1 tháng',cool:'—',freeze:'—',note:'Ưu tiên HSD trên nhãn của nhà sản xuất trước. Nếu NSX không khuyến cáo thì HSD theo quy định nội bộ. Bảo quản trong các lọ/túi kín. Ghi đầy đủ thông tin ngày mở và HSD trên tem phụ và sổ checklist.',flag:''},
];
// Phụ lục 3 — Bảng quy cách bảo quản bánh (đính kèm 03/BNC-MK.09), GMP Xưởng Bánh Eric Kayser.
// Thứ tự: [STT, nhóm, tên tiếng Anh (nguồn), tên tiếng Việt (nguồn), trọng lượng, kho lạnh 0-4°C, kho đông ≤-18°C, nhiệt độ phòng, tủ trưng bày lạnh 1-4°C, tủ trưng bày nóng 30-40°C]
// Ô trống trong Excel hiển thị "—"; "-" và "x" giữ nguyên, không suy diễn.
type PL3Row=[number,string,string,string,string,string,string,string,string,string];
const PL3_RAW:PL3Row[]=[
[1,'BREAD','Malesherbes Baguette','Bánh Mì Que Malesherbes','250g','3 Ngày','1 Tháng','1 Ngày','—','-'],
[2,'BREAD','Whole wheat bread','Bánh Mì Nguyên Cám','350gr','3 Ngày','1 Tháng','1 Ngày','—','-'],
[3,'BREAD','Cereals breads','Bánh Mì Ngũ Cốc','300gr','3 Ngày','1 Tháng','1 Ngày','—','-'],
[4,'BREAD','Fig Bread','Bánh Mì Quả Sung','280g','3 Ngày','1 Tháng','1 Ngày','—','-'],
[5,'BREAD','Ciabatta','Bánh Mì Ý Ciabatta','280g','3 Ngày','1 Tháng','1 Ngày','—','-'],
[6,'BREAD','Cheese bread','Bánh Mì Phô Mai','250g','3 Ngày','1 Tháng','1 Ngày','—','-'],
[48,'BREAD','White Sandwich 1200gr','Bánh mì sandwich trắng 1200gr','1200gr','2 Ngày','1 Tháng','1 Ngày','—','—'],
[49,'BREAD','Brown Sandwich 1200gr','Bánh mì sandwich nâu 1200gr','1200gr','2 Ngày','1 Tháng','1 Ngày','—','—'],
[50,'BREAD','Whole Wheat Sandwich 1200gr','Bánh mì sandwich nguyên cám 1200gr','1200gr','2 Ngày','1 Tháng','1 Ngày','—','—'],
[7,'VIENNOISERIE','Raisins Danish','Bánh Cuộn Nho Khô Kiểu Đan Mạch','110g','3 Ngày','1 Tháng','—','—','x'],
[8,'VIENNOISERIE','Plie Chocolate','Bánh Xếp Nhân Sô-Cô-La','120g','3 Ngày','1 Tháng','—','—','x'],
[9,'VIENNOISERIE','Vienoise chocolate','Bánh Mì Sữa Kiểu Viên Nhân Sô-Cô-La','110g','3 Ngày','1 Tháng','x','—','—'],
[10,'VIENNOISERIE','Croissant','Bánh Sừng Bò','70g','3 Ngày','1 Tháng','—','—','x'],
[11,'VIENNOISERIE','Pain au chocolate','Bánh Sừng Bò Nhân Sô-Cô-La','75g','3 Ngày','1 Tháng','—','—','x'],
[12,'VIENNOISERIE','Apple Turnover','Bánh Táo Gấp','130g','3 Ngày','1 Tháng','—','—','x'],
[13,'VIENNOISERIE','Almond croissant','Bánh Sừng Bò Hạnh Nhân','170gr','3 Ngày','1 Tháng','—','—','x'],
[14,'VIENNOISERIE','Panin au chocolate almond','Bánh Sừng Bò Hạnh Nhân Sô-cô-la','170gr','3 Ngày','1 Tháng','—','—','x'],
[15,'BISCUITS','Dark chocolate & pecan cookie','Bánh Quy Sô-Cô-La Đen Và Hồ Đào','85g','—','1 Tháng','5 Ngày','—','-'],
[16,'BISCUITS','White chocolate & macadamia cookie','Bánh Quy Sô-Cô-La Trắng Và Mắc-Ca','85g','—','1 Tháng','5 Ngày','—','-'],
[17,'BISCUITS','Financiers','Bánh Hạnh Nhân Financier','90g','2 Ngày','1 Tháng','—','2 Ngày','—'],
[18,'BISCUITS','Basque cake','Bánh Basque','150g','2 Ngày','1 Tháng','—','2 Ngày','—'],
[19,'BISCUITS','Brownie','Bánh Sô-Cô-La Nâu (Brownie)','110g','2 Ngày','1 Tháng','—','2 Ngày','—'],
[20,'BISCUITS','Cannele','Bánh Cannelé Pháp','60g','2 Ngày','1 Tháng','—','2 Ngày','—'],
[21,'BISCUITS','Macaron','Bánh Macaron','Box 6','2 Ngày','1 Tháng','—','2 Ngày','—'],
[22,'PASTRIES','Coffee éclair','Bánh Su Dài Nhân Kem Cà Phê','70gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[23,'PASTRIES','Chocolate éclair','Bánh Su Dài Nhân Kem Sô-Cô-La','70gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[24,'PASTRIES','Paris Ba Na Hills','Bánh Vòng Kem Hạt Dẻ Paris- Bana Hills','120g','2 Ngày','1 Tháng','—','2 Ngày','—'],
[25,'PASTRIES','Lemon tart','Bánh Tart Chanh','85gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[26,'PASTRIES','Crème Brule','Bánh Kem Caramel Cháy','130gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[27,'PASTRIES','Plan','Bánh Flan (Caramen)','150gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[28,'PASTRIES','Choux Praliné Pistache','Bánh Su Kem Praliné Hạt Dẻ Cười','90gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[29,'PASTRIES','Chocolate Entremets','Bánh Entremets Sô cô la','90gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[30,'PASTRIES','Tart Almond Peach','Bánh tart đào hạnh nhân','90gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[31,'PASTRIES','Tatin','Bánh Tatin','90gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[32,'PASTRIES','Raspberry éclair','Bánh Su Dài Nhân Kem Mâm Xôi','70gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[33,'PASTRIES','Saint honore','Bánh kem Pháp truyền thống','120gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[34,'PASTRIES','Mille feuille','Bánh kem ngàn lớp','120gr','2 Ngày','1 Tháng','—','2 Ngày','—'],
[35,'ICE CREAM','Icream Vanilla 60gr','Kem vani 60gr','1 Viên','—','1 Tháng','—','—','—'],
[36,'ICE CREAM','Icream Coconut 60gr','Kem dừa 60gr','1 Viên','—','1 Tháng','—','—','—'],
[37,'ICE CREAM','Icream Pistachio 60gr','Kem hạt dẻ cười 60gr','1 Viên','—','1 Tháng','—','—','—'],
[38,'ICE CREAM','Icream Mango 60gr','Kem xoài 60gr','1 Viên','—','1 Tháng','—','—','—'],
[39,'ICE CREAM','Icream Strawberry 60gr','Kem dâu tây 60gr','1 Viên','—','1 Tháng','—','—','—'],
[40,'ICE CREAM','Icream Chocolate 60gr','Kem sô-cô-la 60gr','1 Viên','—','1 Tháng','—','—','—'],
[41,'ICE CREAM','Icream Blueberry 60gr','Kem việt quất 60gr','1 Viên','—','1 Tháng','—','—','—'],
[42,'ICE CREAM','Icream Pineapple 60gr','Kem dứa 60gr','1 Viên','—','1 Tháng','—','—','—'],
[43,'ICE CREAM','Icream Apricots 60gr','Kem mơ 60gr','1 Viên','—','1 Tháng','—','—','—'],
[44,'ICE CREAM','Icream Blackcurrants 60gr','Kem lý chua đen 60gr','1 Viên','—','1 Tháng','—','—','—'],
[45,'ICE CREAM','Icream Vanilla Red Bean 60gr','Kem vani đậu đỏ 60g','1 Viên','—','1 Tháng','—','—','—'],
[46,'ICE CREAM','Icream Matcha 60gr','Kem Matcha 60g','1 Viên','—','1 Tháng','—','—','—'],
[47,'ICE CREAM','Icream Black Sesame 60gr','Kem mè đen 60g','1 Viên','—','1 Tháng','—','—','—'],
[51,'SAVORY','Ham Cheese Croissant 120gr','Bánh sừng bò nhân giăm bông phô mai 120gr','120gr','2 Ngày','—','—','2 Ngày','—'],
[52,'SAVORY','Bacon Cheese Egg Croissant 150gr','Bánh sừng bò nhân thịt xông khói, phô mai và trứng 150gr','150gr','2 Ngày','—','—','2 Ngày','—'],
[53,'SAVORY','Ham Cheese Sandwich 150gr','Bánh sandwich giăm bông phô mai 150gr','150gr','2 Ngày','—','—','2 Ngày','—'],
[54,'SAVORY','Club Mini Sandwich 80gr','Sandwich Club mini 80gr','80gr','2 Ngày','—','—','2 Ngày','—'],
[55,'SAVORY','Club Sandwich 160gr','Sandwich Club 160gr','160gr','2 Ngày','—','—','2 Ngày','—'],
[56,'SAVORY','Caprese Sourdough Toast 160gr','Bánh mì nướng sourdough Caprese 160gr','160gr','2 Ngày','—','—','2 Ngày','—'],
[57,'SAVORY','Smoked Salmon Bagel 150gr','Bagel cá hồi xông khói 150gr','150gr','2 Ngày','—','—','2 Ngày','—'],
];
const PL3_GROUP_LABEL:Record<string,string>={'BREAD':'PL3 - BREAD / BÁNH MỲ','VIENNOISERIE':'PL3 - THE VIENNOISERIE / BÁNH CÁN','BISCUITS':'PL3 - BISCUITS / BÁNH QUY','PASTRIES':'PL3 - THE PASTRIES / BÁNH NGỌT','ICE CREAM':'PL3 - ICE CREAM / KEM VIÊN','SAVORY':'PL3 - SAVORY / BÁNH MẶN'};
const PL3_DATA:Item[]=PL3_RAW.map(r=>({a:'PL3',g:PL3_GROUP_LABEL[r[1]],n:r[0],name:r[3],room:r[7],cool:r[5],freeze:r[6],note:'—',flag:'',enName:r[2],weight:r[4],displayCool:r[8],displayHot:r[9]}));
// Tên nhóm hiển thị theo đúng PDF gốc 07/BNC-BAT.03 (chuẩn hoá từ giá trị nhóm cũ).
const GROUP_RENAME:Record<string,string>={
'I. Bánh, chè, bơ sữa':'I. Các loại bánh, chè, bơ sữa, trái cây nước trái cây',
'II. Sốt (Tự chế biến)':'II. Các loại sốt (Tự chế biến)',
'III. Thịt gia súc tươi':'III. Thịt gia súc tươi và các nguyên liệu từ thịt',
'VII. Sản phẩm chế biến từ thủy sản':'VII. Các sản phẩm chế biến từ thủy sản',
'I. Thức uống pha sẵn và nguyên vật liệu':'I. Các loại thức uống pha sẵn và nguyên vật liệu',
};
const DATA: Item[] = [...RAW_DATA.map(it=>({...it,g:GROUP_RENAME[it.g]||it.g})),...PL3_DATA];
const GROUPS_PL1 = [...new Set(DATA.filter(i=>i.a==='PL1').map(i=>i.g))];
const GROUPS_PL2 = [...new Set(DATA.filter(i=>i.a==='PL2').map(i=>i.g))];
const GROUPS_ALL = [...new Set(DATA.map(i=>i.g))];
function norm(s:string){return s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();}
function isToday(it:Item){return [it.room,it.cool,it.freeze].some(v=>v.includes('Sử dụng trong ngày'));}
function isEmpty(v:string){return v.trim()==='—';}
function hasVal(v:string){return !isEmpty(v);}
type Lang='VI'|'EN'|'KO'|'HI';
type Dict={title:string;subtitle:string;shortTitle:string;pageTitle:string;searchPlaceholder:string;all:string;appendix1:string;appendix2:string;appendix3:string;filterGroup:string;filterStorage:string;hasRoom:string;hasCool:string;hasFreeze:string;sort:string;sortId:string;sortName:string;viewGrid:string;viewList:string;colRoom:string;colCool:string;colFreeze:string;colCold:string;colFrozen:string;colDisplayCool:string;colDisplayHot:string;colWeight:string;colEnglish:string;sourcePL3:string;noteLabel:string;emptyNote:string;emptyCell:string;detail:string;copy:string;copied:string;noResultTitle:string;noResultDesc:string;resetFilter:string;results:string;principle:string;detailTitle:string;close:string;groupLabel:string;displayLabel:string;colName:string;colAction:string;codeLabel:string;useToday:string;originalNote:string;emptyCellHint:string;clearSearch:string;focusLabel:string;clearLabel:string;qaTitle:string;excerptLabel:string;filterBtn:string;apply:string;clearFilters:string;filterTitle:string;showingFor:string;synonymOf:string;didYouMean:string;noResultFor:string;smartSearch:string;smartOn:string;smartOff:string;suggestions:string};
const I18N:Record<Lang,Dict>={
VI:{title:'HỆ THỐNG TRA CỨU NHIỆT ĐỘ BẢO QUẢN & THỜI HẠN SỬ DỤNG THỰC PHẨM',subtitle:'BAN ẨM THỰC - SUN WORLD BA NA HILLS',shortTitle:'TRA CỨU BẢO QUẢN & HSD',pageTitle:'HỆ THỐNG TRA CỨU NHIỆT ĐỘ BẢO QUẢN & THỜI HẠN SỬ DỤNG THỰC PHẨM - BNC',searchPlaceholder:'Tìm:',all:'Tất cả',appendix1:'Phụ lục 1',appendix2:'Phụ lục 2',appendix3:'Phụ lục 3',filterGroup:'Nhóm',filterStorage:'Bảo quản',hasRoom:'Có Nhiệt độ phòng',hasCool:'Có 1-4°C',hasFreeze:'Có ≤ -18°C',sort:'Sắp xếp',sortId:'Theo số thứ tự',sortName:'Tên A-Z',viewGrid:'Lưới',viewList:'Danh sách',colRoom:'Nhiệt độ phòng',colCool:'1-4°C',colFreeze:'≤ -18°C',colCold:'Kho lạnh (0-4°C)',colFrozen:'Kho đông (≤-18°C)',colDisplayCool:'Tủ trưng bày lạnh (1-4°C)',colDisplayHot:'Tủ trưng bày nóng (30-40°C, trong ngày)',colWeight:'Trọng lượng',colEnglish:'Tên tiếng Anh',sourcePL3:'Phụ lục 3 – Bảng quy cách bảo quản bánh (đính kèm 03/BNC-MK.09)',noteLabel:'Ghi chú',emptyNote:'— (để trống trong file gốc)',emptyCell:'—',detail:'Chi tiết',copy:'Copy trích lục',copied:'Đã copy!',noResultTitle:'Không tìm thấy',noResultDesc:'Hãy thử từ khóa ngắn hơn hoặc đổi bộ lọc.',resetFilter:'Đặt lại bộ lọc',results:'kết quả',principle:'Bản trích lục không thay thế văn bản gốc. Khi có mâu thuẫn, ưu tiên văn bản gốc đã ban hành và khuyến cáo NSX trên bao bì.',detailTitle:'Chi tiết món',close:'Đóng',groupLabel:'Nhóm',displayLabel:'Hiển thị',colName:'Tên',colAction:'Hành động',codeLabel:'Mã:',useToday:'DÙNG TRONG NGÀY',originalNote:'GHI CHÚ NGUYÊN VĂN',emptyCellHint:'để trống trong file gốc',clearSearch:'Xóa tìm kiếm',focusLabel:'tìm kiếm',clearLabel:'xóa',qaTitle:'CẦN XÁC NHẬN QA',excerptLabel:'TRÍCH LỤC',filterBtn:'Bộ lọc',apply:'Áp dụng',clearFilters:'Xóa lọc',filterTitle:'Bộ lọc',showingFor:'Đang hiển thị kết quả cho:',synonymOf:'đồng nghĩa với',didYouMean:'Bạn có ý là:',noResultFor:'Không tìm thấy',smartSearch:'Tìm kiếm thông minh',smartOn:'Bật tìm kiếm thông minh',smartOff:'Tắt tìm kiếm thông minh',suggestions:'Gợi ý'},
EN:{title:'FOOD STORAGE TEMPERATURE & SHELF LIFE LOOKUP SYSTEM',subtitle:'F&B DEPARTMENT - SUN WORLD BA NA HILLS',shortTitle:'STORAGE & SHELF LIFE LOOKUP',pageTitle:'FOOD STORAGE TEMPERATURE & SHELF LIFE LOOKUP SYSTEM - BNC',searchPlaceholder:'Search:',all:'All',appendix1:'Appendix 1',appendix2:'Appendix 2',appendix3:'Appendix 3',filterGroup:'Group',filterStorage:'Storage',hasRoom:'Has Room Temp',hasCool:'Has 1-4°C',hasFreeze:'Has ≤ -18°C',sort:'Sort',sortId:'By number',sortName:'Name A-Z',viewGrid:'Grid',viewList:'List',colRoom:'Room Temp',colCool:'1-4°C',colFreeze:'≤ -18°C',colCold:'Cold storage (0-4°C)',colFrozen:'Frozen (≤-18°C)',colDisplayCool:'Display fridge (1-4°C)',colDisplayHot:'Display warmer (30-40°C, within day)',colWeight:'Weight',colEnglish:'English name',sourcePL3:'Phụ lục 3 – Bảng quy cách bảo quản bánh (đính kèm 03/BNC-MK.09)',noteLabel:'Note',emptyNote:'— (blank in source file)',emptyCell:'—',detail:'Details',copy:'Copy excerpt',copied:'Copied!',noResultTitle:'No results',noResultDesc:'Try a shorter keyword or change the filter.',resetFilter:'Reset filters',results:'results',principle:'This excerpt does not replace the original document. In case of conflict, the issued original document and the manufacturer\u2019s instructions on the packaging shall prevail.',detailTitle:'Item details',close:'Close',groupLabel:'Group',displayLabel:'View',colName:'Name',colAction:'Actions',codeLabel:'Code:',useToday:'USE TODAY',originalNote:'ORIGINAL NOTE',emptyCellHint:'blank in source file',clearSearch:'Clear search',focusLabel:'focus',clearLabel:'clear',qaTitle:'QA CONFIRMATION NEEDED',excerptLabel:'EXCERPT',filterBtn:'Filters',apply:'Apply',clearFilters:'Clear filters',filterTitle:'Filters',showingFor:'Showing results for:',synonymOf:'synonym of',didYouMean:'Did you mean:',noResultFor:'No results for',smartSearch:'Smart search',smartOn:'Smart search on',smartOff:'Smart search off',suggestions:'Suggestions'},
KO:{title:'식품 보관 온도 및 유통기한 조회 시스템',subtitle:'식음료부 - 선 월드 바나 힐스',shortTitle:'보관 온도 및 유통기한 조회',pageTitle:'식품 보관 온도 및 유통기한 조회 시스템 - BNC',searchPlaceholder:'검색:',all:'전체',appendix1:'부록 1',appendix2:'부록 2',appendix3:'부록 3',filterGroup:'그룹',filterStorage:'보관',hasRoom:'상온 있음',hasCool:'1-4°C 있음',hasFreeze:'≤ -18°C 있음',sort:'정렬',sortId:'번호순',sortName:'이름 A-Z',viewGrid:'그리드',viewList:'목록',colRoom:'상온',colCool:'1-4°C',colFreeze:'≤ -18°C',colCold:'냉장 보관 (0-4°C)',colFrozen:'냉동 (≤-18°C)',colDisplayCool:'전시 냉장 (1-4°C)',colDisplayHot:'전시 온장 (30-40°C, 당일)',colWeight:'중량',colEnglish:'영문명',sourcePL3:'Phụ lục 3 – Bảng quy cách bảo quản bánh (đính kèm 03/BNC-MK.09)',noteLabel:'비고',emptyNote:'— (원문에 없음)',emptyCell:'—',detail:'상세',copy:'발췌 복사',copied:'복사됨!',noResultTitle:'결과 없음',noResultDesc:'더 짧은 키워드로 시도하거나 필터를 변경하세요.',resetFilter:'필터 초기화',results:'개 결과',principle:'본 발췌문은 원본 문서를 대체하지 않습니다. 상충 시 발행된 원본 문서와 포장에 기재된 제조사 권장사항이 우선합니다.',detailTitle:'항목 상세',close:'닫기',groupLabel:'그룹',displayLabel:'보기',colName:'이름',colAction:'작업',codeLabel:'코드:',useToday:'당일 사용',originalNote:'원문 비고',emptyCellHint:'원문에 없음',clearSearch:'검색 지우기',focusLabel:'포커스',clearLabel:'지우기',qaTitle:'QA 확인 필요',excerptLabel:'발췌',filterBtn:'필터',apply:'적용',clearFilters:'필터 지우기',filterTitle:'필터',showingFor:'다음에 대한 결과 표시 중:',synonymOf:'의 동의어',didYouMean:'혹시 이걸 찾으시나요:',noResultFor:'결과 없음:',smartSearch:'스마트 검색',smartOn:'스마트 검색 켜짐',smartOff:'스마트 검색 꺼짐',suggestions:'제안'},
HI:{title:'खाद्य भंडारण तापमान और शेल्फ लाइफ खोज प्रणाली',subtitle:'खाद्य एवं पेय विभाग - सन वर्ल्ड बा ना हिल्स',shortTitle:'भंडारण और शेल्फ लाइफ खोज',pageTitle:'खाद्य भंडारण तापमान और शेल्फ लाइफ खोज प्रणाली - BNC',searchPlaceholder:'खोजें:',all:'सभी',appendix1:'परिशिष्ट 1',appendix2:'परिशिष्ट 2',appendix3:'परिशिष्ट 3',filterGroup:'समूह',filterStorage:'भंडारण',hasRoom:'कमरे के तापमान वाला',hasCool:'1-4°C वाला',hasFreeze:'≤ -18°C वाला',sort:'क्रमबद्ध करें',sortId:'संख्या के अनुसार',sortName:'नाम A-Z',viewGrid:'ग्रिड',viewList:'सूची',colRoom:'कमरे का तापमान',colCool:'1-4°C',colFreeze:'≤ -18°C',colCold:'शीत भंडारण (0-4°C)',colFrozen:'फ्रोज़न (≤-18°C)',colDisplayCool:'प्रदर्शन फ्रिज (1-4°C)',colDisplayHot:'प्रदर्शन वार्मर (30-40°C, उसी दिन)',colWeight:'वज़न',colEnglish:'अंग्रेज़ी नाम',sourcePL3:'Phụ lục 3 – Bảng quy cách bảo quản bánh (đính kèm 03/BNC-MK.09)',noteLabel:'टिप्पणी',emptyNote:'— (मूल फ़ाइल में खाली)',emptyCell:'—',detail:'विवरण',copy:'अंश कॉपी करें',copied:'कॉपी हो गया!',noResultTitle:'कोई परिणाम नहीं',noResultDesc:'छोटा कीवर्ड आज़माएँ या फ़िल्टर बदलें।',resetFilter:'फ़िल्टर रीसेट करें',results:'परिणाम',principle:'यह अंश मूल दस्तावेज़ का स्थान नहीं लेता है। विरोध की स्थिति में, जारी मूल दस्तावेज़ और पैकेजिंग पर निर्माता के निर्देशों को प्राथमिकता दी जाएगी।',detailTitle:'आइटम विवरण',close:'बंद करें',groupLabel:'समूह',displayLabel:'दृश्य',colName:'नाम',colAction:'कार्रवाई',codeLabel:'कोड:',useToday:'आज ही उपयोग करें',originalNote:'मूल टिप्पणी',emptyCellHint:'मूल फ़ाइल में खाली',clearSearch:'खोज साफ़ करें',focusLabel:'फ़ोकस',clearLabel:'साफ़ करें',qaTitle:'QA पुष्टि आवश्यक',excerptLabel:'अंश',filterBtn:'फ़िल्टर',apply:'लागू करें',clearFilters:'फ़िल्टर साफ़ करें',filterTitle:'फ़िल्टर',showingFor:'के लिए परिणाम दिखाए जा रहे हैं:',synonymOf:'का समानार्थी',didYouMean:'क्या आपका मतलब है:',noResultFor:'कोई परिणाम नहीं:',smartSearch:'स्मार्ट खोज',smartOn:'स्मार्ट खोज चालू',smartOff:'स्मार्ट खोज बंद',suggestions:'सुझाव'},
};
const NOTE_T_DUP:Record<string,Tr3>={
'PL1-01':['Store in fridge (1-4°C) for 3-5 days --> make bread butter pudding','냉장고(1-4°C)에 3-5일 보관 --> 브레드 버터 푸딩으로 만들기','फ्रिज (1-4°C) में 3-5 दिन रखें --> ब्रेड बटर पुडिंग बनाएँ'],
'PL1-02':['Do not reuse after serving on buffet','뷔페에 진열한 후 재사용 금지','बुफे पर परोसने के बाद पुनः उपयोग न करें'],
'PL1-11':['- Keep in a sealed container','- 밀폐 용기에 보관','- सीलबंद डिब्बे में रखें'],
'PL1-13':['- Follow the manufacturer recommendation if stated on the packaging.','- 포장에 기재된 경우 제조사 권장사항을 따르세요.','- पैकेजिंग पर लिखा हो तो निर्माता की सिफारिश का पालन करें।'],
'PL1-14':['- Follow the manufacturer recommendation (if any).','- 제조사 권장사항(있는 경우)을 따르세요.','- निर्माता की सिफारिश (यदि कोई हो) का पालन करें।'],
'PL1-15':['- When storing, wrap or close the lid tightly so moisture does not enter the product.','- 보관 시 수분이 제품에 들어가지 않도록 포장하거나 뚜껑을 단단히 닫으세요.','- भंडारण करते समय नमी उत्पाद में न जाए, इसलिए लपेटें या ढक्कन कसकर बंद करें।'],
'PL1-21':['- Follow the manufacturer instructions on the packaging first.','- 먼저 포장에 기재된 제조사 지침을 따르세요.','- पहले पैकेजिंग पर निर्माता के निर्देशों का पालन करें।'],
'PL1-36':['- Follow the manufacturer recommendation if stated on the packaging. Note: Transfer to other containers for storage; do not keep in the metal can.','- 포장에 기재된 경우 제조사 권장사항을 따르세요. 참고: 보관 시 다른 용기에 옮기세요. 금속 캔에 그대로 두지 마세요.','- पैकेजिंग पर लिखा हो तो निर्माता की सिफारिश का पालन करें। ध्यान दें: भंडारण के लिए अन्य बर्तनों में निकालें; धातु के डिब्बे में ही न रखें।'],
'PL1-37':['- Cool down before placing in the freezer.','- 냉동실에 넣기 전에 식히세요.','- फ्रीजर में रखने से पहले ठंडा करें।'],
'PL1-38':['- Cool down before cold storage. Divide into small portions for storage to ensure temperature.','- 냉장 보관 전에 식히세요. 온도를 확보하기 위해 소량씩 나누어 보관하세요.','- ठंडे भंडारण से पहले ठंडा करें। तापमान सुनिश्चित करने के लिए छोटे भागों में बाँटकर रखें।'],
'PL1-44':['Or follow the manufacturer instructions / Store refrigerated','또는 제조사 지침을 따르세요 / 냉장 보관','या निर्माता के निर्देशों का पालन करें / फ्रिज में रखें'],
'PL1-46':['For grilled items, use within the day only.','구운 제품은 당일에만 사용하세요.','ग्रिल किए आइटम केवल उसी दिन उपयोग करें।'],
'PL1-47':['Follow the manufacturer instructions. If there is no recommendation, the limit to follow is 2 days / Store refrigerated','제조사 지침을 따르세요. 권장사항이 없으면 2일을 따릅니다 / 냉장 보관','निर्माता के निर्देशों का पालन करें। कोई सिफारिश न हो तो सीमा 2 दिन है / फ्रिज में रखें'],
'PL1-48':['Change the water daily so the rice does not turn sour','쌀이 시지 않도록 매일 물을 교체하세요','चावल खट्टा न हो, इसके लिए रोज़ पानी बदलें'],
'PL1-50':['Soak in clean water and change the water daily. Store in the fridge','깨끗한 물에 담그고 매일 물을 교체하세요. 냉장고에 보관하세요','साफ पानी में भिगोएँ और रोज़ पानी बदलें। फ्रिज में रखें'],
'PL1-52':['Store in a cool, dry, well-ventilated place','서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요','ठंडी, सूखी, हवादार जगह पर रखें'],
'PL1-56':['Follow the expiry date on the product packaging first','제품 포장에 기재된 유통기한을 먼저 따르세요','पहले उत्पाद पैकेजिंग पर लिखी समाप्ति तिथि का पालन करें'],
'PL1-57':['Store refrigerated (do not reuse items set up at the buffet counter for sashimi)','냉장 보관(뷔페 카운터에 진열한 사시미는 재사용하지 마세요)','फ्रिज में रखें (बुफे काउंटर पर रखे सशिमी को पुनः उपयोग न करें)'],
'PL1-65':['1/2 of the time stated on the packaging','포장에 기재된 시간의 1/2','पैकेजिंग पर लिखे समय का 1/2'],
'PL1-66':['Store in the cooler. Follow the expiry date on the product packaging first','쿨러에 보관하세요. 제품 포장에 기재된 유통기한을 먼저 따르세요','कूलर में रखें। पहले उत्पाद पैकेजिंग पर लिखी समाप्ति तिथि का पालन करें'],
'PL1-67':['Store in the cooler. Follow the expiry date on the product packaging first','쿨러에 보관하세요. 제품 포장에 기재된 유통기한을 먼저 따르세요','कूलर में रखें। पहले उत्पाद पैकेजिंग पर लिखी समाप्ति तिथि का पालन करें'],
'PL1-68':['Store in a sealed container','밀폐 용기에 보관하세요','सीलबंद डिब्बे में रखें'],
'PL1-69':['- Shelf life and storage conditions after opening follow the manufacturer recommendation first','- 개봉 후 유통기한과 보관 조건은 제조사 권장사항을 먼저 따릅니다','- खोलने के बाद शेल्फ लाइफ और भंडारण शर्तों के लिए पहले निर्माता की सिफारिश का पालन करें'],
'PL2-01':['Record the preparation time, date and expiry date fully on the storage container and checklist.','조리 시간, 날짜, 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','तैयारी का समय, तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-02':['Leftover after the shift (small quantity) should go into a storage container and into the fridge. Record the preparation date and expiry date fully on the storage container and checklist.','교대 후 남은 것(소량)은 보관 용기에 담아 냉장고에 넣으세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','शिफ्ट के बाद बचा हुआ (कम मात्रा) भंडारण बर्तन में डालकर फ्रिज में रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-03':['Do not leave bruised; check daily. Record information fully in the checklist. Do not freeze fruit after thawing','멍들게 두지 말고 매일 확인하세요. 체크리스트에 정보를 빠짐없이 기록하세요. 해동 후 과일을 냉동하지 마세요','चोटिल न छोड़ें; रोज़ जाँचें। जानकारी चेकलिस्ट में पूरी लिखें। पिघलने के बाद फल को फिर से न जमाएँ'],
'PL2-04':['Frozen fruit is for smoothies','냉동 과일은 스무디용입니다','जमे फल स्मूदी के लिए हैं'],
'PL2-05':['After opening, keep in the original box in the cooler. Record the opening date and expiry date fully on the storage container and checklist.','개봉 후 원래 상자 그대로 쿨러에 보관하세요. 개봉 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요।','खोलने के बाद मूल डिब्बे में ही कूलर में रखें। खोलने की तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-06':['Store the original bottle at room temperature. Record the opening date and expiry date fully on the storage container and checklist.','원래 병 그대로 상온에 보관하세요. 개봉 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','मूल बोतल को कमरे के तापमान पर रखें। खोलने की तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-07':['Sugar is cooked into syrup for storage. Put it in a storage container. Store in the cooler. Record the preparation date and expiry date fully on the storage container and checklist. For outlets that use condensed milk frequently during the day, it can be decanted into a small bottle, kept at room temperature during the day, and at the end of the day wash the bottle and discard the remainder','설탕을 시럽으로 끓여 보관합니다. 보관 용기에 담으세요. 쿨러에 보관하세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요. 연유를 당일에 자주 사용하는 매장은 작은 병에 옮겨 당일 상온에 보관할 수 있으며, 당일 종료 시 병을 씻고 남은 것을 버리세요','चीनी को सिरप बनाकर पकाकर रखें। भंडारण बर्तन में डालें। कूलर में रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें। दिन में गाढ़ा दूध अक्सर उपयोग करने वाले आउटलेट इसे छोटी बोतल में निकालकर दिन में कमरे के तापमान पर रख सकते हैं, और दिन के अंत में बोतल धोकर बचा हुआ फेंक दें'],
'PL2-08':['Record the preparation date and expiry date fully on the storage container and checklist.','조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-09':['Follow the manufacturer expiry date first. If the manufacturer does not recommend, follow the internal rule. After opening, keep in the original box in the cooler. Record the preparation date and expiry date fully on the storage container and checklist.','제조사 유통기한을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 후 원래 상자 그대로 쿨러에 보관하세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता की समाप्ति तिथि का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने के बाद मूल डिब्बे में ही कूलर में रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-10':['Fresh beer after opening the keg. Store in the cooler and record the keg opening date and expiry date fully on the storage container and checklist.','케그 개봉 후 생맥주입니다. 쿨러에 보관하고 케그 개봉 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','केग खोलने के बाद ताज़ा बीयर। कूलर में रखें और केग खोलने की तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-12':['Spirits have no expiry date. After opening, keep in the bottle at room temperature. Record the opening date fully on the label on the bottle and checklist.','증류주는 유통기한이 없습니다. 개봉 후 병 그대로 상온에 보관하세요. 개봉 날짜를 병 라벨과 체크리스트에 빠짐없이 기록하세요.','स्पिरिट की कोई समाप्ति तिथि नहीं है। खोलने के बाद बोतल में ही कमरे के तापमान पर रखें। खोलने की तिथि बोतल के लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-13':['Liqueur after opening. Keep in the bottle at room temperature. Record the preparation date and expiry date fully on the storage container and checklist.','개봉 후 리큐어입니다. 병 그대로 상온에 보관하세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','खोलने के बाद लिकर। बोतल में ही कमरे के तापमान पर रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-14':['Red wine after opening must be vacuum-sealed. Keep in the bottle in the storage cabinet. Record the opening date and expiry date fully on the label on the bottle and checklist.','개봉 후 레드 와인은 진공 밀봉해야 합니다. 병 그대로 보관 캐비닛에 보관하세요. 개봉 날짜와 유통기한을 병 라벨과 체크리스트에 빠짐없이 기록하세요.','खोलने के बाद रेड वाइन को वैक्यूम-सील करना होगा। बोतल में ही भंडारण कैबिनेट में रखें। खोलने की तिथि और समाप्ति तिथि बोतल के लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-15':['White wine after opening must be vacuum-sealed. Keep in the bottle in the fridge. Record the opening date and expiry date fully on the sub-label and checklist.','개봉 후 화이트 와인은 진공 밀봉해야 합니다. 병 그대로 냉장고에 보관하세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','खोलने के बाद व्हाइट वाइन को वैक्यूम-सील करना होगा। बोतल में ही फ्रिज में रखें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-16':['Follow the after-opening instructions on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Record the opening date and expiry date fully on the sub-label and checklist.','제조사 라벨의 개봉 후 지침을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता लेबल पर खोलने के बाद के निर्देशों का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-17':['Follow the after-opening instructions on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Record the opening date and expiry date fully on the sub-label and checklist.','제조사 라벨의 개봉 후 지침을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता लेबल पर खोलने के बाद के निर्देशों का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-18':['Follow the after-opening instructions on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Record the opening date and expiry date fully on the sub-label and checklist.','제조사 라벨의 개봉 후 지침을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता लेबल पर खोलने के बाद के निर्देशों का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-19':['Follow the expiry date on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Store in sealed jars / bags. Record the opening date and expiry date fully on the sub-label and checklist.','제조사 라벨의 유통기한을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 밀폐된 병 / 봉투에 보관하세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता लेबल पर समाप्ति तिथि का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। सीलबंद जार / बैग में रखें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
};
const FLAG_T:Record<string,Tr3>={
'PL1-65':['CONFLICT IN SOURCE FILE - QA CONFIRMATION NEEDED: Room column says Room temperature, not a number of days. Kept verbatim, do not correct it yourself.','원본 파일의 모순 - QA 확인 필요: 상온 칸에 일수가 아니라 상온이라고 적혀 있습니다. 원문 그대로 두었고 임의로 수정하지 마세요.','मूल फ़ाइल में विरोध - QA पुष्टि आवश्यक: कमरा कॉलम में दिनों की संख्या नहीं, कमरे का तापमान लिखा है। मूल रूप में रखा गया है, खुद ठीक न करें।'],
'PL1-66':['CONFLICT IN SOURCE FILE - QA CONFIRMATION NEEDED: Room column says 15 days but the note says store in the cooler. Kept verbatim.','원본 파일의 모순 - QA 확인 필요: 상온 칸에 15일이라고 적혀 있지만 비고에는 쿨러에 보관하라고 되어 있습니다. 원문 그대로 두었습니다.','मूल फ़ाइल में विरोध - QA पुष्टि आवश्यक: कमरा कॉलम में 15 दिन लिखा है लेकिन टिप्पणी में कूलर में रखने को कहा गया है। मूल रूप में रखा गया है।'],
'PL1-67':['CONFLICT IN SOURCE FILE - QA CONFIRMATION NEEDED: Room column says 7 days but the note says store in the cooler. Kept verbatim.','원본 파일의 모순 - QA 확인 필요: 상온 칸에 7일이라고 적혀 있지만 비고에는 쿨러에 보관하라고 되어 있습니다. 원문 그대로 두었습니다.','मूल फ़ाइल में विरोध - QA पुष्टि आवश्यक: कमरा कॉलम में 7 दिन लिखा है लेकिन टिप्पणी में कूलर में रखने को कहा गया है। मूल रूप में रखा गया है।'],
};
const locIdx=(lang:Lang)=>lang==='EN'?0:lang==='KO'?1:2;
const locName=(it:Item,lang:Lang)=>lang==='VI'?it.name:(NAME_T[code(it)]?.[locIdx(lang)]||it.name);
const locNote=(it:Item,lang:Lang)=>{if(lang==='VI')return it.note; if(isEmpty(it.note))return it.note; return NOTE_T[code(it)]?.[locIdx(lang)]||it.note;};
const locFlag=(it:Item,lang:Lang)=>{if(lang==='VI')return it.flag||''; if(!it.flag)return ''; return FLAG_T[code(it)]?.[locIdx(lang)]||it.flag;};
const VALUE_T:Record<string,Tr3>={
'Sử dụng trong ngày':['Use within the day','당일 사용','उसी दिन उपयोग करें'],
'Nhiệt độ phòng':['Room temperature','상온','कमरे का तापमान'],
'1 ngày':['1 day','1일','1 दिन'],
'2 ngày':['2 days','2일','2 दिन'],
'3 ngày':['3 days','3일','3 दिन'],
'5 ngày':['5 days','5일','5 दिन'],
'6 ngày':['6 days','6일','6 दिन'],
'7 ngày':['7 days','7일','7 दिन'],
'10 ngày':['10 days','10일','10 दिन'],
'15 ngày':['15 days','15일','15 दिन'],
'20 ngày':['20 days','20일','20 दिन'],
'30 ngày':['30 days','30일','30 दिन'],
'60 ngày':['60 days','60일','60 दिन'],
'90 ngày':['90 days','90일','90 दिन'],
'3-5 ngày':['3-5 days','3-5일','3-5 दिन'],
'3 - 5 ngày':['3 - 5 days','3 - 5일','3 - 5 दिन'],
'1 - 2 ngày':['1 - 2 days','1 - 2일','1 - 2 दिन'],
'05 ngày':['5 days','5일','5 दिन'],
'07 ngày':['7 days','7일','7 दिन'],
'1 tháng':['1 month','1개월','1 महीना'],
'2 tháng':['2 months','2개월','2 महीने'],
'3 tháng':['3 months','3개월','3 महीने'],
'6 tháng':['6 months','6개월','6 महीने'],
'06 tháng':['6 months','6개월','6 महीने'],
'12 tháng':['12 months','12개월','12 महीने'],
'1/2 hạn sử dụng còn lại':['1/2 of remaining shelf life','남은 유통기한의 1/2','शेष शेल्फ लाइफ का 1/2'],
'1/2 hạn sử dụng còn lại của sản phẩm':['1/2 of remaining shelf life of the product','제품 남은 유통기한의 1/2','उत्पाद की शेष शेल्फ लाइफ का 1/2'],
'1/2 hạn sử dụng còn lại của sản phẩm và tối đa là 30 ngày.':['1/2 of remaining shelf life of the product, max 30 days.','제품 남은 유통기한의 1/2, 최대 30일.','उत्पाद की शेष शेल्फ लाइफ का 1/2, अधिकतम 30 दिन।'],
'1/4 hạn sử dụng còn lại và tối đa là 30 ngày.':['1/4 of remaining shelf life, max 30 days.','남은 유통기한의 1/4, 최대 30일.','शेष शेल्फ लाइफ का 1/4, अधिकतम 30 दिन।'],
'1/2 HSD NSX':["1/2 of manufacturer's shelf life",'제조사 유통기한의 1/2','निर्माता शेल्फ लाइफ का 1/2'],
'1/4 HSD NSX':["1/4 of manufacturer's shelf life",'제조사 유통기한의 1/4','निर्माता शेल्फ लाइफ का 1/4'],
'1/2 HSD NSX, tối đa 30 ngày':["1/2 of manufacturer's shelf life, max 30 days",'제조사 유통기한의 1/2, 최대 30일','निर्माता शेल्फ लाइफ का 1/2, अधिकतम 30 दिन'],
'1/4 HSD NSX, tối đa 30 ngày':["1/4 of manufacturer's shelf life, max 30 days",'제조사 유통기한의 1/4, 최대 30일','निर्माता शेल्फ लाइफ का 1/4, अधिकतम 30 दिन'],
'Không có HSD':['No expiry date','유통기한 없음','कोई समाप्ति तिथि नहीं'],
'Theo NSX':['Per manufacturer','제조사 기준','निर्माता के अनुसार'],
 '1 Viên':['1 scoop','1 스쿱','1 स्कूप'],
'- San chiết nhỏ qua chai/lọ bảo quản không quá 30 ngày. - Phần còn lại trong bao gốc, phải buộc kín miệng túi, bảo quản trong kho, bảo quản nơi khô ráo thoáng mát':['- Decant a small amount into bottles / jars, store for no more than 30 days. - Keep the rest in the original bag, tie the bag mouth tightly, store in the warehouse, in a cool, dry, well-ventilated place','- 소량을 병 / 용기에 옮겨 담아 30일을 초과하지 않게 보관하세요. - 나머지는 원래 봉지에 두고 봉지 입구를 단단히 묶어 창고의 서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요','- थोड़ी मात्रा बोतलों / जार में निकालकर 30 दिन से अधिक न रखें। - बाकी मूल थैले में रखें, थैले का मुँह कसकर बाँधें, गोदाम में ठंडी, सूखी, हवादार जगह पर रखें'],
};
const VALUE_T_LOWER:Record<string,Tr3>=Object.fromEntries(Object.entries(VALUE_T).map(([k,v])=>[k.toLowerCase(),v]));
const translateValue=(v:string,lang:Lang):string=>{
 if(lang==='VI')return v;
 const s=v.trim();
 if(s==='—'||s==='')return '—';
 const exact=VALUE_T[s]||VALUE_T_LOWER[s.toLowerCase()];
 if(exact)return exact[locIdx(lang)];
 const idx=locIdx(lang);
 const day=(n:number)=>lang==='EN'?(n===1?'1 day':`${n} days`):lang==='KO'?`${n}일`:`${n} दिन`;
 const month=(n:number)=>lang==='EN'?(n===1?'1 month':`${n} months`):lang==='KO'?`${n}개월`:(n===1?'1 महीना':`${n} महीने`);
 const hour=(n:number)=>lang==='EN'?(n===1?'1 hour':`${n} hours`):lang==='KO'?`${n}시간`:(n===1?'1 घंटा':`${n} घंटे`);
 const week=(n:number)=>lang==='EN'?(n===1?'1 week':`${n} weeks`):lang==='KO'?`${n}주`:(n===1?'1 सप्ताह':`${n} सप्ताह`);
 const year=(n:number)=>lang==='EN'?(n===1?'1 year':`${n} years`):lang==='KO'?`${n}년`:(n===1?'1 वर्ष':`${n} वर्ष`);
 const minute=(n:number)=>lang==='EN'?(n===1?'1 minute':`${n} minutes`):lang==='KO'?`${n}분`:(n===1?'1 मिनट':`${n} मिनट`);
 let out=s;
 out=out.replace(/Sử dụng trong ngày/gi,VALUE_T['Sử dụng trong ngày'][idx]);
 out=out.replace(/Nhiệt độ phòng/gi,VALUE_T['Nhiệt độ phòng'][idx]);
 out=out.replace(/1\/2 hạn sử dụng còn lại của sản phẩm/gi,VALUE_T['1/2 hạn sử dụng còn lại của sản phẩm'][idx]);
 out=out.replace(/1\/2 hạn sử dụng còn lại/gi,VALUE_T['1/2 hạn sử dụng còn lại'][idx]);
 out=out.replace(/1\/4 hạn sử dụng còn lại/gi,lang==='EN'?'1/4 of remaining shelf life':lang==='KO'?'남은 유통기한의 1/4':'शेष शेल्फ लाइफ का 1/4');
 out=out.replace(/1\/2 HSD NSX/gi,VALUE_T['1/2 HSD NSX'][idx]);
 out=out.replace(/1\/4 HSD NSX/gi,VALUE_T['1/4 HSD NSX'][idx]);
 out=out.replace(/Không có HSD/gi,VALUE_T['Không có HSD'][idx]);
 out=out.replace(/Theo NSX/gi,VALUE_T['Theo NSX'][idx]);
 out=out.replace(/San chiết nhỏ qua chai\/lọ bảo quản không quá/gi,lang==='EN'?'Decant a small amount into bottles / jars, store for no more than':lang==='KO'?'소량을 병 / 용기에 옮겨 담아 초과하지 않게 보관':lang==='HI'?'थोड़ी मात्रा बोतलों / जार में निकालकर से अधिक न रखें':lang==='EN'?'Decant a small amount into bottles / jars, store for no more than':'');
 out=out.replace(/Phần còn lại trong bao gốc, phải buộc kín miệng túi, bảo quản trong kho, bảo quản nơi khô ráo thoáng mát/gi,lang==='EN'?'Keep the rest in the original bag, tie the bag mouth tightly, store in the warehouse, in a cool, dry, well-ventilated place':lang==='KO'?'나머지는 원래 봉지에 두고 봉지 입구를 단단히 묶어 창고의 서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요':'बाकी मूल थैले में रखें, थैले का मुँह कसकर बाँधें, गोदाम में ठंडी, सूखी, हवादार जगह पर रखें');
 out=out.replace(/Bảo quản nơi khô ráo thoáng mát/gi,lang==='EN'?'Store in a cool, dry, well-ventilated place':lang==='KO'?'서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요':'ठंडी, सूखी, हवादार जगह पर रखें');
 out=out.replace(/Bảo quản trong tủ mát/gi,lang==='EN'?'Store in the cooler':lang==='KO'?'쿨러에 보관하세요':'कूलर में रखें');
 out=out.replace(/Bảo quản trong tủ lạnh/gi,lang==='EN'?'Store in the fridge':lang==='KO'?'냉장고에 보관하세요':'फ्रिज में रखें');
 out=out.replace(/Bảo quản lạnh/gi,lang==='EN'?'Store refrigerated':lang==='KO'?'냉장 보관':'फ्रिज में रखें');
 out=out.replace(/HSD/gi,lang==='EN'?'expiry date':lang==='KO'?'유통기한':'समाप्ति तिथि');
 out=out.replace(/NSX/gi,lang==='EN'?'manufacturer':lang==='KO'?'제조사':'निर्माता');
 out=out.replace(/và tối đa là/gi,lang==='EN'?', max ':lang==='KO'?', 최대 ':' , अधिकतम ');
 out=out.replace(/tối đa/gi,lang==='EN'?'max':lang==='KO'?'최대':'अधिकतम');
 out=out.replace(/(\d+)\s*-\s*(\d+)\s*ngày/gi,(_m,a,b)=>lang==='EN'?`${Number(a)} - ${Number(b)} days`:lang==='KO'?`${Number(a)} - ${Number(b)}일`:`${Number(a)} - ${Number(b)} दिन`);
 out=out.replace(/(\d+)\s*ngày/gi,(_m,a)=>day(Number(a)));
 out=out.replace(/(\d+)\s*tháng/gi,(_m,a)=>month(Number(a)));
 out=out.replace(/(\d+)\s*giờ/gi,(_m,a)=>hour(Number(a)));
 out=out.replace(/(\d+)\s*tuần/gi,(_m,a)=>week(Number(a)));
 out=out.replace(/(\d+)\s*năm/gi,(_m,a)=>year(Number(a)));
 out=out.replace(/(\d+)\s*phút/gi,(_m,a)=>minute(Number(a)));
 return out;
};
const locValue=(v:string,lang:Lang):string=>{if(lang==='VI')return v; const s=v.trim(); if(s==='—')return '—'; if(s==='Sử dụng trong ngày')return lang==='EN'?'Use within the day':lang==='KO'?'당일 사용':'उसी दिन उपयोग करें'; if(s==='Nhiệt độ phòng')return lang==='EN'?'Room temperature':lang==='KO'?'상온':'कमरे का तापमान'; if(s==='1/2 hạn sử dụng còn lại')return lang==='EN'?'1/2 of remaining shelf life':lang==='KO'?'남은 유통기한의 1/2':'शेष शेल्फ लाइफ का 1/2'; if(s==='1/2 hạn sử dụng còn lại của sản phẩm')return lang==='EN'?'1/2 of remaining shelf life of the product':lang==='KO'?'제품 남은 유통기한의 1/2':'उत्पाद की शेष शेल्फ लाइफ का 1/2'; if(s==='1/2 hạn sử dụng còn lại của sản phẩm và tối đa là 30 ngày.')return lang==='EN'?'1/2 of remaining shelf life of the product, max 30 days.':lang==='KO'?'제품 남은 유통기한의 1/2, 최대 30일.':'उत्पाद की शेष शेल्फ लाइफ का 1/2, अधिकतम 30 दिन।'; if(s==='1/4 hạn sử dụng còn lại và tối đa là 30 ngày.')return lang==='EN'?'1/4 of remaining shelf life, max 30 days.':lang==='KO'?'남은 유통기한의 1/4, 최대 30일.':'शेष शेल्फ लाइफ का 1/4, अधिकतम 30 दिन।'; if(s.startsWith('- San chiết nhỏ'))return lang==='EN'?'- Decant a small amount into bottles / jars, store for no more than 30 days. - Keep the rest in the original bag, tie the bag mouth tightly, store in the warehouse, in a cool, dry, well-ventilated place':lang==='KO'?'- 소량을 병 / 용기에 옮겨 담아 30일을 초과하지 않게 보관하세요. - 나머지는 원래 봉지에 두고 봉지 입구를 단단히 묶어 창고의 서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요':'- थोड़ी मात्रा बोतलों / जार में निकालकर 30 दिन से अधिक न रखें। - बाकी मूल थैले में रखें, थैले का मुँह कसकर बाँधें, गोदाम में ठंडी, सूखी, हवादार जगह पर रखें'; const mRange=s.match(/^(\\d+)\\s*-\\s*(\\d+)\\s*ngày$/i); if(mRange)return lang==='EN'?`${mRange[1]} - ${mRange[2]} days`:lang==='KO'?`${mRange[1]} - ${mRange[2]}일`:`${mRange[1]} - ${mRange[2]} दिन`; const mDay=s.match(/^(\\d+)\\s*ngày$/i); if(mDay){const n=String(parseInt(mDay[1],10)); return lang==='EN'?`${n} days`:lang==='KO'?`${n}일`:`${n} दिन`;} const mMonth=s.match(/^(\\d+)\\s*tháng$/i); if(mMonth){const n=String(parseInt(mMonth[1],10)); return lang==='EN'?`${n} months`:lang==='KO'?`${n}개월`:`${n} महीने`;} return v;};
const GROUP_NAMES:Record<string,Record<Lang,string>>={
'I. Các loại bánh, chè, bơ sữa, trái cây nước trái cây':{VI:'I. Các loại bánh, chè, bơ sữa, trái cây nước trái cây',EN:'I. Assorted cakes, che, butter, milk, fruit & fruit juice',KO:'I. 각종 케이크, 체, 버터, 우유, 과일 및 과일 주스',HI:'I. विभिन्न केक, चे, मक्खन, दूध, फल और फलों का रस'},
'II. Các loại sốt (Tự chế biến)':{VI:'II. Các loại sốt (Tự chế biến)',EN:'II. Assorted sauces (Homemade)',KO:'II. 각종 소스 (자가제조)',HI:'II. विभिन्न सॉस (घर पर बने)'},
'III. Thịt gia súc tươi và các nguyên liệu từ thịt':{VI:'III. Thịt gia súc tươi và các nguyên liệu từ thịt',EN:'III. Fresh livestock meat and meat-derived ingredients',KO:'III. 신선한 가축 고기 및 육류 원료',HI:'III. ताज़ा पशु मांस और मांस से बने कच्चे माल'},
'IV. Thịt gia súc đã chế biến':{VI:'IV. Thịt gia súc đã chế biến',EN:'IV. Processed Livestock Meat',KO:'IV. 가공된 가축 고기',HI:'IV. प्रसंस्कृत पशु मांस'},
'V. Thịt gia cầm tươi':{VI:'V. Thịt gia cầm tươi',EN:'V. Fresh Poultry',KO:'V. 신선한 가금류',HI:'V. ताज़ा मुर्गी'},
'VI. Thủy sản tươi':{VI:'VI. Thủy sản tươi',EN:'VI. Fresh Seafood',KO:'VI. 신선한 수산물',HI:'VI. ताज़ा समुद्री भोजन'},
'VII. Các sản phẩm chế biến từ thủy sản':{VI:'VII. Các sản phẩm chế biến từ thủy sản',EN:'VII. Assorted processed seafood products',KO:'VII. 각종 가공 수산물',HI:'VII. विभिन्न प्रसंस्कृत समुद्री भोजन उत्पाद'},
'VIII. Các món khác':{VI:'VIII. Các món khác',EN:'VIII. Other Items',KO:'VIII. 기타',HI:'VIII. अन्य आइटम'},
'I. Các loại thức uống pha sẵn và nguyên vật liệu':{VI:'I. Các loại thức uống pha sẵn và nguyên vật liệu',EN:'I. Assorted ready-made drinks & ingredients',KO:'I. 각종 즉석 음료 및 재료',HI:'I. विभिन्न तैयार पेय और सामग्री'},
'II. Nguyên vật liệu khô':{VI:'II. Nguyên vật liệu khô',EN:'II. Dry Ingredients',KO:'II. 건조 재료',HI:'II. सूखी सामग्री'},
 'PL3 - BREAD / BÁNH MỲ':{VI:'PL3 - BREAD / BÁNH MỲ',EN:'PL3 - BREAD',KO:'PL3 - 브레드',HI:'PL3 - ब्रेड'},
 'PL3 - THE VIENNOISERIE / BÁNH CÁN':{VI:'PL3 - THE VIENNOISERIE / BÁNH CÁN',EN:'PL3 - VIENNOISERIE',KO:'PL3 - 비에누아즈리',HI:'PL3 - विएनोइसरी'},
 'PL3 - BISCUITS / BÁNH QUY':{VI:'PL3 - BISCUITS / BÁNH QUY',EN:'PL3 - BISCUITS',KO:'PL3 - 비스킷',HI:'PL3 - बिस्कुट'},
 'PL3 - THE PASTRIES / BÁNH NGỌT':{VI:'PL3 - THE PASTRIES / BÁNH NGỌT',EN:'PL3 - PASTRIES',KO:'PL3 - 페이스트리',HI:'PL3 - पेस्ट्री'},
 'PL3 - ICE CREAM / KEM VIÊN':{VI:'PL3 - ICE CREAM / KEM VIÊN',EN:'PL3 - ICE CREAM',KO:'PL3 - 아이스크림',HI:'PL3 - आइसक्रीम'},
 'PL3 - SAVORY / BÁNH MẶN':{VI:'PL3 - SAVORY / BÁNH MẶN',EN:'PL3 - SAVORY',KO:'PL3 - 세이보리',HI:'PL3 - नमकीन'},
};
const groupName=(g:string,lang:Lang)=>GROUP_NAMES[g]?.[lang]||g;
const LANGS: Lang[]=['VI','EN','KO','HI'];
type Tr3=[string,string,string];
const NAME_T:Record<string,Tr3>={
'PL1-01':['Baked breakfast pastries','구운 아침 페이스트리','बेक्ड नाश्ता पेस्ट्री'],
'PL1-02':['Assorted pastries','각종 페이스트리','विभिन्न पेस्ट्री'],
'PL1-03':['Assorted breads','각종 빵','विभिन्न ब्रेड'],
'PL1-04':['Chocolate decor','초콜릿 데코','चॉकलेट सजावट'],
'PL1-05':['Garlic butter bread','마늘 버터 빵','लहसुन मक्खन ब्रेड'],
'PL1-06':['Pizza bases','피자 도우','पिज्जा बेस'],
'PL1-07':['Macarons','마카롱','मैकरॉन'],
'PL1-08':['Baked biscuits','구운 비스킷','बेक्ड बिस्कुट'],
'PL1-09':['Cooked che','조리된 체','पका हुआ चे'],
'PL1-10':['Prepped ingredients for che','체 조리용 손질 재료','चे पकाने के लिए तैयार सामग्री'],
'PL1-11':['Crouton bread','크루통 빵','क्राउटन ब्रेड'],
'PL1-12':['Cooked sugar syrup, cooled','조리 후 식힌 설탕 시럽','पकाया और ठंडा किया चीनी सिरप'],
'PL1-13':['Opened / cut butter; opened / cut cheese','개봉 / 절단한 버터; 개봉 / 절단한 치즈','खुला / कटा मक्खन; खुला / कटा पनीर'],
'PL1-14':['Opened flour','개봉한 밀가루','खुला आटा'],
'PL1-15':['Opened fresh milk','개봉한 우유','खुला ताजा दूध'],
'PL1-16':['Waffle pancake batter','와플 팬케이크 반죽','वफ़ल पैनकेक बैटर'],
'PL1-17':['Rice noodles, vermicelli, hoi cake, chung cake, it cake, gai cake','쌀국수, 분, 호이 케이크, 쯩 케이크, 잇 케이크, 가이 케이크','चावल नूडल्स, सेवई, होई केक, चुंग केक, इत केक, गाई केक'],
'PL1-18':['Croissant, puff pastry dough','크루아상, 퍼프 페이스트리 도우','क्रोइसैन, पफ पेस्ट्री आटा'],
'PL1-19':['Opened canned fruit','개봉한 통조림 과일','खुले डिब्बाबंद फल'],
'PL1-20':['Creme brulee, caramel custard','크렘 브륄레, 카라멜 커스터드','क्रेम ब्रूले, कैरमल कस्टर्ड'],
'PL1-21':['Opened topping, whipping cream','개봉한 토핑, 휘핑크림','खुली टॉपिंग, व्हिपिंग क्रीम'],
'PL1-22':['Pesto sauce','페스토 소스','पेस्टो सॉस'],
'PL1-23':['Caesar','시저','सीज़र'],
'PL1-24':['Balsamic dressing','발사믹 드레싱','बाल्समिक ड्रेसिंग'],
'PL1-25':['Italian dressing','이탈리안 드레싱','इटालियन ड्रेसिंग'],
'PL1-26':['Mustard sauce','머스타드 소스','सरसों सॉस'],
'PL1-27':['Bean stew sauce','콩 스튜 소스','बीन स्टू सॉस'],
'PL1-28':['Thousand sauce','사우전드 소스','थाउज़ेंड सॉस'],
'PL1-29':['Seafood tomato sauce','해산물 토마토 소스','समुद्री भोजन टमाटर सॉस'],
'PL1-30':['Tomato sauce','토마토 소스','टमाटर सॉस'],
'PL1-31':['BBQ sauce','BBQ 소스','BBQ सॉस'],
'PL1-32':['Minced beef sauce','다진 소고기 소스','कीमा बीफ़ सॉस'],
'PL1-33':['Mixed fish sauce','혼합 피시 소스','मिली हुई फिश सॉस'],
'PL1-34':['Fresh beef, veal, pork','신선한 소고기, 송아지, 돼지고기','ताजा बीफ़, बछड़ा, सूअर का मांस'],
'PL1-35':['Assorted marrow bones','각종 골수 뼈','विभिन्न मज्जा हड्डियाँ'],
'PL1-36':['Opened canned meat','개봉한 통조림 고기','खुला डिब्बाबंद मांस'],
'PL1-37':['Cooked meat dishes','조리된 고기 요리','पके हुए मांस व्यंजन'],
'PL1-38':['Assorted stocks','각종 육수','विभिन्न शोरबा'],
'PL1-39':['Whole chicken, duck, cut into pieces','통닭, 오리, 절단','साबुत मुर्गी, बत्तख, टुकड़ों में कटा'],
'PL1-40':['Stewed, braised dishes','찜, 조림 요리','स्टू, ब्रेज़्ड व्यंजन'],
'PL1-41':['Smoked meats, chicken, duck breast','훈제 고기, 닭, 오리 가슴살','स्मोक्ड मांस, मुर्गी, बत्तख ब्रेस्ट'],
'PL1-42':['Seasoned fresh seafood','양념한 신선한 해산물','मसालेदार ताजा समुद्री भोजन'],
'PL1-43':['Fresh seafood','신선한 해산물','ताजा समुद्री भोजन'],
'PL1-44':['Opened canned fish','개봉한 통조림 생선','खुली डिब्बाबंद मछली'],
'PL1-45':['Cooked bivalve molluscs (clams, mussels...)','조리된 이매패류(조개, 홍합...)','पके हुए द्विकपाटी मोलस्क (क्लैम, मसल...)'],
'PL1-46':['Steamed, boiled, cooked crab, shrimp, fish','찜, 삶음, 조리한 게, 새우, 생선','भाप, उबला, पका केकड़ा, झींगा, मछली'],
'PL1-47':['Smoked seafood (salmon, mackerel, eel...) sliced (vacuum pack opened)','훈제 해산물(연어, 고등어, 장어...) 슬라이스(진공포장 개봉)','स्मोक्ड समुद्री भोजन (सैल्मन, मैकेरल, ईल...) कटा हुआ (वैक्यूम पैक खुला)'],
'PL1-48':['Wet rice flour','습식 쌀가루','गीला चावल का आटा'],
'PL1-49':['Roasted nuts (peanuts, cashews, almonds, sesame...)','볶은 견과류(땅콩, 캐슈, 아몬드, 참깨...)','भुने मेवे (मूंगफली, काजू, बादाम, तिल...)'],
'PL1-50':['Tofu blocks from supplier','공급업체 두부','आपूर्तिकर्ता से टोफू ब्लॉक'],
'PL1-51':['House-made tofu','자가제조 두부','घर पर बना टोफू'],
'PL1-52':['Dried goods (mung beans, noodles, vermicelli...) after opening','개봉 후 건조 식품(녹두, 면, 당면...)','खोलने के बाद सूखी वस्तुएँ (मूंग, नूडल्स, सेवई...)'],
'PL1-53':['Shelled eggs','껍질 깐 달걀','छिले अंडे'],
'PL1-54':['Boiled eggs','삶은 달걀','उबले अंडे'],
'PL1-55':['Food colouring after opening','개봉 후 식용 색소','खोलने के बाद खाद्य रंग'],
'PL1-56':['Syrup after opening','개봉 후 시럽','खोलने के बाद सिरप'],
'PL1-57':['Sliced salmon, tuna sashimi... awaiting service','제공 대기 중인 연어, 참치 사시미 슬라이스','परोसने की प्रतीक्षा में कटा सैल्मन, टूना सशिमी'],
'PL1-58':['Sliced cold cuts','슬라이스한 콜드컷','कटी हुई कोल्ड कट'],
'PL1-59':['Cold cuts after opening','개봉 후 콜드컷','खोलने के बाद कोल्ड कट'],
'PL1-60':['Prepped vegetables','손질한 채소','तैयार सब्जियाँ'],
'PL1-61':['Cooked vegetables','조리된 채소','पकी सब्जियाँ'],
'PL1-62':['Mayonnaise and other sauces after opening','개봉 후 마요네즈 및 기타 소스','खोलने के बाद मेयोनेज़ और अन्य सॉस'],
'PL1-63':['Sliced soft cheese, hard cheese, sliced butter','슬라이스한 소프트 치즈, 하드 치즈, 버터','कटी नरम पनीर, सख्त पनीर, मक्खन'],
'PL1-64':['Jam and peanut butter after opening','개봉 후 잼 및 땅콩버터','खोलने के बाद जैम और मूंगफली मक्खन'],
'PL1-65':['Opened alcoholic drinks','개봉한 주류','खुले मादक पेय'],
'PL1-66':['Opened ketchup, chilli sauce','개봉한 케첩, 칠리 소스','खुला केचप, चिली सॉस'],
'PL1-67':['Opened mustard','개봉한 머스타드','खुली सरसों'],
'PL1-68':['Pickled vegetables (mustard greens, eggplant, shallots)','절임 채소(갓, 가지, 샬롯)','अचार वाली सब्जियाँ (सरसों साग, बैंगन, शैलोट)'],
'PL1-69':['Opened cooking seasonings (salt, sugar, MSG, seasoning powder...)','개봉 후 조리 양념(소금, 설탕, MSG, 조미료...)','खोलने के बाद पकाने के मसाले (नमक, चीनी, MSG, मसाला पाउडर...)'],
'PL2-01':['Ready-made drinks (milk tea, black tea, winter melon tea, nut milk, drip coffee, homemade jelly, pearls...)','즉석 음료(밀크티, 홍차, 동과차, 견과 우유, 드립 커피, 자가제조 젤리, 펄...)','तैयार पेय (मिल्क टी, ब्लैक टी, विंटर मेलन टी, नट मिल्क, ड्रिप कॉफ़ी, घर का जेली, मोती...)'],
'PL2-02':['Freshly squeezed fruit juices','갓 짠 과일 주스','ताज़ा निचोड़ा फलों का रस'],
'PL2-03':['Fresh fruit','신선한 과일','ताजा फल'],
'PL2-04':['Cut / prepped fruit','절단 / 손질한 과일','कटा / तैयार फल'],
'PL2-05':['Frozen, canned ingredients (coconut cream, cherry, chickpeas, lemon juice, orange juice...)','냉동, 통조림 재료(코코넛 크림, 체리, 병아리콩, 레몬즙, 오렌지즙...)','जमे, डिब्बाबंद सामग्री (नारियल क्रीम, चेरी, चना, नींबू रस, संतरा रस...)'],
'PL2-06':['Bottled syrup, concentrated fruit juice (Morin, Sunquick...)','병입 시럽, 농축 과일 주스(Morin, Sunquick...)','बोतलबंद सिरप, सांद्र फलों का रस (Morin, Sunquick...)'],
'PL2-07':['Homemade syrup','자가제조 시럽','घर का बना सिरप'],
'PL2-08':['Condensed milk','연유','गाढ़ा दूध'],
'PL2-09':['Fresh milk, full-cream milk, fresh cream...','우유, 전지 우유, 생크림...','ताजा दूध, फुल-क्रीम दूध, ताजा क्रीम...'],
'PL2-10':['Sun Kraftbeer (Kegs)','선 크래프트비어(케그)','सन क्राफ्टबीयर (केग्स)'],
'PL2-11':['Sun Kraftbeer (Cans)','선 크래프트비어(캔)','सन क्राफ्टबीयर (कैन)'],
'PL2-12':['Spirits','증류주','स्पिरिट'],
'PL2-13':['Liqueur','리큐어','लिकर'],
'PL2-14':['Red wine','레드 와인','रेड वाइन'],
'PL2-15':['White wine','화이트 와인','व्हाइट वाइन'],
'PL2-16':['Tea and dried herbs (black tea, green tea, oolong, tea bags, herbal tea, matcha...)','차 및 건조 허브(홍차, 녹차, 우롱, 티백, 허브차, 말차...)','चाय और सूखी जड़ी-बूटियाँ (ब्लैक टी, ग्रीन टी, ऊलोंग, टी बैग, हर्बल टी, माचा...)'],
'PL2-17':['Coffee, cocoa, chocolate (coffee beans, coffee powder, cocoa powder, chocolate powder...)','커피, 코코아, 초콜릿(원두, 커피 가루, 코코아 가루, 초콜릿 가루...)','कॉफ़ी, कोको, चॉकलेट (कॉफ़ी बीन्स, कॉफ़ी पाउडर, कोको पाउडर, चॉकलेट पाउडर...)'],
'PL2-18':['Dry topping ingredients, milk powder, creamer, sweeteners, whipping cream powder, jelly powder, gelatin, agar, sugar, flour...','건조 토핑 재료, 분유, 크리머, 감미료, 휘핑크림 가루, 젤리 가루, 젤라틴, 한천, 설탕, 밀가루...','सूखी टॉपिंग सामग्री, दूध पाउडर, क्रीमर, मिठास, व्हिपिंग क्रीम पाउडर, जेली पाउडर, जिलेटिन, अगर, चीनी, आटा...'],
'PL2-19':['Dried fruit, cereals and dried nuts (dried orange, lemon, apple, strawberry, almonds, walnuts, oats, roasted brown rice...)','건조 과일, 곡물 및 건조 견과류(건조 오렌지, 레몬, 사과, 딸기, 아몬드, 호두, 오트, 볶은 현미...)','सूखे फल, अनाज और सूखे मेवे (सूखा संतरा, नींबू, सेब, स्ट्रॉबेरी, बादाम, अखरोट, ओट्स, भुना ब्राउन राइस...)'],
'PL3-01':['Malesherbes Baguette','말제르브 바게트','मालज़ेर्ब बैगेट'],
'PL3-02':['Whole wheat bread','통밀 빵','साबुत गेहूं ब्रेड'],
'PL3-03':['Cereals breads','곡물 빵','अनाज ब्रेड'],
'PL3-04':['Fig Bread','무화과 빵','अंजीर ब्रेड'],
'PL3-05':['Ciabatta','치아바타','चियाबाटा'],
'PL3-06':['Cheese bread','치즈 빵','चीज़ ब्रेड'],
'PL3-48':['White Sandwich 1200gr','화이트 샌드위치 1200g','सफेद सैंडविच 1200g'],
'PL3-49':['Brown Sandwich 1200gr','브라운 샌드위치 1200g','भूरी सैंडविच 1200g'],
'PL3-50':['Whole Wheat Sandwich 1200gr','통밀 샌드위치 1200g','साबुत गेहूं सैंडविच 1200g'],
'PL3-07':['Raisins Danish','건포도 데니시','किशमिश डेनिश'],
'PL3-08':['Plie Chocolate','초콜릿 플리에','चॉकलेट प्ली'],
'PL3-09':['Vienoise chocolate','초콜릿 비에누아즈','चॉकलेट विएनोइस'],
'PL3-10':['Croissant','크로아상','क्रोइसैन'],
'PL3-11':['Pain au chocolate','팡 오 쇼콜라','पैन ओ चॉकलेट'],
'PL3-12':['Apple Turnover','애플 턴오버','ऐप्पल टर्नओवर'],
'PL3-13':['Almond croissant','아몬드 크로아상','बादाम क्रोइसैन'],
'PL3-14':['Panin au chocolate almond','아몬드 초콜릿 크로아상','बादाम चॉकलेट क्रोइसैन'],
'PL3-15':['Dark chocolate & pecan cookie','다크 초콜릿 피칸 쿠키','डार्क चॉकलेट पेकान कुकी'],
'PL3-16':['White chocolate & macadamia cookie','화이트 초콜릿 마카다미아 쿠키','व्हाइट चॉकलेट मैकाडामिया कुकी'],
'PL3-17':['Financiers','피낭시에','फिनांसिए'],
'PL3-18':['Basque cake','바스크 케이크','बास्क केक'],
'PL3-19':['Brownie','브라우니','ब्राउनी'],
'PL3-20':['Cannele','카늘레','कैनेले'],
'PL3-21':['Macaron','마카롱','मैकरॉन'],
'PL3-22':['Coffee éclair','커피 에클레어','कॉफ़ी एक्लेयर'],
'PL3-23':['Chocolate éclair','초콜릿 에클레어','चॉकलेट एक्लेयर'],
'PL3-24':['Paris Ba Na Hills','파리-바나힐스 파리브레스트','पेरिस-बाना हिल्स पेरिस-ब्रेस्ट'],
'PL3-25':['Lemon tart','레몬 타르트','नींबू टार्ट'],
'PL3-26':['Crème Brule','크렘 브륄레','क्रेम ब्रूले'],
'PL3-27':['Plan','플랑','फ्लान'],
'PL3-28':['Choux Praliné Pistache','피스타치오 프랄리네 슈','पिस्ता प्रालिने शू'],
'PL3-29':['Chocolate Entremets','초콜릿 앙트르메','चॉकलेट एंट्रेमेट'],
'PL3-30':['Tart Almond Peach','복숭아 아몬드 타르트','आड़ू बादाम टार्ट'],
'PL3-31':['Tatin','타탱','टैटिन'],
'PL3-32':['Raspberry éclair','라즈베리 에클레어','रास्पबेरी एक्लेयर'],
'PL3-33':['Saint honore','생토노레','सेंट ऑनोरे'],
'PL3-34':['Mille feuille','밀푀유','मिल-फ़्यूइ'],
'PL3-35':['Icream Vanilla 60gr','바닐라 아이스크림 60g','वैनिला आइसक्रीम 60g'],
'PL3-36':['Icream Coconut 60gr','코코넛 아이스크림 60g','नारियल आइसक्रीम 60g'],
'PL3-37':['Icream Pistachio 60gr','피스타치오 아이스크림 60g','पिस्ता आइसक्रीम 60g'],
'PL3-38':['Icream Mango 60gr','망고 아이스크림 60g','आम आइसक्रीम 60g'],
'PL3-39':['Icream Strawberry 60gr','딸기 아이스크림 60g','स्ट्रॉबेरी आइसक्रीम 60g'],
'PL3-40':['Icream Chocolate 60gr','초콜릿 아이스크림 60g','चॉकलेट आइसक्रीम 60g'],
'PL3-41':['Icream Blueberry 60gr','블루베리 아이스크림 60g','ब्लूबेरी आइसक्रीम 60g'],
'PL3-42':['Icream Pineapple 60gr','파인애플 아이스크림 60g','अनानास आइसक्रीम 60g'],
'PL3-43':['Icream Apricots 60gr','살구 아이스크림 60g','खुबानी आइसक्रीम 60g'],
'PL3-44':['Icream Blackcurrants 60gr','블랙커런트 아이스크림 60g','काली करौंदा आइसक्रीम 60g'],
'PL3-45':['Icream Vanilla Red Bean 60gr','바닐라 팥 아이스크림 60g','वैनिला लाल बीन आइसक्रीम 60g'],
'PL3-46':['Icream Matcha 60gr','말차 아이스크림 60g','माचा आइसक्रीम 60g'],
'PL3-47':['Icream Black Sesame 60gr','흑임자 아이스크림 60g','काला तिल आइसक्रीम 60g'],
'PL3-51':['Ham Cheese Croissant 120gr','햄 치즈 크로아상 120g','हैम चीज़ क्रोइसैन 120g'],
'PL3-52':['Bacon Cheese Egg Croissant 150gr','베이컨 치즈 에그 크로아상 150g','बेकन चीज़ अंडा क्रोइसैन 150g'],
'PL3-53':['Ham Cheese Sandwich 150gr','햄 치즈 샌드위치 150g','हैम चीज़ सैंडविच 150g'],
'PL3-54':['Club Mini Sandwich 80gr','클럽 미니 샌드위치 80g','क्लब मिनी सैंडविच 80g'],
'PL3-55':['Club Sandwich 160gr','클럽 샌드위치 160g','क्लब सैंडविच 160g'],
'PL3-56':['Caprese Sourdough Toast 160gr','카프레제 사워도우 토스트 160g','कैप्रेज़े सॉरडो टोस्ट 160g'],
'PL3-57':['Smoked Salmon Bagel 150gr','훈제 연어 베이글 150g','स्मोक्ड सैल्मन बैगेल 150g'],
};
const NOTE_T:Record<string,Tr3>={
'PL1-01':['Store in fridge (1-4°C) for 3-5 days --> make bread butter pudding','냉장고(1-4°C)에 3-5일 보관 --> 브레드 버터 푸딩으로 만들기','फ्रिज (1-4°C) में 3-5 दिन रखें --> ब्रेड बटर पुडिंग बनाएँ'],
'PL1-02':['Do not reuse after serving on buffet','뷔페에 진열한 후 재사용 금지','बुफे पर परोसने के बाद पुनः उपयोग न करें'],
'PL1-11':['- Keep in a sealed container','- 밀폐 용기에 보관','- सीलबंद डिब्बे में रखें'],
'PL1-13':['- Follow the manufacturer recommendation if stated on the packaging.','- 포장에 기재된 경우 제조사 권장사항을 따르세요.','- पैकेजिंग पर लिखा हो तो निर्माता की सिफारिश का पालन करें।'],
'PL1-14':['- Follow the manufacturer recommendation (if any).','- 제조사 권장사항(있는 경우)을 따르세요.','- निर्माता की सिफारिश (यदि कोई हो) का पालन करें।'],
'PL1-15':['- When storing, wrap or close the lid tightly so moisture does not enter the product.','- 보관 시 수분이 제품에 들어가지 않도록 포장하거나 뚜껑을 단단히 닫으세요.','- भंडारण करते समय नमी उत्पाद में न जाए, इसलिए लपेटें या ढक्कन कसकर बंद करें।'],
'PL1-21':['- Follow the manufacturer instructions on the packaging first.','- 먼저 포장에 기재된 제조사 지침을 따르세요.','- पहले पैकेजिंग पर निर्माता के निर्देशों का पालन करें।'],
'PL1-36':['- Follow the manufacturer recommendation if stated on the packaging. Note: Transfer to other containers for storage; do not keep in the metal can.','- 포장에 기재된 경우 제조사 권장사항을 따르세요. 참고: 보관 시 다른 용기에 옮기세요. 금속 캔에 그대로 두지 마세요.','- पैकेजिंग पर लिखा हो तो निर्माता की सिफारिश का पालन करें। ध्यान दें: भंडारण के लिए अन्य बर्तनों में निकालें; धातु के डिब्बे में ही न रखें।'],
'PL1-37':['- Cool down before placing in the freezer.','- 냉동실에 넣기 전에 식히세요.','- फ्रीजर में रखने से पहले ठंडा करें।'],
'PL1-38':['- Cool down before cold storage. Divide into small portions for storage to ensure temperature.','- 냉장 보관 전에 식히세요. 온도를 확보하기 위해 소량씩 나누어 보관하세요.','- ठंडे भंडारण से पहले ठंडा करें। तापमान सुनिश्चित करने के लिए छोटे भागों में बाँटकर रखें।'],
'PL1-44':['Or follow the manufacturer instructions / Store refrigerated','또는 제조사 지침을 따르세요 / 냉장 보관','या निर्माता के निर्देशों का पालन करें / फ्रिज में रखें'],
'PL1-46':['For grilled items, use within the day only.','구운 제품은 당일에만 사용하세요.','ग्रिल किए आइटम केवल उसी दिन उपयोग करें।'],
'PL1-47':['Follow the manufacturer instructions. If there is no recommendation, the limit to follow is 2 days / Store refrigerated','제조사 지침을 따르세요. 권장사항이 없으면 2일을 따릅니다 / 냉장 보관','निर्माता के निर्देशों का पालन करें। कोई सिफारिश न हो तो सीमा 2 दिन है / फ्रिज में रखें'],
'PL1-48':['Change the water daily so the rice does not turn sour','쌀이 시지 않도록 매일 물을 교체하세요','चावल खट्टा न हो, इसके लिए रोज़ पानी बदलें'],
'PL1-50':['Soak in clean water and change the water daily. Store in the fridge','깨끗한 물에 담그고 매일 물을 교체하세요. 냉장고에 보관하세요','साफ पानी में भिगोएँ और रोज़ पानी बदलें। फ्रिज में रखें'],
'PL1-52':['Store in a cool, dry, well-ventilated place','서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요','ठंडी, सूखी, हवादार जगह पर रखें'],
'PL1-56':['Follow the expiry date on the product packaging first','제품 포장에 기재된 유통기한을 먼저 따르세요','पहले उत्पाद पैकेजिंग पर लिखी समाप्ति तिथि का पालन करें'],
'PL1-57':['Store refrigerated (do not reuse items set up at the buffet counter for sashimi)','냉장 보관(뷔페 카운터에 진열한 사시미는 재사용하지 마세요)','फ्रिज में रखें (बुफे काउंटर पर रखे सशिमी को पुनः उपयोग न करें)'],
'PL1-65':['1/2 of the time stated on the packaging','포장에 기재된 시간의 1/2','पैकेजिंग पर लिखे समय का 1/2'],
'PL1-66':['Store in the cooler. Follow the expiry date on the product packaging first','쿨러에 보관하세요. 제품 포장에 기재된 유통기한을 먼저 따르세요','कूलर में रखें। पहले उत्पाद पैकेजिंग पर लिखी समाप्ति तिथि का पालन करें'],
'PL1-67':['Store in the cooler. Follow the expiry date on the product packaging first','쿨러에 보관하세요. 제품 포장에 기재된 유통기한을 먼저 따르세요','कूलर में रखें। पहले उत्पाद पैकेजिंग पर लिखी समाप्ति तिथि का पालन करें'],
'PL1-68':['Store in a sealed container','밀폐 용기에 보관하세요','सीलबंद डिब्बे में रखें'],
'PL1-69':['- Shelf life and storage conditions after opening follow the manufacturer recommendation first','- 개봉 후 유통기한과 보관 조건은 제조사 권장사항을 먼저 따릅니다','- खोलने के बाद शेल्फ लाइफ और भंडारण शर्तों के लिए पहले निर्माता की सिफारिश का पालन करें'],
'PL2-01':['Record the preparation time, date and expiry date fully on the storage container and checklist.','조리 시간, 날짜, 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','तैयारी का समय, तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-02':['Leftover after the shift (small quantity) should go into a storage container and into the fridge. Record the preparation date and expiry date fully on the storage container and checklist.','교대 후 남은 것(소량)은 보관 용기에 담아 냉장고에 넣으세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','शिफ्ट के बाद बचा हुआ (कम मात्रा) भंडारण बर्तन में डालकर फ्रिज में रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-03':['Do not leave bruised; check daily. Record information fully in the checklist. Do not freeze fruit after thawing','멍들게 두지 말고 매일 확인하세요. 체크리스트에 정보를 빠짐없이 기록하세요. 해동 후 과일을 냉동하지 마세요','चोटिल न छोड़ें; रोज़ जाँचें। जानकारी चेकलिस्ट में पूरी लिखें। पिघलने के बाद फल को फिर से न जमाएँ'],
'PL2-04':['Frozen fruit is for smoothies','냉동 과일은 스무디용입니다','जमे फल स्मूदी के लिए हैं'],
'PL2-05':['After opening, keep in the original box in the cooler. Record the opening date and expiry date fully on the storage container and checklist.','개봉 후 원래 상자 그대로 쿨러에 보관하세요. 개봉 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','खोलने के बाद मूल डिब्बे में ही कूलर में रखें। खोलने की तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-06':['Store the original bottle at room temperature. Record the opening date and expiry date fully on the storage container and checklist.','원래 병 그대로 상온에 보관하세요. 개봉 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','मूल बोतल को कमरे के तापमान पर रखें। खोलने की तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-07':['Sugar is cooked into syrup for storage. Put it in a storage container. Store in the cooler. Record the preparation date and expiry date fully on the storage container and checklist. For outlets that use condensed milk frequently during the day, it can be decanted into a small bottle, kept at room temperature during the day, and at the end of the day wash the bottle and discard the remainder','설탕을 시럽으로 끓여 보관합니다. 보관 용기에 담으세요. 쿨러에 보관하세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요. 연유를 당일에 자주 사용하는 매장은 작은 병에 옮겨 당일 상온에 보관할 수 있으며, 당일 종료 시 병을 씻고 남은 것을 버리세요','चीनी को सिरप बनाकर पकाकर रखें। भंडारण बर्तन में डालें। कूलर में रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें। दिन में गाढ़ा दूध अक्सर उपयोग करने वाले आउटलेट इसे छोटी बोतल में निकालकर दिन में कमरे के तापमान पर रख सकते हैं, और दिन के अंत में बोतल धोकर बचा हुआ फेंक दें'],
'PL2-08':['Record the preparation date and expiry date fully on the storage container and checklist.','조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-09':['Follow the manufacturer expiry date first. If the manufacturer does not recommend, follow the internal rule. After opening, keep in the original box in the cooler. Record the preparation date and expiry date fully on the storage container and checklist.','제조사 유통기한을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 후 원래 상자 그대로 쿨러에 보관하세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता की समाप्ति तिथि का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने के बाद मूल डिब्बे में ही कूलर में रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-10':['Fresh beer after opening the keg. Store in the cooler and record the keg opening date and expiry date fully on the storage container and checklist.','케그 개봉 후 생맥주입니다. 쿨러에 보관하고 케그 개봉 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','केग खोलने के बाद ताज़ा बीयर। कूलर में रखें और केग खोलने की तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-11':['Note in the file was cut off at the end of page 18, not fully read - check against the original','파일의 비고가 18페이지 끝에 잘려 있어 끝까지 읽지 못함 - 원본과 대조하세요','फ़ाइल में टिप्पणी पृष्ठ 18 के अंत में कट गई थी, पूरी नहीं पढ़ी गई - मूल से मिलाएँ'],
'PL2-12':['Spirits have no expiry date. After opening, keep in the bottle at room temperature. Record the opening date fully on the label on the bottle and checklist.','증류주는 유통기한이 없습니다. 개봉 후 병 그대로 상온에 보관하세요. 개봉 날짜를 병 라벨과 체크리스트에 빠짐없이 기록하세요.','स्पिरिट की कोई समाप्ति तिथि नहीं है। खोलने के बाद बोतल में ही कमरे के तापमान पर रखें। खोलने की तिथि बोतल के लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-13':['Liqueur after opening. Keep in the bottle at room temperature. Record the preparation date and expiry date fully on the storage container and checklist.','개봉 후 리큐어입니다. 병 그대로 상온에 보관하세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.','खोलने के बाद लिकर। बोतल में ही कमरे के तापमान पर रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।'],
'PL2-14':['Red wine after opening must be vacuum-sealed. Keep in the bottle in the storage cabinet. Record the opening date and expiry date fully on the label on the bottle and checklist.','개봉 후 레드 와인은 진공 밀봉해야 합니다. 병 그대로 보관 캐비닛에 보관하세요. 개봉 날짜와 유통기한을 병 라벨과 체크리스트에 빠짐없이 기록하세요.','खोलने के बाद रेड वाइन को वैक्यूम-सील करना होगा। बोतल में ही भंडारण कैबिनेट में रखें। खोलने की तिथि और समाप्ति तिथि बोतल के लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-15':['White wine after opening must be vacuum-sealed. Keep in the bottle in the fridge. Record the opening date and expiry date fully on the sub-label and checklist.','개봉 후 화이트 와인은 진공 밀봉해야 합니다. 병 그대로 냉장고에 보관하세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','खोलने के बाद व्हाइट वाइन को वैक्यूम-सील करना होगा। बोतल में ही फ्रिज में रखें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-16':['Follow the after-opening instructions on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Record the opening date and expiry date fully on the sub-label and checklist.','제조사 라벨의 개봉 후 지침을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता लेबल पर खोलने के बाद के निर्देशों का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-17':['Follow the after-opening instructions on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Record the opening date and expiry date fully on the sub-label and checklist.','제조사 라벨의 개봉 후 지침을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता लेबल पर खोलने के बाद के निर्देशों का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-18':['Follow the after-opening instructions on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Record the opening date and expiry date fully on the sub-label and checklist.','제조사 라벨의 개봉 후 지침을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता लेबल पर खोलने के बाद के निर्देशों का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
'PL2-19':['Follow the expiry date on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Store in sealed jars / bags. Record the opening date and expiry date fully on the sub-label and checklist.','제조사 라벨의 유통기한을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 밀폐된 병 / 봉투에 보관하세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.','पहले निर्माता लेबल पर समाप्ति तिथि का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। सीलबंद जार / बैग में रखें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।'],
};
// ---- Smart search (chặt, chỉ theo tên món) ----
function levenshtein(a:string,b:string){ if(a===b) return 0; if(!a.length) return b.length; if(!b.length) return a.length; let prev=new Array(b.length+1); let cur=new Array(b.length+1); for(let j=0;j<=b.length;j++) prev[j]=j; for(let i=1;i<=a.length;i++){ cur[0]=i; for(let j=1;j<=b.length;j++){ const cost=a[i-1]===b[j-1]?0:1; cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+cost); } const tmp=prev; prev=cur; cur=tmp; } return prev[b.length]; }
function stripDiacritics(s:string){ return s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D'); }
function normSpacedSmart(s:string){ let x=stripDiacritics(s).toLowerCase().replace(/[-_]+/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); x=x.replace(/\bbanh my\b/g,'banh mi').replace(/\bmy\b/g,'mi'); return x; }
function normCompactSmart(s:string){ return normSpacedSmart(s).replace(/\s+/g,''); }
const SYNONYM_EXPANSION:Record<string,string[]>={ socola:['socola','chocolate','chocolat','cacao'], chocolate:['socola','chocolate','chocolat','cacao'], chocolat:['socola','chocolate','chocolat','cacao'], cacao:['socola','chocolate','chocolat','cacao'], banhmi:['banhmi','bread','baguette','sandwich'], bread:['banhmi','bread','baguette','sandwich'], baguette:['baguette','banhmi','bread'], sandwich:['sandwich'], phomai:['phomai','cheese'], cheese:['phomai','cheese'], thitbo:['thitbo','beef'], beef:['thitbo','beef'], caphe:['caphe','coffee','cafe'], coffee:['caphe','coffee','cafe'], cafe:['caphe','coffee','cafe'], tra:['tra','tea'], tea:['tra','tea'], ruou:['ruou','wine'], wine:['ruou','wine'], kem:['kem','icecream','icream'], icecream:['icecream','icream'], icream:['icecream','icream'], sot:['sot','sauce'], sauce:['sot','sauce'], dauhu:['dauhu','tofu'], tofu:['dauhu','tofu'] };
const SYNONYM_CANONICAL:Record<string,Record<Lang,string>>={ socola:{VI:'sô cô la',EN:'chocolate',KO:'초콜릿',HI:'चॉकलेट'}, banhmi:{VI:'bánh mì',EN:'bread',KO:'빵',HI:'ब्रेड'}, phomai:{VI:'phô mai',EN:'cheese',KO:'치즈',HI:'पनीर'}, thitbo:{VI:'thịt bò',EN:'beef',KO:'소고기',HI:'बीफ़'}, caphe:{VI:'cà phê',EN:'coffee',KO:'커피',HI:'कॉफ़ी'}, tra:{VI:'trà',EN:'tea',KO:'차',HI:'चाय'}, ruou:{VI:'rượu',EN:'wine',KO:'와인',HI:'वाइन'}, kem:{VI:'kem',EN:'ice cream',KO:'아이스크림',HI:'आइसक्रीम'}, sot:{VI:'sốt',EN:'sauce',KO:'소스',HI:'सॉस'}, dauhu:{VI:'đậu hũ',EN:'tofu',KO:'두부',HI:'टोफू'} };
const SYNONYM_KEY_OF:Record<string,string>={ socola:'socola', chocolate:'socola', chocolat:'socola', cacao:'socola', banhmi:'banhmi', bread:'banhmi', baguette:'banhmi', sandwich:'banhmi', phomai:'phomai', cheese:'phomai', thitbo:'thitbo', beef:'thitbo', caphe:'caphe', coffee:'caphe', cafe:'caphe', tra:'tra', tea:'tra', ruou:'ruou', wine:'ruou', kem:'kem', icecream:'kem', icream:'kem', sot:'sot', sauce:'sot', dauhu:'dauhu', tofu:'dauhu' };
function resolveSmartQuery(qRaw:string){ const q=normCompactSmart(qRaw); if(!q) return {q, variants:[], canonicalKey:'' as string, isSynonym:false}; const exact=SYNONYM_EXPANSION[q]; if(exact) return {q, variants:exact, canonicalKey:SYNONYM_KEY_OF[q]||q, isSynonym:true}; let bestKey=''; let bestDist=99; for(const k of Object.keys(SYNONYM_EXPANSION)){ const d=levenshtein(q,k); if(d<bestDist){ bestDist=d; bestKey=k; } } if(bestDist<=1 && bestKey){ return {q, variants:[...SYNONYM_EXPANSION[bestKey], q], canonicalKey:'', isSynonym:false}; } return {q, variants:[q], canonicalKey:'', isSynonym:false}; }
function phrasesOfName(name:string){ const tokens=normSpacedSmart(name).split(' ').filter(Boolean); const set=new Set<string>(); for(let s=0;s<tokens.length;s++){ let acc=''; for(let e=s;e<tokens.length;e++){ acc+=tokens[e]; set.add(acc); } } return set; }
function itemPhraseSet(it:Item, lang:Lang){ const names:string[]=[it.name, it.enName||'']; const loc=NAME_T[code(it)]?.[locIdx(lang)]; if(loc) names.push(loc); const cur=lang==='VI'?it.name:(NAME_T[code(it)]?.[locIdx(lang)]||it.name); names.push(cur); const out=new Set<string>(); for(const n of names){ for(const p of phrasesOfName(n)) out.add(p); } return out; }
function smartMatches(it:Item, lang:Lang, resolved:ReturnType<typeof resolveSmartQuery>){ if(!resolved.q) return true; const phrases=itemPhraseSet(it,lang); for(const v of resolved.variants){ if(phrases.has(v)) return true; } for(const v of resolved.variants){ if(v.length<4) continue; for(const p of phrases){ if(p.length>=4 && Math.abs(p.length-v.length)<=1 && levenshtein(p,v)<=1) return true; } } for(const v of resolved.variants){ for(const p of phrases){ if(p.length>=6 && v.length>p.length && v.includes(p)) return true; } } return false; }
function findHighlightRange(displayName:string, variants:string[], fallbackQ:string){ const chars=[...displayName]; const compactChars:string[]=[]; const origIdx:number[]=[]; chars.forEach((ch,i)=>{ const n=stripDiacritics(ch).toLowerCase(); if(/[a-z0-9]/.test(n)){ compactChars.push(n); origIdx.push(i); } }); const compact=compactChars.join(''); const tryList=[...variants, fallbackQ].filter(Boolean); for(const v of tryList){ const idx=compact.indexOf(v); if(idx>=0){ const start=origIdx[idx]; const end=origIdx[idx+v.length-1]+1; return [start,end] as const; } } for(const v of tryList){ if(v.length<4) continue; for(let s=0;s<compact.length;s++){ for(const len of [v.length-1,v.length,v.length+1]){ if(len<=0||s+len>compact.length) continue; const sub=compact.slice(s,s+len); if(sub.length>=4 && Math.abs(sub.length-v.length)<=1 && levenshtein(sub,v)<=1){ const start=origIdx[s]; const end=origIdx[s+len-1]+1; return [start,end] as const; } } } } return null; }
function HighlightedName({name, variants, fallbackQ}:{name:string;variants:string[];fallbackQ:string}){ const range=variants.length||fallbackQ?findHighlightRange(name,variants,fallbackQ):null; if(!range) return <>{name}</>; const [s,e]=range; return <>{name.slice(0,s)}<mark className="rounded-sm bg-[#FDE68A] px-0 text-inherit">{name.slice(s,e)}</mark>{name.slice(e)}</>; }
export default function App(){
 const [lang,setLang]=useState<Lang>('VI'); const t=I18N[lang];
 const [q,setQ]=useState(''); const [debouncedQ,setDebouncedQ]=useState(''); const [smart,setSmart]=useState(true); const [showSuggest,setShowSuggest]=useState(false); const [app,setApp]=useState<'ALL'|'PL1'|'PL2'|'PL3'>('ALL'); const [group,setGroup]=useState<string>('ALL'); const [store,setStore]=useState('all'); const [sort,setSort]=useState<'no'|'name'>('no'); const [view,setView]=useState<'grid'|'list'>('grid');
 useEffect(()=>{ const id=setTimeout(()=>setDebouncedQ(q),150); return ()=>clearTimeout(id); },[q]);
 const [selected,setSelected]=useState<Item|null>(null); const [copied,setCopied]=useState('');
 const searchRef=useRef<HTMLInputElement>(null);
 const [groupOpen,setGroupOpen]=useState(false); const groupRef=useRef<HTMLDivElement>(null);
 const [filterOpen,setFilterOpen]=useState(false); const [draftGroup,setDraftGroup]=useState<string>('ALL'); const [draftStore,setDraftStore]=useState('all');
 const activeFilterCount=(group!=='ALL'?1:0)+(store!=='all'?1:0);
 const openFilterSheet=()=>{ setDraftGroup(group); setDraftStore(store); setFilterOpen(true); };
 const clearMobileFilters=()=>{ setGroup('ALL'); setStore('all'); setDraftGroup('ALL'); setDraftStore('all'); setFilterOpen(false); };
 useEffect(()=>{ if(!groupOpen) return; const onDown=(e:MouseEvent)=>{ if(groupRef.current && !groupRef.current.contains(e.target as Node)) setGroupOpen(false); }; const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') setGroupOpen(false); }; document.addEventListener('mousedown',onDown); document.addEventListener('keydown',onKey); return ()=>{ document.removeEventListener('mousedown',onDown); document.removeEventListener('keydown',onKey); }; },[groupOpen]);
 const groupOptions=GROUPS_ALL;
 const selectGroup=(g:string)=>{ setGroup(g); if(g!=='ALL'){ const owner=DATA.find(i=>i.g===g)?.a; if(owner) setApp(owner); } setGroupOpen(false); };
 const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036F]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
 const locValue=translateValue;
 const locName=(it:Item,lang:Lang)=>lang==='VI'?it.name:(NAME_T[code(it)]?.[locIdx(lang)]||translateValue(it.name,lang));
 const locNote=(it:Item,lang:Lang)=>{if(lang==='VI')return it.note; if(isEmpty(it.note))return it.note; return NOTE_T[code(it)]?.[locIdx(lang)]||translateValue(it.note,lang);};
 const locFlag=(it:Item,lang:Lang)=>{if(lang==='VI')return it.flag||''; if(!it.flag)return ''; return FLAG_T[code(it)]?.[locIdx(lang)]||translateValue(it.flag,lang);};
 useEffect(()=>{const h=(e:KeyboardEvent)=>{ if(e.key==='/' && document.activeElement!==searchRef.current){e.preventDefault(); searchRef.current?.focus();} if(e.key==='Escape' && document.activeElement===searchRef.current){setQ(''); searchRef.current?.blur();} if(e.key==='Escape'){ setSelected(null); setFilterOpen(false); }}; window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);},[]);
 useEffect(()=>{ document.title=t.pageTitle; },[t.pageTitle]);
 // PWA / Add to Home Screen: dùng đúng file logo F&B BNC gốc làm icon, không vẽ lại / không cắt / không đổi màu.
 // Gắn meta + icon + manifest vào <head> bằng cùng một file ảnh cho mọi kích thước (180 / 192 / 512).
 useEffect(()=>{
   const created: Array<Element> = [];
   const upsertMeta = (key: string, content: string, byName = true) => {
     const selector = byName ? `meta[name="${key}"]` : `meta[property="${key}"]`;
     let el = document.head.querySelector(selector) as HTMLMetaElement | null;
     if (!el) { el = document.createElement('meta'); if (byName) el.setAttribute('name', key); else el.setAttribute('property', key); el.setAttribute('data-pwa-icon', '1'); document.head.appendChild(el); created.push(el); }
     el.setAttribute('content', content);
     return el;
   };
   const upsertLink = (rel: string, href: string, attrs: Record<string,string>) => {
     const selector = `link[rel="${rel}"][data-pwa-icon="1"]` + (attrs.sizes ? `[sizes="${attrs.sizes}"]` : '');
     let el = document.head.querySelector(selector) as HTMLLinkElement | null;
     if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); el.setAttribute('data-pwa-icon', '1'); document.head.appendChild(el); created.push(el); }
     el.setAttribute('href', href);
     Object.entries(attrs).forEach(([k,v]) => el!.setAttribute(k, v));
     return el;
   };
   upsertMeta('apple-mobile-web-app-capable', 'yes');
   upsertMeta('mobile-web-app-capable', 'yes');
   upsertMeta('apple-mobile-web-app-title', 'Tra Cứu BNC');
   upsertMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
   upsertMeta('theme-color', '#0f2a3a');
   // iOS dùng apple-touch-icon 180x180; Android / trình duyệt dùng icon 192 / 512 — tất cả trỏ về cùng file ảnh gốc.
   upsertLink('apple-touch-icon', appIconUrl, { sizes: '180x180', type: 'image/jpeg' });
   upsertLink('icon', appIconUrl, { sizes: '192x192', type: 'image/jpeg' });
   upsertLink('icon', appIconUrl, { sizes: '512x512', type: 'image/jpeg' });
   const manifest = {
     name: 'HỆ THỐNG TRA CỨU NHIỆT ĐỘ BẢO QUẢN & THỜI HẠN SỬ DỤNG THỰC PHẨM - BNC',
     short_name: 'Tra Cứu BNC',
     description: 'Tra cứu nhiệt độ bảo quản & thời hạn sử dụng thực phẩm - BNC',
     display: 'standalone',
     start_url: '.',
     scope: '.',
     background_color: '#F5F3EF',
     theme_color: '#0f2a3a',
     icons: [
       { src: appIconUrl, sizes: '180x180', type: 'image/jpeg', purpose: 'any' },
       { src: appIconUrl, sizes: '192x192', type: 'image/jpeg', purpose: 'any' },
       { src: appIconUrl, sizes: '512x512', type: 'image/jpeg', purpose: 'any' },
     ],
   };
   const manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
   upsertLink('manifest', manifestUrl, { type: 'application/manifest+json' });
   return () => { URL.revokeObjectURL(manifestUrl); created.forEach((el) => el.remove()); };
 },[]);
  const smartResolved=useMemo(()=> smart?resolveSmartQuery(debouncedQ):{q:'',variants:[] as string[],canonicalKey:'',isSynonym:false},[debouncedQ,smart]);
  const filtered=useMemo(()=>{
   let list=[...DATA];
   if(app!=='ALL') list=list.filter(i=>i.a===app);
   if(group!=='ALL') list=list.filter(i=>i.g===group);
   if(store==='room') list=list.filter(i=>hasVal(i.room)); if(store==='cool') list=list.filter(i=>hasVal(i.cool)); if(store==='freeze') list=list.filter(i=>hasVal(i.freeze));
   if(smart){
     if(smartResolved.q) list=list.filter(i=>smartMatches(i,lang,smartResolved));
   } else {
     const tokens=norm(debouncedQ).split(/\s+/).filter(Boolean);
     if(tokens.length) list=list.filter(i=>{const hay=norm(`${locName(i,lang)} ${i.name} ${i.enName||''} ${i.weight||''} ${groupName(i.g,lang)} ${locNote(i,lang)} ${locValue(i.room,lang)} ${locValue(i.cool,lang)} ${locValue(i.freeze,lang)} ${locValue(i.displayCool||'',lang)} ${locValue(i.displayHot||'',lang)}`); return tokens.every(t=>hay.includes(t));});
   }
   if(sort==='name') list.sort((a,b)=>locName(a,lang).localeCompare(locName(b,lang)));
   else list.sort((a,b)=> (a.a===b.a ? a.n-b.n : a.a<b.a?-1:1));
   return list;
 },[debouncedQ,app,group,store,sort,lang,smart,smartResolved]);
  const didYouMean=useMemo(()=>{
   if(!smart||!debouncedQ.trim()||filtered.length>0) return '';
   const qC=normCompactSmart(debouncedQ); if(!qC) return '';
   const spacedMap=new Map<string,string>();
   for(const it of DATA){ const names=[it.name,it.enName||'', lang==='VI'?it.name:(NAME_T[code(it)]?.[locIdx(lang)]||it.name)]; for(const n of names){ const toks=normSpacedSmart(n).split(' ').filter(Boolean); for(let s=0;s<toks.length;s++){ let acc=''; let sp=''; for(let e=s;e<toks.length;e++){ acc+=toks[e]; sp=sp?sp+' '+toks[e]:toks[e]; if(!spacedMap.has(acc)) spacedMap.set(acc,sp); } } } }
   let best=''; let bestD=99; for(const cand of spacedMap.keys()){ if(cand===qC) continue; if(Math.abs(cand.length-qC.length)>2) continue; const d=levenshtein(qC,cand); if(d<bestD){ bestD=d; best=cand; } }
   if(bestD>2||!best) return '';
   const key=SYNONYM_KEY_OF[best]; if(key && SYNONYM_CANONICAL[key]) return SYNONYM_CANONICAL[key][lang];
   return spacedMap.get(best)||best;
  },[debouncedQ,filtered.length,smart,lang]);
  const synonymLine=useMemo(()=>{ if(!smart||!smartResolved.isSynonym||!smartResolved.canonicalKey) return ''; const canonical=SYNONYM_CANONICAL[smartResolved.canonicalKey]?.[lang]||smartResolved.canonicalKey; if(lang==='KO') return `‘${debouncedQ.trim()}’의 동의어인 ${canonical} 결과 표시 중`; if(lang==='HI') return `‘${debouncedQ.trim()}’ ${t.synonymOf} ${canonical} के लिए परिणाम`; return `${t.showingFor} ${canonical} (${t.synonymOf} ‘${debouncedQ.trim()}’)`;
  },[smart,smartResolved,lang,t,debouncedQ]);
 function onSearch(v:string){ setQ(v); if(v.trim()) setShowSuggest(true); }
 function clearSearchAll(){ setQ(''); setDebouncedQ(''); setShowSuggest(false); }
 function resetAll(){ setQ(''); setDebouncedQ(''); setShowSuggest(false); setApp('ALL'); setGroup('ALL'); setStore('all'); setSort('no'); }
 function copyText(text:string, label:string){ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy'); setCopied(label);}catch{} document.body.removeChild(ta); setTimeout(()=>setCopied(''),2200); }
 function itemText(it:Item){ if(it.a==='PL3') return `${t.excerptLabel} — ${code(it)} — ${locName(it,lang)}\n${t.groupLabel}: ${groupName(it.g,lang)}\n${t.colEnglish}: ${it.enName||''}\n${t.colWeight}: ${locValue(it.weight||'',lang)}\n${t.colCold}: ${locValue(it.cool,lang)}\n${t.colFrozen}: ${locValue(it.freeze,lang)}\n${t.colRoom}: ${locValue(it.room,lang)}\n${t.colDisplayCool}: ${locValue(it.displayCool||'',lang)}\n${t.colDisplayHot}: ${locValue(it.displayHot||'',lang)}\n${t.sourcePL3}`; return `${t.excerptLabel} — ${code(it)} — ${locName(it,lang)}\n${t.groupLabel}: ${groupName(it.g,lang)}\n${t.colRoom}: ${locValue(it.room,lang)}\n${t.colCool}: ${locValue(it.cool,lang)}\n${t.colFreeze}: ${locValue(it.freeze,lang)}\n${t.noteLabel}: ${isEmpty(it.note)?t.emptyNote:locNote(it,lang)}`; }
 function TempCell({label,value,tone,icon,hideHint}:{label:string;value:string;tone:string;icon:React.ReactNode;hideHint?:boolean}){ const dim=isEmpty(value); const tint=tone==='#7A5E12'?'border-[#E8D9A8] bg-[#FDF6E3]':tone==='#174E5E'?'border-[#C8DDE3] bg-[#EAF2F5]':'border-[#D3D8E8] bg-[#EEF0F7]'; return <div className={`rounded-xl border px-3 py-2.5 ${dim?'border-[#E5E0D5] bg-[#F5F3EF]':tint}`}><div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{color:tone}}>{icon}{label}</div>{dim?<div className="mt-1"><div className="text-[16px] font-black text-[#9CA3AF]">—</div>{!hideHint && <div className="text-[10px] text-[#6B7280] mt-0.5">{t.emptyCellHint}</div>}</div>:<div className="mt-1 text-[15px] font-extrabold text-[#1F2937] leading-snug">{value}</div>}</div>;}
 return (
 <div data-safe-area-inset-root className="min-h-screen bg-[#F5F3EF] text-[#1F2937]" style={{boxSizing:'border-box',paddingTop:'var(--safe-area-inset-top)'}}>
  {/* HEADER + SEARCH — một khối sticky để thanh tìm kiếm luôn nằm ngay dưới header trên mobile */}
  <div data-safe-area-sticky-top className="sticky top-[var(--safe-area-inset-top)] z-40 border-b-2 border-[#C9A227] bg-gradient-to-r from-[#122A47] to-[#1E4A75] shadow-[0_10px_30px_rgba(18,42,71,.22)]">
  <header>
  <div className="mx-auto max-w-[1360px] px-3 py-2 md:px-6 md:py-4">
   <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-3 lg:flex-row lg:items-start lg:justify-between">
     <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-white/25 bg-[#0f2a3a] md:mt-0.5 md:h-11 md:w-11 md:rounded-2xl"><img src={appIconUrl} alt="Logo F&B BNC — Tra Cứu BNC" className="h-full w-full object-cover" /></div>
      <div className="min-w-0"><h1 className="truncate text-[14px] font-black leading-tight text-white md:hidden">{t.shortTitle}</h1><p className="truncate text-[10px] font-bold leading-tight text-[#D4B84A] md:hidden">{t.subtitle}</p><h1 className="hidden text-[21px] leading-snug font-black tracking-tight text-balance text-white md:block lg:text-[23px]">{t.title}</h1><p className="hidden text-[12px] font-bold text-[#D4B84A] mt-1 leading-snug tracking-wide md:block">{t.subtitle}</p></div>
     </div>
     <div className="flex shrink-0 items-center" role="group" aria-label="Language"><div className="flex rounded-full border border-white/30 bg-transparent p-0.5 md:p-1">{LANGS.map(l=>(<button key={l} onClick={()=>setLang(l)} aria-pressed={lang===l} aria-label={l} className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition md:h-auto md:min-h-[44px] md:min-w-[44px] md:px-3 md:py-2 md:text-[13px] ${lang===l?'bg-[#C9A227] text-[#122A47] shadow':'bg-transparent text-white hover:bg-white/10'}`}>{l}</button>))}</div></div>
    </div>
   </div>
  </header>
  <div className="border-t border-white/15">
   <div className="mx-auto max-w-[1360px] px-3 py-2 md:px-6 md:py-3">
    <div className="flex items-center gap-2">
    <div className="relative min-w-0 flex-1">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1E4A75] md:left-4" size={18}/>
     <input ref={searchRef} value={q} onChange={e=>onSearch(e.target.value)} onFocus={()=>{ if(q.trim()) setShowSuggest(true); }} onBlur={()=>{ setTimeout(()=>setShowSuggest(false),160); }} placeholder={t.searchPlaceholder} className="w-full h-10 bg-white border border-[#D8D2C2] focus:border-[#1E4A75] rounded-xl pl-10 pr-9 py-2 text-[14px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] shadow-sm md:min-h-[52px] md:rounded-2xl md:pl-11 md:pr-12 md:py-3.5 md:text-[15px]"/>
     {q && <button onClick={clearSearchAll} aria-label={t.clearSearch} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#F5F3EF] text-[#6B7280] flex items-center justify-center md:right-2 md:h-10 md:w-10"><X size={16}/></button>}
     {showSuggest && smart && debouncedQ.trim() && filtered.length>0 && (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#D8D2C2] bg-white shadow-[0_24px_50px_rgba(15,23,42,.18)]" role="listbox" aria-label={t.suggestions}>
       <p className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#6B7280]">{t.suggestions}</p>
       {filtered.slice(0,5).map(it=>(
        <button key={code(it)} type="button" role="option" onMouseDown={(e)=>{ e.preventDefault(); setSelected(it); setShowSuggest(false); }} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[#F5F3EF]">
         <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#1F2937]"><HighlightedName name={locName(it,lang)} variants={smartResolved.variants} fallbackQ={smartResolved.q} /></span>
         <span className="shrink-0 text-[11px] font-black text-[#7A5E12]">{code(it)}</span>
        </button>
       ))}
      </div>
     )}
    </div>
    <button type="button" onClick={()=>setSmart(v=>!v)} aria-pressed={smart} aria-label={smart?t.smartOn:t.smartOff} title={smart?t.smartOn:t.smartOff} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[16px] transition md:h-[52px] md:w-[52px] md:rounded-2xl ${smart?'border-[#C9A227] bg-[#FDF6E3] text-[#122A47]':'border-white/30 bg-white/10 text-white'}`}><span aria-hidden="true">✨</span></button>
    </div>
    {synonymLine && filtered.length>0 && (
     <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white md:text-[13px]"><span className="min-w-0 flex-1 truncate">{synonymLine}</span><button onClick={clearSearchAll} aria-label={t.clearSearch} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"><X size={13}/></button></div>
    )}
   </div>
  </div>
  </div>

  <main className="mx-auto max-w-[1360px] px-3 py-2 pb-10 md:px-6 md:py-5">
   {/* Category + controls */}
   <div className="no-scrollbar flex gap-2 overflow-x-auto md:flex-wrap" role="tablist" aria-label={t.filterGroup}>{([['ALL',t.all],['PL1',t.appendix1],['PL2',t.appendix2],['PL3',t.appendix3]] as const).map(([k,label])=>(<button key={k} role="tab" aria-selected={app===k} onClick={()=>{setApp(k); setGroup('ALL'); setGroupOpen(false);}} className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-black transition md:h-auto md:px-4 md:py-2.5 ${app===k?'bg-[#1E4A75] text-white border-[#1E4A75]':'bg-white border-[#D8D2C2] text-[#1F2937] hover:border-[#1E4A75]'}`}>{label}</button>))}</div>
   {/* Mobile: one compact filter row */}
   <div className="mt-2 flex items-center gap-2 md:hidden">
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
     <button type="button" onClick={openFilterSheet} aria-haspopup="dialog" aria-expanded={filterOpen} className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-[13px] font-black ${activeFilterCount>0?'border-[#C9A227] bg-[#FDF6E3] text-[#122A47]':'border-[#D8D2C2] bg-white text-[#1F2937]'}`}><SlidersHorizontal size={15}/><span className="truncate">{t.filterBtn}</span>{activeFilterCount>0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C9A227] px-1 text-[11px] font-black text-[#122A47]">{activeFilterCount}</span>}</button>
     {activeFilterCount>0 && <button type="button" onClick={clearMobileFilters} aria-label={t.clearFilters} className="flex h-10 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D8D2C2] bg-white text-[#6B7280]"><X size={16}/></button>}
    </div>
    <label className="relative block min-w-0 flex-1"><ArrowUpDown size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1E4A75]"/><select value={sort} onChange={e=>setSort(e.target.value as 'no'|'name')} aria-label={t.sort} className="h-10 w-full appearance-none truncate rounded-xl border border-[#D8D2C2] bg-white pl-8 pr-7 text-[13px] font-bold text-[#1F2937]"><option value="no">{t.sortId}</option><option value="name">{t.sortName}</option></select><ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#1E4A75]"/></label>
    <div className="flex h-10 w-[76px] shrink-0 overflow-hidden rounded-xl border border-[#D8D2C2]"><button onClick={()=>setView('grid')} aria-label={t.viewGrid} aria-pressed={view==='grid'} className={`flex h-10 w-[38px] items-center justify-center ${view==='grid'?'bg-[#1E4A75] text-white':'bg-white text-[#1F2937]'}`}><LayoutGrid size={16}/></button><button onClick={()=>setView('list')} aria-label={t.viewList} aria-pressed={view==='list'} className={`flex h-10 w-[38px] items-center justify-center ${view==='list'?'bg-[#1E4A75] text-white':'bg-white text-[#1F2937]'}`}><List size={16}/></button></div>
   </div>
   <div className="hidden md:grid grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 mt-4 items-end">
    <div ref={groupRef} className="relative min-w-0">
     <span className="block text-[11px] font-black tracking-wider text-[#6B7280]">{t.filterGroup.toUpperCase()}</span>
     <button type="button" onClick={()=>setGroupOpen(v=>!v)} aria-haspopup="listbox" aria-expanded={groupOpen} aria-label={t.filterGroup} className={`mt-1.5 flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-[14px] font-bold text-[#1F2937] transition ${groupOpen?'border-[#1E4A75] shadow-[0_0_0_2px_rgba(30,74,117,.15)]':'border-[#D8D2C2] hover:border-[#1E4A75]'}`}>
      <span className="min-w-0 flex-1 truncate">{group==='ALL'?t.all:groupName(group,lang)}</span>
      <ChevronDown size={18} className={`shrink-0 text-[#1E4A75] transition-transform ${groupOpen?'rotate-180':''}`}/>
     </button>
     {groupOpen && (
      <div className="fade-in absolute left-0 right-0 top-full z-30 mt-2 max-h-[320px] overflow-y-auto rounded-xl border border-[#D8D2C2] bg-white p-1.5 shadow-[0_24px_50px_rgba(15,23,42,.18)]" role="listbox" aria-label={t.filterGroup}>
       {['ALL',...groupOptions].map(g=>{ const label=g==='ALL'?t.all:groupName(g,lang); const active=group===g; return <button key={g} type="button" role="option" aria-selected={active} onClick={()=>selectGroup(g)} className={`flex w-full items-start justify-between gap-2 rounded-lg px-3 py-3 text-left text-[13px] leading-snug transition ${active?'bg-[#F5F3EF] font-black text-[#122A47]':'font-medium text-[#1F2937] hover:bg-[#F5F3EF]'}`}><span className="min-w-0 flex-1">{label}</span>{active && <Check size={16} className="mt-0.5 shrink-0"/>}</button>; })}
      </div>
     )}
    </div>
    <label className="block min-w-0"><span className="block text-[11px] font-black tracking-wider text-[#6B7280]">{t.filterStorage.toUpperCase()}</span><span className="relative mt-1.5 block"><select value={store} onChange={e=>setStore(e.target.value)} aria-label={t.filterStorage} className="h-11 w-full appearance-none truncate rounded-xl border border-[#D8D2C2] bg-white px-3 py-2.5 pr-9 text-[14px] font-bold text-[#1F2937] outline-none"><option value="all">{t.all}</option><option value="room">{t.hasRoom}</option><option value="cool">{t.hasCool}</option><option value="freeze">{t.hasFreeze}</option></select><ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#1E4A75]"/></span></label>
    <label className="block min-w-0"><span className="block text-[11px] font-black tracking-wider text-[#6B7280]">{t.sort.toUpperCase()}</span><span className="relative mt-1.5 block"><select value={sort} onChange={e=>setSort(e.target.value as 'no'|'name')} aria-label={t.sort} className="h-11 w-full appearance-none truncate rounded-xl border border-[#D8D2C2] bg-white px-3 py-2.5 pr-9 text-[14px] font-bold text-[#1F2937] outline-none"><option value="no">{t.sortId}</option><option value="name">{t.sortName}</option></select><ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#1E4A75]"/></span></label>
    <div className="min-w-0"><span className="block text-[11px] font-black tracking-wider text-[#6B7280]">{t.displayLabel.toUpperCase()}</span><div className="mt-1.5 flex h-11 rounded-xl border border-[#D8D2C2] overflow-hidden"><button onClick={()=>setView('grid')} aria-label={t.viewGrid} className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-bold ${view==='grid'?'bg-[#1E4A75] text-white':'bg-white text-[#1F2937]'}`}><LayoutGrid size={16}/> {t.viewGrid}</button><button onClick={()=>setView('list')} aria-label={t.viewList} className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-bold ${view==='list'?'bg-[#1E4A75] text-white':'bg-white text-[#1F2937]'}`}><List size={16}/> {t.viewList}</button></div></div>
   </div>
   <div className="flex items-center justify-between mt-2 mb-2 md:mt-6 md:mb-3"><h2 className="text-[14px] font-black text-[#1F2937] md:text-[16px]"><span className="text-[#1E4A75]">{filtered.length}</span> {t.results} {group!=='ALL' && <span className="text-[#6B7280] font-medium">• {groupName(group,lang)}</span>}</h2>{(q||app!=='ALL'||group!=='ALL'||store!=='all') && <button onClick={resetAll} className="text-[12px] font-bold text-[#1E4A75]">{t.resetFilter} →</button>}</div>

   {filtered.length===0 ? (
    <div className="rounded-2xl border border-dashed border-[#D8D2C2] bg-white p-10 text-center"><div className="mx-auto w-14 h-14 rounded-2xl bg-[#EAF2F5] flex items-center justify-center"><PackageSearch size={28} className="text-[#1E4A75]"/></div><h3 className="font-black text-lg mt-4 text-[#1F2937]">{debouncedQ.trim()?`${t.noResultFor} ‘${debouncedQ.trim()}’`:t.noResultTitle}</h3>{debouncedQ.trim() && didYouMean ? <button onClick={()=>{ setQ(didYouMean); setDebouncedQ(didYouMean); setShowSuggest(false); }} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FDF6E3] border border-[#E8D9A8] px-4 py-2 text-[13px] font-black text-[#122A47] hover:bg-[#F5E9B8]">{t.didYouMean} {didYouMean}?</button> : <p className="text-[#6B7280] text-[14px] mt-1">{t.noResultDesc}</p>}<button onClick={resetAll} className="mt-5 px-5 py-2.5 rounded-full bg-[#1E4A75] text-white font-black text-[13px] hover:bg-[#122A47]">{t.resetFilter}</button></div>
   ) : view==='grid' ? (
   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
     {filtered.map(it=>{ return (
      <article key={code(it)} className="rounded-[20px] border border-[#E5E0D5] bg-white p-5 flex flex-col shadow-[0_2px_10px_rgba(18,42,71,.05)] transition hover:border-[#C9A227] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(18,42,71,.08)]">
       <div className="flex items-start justify-between gap-2"><span className="text-[12px] font-black text-[#7A5E12]">{t.codeLabel} {code(it)}</span><span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#F5F3EF] border border-[#E5E0D5] text-[#6B7280] text-right">{it.a==='PL1'?t.appendix1:it.a==='PL2'?t.appendix2:t.appendix3}</span></div>
       <div className="text-[11px] font-bold text-[#6B7280] mt-2">{groupName(it.g,lang)}</div>
       <div className="flex flex-wrap gap-1.5 mt-2">{isToday(it) && <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-[#1E4A75] text-white"><Clock3 size={11}/> {t.useToday}</span>}</div>
       <button onClick={()=>{setSelected(it);}} className="text-left mt-2"><h3 className="font-extrabold text-[17px] leading-snug text-[#1F2937] hover:text-[#1E4A75]">{smart && debouncedQ.trim() ? <HighlightedName name={locName(it,lang)} variants={smartResolved.variants} fallbackQ={smartResolved.q} /> : locName(it,lang)}</h3>{it.a==='PL3' && it.enName && <span className="block text-[13px] font-medium text-[#6B7280] mt-0.5">{lang==='EN'?it.name:it.enName}</span>}</button>
       {it.a==='PL3' ? (<><p className="text-[13px] font-bold text-[#1F2937] mt-2">{t.colWeight}: <span className="font-extrabold text-[#1E4A75]">{locValue(it.weight||'',lang)}</span></p><div className="grid grid-cols-2 gap-2 mt-3"><TempCell label={t.colCold} value={locValue(it.cool,lang)} tone="#174E5E" icon={<Thermometer size={12}/>} hideHint/><TempCell label={t.colFrozen} value={locValue(it.freeze,lang)} tone="#2E3A5C" icon={<Snowflake size={12}/>} hideHint/><TempCell label={t.colRoom} value={locValue(it.room,lang)} tone="#7A5E12" icon={<Home size={12}/>} hideHint/><TempCell label={t.colDisplayCool} value={locValue(it.displayCool||'',lang)} tone="#174E5E" icon={<Thermometer size={12}/>} hideHint/><div className="col-span-2"><TempCell label={t.colDisplayHot} value={locValue(it.displayHot||'',lang)} tone="#7A5E12" icon={<Flame size={12}/>} hideHint/></div></div></>) : (<><div className="grid grid-cols-3 gap-2 mt-3"><TempCell label={t.colRoom} value={locValue(it.room,lang)} tone="#7A5E12" icon={<Home size={12}/>}/><TempCell label={t.colCool} value={locValue(it.cool,lang)} tone="#174E5E" icon={<Thermometer size={12}/>}/><TempCell label={t.colFreeze} value={locValue(it.freeze,lang)} tone="#2E3A5C" icon={<Snowflake size={12}/>}/></div><p className="text-[13px] text-[#1F2937] leading-relaxed mt-3 bg-[#F5F3EF] border border-[#E5E0D5] rounded-xl p-3 flex-1"><span className="text-[#1F2937] font-bold text-[11px] tracking-wider">{t.noteLabel.toUpperCase()} — </span>{isEmpty(it.note)?t.emptyNote:locNote(it,lang)}</p></>)}
       <div className="flex gap-2 mt-4"><button onClick={()=>{setSelected(it);}} className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-[#1E4A75] text-white text-[13px] font-black hover:bg-[#122A47]">{t.detail} <ChevronRight size={14} className="inline"/></button><button onClick={()=>copyText(itemText(it),`${code(it)} ${locName(it,lang)}`)} aria-label={`${t.copy} ${locName(it,lang)}`} title={t.copy} className="min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-xl border border-[#D8D2C2] bg-[#F5F3EF] text-[#1E4A75] hover:bg-[#EDEAE3] flex items-center justify-center"><Copy size={16}/></button></div>
       </article>);})}
    </div>
   ) : (
    <div className="rounded-2xl border border-[#E5E0D5] bg-white overflow-hidden shadow-[0_2px_10px_rgba(18,42,71,.05)]"><div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_110px_110px_110px_minmax(0,1.4fr)_140px] gap-3 px-4 py-3 text-[11px] font-black tracking-wider text-[#6B7280] border-b border-[#E5E0D5] bg-[#F5F3EF]"><span>{t.colName.toUpperCase()}</span><span>{t.colRoom.toUpperCase()}</span><span>{t.colCool.toUpperCase()}</span><span>{t.colFreeze.toUpperCase()}</span><span>{t.noteLabel.toUpperCase()}</span><span className="text-right">{t.colAction.toUpperCase()}</span></div>
     {filtered.map(it=>{ if(it.a==='PL3') return <div key={code(it)} className="px-4 py-3 border-b border-[#E5E0D5] hover:bg-[#F5F3EF]"><div className="flex flex-wrap items-start justify-between gap-2"><button onClick={()=>{setSelected(it);}} className="text-left"><span className="text-[#1E4A75] font-black text-[12px] mr-2">{code(it)}</span><span className="font-bold text-[14px] text-[#1F2937]">{smart && debouncedQ.trim() ? <HighlightedName name={locName(it,lang)} variants={smartResolved.variants} fallbackQ={smartResolved.q} /> : locName(it,lang)}</span><span className="block text-[12px] font-medium text-[#6B7280]">{lang==='EN'?it.name:it.enName} • {t.colWeight}: {locValue(it.weight||'',lang)}</span></button><span className="flex gap-1.5"><button onClick={()=>{setSelected(it);}} className="px-2.5 py-2 rounded-lg bg-[#1E4A75] text-white text-[12px] font-bold hover:bg-[#122A47]">{t.detail}</button><button onClick={()=>copyText(itemText(it),code(it))} aria-label={t.copy} title={t.copy} className="px-2.5 py-2 rounded-lg border border-[#D8D2C2] bg-[#F5F3EF] text-[#1E4A75]"><Copy size={14}/></button></span></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">{[[t.colCold,it.cool],[t.colFrozen,it.freeze],[t.colRoom,it.room],[t.colDisplayCool,it.displayCool||''],[t.colDisplayHot,it.displayHot||'']].map(([label,val])=>(<span key={label} className="rounded-lg border border-[#E5E0D5] bg-[#F5F3EF] px-2 py-1.5 text-[12px] text-[#1F2937]"><span className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">{label}</span>{locValue(val,lang)}</span>))}</div></div>; return <div key={code(it)} className="grid md:grid-cols-[minmax(0,1.5fr)_110px_110px_110px_minmax(0,1.4fr)_140px] gap-2 md:gap-3 px-4 py-3 border-b border-[#E5E0D5] items-center hover:bg-[#F5F3EF]"><button onClick={()=>{setSelected(it);}} className="text-left"><span className="text-[#1E4A75] font-black text-[12px] mr-2">{code(it)}</span><span className="font-bold text-[14px] text-[#1F2937]">{smart && debouncedQ.trim() ? <HighlightedName name={locName(it,lang)} variants={smartResolved.variants} fallbackQ={smartResolved.q} /> : locName(it,lang)}</span></button><span className="text-[13px] text-[#1F2937]">{locValue(it.room,lang)}</span><span className="text-[13px] text-[#1F2937]">{locValue(it.cool,lang)}</span><span className="text-[13px] text-[#1F2937]">{locValue(it.freeze,lang)}</span><span className="text-[12px] text-[#6B7280] line-clamp-2">{isEmpty(it.note)?t.emptyNote:locNote(it,lang)}</span><span className="flex gap-1.5 justify-end"><button onClick={()=>{setSelected(it);}} className="px-2.5 py-2 rounded-lg bg-[#1E4A75] text-white text-[12px] font-bold hover:bg-[#122A47]">{t.detail}</button><button onClick={()=>copyText(itemText(it),code(it))} aria-label={t.copy} title={t.copy} className="px-2.5 py-2 rounded-lg border border-[#D8D2C2] bg-[#F5F3EF] text-[#1E4A75]"><Copy size={14}/></button></span></div>})}
    </div>
   )}
   <div className="mt-6 flex flex-wrap gap-2 items-center rounded-2xl border border-[#E8D9A8] bg-[#FDF6E3] p-4"><Flame size={18} className="text-[#7A5E12]"/><p className="text-[13px] text-[#1F2937] flex-1 font-medium">{t.principle}</p></div>
  </main>
  <footer className="border-t-2 border-[#C9A227] bg-[#122A47]"><div className="mx-auto flex w-full max-w-[1360px] items-center justify-center px-4 sm:px-6 py-5 text-center text-[13px] font-black leading-relaxed text-[#D4B84A]"><p className="m-auto w-full text-center">By Le Hoang Phuc</p></div></footer>
  {copied && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-[#122A47] text-white px-4 py-2.5 rounded-full text-[13px] font-bold shadow-2xl flex items-center gap-2"><Check size={16}/> {t.copied} {copied}</div>}

  {/* MODAL */}
  {filterOpen && (
   <div className="fade-in fixed inset-0 z-50 flex items-end justify-center md:hidden" role="dialog" aria-modal="true" aria-label={t.filterTitle}>
    <button aria-label={t.close} onClick={()=>setFilterOpen(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"/>
    <div className="sheet-up relative w-full max-h-[82vh] overflow-y-auto rounded-t-[24px] bg-white p-4 pb-6 shadow-2xl">
     <div className="mx-auto h-1.5 w-12 rounded-full bg-[#D8D2C2]"/>
     <div className="mt-3 flex items-center justify-between gap-3"><h3 className="text-[16px] font-black text-[#122A47]">{t.filterTitle}</h3><button onClick={()=>setFilterOpen(false)} aria-label={t.close} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F3EF] text-[#1F2937]"><X size={18}/></button></div>
     <label className="mt-4 block"><span className="text-[11px] font-black tracking-wider text-[#6B7280]">{t.filterGroup.toUpperCase()}</span><span className="relative mt-1.5 block"><select value={draftGroup} onChange={e=>setDraftGroup(e.target.value)} aria-label={t.filterGroup} className="h-11 w-full appearance-none rounded-xl border border-[#D8D2C2] bg-white px-3 py-2.5 pr-9 text-[14px] font-bold text-[#1F2937]"><option value="ALL">{t.all}</option>{groupOptions.map(g=>(<option key={g} value={g}>{groupName(g,lang)}</option>))}</select><ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#1E4A75]"/></span></label>
     <label className="mt-3 block"><span className="text-[11px] font-black tracking-wider text-[#6B7280]">{t.filterStorage.toUpperCase()}</span><span className="relative mt-1.5 block"><select value={draftStore} onChange={e=>setDraftStore(e.target.value)} aria-label={t.filterStorage} className="h-11 w-full appearance-none rounded-xl border border-[#D8D2C2] bg-white px-3 py-2.5 pr-9 text-[14px] font-bold text-[#1F2937]"><option value="all">{t.all}</option><option value="room">{t.hasRoom}</option><option value="cool">{t.hasCool}</option><option value="freeze">{t.hasFreeze}</option></select><ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#1E4A75]"/></span></label>
     <div className="mt-5 flex gap-2"><button onClick={clearMobileFilters} className="h-11 flex-1 rounded-xl border border-[#D8D2C2] bg-[#F5F3EF] text-[13px] font-black text-[#1F2937]">{t.clearFilters}</button><button onClick={()=>{ if(draftGroup!=='ALL'){ const owner=DATA.find(i=>i.g===draftGroup)?.a; if(owner) setApp(owner); } setGroup(draftGroup); setStore(draftStore); setFilterOpen(false); }} className="h-11 flex-[2] rounded-xl bg-[#1E4A75] text-[13px] font-black text-white">{t.apply}</button></div>
    </div>
   </div>
  )}
  {selected && (
   <div className="fade-in fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={locName(selected,lang)}>
    <button aria-label={t.close} onClick={()=>setSelected(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"/>
    <div className="sheet-up relative w-full max-w-[760px] max-h-[88vh] sm:max-h-[92vh] overflow-y-auto bg-white text-[#1F2937] border border-[#E5E0D5] rounded-t-[24px] sm:rounded-[24px] shadow-2xl">
     <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-[#D8D2C2] sm:hidden" />
     <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[#E5E0D5] px-5 sm:px-6 py-4 flex items-start justify-between gap-3"><div><p className="text-[11px] font-black tracking-wider text-[#6B7280]">{t.detailTitle}</p><div className="flex gap-2 flex-wrap mt-1"><span className="text-[#7A5E12] font-black text-[12px]">{t.codeLabel} {code(selected)}</span><span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F5F3EF] border border-[#E5E0D5] text-[#1E4A75]">{t.groupLabel}: {groupName(selected.g,lang)}</span>{isToday(selected) && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#1E4A75] text-white">{t.useToday}</span>}</div><h3 className="text-[20px] font-black leading-tight mt-1.5 text-[#122A47]">{locName(selected,lang)}</h3></div><button onClick={()=>setSelected(null)} aria-label={t.close} className="h-11 w-11 shrink-0 rounded-full bg-[#F5F3EF] text-[#1F2937] flex items-center justify-center"><X size={20}/></button></div>
     <div className="p-5 sm:p-6">
      <div className="grid grid-cols-3 gap-3"><TempCell label={t.colRoom} value={locValue(selected.room,lang)} tone="#7A5E12" icon={<Home size={12}/>}/><TempCell label={t.colCool} value={locValue(selected.cool,lang)} tone="#174E5E" icon={<Thermometer size={12}/>}/><TempCell label={t.colFreeze} value={locValue(selected.freeze,lang)} tone="#2E3A5C" icon={<Snowflake size={12}/>}/></div>
      <div className="grid gap-3 mt-3"><div className="rounded-2xl border border-[#E5E0D5] bg-[#F5F3EF] p-4"><p className="text-[11px] font-black tracking-wider text-[#6B7280]">{t.originalNote}</p><p className="text-[14px] leading-relaxed mt-2 text-[#1F2937]">{isEmpty(selected.note)?t.emptyNote:locNote(selected,lang)}</p></div>{locFlag(selected,lang) && <div className="rounded-2xl border border-[#E8D9A8] bg-[#FDF6E3] p-4"><p className="text-[11px] font-black tracking-wider text-[#7A5E12] flex items-center gap-1"><AlertTriangle size={13}/> {t.qaTitle}</p><p className="text-[14px] leading-relaxed mt-2 text-[#1F2937]">{locFlag(selected,lang)}</p></div>}</div>
      <div className="flex flex-wrap gap-2 mt-5"><button onClick={()=>copyText(itemText(selected),locName(selected,lang))} className="flex min-h-[48px] items-center gap-2 px-4 py-3 rounded-xl border border-[#D8D2C2] bg-[#F5F3EF] text-[#1E4A75] font-black text-[13px] hover:bg-[#EDEAE3]"><Copy size={15}/> {t.copy}</button><button onClick={()=>setSelected(null)} className="min-h-[48px] px-5 py-3 rounded-xl bg-[#1E4A75] text-white text-[13px] font-black hover:bg-[#122A47]">{t.close}</button></div>
     </div>
    </div>
   </div>
  )}
 </div>
 );
}
