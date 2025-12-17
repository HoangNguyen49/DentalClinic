import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Xuất phần tử HTML thành file PDF (Hỗ trợ tự động xuống trang nếu quá dài)
 * @param elementId ID của thẻ div bao quanh nội dung cần in
 * @param fileName Tên file xuất ra (không cần đuôi .pdf)
 */
export const exportToPDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Error: Element with id '${elementId}' not found.`);
    alert("Không tìm thấy nội dung để in! Vui lòng kiểm tra lại ID trong code.");
    return;
  }

  try {
    // 1. Tạo Canvas từ HTML
    const canvas = await html2canvas(element, {
      scale: 2, // Tăng độ nét
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      // Quan trọng: Capture toàn bộ chiều cao thực tế kể cả khi scroll
      windowHeight: element.scrollHeight, 
    });

    const imgData = canvas.toDataURL('image/png');
    
    // 2. Khởi tạo PDF A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Kích thước A4 chuẩn (mm)
    const imgWidth = 210; 
    const pageHeight = 297; 

    // Tính chiều cao của ảnh sau khi fit vào chiều rộng A4
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0; // Vị trí bắt đầu vẽ ảnh (y)

    // 3. Vẽ trang đầu tiên
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 4. Vòng lặp: Nếu còn dư chiều cao -> Thêm trang mới
    while (heightLeft > 0) {
      position = heightLeft - imgHeight; // Dịch chuyển ảnh lên trên (tọa độ âm)
      
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      
      heightLeft -= pageHeight;
    }

    // 5. Lưu file
    pdf.save(`${fileName}.pdf`);

  } catch (error) {
    console.error("Export PDF Failed: ", error);
    alert("Có lỗi khi xuất PDF. Vui lòng thử lại.");
  }
};