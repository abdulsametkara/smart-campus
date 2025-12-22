import Swal from 'sweetalert2';

// Simple shared notification service wrapping SweetAlert2
const NotificationService = {
  success(title, text, options = {}) {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      ...options
    });
  },

  error(title, text, options = {}) {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      ...options
    });
  },

  warning(title, text, options = {}) {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      ...options
    });
  },

  info(title, text, options = {}) {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      ...options
    });
  },

  confirm(title, text, options = {}) {
    return Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Onayla',
      cancelButtonText: 'Vazgeç',
      ...options
    });
  }
};

export default NotificationService;


