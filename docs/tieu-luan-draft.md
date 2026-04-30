# [TÊN TRƯỜNG]
# [TÊN KHOA / BỘ MÔN]

## TIỂU LUẬN MÔN HỌC
## Đề tài: Thiết kế và xây dựng hệ thống bãi giữ xe thông minh (PCS)

**Giảng viên hướng dẫn:** [Điền tên giảng viên]  
**Sinh viên thực hiện:** [Điền họ tên]  
**MSSV:** [Điền MSSV]  
**Lớp:** [Điền lớp]  
**Niên khóa:** [Điền năm học]  
**Địa điểm, thời gian:** [Điền địa điểm - tháng/năm]

---

## LỜI CAM ĐOAN

Tôi cam đoan nội dung trong bài tiểu luận này là kết quả tự nghiên cứu, tự triển khai và tổng hợp trong quá trình thực hiện đề tài “Hệ thống bãi giữ xe thông minh (PCS)”. Các tài liệu, công trình và ý tưởng kế thừa từ nguồn khác đều đã được ghi chú và trích dẫn trong phần tài liệu tham khảo. Tôi chịu hoàn toàn trách nhiệm về tính trung thực của báo cáo.

## LỜI CẢM ƠN

Tôi xin chân thành cảm ơn giảng viên phụ trách môn học đã định hướng chuyên môn và góp ý trong quá trình thực hiện đề tài. Tôi cũng xin cảm ơn bạn bè và các anh chị đã hỗ trợ trao đổi kỹ thuật, góp ý về giao diện và kiểm thử nghiệp vụ vận hành. Những góp ý này giúp tôi hoàn thiện hệ thống theo hướng thực tế hơn, từ mức mô hình học tập tiến gần đến một sản phẩm có thể triển khai vận hành.

## TÓM TẮT ĐỀ TÀI

Đề tài tập trung xây dựng một hệ thống quản lý bãi giữ xe thông minh theo hướng ứng dụng thực tế, gồm ba thành phần chính: giao diện vận hành web, backend xử lý nghiệp vụ và cơ sở dữ liệu quan hệ. Hệ thống hỗ trợ các tác vụ cốt lõi như ghi nhận xe vào, xe ra, tính phí tự động, xử lý ngoại lệ mất vé, quản lý vé tháng, và điều phối chỗ đỗ theo sơ đồ khu vực.

Điểm trọng tâm của đề tài không nằm ở giao diện trình diễn, mà ở tính đúng đắn và nhất quán nghiệp vụ trong điều kiện vận hành thật. Vì vậy, hệ thống được bổ sung các cơ chế kiểm soát đồng thời và chống thao tác lặp như transaction, row lock, idempotency key và ràng buộc dữ liệu ở tầng cơ sở dữ liệu. Bên cạnh đó, giao diện được tổ chức theo tư duy vận hành để người dùng có thể nắm trạng thái hệ thống, thực hiện thao tác nhanh và xử lý tình huống xung đột.

Kết quả đạt được cho thấy hệ thống đã đáp ứng tốt luồng nghiệp vụ chính của bãi giữ xe, đồng thời mở rộng được các tính năng nâng cao như khóa slot bảo trì, điều chuyển slot cho phiên đang mở, và lưu lịch sử gia hạn vé tháng. Các kiểm thử tích hợp cho các kịch bản chính đều đạt kết quả ổn định, tạo nền tảng cho việc mở rộng theo hướng triển khai thực tế trong giai đoạn tiếp theo.

## MỤC LỤC

1. Chương 1. Tổng quan đề tài  
2. Chương 2. Cơ sở lý thuyết và phân tích yêu cầu  
3. Chương 3. Thiết kế hệ thống  
4. Chương 4. Hiện thực và triển khai  
5. Chương 5. Kiểm thử và đánh giá  
6. Chương 6. Kết luận và hướng phát triển  
7. Tài liệu tham khảo  
8. Phụ lục

## DANH MỤC TỪ VIẾT TẮT

- PCS: Parking Control System
- FR: Functional Requirements
- NFR: Non-functional Requirements
- API: Application Programming Interface
- DBMS: Database Management System
- ERD: Entity Relationship Diagram
- UI/UX: User Interface / User Experience
- ANPR: Automatic Number Plate Recognition

## DANH MỤC HÌNH VÀ BẢNG (GỢI Ý)

