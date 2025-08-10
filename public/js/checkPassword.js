$(document).ready(function() {
    // Initialize global password validation state
    window.passwordValid = false;

    function updateRegisterButton() {
        const usernameValid = window.usernameValid || false;
        const emailValid = window.emailValid || false;
        $('#registerBtn').prop('disabled', !(usernameValid && emailValid && window.passwordValid));
        console.log('Validation states:', { usernameValid, emailValid, passwordValid: window.passwordValid }); // Debug log
    }

    $('#password').on('input', function() {
        const password = $(this).val();
        if (password.length < 8) {
            $('#passwordFeedback').text('Password must be at least 8 characters').css('color', 'red');
            window.passwordValid = false;
        } else {
            $('#passwordFeedback').text('Password length is valid').css('color', 'green');
            window.passwordValid = true;
        }
        updateRegisterButton();
    });
});