// public/js/init-datepicker.js

$(document).ready(function() {
    $('.date-picker').daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        autoUpdateInput: false,
        autoApply: false,
        locale: {
            format: 'DD/MM/YYYY',
            cancelLabel: 'ล้างค่า', 
            daysOfWeek: ['อา','จ','อ','พ','พฤ','ศ','ส'],
            monthNames: ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],
            firstDay: 1
        }
    });

    $('.date-picker').on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('DD/MM/YYYY'));
        $(this).data('daterangepicker').hide();
    });

    $('.date-picker').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
    });


    $(document.body).on('change', '#searchStatus', function() {
        const selectedStatus = $(this).val();

        // 🎯 ถ้าเลือกสถานะเป็น 5 (เสร็จสิ้น)
        if (String(selectedStatus) === '5' || String(selectedStatus) === 'qc_all') {
            const minDateInput = $('#filterMinDate');
            const maxDateInput = $('#filterMaxDate');

            // 🔍 เช็กว่าช่องวันที่เริ่มต้น หรือ วันที่สิ้นสุด เป็นค่าว่างหรือไม่
            if (!minDateInput.val().trim() || !maxDateInput.val().trim()) {
                const today = new Date();
                
                // คำนวณวันย้อนหลัง 2 วัน
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(today.getDate() - 2);

                // Helper สำหรับจัดฟอร์แมตวันที่ให้อยู่ในรูปแบบ DD-MM-YYYY
                const formatDate = (dateObj) => {
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    return `${day}-${month}-${year}`;
                };

                // 🟢 กำหนดค่าลงในช่อง Input
                minDateInput.val(formatDate(twoDaysAgo));
                maxDateInput.val(formatDate(today));

                // เผื่อใช้งานร่วมกับ Datepicker Library (เช่น jQuery UI / Flatpickr) ให้สั่ง trigger หรือ setDate เพิ่มเติม
                if ($.fn.datepicker) {
                    minDateInput.datepicker('setDate', twoDaysAgo);
                    maxDateInput.datepicker('setDate', today);
                }
            }
        } else if(String(selectedStatus) !== 'open' && String(selectedStatus) !== 'closed') {
            // 🎯 ถ้าเลือกสถานะไม่ใช่ 5 (เสร็จสิ้น) ให้ล้างค่าช่องวันที่
            $('#filterMinDate').val('');
            $('#filterMaxDate').val('');
        }
    });
});