- Hình 3.1: Kiến trúc tổng thể hệ thống PCS
- Hình 3.2: Sơ đồ ERD của hệ thống
- Hình 3.3: Flowchart check-in
- Hình 3.4: Flowchart check-out
- Hình 3.5: Flowchart slot maintenance và transfer slot
- Bảng 2.1: Danh sách yêu cầu chức năng FR
- Bảng 2.2: Danh sách yêu cầu phi chức năng NFR
- Bảng 5.1: Ma trận kiểm thử và kết quả

---

## Chương 1. Tổng quan đề tài

### 1.1 Bối cảnh

Trong bối cảnh đô thị hóa và gia tăng phương tiện cá nhân, nhu cầu quản lý bãi giữ xe hiệu quả trở thành một vấn đề thực tiễn ở nhiều cơ sở dịch vụ, trường học và trung tâm thương mại. Thực tế cho thấy nhiều bãi xe vẫn quản lý theo phương pháp bán thủ công: nhân viên nhập liệu rời rạc, đối chiếu bằng mắt thường, và theo dõi tình trạng chỗ trống qua kinh nghiệm thay vì dữ liệu tức thời. Mô hình này thường dẫn đến ùn tắc trong giờ cao điểm, chậm xử lý khi xe ra vào liên tục, và khó truy vết khi phát sinh tranh chấp phí hoặc thất lạc thông tin.

Ngoài áp lực vận hành, bãi giữ xe hiện đại còn cần khả năng quan sát trạng thái toàn cục theo thời gian thực: khu vực nào sắp đầy, chỗ nào bảo trì, xe nào đang gửi quá lâu, vé tháng nào sắp hết hạn. Khi thiếu một hệ thống tích hợp, những quyết định vận hành thường dựa vào cảm tính, dẫn đến sai lệch giữa dữ liệu thực tế và dữ liệu quản trị.

### 1.2 Lý do chọn đề tài

Đề tài được lựa chọn để giải quyết đồng thời hai bài toán: chuẩn hóa nghiệp vụ vận hành và nâng cao chất lượng quan sát hệ thống. Mục tiêu là xây dựng một hệ thống có thể vận hành thật, không chỉ dừng lại ở mức hiển thị giao diện. Vì vậy, đề tài tập trung vào các đặc tính “đúng hệ thống” như nhất quán dữ liệu, kiểm soát xung đột thao tác, phản hồi lỗi có ngữ nghĩa nghiệp vụ, và khả năng mở rộng tính năng theo nhu cầu thực tế.

### 1.3 Mục tiêu đề tài

Mục tiêu tổng quát của đề tài là xây dựng hệ thống PCS gồm các nghiệp vụ quản lý xe vào/ra, tính phí, quản lý vé tháng, điều phối slot theo sơ đồ bãi, và cung cấp dashboard vận hành theo thời gian thực. Từ mục tiêu tổng quát này, đề tài cụ thể hóa thành ba nhóm mục tiêu: mục tiêu nghiệp vụ, mục tiêu kỹ thuật và mục tiêu vận hành.

Ở mức nghiệp vụ, hệ thống phải hỗ trợ đầy đủ luồng check-in/check-out và xử lý ngoại lệ mất vé. Ở mức kỹ thuật, hệ thống phải đảm bảo tính nhất quán trong điều kiện thao tác đồng thời và chống xử lý lặp. Ở mức vận hành, giao diện phải giúp nhân viên thao tác nhanh, hiểu trạng thái hệ thống rõ ràng, và xử lý tình huống phát sinh có hướng dẫn.

### 1.4 Phạm vi nghiên cứu

Phạm vi nghiên cứu tập trung vào một bãi giữ xe đơn vị, triển khai theo mô hình web nội bộ với backend và cơ sở dữ liệu tập trung. Đề tài chưa triển khai các thành phần nhận diện biển số bằng camera (ANPR), chưa xử lý kiến trúc phân tán đa chi nhánh, và chưa tích hợp thiết bị IoT phần cứng tại cổng vào/ra. Tuy nhiên, thiết kế hiện tại đã chuẩn bị được nền tảng dữ liệu và luồng nghiệp vụ để mở rộng các hướng này trong giai đoạn tiếp theo.

---

## Chương 2. Cơ sở lý thuyết và phân tích yêu cầu

### 2.1 Cơ sở lý thuyết

Nền tảng lý thuyết quan trọng đầu tiên là mô hình client-server, trong đó frontend đóng vai trò giao diện vận hành và backend là nơi thực thi nghiệp vụ tập trung. Cách tiếp cận này giúp tách biệt rõ trách nhiệm giữa tầng hiển thị và tầng xử lý, từ đó nâng cao khả năng bảo trì và mở rộng.

