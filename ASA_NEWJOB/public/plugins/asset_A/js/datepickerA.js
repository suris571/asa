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
});