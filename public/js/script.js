// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 5000);
  });
});

// Confirm delete actions
document.querySelectorAll('form[action*="/delete/"]').forEach(form => {
  form.addEventListener('submit', function(e) {
    if (!confirm('Are you sure you want to delete this item?')) {
      e.preventDefault();
    }
  });
});

// Add loading spinner to forms
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', function() {
    const submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Processing...';
    }
  });
});

// Format dates
document.querySelectorAll('.format-date').forEach(element => {
  const date = new Date(element.textContent);
  element.textContent = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Add animation to cards
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
});

document.querySelectorAll('.card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'all 0.5s ease';
  observer.observe(card);
});