Nền tảng thứ hai là thiết kế REST API theo contract rõ ràng. Mỗi endpoint cần định nghĩa input, output và nhóm lỗi dự kiến. Cách làm này giúp frontend xử lý trạng thái nhất quán, tránh phụ thuộc vào thông điệp lỗi tự do và tăng tính tương thích giữa các module.

Nền tảng thứ ba là transaction và concurrency control ở tầng cơ sở dữ liệu. Đối với các thao tác nhạy cảm như check-in/check-out, chỉ một lỗi race-condition nhỏ cũng có thể gây lệch trạng thái toàn hệ thống. Do đó, đề tài áp dụng row-level locking, unique constraints và kiểm tra điều kiện nghiệp vụ trong transaction.

Nền tảng thứ tư là idempotency cho các thao tác ghi dữ liệu. Trong môi trường web thực tế, người dùng có thể bấm lặp hoặc gửi lại request khi mạng chậm. Nếu không có cơ chế idempotency, hệ thống có thể tạo dữ liệu trùng hoặc tạo trạng thái không nhất quán.

### 2.2 Phân tích yêu cầu chức năng

Các yêu cầu chức năng của hệ thống được xây dựng theo quy trình vận hành bãi xe. Trước hết, hệ thống phải ghi nhận xe vào, xe ra và tính phí chính xác theo cấu hình. Tiếp theo, hệ thống phải quản lý vé tháng theo vòng đời đầy đủ: tạo mới, tra cứu, gia hạn và lưu lịch sử gia hạn. Bên cạnh đó, hệ thống phải cho phép theo dõi sơ đồ bãi theo khu vực, biết trạng thái từng slot, và có khả năng điều phối linh hoạt bằng các thao tác bảo trì slot hoặc điều chuyển xe giữa các slot.

Ngoài các chức năng tác vụ, hệ thống cũng cần chức năng quan sát vận hành: dashboard tổng hợp lượt vào/ra, xe trong bãi và doanh thu theo thời gian. Chức năng này nhằm giúp người vận hành ra quyết định dựa trên dữ liệu thay vì dựa vào cảm nhận.

### 2.3 Phân tích yêu cầu phi chức năng

Yêu cầu phi chức năng của đề tài tập trung vào bốn trụ cột. Trụ cột thứ nhất là tính nhất quán dữ liệu, đảm bảo hệ thống không rơi vào trạng thái “xe đã ra nhưng slot chưa trả”, hoặc “một xe có hai phiên mở”. Trụ cột thứ hai là độ tin cậy API, thể hiện qua mã lỗi có ngữ nghĩa và khả năng xử lý thao tác trùng. Trụ cột thứ ba là khả năng vận hành, yêu cầu giao diện phải hiển thị ngữ cảnh rõ, có timeline thao tác, và có cảnh báo khu vực sắp đầy. Trụ cột thứ tư là khả năng mở rộng, cho phép bổ sung các module như ANPR, báo cáo cuối ca, hoặc phân quyền sâu trong tương lai.

### 2.4 Tác nhân và kịch bản sử dụng

Tác nhân chính của hệ thống gồm nhân viên thu ngân và quản trị viên. Nhân viên thu ngân thực hiện các tác vụ hàng ngày như ghi nhận xe vào/ra, xử lý mất vé, tạo hoặc tra cứu vé tháng. Quản trị viên sử dụng hệ thống để theo dõi vận hành, quản lý slot bảo trì, và xử lý các tình huống ngoại lệ cần quyết định ở mức cao hơn.

Kịch bản vận hành điển hình bắt đầu từ check-in. Hệ thống kiểm tra dữ liệu đầu vào, xác nhận xe chưa có phiên mở, chọn slot phù hợp, sau đó tạo session và cập nhật trạng thái slot. Kịch bản check-out thực hiện theo chiều ngược lại: khóa phiên đang mở, tính phí, đóng phiên và trả slot về trạng thái trống. Các kịch bản đặc thù như điều chuyển slot hoặc gia hạn vé tháng cũng được xử lý thành transaction riêng để bảo đảm toàn vẹn dữ liệu.

---

## Chương 3. Thiết kế hệ thống

### 3.1 Kiến trúc tổng thể

Hệ thống được thiết kế theo mô hình monolith phân lớp. Tầng giao diện web chịu trách nhiệm hiển thị thông tin và thu thập thao tác người dùng. Tầng API chịu trách nhiệm định tuyến và kiểm soát truy cập. Tầng controller/service thực hiện nghiệp vụ và gọi cơ sở dữ liệu. Tầng dữ liệu sử dụng PostgreSQL làm nguồn dữ liệu chuẩn duy nhất.

Ưu điểm của kiến trúc này là dễ triển khai, dễ debug, phù hợp với quy mô đề tài ứng dụng trong môi trường học thuật nhưng vẫn đủ cấu trúc để mở rộng. Các thành phần quan trọng như validation, error handling, logging và idempotency được tách rõ thành module tiện tái sử dụng.

### 3.2 Thiết kế dữ liệu và ràng buộc

Mô hình dữ liệu được tổ chức quanh thực thể trung tâm là `parking_sessions`. Mỗi session liên kết với xe, nhân viên vào/ra, vé tháng (nếu có) và slot đỗ. Hai thực thể `parking_areas` và `parking_slots` cho phép biểu diễn bãi xe theo không gian thực. Thực thể `monthly_ticket_renewals` giúp lưu dấu vết các lần gia hạn, phục vụ truy vết và kiểm toán nghiệp vụ.

Đề tài áp dụng nhiều ràng buộc dữ liệu để giảm lỗi logic ngay tại tầng DB. Ví dụ, unique partial index đảm bảo một xe chỉ có một phiên mở. Trạng thái slot bị giới hạn ở tập giá trị hợp lệ. Các thao tác cập nhật trạng thái quan trọng đều đi qua transaction để tránh trạng thái trung gian.

### 3.3 Thiết kế luồng nghiệp vụ

Luồng check-in được thiết kế theo tư duy “kiểm tra trước, ghi nhận sau”. Sau khi xác minh dữ liệu hợp lệ và xác định xe chưa có phiên mở, hệ thống chọn slot phù hợp theo loại xe, khóa slot, rồi mới tạo session. Luồng này ngăn trường hợp hệ thống tạo session nhưng không còn chỗ đỗ.

Luồng check-out được thiết kế theo tư duy “đóng phiên là tác vụ nguyên tử”. Hệ thống khóa phiên đang mở, tính phí theo quy tắc, cập nhật thông tin phiên, đồng thời trả slot về trạng thái trống. Nếu bất kỳ bước nào lỗi, toàn bộ transaction được rollback.

Luồng quản trị slot gồm hai tác vụ bổ sung: khóa bảo trì và điều chuyển slot. Tác vụ bảo trì đảm bảo slot đang có xe không thể chuyển bảo trì. Tác vụ điều chuyển đảm bảo slot đích hợp lệ, phù hợp loại xe và không trùng slot hiện tại.

### 3.4 Thiết kế API và thông điệp lỗi

API được nhóm theo miền nghiệp vụ: vận hành xe, dashboard, layout, vé tháng, và tác vụ slot. Đối với mỗi nhóm, hệ thống chuẩn hóa mã lỗi để frontend xử lý thống nhất. Mã `400` dùng cho dữ liệu đầu vào sai, `404` cho trường hợp không tìm thấy dữ liệu, `409` cho xung đột nghiệp vụ, và `500` cho lỗi bất thường.

Việc chuẩn hóa mã lỗi giúp giao diện hiển thị thông điệp có ngữ cảnh, từ đó giảm thao tác sai lặp lại của người dùng. Đây là yếu tố quan trọng để hệ thống vượt khỏi mức demo và tiến gần mô hình vận hành thực tế.

---

## Chương 4. Hiện thực và triển khai

### 4.1 Môi trường công nghệ

Hệ thống được hiện thực bằng Node.js và Express ở backend, PostgreSQL cho lưu trữ dữ liệu, cùng HTML/Tailwind/Vanilla JavaScript cho giao diện web. Cách chọn công nghệ này giúp giảm độ phức tạp triển khai, đồng thời đủ mạnh để xử lý đầy đủ nghiệp vụ của đề tài.

### 4.2 Hiện thực backend

Backend tổ chức thành các module controller riêng cho từng nhóm nghiệp vụ: check-in/check-out, dashboard/layout, monthly ticket và parking operations. Cách tổ chức này giúp luồng xử lý rõ ràng, giảm phụ thuộc chéo và dễ bảo trì.

Các migration SQL được quản lý theo phiên bản, cho phép nâng cấp schema tuần tự mà không phá dữ liệu cũ. Các phiên bản bổ sung area/slot, slot_id trong session, và renewal history đã chứng minh khả năng tiến hóa kiến trúc theo nhu cầu nghiệp vụ.

### 4.3 Hiện thực giao diện vận hành

Giao diện được tái cấu trúc theo định hướng “operations-first”. Khu thu ngân không chỉ có form nhập liệu mà còn có runtime state, timeline thao tác, và gợi ý hành động tiếp theo khi lỗi. Dashboard ưu tiên thông tin quyết định thay vì biểu đồ nặng. Tab sơ đồ bãi cho phép nhìn trạng thái slot trực tiếp và thao tác quản trị ngay trên cùng giao diện.

Nhóm tính năng vé tháng cũng được hiện thực đầy đủ hơn so với bản demo ban đầu: tạo mới, tra cứu trạng thái hiệu lực, gia hạn và xem lịch sử gia hạn. Điều này giải quyết độ lệch giữa tài liệu nghiệp vụ và UI thực tế.

### 4.4 Liên kết thiết kế và mã nguồn

Một điểm mạnh của đề tài là sự liên kết chặt giữa thiết kế và hiện thực. Mỗi flow chính trong tài liệu đều có endpoint và module tương ứng trong code. Nhờ vậy, tài liệu hệ thống không chỉ mang tính mô tả mà còn có thể dùng như bản đồ kỹ thuật cho bảo trì và mở rộng.

---

## Chương 5. Kiểm thử và đánh giá

### 5.1 Phương pháp kiểm thử

Kiểm thử được thực hiện theo hai lớp: kiểm thử API theo kịch bản đầu vào/đầu ra, và kiểm thử tích hợp theo luồng nghiệp vụ xuyên suốt. Các trường hợp kiểm thử bao gồm dữ liệu thiếu, dữ liệu sai, xung đột nghiệp vụ, thao tác đồng thời và thao tác lặp.

Đối với các nghiệp vụ nhạy cảm như check-out và transfer slot, kiểm thử tập trung vào tính nhất quán sau khi thao tác, thay vì chỉ kiểm tra mã phản hồi. Đối với vé tháng, kiểm thử tập trung vào tính đúng của vòng đời hiệu lực và lịch sử gia hạn.

### 5.2 Kết quả đánh giá

Kết quả kiểm thử cho thấy các luồng nghiệp vụ chính hoạt động ổn định, phản hồi đúng trạng thái và giữ được tính nhất quán dữ liệu. Các kịch bản xung đột đã được chặn ở tầng nghiệp vụ và tầng dữ liệu. Giao diện vận hành hiển thị rõ trạng thái thao tác, giúp người dùng xử lý lỗi có định hướng thay vì thao tác mò.

Từ góc nhìn kỹ thuật, hệ thống đạt được mục tiêu của một đề tài ứng dụng thực chiến ở quy mô học thuật: có kiến trúc rõ ràng, có kiểm soát đồng thời, có tài liệu hệ thống và có khả năng mở rộng.

### 5.3 Hạn chế

Hệ thống hiện chưa tích hợp tự động nhận diện biển số từ camera, nên vẫn phụ thuộc nhập liệu thủ công. Báo cáo cuối ca chưa được chuẩn hóa thành mẫu xuất tự động. Một số lớp audit nâng cao như người thao tác chi tiết cho từng thay đổi nhạy cảm vẫn có thể bổ sung để tăng năng lực kiểm toán.

Ngoài ra, hệ thống mới ở mức một bãi xe đơn, chưa kiểm chứng trong mô hình đa chi nhánh hoặc kiến trúc phân tán. Đây là hạn chế chấp nhận được ở giai đoạn tiểu luận, đồng thời cũng là hướng phát triển phù hợp cho nghiên cứu tiếp theo.

---

## Chương 6. Kết luận và hướng phát triển

### 6.1 Kết luận

Đề tài đã xây dựng thành công một hệ thống bãi giữ xe thông minh theo định hướng ứng dụng thực tế. Giá trị cốt lõi của hệ thống là khả năng chuyển đổi quy trình vận hành từ thủ công, rời rạc sang quy trình dữ liệu nhất quán, có kiểm soát và có khả năng quan sát theo thời gian thực. So với mô hình demo thông thường, hệ thống hiện tại thể hiện rõ các đặc trưng của sản phẩm vận hành: nghiệp vụ đầy đủ, trạng thái rõ ràng, kiểm soát xung đột và khả năng truy vết.

### 6.2 Hướng phát triển

Trong giai đoạn tiếp theo, hệ thống có thể phát triển theo ba hướng. Hướng thứ nhất là nâng cấp dữ liệu đầu vào bằng tích hợp ANPR để giảm nhập liệu thủ công. Hướng thứ hai là nâng cấp quản trị vận hành qua báo cáo cuối ca, phân tích dài hạn và cảnh báo bất thường. Hướng thứ ba là nâng cấp kiến trúc để phục vụ quy mô lớn hơn, bao gồm đa bãi xe, đồng bộ liên chi nhánh và cơ chế phân quyền sâu.

---

## TÀI LIỆU THAM KHẢO (MẪU)

[1] PostgreSQL Global Development Group, “PostgreSQL Documentation,” [Online]. Available: https://www.postgresql.org/docs/  
[2] Express.js, “Express - Node.js web application framework,” [Online]. Available: https://expressjs.com/  
[3] OpenAPI Initiative, “OpenAPI Specification,” [Online]. Available: https://swagger.io/specification/  
[4] M. Fowler, *Patterns of Enterprise Application Architecture*, Addison-Wesley, 2002.  
[5] Tài liệu và mã nguồn dự án PCS (nội bộ nhóm thực hiện).

---

## PHỤ LỤC

### Phụ lục A. ERD hệ thống

Đính kèm ERD từ tài liệu `docs/system-design.md` hoặc ảnh xuất từ công cụ vẽ.

### Phụ lục B. Flowchart nghiệp vụ

Đính kèm flow check-in, check-out, parking layout, slot suggestion, slot maintenance, transfer slot, renewal history.

### Phụ lục C. API mẫu

Đính kèm request/response mẫu cho các endpoint chính theo `docs/openapi.yaml`.

### Phụ lục D. Test case

Đính kèm bảng test case theo nhóm: hợp lệ, không hợp lệ, xung đột, đồng thời, gia hạn vé tháng.
# TIỂU LUẬN DỰ ÁN: HỆ THỐNG BÃI GIỮ XE THÔNG MINH (PCS)

> Lưu ý: Đây là bản nháp hoàn chỉnh để bạn chỉnh tên môn, tên giảng viên, thời gian, và thông số đo thực tế trước khi nộp.

## Thông tin chung

- **Tên đề tài:** Thiết kế và xây dựng hệ thống quản lý bãi giữ xe thông minh (PCS).
- **Loại đề tài:** Ứng dụng phần mềm vận hành thực tế (Web + Backend + Database).
- **Mục tiêu tổng quát:** Số hóa nghiệp vụ check-in/check-out, quản lý slot theo sơ đồ bãi, quản lý vé tháng, và hỗ trợ vận hành theo thời gian thực.

---

## Chương 1. Tổng quan đề tài

### 1.1 Bối cảnh và lý do chọn đề tài

Trong thực tế, nhiều bãi giữ xe vẫn vận hành bán thủ công: ghi nhận xe vào/ra theo thao tác tay, đối chiếu thủ công khi xe ra, thiếu giám sát theo khu vực, và khó truy vết khi phát sinh lỗi. Mô hình này dễ gây ùn tắc vào giờ cao điểm, sai lệch dữ liệu doanh thu, và phát sinh tranh chấp khi ngoại lệ (mất vé, xe ra trùng thao tác, nhập sai biển số).

Đề tài được chọn nhằm xây dựng một hệ thống có khả năng vận hành thật: vừa đảm bảo đúng nghiệp vụ, vừa có khả năng quan sát trạng thái bãi theo thời gian thực. Mục tiêu không dừng ở mức giao diện demo mà tiến đến một luồng vận hành có ràng buộc dữ liệu, kiểm soát đồng thời, và hỗ trợ quyết định cho nhân viên ca trực.

### 1.2 Vấn đề cần giải quyết

Các vấn đề cốt lõi của bài toán gồm:

- Đồng bộ trạng thái xe trong bãi để tránh một xe có nhiều phiên gửi đang mở.
- Tính phí chính xác theo cấu hình bảng giá và xử lý ngoại lệ mất vé.
- Hạn chế thao tác lặp do người dùng bấm nhiều lần hoặc lỗi mạng.
- Hiển thị tình trạng chỗ trống theo khu vực, hỗ trợ điều phối slot.
- Đảm bảo dữ liệu nhất quán khi nhiều thao tác xảy ra đồng thời.

### 1.3 Mục tiêu và phạm vi

**Mục tiêu chức năng:**

- Ghi nhận xe vào/ra đầy đủ, có tính phí.
- Quản lý vé tháng (tạo, tra cứu, gia hạn, lịch sử gia hạn).
- Hiển thị dashboard vận hành theo ngày.
- Hiển thị sơ đồ bãi theo area/slot, gợi ý slot phù hợp.
- Hỗ trợ thao tác trực tiếp lên slot: khóa bảo trì, điều chuyển slot.

**Mục tiêu phi chức năng:**

- Dữ liệu nhất quán trong môi trường có thao tác đồng thời.
- API phản hồi ổn định với status code rõ ràng.
- Giao diện đủ thông tin ngữ cảnh cho người vận hành.

**Phạm vi hiện tại:**

- Hệ thống vận hành trong phạm vi một bãi giữ xe.
- Chưa tích hợp nhận diện biển số tự động bằng camera.
- Chưa triển khai mô hình microservice hoặc đa chi nhánh.

---

## Chương 2. Cơ sở lý thuyết và phân tích yêu cầu

### 2.1 Cơ sở lý thuyết áp dụng

Đề tài sử dụng các nền tảng lý thuyết chính:

- **Kiến trúc Client–Server:** Frontend gửi yêu cầu nghiệp vụ đến API backend.
- **REST API và contract-first:** Mỗi endpoint có input/output và mã lỗi rõ ràng.
- **Transaction trong cơ sở dữ liệu:** Nhóm các bước nghiệp vụ thành một đơn vị nguyên tử.
- **Concurrency control:** Dùng `FOR UPDATE`, unique index, và ràng buộc dữ liệu để tránh race condition.
- **Idempotency:** Chặn xử lý trùng khi cùng một thao tác được gửi lặp.
- **Data integrity:** Ràng buộc CHECK/UNIQUE và migration có kiểm soát.

### 2.2 Phân tích yêu cầu chức năng (FR)

- FR1: Check-in xe theo biển số và loại xe.
- FR2: Check-out xe, tính phí theo bảng giá, hỗ trợ mất vé.
- FR3: Quản lý vé tháng: tạo, tra cứu, gia hạn.
- FR4: Dashboard tổng hợp vận hành theo ngày.
- FR5: Quản lý sơ đồ bãi: area/slot, trạng thái slot, gợi ý slot.
- FR6: Tác vụ vận hành slot: khóa bảo trì/mở lại, điều chuyển slot.

### 2.3 Phân tích yêu cầu phi chức năng (NFR)

- NFR1: Tính nhất quán dữ liệu cao trong thao tác đồng thời.
- NFR2: Tính sẵn sàng cơ bản với health/readiness endpoint.
- NFR3: Tính truy vết qua log nghiệp vụ.
- NFR4: Giao diện phản hồi rõ trạng thái (success/conflict/error).
- NFR5: Khả năng mở rộng theo chiều nghiệp vụ (thêm rule slot, báo cáo, audit).

### 2.4 Tác nhân hệ thống

- **Nhân viên thu ngân (GUARD):** thao tác check-in/check-out, vé tháng.
- **Quản trị (ADMIN):** giám sát vận hành, cấu hình/quản lý nâng cao.
- **Hệ thống backend:** xử lý nghiệp vụ và bảo toàn tính nhất quán.

---

## Chương 3. Thiết kế hệ thống

### 3.1 Kiến trúc tổng thể

Hệ thống được thiết kế theo mô hình monolith phân lớp:

- `UI (HTML/Tailwind/JS)`
- `API Routes (Express Router)`
- `Controller/Service/Utils`
- `PostgreSQL`

Luồng xử lý chuẩn: người dùng thao tác trên UI -> gửi API -> controller validate và xử lý nghiệp vụ -> truy cập DB bằng transaction -> trả response -> UI cập nhật trạng thái vận hành.

### 3.2 Thiết kế dữ liệu

Các nhóm bảng chính:

- **Nghiệp vụ lõi:** `vehicles`, `parking_sessions`, `pricing_config`.
- **Quản trị vé tháng:** `monthly_tickets`, `monthly_ticket_renewals`.
- **Điều phối bãi:** `parking_areas`, `parking_slots`.
- **Đảm bảo xử lý an toàn:** `api_idempotency`.
- **Quản trị người dùng:** `users`.

Điểm nhấn thiết kế:

- Một xe chỉ có tối đa một phiên đang mở.
- Slot có vòng đời trạng thái rõ (`FREE`, `OCCUPIED`, `MAINTENANCE`).
- Gia hạn vé tháng được lưu lịch sử để truy vết.

### 3.3 Thiết kế luồng nghiệp vụ trọng yếu

- **Check-in:** validate -> idempotency -> vehicle upsert -> kiểm tra phiên mở -> chọn slot -> reserve slot -> tạo session -> commit.
- **Check-out:** validate -> idempotency -> khóa phiên mở -> tính phí -> đóng session -> trả slot -> commit.
- **Slot maintenance:** khóa row slot -> kiểm tra trạng thái -> đổi `FREE <-> MAINTENANCE`.
- **Transfer slot:** khóa session + slot đích -> kiểm tra hợp lệ -> chuyển từ slot cũ sang slot mới.
- **Renewal history:** update hạn vé tháng + insert log gia hạn.

### 3.4 Thiết kế API

Nhóm endpoint chính:

- `/api/check-in`, `/api/check-out`
- `/api/dashboard-summary`, `/api/active-sessions`
- `/api/parking-layout`, `/api/slot-suggestion`
- `/api/monthly-tickets`, `/api/monthly-tickets/:license_plate`
- `/api/monthly-tickets/:license_plate/renew`
- `/api/monthly-tickets/:license_plate/renewals`
- `/api/slots/:slot_code/maintenance`
- `/api/sessions/transfer-slot`

---

## Chương 4. Hiện thực và triển khai

### 4.1 Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Frontend:** HTML, TailwindCSS, Vanilla JavaScript
- **Testing:** Node test + integration smoke tests

### 4.2 Mapping thiết kế sang hiện thực

- Mỗi flow nghiệp vụ được ánh xạ thành controller cụ thể.
- Các migration SQL được phiên bản hóa theo từng bản cập nhật (`update_v3` đến `update_v6`).
- Các endpoint mới cho smart parking và monthly ticket history đã được tích hợp vào route layer.

### 4.3 Triển khai giao diện vận hành

Giao diện được phát triển theo hướng “operations-first”:

- Cashier Console với shortcut và timeline sự kiện.
- Dashboard vận hành nhẹ, ưu tiên thông tin quyết định.
- Tab sơ đồ bãi theo area/slot với trạng thái trực quan.
- Khu tác vụ vé tháng (tạo/tra cứu/gia hạn/lịch sử).
- Khu tác vụ slot (khóa bảo trì/điều chuyển).

---

## Chương 5. Kiểm thử và đánh giá

### 5.1 Kịch bản kiểm thử

- Kiểm thử input thiếu/không hợp lệ (400).
- Kiểm thử xung đột nghiệp vụ (409): xe đang trong bãi, slot không khả dụng.
- Kiểm thử không tìm thấy dữ liệu (404).
- Kiểm thử đồng thời check-out để xác thực race-condition handling.
- Kiểm thử idempotency khi gửi lặp cùng key.
- Kiểm thử flow vé tháng và lịch sử gia hạn.

### 5.2 Kết quả đạt được

- Hệ thống duy trì tính nhất quán cho các tác vụ trọng yếu.
- API phản hồi theo mã lỗi có ý nghĩa nghiệp vụ.
- Giao diện đủ ngữ cảnh để hỗ trợ vận hành thay vì chỉ hiển thị kết quả đơn lẻ.
- Các tính năng smart parking đã hoạt động ở mức nghiệp vụ thực dụng.

### 5.3 Hạn chế hiện tại

- Chưa có nhận diện biển số tự động từ camera.
- Chưa có phân quyền sâu theo từng tác vụ slot.
- Chưa có hệ thống cảnh báo bất thường nâng cao (anomaly detection).

---

## Chương 6. Kết luận và hướng phát triển

### 6.1 Kết luận

Đề tài đã hiện thực hóa một hệ thống bãi giữ xe theo hướng thực chiến: từ quản lý phiên gửi xe cơ bản đến điều phối slot theo sơ đồ và quản trị vé tháng có lịch sử gia hạn. Điểm nổi bật là hệ thống không chỉ “chạy được” mà còn chú trọng đúng đắn dữ liệu, khả năng vận hành, và tính mở rộng.

### 6.2 Hướng phát triển

- Tích hợp ANPR (camera nhận diện biển số).
- Bổ sung báo cáo cuối ca và dashboard phân tích dài hạn.
- Mở rộng audit trail cho mọi thao tác nhạy cảm.
- Tối ưu rule gợi ý slot theo tải khu vực và thời gian thực.
- Triển khai CI/CD và checklist vận hành production đầy đủ.

---

## Tài liệu đính kèm nên có trong phụ lục

- ERD chi tiết (Mermaid hoặc ảnh).
- Flowchart các nghiệp vụ trọng yếu.
- Danh sách API và ví dụ request/response.
- Bảng test cases và kết quả kiểm thử.
- Ảnh chụp giao diện các module chính.
